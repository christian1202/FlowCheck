# FlowCheck

<p align="center">
  <img src="public/images/flowcheck_logo_v2.png" alt="FlowCheck Logo" width="180"/>
</p>

<p align="center">
  <b>Modern, edge-native event attendance & pre-registration system powered by QR codes.</b>
</p>

<p align="center">
  <a href="#key-features">Key Features</a> •
  <a href="#how-it-works">How It Works</a> •
  <a href="#tech-stack">Tech Stack</a> •
  <a href="#running-locally">Running Locally</a> •
  <a href="#documentation">Documentation</a>
</p>

---

## Overview

**FlowCheck** is an open-source, zero-configuration event pre-registration and QR check-in platform. Public attendees can pre-register for events without creating an account and instantly receive a downloadable QR ticket. Door staff can scan attendees using any smartphone or camera via an installable PWA with synthesized Web Audio sound feedback and real-time dashboard analytics.

FlowCheck is designed to run on a **$0/month free-forever stack** using serverless edge deployment with Cloudflare Pages/Workers and Supabase PostgreSQL.

---

## Key Features

- 🌐 **Public Pre-Registration**: Anyone can pre-register for open events using a direct shareable link without creating an account.
- 🎟️ **Instant QR Ticket Generation**: On-screen QR ticket generation upon pre-registration with one-click PNG download and email lookup retrieval.
- 📱 **Camera QR Scanner PWA**: Fast, responsive in-browser camera scanner supporting rear phone cameras and webcams.
- 🔊 **Web Audio API Feedback**: Instant synthesized audio chimes for valid check-ins, duplicate scan warnings, and error alerts—no sound files required.
- 👥 **Multi-Admin Team Roles**: Assign team members as **Owner**, **Editor**, or **Scanner** with granular permissions.
- 🔒 **Secure Opaque Tokens**: QR codes store cryptographically random UUID v4 tokens to protect attendee personal information.
- 📊 **Real-Time Attendee Dashboard**: Filter, search, and monitor attendee check-in counts and timeline stats live.
- ⚡ **Edge-Native Deployment**: Built on Next.js 16 (App Router) and deployed serverless via OpenNext to Cloudflare Pages/Workers.

---

## How It Works

1. **Create an Event**: Admins define event details, venue, date, capacity (`max_attendees`), and registration closure date.
2. **Share Registration Link**: Public attendees register via `/events/[slug]/register` with their Name, Email, Local Congregation, District, Zone, and Duty.
3. **Instant Ticket & Download**: Attendees receive an immediate QR code ticket rendered on-screen, ready to save or screenshot.
4. **Scan at the Door**: Door staff open the Scanner PWA, point the camera, and receive instant visual and sound feedback upon scan.

---

## Tech Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| **Framework** | Next.js 16 (App Router) + React 19 | Server Components & Server Actions |
| **Language** | TypeScript (Strict) | End-to-end type safety |
| **Styling** | Tailwind CSS v4 | Responsive utility styling |
| **Database** | Supabase (PostgreSQL) | Relational persistence & connection pooling |
| **Auth** | Supabase Auth (`@supabase/ssr`) | Google OAuth for event administrators |
| **ORM** | Drizzle ORM | Type-safe SQL builder & migrations |
| **Hosting** | Cloudflare Pages / Workers | Edge deployment via `@opennextjs/cloudflare` |
| **Audio** | Browser Web Audio API | Zero-asset tone synthesis for scanner feedback |
| **QR Code** | `qrcode` | Pure JavaScript canvas/PNG QR generation |
| **Scanner** | `html5-qrcode` | In-browser webcam QR scanning |
| **PWA** | Serwist | Progressive Web App manifest & service worker |

---

## Running Locally

### Prerequisites
- **Node.js** v20.0.0+
- **Docker** (for local PostgreSQL database)

### Steps

1. **Clone the repository:**
   ```bash
   git clone https://github.com/christian1202/FlowCheck.git
   cd FlowCheck
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Set up environment variables:**
   ```bash
   cp .env.example .env.local
   ```
   *Edit `.env.local` with your Supabase credentials.*

4. **Start local PostgreSQL (Docker):**
   ```bash
   docker-compose up -d
   ```

5. **Apply Database Migrations:**
   ```bash
   npm run db:push
   ```

6. **Start Development Server:**
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## Documentation

| Guide | Content |
|-------|---------|
| 📐 [Architecture](docs/architecture.md) | Edge system design, component diagram, tech choices |
| 🔄 [Data Flows](docs/data-flows.md) | Pre-registration flow & QR scanning sequence diagrams |
| 🗄️ [Database Schema](docs/database-schema.md) | PostgreSQL tables, Drizzle schema, indexes |
| 🚀 [Deployment Guide](docs/deployment.md) | Cloudflare Pages & OpenNext build setup |
| ✨ [Features Specifications](docs/features.md) | Detailed feature breakdown and user roles |
| 🛡️ [Security Architecture](docs/security.md) | Route access controls, token security & validation |
| 📋 [Project Roadmap](docs/project-phases.md) | Phase checklist and progress tracking |

---

## License

[MIT](LICENSE)
