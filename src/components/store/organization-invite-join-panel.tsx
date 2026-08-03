'use client';

import { useMemo, useState } from 'react';
import type React from 'react';
import { Building2, CheckCircle2, Clock3, Link2Off, MessageSquareText } from 'lucide-react';
import Link from 'next/link';
import { useLocale, useTranslations } from 'next-intl';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAdminHydrated } from '@/hooks/use-admin-hydrated';
import { useProcurementHydrated } from '@/hooks/use-procurement-hydrated';
import { organizationInvitationAvailability, useAdminStore } from '@/lib/admin-store';
import { useProcurementStore } from '@/lib/procurement-store';

function normalizeToken(value: string) {
  return value.trim().toUpperCase();
}

function normalizePhone(value: string) {
  return value.trim().replace(/\D/g, '');
}

function maskedMemberName(phone: string) {
  return `成员 ${phone.slice(-4)}`;
}

export function OrganizationInviteJoinPanel({ token }: { token: string }) {
  const t = useTranslations('InvitationJoin');
  const locale = useLocale();
  const adminHydrated = useAdminHydrated();
  const procurementHydrated = useProcurementHydrated();
  const hydrated = adminHydrated && procurementHydrated;
  const invitations = useAdminStore((state) => state.organizationInvitations);
  const members = useAdminStore((state) => state.members);
  const joinOrganization = useAdminStore((state) => state.joinOrganizationFromInvitation);
  const account = useProcurementStore((state) => state.account);
  const registeredAccounts = useProcurementStore((state) => state.registeredAccounts);
  const enterMember = useProcurementStore((state) => state.enterMember);
  const invitation = useMemo(
    () => invitations.find((item) => item.token === normalizeToken(token)),
    [invitations, token],
  );
  const [phone, setPhone] = useState(account?.phone ?? '');
  const [verificationCode, setVerificationCode] = useState('');
  const [codeSent, setCodeSent] = useState(false);
  const [error, setError] = useState('');
  const [joinedCompany, setJoinedCompany] = useState('');
  const normalized = normalizePhone(phone);
  const phoneValid = /^1\d{10}$/.test(normalized);

  if (!hydrated) {
    return <section className="bg-bg-elevated min-h-[360px] rounded-lg" />;
  }

  if (joinedCompany) {
    return (
      <section className="bg-bg-elevated rounded-lg px-6 py-12 text-center md:px-10 md:py-16">
        <span className="bg-brand-soft text-brand-500 mx-auto flex size-14 items-center justify-center rounded-full">
          <CheckCircle2 className="size-7" />
        </span>
        <p className="text-brand-500 mt-5 text-sm font-semibold">{t('successEyebrow')}</p>
        <h1 className="text-text-strong mt-2 text-2xl font-semibold md:text-3xl">
          {t('successTitle', { company: joinedCompany })}
        </h1>
        <p className="text-text-muted mx-auto mt-3 max-w-lg text-sm leading-6">
          {t('successHint')}
        </p>
        <Button asChild variant="primary" className="mt-6">
          <Link href={`/${locale}/account`}>{t('enterOrganization')}</Link>
        </Button>
      </section>
    );
  }

  if (!invitation) return <UnavailableState reason="invalid-link" />;
  const availability = organizationInvitationAvailability(invitation);
  if (availability !== 'active') return <UnavailableState reason={availability} />;

  function sendCode() {
    if (!phoneValid) {
      setError(t('phoneError'));
      return;
    }
    setCodeSent(true);
    setError('');
  }

  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!phoneValid) {
      setError(t('phoneError'));
      return;
    }
    if (!codeSent || verificationCode.trim() !== '888888') {
      setError(t('codeError'));
      return;
    }

    const knownAccount =
      (account?.phone && normalizePhone(account.phone) === normalized ? account : undefined) ??
      registeredAccounts.find((item) => normalizePhone(item.phone) === normalized);
    const knownMember = members.find(
      (member) => normalizePhone(member.phone ?? '') === normalized && member.status === 'active',
    );
    const result = joinOrganization({
      token,
      phone: normalized,
      name: knownAccount?.name ?? knownMember?.name ?? maskedMemberName(normalized),
      email:
        knownAccount?.email ??
        knownMember?.email ??
        `${normalized.replace(/\D/g, '')}@phone.hitbot.local`,
    });

    if ((result.result === 'joined' || result.result === 'already-member') && result.memberId) {
      const member = useAdminStore.getState().members.find((item) => item.id === result.memberId);
      if (member) enterMember(member);
      setJoinedCompany(invitation?.companyName ?? '');
      return;
    }
    setError(t(`result.${result.result}`));
  }

  return (
    <section className="bg-bg-elevated overflow-hidden rounded-lg">
      <div className="bg-brand-soft px-5 py-6 md:px-8 md:py-7">
        <div className="flex items-start gap-3">
          <span className="bg-bg-elevated text-brand-500 flex size-10 shrink-0 items-center justify-center rounded-full">
            <Building2 className="size-5" />
          </span>
          <div className="min-w-0">
            <p className="text-brand-500 text-sm font-semibold">{t('eyebrow')}</p>
            <h1 className="text-text-strong mt-1 text-2xl font-semibold md:text-3xl">
              {t('title', { company: invitation.companyName })}
            </h1>
            <div className="mt-3 flex flex-wrap gap-2">
              <Badge variant="standard">{invitation.roleName}</Badge>
              <span className="text-text-muted inline-flex items-center gap-1.5 text-xs tabular-nums">
                <Clock3 className="size-3.5" />
                {t('expiresAt', {
                  time: new Intl.DateTimeFormat(locale === 'zh' ? 'zh-CN' : 'en-US', {
                    dateStyle: 'medium',
                    timeStyle: 'short',
                  }).format(new Date(invitation.expiresAt)),
                })}
              </span>
            </div>
          </div>
        </div>
      </div>

      <form className="grid gap-5 p-5 md:p-8" onSubmit={submit}>
        <div>
          <h2 className="text-text-strong text-lg font-semibold">{t('verifyTitle')}</h2>
          <p className="text-text-muted mt-1.5 text-sm leading-6">{t('verifyHint')}</p>
        </div>
        <label>
          <span className="text-text-muted mb-1.5 block text-sm">{t('phone')}</span>
          <Input
            value={phone}
            inputMode="tel"
            maxLength={20}
            autoComplete="tel"
            placeholder={t('phonePlaceholder')}
            onChange={(event) => {
              setPhone(event.target.value);
              setVerificationCode('');
              setCodeSent(false);
              setError('');
            }}
          />
        </label>
        <label>
          <span className="text-text-muted mb-1.5 block text-sm">{t('verificationCode')}</span>
          <div className="grid grid-cols-[minmax(0,1fr)_auto] gap-2">
            <Input
              value={verificationCode}
              inputMode="numeric"
              maxLength={6}
              autoComplete="one-time-code"
              placeholder={t('codePlaceholder')}
              onChange={(event) => {
                setVerificationCode(event.target.value);
                setError('');
              }}
            />
            <Button type="button" variant="secondary" disabled={!phoneValid} onClick={sendCode}>
              <MessageSquareText className="size-4" />
              <span>{codeSent ? t('resendCode') : t('sendCode')}</span>
            </Button>
          </div>
          {codeSent && (
            <span className="text-state-green-strong mt-1.5 block text-xs" role="status">
              {t('demoCodeHint')}
            </span>
          )}
        </label>
        {error && (
          <p className="text-state-danger text-sm" role="alert">
            {error}
          </p>
        )}
        <Button
          type="submit"
          variant="primary"
          className="w-full"
          disabled={!phoneValid || !verificationCode.trim()}
        >
          {t('verifyAndJoin')}
        </Button>
        <p className="text-text-muted text-center text-xs leading-5">{t('accountHint')}</p>
      </form>
    </section>
  );
}

function UnavailableState({
  reason,
}: {
  reason: 'invalid-link' | 'expired' | 'revoked' | 'exhausted';
}) {
  const t = useTranslations('InvitationJoin');
  return (
    <section className="bg-bg-elevated rounded-lg px-6 py-12 text-center md:px-10 md:py-16">
      <span className="bg-bg-control text-text-muted mx-auto flex size-14 items-center justify-center rounded-full">
        <Link2Off className="size-7" />
      </span>
      <h1 className="text-text-strong mt-5 text-2xl font-semibold">{t('unavailableTitle')}</h1>
      <p className="text-text-muted mx-auto mt-3 max-w-lg text-sm leading-6">
        {t(`unavailable.${reason}`)}
      </p>
      <p className="text-text-muted mt-5 text-xs">{t('unavailableHint')}</p>
    </section>
  );
}
