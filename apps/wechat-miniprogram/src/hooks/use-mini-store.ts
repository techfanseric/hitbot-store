import { useEffect, useState } from 'react';
import { getMiniState, subscribeMiniStore, type MiniAppState } from '@/services/store';

export function useMiniStore(): MiniAppState {
  const [snapshot, setSnapshot] = useState(getMiniState());

  useEffect(() => {
    return subscribeMiniStore(() => setSnapshot(getMiniState()));
  }, []);

  return snapshot;
}
