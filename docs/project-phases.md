# FlowCheck — Project Phases

This document outlines the step-by-step implementation phases for the FlowCheck project.

## Phase 1 — Foundation
*Set up the core project structure, database, and edge routing.*
- [ ] Next.js 15 scaffold + TypeScript strict + Tailwind v4
- [ ] OpenNext adapter + `wrangler.toml` configuration
- [ ] Supabase project setup (DB + Auth + Google OAuth)
- [ ] Drizzle schema creation (6 tables: `admins`, `events`, `event_admins`, `attendees`, `scan_logs`, `sheet_sync_log`)
- [ ] Middleware setup (auth guard + app-level rate limiting via Cloudflare Cache API)
- [ ] Docker Compose for local development (PostgreSQL only)

## Phase 2 — Event Management
*Build the admin dashboard and event lifecycle logic.*
- [ ] Event CRUD operations (Data Access Layer + Server Actions)
- [ ] Event lifecycle state machine (draft → open → closed → archived)
- [ ] Multi-admin invite system (owner, editor, scanner roles)
- [ ] Admin Dashboard UI (event list, details, settings)

## Phase 3 — Registration + QR + Email
*Create the public-facing registration flow and ticket delivery.*
- [ ] Public registration form (name, email, local, district, zone, duty)
- [ ] QR code generation (`qrcode` library, pure JS, error correction level H)
- [ ] Brevo email integration (REST API via `fetch`, CID inline QR)
- [ ] Daily email cap enforcement (290 emails/day limit check + queue logic)
- [ ] Duplicate detection & event capacity enforcement

## Phase 4 — Scanner PWA
*Develop the fast, web-based QR scanning tool for door staff.*
- [ ] QR scanner component (`html5-qrcode`, supporting phone rear camera + laptop webcam)
- [ ] Scan processing logic (validate → check-in → log → queue for Sheets sync)
- [ ] Visual + audio feedback (success chime/green flash, warning/yellow, error/red)
- [ ] PWA configuration (`serwist` + `manifest.ts`)
- [ ] QR expiration logic (prevent scans if event status is not 'open')

## Phase 5 — Google Sheets Integration
*Implement the background data export for administrative reporting.*
- [ ] Google Service Account authentication setup
- [ ] Sheet auto-provisioning (create spreadsheet + format headers + share with admin emails)
- [ ] Cloudflare Queue consumer for batch syncing checked-in attendees
- [ ] Cloudflare Cron Trigger (every 2 min) as a safety catch-up sync
- [ ] Column Mapping: `# | Name | Email | Local | District | Zone | Duty | Status | Checked In At`

## Phase 6 — Polish & Launch
*Finalize security, error handling, and user experience.*
- [ ] Public landing page
- [ ] Global error handling and UI toasts
- [ ] System health check endpoint
- [ ] Security checklist verification (WAF, RLS, env vars)
- [ ] End-to-end testing
