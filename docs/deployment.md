# FlowCheck — Deployment Guide

This guide details deploying FlowCheck to a Cloudflare Worker via OpenNext and Supabase (PostgreSQL + Auth).

---

## Prerequisites

| Technology | Requirement |
|---|---|
| Node.js | v20.0.0+ |
| Next.js | 16.2.x |
| Cloudflare CLI | Wrangler (`wrangler ^4.110.0`) |
| OpenNext Adapter | `@opennextjs/cloudflare ^1.20.1` |
| Database | Supabase PostgreSQL + Drizzle Kit |
| Cloudflare KV | Two namespaces (incremental cache + tag cache) |

---

## Environment Variables

Configure the following environment variables as **Worker secrets** (`wrangler secret put NAME`). Local Worker development uses `.dev.vars` (which must not be committed).

```bash
# ── Supabase & PostgreSQL Connection ──
DATABASE_URL=postgresql://postgres:[PASSWORD]@[HOST].pooler.supabase.com:6543/postgres
DIRECT_DATABASE_URL=postgresql://postgres:[PASSWORD]@[HOST].supabase.com:5432/postgres
NEXT_PUBLIC_SUPABASE_URL=https://[REF].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOi...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOi...

# ── Application Configuration ──
NEXT_PUBLIC_APP_URL=https://flowcheck.flowcheck.workers.dev

# ── Operations ──
CRON_SECRET=                              # guards /api/cron/sync-sheets
BREVO_API_KEY=                            # email provider
```

> ⚠️ **`wrangler.toml` is gitignored** — it contains the local Supabase connection string with credentials. Keep your own copy; the KV namespace bindings below must exist in whatever config you deploy with.

---

## Build Scripts

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

## Required: Cloudflare KV Namespaces (caching)

The app uses a KV-backed incremental cache and tag cache so `unstable_cache()` and
`revalidateTag()` persist across requests (the previous `"dummy"` cache recomputed
every query per request). Create the namespaces once per Cloudflare account:

```bash
npx wrangler kv namespace create FLOWCHECK_INC_CACHE
npx wrangler kv namespace create FLOWCHECK_TAG_CACHE
# optional, for isolated local preview:
npx wrangler kv namespace create FLOWCHECK_INC_CACHE --preview
npx wrangler kv namespace create FLOWCHECK_TAG_CACHE --preview
```

Add the returned IDs to `wrangler.toml`:

```toml
[[kv_namespaces]]
binding = "NEXT_INC_CACHE_KV"
id = "<inc-cache-id>"
preview_id = "<inc-cache-preview-id>"

[[kv_namespaces]]
binding = "NEXT_TAG_CACHE_KV"
id = "<tag-cache-id>"
preview_id = "<tag-cache-preview-id>"
```

Binding names are consumed by `open-next.config.ts` (see `architecture.md` ADR-6).
Cache keys embed the build ID, so each deployment starts with a fresh cache — no
manual purge needed after deploys.

---

## Required: bind Hyperdrive for PostgreSQL

Workers cannot use `DATABASE_URL` as a direct PostgreSQL TCP connection. Create a
Cloudflare Hyperdrive config pointing at the same Supabase PostgreSQL URL:

```bash
npx wrangler hyperdrive create flowcheck-db --connection-string="$DIRECT_DATABASE_URL"
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

---

## Deploy Steps

1. **Build Cloudflare Bundle**:
   ```bash
   npm run build:cf
   ```

2. **Preview locally with Wrangler**:
   ```bash
   npm run start:cf
   ```

3. **Set secrets** (once per environment):
   ```bash
   wrangler secret put NEXT_PUBLIC_SUPABASE_URL
   wrangler secret put NEXT_PUBLIC_SUPABASE_ANON_KEY
   wrangler secret put NEXT_PUBLIC_APP_URL
   wrangler secret put DATABASE_URL
   wrangler secret put SUPABASE_SERVICE_ROLE_KEY
   wrangler secret put CRON_SECRET
   wrangler secret put BREVO_API_KEY
   ```

4. **Deploy the Worker**:
   ```bash
   npm run deploy:cf
   ```

The Worker configuration is in `wrangler.toml`; deploys use `.open-next/worker.js` and `.open-next/assets`. Do not use `wrangler pages deploy` for this project.

---

## Post-Deploy Notes

- **Caches reset automatically** — every build gets a fresh `BUILD_ID`, which is part of every cache key, so the new worker never reads old-build entries. First visitors regenerate them.
- **ISR register pages** (`/events/[slug]/register`) render on first request and are cached for ~30–60s; publish/update/delete invalidate them immediately via `revalidateTag`.
- Verify with `npm run start:cf` locally before deploying; check `wrangler kv key list --binding NEXT_INC_CACHE_KV` to confirm entries are being written.

---

## Database Migration Commands

Apply schema migrations directly to Supabase using Drizzle Kit:

```bash
npm run db:push
```
