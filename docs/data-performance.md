# CONTEXT PROMPT: Data Access Layer — Security & Query Optimization Refactor

> **Purpose of this document:** This is an engineered context prompt for a coding agent (Claude Code, Cursor, etc.) or a human engineer refactoring the data access layer. It consolidates five related task briefs — cross-tenant cache leaks, redundant permission queries, dynamic FTS scans, N+1 correlated subqueries, and transactional integrity on registration/check-in — into one sequenced, verifiable execution plan. This is a **security-critical** refactor: the cache-key issues described here are live cross-tenant data leaks, not just performance bugs, and should be treated with corresponding urgency and test rigor.

---

## 0. ROLE & OPERATING MODE

You are acting as a **senior backend/database engineer doing a DevSecOps-grade refactor** of the data access layer for a multi-tenant event/attendance app. The stack is **Next.js Server Components/Server Actions**, **Drizzle ORM**, and **Supabase PostgreSQL**, using Next's `unstable_cache` for cross-request caching and React's `cache()` for per-request dedupe. Tenancy is scoped by `adminId` (and further by `eventId` for some resources).

Operating rules for this session:
- **Security first.** Any task in this document labeled as a cache-key or tenant-isolation fix is a live vulnerability, not a nice-to-have. Fix and verify these before touching pure performance items in the same file.
- Before editing any file, **read it in full**, and explicitly state which lines currently cause the leak/bug you're about to fix — don't paraphrase the bug description back, locate it in the actual code.
- After each phase, produce: **(a)** a diff summary, **(b)** a verification step with a concrete pass/fail check (not "should be faster" — an actual before/after number or explicit test scenario), and **(c)** for security fixes specifically, a **proof-of-leak-closed** test case (see §1 template).
- Do not assume schema changes (e.g., the `fts_vector` generated column) already exist — generate the actual Drizzle migration for any schema change referenced in these tasks, don't just write query code that assumes a column is there.
- Treat `unstable_cache` and React `cache()` as **distinct, non-interchangeable tools**: `unstable_cache` persists across requests/users and MUST be tenant-scoped in its key; `cache()` only dedupes within a single request's render/execution and is inherently request-scoped (safe by construction, but only if request-scoped inputs like `adminId` are actually passed as arguments rather than pulled from a shared/module-level variable).
- Every `sql` raw-SQL usage that interpolates a value (FTS queries, sanitized email lookups, etc.) must use Drizzle's tagged template `sql` (parameterized) — never string-concatenate user input into raw SQL. Call this out explicitly if you see string concatenation while auditing.

---

## 1. PROBLEM STATEMENT & SEVERITY

| # | File | Issue | Class | Symptom |
|---|---|---|---|---|
| 1 | `src/data/attendees.ts` | `getAttendeesStats` cache key `['attendees-stats']` has no scope params | **Cross-tenant data leak (Critical)** | Admin A can be served Admin B's cached attendee stats |
| 2 | `src/data/attendees.ts` | `eventAdmins`/`allowedIds` permission lookup re-queried per call site | Performance | Redundant DB round-trips per request |
| 3 | `src/data/attendees.ts` | Dynamic `to_tsvector(...)` computed per-row per-query in search | Performance | Full-table scan, contributes to 2.5s query time |
| 4 | `src/data/dashboard.ts` (or equivalent) | `getDashboardStats` cache key is globally scoped, no `adminId` | **Cross-tenant data leak (Critical)** | Same class of bug as #1, different function |
| 5 | `src/data/dashboard.ts` | Possible conflicting `unstable_cache` wrapper inside `getTotalScansForAdmin` | Correctness/Performance | Nested caches with different TTLs can serve stale or conflicting data |
| 6 | `src/data/events.ts` | Correlated subqueries for counts inside `getEventsForAdmin`/`getEventsPaginated` | Performance | N+1-style execution explosion at `limit(100)` |
| 7 | `src/data/events.ts` | Dynamic `to_tsvector` in `getEventsPaginated`/`searchAdminEvents` | Performance | Full-table scan on event search |
| 8 | `src/data/attendees.ts` (`registerAttendee`) | No atomic transaction around capacity check + increment + insert | **Correctness (Critical — race condition)** | Concurrent registrations can breach event capacity |
| 9 | `src/data/attendees.ts` (`registerAttendee`) | Manual rollback `catch` logic; external queue call inside/coupled to core flow | Reliability | Phantom data risk; third-party outage can break registration |
| 10 | `src/data/attendees.ts` (`registerAttendee`, `lookupAttendee`) | `LOWER(...)` in SQL bypasses index; unsanitized email casing | Performance/Correctness | Full scan on lookup; potential duplicate attendee rows differing only by case |
| 11 | `src/data/attendees.ts` (`processScan`) | Sequential read queries inside an open transaction | Performance | Extended lock hold time under load |
| 12 | `src/data/attendees.ts` (`processScan`) | `enqueueSheetSync` called inside the transaction boundary | **Reliability (Critical — rollback cascade risk)** | A slow/failed queue call can abort an otherwise-valid DB transaction |

**Definition of done:**
- Zero cache entries are servable across tenant boundaries — proven with an explicit two-admin test, not just code review.
- `registerAttendee` cannot exceed event capacity under concurrent load — proven with a concurrency test (see Phase 5).
- `processScan` and `registerAttendee` transactions never fail due to `enqueueSheetSync` behavior.
- Attendees and events search queries hit an index (`fts_vector` + GIN index), not a sequential scan — proven via `EXPLAIN ANALYZE`.
- `getEventsForAdmin`/`getEventsPaginated` execute in a single query pass per call (no correlated subquery per row).

---

## 2. PHASE 1 — Close Cross-Tenant Cache Leaks (Critical, do first)

**Rule:** Every `unstable_cache` key array must fully and uniquely encode the authorization scope (`adminId`, and any further scoping param like `eventId`) that the cached payload is derived from. A cache key that's missing a scoping parameter present in the function's arguments is a leak by definition — this is not context-dependent, it's a mechanical check you can run against every `unstable_cache` call in the codebase.

### 2.1 `getAttendeesStats` (`src/data/attendees.ts`)
```ts
// BEFORE — leak: any admin's request can be served another admin's cached stats
export const getAttendeesStats = unstable_cache(
  async (adminId: string, eventId: string) => { /* ... */ },
  ['attendees-stats'],
  { tags: ['attendees-stats'] }
);

// AFTER
export const getAttendeesStats = unstable_cache(
  async (adminId: string, eventId: string) => { /* ... */ },
  ['attendees-stats', adminId, eventId],
  { tags: ['attendees-stats', `admin-${adminId}`, `event-${eventId}`] }
);
```
- Add `event-${eventId}` to the tags in addition to what the brief specified — this lets you invalidate all stats for a single event (e.g., on event deletion) without a full `admin-*` sweep. Flag this as an addition beyond the literal brief if you want to keep strictly to spec, but it's a near-zero-cost improvement given the key already includes `eventId`.

### 2.2 `getDashboardStats` (`src/data/dashboard.ts`)
```ts
// AFTER
export const getDashboardStats = unstable_cache(
  async (adminId: string) => { /* ... */ },
  ['dashboard-stats', adminId],
  { tags: ['dashboard-stats', `dashboard-${adminId}`] }
);
```

### 2.3 Audit for the same pattern elsewhere
Do not stop at the two functions named in the brief. Grep the codebase for every `unstable_cache(` call and check each one's key array against its function's parameter list. Any function that takes `adminId`, `eventId`, `userId`, or any other scoping identifier as a parameter but doesn't include it in the key array is the same class of bug and must be fixed in this phase.

### 2.4 Verify `getTotalScansForAdmin` doesn't nest a conflicting cache
- Open `getTotalScansForAdmin` and check whether it's independently wrapped in `unstable_cache` with its own key/TTL.
- If it is: since it's called from within `getDashboardStats`'s cached body, you now have two overlapping caches with potentially different revalidation windows — the inner cache can silently serve stale data even after the outer cache is correctly invalidated by tag. **Remove the inner `unstable_cache` wrapper** and let the outer boundary (`getDashboardStats`) be the single source of truth for caching this data. If `getTotalScansForAdmin` is also called standalone elsewhere (outside `getDashboardStats`), flag this — it may need its own correctly-scoped cache rather than none at all, which is a judgment call to surface rather than silently resolve.

### Verification (required — this is a security fix)
Write and run an explicit **cross-tenant isolation test**:
1. As Admin A, call `getAttendeesStats(adminAId, eventId)` — populate the cache.
2. As Admin B (different `adminId`, potentially even the same `eventId` if events can be shared/visible across admins, or a distinct event otherwise), call the equivalent function.
3. Assert Admin B's response reflects Admin B's own data, not Admin A's cached payload.
4. Repeat for `getDashboardStats`.
5. Additionally verify tag-based invalidation: after calling `revalidateTag(`admin-${adminAId}`)`, confirm Admin A's next call re-executes the query (cache miss) while Admin B's cache remains untouched.

Report actual pass/fail for each of these four checks — this phase is not done until all four pass.

---

## 3. PHASE 2 — Isolate & Cache Permission Lookups (`eventAdmins` / `allowedIds`)

**Rule:** Do not query the database for the same admin's permissions more than once within a single request lifecycle.

### Implementation
1. Locate every inline occurrence of the `eventAdmins` lookup (fetching `allowedIds` for a given `adminId`) across `getAttendeesStats`, `getAttendeesPaginated`, and any other function that currently duplicates this query.
2. Extract it into a standalone function:
   ```ts
   // src/data/permissions.ts (or co-located in attendees.ts if the codebase convention is single-file)
   async function fetchAllowedEventIds(adminId: string): Promise<string[]> {
     const rows = await db
       .select({ eventId: eventAdmins.eventId })
       .from(eventAdmins)
       .where(eq(eventAdmins.adminId, adminId));
     return rows.map((r) => r.eventId);
   }
   ```
3. Wrap it with React's `cache()`:
   ```ts
   import { cache } from "react";
   export const getAllowedEventIds = cache(fetchAllowedEventIds);
   ```
4. Replace every inline duplicate lookup in `getAttendeesStats` and `getAttendeesPaginated` (and any others found in step 1) with a call to `getAllowedEventIds(adminId)`.
5. **Correctness check on `cache()` scoping:** confirm `adminId` is always passed as an explicit argument to the cached function — `cache()` dedupes based on argument identity/equality within a request. If `adminId` were instead read from some ambient/module-level context inside the function body rather than passed as an argument, the dedupe would be correct by accident for a single-tenant request but is fragile; passing it explicitly as done above is the safe pattern and should be the standard applied everywhere in this codebase.
6. Do **not** wrap this function in `unstable_cache` in addition to `cache()` unless permissions genuinely need to persist across requests with an explicit invalidation strategy (e.g., revalidated whenever an `eventAdmins` row changes) — that's a larger design decision than this phase covers; flag it rather than adding it silently.

### Verification
- Add temporary query logging (or use Supabase's query log / `pg_stat_statements`) around a single request that calls both `getAttendeesStats` and `getAttendeesPaginated` for the same admin. Confirm the `eventAdmins` query fires **once**, not twice, in that request.

---

## 4. PHASE 3 — Optimize Full-Text Search (attendees + events)

**Rule:** The database must never compute `to_tsvector(...)` dynamically per-row per-query. Search must hit a pre-computed, indexed vector column.

### 4.1 Schema migration — generated FTS column
For each table that needs search (`attendees`, `events`), add a generated `fts_vector` column and a GIN index on it. Example for `events` (mirror for `attendees` against whatever text columns are actually searched — e.g., name/description):
```ts
// schema.ts
export const eventsTable = pgTable(
  "events",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    name: text("name").notNull(),
    description: text("description"),
    // ...
    ftsVector: text("fts_vector"), // Drizzle doesn't natively type tsvector; see raw SQL below
  },
  (table) => ({
    ftsIdx: index("events_fts_idx").using("gin", table.ftsVector),
  })
);
```
Since Drizzle's schema builder doesn't have first-class `tsvector` typing, generate the actual column via raw SQL in the migration rather than forcing it through the schema builder incorrectly:
```sql
-- migration
ALTER TABLE events
  ADD COLUMN fts_vector tsvector
  GENERATED ALWAYS AS (
    to_tsvector('english', coalesce(name, '') || ' ' || coalesce(description, ''))
  ) STORED;

CREATE INDEX events_fts_idx ON events USING GIN (fts_vector);
```
Mirror this for `attendees` against its searchable columns (e.g., name, email — confirm the actual searched columns by reading the current `buildConditions` search block before assuming).

### 4.2 Query-side changes
Replace the dynamic `to_tsvector` comparison with a query against the generated column:
```ts
// BEFORE (dynamic, unindexed, full scan)
sql`to_tsvector('english', ${attendeesTable.name}) @@ to_tsquery('english', ${ftsQuery})`

// AFTER (hits the GIN index)
sql`fts_vector @@ to_tsquery('english', ${ftsQuery})`
```
Apply this in:
- `attendees.ts` → `buildConditions` search block
- `events.ts` → `getEventsPaginated` and `searchAdminEvents`

### 4.3 Query sanitization for `to_tsquery`
`to_tsquery` has strict syntax (rejects malformed operator sequences) and is not injection-safe to feed raw user input into as free text — a user typing something like `foo &` will throw a Postgres syntax error, and unstructured input isn't `to_tsquery`'s intended input format at all. Since the user is typing free-text search terms, prefer `websearch_to_tsquery('english', ${rawUserInput})` over hand-building a `to_tsquery` string from user input — it accepts natural free-text search syntax and won't throw on ordinary input. If the brief's literal `to_tsquery` usage is intentional because `ftsQuery` is already a pre-sanitized/pre-tokenized string built elsewhere in the code, confirm that by reading the call site before changing the function — don't assume raw user input flows directly into this call without checking.

### Verification
- `EXPLAIN ANALYZE` on both attendees and events search queries before/after — confirm the plan shows a **Bitmap Index Scan** (or Index Scan) on the new GIN index, not a Seq Scan.
- Record before/after timing for a representative search query on realistic data volume.
- Test a search term containing special characters (`&`, `|`, `:`, unmatched quotes) to confirm it doesn't throw a Postgres syntax error post-change.

---

## 5. PHASE 4 — Eliminate N+1 Correlated Subqueries (`events.ts`)

**Rule:** The database must not execute a row-by-row subquery to compute counts for a list of events.

### Implementation
1. Locate `getEventsForAdmin` and `getEventsPaginated` in `src/data/events.ts`. Identify the correlated subquery pattern:
   ```ts
   // BEFORE — one subquery execution per row returned, explodes at limit(100)
   const events = await db
     .select({
       id: eventsTable.id,
       name: eventsTable.name,
       registeredCount: sql<number>`(SELECT count(*) FROM attendees WHERE attendees.event_id = events.id)`,
       checkedInCount: sql<number>`(SELECT count(*) FROM attendees WHERE attendees.event_id = events.id AND attendees.checked_in_at IS NOT NULL)`,
     })
     .from(eventsTable)
     .limit(100);
   ```
2. Replace with a single-pass `LEFT JOIN` + `GROUP BY` + conditional aggregation:
   ```ts
   // AFTER
   const events = await db
     .select({
       id: eventsTable.id,
       name: eventsTable.name,
       registeredCount: count(attendeesTable.id),
       checkedInCount: sql<number>`count(*) FILTER (WHERE ${attendeesTable.checkedInAt} IS NOT NULL)`,
     })
     .from(eventsTable)
     .leftJoin(attendeesTable, eq(attendeesTable.eventId, eventsTable.id))
     .where(/* existing filters, e.g. admin scoping via allowedIds from Phase 2 */)
     .groupBy(eventsTable.id)
     .orderBy(/* existing ordering */)
     .limit(100)
     .offset(offset);
   ```
   - Use Postgres's `FILTER (WHERE ...)` clause for the conditional `checkedInCount` rather than a second join or subquery — this keeps the whole computation in one aggregate pass.
   - Confirm `count(attendeesTable.id)` (not `count(*)`) is used for `registeredCount` so that events with zero attendees (`LEFT JOIN` producing a NULL row) correctly count as `0`, not `1`.
3. Apply the same pattern to both `getEventsForAdmin` and `getEventsPaginated` — check whether they currently duplicate this subquery logic independently and whether they can share a common query-builder helper instead of maintaining two copies.
4. Confirm existing `WHERE` filters (admin scoping, event status, etc.) are preserved and applied **before** the join/group, not accidentally dropped in the rewrite — re-read the original function's full filter list before rewriting, don't reconstruct it from memory of "typical" filters.

### Verification
- `EXPLAIN ANALYZE` before/after: before should show N nested subquery executions (visible as repeated `SubPlan` nodes scaling with row count); after should show a single `HashAggregate`/`GroupAggregate` over one join.
- Timing comparison at `limit(100)` on realistic data volume.
- Correctness check: manually verify counts for a handful of events (including one with zero attendees) match between the old and new implementation before deleting the old code path.

---

## 6. PHASE 5 — ACID Transactions & Concurrency Safety for `registerAttendee`

**Rule:** Capacity check, counter increment, and attendee insertion must be atomic. No manual rollback logic. External side effects (queue enqueue) must not live inside the transaction.

### Implementation
```ts
// AFTER
export async function registerAttendee(data: RegisterAttendeeInput) {
  const cleanEmail = data.email.trim().toLowerCase();

  const result = await db.transaction(async (tx) => {
    const [event] = await tx
      .select({
        id: eventsTable.id,
        capacity: eventsTable.capacity,
        registeredCount: eventsTable.registeredCount,
        status: eventsTable.status,
      })
      .from(eventsTable)
      .where(eq(eventsTable.id, data.eventId))
      .for("update"); // row lock — see note below

    if (!event || event.status === "closed") {
      throw new Error("EVENT_CLOSED");
    }
    if (event.registeredCount >= event.capacity) {
      throw new Error("CAPACITY_EXCEEDED");
    }

    await tx
      .update(eventsTable)
      .set({ registeredCount: sql`${eventsTable.registeredCount} + 1` })
      .where(eq(eventsTable.id, data.eventId));

    const [attendee] = await tx
      .insert(attendeesTable)
      .values({ ...data, email: cleanEmail, eventId: data.eventId })
      .returning();

    return attendee;
  });

  // Queue sync lives OUTSIDE the transaction — see Phase 6 rationale, same pattern applies here
  try {
    await enqueueSheetSync(data.eventId);
  } catch (err) {
    console.error("enqueueSheetSync failed post-registration", { eventId: data.eventId, err });
    // do not rethrow — registration already succeeded and committed
  }

  return result;
}
```
- **Row locking (`for("update")`):** the brief doesn't explicitly call this out, but a transaction alone does **not** prevent a race condition on the capacity check under Postgres's default `READ COMMITTED` isolation — two concurrent transactions can both read `registeredCount` before either commits its increment, and both pass the capacity check. Use `SELECT ... FOR UPDATE` on the event row (as shown above) to serialize concurrent registration attempts against the same event, or alternatively use `SERIALIZABLE` isolation with retry-on-conflict logic if row locking isn't the preferred pattern in this codebase. Flag this explicitly if you choose not to add it — omitting it means the capacity-breach bug this phase exists to fix is only partially fixed.
- Throwing inside the `tx` callback is sufficient to trigger Drizzle's automatic rollback — do not wrap the transaction body in an additional manual `try/catch` that attempts its own compensating rollback logic; that's exactly the "manual rollback risk causing phantom data" pattern this phase removes.
- Catch the specific thrown errors (`EVENT_CLOSED`, `CAPACITY_EXCEEDED`) **outside** the transaction, at the call site (Server Action/API route), to translate them into the appropriate user-facing response — don't swallow them inside `registerAttendee` itself.

### Sanitization (`lookupAttendee`)
```ts
// BEFORE
.where(sql`LOWER(${attendeesTable.email}) = LOWER(${email})`)

// AFTER
const cleanEmail = email.trim().toLowerCase();
.where(eq(attendeesTable.email, cleanEmail))
```
This only works correctly going forward if all emails are stored lowercase from insertion onward (per the `registerAttendee` change above) — flag whether existing rows need a one-time backfill migration (`UPDATE attendees SET email = LOWER(TRIM(email))`) to normalize historical data, otherwise old rows with mixed-case emails will silently stop matching lookups.

### Verification (required — this is a correctness-critical fix)
- **Concurrency test:** fire N concurrent `registerAttendee` calls (N > remaining capacity) against a single event with capacity `C` and confirm exactly `C` succeed and the rest throw `CAPACITY_EXCEEDED` — not `C+1` or more. This is the actual proof the race condition is closed; a passing single-request test does not prove this.
- Confirm a thrown `CAPACITY_EXCEEDED` or `EVENT_CLOSED` leaves **zero** partial writes (no orphaned attendee row, no incremented counter) — check both tables after a rejected registration.
- Confirm registration still succeeds and commits even when `enqueueSheetSync` is made to fail/timeout in a test double.
- Confirm a duplicate-case email (`Foo@Example.com` vs `foo@example.com`) is treated as the same attendee on lookup after the normalization fix (and after backfill, if applied).

---

## 7. PHASE 6 — Consolidate `processScan` Transaction & Isolate Queue Call

**Rule:** Minimize lock hold time inside the transaction; third-party calls never sit inside the ACID boundary.

### Implementation
```ts
// AFTER
export async function processScan(input: ProcessScanInput) {
  const txResult = await db.transaction(async (tx) => {
    const [row] = await tx
      .select({
        role: eventAdmins.role,
        eventStatus: eventsTable.status,
        eventClosesAt: eventsTable.closesAt,
      })
      .from(eventAdmins)
      .innerJoin(eventsTable, eq(eventsTable.id, eventAdmins.eventId))
      .where(and(eq(eventAdmins.adminId, input.adminId), eq(eventsTable.id, input.eventId)));

    if (!row) {
      throw new Error("NOT_AUTHORIZED");
    }
    if (row.eventStatus === "closed" || (row.eventClosesAt && row.eventClosesAt < new Date())) {
      throw new Error("EVENT_CLOSED");
    }

    const [updated] = await tx
      .update(attendeesTable)
      .set({ checkedInAt: new Date() })
      .where(eq(attendeesTable.id, input.attendeeId))
      .returning();

    return { result: "success" as const, attendee: updated };
  });

  if (txResult.result === "success") {
    try {
      await enqueueSheetSync(input.eventId);
    } catch (err) {
      console.error("enqueueSheetSync failed post-scan", { eventId: input.eventId, err });
      // do not rethrow — scan already committed successfully
    }
  }

  return txResult;
}
```
- **Consolidated read:** the original `eventAdmins` access check and `events` status check were two sequential queries inside the transaction; the `innerJoin` above fetches admin role, event status, and `closesAt` in a single round-trip, cutting lock hold time roughly in half for this portion of the transaction.
- **Queue isolation:** `enqueueSheetSync` is called only after the transaction has fully committed (`txResult` is returned from `db.transaction(...)`, meaning the commit already happened), and is wrapped in its own `try/catch` that logs but never rethrows — this is the same pattern as Phase 5's `registerAttendee`, applied consistently so the two functions don't diverge in how they handle this exact same class of risk.
- Return `txResult` (not just `txResult.attendee`) to the client so the caller can distinguish success/failure states cleanly if `processScan` is extended with more result variants later.

### Verification
- Confirm (via query logging or a transaction-scoped log) that only **one** read query executes inside the transaction now, not two sequential ones.
- Confirm `enqueueSheetSync` failing/timing out does not roll back or fail the scan — the attendee's `checkedInAt` must remain committed even if the queue call fails.
- Measure transaction duration before/after under load (e.g., simulate `enqueueSheetSync` latency in the "before" version by leaving it inside the tx, vs. after) to confirm reduced lock hold time.

---

## 8. EXECUTION SEQUENCE

Work in this order — security fixes first, then the shared dependency (permission caching), then performance, then correctness/atomicity:

1. **Phase 1** — cache leak fixes (critical, no dependencies on other phases)
2. **Phase 2** — permission lookup caching (independent, but do before Phase 4 since `getEventsForAdmin`/`getEventsPaginated` likely consume the same `allowedIds` scoping)
3. **Phase 3** — FTS optimization on attendees (requires the schema migration to land and be applied to the DB before query-side changes are deployed — sequence the migration first, verify the column is populated, then ship the query change)
4. **Phase 4** — N+1 fix on events (independent of Phase 3, can be done in parallel; if bundling both events.ts fixes into one PR, do the aggregate-join rewrite and the FTS query-side change together since they touch the same functions)
5. **Phase 5** — ACID transactions on `registerAttendee` (highest correctness risk item — do not defer this)
6. **Phase 6** — `processScan` consolidation (same file/domain as Phase 5, natural to do immediately after, and reuses the same queue-isolation pattern established there)

---

## 9. FINAL VERIFICATION CHECKLIST

- [ ] Cross-tenant isolation test passes for `getAttendeesStats` and `getDashboardStats` (Admin A never sees Admin B's cached data)
- [ ] Tag-based `revalidateTag` invalidation confirmed scoped per-admin, doesn't cross-invalidate
- [ ] `getTotalScansForAdmin` has no conflicting nested `unstable_cache`
- [ ] `eventAdmins`/`allowedIds` lookup confirmed to execute exactly once per request across all call sites
- [ ] `EXPLAIN ANALYZE` on attendees search shows GIN index scan, not sequential scan
- [ ] `EXPLAIN ANALYZE` on events search shows GIN index scan, not sequential scan
- [ ] Malformed search input doesn't throw a raw Postgres syntax error to the user
- [ ] `getEventsForAdmin`/`getEventsPaginated` execute as a single aggregate query, confirmed via `EXPLAIN ANALYZE` (no repeated SubPlan nodes)
- [ ] Zero-attendee events correctly show `registeredCount: 0`, not `1` or `null`
- [ ] Concurrency test: N concurrent registrations against capacity `C` yields exactly `C` successes
- [ ] Rejected registration leaves zero partial writes in either `events` or `attendees`
- [ ] `registerAttendee` and `processScan` both commit successfully even when `enqueueSheetSync` fails
- [ ] Email lookups are case-insensitive-by-normalization (not by `LOWER()` in SQL) and hit an index
- [ ] `processScan` transaction contains exactly one consolidated read query, not two sequential ones
- [ ] Historical email data backfill applied (or explicitly flagged as a follow-up) if mixed-case rows exist

---

## 10. OUTPUT FORMAT EXPECTED FROM THE AGENT

For each phase, respond with:
1. **Findings** — the exact lines/functions where the bug lives, quoted or referenced with file + line numbers, not a restatement of the task brief.
2. **Changes** — the diff or full new function contents, including any migration SQL.
3. **Verification** — the specific test or `EXPLAIN ANALYZE` run performed and its actual result (numbers/pass-fail, not "should work now"). For Phases 1 and 5 specifically, the proof-of-fix test (cross-tenant isolation test, concurrency test) is mandatory, not optional.
4. **Open questions / flags** — anything requiring a product/security decision rather than a unilateral code choice (e.g., whether to backfill historical email casing, whether `getTotalScansForAdmin` needs standalone caching if used elsewhere, whether `SERIALIZABLE` isolation is preferred over row locking).