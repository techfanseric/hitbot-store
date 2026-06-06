'use client';

import { useMemo, useState } from 'react';
import type React from 'react';
import { LockKeyhole, LogIn, User } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAdminStore } from '@/lib/admin-store';
import { useProcurementStore } from '@/lib/procurement-store';
import type { EnterpriseRole } from '@/types/procurement';

interface RememberedMember {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: EnterpriseRole;
  enterpriseId?: string;
  companyName?: string;
  status: 'active';
}

const rememberedMemberFallback: RememberedMember[] = [
  {
    id: 'remembered-admin',
    name: '企业管理员',
    email: 'admin@customer.example',
    phone: '15507540989',
    role: 'admin',
    enterpriseId: 'ENT-HITBOT-CUSTOMER',
    companyName: '深圳智造装备有限公司',
    status: 'active',
  },
  {
    id: 'remembered-buyer',
    name: '采购负责人',
    email: 'buyer@customer.example',
    phone: '15507540989',
    role: 'buyer',
    enterpriseId: 'ENT-HITBOT-CUSTOMER',
    companyName: '深圳智造装备有限公司',
    status: 'active',
  },
  {
    id: 'remembered-engineer',
    name: '方案工程师',
    email: 'engineer@customer.example',
    phone: '17701551867',
    role: 'engineer',
    enterpriseId: 'ENT-HITBOT-CUSTOMER',
    companyName: '深圳智造装备有限公司',
    status: 'active',
  },
];

function safeNextPath(value: string | null): string | undefined {
  if (!value || !value.startsWith('/') || value.startsWith('//')) return undefined;
  if (/^\/(?:zh|en|store)(?:\/|$)/.test(value)) return value;
  return undefined;
}

export function LoginPanel({ next }: { next?: string }) {
  const t = useTranslations('Login');
  const locale = useLocale();
  const router = useRouter();
  const members = useAdminStore((state) => state.members);
  const enterMember = useProcurementStore((state) => state.enterMember);
  const rememberedMembers = useMemo(() => {
    const activeMembers = members.filter((member) => member.status === 'active');
    return activeMembers.length > 0 ? activeMembers : rememberedMemberFallback;
  }, [members]);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [usernameFocused, setUsernameFocused] = useState(false);
  const normalizedUsername = username.trim().toLowerCase();
  const selectedMember = rememberedMembers.find(
    (member) =>
      member.email.toLowerCase() === normalizedUsername ||
      member.name.toLowerCase() === normalizedUsername,
  );
  const filteredMembers = rememberedMembers.filter((member) => {
    if (!normalizedUsername) return true;
    return (
      member.email.toLowerCase().includes(normalizedUsername) ||
      member.name.toLowerCase().includes(normalizedUsername)
    );
  });
  const showRemembered = usernameFocused && filteredMembers.length > 0;
  const nextPath = safeNextPath(next ?? null);
  const canSubmit = Boolean(selectedMember && password.trim());

  function handleLogin(member: {
    name: string;
    email: string;
    phone?: string;
    role: EnterpriseRole;
    enterpriseId?: string;
    companyName?: string;
  }) {
    enterMember(member);
    router.push(nextPath ?? `/${locale}/account`);
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedMember || !canSubmit) return;
    handleLogin({
      name: selectedMember.name,
      email: selectedMember.email,
      phone: selectedMember.phone,
      role: selectedMember.role,
      enterpriseId: selectedMember.enterpriseId,
      companyName: selectedMember.companyName,
    });
  }

  return (
    <div className="mx-auto max-w-[480px]">
      <section className="bg-bg-elevated rounded-lg p-6">
        <form className="grid gap-5" onSubmit={handleSubmit}>
          <label className="relative">
            <span className="text-text-muted mb-2 block text-sm">{t('usernameLabel')}</span>
            <div className="relative">
              <User className="text-text-muted pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2" />
              <Input
                value={username}
                placeholder={t('usernamePlaceholder')}
                className="pl-9"
                autoComplete="username"
                onFocus={() => setUsernameFocused(true)}
                onBlur={() => setUsernameFocused(false)}
                onChange={(event) => setUsername(event.target.value)}
              />
            </div>

            {showRemembered && (
              <div className="bg-bg-elevated shadow-popover absolute top-full right-0 left-0 z-20 mt-2 rounded-md p-1">
                {filteredMembers.map((member) => (
                  <button
                    key={member.id}
                    type="button"
                    className="hover:bg-bg-control flex min-h-10 w-full flex-col items-start justify-center rounded-sm px-3 text-left transition-colors"
                    onMouseDown={(event) => event.preventDefault()}
                    onClick={() => {
                      setUsername(member.email);
                      setUsernameFocused(false);
                    }}
                  >
                    <span className="text-text-strong text-sm font-medium">{member.email}</span>
                    <span className="text-text-muted text-xs">{member.name}</span>
                  </button>
                ))}
              </div>
            )}
          </label>

          <label>
            <span className="text-text-muted mb-2 block text-sm">{t('passwordLabel')}</span>
            <div className="relative">
              <LockKeyhole className="text-text-muted pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2" />
              <Input
                type="password"
                value={password}
                placeholder={t('passwordPlaceholder')}
                className="pl-9"
                autoComplete="current-password"
                onChange={(event) => setPassword(event.target.value)}
              />
            </div>
          </label>

          <Button type="submit" variant="primary" className="w-full" disabled={!canSubmit}>
            <LogIn className="size-4" />
            <span>{t('enter')}</span>
          </Button>
        </form>
      </section>
    </div>
  );
}
