'use client';

import { ClipboardCheck, LogIn, LogOut, Menu, User } from 'lucide-react';
import Image from 'next/image';
import NextLink from 'next/link';
import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { CartBadge } from './cart-badge';
import { useProcurementHydrated } from '@/hooks/use-procurement-hydrated';
import { useProcurementStore } from '@/lib/procurement-store';

interface TopNavProps {
  locale: string;
}

const officialNavItems = [
  {
    key: 'products',
    href: 'https://www.hitbot.cc/terminal-gripper/',
  },
  {
    key: 'resources',
    href: 'https://www.hitbot.cc/medical-theme/',
  },
  {
    key: 'about',
    href: 'https://www.hitbot.cc/about-contact.html',
  },
] as const;

export function TopNav({ locale }: TopNavProps) {
  const t = useTranslations('Nav');
  const tAccount = useTranslations('Account');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const authHydrated = useProcurementHydrated();
  const { isAuthenticated, profile, signOut } = useProcurementStore();
  const accountRoleLabel = tAccount(profile.role);
  const effectiveAuthenticated = authHydrated && isAuthenticated;
  const accountLabel = effectiveAuthenticated ? accountRoleLabel : t('account');
  const accountHref = effectiveAuthenticated ? `/${locale}/account` : `/${locale}/login`;
  const accountMeta =
    effectiveAuthenticated && profile.contactName !== accountRoleLabel
      ? `${profile.contactName} · ${accountRoleLabel}`
      : accountRoleLabel;

  return (
    <header className="bg-neutral-0 sticky top-0 z-50 border-b border-[#EFEFEF] text-[#333]">
      <div className="mx-auto flex h-[60px] w-[90%] max-w-[1840px] items-center justify-between px-0 lg:h-[100px] lg:w-[96%]">
        <NextLink
          href="https://www.hitbot.cc/"
          target="_blank"
          rel="nofollow"
          className="flex min-h-[40px] items-center"
          aria-label="HITBOT 慧灵机器人 - 官网首页"
        >
          <Image
            src="/hitbot/logo.svg"
            alt="HITBOT 慧灵机器人"
            width={198}
            height={26}
            priority
            className="h-[20px] w-[152px] md:h-[30px] md:w-[228px] lg:h-[26px] lg:w-[198px]"
          />
        </NextLink>

        <div className="ml-4 flex h-full items-center">
          <nav className="hidden h-full items-center whitespace-nowrap lg:flex" aria-label={t('products')}>
            {officialNavItems.map((item) => (
              <NextLink
                key={item.key}
                href={item.href}
                target="_blank"
                rel="nofollow"
                className="group relative mr-[40px] flex h-full items-center text-[16px] leading-[1.45] font-normal text-[#333] transition-colors hover:text-[#A92424] xl:mr-[60px]"
              >
                <span>{t(item.key)}</span>
                <span className="absolute bottom-[-1px] left-1/2 h-[2px] w-0 bg-[#A92424] transition-all duration-300 group-hover:left-0 group-hover:w-full" />
              </NextLink>
            ))}
          </nav>

          <div className="flex h-full items-center gap-[10px] lg:gap-[18px]">
            <NextLink
              href={`/${locale}/products`}
              aria-label={t('search')}
              title={t('search')}
              className="inline-flex size-[40px] items-center justify-center text-[#333] transition-colors hover:text-[#A92424]"
            >
              <Image
                src="/hitbot/icon-search.svg"
                alt=""
                width={20}
                height={20}
                className="size-[20px]"
              />
            </NextLink>

            <CartBadge
              className="size-[40px] rounded-none text-[#333] hover:bg-transparent hover:text-[#A92424]"
              iconClassName="size-[18px] lg:size-[20px]"
            />

            <div className="group relative">
              <NextLink
                href={accountHref}
                aria-label={accountLabel}
                className="inline-flex size-[40px] shrink-0 items-center justify-center text-[#333] transition-colors hover:text-[#A92424]"
              >
                <User className="size-[18px] lg:size-[20px]" />
              </NextLink>
              <div className="invisible absolute top-full right-0 z-50 pt-3 opacity-0 transition-opacity group-hover:visible group-hover:opacity-100 group-focus-within:visible group-focus-within:opacity-100">
                <div className="bg-bg-elevated text-text-strong shadow-popover w-[240px] rounded-md p-2">
                  {effectiveAuthenticated ? (
                    <>
                      <div className="px-2 py-2">
                        <span className="text-text-strong block truncate text-sm font-semibold">
                          {profile.companyName}
                        </span>
                        <span className="text-text-muted mt-1 block truncate text-xs">
                          {accountMeta}
                        </span>
                      </div>
                      <div className="bg-divider -mx-1 my-1 h-px" />
                      <NextLink
                        href={`/${locale}/account`}
                        className="hover:bg-bg-control-hover flex min-h-[36px] items-center gap-2 rounded-sm px-2 text-sm transition-colors"
                      >
                        <User className="size-4" />
                        <span>{t('account')}</span>
                      </NextLink>
                      <NextLink
                        href={`/${locale}/orders`}
                        className="hover:bg-bg-control-hover flex min-h-[36px] items-center gap-2 rounded-sm px-2 text-sm transition-colors"
                      >
                        <ClipboardCheck className="size-4" />
                        <span>{t('ordersCenter')}</span>
                      </NextLink>
                      <div className="bg-divider -mx-1 my-1 h-px" />
                      <button
                        type="button"
                        className="text-brand-500 hover:bg-brand-soft flex min-h-[36px] w-full items-center gap-2 rounded-sm px-2 text-left text-sm transition-colors"
                        onClick={signOut}
                      >
                        <LogOut className="size-4" />
                        <span>{t('signOut')}</span>
                      </button>
                    </>
                  ) : (
                    <>
                      <div className="px-2 py-2">
                        <span className="text-text-strong block text-sm font-semibold">
                          {t('account')}
                        </span>
                        <span className="text-text-muted mt-1 block text-xs">
                          {t('signInHint')}
                        </span>
                      </div>
                      <div className="bg-divider -mx-1 my-1 h-px" />
                      <NextLink
                        href={`/${locale}/login`}
                        className="hover:bg-bg-control-hover flex min-h-[36px] items-center gap-2 rounded-sm px-2 text-sm transition-colors"
                      >
                        <LogIn className="size-4" />
                        <span>{t('login')}</span>
                      </NextLink>
                    </>
                  )}
                </div>
              </div>
            </div>

            <button
              type="button"
              aria-label="Menu"
              aria-expanded={mobileMenuOpen}
              onClick={() => setMobileMenuOpen((open) => !open)}
              className="ml-1 inline-flex size-[40px] shrink-0 items-center justify-center text-[#333] lg:hidden"
            >
              <Menu className="size-6" />
            </button>
          </div>
        </div>
      </div>

      {mobileMenuOpen && (
        <nav className="bg-neutral-0 absolute top-full left-0 w-full border-b border-[#EFEFEF] px-[5vw] py-2 text-[#333] shadow-[0_5px_5px_rgba(0,0,0,0.08)] lg:hidden">
          {officialNavItems.map((item) => (
            <NextLink
              key={item.key}
              href={item.href}
              target="_blank"
              rel="nofollow"
              onClick={() => setMobileMenuOpen(false)}
              className="flex h-[50px] items-center border-t border-[#f1f1f1] text-[14px] first:border-t-0 hover:text-[#A92424]"
            >
              {t(item.key)}
            </NextLink>
          ))}
        </nav>
      )}
    </header>
  );
}
