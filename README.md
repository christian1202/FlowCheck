# FlowCheck

**Zero-config event attendance, powered by QR codes and Google Sheets.**

FlowCheck is an open-source event check-in system that lets organizers create events, register attendees via email with QR codes, and scan them in with any camera — all synced live to Google Sheets. It runs entirely on free-tier cloud services at **$0/month**.

---

## Key Features

- 📋 **Create events** with a single form — name, date, capacity, done
- 📱 **QR code registration** — attendees receive a unique QR code via email
- 📷 **Scan with any camera** — phone or laptop webcam, works as a PWA
- 📊 **Auto-sync to Google Sheets** — live attendance data, shareable with your team
- 👥 **Multi-admin collaboration** — invite co-admins who get editor access to the sheet
- 🔐 **Secure one-time-use tokens** — each QR code is a unique UUID, not reusable
- 📍 **Location & Role tracking** — track attendees by Local, District, Zone, and Duty (tungkulin)
- 💸 **100% free hosting** — $0/month, forever, no credit card required

---

## How It Works

1. **Create an event** — set the name, date, venue, and max capacity
2. **Share the registration link** — attendees sign up with name, email, location, and duty
3. **Attendees receive a QR code** — delivered to their inbox with event details
4. **Scan at the door** — open the scanner PWA, point your camera, done in under a second

---

## Tech Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| Framework | Next.js 15 + TypeScript | Full-stack React with Server Actions |
| Styling | Tailwind CSS | Utility-first CSS |
| Database | Supabase (PostgreSQL) | Data persistence + connection pooling |
| Auth | Supabase Auth (Google OAuth) | Admin login |
| ORM | Drizzle ORM | Type-safe queries + migrations |
| Hosting | Cloudflare Pages | Edge deployment via OpenNext adapter |
| Background Jobs | Cloudflare Queues + Cron Triggers | Batched Sheets sync + email retries |
| Email | Brevo (REST API) | Transactional emails with QR attachments |
| Spreadsheets | Google Sheets API v4 + Drive API v3 | Live attendance export |
| QR Codes | `qrcode` (pure JS) | QR generation, no native dependencies |
| Scanner | `html5-qrcode` | Camera-based QR scanning (phone + laptop) |
| PWA | Serwist | Offline support + install prompt |

---

## Free Tier Stack

Every service FlowCheck uses has a generous free tier. Combined cost: **$0/month**.

| Service | What It Provides | Free Limit |
|---------|-----------------|-----------|
| Cloudflare Pages | Hosting + CDN + edge compute | Unlimited bandwidth, 100K req/day |
| Cloudflare Queues | Background job processing | 1M operations/month |
| Supabase | PostgreSQL + Auth + pooling | 500MB DB, 50K MAU |
| Brevo | Transactional email | 300 emails/day |
| Google Sheets API | Live attendance spreadsheet | 60 req/min |

---

## Quick Start

```bash
git clone https://github.com/yourusername/FlowCheck.git
cd FlowCheck
npm install
cp .env.example .env.local
# Fill in your environment variables — see docs/deployment.md
npm run dev
```

> [!NOTE]
> You'll need accounts on Supabase, Cloudflare, Brevo, and Google Cloud before running the app. The [Deployment Guide](docs/deployment.md) walks through every step.

---

## Documentation

| Document | Description |
|----------|-------------|
| [Architecture](docs/architecture.md) | System design, component diagram, tech decisions |
| [Features](docs/features.md) | Detailed feature specifications |
| [Database Schema](docs/database-schema.md) | Tables, relationships, indexes, RLS policies |
| [Data Flows](docs/data-flows.md) | Sequence diagrams for all 5 critical paths |
| [Security](docs/security.md) | Auth, rate limiting, input validation, OWASP |
| [Deployment](docs/deployment.md) | Full setup guide for all services |
| [Project Phases](docs/project-phases.md) | Step-by-step implementation checklist |

---

## License

[MIT](LICENSE)
