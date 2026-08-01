import { useEffect, useState } from 'react';

/**
 * Hook to detect low-end devices or reduced motion preference
 * to dynamically scale down UI rendering complexity and processing weight.
 * (System Rules Pillar 4: React "Adaptive Power")
 */
export function useDevicePower(): boolean {
  const [isWeakDevice, setIsWeakDevice] = useState<boolean>(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const isWeak = (
      (navigator.hardwareConcurrency || 4) <= 4 ||
      // @ts-ignore - deviceMemory is available on Chrome/Edge
      (navigator.deviceMemory || 4) <= 4 ||
      window.matchMedia('(prefers-reduced-motion: reduce)').matches
    );

    setIsWeakDevice(isWeak);
  }, []);

  return isWeakDevice;
}
