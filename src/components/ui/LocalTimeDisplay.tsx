'use client';

import { useState, useEffect } from 'react';

export default function LocalTimeDisplay({ date }: { date: string | Date }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <span>Loading time...</span>;
  }

  return <span>{new Date(date).toLocaleString()}</span>;
}
