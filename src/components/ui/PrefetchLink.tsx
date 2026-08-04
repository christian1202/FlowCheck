'use client';

import Link from 'next/link';
import type { ComponentProps, FocusEventHandler, MouseEventHandler, PointerEventHandler } from 'react';
import { useHoverPrefetch } from '@/hooks/useHoverPrefetch';

type PrefetchLinkProps = Omit<ComponentProps<typeof Link>, 'href'> & {
  href: string;
  /**
   * Server action that runs the target page's data queries into `unstable_cache`
   * on first hover/focus/pointer-down. Optional — omit for routes without
   * heavy data (the built-in Link prefetch still fires).
   */
  warm?: () => Promise<void>;
};

/**
 * `next/link` that additionally prefetches the target route and warms its
 * server-side data caches on first hover/focus/pointer-down.
 *
 * Do NOT pass `prefetch={false}` — this component relies on Link's default
 * prefetch plus the imperative full prefetch in useHoverPrefetch.
 */
export default function PrefetchLink({
  href,
  warm,
  onMouseEnter,
  onFocus,
  onPointerDown,
  ...rest
}: PrefetchLinkProps) {
  const handlers = useHoverPrefetch(href, warm);

  const handleMouseEnter: MouseEventHandler<HTMLAnchorElement> = (e) => {
    handlers.onMouseEnter();
    onMouseEnter?.(e);
  };
  const handleFocus: FocusEventHandler<HTMLAnchorElement> = (e) => {
    handlers.onFocus();
    onFocus?.(e);
  };
  const handlePointerDown: PointerEventHandler<HTMLAnchorElement> = (e) => {
    handlers.onPointerDown();
    onPointerDown?.(e);
  };

  return (
    <Link
      {...rest}
      href={href}
      onMouseEnter={handleMouseEnter}
      onFocus={handleFocus}
      onPointerDown={handlePointerDown}
    />
  );
}
