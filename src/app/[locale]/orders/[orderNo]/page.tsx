import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { OrderDetailPanel } from '@/components/store/order-detail-panel';

export const metadata: Metadata = {
  title: '订单详情',
  description: 'HITBOT 官方商城企业订单详情，查看订单状态、BOM、收货、发票和付款信息。',
  alternates: {
    canonical: '/store/orders',
  },
  robots: {
    index: false,
    follow: false,
  },
};

interface OrderDetailPageProps {
  params: Promise<{ locale: string; orderNo: string }>;
}

export default async function OrderDetailPage({ params }: OrderDetailPageProps) {
  const { locale, orderNo } = await params;
  setRequestLocale(locale);
  const t = await getTranslations('Orders');

  return (
    <div className="bg-bg-app">
      <div className="mx-auto w-[90%] max-w-[1280px] py-8 md:py-10">
        <div className="mb-6 max-w-3xl">
          <p className="text-text-muted text-sm font-medium">HITBOT Store</p>
          <h1 className="text-text-strong mt-2 text-3xl font-semibold md:text-4xl">
            {t('detailTitle')}
          </h1>
          <p className="text-text-muted mt-2 max-w-2xl text-base leading-relaxed">
            {t('detailSubtitle')}
          </p>
        </div>
        <OrderDetailPanel orderNo={orderNo} />
      </div>
    </div>
  );
}
