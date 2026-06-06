import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { OrderCenter } from '@/components/store/order-center';

export const metadata: Metadata = {
  title: '订单',
  description: 'HITBOT 官方商城企业订单，查看官网商品订单和 Hitbot OS 来源订单的审批、付款和后续状态。',
  alternates: {
    canonical: '/store/orders',
  },
  robots: {
    index: false,
    follow: false,
  },
};

interface OrdersPageProps {
  params: Promise<{ locale: string }>;
}

export default async function OrdersPage({ params }: OrdersPageProps) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations('Orders');

  return (
    <div className="bg-bg-app">
      <div className="mx-auto w-[90%] max-w-[1280px] py-8 md:py-10">
        <div className="mb-6 max-w-3xl">
          <p className="text-text-muted text-sm font-medium">HITBOT Store</p>
          <h1 className="text-text-strong mt-2 text-3xl font-semibold md:text-4xl">
            {t('title')}
          </h1>
          <p className="text-text-muted mt-2 max-w-2xl text-base leading-relaxed">
            {t('subtitle')}
          </p>
        </div>
        <OrderCenter />
      </div>
    </div>
  );
}
