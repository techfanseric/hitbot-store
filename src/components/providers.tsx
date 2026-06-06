'use client';

import { NextIntlClientProvider } from 'next-intl';
import { Toaster } from '@/components/ui/sonner';
import { ThemeProvider } from '@/components/theme/theme-provider';

interface ProvidersProps {
  children: React.ReactNode;
  locale: string;
  messages: Record<string, unknown>;
}

export function Providers({ children, locale, messages }: ProvidersProps) {
  return (
    <NextIntlClientProvider locale={locale} messages={messages} timeZone="Asia/Shanghai">
      <ThemeProvider
        attribute="class"
        defaultTheme="light"
        themes={['light', 'dark']}
        enableSystem={false}
        disableTransitionOnChange
      >
        {children}
        <Toaster
          position="bottom-center"
          offset={{ bottom: 24 }}
          mobileOffset={{ bottom: 'calc(env(safe-area-inset-bottom) + 16px)', left: 12, right: 12 }}
          richColors
        />
      </ThemeProvider>
    </NextIntlClientProvider>
  );
}
