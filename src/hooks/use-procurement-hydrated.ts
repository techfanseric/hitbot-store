'use client';

import { useEffect, useState } from 'react';
import { useProcurementStore } from '@/lib/procurement-store';

export function useProcurementHydrated() {
  const [hydrated, setHydrated] = useState(() => useProcurementStore.persist.hasHydrated());

  useEffect(() => {
    setHydrated(useProcurementStore.persist.hasHydrated());
    return useProcurementStore.persist.onFinishHydration(() => setHydrated(true));
  }, []);

  return hydrated;
}
