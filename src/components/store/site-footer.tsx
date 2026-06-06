'use client';

import Image from 'next/image';
import { ChevronDown } from 'lucide-react';
import type { ReactNode } from 'react';
import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';

export function SiteFooter() {
  const t = useTranslations('Footer');
  return (
    <footer className="bg-bg-surface">
      <div className="mx-auto w-[90%] max-w-[1600px] pt-8 pb-6 md:pt-[53px] md:pb-[33px]">
        <a
          href="https://www.hitbot.cc/"
          className="inline-flex items-center"
          aria-label="HITBOT 慧灵机器人 - 官网首页"
        >
          <Image
            src="/hitbot/logo.svg"
            alt="HITBOT 慧灵机器人"
            width={204}
            height={24}
            className="h-[24px] w-[204px]"
          />
        </a>
      </div>

      <div className="mx-auto w-[90%] max-w-[1600px]">
        <div className="grid grid-cols-1 gap-8 pb-8 md:grid-cols-12 md:gap-10 md:pb-10">
          <div className="md:col-span-5">
            <ul className="text-text-muted space-y-2.5 text-sm md:text-lg">
              <ContactRow icon="/hitbot/icon-phone.svg" label={t('serviceLabel')}>
                <span>{t('servicePhoneValue')}</span>
              </ContactRow>
              <ContactRow icon="/hitbot/icon-support.svg" label={t('supportLabel')}>
                <span>{t('supportPhoneValue')}</span>
              </ContactRow>
              <ContactRow icon="/hitbot/icon-mail.svg" label={t('emailLabel')}>
                <a href="mailto:hitbot@hitbot.cc" className="text-text-muted hover:text-brand-500">
                  {t('emailValue')}
                </a>
              </ContactRow>
              <ContactRow icon="/hitbot/icon-address.svg" label={t('addressLabel')}>
                <span>{t('addressValue')}</span>
              </ContactRow>
              <ContactRow icon="/hitbot/icon-link.svg" label={t('friendLinksLabel')}>
                <span className="text-text-muted">{t('friendLinksList')}</span>
              </ContactRow>
            </ul>
            <div className="mt-6 flex items-center gap-3 md:relative md:inline-flex">
              <span className="text-text-strong text-sm md:text-lg">{t('followUs')}</span>
              <a
                href="/hitbot/wechat-qr.jpg"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="微信公众号二维码"
                className="group relative inline-flex size-[32px] items-center justify-center rounded-sm text-text-muted transition-colors hover:text-brand-500 focus-visible:ring-2 focus-visible:ring-brand-500/35 focus-visible:outline-none"
              >
                <Image
                  src="/hitbot/icon-wechat.svg"
                  alt=""
                  width={21}
                  height={17}
                  className="h-[17px] w-[21px]"
                />
                <span className="pointer-events-none absolute bottom-full left-1/2 mb-3 hidden h-[128px] w-[128px] -translate-x-1/2 rounded-md bg-bg-elevated p-2 shadow-popover group-hover:block group-focus-visible:block">
                  <Image
                    src="/hitbot/wechat-qr.jpg"
                    alt={t('wechatQrAlt')}
                    width={112}
                    height={112}
                    className="size-[112px] object-cover"
                  />
                </span>
              </a>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-0 md:col-span-7 md:grid-cols-4 md:gap-8">
            <FooterColumn title={t('products')}>
              <FooterLink href="https://www.hitbot.cc/terminal-gripper/">
                {t('robotHand')}
              </FooterLink>
              <FooterLink href="https://www.hitbot.cc/4-axis-robots/">{t('robotArm')}</FooterLink>
              <FooterLink href="https://www.hitbot.cc/6-axis-collaborative/">
                {t('humanoid')}
              </FooterLink>
            </FooterColumn>
            <FooterColumn title={t('osSystem')}>
              <FooterLink href="#" disabled>
                {t('embodiedBrain')}
              </FooterLink>
              <FooterLink href="#" disabled>
                {t('simTraining')}
              </FooterLink>
              <FooterLink href="#" disabled>
                {t('skillLib')}
              </FooterLink>
              <FooterLink href="#" disabled>
                {t('embodiedMatrix')}
              </FooterLink>
            </FooterColumn>
            <FooterColumn title={t('industryAgents')}>
              <FooterLink href="https://www.hitbot.cc/medical-theme/">
                {t('percLearning')}
              </FooterLink>
              <FooterLink href="https://www.hitbot.cc/3c-industrial-page/">
                {t('planReasoning')}
              </FooterLink>
              <FooterLink href="https://www.hitbot.cc/tearobot/">{t('decisionExec')}</FooterLink>
            </FooterColumn>
            <FooterColumn title={t('about')}>
              <FooterLink href="https://www.hitbot.cc/about-us/">{t('companyIntro')}</FooterLink>
              <FooterLink href="https://www.hitbot.cc/application/">{t('news')}</FooterLink>
              <FooterLink href="https://www.hitbot.cc/about-contact.html">
                {t('contactUs')}
              </FooterLink>
            </FooterColumn>
          </div>
        </div>

        {/* 底部：版权 + 法律链接 */}
        <div className="border-divider text-text-muted flex min-h-[50px] flex-col gap-2 border-t pb-16 text-sm md:flex-row md:items-center md:justify-between md:pb-0 md:text-lg">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
            <span>{t('copyright')}</span>
            <span className="text-text-disabled">|</span>
            <a
              href="https://beian.miit.gov.cn/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-text-muted hover:text-brand-500"
            >
              {t('icp')}
            </a>
            <span className="text-text-disabled">|</span>
            <span>{t('byline')}</span>
          </div>
          <div className="flex flex-wrap items-center gap-x-5 gap-y-1">
            <a
              href="https://hitbot.cc/policy.html"
              target="_blank"
              rel="noopener noreferrer"
              className="text-text-muted hover:text-brand-500"
            >
              {t('privacyPolicy')}
            </a>
            <a
              href="https://hitbot.cc/disclaimer.html"
              target="_blank"
              rel="noopener noreferrer"
              className="text-text-muted hover:text-brand-500"
            >
              {t('disclaimer')}
            </a>
            <a
              href="https://hitbot.cc/sitemap.html"
              target="_blank"
              rel="noopener noreferrer"
              className="text-text-muted hover:text-brand-500"
            >
              {t('siteMap')}
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}

function ContactRow({
  icon,
  label,
  children,
}: {
  icon: string;
  label: string;
  children: ReactNode;
}) {
  return (
    <li className="flex items-start gap-2.5">
      <Image
        src={icon}
        alt=""
        width={16}
        height={16}
        className="text-text-muted mt-0.5 size-4 shrink-0 object-fill"
      />
      <span className="text-text-strong shrink-0">{label}</span>
      <span className="text-text-muted leading-[24px]">{children}</span>
    </li>
  );
}

function FooterColumn({ title, children }: { title: string; children: ReactNode }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="border-divider border-b py-1 md:border-b-0 md:py-0">
      <button
        type="button"
        className="text-text-strong flex min-h-11 w-full items-center justify-between text-sm font-normal md:hidden"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
      >
        <span>{title}</span>
        <ChevronDown className={cn('size-4 transition-transform', open && 'rotate-180')} />
      </button>
      <h3 className="text-text-strong mb-3 hidden text-lg font-normal whitespace-nowrap md:block">
        {title}
      </h3>
      <ul
        className={cn(
          'text-text-muted space-y-2.5 overflow-hidden text-sm leading-6 transition-[max-height,opacity] duration-200 md:block md:max-h-none md:text-lg md:leading-[29px] md:opacity-100',
          open ? 'max-h-64 pb-4 opacity-100' : 'max-h-0 opacity-0 md:pb-0',
        )}
      >
        {children}
      </ul>
    </div>
  );
}

function FooterLink({
  href,
  newTab,
  disabled,
  children,
}: {
  href: string;
  newTab?: boolean;
  disabled?: boolean;
  children: ReactNode;
}) {
  if (disabled) {
    return (
      <li>
        <span className="text-text-muted">{children}</span>
      </li>
    );
  }
  if (href.startsWith('http')) {
    return (
      <li>
        <a
          href={href}
          target={newTab ? '_blank' : undefined}
          rel={newTab ? 'noopener noreferrer' : undefined}
          className="text-text-muted hover:text-brand-500"
        >
          {children}
        </a>
      </li>
    );
  }
  return (
    <li>
      <a href={href} className="text-text-muted hover:text-brand-500">
        {children}
      </a>
    </li>
  );
}
