'use client';

import { useEffect, useState } from 'react';
import { useAdminStore } from '@/lib/admin-store';

export function useAdminHydrated() {
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const persistApi = useAdminStore.persist;

    setHydrated(persistApi.hasHydrated());
    return persistApi.onFinishHydration(() => setHydrated(true));
  }, []);

  return hydrated;
}
