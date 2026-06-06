'use client';

import { useMemo } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import Link from 'next/link';
import { ArrowLeft, ClipboardCheck, LogIn } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DEFAULT_ENTERPRISE_ID, useProcurementStore } from '@/lib/procurement-store';
import { formatPrice } from '@/lib/format';
import { OrderRow } from './account-panel';
import type { EnterpriseProfile, LocalOrderSnapshot } from '@/types/procurement';

interface OrderDetailPanelProps {
  orderNo: string;
}

function canApproveOrder(profile: EnterpriseProfile, order: LocalOrderSnapshot) {
  if ((order.enterpriseId ?? DEFAULT_ENTERPRISE_ID) !== profile.enterpriseId) return false;
  if (profile.role === 'engineer' || order.status !== 'pending-approval') return false;
  if (profile.role === 'admin') return true;
  if (order.approvalMode === 'admin-review') return false;
  if (!order.approver) return false;

  return order.approver === profile.contactName || order.approver === profile.email;
}

function formatDate(value: string, locale: string): string {
  return new Intl.DateTimeFormat(locale === 'zh' ? 'zh-CN' : 'en-US', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value));
}

export function OrderDetailPanel({ orderNo }: OrderDetailPanelProps) {
  const t = useTranslations('Orders');
  const tAccount = useTranslations('Account');
  const locale = useLocale();
  const { isAuthenticated, profile, orders, approveLocalOrder, markLocalOrderPaid } =
    useProcurementStore();
  const decodedOrderNo = decodeURIComponent(orderNo);
  const order = useMemo(
    () =>
      isAuthenticated
        ? orders.find(
            (item) =>
              item.orderNo === decodedOrderNo &&
              (item.enterpriseId ?? DEFAULT_ENTERPRISE_ID) === profile.enterpriseId,
          )
        : undefined,
    [decodedOrderNo, isAuthenticated, orders, profile.enterpriseId],
  );

  if (!isAuthenticated) {
    return (
      <section className="bg-bg-elevated rounded-lg p-6">
        <div className="flex max-w-2xl flex-col gap-5">
          <Badge variant="secondary">{t('signedOutBadge')}</Badge>
          <div>
            <h2 className="text-text-strong text-2xl font-semibold">{t('authTitle')}</h2>
            <p className="text-text-muted mt-3 text-lg leading-relaxed">{t('authHint')}</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button variant="primary" asChild>
              <Link
                href={`/store/login?next=${encodeURIComponent(
                  `/store/orders/${encodeURIComponent(decodedOrderNo)}`,
                )}`}
              >
                <LogIn className="size-4" />
                <span>{tAccount('signIn')}</span>
              </Link>
            </Button>
            <Button variant="secondary" asChild>
              <Link href="/store/orders">
                <ArrowLeft className="size-4" />
                <span>{t('backToOrders')}</span>
              </Link>
            </Button>
          </div>
        </div>
      </section>
    );
  }

  if (!order) {
    return (
      <section className="bg-bg-elevated rounded-lg p-6">
        <div className="flex max-w-2xl flex-col gap-5">
          <Badge variant="secondary">{decodedOrderNo}</Badge>
          <div>
            <h2 className="text-text-strong text-2xl font-semibold">{t('notFoundTitle')}</h2>
            <p className="text-text-muted mt-3 text-lg leading-relaxed">
              {t('notFoundHint', { orderNo: decodedOrderNo })}
            </p>
          </div>
          <Button variant="secondary" asChild>
            <Link href="/store/orders">
              <ArrowLeft className="size-4" />
              <span>{t('backToOrders')}</span>
            </Link>
          </Button>
        </div>
      </section>
    );
  }

  return (
    <div className="space-y-5">
      <section className="bg-bg-elevated rounded-lg p-5">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0">
            <Button variant="secondary" size="sm" asChild>
              <Link href="/store/orders">
                <ArrowLeft className="size-4" />
                <span>{t('backToOrders')}</span>
              </Link>
            </Button>
            <div className="mt-5 flex flex-wrap items-center gap-2">
              <ClipboardCheck className="text-brand-500 size-5" />
              <Badge variant="standard">{tAccount(`orderStatus.${order.status}`)}</Badge>
            </div>
            <h2 className="text-text-strong mt-3 text-2xl font-semibold break-all">
              {order.orderNo}
            </h2>
            <p className="text-text mt-2 text-lg">{order.projectName}</p>
            <p className="text-text-muted mt-2 text-sm">
              {t('detailOwner', {
                company: order.companyName ?? profile.companyName,
                name: order.submittedBy ?? tAccount(order.role),
              })}
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-3 lg:min-w-[420px]">
            <OrderDetailMetric label={tAccount('items')} value={String(order.itemCount)} />
            <OrderDetailMetric
              label={t('totalAmount')}
              value={formatPrice(order.subtotalCents, 'CNY', locale === 'zh' ? 'zh-CN' : 'en-US')}
            />
            <OrderDetailMetric
              label={t('submittedAt')}
              value={formatDate(order.submittedAt, locale)}
            />
          </div>
        </div>
      </section>

      <OrderRow
        order={order}
        locale={locale}
        roleLabel={tAccount(order.role)}
        statusLabel={tAccount(`orderStatus.${order.status}`)}
        submittedAtLabel={formatDate(order.submittedAt, locale)}
        canApprove={isAuthenticated && canApproveOrder(profile, order)}
        canPay={
          isAuthenticated && profile.role !== 'engineer' && order.status === 'pending-payment'
        }
        canAdvance={false}
        onApprove={() => approveLocalOrder(order.orderNo)}
        onPay={() => markLocalOrderPaid(order.orderNo)}
        onAdvance={() => undefined}
        showDetails
        labels={{
          items: tAccount('items'),
          approval: order.approvalMode
            ? tAccount(`approvalMode.${order.approvalMode}`)
            : tAccount('approvalUnknown'),
          approvalOwner: order.approvedBy
            ? tAccount('approvedBy', { name: order.approvedBy })
            : order.approver
              ? tAccount('assignedTo', { name: order.approver })
              : tAccount('approvalUnassigned'),
          payment:
            order.status === 'pending-quote'
              ? tAccount('quoteEstimate')
              : order.paymentMethod === 'personal'
                ? tAccount('personalPay')
                : tAccount('corporatePay'),
          paymentReceipt: tAccount('paymentReceipt'),
          paymentConfirmedBy: order.paidBy
            ? tAccount('paymentConfirmedBy', { name: order.paidBy })
            : '',
          submittedBy: tAccount('submittedBy', {
            name: order.submittedBy ?? tAccount(order.role),
          }),
          orderSource: tAccount('orderSource'),
          sourceWeb: tAccount('sourceWeb'),
          sourceOs: tAccount('sourceOs'),
          osProject: tAccount('osProject'),
          approve: tAccount('approveOrder'),
          pay: tAccount('markPaid'),
          advance:
            order.status === 'paid'
              ? tAccount('startProduction')
              : order.status === 'in-production'
                ? tAccount('shipOrder')
                : tAccount('completeOrder'),
          locked:
            profile.role === 'engineer'
              ? tAccount('engineerCannotProcess')
              : tAccount('orderLocked'),
          downloadBom: tAccount('downloadBom'),
          downloadUnavailable: tAccount('downloadUnavailable'),
          viewDetail: tAccount('viewOrderDetail'),
          bomTitle: tAccount('bomTitle'),
          deliveryTitle: tAccount('deliveryTitle'),
          invoiceSummaryTitle: tAccount('invoiceSummaryTitle'),
          noSnapshot: tAccount('noSnapshot'),
          noInvoice: tAccount('noInvoice'),
          qty: tAccount('qty'),
          unitPrice: tAccount('unitPrice'),
          lineSubtotal: tAccount('lineSubtotal'),
          bomIncluded: tAccount('bomIncluded'),
          bomExcluded: tAccount('bomExcluded'),
          quoteOnly: tAccount('quoteOnly'),
          notForSale: tAccount('notForSale'),
          recipient: tAccount('recipient'),
          note: tAccount('orderNote'),
          carrier: tAccount('carrier'),
          trackingNo: tAccount('trackingNo'),
          progressSteps: {
            'pending-quote': tAccount('orderStatus.pending-quote'),
            'pending-approval': tAccount('orderStatus.pending-approval'),
            'pending-payment': tAccount('orderStatus.pending-payment'),
            paid: tAccount('orderStatus.paid'),
            'in-production': tAccount('orderStatus.in-production'),
            shipped: tAccount('orderStatus.shipped'),
            completed: tAccount('orderStatus.completed'),
          },
          csvHeaders: {
            orderNo: tAccount('csv.orderNo'),
            project: tAccount('csv.project'),
            productId: tAccount('csv.productId'),
            model: tAccount('csv.model'),
            name: tAccount('csv.name'),
            partClass: tAccount('csv.partClass'),
            qty: tAccount('csv.qty'),
            source: tAccount('csv.source'),
            selected: tAccount('csv.selected'),
            sellable: tAccount('csv.sellable'),
            quoteRequired: tAccount('csv.quoteRequired'),
            unitPrice: tAccount('csv.unitPrice'),
            subtotal: tAccount('csv.subtotal'),
            currency: tAccount('csv.currency'),
          },
        }}
      />
    </div>
  );
}

function OrderDetailMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-bg-surface rounded-lg p-4">
      <p className="text-text-muted text-sm">{label}</p>
      <p className="text-text-strong mt-2 text-lg font-semibold tabular-nums">{value}</p>
    </div>
  );
}
