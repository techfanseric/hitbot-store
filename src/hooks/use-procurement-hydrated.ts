'use client';

import { useEffect, useState } from 'react';
import { useProcurementStore } from '@/lib/procurement-store';

export function useProcurementHydrated() {
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const persistApi = useProcurementStore.persist;

    setHydrated(persistApi.hasHydrated());
    return persistApi.onFinishHydration(() => setHydrated(true));
  }, []);

  return hydrated;
}
