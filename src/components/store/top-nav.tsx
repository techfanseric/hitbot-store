'use client';

import {
  ArrowLeft,
  ArrowLeftRight,
  Building2,
  ChevronRight,
  ClipboardCheck,
  LogIn,
  LogOut,
  Menu,
  User,
} from 'lucide-react';
import Image from 'next/image';
import NextLink from 'next/link';
import { useTranslations } from 'next-intl';
import { useEffect, useState } from 'react';
import { CartBadge } from './cart-badge';
import { useProcurementHydrated } from '@/hooks/use-procurement-hydrated';
import { useProcurementStore } from '@/lib/procurement-store';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

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
  const [compactAccountMenu, setCompactAccountMenu] = useState(false);
  const [identityMenuOpen, setIdentityMenuOpen] = useState(false);
  const authHydrated = useProcurementHydrated();
  const {
    isAuthenticated,
    account,
    profile,
    purchaseContexts,
    activePurchaseContextId,
    activePurchaseContext,
    switchPurchaseContext,
    signOut,
  } = useProcurementStore();
  const accountRoleLabel = tAccount(profile.role);
  const effectiveAuthenticated = authHydrated && isAuthenticated;
  const accountLabel = effectiveAuthenticated
    ? (activePurchaseContext?.displayName ?? accountRoleLabel)
    : t('account');
  const accountMeta =
    effectiveAuthenticated && profile.contactName !== accountRoleLabel
      ? `${profile.contactName} · ${accountRoleLabel}`
      : accountRoleLabel;

  useEffect(() => {
    const query = window.matchMedia('(max-width: 639px)');
    const updateMenuMode = () => setCompactAccountMenu(query.matches);

    updateMenuMode();
    query.addEventListener('change', updateMenuMode);
    return () => query.removeEventListener('change', updateMenuMode);
  }, []);

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
          <nav
            className="hidden h-full items-center whitespace-nowrap lg:flex"
            aria-label={t('products')}
          >
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

            <DropdownMenu
              onOpenChange={(open) => {
                if (!open) setIdentityMenuOpen(false);
              }}
            >
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  aria-label={accountLabel}
                  className="inline-flex size-[40px] shrink-0 items-center justify-center text-[#333] transition-colors hover:text-[#A92424] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#A92424]"
                >
                  <User className="size-[18px] lg:size-[20px]" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" sideOffset={10} className="w-[300px] p-2">
                {effectiveAuthenticated && compactAccountMenu && identityMenuOpen ? (
                  <>
                    <DropdownMenuItem
                      className="text-sm"
                      onSelect={(event) => {
                        event.preventDefault();
                        setIdentityMenuOpen(false);
                      }}
                    >
                      <ArrowLeft className="size-4" />
                      <span>{t('backToAccountMenu')}</span>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuLabel>{t('switchContext')}</DropdownMenuLabel>
                    <DropdownMenuRadioGroup
                      value={activePurchaseContextId ?? undefined}
                      onValueChange={switchPurchaseContext}
                    >
                      {purchaseContexts.map((context) => (
                        <DropdownMenuRadioItem
                          key={context.contextId}
                          value={context.contextId}
                          className="items-start py-2 text-sm"
                        >
                          <span className="min-w-0">
                            <span className="block truncate font-medium">
                              {context.displayName}
                            </span>
                            <span className="text-text-muted block text-xs">
                              {context.kind === 'organization'
                                ? t('organizationContext')
                                : t('personalContext')}
                            </span>
                          </span>
                        </DropdownMenuRadioItem>
                      ))}
                    </DropdownMenuRadioGroup>
                  </>
                ) : effectiveAuthenticated ? (
                  <>
                    <div className="px-2 py-2">
                      <span className="text-text-strong block truncate text-sm font-semibold">
                        {account?.name ?? profile.contactName}
                      </span>
                      <span className="text-text-muted mt-1 block truncate text-xs">
                        {account?.email ?? accountMeta}
                      </span>
                    </div>
                    <DropdownMenuSeparator />
                    <DropdownMenuLabel>{t('currentContext')}</DropdownMenuLabel>
                    <div className="bg-bg-control mx-1 mb-2 flex items-center gap-3 rounded-md px-3 py-2.5">
                      <span className="bg-bg-elevated text-brand-500 flex size-8 shrink-0 items-center justify-center rounded-full">
                        {activePurchaseContext?.kind === 'organization' ? (
                          <Building2 className="size-4" />
                        ) : (
                          <User className="size-4" />
                        )}
                      </span>
                      <span className="min-w-0">
                        <span className="text-text-strong block truncate text-sm font-semibold">
                          {activePurchaseContext?.displayName ?? profile.companyName}
                        </span>
                        <span className="text-text-muted block truncate text-xs">
                          {activePurchaseContext?.kind === 'organization'
                            ? accountMeta
                            : t('personalContext')}
                        </span>
                      </span>
                    </div>
                    {purchaseContexts.length > 1 && (
                      <>
                        {compactAccountMenu ? (
                          <DropdownMenuItem
                            className="text-sm"
                            onSelect={(event) => {
                              event.preventDefault();
                              setIdentityMenuOpen(true);
                            }}
                          >
                            <ArrowLeftRight className="size-4" />
                            <span>{t('switchContext')}</span>
                            <ChevronRight className="ml-auto size-4" />
                          </DropdownMenuItem>
                        ) : (
                          <DropdownMenuSub>
                            <DropdownMenuSubTrigger className="text-sm">
                              <ArrowLeftRight className="size-4" />
                              <span>{t('switchContext')}</span>
                            </DropdownMenuSubTrigger>
                            <DropdownMenuSubContent
                              sideOffset={8}
                              alignOffset={-4}
                              className="max-h-[min(420px,var(--radix-dropdown-menu-content-available-height))] w-[300px] max-w-[calc(100vw-24px)] overflow-y-auto p-2"
                            >
                              <DropdownMenuLabel>{t('switchContext')}</DropdownMenuLabel>
                              <DropdownMenuRadioGroup
                                value={activePurchaseContextId ?? undefined}
                                onValueChange={switchPurchaseContext}
                              >
                                {purchaseContexts.map((context) => (
                                  <DropdownMenuRadioItem
                                    key={context.contextId}
                                    value={context.contextId}
                                    className="items-start py-2 text-sm"
                                  >
                                    <span className="min-w-0">
                                      <span className="block truncate font-medium">
                                        {context.displayName}
                                      </span>
                                      <span className="text-text-muted block text-xs">
                                        {context.kind === 'organization'
                                          ? t('organizationContext')
                                          : t('personalContext')}
                                      </span>
                                    </span>
                                  </DropdownMenuRadioItem>
                                ))}
                              </DropdownMenuRadioGroup>
                            </DropdownMenuSubContent>
                          </DropdownMenuSub>
                        )}
                        <DropdownMenuSeparator />
                      </>
                    )}
                    <DropdownMenuItem asChild className="text-sm">
                      <NextLink href={`/${locale}/account`}>
                        <User className="size-4" />
                        <span>{t('account')}</span>
                      </NextLink>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild className="text-sm">
                      <NextLink href={`/${locale}/orders`}>
                        <ClipboardCheck className="size-4" />
                        <span>{t('ordersCenter')}</span>
                      </NextLink>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem className="text-brand-500 text-sm" onSelect={signOut}>
                      <LogOut className="size-4" />
                      <span>{t('signOut')}</span>
                    </DropdownMenuItem>
                  </>
                ) : (
                  <>
                    <div className="px-2 py-2">
                      <span className="text-text-strong block text-sm font-semibold">
                        {t('account')}
                      </span>
                      <span className="text-text-muted mt-1 block text-xs">{t('signInHint')}</span>
                    </div>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild className="text-sm">
                      <NextLink href={`/${locale}/login`}>
                        <LogIn className="size-4" />
                        <span>{t('login')}</span>
                      </NextLink>
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>

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
