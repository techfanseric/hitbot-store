import { PropsWithChildren } from 'react';
import { initMiniStore } from '@/services/store';
import './app.scss';

initMiniStore();

export default function App({ children }: PropsWithChildren) {
  return children;
}
