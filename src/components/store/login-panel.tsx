'use client';

import { useMemo, useState } from 'react';
import type React from 'react';
import { Building2, LockKeyhole, LogIn, Mail, Phone, User, UserPlus } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAdminHydrated } from '@/hooks/use-admin-hydrated';
import { useProcurementHydrated } from '@/hooks/use-procurement-hydrated';
import { useAdminStore } from '@/lib/admin-store';
import { useProcurementStore } from '@/lib/procurement-store';
import { cn } from '@/lib/utils';

type PanelMode = 'login' | 'register';

function safeNextPath(value: string | null): string | undefined {
  if (!value || !value.startsWith('/') || value.startsWith('//')) return undefined;
  if (/^\/(?:zh|en|store)(?:\/|$)/.test(value)) return value;
  return undefined;
}

export function LoginPanel({ next }: { next?: string }) {
  const t = useTranslations('Login');
  const locale = useLocale();
  const router = useRouter();
  const adminHydrated = useAdminHydrated();
  const procurementHydrated = useProcurementHydrated();
  const storesHydrated = adminHydrated && procurementHydrated;
  const members = useAdminStore((state) => state.members);
  const registeredAccounts = useProcurementStore((state) => state.registeredAccounts);
  const loginAccount = useProcurementStore((state) => state.loginAccount);
  const registerPersonalAccount = useProcurementStore((state) => state.registerPersonalAccount);
  const [mode, setMode] = useState<PanelMode>('login');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [usernameFocused, setUsernameFocused] = useState(false);
  const [loginError, setLoginError] = useState('');
  const [registrationError, setRegistrationError] = useState('');
  const [registration, setRegistration] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmation: '',
  });
  const nextPath = safeNextPath(next ?? null);
  const normalizedUsername = username.trim().toLowerCase();

  const rememberedAccounts = useMemo(() => {
    const groups = new Map<
      string,
      { id: string; name: string; email: string; organizationNames: string[] }
    >();

    for (const member of members.filter((item) => item.status === 'active')) {
      const email = member.email.trim().toLowerCase();
      const current = groups.get(email);
      const organizationName = member.companyName ?? t('organizationFallback');
      if (current) {
        if (!current.organizationNames.includes(organizationName)) {
          current.organizationNames.push(organizationName);
        }
      } else {
        groups.set(email, {
          id: member.id,
          name: member.name,
          email,
          organizationNames: [organizationName],
        });
      }
    }

    for (const account of registeredAccounts) {
      const email = account.email.trim().toLowerCase();
      if (!groups.has(email)) {
        groups.set(email, {
          id: account.id,
          name: account.name,
          email,
          organizationNames: [],
        });
      }
    }

    return Array.from(groups.values());
  }, [members, registeredAccounts, t]);

  const selectedAccount = rememberedAccounts.find(
    (account) =>
      account.email === normalizedUsername ||
      account.name.trim().toLowerCase() === normalizedUsername,
  );
  const filteredAccounts = rememberedAccounts.filter((account) => {
    if (!normalizedUsername) return true;
    return (
      account.email.includes(normalizedUsername) ||
      account.name.toLowerCase().includes(normalizedUsername)
    );
  });
  const showRemembered = usernameFocused && filteredAccounts.length > 0;

  function finishAuthentication() {
    router.push(nextPath ?? `/${locale}/account`);
  }

  function handleLogin(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoginError('');
    if (!storesHydrated || !password.trim() || !loginAccount(username)) {
      setLoginError(t('loginError'));
      return;
    }
    finishAuthentication();
  }

  function handleRegistration(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setRegistrationError('');
    if (
      !storesHydrated ||
      !registration.name.trim() ||
      !registration.email.trim() ||
      !registration.phone.trim() ||
      registration.password.length < 6
    ) {
      setRegistrationError(t('registrationInvalid'));
      return;
    }
    if (registration.password !== registration.confirmation) {
      setRegistrationError(t('passwordMismatch'));
      return;
    }

    const result = registerPersonalAccount({
      name: registration.name,
      email: registration.email,
      phone: registration.phone,
    });
    if (result === 'email-exists') {
      setRegistrationError(t('emailExists'));
      return;
    }
    if (result !== 'success') {
      setRegistrationError(t('registrationInvalid'));
      return;
    }
    finishAuthentication();
  }

  function updateRegistration(field: keyof typeof registration, value: string) {
    setRegistration((current) => ({ ...current, [field]: value }));
  }

  return (
    <div className="mx-auto max-w-[460px]">
      <div className="bg-bg-control mb-4 grid grid-cols-2 rounded-lg p-1">
        {(['login', 'register'] as const).map((item) => (
          <button
            key={item}
            type="button"
            className={cn(
              'min-h-10 rounded-md px-4 text-sm font-semibold transition-colors',
              mode === item
                ? 'bg-bg-elevated text-text-strong shadow-sm'
                : 'text-text-muted hover:text-text-strong',
            )}
            aria-pressed={mode === item}
            onClick={() => {
              setMode(item);
              setLoginError('');
              setRegistrationError('');
            }}
          >
            {t(item === 'login' ? 'loginTab' : 'registerTab')}
          </button>
        ))}
      </div>

      <section className="bg-bg-elevated rounded-lg p-4 md:p-5">
        {mode === 'login' ? (
          <form className="grid gap-4" onSubmit={handleLogin}>
            <div>
              <h2 className="text-text-strong text-lg font-semibold">{t('loginTitle')}</h2>
              <p className="text-text-muted mt-1 text-sm leading-6">{t('loginDescription')}</p>
            </div>

            <label className="relative">
              <span className="text-text-muted mb-1.5 block text-sm">{t('usernameLabel')}</span>
              <div className="relative">
                <User className="text-text-muted pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2" />
                <Input
                  value={username}
                  placeholder={t('usernamePlaceholder')}
                  className="pl-10"
                  autoComplete="username"
                  onFocus={() => setUsernameFocused(true)}
                  onBlur={() => setUsernameFocused(false)}
                  onChange={(event) => setUsername(event.target.value)}
                />
              </div>

              {showRemembered && (
                <div className="bg-bg-elevated shadow-popover absolute top-full right-0 left-0 z-20 mt-2 max-h-60 overflow-y-auto rounded-md p-1">
                  {filteredAccounts.map((account) => (
                    <button
                      key={account.id}
                      type="button"
                      className="hover:bg-bg-control flex min-h-12 w-full items-center gap-3 rounded-sm px-3 text-left transition-colors"
                      onMouseDown={(event) => event.preventDefault()}
                      onClick={() => {
                        setUsername(account.email);
                        setUsernameFocused(false);
                      }}
                    >
                      <span className="bg-brand-soft text-brand-500 flex size-8 shrink-0 items-center justify-center rounded-full">
                        {account.organizationNames.length ? (
                          <Building2 className="size-4" />
                        ) : (
                          <User className="size-4" />
                        )}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="text-text-strong block truncate text-sm font-medium">
                          {account.email}
                        </span>
                        <span className="text-text-muted block truncate text-xs">
                          {account.organizationNames.length
                            ? t('organizationCount', {
                                count: account.organizationNames.length,
                              })
                            : t('personalAccount')}
                        </span>
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </label>

            <label>
              <span className="text-text-muted mb-1.5 block text-sm">{t('passwordLabel')}</span>
              <div className="relative">
                <LockKeyhole className="text-text-muted pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2" />
                <Input
                  type="password"
                  value={password}
                  placeholder={t('passwordPlaceholder')}
                  className="pl-10"
                  autoComplete="current-password"
                  onChange={(event) => setPassword(event.target.value)}
                />
              </div>
            </label>

            {loginError && <p className="text-brand-500 text-sm">{loginError}</p>}

            <Button
              type="submit"
              variant="primary"
              className="w-full"
              disabled={!storesHydrated || !selectedAccount || !password.trim()}
            >
              <LogIn className="size-4" />
              <span>{t('enter')}</span>
            </Button>
            <p className="text-text-muted text-center text-xs leading-5">{t('enterpriseHint')}</p>
          </form>
        ) : (
          <form className="grid gap-4" onSubmit={handleRegistration}>
            <div>
              <h2 className="text-text-strong text-lg font-semibold">{t('registerTitle')}</h2>
              <p className="text-text-muted mt-1 text-sm leading-6">{t('registerDescription')}</p>
            </div>

            {(
              [
                ['name', 'nameLabel', 'namePlaceholder', User, 'name'],
                ['email', 'emailLabel', 'emailPlaceholder', Mail, 'email'],
                ['phone', 'phoneLabel', 'phonePlaceholder', Phone, 'tel'],
              ] as const
            ).map(([field, label, placeholder, Icon, autoComplete]) => (
              <label key={field}>
                <span className="text-text-muted mb-1.5 block text-sm">{t(label)}</span>
                <div className="relative">
                  <Icon className="text-text-muted pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2" />
                  <Input
                    value={registration[field]}
                    placeholder={t(placeholder)}
                    className="pl-10"
                    autoComplete={autoComplete}
                    onChange={(event) => updateRegistration(field, event.target.value)}
                  />
                </div>
              </label>
            ))}

            {(
              [
                ['password', 'passwordLabel', 'newPasswordPlaceholder', 'new-password'],
                [
                  'confirmation',
                  'confirmPasswordLabel',
                  'confirmPasswordPlaceholder',
                  'new-password',
                ],
              ] as const
            ).map(([field, label, placeholder, autoComplete]) => (
              <label key={field}>
                <span className="text-text-muted mb-1.5 block text-sm">{t(label)}</span>
                <div className="relative">
                  <LockKeyhole className="text-text-muted pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2" />
                  <Input
                    type="password"
                    value={registration[field]}
                    placeholder={t(placeholder)}
                    className="pl-10"
                    autoComplete={autoComplete}
                    onChange={(event) => updateRegistration(field, event.target.value)}
                  />
                </div>
              </label>
            ))}

            {registrationError && <p className="text-brand-500 text-sm">{registrationError}</p>}

            <Button type="submit" variant="primary" className="w-full" disabled={!storesHydrated}>
              <UserPlus className="size-4" />
              <span>{t('createAccount')}</span>
            </Button>
            <p className="text-text-muted text-center text-xs leading-5">{t('registrationHint')}</p>
          </form>
        )}
      </section>

      <div className="border-divider mt-5 flex flex-col gap-3 border-t pt-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <Building2 className="text-brand-500 mt-0.5 size-5 shrink-0" />
          <div>
            <p className="text-text-strong text-sm font-semibold">{t('enterpriseApplyTitle')}</p>
            <p className="text-text-muted mt-1 text-xs leading-5">{t('enterpriseApplyHint')}</p>
          </div>
        </div>
        <Button asChild variant="secondary" className="shrink-0">
          <Link href={`/${locale}/enterprise/apply`}>{t('enterpriseApplyCta')}</Link>
        </Button>
      </div>
    </div>
  );
}
