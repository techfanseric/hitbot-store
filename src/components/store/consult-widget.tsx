'use client';

import { Edit3, MessageCircle, Phone } from 'lucide-react';
import { useTranslations } from 'next-intl';

export function ConsultWidget() {
  const t = useTranslations('Consult');

  return (
    <div
      className="fixed right-4 bottom-6 z-40 flex flex-col items-end gap-2 md:right-5 md:bottom-6"
      aria-label={t('title')}
    >
      <a
        href="tel:15507540989"
        className="bg-brand-500 text-neutral-0 shadow-light hover:bg-brand-600 hover:text-neutral-0 group relative flex size-11 items-center justify-center rounded-md text-lg font-medium transition-[background-color,transform] active:translate-y-px md:size-12"
      >
        <Phone className="size-4" />
        <span className="bg-brand-500 text-neutral-0 shadow-light pointer-events-none absolute right-full mr-2 hidden min-h-10 items-center rounded-md px-3 opacity-0 transition-opacity group-hover:opacity-100 md:flex">
          {t('call')}
        </span>
      </a>
      <a
        href="https://hitbot.cc/about-contact.html"
        className="bg-bg-elevated text-text shadow-light hover:bg-bg-control-hover hover:text-text group relative hidden size-12 items-center justify-center rounded-md text-lg font-medium transition-[background-color,transform] active:translate-y-px md:flex"
      >
        <MessageCircle className="text-brand-500 size-4" />
        <span className="bg-bg-elevated text-text shadow-light pointer-events-none absolute right-full mr-2 flex min-h-10 items-center rounded-md px-3 opacity-0 transition-opacity group-hover:opacity-100">
          {t('online')}
        </span>
      </a>
      <a
        href="mailto:hitbot@hitbot.cc"
        className="bg-bg-elevated text-text shadow-light hover:bg-bg-control-hover hover:text-text group relative hidden size-12 items-center justify-center rounded-md text-lg font-medium transition-[background-color,transform] active:translate-y-px md:flex"
      >
        <Edit3 className="text-brand-500 size-4" />
        <span className="bg-bg-elevated text-text shadow-light pointer-events-none absolute right-full mr-2 flex min-h-10 items-center rounded-md px-3 opacity-0 transition-opacity group-hover:opacity-100">
          {t('message')}
        </span>
      </a>
    </div>
  );
}
