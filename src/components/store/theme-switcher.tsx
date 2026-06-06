'use client';

import { useEffect, useState } from 'react';
import { useTheme } from 'next-themes';
import { useTranslations } from 'next-intl';
import { Moon, Sun } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function ThemeSwitcher() {
  const { theme, setTheme } = useTheme();
  const t = useTranslations('Theme');
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const isDark = mounted && theme === 'dark';

  return (
    <Button
      variant="icon"
      size="icon"
      onClick={() => setTheme(isDark ? 'light' : 'dark')}
      aria-label={mounted ? t(isDark ? 'light' : 'dark') : t('light')}
      className="relative"
      suppressHydrationWarning
    >
      <Sun
        className={`size-[20px] rotate-0 transition-all dark:-rotate-90 ${mounted && isDark ? 'scale-0' : 'scale-100'}`}
      />
      <Moon
        className={`absolute size-[20px] rotate-90 transition-all dark:rotate-0 ${mounted && isDark ? 'scale-100' : 'scale-0'}`}
      />
    </Button>
  );
}
