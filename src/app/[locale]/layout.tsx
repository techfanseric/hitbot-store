import type { Metadata } from 'next';
import { getMessages, setRequestLocale } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { Providers } from '@/components/providers';
import { TopNav } from '@/components/store/top-nav';
import { SiteFooter } from '@/components/store/site-footer';
import { ConsultWidget } from '@/components/store/consult-widget';
import { routing } from '@/i18n/routing';

export const metadata: Metadata = {
  title: {
    default: 'HitbotOS Store',
    template: '%s · HitbotOS Store',
  },
  description: '机器人末端执行器一站式采购',
};

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  if (!routing.locales.includes(locale as (typeof routing.locales)[number])) {
    notFound();
  }

  setRequestLocale(locale);
  const messages = await getMessages();

  return (
    <html lang={locale} suppressHydrationWarning>
      <body className="bg-bg-app text-text-strong min-h-screen">
        <Providers locale={locale} messages={messages}>
          <div className="flex min-h-screen flex-col">
            <TopNav locale={locale} />
            <main className="flex-1">{children}</main>
            <ConsultWidget />
            <SiteFooter />
          </div>
        </Providers>
      </body>
    </html>
  );
}
