import type { Metadata } from 'next';
import Link from 'next/link';
import { Building2, CheckCircle2, ShieldCheck } from 'lucide-react';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { EnterpriseApplicationPanel } from '@/components/store/enterprise-application-panel';
import { StoreContainer } from '@/components/store/store-container';

export const metadata: Metadata = {
  title: '申请开通企业账号',
  description: '提交企业与联系人资料，申请开通 HITBOT 商城企业组织。',
  robots: { index: false, follow: false },
};

interface EnterpriseApplyPageProps {
  params: Promise<{ locale: string }>;
}

export default async function EnterpriseApplyPage({ params }: EnterpriseApplyPageProps) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations('EnterpriseApplication');

  return (
    <main className="bg-bg-app">
      <StoreContainer wide className="grid gap-7 py-8 lg:grid-cols-[300px_minmax(0,1fr)] lg:py-12">
        <aside className="lg:pt-3">
          <p className="text-brand-500 text-sm font-semibold">HITBOT Store</p>
          <h1 className="text-text-strong mt-2 text-3xl font-semibold md:text-4xl">
            {t('pageTitle')}
          </h1>
          <p className="text-text-muted mt-3 text-sm leading-6">{t('pageHint')}</p>
          <div className="border-divider mt-7 grid gap-5 border-t pt-6">
            {[
              [Building2, 'stepCompany'],
              [ShieldCheck, 'stepVerify'],
              [CheckCircle2, 'stepReview'],
            ].map(([Icon, key], index) => (
              <div key={key as string} className="flex items-start gap-3">
                <span className="bg-bg-elevated text-brand-500 flex size-8 shrink-0 items-center justify-center rounded-full text-xs font-semibold">
                  {index + 1}
                </span>
                <div>
                  <Icon className="text-text-muted size-4" />
                  <p className="text-text-strong mt-1.5 text-sm font-medium">
                    {t(key as 'stepCompany')}
                  </p>
                </div>
              </div>
            ))}
          </div>
          <Link
            href={`/${locale}/login`}
            className="text-text-muted hover:text-brand-500 mt-7 inline-flex min-h-11 items-center text-sm transition-colors"
          >
            {t('backToLogin')}
          </Link>
        </aside>
        <EnterpriseApplicationPanel />
      </StoreContainer>
    </main>
  );
}
