# FlowCheck — Security Architecture

## 1. Security Philosophy

Our approach relies on **Defense in Depth**, **Zero Trust**, and **Least Privilege**. Every boundary assumes the previous one might have been bypassed.

## 2. 5-Layer Defense Model

### Layer 1: Cloudflare Edge
- **Built-in DDoS Protection:** Cloudflare provides world-class, automatic mitigation against volumetric attacks.
- **WAF Rate Limiting:** One free tier rule applied to `/api/*` (e.g., 100 requests / 10s per IP) to prevent endpoint abuse.
- **HTTPS Everywhere:** Cloudflare enforces auto-SSL.
- **Bot Management:** Basic bot mitigation enabled.

### Layer 2: Application Middleware
- **App-Level Rate Limiter:** A simple sliding window rate limiter using the Cloudflare Cache API (per-colo). It's not globally consistent but adequate for abuse prevention.
- **Auth Guard:** Validates session on all `/dashboard/*` routes.
- **CORS Headers:** Restricts cross-origin requests.

### Layer 3: Server Actions + DAL
- **Zod Validation:** All incoming data is rigorously parsed and validated.
- **CSRF Protection:** Built into Next.js Server Actions.
- **`import 'server-only'`:** Ensures Data Access Layer code (including DB credentials) never leaks to the client.
- **Auth & Authz:** Every DAL function explicitly checks the caller's role (owner, editor, scanner).
- **Parameterized Queries:** Drizzle ORM automatically parameterizes SQL, preventing SQL injection.

### Layer 4: Database (Supabase)
- **RLS (Row Level Security):** Acts as a defense-in-depth mechanism. Even if the application layer has a bug, the DB policies prevent unauthorized access.
- **Encryption at Rest:** Supabase default.
- **TLS Connections:** Connection via Supavisor pooler is encrypted.
- **Email Daily Cap Enforcement:** 290 emails/day cap enforced via a DB query before sending.

### Layer 5: External APIs
- **Service Account Credentials:** Kept strictly in environment variables.
- **Least Privilege Scopes:** Google Service Account only requests Sheets and Drive scopes.
- **Brevo API Key:** Stored in environment variables.
- **Key Rotation Policy:** Routine rotation recommended.

## 3. QR Token Security Model

| Property | Details |
|---|---|
| Format | UUID v4 via `crypto.randomUUID()` (CSPRNG, 122 bits of randomness) |
| Privacy | QR code contains ONLY the UUID. No Name or Email included. |
| One-Time Use | State moves from `registered` → `checked_in`. Duplicates rejected. |
| Time-Bound | Server rejects scans if the event status is not `open`. |
| Audit Trail | Every scan (success, invalid, duplicate) is logged in `scan_logs`. |

**Token Lifecycle:**
`Create` → `Store (DB)` → `Deliver (Email)` → `Validate (Scan)` → `Consume` → `Reject Duplicates`

## 4. Rate Limit Strategy

| Layer | Mechanism | Scope | Details |
|---|---|---|---|
| Cloudflare DDoS | Automatic | Global | Free, always-on |
| Cloudflare WAF | 1 rule | `/api/*` | 100 reqs / 10s per IP |
| App Middleware | Cache API | Per-Colo | Reg: 5/min/IP, Scan: 30/min/admin, General: 20/min/IP |
| Email Cap | DB Query | Global | 290 emails/day across all events |

## 5. Email Daily Cap Implementation (with Queueing)

To ensure we never hit the Brevo free tier limit (300/day) and get locked out, we enforce a strict 290/day limit.

- **Check:** `SELECT COUNT(*) FROM attendees WHERE email_sent = true AND DATE(email_sent_at) = CURRENT_DATE`
- **Action:** If count >= 290, the registration is **accepted**, but `email_sent` is set to `false`.
- **Queue Processing:** A Cloudflare Cron Trigger periodically checks for `email_sent = false` and sends them in batches, respecting the daily quota.
- **Scope:** Global (across all events using the shared Brevo account).

## 6. Threat Model

| Threat | Attack Vector | Mitigation |
|---|---|---|
| QR Screenshot Sharing | Users send QR to friends | One-time-use tokens |
| Bot Spam | Automated registrations | WAF + App Rate Limits + Email Cap |
| SQL Injection | Malicious payload in form | Drizzle parameterized queries |
| XSS | Malicious payload in display | React auto-escaping + CSP |
| CSRF | Forged request to action | Next.js built-in protection |
| Token Enumeration | Guessing valid QR codes | UUID v4 (infeasible to guess) |
| DDoS | Traffic flood | Cloudflare Edge Protection |
| Key Leak | Code repository compromise | Env vars only + rotation |
| Quota Exhaustion | Malicious spamming | 290/day Email Cap |
| Stale Tokens | Scanning old QR codes | Scan endpoint checks event status |

## 7. PII Protection

- **Storage:** PII (Name, Email, Local, District, Zone) is stored ONLY in PostgreSQL (encrypted at rest).
- **QR Codes:** Opaque UUID only.
- **Logs:** Scan logs store UUIDs, not PII.
- **Google Sheets:** Contains PII. The Admin is responsible for access control of the Google Sheet.
- **GDPR:** Users have the right to deletion (can cancel registration).

## 8. Pre-Launch Security Checklist

- [ ] Check environment variables are not exposed to the client (no `NEXT_PUBLIC_` for secrets).
- [ ] Confirm Supabase RLS is enabled on all tables.
- [ ] Verify Server Actions use `Zod` validation.
- [ ] Confirm Cloudflare WAF rate limiting rule is active.
- [ ] Test the 290/day email cap logic.
- [ ] Verify Google Service Account has restricted scopes.
- [ ] Ensure the QR code generator does not include PII.
- [ ] Test duplicate scan rejection.
- [ ] Check CORS configuration.
