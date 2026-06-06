import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { SITE_ORIGIN } from '@/lib/store-paths';
import './globals.css';

export const metadata: Metadata = {
  metadataBase: new URL(SITE_ORIGIN),
  applicationName: 'HitbotOS Store',
  title: {
    default: 'HitbotOS Store',
    template: '%s · HitbotOS Store',
  },
  description: '机器人末端执行器一站式采购',
  openGraph: {
    siteName: 'HitbotOS Store',
    type: 'website',
    locale: 'zh_CN',
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return children;
}
