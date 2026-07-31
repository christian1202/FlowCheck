'use client';

import { useIsMounted } from '@/hooks/useIsMounted';

export default function LocalTimeDisplay({ date }: { date: string | Date }) {
  const mounted = useIsMounted();

  if (!mounted) {
    return <span>Loading time...</span>;
  }

  return <span>{new Date(date).toLocaleString()}</span>;
}
