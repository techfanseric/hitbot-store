import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { CheckoutSummary } from '@/components/store/checkout-summary';

export const metadata: Metadata = {
  title: '确认项目清单',
  description: '确认 HITBOT 官方商城项目 BOM 清单，后续接入企业账号、收货地址、付款和发票流程。',
  alternates: {
    canonical: '/store/cart',
  },
  robots: {
    index: false,
    follow: false,
  },
};

interface CheckoutPageProps {
  params: Promise<{ locale: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

function firstParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function toProjectId(seed: string | undefined) {
  const normalized = seed
    ?.trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');

  return `os-${normalized || 'handoff'}`;
}

export default async function CheckoutPage({ params, searchParams }: CheckoutPageProps) {
  const { locale } = await params;
  const query = await searchParams;
  setRequestLocale(locale);
  const t = await getTranslations('Checkout');
  const from = firstParam(query.from);
  const projectName = firstParam(query.project);
  const projectId = firstParam(query.projectId);
  const osHandoff =
    from === 'os'
      ? {
          projectId: projectId ?? toProjectId(projectName),
          projectName,
        }
      : null;

  return (
    <div className="bg-bg-app">
      <div className="mx-auto w-[90%] max-w-[1400px] py-8 md:py-10">
        <div className="mb-6 max-w-3xl">
          <p className="text-text-muted text-sm font-medium">HITBOT Store</p>
          <h1 className="text-text-strong mt-2 text-3xl font-semibold md:text-4xl">
            {t('title')}
          </h1>
          <p className="text-text-muted mt-2 max-w-2xl text-base leading-relaxed">
            {t('subtitle')}
          </p>
        </div>
        <CheckoutSummary osHandoff={osHandoff} />
      </div>
    </div>
  );
}
