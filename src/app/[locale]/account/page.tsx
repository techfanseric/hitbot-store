import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { AccountPanel } from '@/components/store/account-panel';

export const metadata: Metadata = {
  title: '企业账号',
  description: 'HITBOT 官方商城企业账号入口，预留企业管理员、采购和工程师三级账号体系。',
  alternates: {
    canonical: '/store/account',
  },
  robots: {
    index: false,
    follow: false,
  },
};

interface AccountPageProps {
  params: Promise<{ locale: string }>;
}

export default async function AccountPage({ params }: AccountPageProps) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations('Account');

  return (
    <div className="bg-bg-app">
      <div className="mx-auto w-[90%] max-w-[1200px] py-6 md:py-[40px]">
        <div className="mb-5 max-w-3xl md:mb-[24px]">
          <p className="text-text-muted text-sm font-medium">HITBOT Store</p>
          <h1 className="text-text-strong mt-1.5 text-2xl font-semibold md:mt-[8px] md:text-4xl">
            {t('title')}
          </h1>
          <p className="text-text-muted mt-1.5 hidden max-w-2xl text-sm leading-relaxed sm:block md:mt-[8px] md:text-base">
            {t('subtitle')}
          </p>
        </div>
        <AccountPanel />
      </div>
    </div>
  );
}
