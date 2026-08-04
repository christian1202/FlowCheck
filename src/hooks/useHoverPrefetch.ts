'use client';

import { useCallback, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { PrefetchKind } from 'next/dist/client/components/router-reducer/router-reducer-types';

/**
 * Prefetches a route and warms its server-side data caches the first time the
 * user hovers, focuses, or presses down on a link, so navigation feels instant.
 *
 * - `router.prefetch(href, { kind: 'full' })` forces a full RSC prefetch
 *   (Link's default only fetches the static shell for dynamic routes).
 * - `warm()` is a server action that runs the target page's data queries into
 *   `unstable_cache` entries, which the subsequent navigation render then hits.
 *
 * Fires at most once per link per page load; errors are swallowed — prefetching
 * is an optimization, never a dependency of navigation.
 */
export function useHoverPrefetch(href: string, warm?: () => Promise<void>) {
  const router = useRouter();
  const firedRef = useRef(false);
  const warmRef = useRef(warm);

  // Keep the latest warm action without recreating the trigger handlers, so
  // memoized parents (e.g. EventCard's custom comparator) never re-render
  // because of us.
  useEffect(() => {
    warmRef.current = warm;
  }, [warm]);

  const trigger = useCallback(() => {
    if (firedRef.current) return;
    firedRef.current = true;

    try {
      router.prefetch(href, { kind: PrefetchKind.FULL });
    } catch {
      // best-effort only
    }

    const fn = warmRef.current;
    if (fn) {
      // Fire-and-forget; a warm failure must never surface or block navigation.
      Promise.resolve(fn()).catch(() => {});
    }
  }, [href, router]);

  return {
    onMouseEnter: trigger,
    onFocus: trigger,
    onPointerDown: trigger, // covers touch (no mouseenter) and click intent
  };
}
