import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { LoginPanel } from '@/components/store/login-panel';

export const metadata: Metadata = {
  title: '登录',
  description: 'HITBOT 企业账号登录入口。',
  alternates: {
    canonical: '/store/login',
  },
  robots: {
    index: false,
    follow: false,
  },
};

interface LoginPageProps {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ next?: string }>;
}

export default async function LoginPage({ params, searchParams }: LoginPageProps) {
  const { locale } = await params;
  const { next } = await searchParams;
  setRequestLocale(locale);
  const t = await getTranslations('Login');

  return (
    <div className="bg-bg-app">
      <div className="mx-auto w-[90%] max-w-[960px] py-[20px] md:py-[28px]">
        <div className="mb-[16px] text-center">
          <p className="text-brand-500 text-sm font-medium">HITBOT Store</p>
          <h1 className="text-text-strong mt-1.5 text-2xl font-semibold md:text-3xl">
            {t('title')}
          </h1>
        </div>
        <LoginPanel next={next} />
      </div>
    </div>
  );
}
