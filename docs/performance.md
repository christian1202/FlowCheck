# CONTEXT PROMPT: FlowCheck Performance & Architectural Refactor

> **Purpose of this document:** This is an engineered context prompt meant to be handed directly to a coding agent (Claude Code, Cursor, etc.) or a human engineer executing the refactor. It expands the original task brief with explicit file targets, acceptance criteria, code patterns, sequencing, and verification steps so the work can be executed and validated without additional clarification.

---

## Execution Status (updated 2026-08)

| Phase | Status | Notes |
|---|---|---|
| Phase 1 — Streaming & TTFB | ✅ Done | `loading.tsx` + nested `<Suspense>` boundaries on every dashboard route (events, events/all, attendees, scanner, settings) |
| Phase 2 — Remount fix | ✅ Done | Root layout is static; `DashboardShell` (client) persists across navigations; no manifest/logo re-fetch loop remains |
| Phase 3 — Client isolation & bundles | ✅ Done | `images.unoptimized: true`, `poweredByHeader: false`, `next/dynamic` for QR scanner/system modal, React Compiler enabled |
| Phase 4 — Auth staticization | ✅ Done | Route protection lives in `src/middleware.ts` (Supabase SSR); dashboard pages intentionally stay dynamic via `await connection()` |
| Phase 5 — DB query optimization | ✅ Done | Explicit column projections, `cache()`/`unstable_cache` dedupe, GIN expression indexes in schema (`idx_event_search`, `idx_attendee_search`, composite indexes) |
| Phase 6 — Client rendering | ✅ Done | `@tanstack/react-virtual` events grid, debounced search (`useDebounce` + `useTransition`), memoized rows, lazy modals |
| Phase 7 — (new) Persistent caching | ✅ Done | KV incremental + tag cache on Cloudflare; see `architecture.md` ADR-6 |
| Phase 8 — (new) Hover prefetch | ✅ Done | `PrefetchLink`/`useHoverPrefetch` + warm-up server actions; see `architecture.md` ADR-7 |
| Phase 9 — (new) ISR register page | ✅ Done | `force-static` + `revalidate = 60` on `/events/[slug]/register`; see `architecture.md` ADR-8 |

**Key follow-ups still open:** Cloudflare WAF rate-limit rule for `POST /events/*/register` (deployment config), and re-verifying the 2.5s attendees query is gone with `EXPLAIN ANALYZE` on realistic data volume.

---

## 0. ROLE & OPERATING MODE

You are acting as a **senior Next.js performance engineer** doing a production refactor on a live app called **FlowCheck**, deployed on **Cloudflare** (Workers/Pages, free-tier CPU limits) with **Supabase PostgreSQL** as the database and **Drizzle ORM** as the query layer.

Operating rules for this session:
- Work **phase by phase**, in the order given below. Do not skip ahead — later phases assume earlier ones are in place (e.g., Phase 5's `cache()` wrapping is consumed by Phase 1's streaming boundaries).
- Before editing any file, **read it in full** and state the specific problem you found in it (don't guess from the filename).
- After each phase, produce a **short diff summary** (files touched, what changed, why) and a **verification step** (what to check, what output confirms success) before moving to the next phase.
- Do not introduce new dependencies without flagging them — the whole point of Phase 3 is to *reduce* the dependency footprint.
- Treat `unoptimized: true` for `next/image` as a fixed constraint (Cloudflare free-tier has no image optimization CPU budget) — do not try to re-enable image optimization.
- If a requirement conflicts with something you find in the codebase (e.g., auth logic that can't cleanly move to middleware because it depends on a DB call), stop and flag the conflict with options rather than silently picking one.

---

## 1. PROBLEM STATEMENT (baseline before refactor)

| Symptom | Metric / Evidence | Suspected Root Cause |
|---|---|---|
| Attendees page is slow | 2.53s server-side delay on the `attendees` RSC payload | Unoptimized Drizzle query (likely `SELECT *`, missing indexes, no dedupe on repeated org lookups) |
| UI feels "janky" on navigation | Duplicate network requests for `manifest.webmanifest` and logo assets on every view switch | Root layout (or a layout in the tree) is unmounting/remounting instead of persisting across navigations |
| Poor TTFB / FCP | Lighthouse/Web Vitals show blocking server render | Data fetches are awaited directly in page/layout components instead of being streamed via Suspense |

**Definition of done:** attendees route P95 server response time < 300ms (target < 100ms for the DB query itself), zero duplicate manifest/logo requests on client-side navigation, and Lighthouse FCP/TTFB in the "green" range on a throttled 4G profile.

---

## 2. PHASE 1 — Streaming & TTFB Optimization (`loading.tsx` + Suspense)

**Rule:** No server-side data request may block the initial HTML response for a route segment.

### Implementation steps
1. **Inventory** every `page.tsx` / `layout.tsx` under `app/` that performs an `await` on a DB call, external API, or anything network-bound directly in the component body. List them explicitly before touching code.
2. For each route segment identified (start with `app/(dashboard)/attendees/`):
   - Add a sibling `loading.tsx` in the **same segment folder** as the slow `page.tsx`. Naming and placement must be exact — Next.js only auto-wraps the segment in `<Suspense>` if `loading.tsx` lives at that segment level.
   - The `loading.tsx` should render a **skeleton that matches the real layout's dimensions** (same grid/columns/row height as the eventual attendees table) to avoid layout shift when the real content swaps in.
3. Where a single page has **multiple independently-slow data sources** (e.g., attendees list + org stats widget), don't rely solely on route-level `loading.tsx`. Instead, decompose into separate async Server Components and wrap each with an explicit `<Suspense fallback={...}>` boundary in the parent, so fast pieces render immediately and slow pieces stream in independently:
   ```tsx
   // app/(dashboard)/attendees/page.tsx
   import { Suspense } from "react";

   export default function AttendeesPage() {
     return (
       <div className="grid gap-4">
         <Suspense fallback={<StatsSkeleton />}>
           <OrgStats /> {/* fast */}
         </Suspense>
         <Suspense fallback={<TableSkeleton />}>
           <AttendeesTable /> {/* slow — this is the 2.5s offender */}
         </Suspense>
       </div>
     );
   }
   ```
4. Confirm the data-fetching functions used inside these async Server Components are the **same `cache()`-wrapped functions** built in Phase 5 (don't fetch org data twice — once in `OrgStats`, once in `AttendeesTable` — without dedupe).
5. Do **not** add `"use client"` to any of these — streaming via `loading.tsx`/`Suspense` is a Server Component feature; client components would defeat the purpose.

6. **Granular/nested Suspense for the attendees list specifically:** since attendees will also be paginated and virtualized (see Phase 6), wrap the table body separately from the surrounding filter/toolbar UI, so pagination transitions only re-suspend the row data, not the whole page chrome:
   ```tsx
   // AttendeesTable.tsx
   export function AttendeesTable({ page }: { page: number }) {
     return (
       <div>
         <AttendeesToolbar /> {/* never re-suspends */}
         <Suspense key={page} fallback={<RowsSkeleton />}>
           <AttendeesRows page={page} /> {/* re-suspends per page change */}
         </Suspense>
       </div>
     );
   }
   ```
   Keying the inner `<Suspense>` on `page` is what forces a clean skeleton-to-content swap per page instead of showing stale rows while new ones load.

### Verification
- With DB query artificially slowed (or before Phase 5 lands), confirm the skeleton renders instantly (`TTFB` in devtools should be near-instant) and the real content swaps in only when data resolves — visible as a distinct paint in the Network/Performance tab.
- Run `next build` and confirm the route segment is marked as using streaming (check the build output route type, or confirm no "Dynamic server usage" warnings that indicate a blocking fetch escaped Suspense).

---

## 3. PHASE 2 — Resolve Component Remount Spam

**Rule:** The root layout must persist across all client-side navigations. If `manifest.webmanifest` or the logo asset re-fetch on navigation, something above the navigation boundary is unmounting.

### Implementation steps
1. **Audit `app/layout.tsx`** (and any nested layout that wraps multiple routes, e.g. `app/(dashboard)/layout.tsx`):
   - Check for any `key={...}` prop derived from a route-changing value (e.g., `key={pathname}`) on a wrapping element — this is the #1 cause of forced remounts in App Router.
   - Check whether the layout itself is conditionally rendered based on `usePathname()` or similar client-side route state in a way that could cause React to treat it as a different component identity between routes.
   - Check whether `<link rel="manifest">` and the logo `<Image>`/`<img>` tag live inside `app/layout.tsx`'s persistent `<head>`/metadata export (via `export const metadata` or `generateMetadata`) rather than being re-declared in child layouts/pages. If any child route also declares its own manifest link or logo tag, remove the duplicate — only the root should own these.
2. **Identify volatile state** currently living in the root/shared layout — commonly: active view/tab state, open modal state, sidebar collapse state, or any `useState`/`useEffect` tied to the current route. Move this state **down** into a dedicated client component that lives inside the page/segment, not the layout:
   ```tsx
   // BEFORE (in app/(dashboard)/layout.tsx) — causes remount coupling
   "use client";
   export default function DashboardLayout({ children }) {
     const [activeModal, setActiveModal] = useState(null);
     return <>{children}</>; // layout re-renders/remounts with every modal/view change
   }

   // AFTER — layout stays a stable Server Component
   // app/(dashboard)/layout.tsx
   export default function DashboardLayout({ children }) {
     return <>{children}</>;
   }
   // app/(dashboard)/attendees/attendees-view.tsx ("use client")
   export function AttendeesView() {
     const [activeModal, setActiveModal] = useState(null);
     // modal/view logic isolated here, layout never touched
   }
   ```
3. Confirm navigation between views uses `<Link>` / `router.push` (client-side transitions) rather than full page reloads (`<a href>` or `window.location`) — a hard navigation will always re-fetch layout assets regardless of the above fixes, so rule this out explicitly.
4. If the manifest/logo requests are firing due to the **browser** re-validating `<link rel="manifest">` on each soft navigation (some browsers do this if the tag's DOM node is recreated), confirm via the Network tab's "Initiator" column whether the request is coming from a DOM re-parse vs. an actual JS-triggered fetch — this tells you whether the fix is in metadata placement (step 1) or state placement (step 2).

### Verification
- With DevTools Network panel open and "Disable cache" on, click through 3–4 different views/tabs in the app. `manifest.webmanifest` and the logo asset should appear **once**, on initial load only.
- Use React DevTools Profiler to confirm the root layout component does not appear in the render/commit list when switching views.

---

## 4. PHASE 3 — Client Isolation & Bundle Reduction

**Rule:** Default to Server Components. Every `"use client"` directive must be justified by an actual client-only need (state, effects, browser APIs, event listeners, third-party client-only libs).

### Implementation steps
1. **Audit pass:** grep for `"use client"` across `app/` and `components/`. For each hit, classify:
   - **Keep as client:** genuinely uses `useState`, `useEffect`, `useRef`, `onClick`/`onChange` etc., or a client-only library (e.g., a chart lib, form lib with client validation).
   - **Demote to Server Component:** purely presentational, receives props and renders markup/formats data, no interactivity.
   - **Split:** a component that's 90% static markup with one small interactive part (e.g., a table with one "delete" button) — extract the interactive part into its own small client component and keep the parent as a Server Component passing it as a child/slot.
2. **Image optimization:**
   - Replace all `<img>` tags with `next/image`'s `<Image>` component, providing explicit `width`/`height` (or `fill` with a sized container) to eliminate CLS.
   - In `next.config.ts`, set:
     ```ts
     const nextConfig = {
       images: {
         unoptimized: true, // Cloudflare free-tier has no image-optimization CPU budget
       },
     };
     ```
   - Confirm this doesn't silently break remote image domains — since optimization is off, no `remotePatterns` config is needed for rendering, but keep it if you still want Next's dev-time warnings for unconfigured hosts.
3. **Dependency audit (`package.json`):**
   - Search for heavy utility libraries and identify native replacements:
     | Library | Common usage | Native replacement |
     |---|---|---|
     | `date-fns` / `moment` / `dayjs` (if only doing basic formatting) | date formatting | `Intl.DateTimeFormat`, `Date` methods |
     | `lodash` (`cloneDeep`, `merge`, `isEqual` etc.) | deep clone/compare | `structuredClone()`, manual equality, spread |
     | `uuid` (if only need random IDs) | ID generation | `crypto.randomUUID()` |
     | `classnames` / `clsx` (keep if used pervasively — cheap) | conditional classes | template literals for trivial cases |
   - Only replace where the native API covers the actual usage — don't force it if the library is doing something native APIs genuinely don't cover (e.g., real timezone-aware date arithmetic may still warrant a lightweight lib).
   - Run a bundle analysis (`next build` with `@next/bundle-analyzer` or check `.next/analyze` output) before/after to quantify the reduction, and report the delta.

### Verification
- `next build` output: compare First Load JS per route before/after — target a measurable drop on the attendees and dashboard routes.
- Confirm no runtime errors from removed libraries (especially deep-clone/merge replacements — `structuredClone` does not clone functions or handle circular refs identically to lodash in all cases; check actual usage before swapping).

---

## 5. PHASE 4 — Authentication & Layout Staticization

**Rule:** Auth checks must not force otherwise-static layouts into dynamic rendering.

### Implementation steps
1. **Move route protection to `middleware.ts`:**
   - Consolidate any per-layout `await getSession()` / auth-guard checks that currently live in `layout.tsx` files into a single `middleware.ts` at the project root (or scoped via `matcher` config).
   - Example shape:
     ```ts
     // middleware.ts
     import { NextResponse } from "next/server";
     import type { NextRequest } from "next/server";

     export const config = {
       matcher: ["/(dashboard)/:path*", "/attendees/:path*"],
     };

     export async function middleware(req: NextRequest) {
       const session = await getSessionFromCookie(req); // lightweight, no full DB round-trip if possible (e.g., verify JWT signature only)
       if (!session) {
         return NextResponse.redirect(new URL("/login", req.url));
       }
       return NextResponse.next();
     }
     ```
   - Keep the middleware check **cheap** (e.g., JWT signature verification) — avoid a full DB lookup here, or you've just moved the bottleneck rather than removed it.
2. **Client-side session data for UI (avatar, user name, etc.):**
   - Remove any `await getServerSession()`-type call from the shared/root layout that exists purely to render a user avatar or name.
   - Create an isolated client component (e.g., `<UserMenu />`) that fetches session data client-side (via a small `/api/session` route, a client SDK call, or a React Query/SWR hook), and render it as a child inside the static layout shell:
     ```tsx
     // app/layout.tsx — stays static, no session fetch
     export default function RootLayout({ children }) {
       return (
         <html>
           <body>
             <Header>
               <UserMenu /> {/* client component, fetches its own session data */}
             </Header>
             {children}
           </body>
         </html>
       );
     }
     ```
   - This lets the shell (nav, manifest, logo, static chrome) be served statically/at the edge while only the small `UserMenu` subtree is dynamic.
3. Confirm with `next build` that the root layout's route segment is no longer marked dynamic (look for the "○ Static" vs "λ Dynamic" indicator in the build output route table) after auth is removed from it.

### Verification
- `next build` route table shows the shell/layout routes as static where previously dynamic.
- Manually test: expired/invalid session should redirect at the middleware/edge level before any page-level code runs (check via Network tab — redirect should happen on the document request, not after a page flash).

---

## 6. PHASE 5 — Database Query Optimization (the 2.5s bottleneck)

**Rule:** DB operations must execute in under 100ms. This is the highest-impact phase — do it with query profiling, not guesswork.

### Implementation steps
1. **Profile first.** Before changing anything, get the actual `EXPLAIN ANALYZE` output for the current attendees query from Supabase (via the SQL editor or `psql`). Paste/record the plan — you need this to confirm the fix actually worked, and to know whether the bottleneck is a missing index, a bad join, or over-fetching.
2. **Targeted column selection:** Replace `SELECT *` (or Drizzle's default `db.select().from(table)` with implicit all-columns) with an explicit column list matching only what the UI actually renders:
   ```ts
   // BEFORE
   const attendees = await db.select().from(attendeesTable).where(eq(attendeesTable.orgId, orgId));

   // AFTER
   const attendees = await db
     .select({
       id: attendeesTable.id,
       name: attendeesTable.name,
       status: attendeesTable.status,
       checkedInAt: attendeesTable.checkedInAt,
     })
     .from(attendeesTable)
     .where(eq(attendeesTable.orgId, orgId))
     .orderBy(desc(attendeesTable.checkedInAt))
     .limit(PAGE_SIZE)
     .offset(offset);
   ```
   - If the attendees list is unbounded (no `limit`/pagination), that alone can explain multi-second responses at scale — add pagination if it's missing.
3. **Wrap shared lookups in React `cache()`:** any data-fetching function called from more than one Server Component in the same render pass (e.g., "get current org") must be wrapped so React dedupes the DB call within a single request:
   ```ts
   import { cache } from "react";

   export const getOrg = cache(async (orgId: string) => {
     return db
       .select({ id: orgTable.id, name: orgTable.name, plan: orgTable.plan })
       .from(orgTable)
       .where(eq(orgTable.id, orgId))
       .then((rows) => rows[0]);
   });
   ```
   - Note: `cache()` dedupes **within a single render**, not across requests — don't mistake it for a persistent cache. If cross-request caching is also desired, that's a separate concern (e.g., Next's `unstable_cache` or a Redis layer) and should be flagged as an optional follow-up, not conflated with this fix.
4. **Indexing:** based on the `EXPLAIN ANALYZE` output and the query's `WHERE`/`ORDER BY` clauses, add indexes in the Drizzle schema (and generate/apply the migration):
   ```ts
   // schema.ts
   export const attendeesTable = pgTable(
     "attendees",
     {
       id: uuid("id").primaryKey().defaultRandom(),
       orgId: uuid("org_id").notNull(),
       status: text("status").notNull(),
       checkedInAt: timestamp("checked_in_at"),
       // ...
     },
     (table) => ({
       orgIdIdx: index("attendees_org_id_idx").on(table.orgId),
       orgCheckedInIdx: index("attendees_org_checked_in_idx").on(table.orgId, table.checkedInAt),
     })
   );
   ```
   - A composite index on `(orgId, checkedInAt)` typically serves both the filter and the sort in one index scan — prefer this over two single-column indexes if the query always filters by org and sorts by check-in time together.
   - Generate the migration with Drizzle Kit and apply it against Supabase; do not hand-edit the DB schema outside migrations.
5. Re-run `EXPLAIN ANALYZE` after the changes and confirm the plan switches from a sequential scan to an index scan, and record the new timing.

### Verification
- `EXPLAIN ANALYZE` before/after comparison, attached to the diff summary for this phase.
- End-to-end: attendees route server response time measured via `next build && next start` (production mode, not dev) under realistic data volume — target < 300ms total, < 100ms DB portion.

---

## 7. PHASE 6 — Client-Side Rendering Performance Techniques

**Rule:** Once the data layer and streaming are fixed (Phases 5 + 1), the remaining perceived-perf gains come from how the client renders and reacts to interaction on the attendees list and dashboard. Apply the following selectively — each one is scoped to where it actually pays off, not applied blanket-wide.

### 6.1 List Virtualization / Windowing — **apply**
The attendees list is the highest-risk spot for large-DOM slowdown once pagination limits are removed or org size grows. Use a windowing library (e.g., `@tanstack/react-virtual` or `react-window`) inside the **client** row-rendering component only — the Server Component still fetches a bounded page (see Phase 5 `limit`/`offset`); virtualization is for smoothly rendering that page's rows, not a substitute for server-side pagination.
```tsx
"use client";
import { useVirtualizer } from "@tanstack/react-virtual";

export function AttendeesRows({ attendees }: { attendees: Attendee[] }) {
  const parentRef = useRef<HTMLDivElement>(null);
  const rowVirtualizer = useVirtualizer({
    count: attendees.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 48,
  });
  return (
    <div ref={parentRef} style={{ height: 600, overflow: "auto" }}>
      <div style={{ height: rowVirtualizer.getTotalSize(), position: "relative" }}>
        {rowVirtualizer.getVirtualItems().map((vRow) => (
          <AttendeeRow key={attendees[vRow.index].id} attendee={attendees[vRow.index]} style={{ transform: `translateY(${vRow.start}px)` }} />
        ))}
      </div>
    </div>
  );
}
```
Only virtualize lists that can realistically exceed ~100 rows in a single page; don't add this to short, bounded lists (e.g., a 5-item dropdown) — the overhead isn't worth it there.

### 6.2 Lazy Loading (`next/dynamic`) — **apply**
Any client component that isn't needed for the initial paint — modals, drawers, a bulk-import dialog, a chart library — should be loaded on demand:
```tsx
const BulkImportModal = dynamic(() => import("./bulk-import-modal"), {
  ssr: false,
  loading: () => null, // modal is hidden until opened, no skeleton needed
});
```
This directly supports Phase 3's bundle-reduction goal — it's the mechanism, not a separate concern.

### 6.3 Memoization — **apply, selectively**
- Use `React.memo` on row components in the virtualized list so a parent re-render (e.g., toolbar filter state change) doesn't force every row to re-render.
- Use `useMemo` for genuinely expensive derived values computed from the attendee list (e.g., grouping/sorting/aggregating client-side) — not for trivial formatting, which costs more to memoize than to just recompute.
- Don't wrap every component in `memo()` reflexively — it adds comparison overhead and is a net loss for cheap components. Apply it where a profiler run (React DevTools Profiler) actually shows wasted re-renders.

### 6.4 Throttling / Debouncing Events — **apply**
The attendees search/filter input is the clear target:
```tsx
"use client";
import { useDeferredValue, useState } from "react";

export function AttendeesSearch() {
  const [query, setQuery] = useState("");
  const deferredQuery = useDeferredValue(query); // see 6.8 — pairs with useTransition-style patterns
  // debounce the actual server request (via a small custom hook or a lib) so keystrokes
  // don't each trigger a fetch — fire only after ~250-300ms of no typing
  return <input value={query} onChange={(e) => setQuery(e.target.value)} />;
}
```
Also apply debouncing to any scroll-based logic (e.g., infinite scroll trigger) and throttling to any resize/scroll listeners used for layout calculations.

### 6.5 Code-Splitting — **apply (this is Phase 3's mechanism, called out explicitly here)**
Beyond `next/dynamic` for components (6.2), ensure route-level code stays split by Next's default per-route chunking — i.e., don't import heavy dashboard-only utilities from a shared module that's also imported by the lightweight login/marketing routes, which would leak that weight into unrelated bundles. Audit shared `lib/` or `utils/` barrel files for this kind of accidental cross-contamination.

### 6.6 React Fragments — **apply, low-effort/low-risk**
Where components currently wrap children in an unnecessary `<div>` purely to satisfy JSX's single-root-element rule, replace with `<>...</>` (or `<Fragment key={...}>` when a key is needed in a list). This has minor impact on its own (avoids extra DOM nodes affecting layout/CSS selectors and marginally reduces reconciliation work) — treat it as a cheap cleanup during the Phase 3 component audit, not a dedicated effort.

### 6.7 Web Workers — **conditional, do not apply by default**
Only relevant if there's real client-side heavy lifting on large datasets — e.g., client-side CSV/export generation, or client-side aggregation across a large attendee set that isn't already done server-side. If such a case exists:
```ts
// attendees-export.worker.ts
self.onmessage = (e) => {
  const csv = generateCsv(e.data.attendees); // heavy work off the main thread
  self.postMessage(csv);
};
```
Flag any candidate spot for this rather than pre-emptively adding a worker — most of FlowCheck's heavy lifting should already be pushed to the DB/server per Phase 5, which makes a worker unnecessary in most cases here.

### 6.8 `useTransition` — **apply**
Use for state updates that change what's rendered but shouldn't block input responsiveness — most relevantly, **view/tab switching** (the same interaction that was causing remounts in Phase 2) and pagination:
```tsx
"use client";
import { useTransition } from "react";

export function ViewSwitcher() {
  const [isPending, startTransition] = useTransition();
  const [view, setView] = useState<"list" | "grid">("list");

  function handleSwitch(next: "list" | "grid") {
    startTransition(() => setView(next));
  }

  return (
    <div aria-busy={isPending}>
      {/* buttons call handleSwitch; UI stays responsive while the new view's
          content (potentially re-suspending Server Component data) resolves */}
    </div>
  );
}
```
This complements Phase 2's fix (state isolated out of the layout) by making the *transition itself* non-blocking, and complements Phase 1 by keeping the UI interactive while a newly-selected Suspense boundary resolves.

### Verification for Phase 6
- Profile the attendees list with React DevTools Profiler before/after virtualization — confirm rendered DOM node count stays roughly constant regardless of total row count.
- Confirm search input typing doesn't trigger a network request per keystroke (Network tab, throttled).
- Confirm bundle analyzer shows modals/dialogs as separate chunks, not part of the main route bundle.
- Confirm view-switch clicks remain responsive (no input lag) even while new data is loading, via a manual interaction test with DevTools CPU throttling enabled.

---

## 8. EXECUTION SEQUENCE & DEPENDENCIES

Recommended order (matches phase numbering, with the reasoning for the order):

1. **Phase 5** (DB query optimization) — do this *conceptually* first even though it's listed last in the original brief, because Phase 1's Suspense boundaries and `cache()` usage are meaningless if the underlying query is still slow. In practice: implement Phase 5's query + index + `cache()` changes, then wire them into the Suspense boundaries from Phase 1.
2. **Phase 1** (streaming) — now that the data layer is fast and dedupe'd, wrap it in `loading.tsx`/`Suspense`.
3. **Phase 4** (auth/middleware) — decouple auth from layouts so the shell can be static.
4. **Phase 2** (remount fix) — with auth and state pulled out of the layout, confirm no remount triggers remain.
5. **Phase 3** (bundle reduction) — do this as a cleanup pass across the now-stable component tree, since reclassifying `"use client"` boundaries is easiest once the architecture has settled.
6. **Phase 6** (client-side rendering techniques) — apply last, on top of the now-stable, now-fast, now-properly-bounded (Server Component) tree. Virtualization and memoization in particular only make sense once you know the final shape of the client components from Phases 2–3.

## 9. FINAL VERIFICATION CHECKLIST

- [ ] Attendees route: server response time < 300ms (production build, realistic data volume)
- [ ] `EXPLAIN ANALYZE` on attendees query shows index scan, not sequential scan
- [ ] `loading.tsx` present and correctly scoped for all previously-blocking routes
- [ ] Zero duplicate `manifest.webmanifest`/logo requests across 5+ client-side navigations
- [ ] Root layout does not appear in React DevTools Profiler commits during navigation
- [ ] Root/shell layout shows as static (not dynamic) in `next build` output
- [ ] `package.json` diff shows net reduction in heavy dependencies; bundle analyzer shows reduced First Load JS
- [ ] No `"use client"` directive remains without a justifiable interactive/browser-API reason
- [ ] Lighthouse (throttled 4G) shows green TTFB and FCP on attendees and dashboard routes
- [ ] Attendees list is virtualized and DOM node count stays flat regardless of row count
- [ ] Search/filter input is debounced; no per-keystroke network requests
- [ ] Modals/dialogs load as separate chunks via `next/dynamic`, not in the main bundle
- [ ] View/tab switching uses `useTransition` and stays responsive under CPU throttling

## 10. OUTPUT FORMAT EXPECTED FROM THE AGENT

For each phase, respond with:
1. **Findings** — what was actually wrong in the code (cite file + line references).
2. **Changes** — the diff or new/modified file contents.
3. **Verification** — the specific check performed and its result (numbers, not vibes — e.g., "attendees route: 2.53s → 187ms").
4. **Open questions / flags** — anything that couldn't be resolved cleanly or needs a product decision (e.g., pagination UX, whether cross-request caching is in scope).