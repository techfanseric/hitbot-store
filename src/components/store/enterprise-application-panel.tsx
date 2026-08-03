'use client';

import { useMemo, useState } from 'react';
import type React from 'react';
import { Building2, CheckCircle2, MessageSquareText, Send } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAdminHydrated } from '@/hooks/use-admin-hydrated';
import { useAdminStore } from '@/lib/admin-store';

function normalizedPhone(value: string) {
  return value.trim().replace(/\D/g, '');
}

export function EnterpriseApplicationPanel() {
  const t = useTranslations('EnterpriseApplication');
  const hydrated = useAdminHydrated();
  const requests = useAdminStore((state) => state.enterpriseAccessRequests);
  const submitRequest = useAdminStore((state) => state.submitEnterpriseAccessRequest);
  const [form, setForm] = useState({
    companyName: '',
    contactName: '',
    phone: '',
    verificationCode: '',
    email: '',
    intent: '',
  });
  const [codeSent, setCodeSent] = useState(false);
  const [error, setError] = useState('');
  const [submittedPhone, setSubmittedPhone] = useState('');
  const latestRequest = useMemo(
    () =>
      submittedPhone
        ? requests.find((request) => normalizedPhone(request.phone) === submittedPhone)
        : undefined,
    [requests, submittedPhone],
  );
  const phoneValid = /^1\d{10}$/.test(normalizedPhone(form.phone));
  const complete = Boolean(
    form.companyName.trim() &&
    form.contactName.trim() &&
    phoneValid &&
    form.verificationCode.trim() &&
    form.email.trim(),
  );

  function update(field: keyof typeof form, value: string) {
    setForm((current) => ({ ...current, [field]: value }));
    setError('');
    if (field === 'phone') {
      setCodeSent(false);
      setForm((current) => ({ ...current, phone: value, verificationCode: '' }));
    }
  }

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
    if (!complete || !hydrated) return;
    if (!codeSent || form.verificationCode.trim() !== '888888') {
      setError(t('codeError'));
      return;
    }
    submitRequest({
      companyName: form.companyName,
      contactName: form.contactName,
      phone: normalizedPhone(form.phone),
      email: form.email,
      intent: form.intent,
    });
    setSubmittedPhone(normalizedPhone(form.phone));
  }

  if (latestRequest) {
    return (
      <section className="bg-bg-elevated rounded-lg px-5 py-10 text-center md:px-10 md:py-14">
        <span className="bg-brand-soft text-brand-500 mx-auto flex size-12 items-center justify-center rounded-full">
          <CheckCircle2 className="size-6" />
        </span>
        <h2 className="text-text-strong mt-5 text-xl font-semibold">{t('successTitle')}</h2>
        <p className="text-text-muted mx-auto mt-2 max-w-lg text-sm leading-6">
          {t('successHint', { company: latestRequest.companyName })}
        </p>
        <div className="border-divider mx-auto mt-6 max-w-md border-t pt-5 text-left">
          <p className="text-text-muted text-xs">{t('contactPhone')}</p>
          <p className="text-text-strong mt-1 font-medium tabular-nums">{latestRequest.phone}</p>
        </div>
      </section>
    );
  }

  return (
    <section className="bg-bg-elevated rounded-lg p-5 md:p-8">
      <div className="flex items-start gap-3">
        <Building2 className="text-brand-500 mt-1 size-5 shrink-0" />
        <div>
          <h2 className="text-text-strong text-xl font-semibold">{t('formTitle')}</h2>
          <p className="text-text-muted mt-1.5 max-w-2xl text-sm leading-6">{t('formHint')}</p>
        </div>
      </div>

      <form className="mt-6 grid gap-5" onSubmit={submit}>
        <div className="grid gap-5 sm:grid-cols-2">
          <label>
            <span className="text-text-muted mb-1.5 block text-sm">{t('companyName')}</span>
            <Input
              value={form.companyName}
              maxLength={120}
              autoComplete="organization"
              placeholder={t('companyPlaceholder')}
              onChange={(event) => update('companyName', event.target.value)}
            />
          </label>
          <label>
            <span className="text-text-muted mb-1.5 block text-sm">{t('contactName')}</span>
            <Input
              value={form.contactName}
              maxLength={100}
              autoComplete="name"
              placeholder={t('contactPlaceholder')}
              onChange={(event) => update('contactName', event.target.value)}
            />
          </label>
          <label>
            <span className="text-text-muted mb-1.5 block text-sm">{t('phone')}</span>
            <Input
              value={form.phone}
              inputMode="tel"
              maxLength={20}
              autoComplete="tel"
              placeholder={t('phonePlaceholder')}
              onChange={(event) => update('phone', event.target.value)}
            />
          </label>
          <label>
            <span className="text-text-muted mb-1.5 block text-sm">{t('verificationCode')}</span>
            <div className="grid grid-cols-[minmax(0,1fr)_auto] gap-2">
              <Input
                value={form.verificationCode}
                inputMode="numeric"
                maxLength={6}
                autoComplete="one-time-code"
                placeholder={t('codePlaceholder')}
                onChange={(event) => update('verificationCode', event.target.value)}
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
          <label className="sm:col-span-2">
            <span className="text-text-muted mb-1.5 block text-sm">{t('email')}</span>
            <Input
              type="email"
              value={form.email}
              maxLength={160}
              autoComplete="email"
              placeholder={t('emailPlaceholder')}
              onChange={(event) => update('email', event.target.value)}
            />
          </label>
        </div>
        <label>
          <span className="text-text-muted mb-1.5 block text-sm">{t('intent')}</span>
          <textarea
            value={form.intent}
            maxLength={1000}
            placeholder={t('intentPlaceholder')}
            className="border-divider bg-bg-control text-text-strong placeholder:text-text-muted focus:border-brand-500 min-h-[96px] w-full resize-y rounded-md border px-3 py-2 text-sm leading-6 transition outline-none"
            onChange={(event) => update('intent', event.target.value)}
          />
        </label>
        {error && (
          <p className="text-state-danger text-sm" role="alert">
            {error}
          </p>
        )}
        <div className="flex justify-end">
          <Button type="submit" variant="primary" disabled={!hydrated || !complete}>
            <Send className="size-4" />
            <span>{t('submitApplication')}</span>
          </Button>
        </div>
      </form>
    </section>
  );
}
