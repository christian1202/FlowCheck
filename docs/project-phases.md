# FlowCheck — Project Implementation Status & Roadmap

This document outlines the implementation status and roadmap for FlowCheck.

---

## Phase 1 — Foundation & Core Framework
- [x] Next.js 16 (App Router) + React 19 + TypeScript + Tailwind CSS v4 setup.
- [x] `@opennextjs/cloudflare` OpenNext configuration for Cloudflare Workers deployment.
- [x] Supabase integration (PostgreSQL + Supabase Auth + Google OAuth).
- [x] Drizzle ORM schema definition (`admins`, `events`, `event_admins`, `attendees`, `scan_logs`).
- [x] Next.js Middleware route protection and public pre-registration route exemption.

## Phase 2 — Event Management & Security
- [x] Event CRUD server actions and Data Access Layer (DAL).
- [x] Event status lifecycle (`draft` → `open` → `closed` → `archived`).
- [x] Multi-admin team permissions (`owner`, `editor`, `scanner`) with role-integrity guards.
- [x] Admin dashboard UI with live attendee stats and event analytics.

## Phase 3 — Public Pre-Registration & QR Ticket System
- [x] Public pre-registration form (`/events/[slug]/register`) accessible without login.
- [x] Zod validation for pre-registration form input.
- [x] Instant QR code ticket generation (`qrcode`) with client-side PNG download.
- [x] Attendee ticket lookup by email address.
- [x] Event capacity check (row-locked transaction) and duplicate registration prevention (unique index).

## Phase 4 — QR Scanner PWA & Audio Feedback
- [x] Web camera QR scanner component using `html5-qrcode`.
- [x] Server Action check-in verification (`scanTicketAction` → `processScan`).
- [x] Browser Web Audio API sound synthesis (Chime for success, Double-beep for duplicate, Descending tone for error).
- [x] Color-coded status overlays and recent scans sidebar.

## Phase 5 — UI Refinement & Branding
- [x] High-contrast modern branding with `/images/flowchecklogo-final-bg-white-big.png`.
- [x] Responsive layout for mobile, tablet, and desktop views.
- [x] System information modal with stack specs and source code references.

## Phase 6 — Performance & Caching
- [x] KV-backed incremental + tag cache on Cloudflare (`NEXT_INC_CACHE_KV`, `NEXT_TAG_CACHE_KV`) — `unstable_cache()` and `revalidateTag()` now persist across requests.
- [x] Tenant-scoped `unstable_cache` wrapping of all page-facing DAL functions (30–60s TTL).
- [x] `revalidateTag` invalidation at every mutation point (events, team, scans, registrations).
- [x] Hover-triggered route + data prefetch (`PrefetchLink`, `useHoverPrefetch`, warm-up server actions).
- [x] ISR for the public register page (`force-static` + `revalidate`) — edge-cached HTML per event path.
- [x] Streaming/Suspense skeletons on all dashboard routes, virtualized events grid, debounced search, `useTransition` view switches.

## Phase 7 — Security Hardening
- [x] Removed unauthenticated Hono endpoints that leaked event rows (drafts, sheet IDs, creator UUIDs).
- [x] Fixed IDOR in the `updateEvent` empty-payload path (ownership join enforced).
- [x] Owner-role protection in team management (no demotion/ejection of owners).
- [x] Masked raw DB error details in `/api/test-db` and `/api/health`.
- [x] Removed dead code with a hardcoded fallback secret; deduplicated FTS search logic.
- [ ] Cloudflare WAF rate-limiting rule for `POST /events/*/register` (deployment config — verify before large events).
