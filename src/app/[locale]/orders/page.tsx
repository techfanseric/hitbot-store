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
      <div className="mx-auto w-[90%] max-w-[1280px] py-6 md:py-[40px]">
        <div className="mb-5 max-w-3xl md:mb-[24px]">
          <p className="text-text-muted text-sm font-medium">HITBOT Store</p>
          <h1 className="text-text-strong mt-1.5 text-2xl font-semibold md:mt-[8px] md:text-4xl">
            {t('title')}
          </h1>
          <p className="text-text-muted mt-1.5 hidden max-w-2xl text-sm leading-relaxed xl:block">
            {t('subtitle')}
          </p>
        </div>
        <OrderCenter />
      </div>
    </div>
  );
}
