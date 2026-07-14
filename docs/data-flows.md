# Data Flows

This document describes every critical data path in FlowCheck — from event creation to email retries. Each flow includes a sequence diagram, step-by-step breakdown, error handling, and timing expectations.

> [!NOTE]
> All server-side operations use Next.js Server Actions with Zod validation. Database access goes through a Data Access Layer (DAL) that enforces auth checks before every query.

---

## Flow 1: Event Creation

An admin creates an event as a draft, then publishes it. Publishing triggers synchronous Google Sheets provisioning.

### Draft Creation

```mermaid
sequenceDiagram
    participant Admin
    participant Middleware
    participant ServerAction as Server Action
    participant DAL
    participant DB as PostgreSQL

    Admin->>Middleware: Create event (form submit)
    Middleware->>Middleware: Auth check (session valid?)
    alt No session
        Middleware-->>Admin: 401 Redirect to login
    end
    Middleware->>ServerAction: Forward request
    ServerAction->>ServerAction: Zod validate (name, date, capacity, location)
    alt Validation fails
        ServerAction-->>Admin: 400 Validation errors
    end
    ServerAction->>DAL: createEvent(data, adminId)
    DAL->>DAL: Verify admin role
    DAL->>DB: INSERT INTO events (status = 'draft')
    DB-->>DAL: Event record
    DAL-->>ServerAction: Event created
    ServerAction-->>Admin: ✅ Redirect to event page
```

### Publishing (Draft → Open)

When an admin publishes an event, the system provisions a Google Sheet and shares it with all event admins. This is **synchronous** because event creation is infrequent and the admin expects immediate confirmation.

```mermaid
sequenceDiagram
    participant Admin
    participant ServerAction as Server Action
    participant DAL
    participant DB as PostgreSQL
    participant Sheets as Google Sheets API
    participant Drive as Google Drive API

    Admin->>ServerAction: Publish event
    ServerAction->>DAL: publishEvent(eventId, adminId)
    DAL->>DAL: Verify admin owns event
    DAL->>DB: UPDATE events SET status = 'open'
    DB-->>DAL: Updated

    DAL->>Sheets: spreadsheets.create(title)
    Sheets-->>DAL: spreadsheetId, spreadsheetUrl

    DAL->>Sheets: Format headers
    Note right of Sheets: # | Name | Email | Local<br/>District | Zone | Duty | Status<br/>Checked In At

    DAL->>DB: SELECT admins for this event
    DB-->>DAL: Admin email list

    DAL->>Drive: Share sheet with admin emails (role: writer)
    Drive-->>DAL: Shared

    DAL->>DB: UPDATE events SET spreadsheet_id, spreadsheet_url
    DB-->>DAL: Updated

    DAL-->>ServerAction: Published with sheet
    ServerAction-->>Admin: ✅ Event is live + Sheet link
```

**Error handling:**
- If Google Sheets API fails, the event status rolls back to `draft` and the admin sees an error message with a retry option
- If Drive sharing fails, the sheet is created but not shared — a warning is shown and the admin can manually share

**Timing:** ~2–4 seconds (Sheets API create + format + share)

---

## Flow 2: Attendee Registration

1. **Attendee** scans QR code or clicks link to `/events/[slug]/register`.
2. **Registration Component** displays form.
3. Attendee submits form.
4. **Registration Action** calls **Hono API Gateway**.
5. **Hono Gateway** checks event capacity and duplicate emails.
6. If valid, generates a `scan_token` and inserts into `attendees`.
7. (Async) Triggers `enqueueSheetSync` to sync with Google Sheets via Cloudflare Queues.

```mermaid
sequenceDiagram
    participant Attendee
    participant CF as Cloudflare Edge
    participant MW as Middleware
    participant SA as Server Action
    participant DAL
    participant DB as PostgreSQL
    participant QR as QR Generator
    participant Brevo as Brevo API
    participant Queue as Cloudflare Queue

    Attendee->>CF: Submit registration form
    CF->>CF: DDoS protection + WAF rate limit
    CF->>MW: Forward request
    MW->>MW: App rate limit (5 req/min/IP)
    alt Rate limited
        MW-->>Attendee: 429 Too Many Requests
    end

    MW->>SA: Forward request
    SA->>SA: Zod validate (name, email, local, district, zone, duty)
    alt Validation fails
        SA-->>Attendee: 400 Field errors
    end

    SA->>DAL: registerAttendee(data, eventId)

    DAL->>DB: SELECT status FROM events WHERE id = eventId
    alt Event not open
        DAL-->>SA: ❌ Event is not accepting registrations
    end

    DAL->>DB: SELECT COUNT(*) FROM attendees WHERE event_id = eventId
    alt At capacity
        DAL-->>SA: ❌ Event is full
    end

    DAL->>DB: SELECT id FROM attendees WHERE email = ? AND event_id = ?
    alt Duplicate
        DAL-->>SA: ❌ Already registered
    end

    DAL->>DB: SELECT COUNT(*) FROM attendees<br/>WHERE email_sent = true<br/>AND DATE(email_sent_at) = CURRENT_DATE
    alt Count >= 290
        DAL-->>SA: ⚠️ Queue email (limit reached)
    end

    DAL->>DAL: scan_token = crypto.randomUUID()
    DAL->>DB: INSERT INTO attendees (scan_token, status='registered')
    DB-->>DAL: Attendee record

    DAL->>QR: Generate PNG (scan_token, 300px, ECC Level H)
    QR-->>DAL: QR code as base64 PNG

    DAL->>Brevo: POST /v3/smtp/email<br/>(to, subject, HTML body, inline QR image)
    alt Email succeeds
        Brevo-->>DAL: 201 Created
        DAL->>DB: UPDATE attendees SET email_sent = true
    else Email fails
        DAL->>DB: UPDATE attendees SET email_sent = false
        DAL->>Queue: Publish retry message (attendeeId)
        Queue-->>DAL: Queued
    end

    DAL-->>SA: Registration result
    SA-->>Attendee: ✅ Success page (check your email)
```

> [!IMPORTANT]
> The **daily email cap check** (step 4) is critical. Brevo's free tier hard-limits at 300 emails/day. We cap at 290. If the cap is hit, registration **succeeds**, but the attendee is flagged with `email_sent = false` and queued for a background cron job to process the next day.

**Validation rules (Zod):**

| Field | Rules |
|-------|-------|
| `name` | Required, 2–100 characters, trimmed |
| `email` | Required, valid email format, lowercased |
| `local` | Required, 2–100 characters |
| `district` | Required, 2–100 characters |
| `zone` | Required, 2–100 characters |
| `duty` | Required, 2–100 characters |

**Error handling:**
- Cloudflare WAF blocks obvious abuse (DDoS, bot patterns) at the edge before hitting the app
- App-level rate limiting (5 requests/min per IP) prevents form spam
- Email failures don't block registration — the attendee is saved and a retry is queued
- If the queue publish fails, the attendee record with `email_sent = false` will be picked up by the cron retry job

**Timing:** ~2–5 seconds total (QR generation ~50ms, Brevo API ~1–3s, DB operations ~200ms)

---

## Flow 3: QR Code Scan (Check-In)

1. **Scanner Admin** opens PWA on phone.
2. Scans Attendee QR Code (`html5-qrcode`).
3. Sends token to `scanTicketAction`.
4. Action calls **Hono API Gateway**.
5. **Hono Gateway** verifies event status, checks attendee status.
6. If valid, updates attendee `status = 'checked_in'` and `checked_in_at = NOW()`.
7. Inserts record into `scan_logs`.
8. Enqueues a sync event to Cloudflare Queues (`SHEETS_QUEUE`).

```mermaid
sequenceDiagram
    participant Scanner as Scanner PWA
    participant CF as Cloudflare Edge
    participant MW as Middleware
    participant SA as Server Action
    participant DAL
    participant DB as PostgreSQL
    participant Queue as Cloudflare Queue

    Scanner->>Scanner: Camera detects QR code
    Scanner->>Scanner: Extract UUID from QR data

    Scanner->>CF: POST /check-in (scan_token, eventId)
    CF->>CF: DDoS protection
    CF->>MW: Forward request
    MW->>MW: Auth check (admin session)
    MW->>MW: Rate limit (30 req/min/admin)
    MW->>SA: Forward request

    SA->>SA: Zod validate (UUID format)
    SA->>DAL: processQrScan(token, eventId, adminId)

    DAL->>DB: SELECT * FROM attendees WHERE scan_token = ?

    alt Token not found
        DAL->>DB: INSERT scan_log (type: 'invalid')
        DAL-->>SA: ❌ Invalid QR code
        SA-->>Scanner: Red flash + error sound
    end

    DAL->>DB: SELECT status FROM events WHERE id = eventId
    alt Event not open
        DAL->>DB: INSERT scan_log (type: 'expired')
        DAL-->>SA: ❌ Event is closed
        SA-->>Scanner: Red flash + "Event is closed"
    end

    alt Attendee status = 'checked_in'
        DAL->>DB: INSERT scan_log (type: 'duplicate')
        DAL-->>SA: ⚠️ Already checked in
        SA-->>Scanner: Yellow flash + original check-in time
    else Attendee status = 'registered'
        DAL->>DB: UPDATE attendees SET status = 'checked_in',<br/>checked_in_at = NOW(), checked_in_by = adminId
        DAL->>DB: INSERT scan_log (type: 'success')
        DAL->>Queue: Publish {eventId, attendeeId} to 'sheets-sync'
        Queue-->>DAL: Queued
        DAL-->>SA: ✅ Check-in successful
        SA-->>Scanner: Green flash + name + local/district/zone/duty
    end
```

**Scanner UI feedback:**

| Result | Visual | Audio | Info Displayed |
|--------|--------|-------|---------------|
| ✅ Success | Green flash | Success chime | Name, Local, District, Zone, Duty |
| ⚠️ Duplicate | Yellow flash | Warning tone | Name, original check-in time |
| ❌ Invalid | Red flash | Error buzz | "Invalid QR code" |
| ❌ Event closed | Red flash | Error buzz | "Event is not open" |

> [!TIP]
> The scan rate limit of 30/min per admin means one scan every 2 seconds — faster than any human can process a check-in line. This prevents accidental rapid-fire scans from the same QR code.

**Error handling:**
- If the queue publish fails after a successful check-in, the attendee is still marked as checked in. The cron sync job will pick up unsynced records
- Every scan (valid or invalid) is logged in `scan_logs` for audit purposes
- The scan log records: `scan_token`, `event_id`, `admin_id`, `result_type`, `scanned_at`

**Timing:** < 500ms target (DB lookup ~50ms, UPDATE ~50ms, queue publish ~20ms, network ~200ms)

---

## Flow 4: Google Sheets Batch Sync

Attendance data syncs to Google Sheets via two complementary mechanisms: a **queue consumer** for real-time-ish updates, and a **cron trigger** as a safety net.

### Architecture

```mermaid
flowchart TB
    subgraph Triggers
        A[QR Scan Success] -->|publish| Q[Cloudflare Queue<br/>sheets-sync]
        C[Cron Trigger<br/>every 2 min] -->|invoke| W
    end

    Q -->|batch: max 50 msgs<br/>max 30s wait| W[Queue Consumer<br/>Worker]

    W --> D{Events with<br/>unsynced data?}
    D -->|Yes| E[Query all checked-in<br/>attendees for event]
    D -->|No| F[Skip — nothing to sync]

    E --> G[sheets.values.batchUpdate<br/>full table refresh]
    G --> H[INSERT sheet_sync_log]
    H --> I[Done]

    G -->|429 Too Many Requests| J[Exponential backoff<br/>retry with delay]
    J --> G
```

### Queue Consumer (Near Real-Time)

When a QR scan succeeds, a message is published to the `sheets-sync` Cloudflare Queue. The consumer batches messages for efficiency:

```mermaid
sequenceDiagram
    participant Queue as Cloudflare Queue
    participant Worker as Consumer Worker
    participant DB as PostgreSQL
    participant Sheets as Google Sheets API

    Note over Queue: Collects messages<br/>max 50 msgs OR 30s timeout

    Queue->>Worker: Deliver batch (1–50 messages)
    Worker->>Worker: Deduplicate by eventId

    loop For each unique eventId
        Worker->>DB: SELECT * FROM attendees<br/>WHERE event_id = ? AND status = 'checked_in'<br/>ORDER BY checked_in_at
        DB-->>Worker: Attendee rows

        Worker->>DB: SELECT spreadsheet_id FROM events WHERE id = ?
        DB-->>Worker: spreadsheetId

        Worker->>Sheets: values.batchUpdate (full table refresh)
        alt Success
            Sheets-->>Worker: Updated
            Worker->>DB: INSERT sheet_sync_log (status: 'success')
        else 429 Rate Limited
            Sheets-->>Worker: 429 Too Many Requests
            Worker->>Worker: Exponential backoff (1s, 2s, 4s)
            Worker->>Sheets: Retry
        else Other error
            Worker->>DB: INSERT sheet_sync_log (status: 'error', details)
        end
    end

    Worker-->>Queue: Acknowledge batch
```

### Cron Trigger (Safety Net)

Every 2 minutes, a Cron Trigger invokes the same worker to catch any records that the queue might have missed:

1. Query all events with `status = 'open'`
2. For each event, compare `last_synced_at` with `MAX(checked_in_at)` from attendees
3. If there are unsynced check-ins, run the same sync logic as the queue consumer

**Rate limit guard:** Maximum 50 Google Sheets API calls per sync run to stay well under the 60 requests/minute quota.

> [!WARNING]
> Google Sheets API has a hard limit of **60 requests per minute per user**. The batch sync pattern (full table refresh per event) ensures we use only 1 API call per event per sync cycle, regardless of how many attendees checked in.

**Sheet data format:**

| # | Name | Email | Local | District | Zone | Duty | Status | Checked In At |
|---|------|-------|-------|----------|------|------|--------|--------------|
| 1 | Jane Doe | jane@example.com | Manila | NCR | Zone A | Staff | Checked In | 2025-01-15 09:32:00 |
| 2 | John Smith | john@example.com | Quezon City | NCR | Zone B | Volunteer | Checked In | 2025-01-15 09:33:15 |

---

## Flow 5: Email Queue Processor & Retry

Emails that fail during registration, or were queued because the 290/day limit was reached, are processed by a cron job. The job respects the daily email cap and gives up after 3 attempts.

```mermaid
sequenceDiagram
    participant Cron as Cron Trigger<br/>(every 5 min)
    participant API as /api/cron/retry-emails
    participant DB as PostgreSQL
    participant QR as QR Generator
    participant Brevo as Brevo API

    Cron->>API: GET /api/cron/retry-emails<br/>(Authorization: Bearer CRON_SECRET)
    API->>API: Validate CRON_SECRET

    API->>DB: SELECT * FROM attendees<br/>WHERE email_sent = false<br/>AND retry_count < 3<br/>AND registered_at > NOW() - INTERVAL '24 hours'<br/>LIMIT 10
    DB-->>API: Failed email list (0–10 rows)

    alt No rows
        API-->>Cron: 200 OK (nothing to retry)
    end

    API->>DB: SELECT COUNT(*) FROM attendees<br/>WHERE email_sent = true<br/>AND DATE(email_sent_at) = CURRENT_DATE
    DB-->>API: emails_sent_today

    Note over API: remaining = 290 - emails_sent_today

    loop For each attendee (up to remaining)
        API->>QR: Generate PNG (scan_token, 300px, ECC Level H)
        QR-->>API: QR base64 PNG

        API->>Brevo: POST /v3/smtp/email
        alt Success
            Brevo-->>API: 201 Created
            API->>DB: UPDATE attendees SET email_sent = true
        else Failure
            Brevo-->>API: Error
            API->>DB: UPDATE attendees SET retry_count = retry_count + 1
            alt retry_count >= 3
                API->>DB: UPDATE attendees SET email_permanently_failed = true
                Note over API: Log error for manual review
            end
        end
    end

    API-->>Cron: 200 OK (retried N emails)
```

> [!IMPORTANT]
> The retry job processes a **maximum of 10 emails per run** to avoid monopolizing the daily email budget. It also respects the same 290/day cap as the registration flow.

**Retry policy:**

| Attempt | Timing | Action on failure |
|---------|--------|-------------------|
| 1st | During registration | Queue retry via Cloudflare Queue |
| 2nd | Next cron cycle (~5 min) | Increment retry_count |
| 3rd | Next cron cycle (~10 min) | Increment retry_count |
| 4th | — | Mark `email_permanently_failed = true`, stop retrying |

**Error handling:**
- The cron endpoint is protected by `CRON_SECRET` — unauthenticated requests get a `401`
- Emails older than 24 hours are not retried (the QR code is likely stale)
- Permanently failed emails are logged for manual review by admins
- The daily cap check happens once at the start, and the loop breaks if remaining budget hits zero mid-run

---

## Summary: Request Flow Through the Stack

Every request to FlowCheck passes through the same layered architecture:

```mermaid
flowchart LR
    Client([Client<br/>Browser/PWA])
    CF[Cloudflare Edge<br/>DDoS + WAF]
    MW[Next.js Middleware<br/>Auth + Rate Limit]
    SA[Server Action<br/>Zod Validation]
    DAL[Data Access Layer<br/>Auth Enforcement]
    DB[(PostgreSQL<br/>Supabase)]
    EXT[External APIs<br/>Brevo / Sheets]
    Q[Cloudflare Queue]

    Client --> CF --> MW --> SA --> DAL --> DB
    DAL --> EXT
    DAL --> Q
```

| Layer | Responsibility | Failure Mode |
|-------|---------------|-------------|
| Cloudflare Edge | DDoS mitigation, WAF rules, rate limit (1 rule on free) | Blocks abusive traffic silently |
| Middleware | Session validation, app-level rate limiting | 401/429 response |
| Server Action | Input validation (Zod schemas) | 400 with field-level errors |
| DAL | Authorization, business logic, DB queries | Domain-specific errors |
| PostgreSQL | Data persistence, constraints, indexes | Constraint violations caught by DAL |
| External APIs | Email delivery, Sheets sync | Queued for retry on failure |
| Cloudflare Queue | Async job processing, batching | Messages retry automatically |
