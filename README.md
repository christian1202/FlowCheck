# FlowCheck

<p align="center">
  <img src="public/images/flowcheck_logo_v2.png" alt="FlowCheck Logo" width="180"/>
</p>

<p align="center">
  <b>Modern, edge-native event attendance & pre-registration system powered by QR codes.</b>
</p>

<p align="center">
  <a href="https://github.com/christian1202/FlowCheck/actions"><img src="https://img.shields.io/badge/Next.js-16.2-black?style=for-the-badge&logo=next.js" alt="Next.js"></a>
  <a href="https://developers.cloudflare.com/workers/"><img src="https://img.shields.io/badge/Cloudflare-Workers-F38020?style=for-the-badge&logo=cloudflare&logoColor=white" alt="Cloudflare Workers"></a>
  <a href="https://supabase.com"><img src="https://img.shields.io/badge/Supabase-Database-3FCF8E?style=for-the-badge&logo=supabase&logoColor=white" alt="Supabase"></a>
  <a href="https://react.dev"><img src="https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react&logoColor=black" alt="React 19"></a>
  <a href="https://tailwindcss.com"><img src="https://img.shields.io/badge/Tailwind_CSS-v4-38BDF8?style=for-the-badge&logo=tailwindcss" alt="Tailwind CSS"></a>
</p>

<p align="center">
  <a href="#overview">Overview</a> •
  <a href="#key-features">Key Features</a> •
  <a href="#how-it-works">How It Works</a> •
  <a href="#tech-stack">Tech Stack</a> •
  <a href="#running-locally">Running Locally</a> •
  <a href="#deployment">Deployment</a> •
  <a href="#documentation">Documentation</a>
</p>

---

## 🌟 Overview

**FlowCheck** is an open-source, zero-configuration event pre-registration and QR check-in platform. Public attendees can pre-register for events without creating an account and instantly receive a downloadable QR ticket. Door staff can scan attendees using any smartphone or camera via an installable PWA with synthesized Web Audio feedback and real-time dashboard analytics.

FlowCheck is designed for a **$0/month free-forever stack** using serverless edge deployment with Cloudflare Workers via OpenNext and Supabase PostgreSQL.

---

## ✨ Key Features

- 🌐 **Public Pre-Registration**: Direct shareable link registration without mandatory user logins.
- 🎟️ **Instant QR Tickets**: Real-time on-screen QR generation with one-click PNG download & email retrieval.
- 📱 **Camera QR Scanner PWA**: High-speed in-browser scanner supporting webcams & mobile cameras.
- 🔊 **Web Audio API Feedback**: Zero-asset, synthesized audio chimes for valid, duplicate, and error scans.
- 👥 **Multi-Admin Team Roles**: Granular permissions for **Owner**, **Editor**, and **Scanner** roles.
- 🔒 **Cryptographic Safety**: QR codes encode opaque UUID v4 tokens to protect attendee personal information.
- 📊 **Live Analytics Dashboard**: Real-time attendee counts, timeline charts, and instant search.
- ⚡ **Edge-Native Speed**: Built with Next.js 16 (App Router) and deployed globally on Cloudflare.

---

## 🔄 How It Works

```
┌─────────────────┐       ┌─────────────────┐       ┌─────────────────┐       ┌─────────────────┐
│  1. Create      │ ───►  │  2. Public      │ ───►  │  3. Instant     │ ───►  │  4. Scan &      │
│     Event       │       │     Register    │       │     QR Ticket   │       │     Verify      │
└─────────────────┘       └─────────────────┘       └─────────────────┘       └─────────────────┘
```

1. **Create an Event**: Admins set event parameters, capacity, and registration schedules.
2. **Share Link**: Attendees complete a simple registration form with their personal/group details.
3. **Get QR Ticket**: An encrypted QR pass is rendered instantly on-screen for download or screenshot.
4. **Scan at the Door**: Door staff scan attendees with any browser or PWA for instant audio/visual verification.

---

## 🛠️ Tech Stack

| Layer | Technology | Purpose |
| :--- | :--- | :--- |
| **Framework** | Next.js 16 (App Router) + React 19 | Server Components & Server Actions |
| **Language** | TypeScript (Strict) | End-to-end type safety |
| **Styling** | Tailwind CSS v4 | Modern utility-first design system |
| **Database** | Supabase (PostgreSQL) | Relational persistence & connection pooling |
| **Auth** | Supabase Auth (`@supabase/ssr`) | Google OAuth for event administrators |
| **ORM** | Drizzle ORM | Type-safe SQL builder & migration tool |
| **Hosting** | Cloudflare Workers | Edge deployment via `@opennextjs/cloudflare` |
| **Audio** | Browser Web Audio API | Zero-asset tone synthesis for scanner feedback |
| **QR Code** | `qrcode` | Client/Server QR generation |
| **Scanner** | `html5-qrcode` | In-browser camera scanning |
| **PWA** | Serwist | Progressive Web App manifest & service worker |

---

## 💻 Running Locally

### Prerequisites
- **Node.js** v20+
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
   *Configure `.env.local` with your Supabase credentials.*

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
   Visit [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🚀 Deployment (Cloudflare Workers)

FlowCheck is optimized for **Cloudflare Workers** using `@opennextjs/cloudflare`.

### 1. Build for Cloudflare Edge
To bundle Next.js 16 into OpenNext Cloudflare worker assets:
```bash
npm run build:cf
```

### 2. Deploy to Cloudflare
Deploy the generated `.open-next` worker and static assets to Cloudflare:
```bash
npm run deploy:cf
```

> [!TIP]
> Ensure environment variables are set in Cloudflare secrets prior to deployment:
> ```bash
> npx wrangler secret put NEXT_PUBLIC_SUPABASE_URL
> npx wrangler secret put NEXT_PUBLIC_SUPABASE_ANON_KEY
> ```

---

## 📚 Documentation

| Guide | Description |
| :--- | :--- |
| 📐 [Architecture](docs/architecture.md) | Edge system design, component diagram, tech choices |
| 🔄 [Data Flows](docs/data-flows.md) | Pre-registration flow & QR scanning sequence diagrams |
| 🗄️ [Database Schema](docs/database-schema.md) | PostgreSQL tables, Drizzle schema, indexes |
| 🚀 [Deployment Guide](docs/deployment.md) | Cloudflare & OpenNext build configuration |
| ✨ [Features Specifications](docs/features.md) | Detailed feature breakdown and user roles |
| 🛡️ [Security Architecture](docs/security.md) | Route access controls, token security & validation |
| 📋 [Project Roadmap](docs/project-phases.md) | Phase checklist and progress tracking |

---

## 📄 License

[MIT](LICENSE)
