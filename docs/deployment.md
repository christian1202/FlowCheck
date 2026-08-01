# FlowCheck — Deployment Guide

This guide details deploying FlowCheck to a Cloudflare Worker via OpenNext and Supabase (PostgreSQL + Auth).

---

## Prerequisites

| Technology | Requirement |
|---|---|
| Node.js | v20.0.0+ |
| Next.js | 16.2.10 |
| Cloudflare CLI | Wrangler (`wrangler ^4.110.0`) |
| OpenNext Adapter | `@opennextjs/cloudflare ^1.20.1` |
| Database | Supabase PostgreSQL + Drizzle Kit |

---

## Environment Variables

Configure the following environment variables as Worker secrets. For local Worker development, place them in `.dev.vars` (which must not be committed).

```bash
# ── Supabase & PostgreSQL Connection ──
DATABASE_URL=postgresql://postgres:[PASSWORD]@db.[REF].supabase.co:6543/postgres?pgboiler=true
DIRECT_DATABASE_URL=postgresql://postgres:[PASSWORD]@db.[REF].supabase.co:5432/postgres
NEXT_PUBLIC_SUPABASE_URL=https://[REF].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOi...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOi...

# ── Application Configuration ──
NEXT_PUBLIC_APP_URL=https://flowcheck.flowcheck.workers.dev
```

---

## Build Scripts

The `package.json` provides scripts for building and deploying to Cloudflare Workers / Pages via OpenNext:

```json
{
  "scripts": {
    "dev": "NODE_OPTIONS='--max-old-space-size=8192' next dev",
    "build": "NODE_OPTIONS='--max-old-space-size=8192' next build",
    "build:cf": "NODE_OPTIONS='--max-old-space-size=8192' npx opennextjs-cloudflare build",
    "start:cf": "wrangler dev",
    "deploy:cf": "wrangler deploy",
    "db:push": "drizzle-kit push"
  }
}
```

---

## Cloudflare Worker Deployment Steps

### Required: bind Hyperdrive for PostgreSQL

Workers cannot use `DATABASE_URL` as a direct PostgreSQL TCP connection. Create a
Cloudflare Hyperdrive config pointing at the same Supabase PostgreSQL URL:

```bash
npx wrangler hyperdrive create flowcheck-db --connection-string="$DATABASE_URL"
```

Copy the returned config ID into `wrangler.toml`:

```toml
[[hyperdrive]]
binding = "HYPERDRIVE"
id = "<returned-config-id>"
```

The application uses `env.HYPERDRIVE.connectionString` in Cloudflare and falls
back to `DATABASE_URL` for local Node development. Do not deploy the Worker
without this binding; dashboard/database requests will return 500 or close.

1. **Build Cloudflare Bundle**:
   ```bash
   npm run build:cf
   ```

2. **Preview locally with Wrangler**:
   ```bash
   npm run start:cf
   ```

3. **Deploy the Worker**:
   ```bash
   npm run deploy:cf
   ```

The Worker configuration is in `wrangler.toml`; deploys use `.open-next/worker.js` and `.open-next/assets`. Do not use `wrangler pages deploy` for this project.

---

## Database Migration Commands

Apply schema migrations directly to Supabase using Drizzle Kit:

```bash
# Apply pending Drizzle schema changes
npm run db:push
```
