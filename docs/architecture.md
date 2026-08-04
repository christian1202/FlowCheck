# FlowCheck — System Architecture

## 1. System Overview

FlowCheck is a zero-configuration, web-based event attendance and pre-registration system. Any public user can pre-register for open events without creating an account. Non-technical administrative staff can create events, manage teams, generate registration links, and scan attendee QR codes at the door using any smartphone or camera.

The architecture is serverless and edge-native, built with Next.js 16 (App Router) deployed via `@opennextjs/cloudflare` to Cloudflare Workers/Pages, Supabase for PostgreSQL database storage and Google OAuth authentication for event administrators, and client-side on-screen QR ticket generation with Web Audio API sound feedback for door staff.

All event metrics, registrations, attendee check-ins, and scan logs are stored in PostgreSQL with real-time analytics in the admin dashboard and CSV export capabilities.

## 2. Architecture Diagram

```mermaid
graph TB
    subgraph "Client Layer"
        A["Admin Browser / Scanner PWA<br/>(Dashboard & QR Scanner)"]
        B["Public Visitor / Attendee<br/>(Pre-Registration Form & Ticket View)"]
    end

    subgraph "Edge & Routing Layer (Cloudflare)"
        C["Cloudflare Edge Network<br/>DDoS Protection + WAF"]
        G["Next.js Middleware<br/>Public Route Bypass & Auth Guard"]
    end

    subgraph "Application Layer (Cloudflare Workers / OpenNext)"
        D["Server Components<br/>Dashboard · Events · Attendees · Scanner"]
        E["Server Actions<br/>Registration · Scanning · Event Admin · Hover Warm-up"]
        H["Data Access Layer (DAL)<br/>Validation · Logic · Transactions"]
        K["KV-Backed Caches<br/>Incremental Cache (ISR + unstable_cache)<br/>Tag Cache (revalidateTag)"]
    end

    subgraph "Data Layer (Supabase)"
        I["PostgreSQL Database<br/>Admins · Events · Attendees · Scan Logs"]
    end

    A -->|Authenticated HTTPS /events · /attendees · /scanner| C
    B -->|Public HTTPS /events/:slug/register| C
    C --> G
    G -->|Exempt Public Reg| D
    G -->|Session Check| D
    D --> E
    E --> H
    H --> I
    D <--> K
```

## 3. Tech Stack

| Layer | Technology | Version | Rationale / Usage |
|---|---|---|---|
| Framework | Next.js (App Router) | `16.2.x` (16.2.12 installed) | Industry standard, serverless & edge runtime ready via OpenNext. |
| Core Library | React | `19.2.4` | Modern UI rendering and server components. |
| Language | TypeScript | `^5.0.0` (Strict) | End-to-end type safety. |
| Styling | Tailwind CSS | `^4.0.0` | Utility-first styling with PostCSS. |
| Database | Supabase (PostgreSQL) | PostgreSQL 15+ | Relational data, connection pooling (Supavisor) + Hyperdrive. |
| ORM | Drizzle ORM | `^0.45.2` | Ultra-lightweight, edge-compatible SQL builder. |
| Auth | Supabase Auth (`@supabase/ssr`) | `^0.12.0` | Google OAuth and session management for Admins. |
| Deployment | Cloudflare Workers | OpenNext `^1.20.1` | Edge deployment; `@opennextjs/cloudflare` with KV-backed caching. |
| Caching | Cloudflare Workers KV | — | `NEXT_INC_CACHE_KV` (incremental/data cache) + `NEXT_TAG_CACHE_KV` (tag cache) bindings. |
| QR Generation | `qrcode` | `^1.5.4` | Pure JavaScript QR canvas/PNG generation. |
| QR Scanner | `html5-qrcode` | `^2.3.8` | Webcam QR scanning in mobile/desktop browser. |
| Sound System | Web Audio API | Native Browser | Zero external MP3 files; synthesizes clean audio chimes. |
| PWA Support | Serwist (`@serwist/next`) | `^9.5.11` | Progressive Web App manifest and service worker. |
| Virtualization | `@tanstack/react-virtual` | `^3.14.6` | Windowed rendering of the events grid. |

## 4. Key Architectural Decisions (ADRs)

- **ADR-1: Public Pre-Registration Bypass.** Any visitor can pre-register for an open event without creating a FlowCheck account. The middleware explicitly permits access to `/events/[slug]/register` while protecting all admin routes.
- **ADR-2: Web Audio API over Audio Files.** Sound feedback in the QR Scanner is generated on-the-fly using browser `AudioContext` oscillators. This avoids network request delays, missing asset errors, or MIME-type loading issues across mobile devices.
- **ADR-3: OpenNext Cloudflare Deployment.** Uses `@opennextjs/cloudflare` to build Next.js 16 into a Cloudflare Worker bundle, eliminating cold starts and hosting cost.
- **ADR-4: On-Screen Immediate QR Ticket.** Attendees receive an immediate scan token upon registration, rendering their ticket QR code right on the web page with immediate download capability, alongside email lookup verification.
- **ADR-5: Drizzle ORM over Prisma.** Drizzle compiles directly to lightweight SQL queries without native binaries, making it optimal for serverless and edge environments.
- **ADR-6: KV-Backed Incremental + Tag Cache.** `open-next.config.ts` wires the Cloudflare KV incremental cache (`cf-kv-incremental-cache`) and KV tag cache (`kv-next-mode-tag-cache`) as LazyLoadedOverrides. This makes `unstable_cache()` and `revalidateTag()` actually persist across requests on Cloudflare — the previous `"dummy"` cache recomputed every query per request and made revalidation a no-op. All cache keys embed the build ID, so old-build entries are unreachable after a deploy (no stale server-action IDs).
- **ADR-7: Hover-Triggered Data Prefetch.** A client `PrefetchLink`/`useHoverPrefetch` pair prefetches the target route (`router.prefetch(..., { kind: 'full' })`) and fires a warm-up server action on first hover/focus/pointer-down. The warm action runs the target page's exact data queries into `unstable_cache`, so the subsequent navigation renders from warm caches.
- **ADR-8: ISR for the Public Register Page.** `/events/[slug]/register` is `force-static` + `revalidate = 60` — each event path renders on first request and is then served as edge-cached HTML (30s effective TTL from the data cache). Publish/update/delete invalidate it immediately via `revalidateTag('slug-…')`.

## 5. Caching & Performance Architecture

Three complementary layers (see `performance.md` for the full story):

1. **Route-level prefetch (client):** every dashboard link is a `PrefetchLink` — hover/focus/pointer-down triggers a full RSC prefetch plus a warm-up server action (`src/actions/prefetch.ts`).
2. **Data cache (server):** page-facing DAL functions (`getEventById`, `getEventsPaginated`, `getAttendeesPaginated`, `getRecentDashboardEvents`, `getEventTeam`, `getUniqueEventsForAdmin`, `getDashboardStats`, `getAttendeesStats`, `getEventBySlug`) are wrapped in `unstable_cache` with tenant-scoped keys (`adminId`/`eventId` in every key) and `revalidate: 30–60`. Mutations invalidate via `revalidateTag('admin-…')` / `revalidateTag('event-…')` / `revalidateTag('slug-…')`.
3. **Edge HTML (ISR):** the public register page is ISR-cached per event path; admin pages remain dynamic (Suspense + skeletons).

Cache invalidation contract: tags are `admin-${adminId}`, `event-${eventId}`, `slug-${slug}`, plus per-cache tags. Every mutation point (create/update/publish/delete event, team add/remove, scan, registration) revalidates the matching tags with `revalidateTag(tag, 'seconds')`.

## 6. Project Structure

```text
FlowCheck/
├── public/                    # Static public assets
│   └── images/                # Brand assets (flowchecklogo-final-bg-white-big.png)
├── src/
│   ├── app/
│   │   ├── (dashboard)/       # Authenticated routes (Events, Attendees, Scanner)
│   │   │   ├── attendees/
│   │   │   ├── events/
│   │   │   │   └── [id]/      # edit · settings · scanner
│   │   │   └── scanner/
│   │   ├── (public)/          # Unauthenticated public routes
│   │   │   ├── events/[id]/register/
│   │   │   └── login/
│   │   ├── api/               # Hono register endpoint, cron, health, export
│   │   ├── globals.css        # Global styles & Tailwind
│   │   ├── layout.tsx         # Root layout (static)
│   │   └── middleware.ts      # Authentication & route guards (proxy convention)
│   ├── actions/               # Next.js Server Actions (incl. prefetch.ts warm-ups)
│   ├── components/            # UI Components
│   │   ├── attendees/         # Attendee dashboard & table view
│   │   ├── events/            # Event creation, team & link sharing
│   │   ├── layout/            # SidebarNav, DashboardShell, SystemInfoModal
│   │   ├── scanner/           # QRScanner with Web Audio feedback
│   │   └── ui/                # PrefetchLink, skeletons, LocalTimeDisplay
│   ├── data/                  # Server-side Data Access Layer (DAL)
│   ├── hooks/                 # useHoverPrefetch, useDebounce, useDevicePower
│   └── lib/                   # db (Drizzle schema), auth, validators, queue
├── docs/                      # Technical documentation
├── open-next.config.ts        # OpenNext adapter config (KV caches)
├── wrangler.toml              # Worker config — GITIGNORED (local DB creds inside)
└── package.json
```

## 7. Environment Variables

```bash
# Database (Supabase / PostgreSQL)
DATABASE_URL=                          # Supavisor pooled connection (port 6543)
DIRECT_DATABASE_URL=                   # Direct Postgres connection (port 5432)
NEXT_PUBLIC_SUPABASE_URL=              # Supabase Project URL
NEXT_PUBLIC_SUPABASE_ANON_KEY=         # Supabase Anon Key
SUPABASE_SERVICE_ROLE_KEY=             # Server-only Service Role Key

# App Configuration
NEXT_PUBLIC_APP_URL=https://flowcheck.flowcheck.workers.dev

# Operations
CRON_SECRET=                           # Guards /api/cron/sync-sheets
BREVO_API_KEY=                         # Email provider key
```

All secrets are stored as Worker secrets (`wrangler secret put …`); none are in `wrangler.toml` (see `deployment.md`).
