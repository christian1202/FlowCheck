import type { OpenNextConfig } from '@opennextjs/cloudflare';

const config: OpenNextConfig = {
  default: {
    override: {
      wrapper: "cloudflare-node",
      converter: "edge",
      proxyExternalRequest: "fetch",
      // KV-backed incremental + tag cache so unstable_cache() / revalidateTag()
      // actually persist across requests on Cloudflare (the "dummy" cache was a
      // no-op: every request re-computed all queries and revalidation did nothing).
      // Bindings NEXT_INC_CACHE_KV / NEXT_TAG_CACHE_KV are declared in wrangler.toml.
      // These are LazyLoadedOverrides (functions returning the cache instance)
      // — the Cloudflare config validator only accepts "dummy" or a function here.
      incrementalCache: () => import("@opennextjs/cloudflare/overrides/incremental-cache/kv-incremental-cache").then((m) => m.default),
      tagCache: () => import("@opennextjs/cloudflare/overrides/tag-cache/kv-next-tag-cache").then((m) => m.default),
      queue: "dummy",
    },
  },
  edgeExternals: ["node:crypto"],
  middleware: {
    external: true,
    override: {
      wrapper: "cloudflare-edge",
      converter: "edge",
      proxyExternalRequest: "fetch",
      incrementalCache: "dummy",
      tagCache: "dummy",
      queue: "dummy",
    },
  },
};

export default config;
