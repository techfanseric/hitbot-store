'use client';

import { useMemo } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import Link from 'next/link';
import { ArrowLeft, LogIn } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useProcurementHydrated } from '@/hooks/use-procurement-hydrated';
import { approvalSettingsForEnterprise, useAdminStore } from '@/lib/admin-store';
import { DEFAULT_ENTERPRISE_ID, useProcurementStore } from '@/lib/procurement-store';
import { formatPrice } from '@/lib/format';
import { canHandleWorkflowRole, workflowOwnerName } from '@/lib/order-workflow';
import { OrderRow, statusVariant } from './account-panel';
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
  const authHydrated = useProcurementHydrated();
  const { isAuthenticated, profile, orders, approveLocalOrder, markLocalOrderPaid, advanceLocalOrder } =
    useProcurementStore();
  const adminMembers = useAdminStore((state) => state.members);
  const approvalSettings = useAdminStore((state) => state.approvalSettings);
  const enterpriseMembers = useMemo(
    () =>
      adminMembers.filter(
        (member) => (member.enterpriseId ?? DEFAULT_ENTERPRISE_ID) === profile.enterpriseId,
      ),
    [adminMembers, profile.enterpriseId],
  );
  const enterpriseApprovalSettings = useMemo(
    () => approvalSettingsForEnterprise(approvalSettings, enterpriseMembers, profile.enterpriseId),
    [approvalSettings, enterpriseMembers, profile.enterpriseId],
  );
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

  if (!authHydrated) {
    return <section className="bg-bg-elevated min-h-[180px] rounded-lg p-4 md:p-5" />;
  }

  if (!isAuthenticated) {
    return (
      <section className="bg-bg-elevated rounded-lg p-4 md:p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0">
            <Badge variant="secondary">{t('signedOutBadge')}</Badge>
            <h2 className="text-text-strong mt-3 text-xl font-semibold md:text-2xl">
              {t('authTitle')}
            </h2>
            <p className="text-text-muted mt-2 max-w-2xl text-sm leading-relaxed md:text-base">
              {t('authHint')}
            </p>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row lg:shrink-0">
            <Button variant="primary" asChild>
              <Link
                href={`/${locale}/login?next=${encodeURIComponent(
                  `/${locale}/orders/${encodeURIComponent(decodedOrderNo)}`,
                )}`}
              >
                <LogIn className="size-4" />
                <span>{tAccount('signIn')}</span>
              </Link>
            </Button>
            <Button variant="secondary" asChild>
              <Link href={`/${locale}/orders`}>
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
      <section className="bg-bg-elevated rounded-lg p-4 md:p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0">
            <Badge variant="secondary">{decodedOrderNo}</Badge>
            <h2 className="text-text-strong mt-3 text-xl font-semibold md:text-2xl">
              {t('notFoundTitle')}
            </h2>
            <p className="text-text-muted mt-2 max-w-2xl text-sm leading-relaxed md:text-base">
              {t('notFoundHint', { orderNo: decodedOrderNo })}
            </p>
          </div>
          <Button variant="secondary" className="w-full sm:w-auto lg:shrink-0" asChild>
            <Link href={`/${locale}/orders`}>
              <ArrowLeft className="size-4" />
              <span>{t('backToOrders')}</span>
            </Link>
          </Button>
        </div>
      </section>
    );
  }

  return (
    <div className="space-y-3 md:space-y-5">
      <section className="bg-bg-elevated rounded-lg p-3 md:p-5">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0">
            <div className="mb-3">
              <Button variant="secondary" size="sm" className="h-[36px] px-3" asChild>
                <Link href={`/${locale}/orders`}>
                  <ArrowLeft className="size-4" />
                  <span>{t('backToOrders')}</span>
                </Link>
              </Button>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-text-strong text-lg font-semibold break-all md:text-2xl">
                {order.orderNo}
              </h2>
              <Badge variant={statusVariant(order.status)}>
                {tAccount(`orderStatus.${order.status}`)}
              </Badge>
            </div>
            <p className="text-text mt-1.5 text-base md:mt-2 md:text-lg">{order.projectName}</p>
            <p className="text-text-muted mt-1.5 text-sm md:mt-2">
              {t('detailOwner', {
                company: order.companyName ?? profile.companyName,
                name: order.submittedBy ?? tAccount(order.role),
              })}
            </p>
          </div>
          <div className="grid grid-cols-3 gap-2 lg:min-w-[420px] lg:gap-3">
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
        statusLabel={tAccount(`orderStatus.${order.status}`)}
        submittedAtLabel={formatDate(order.submittedAt, locale)}
        canApprove={isAuthenticated && canApproveOrder(profile, order)}
        canPay={
          isAuthenticated &&
          order.status === 'pending-payment' &&
          canHandleWorkflowRole(profile, enterpriseApprovalSettings, adminMembers, 'paymentInvoice')
        }
        canAdvance={
          isAuthenticated &&
          order.status === 'shipped' &&
          canHandleWorkflowRole(profile, enterpriseApprovalSettings, adminMembers, 'logistics')
        }
        onApprove={() => approveLocalOrder(order.orderNo)}
        onPay={() => markLocalOrderPaid(order.orderNo)}
        onAdvance={() => advanceLocalOrder(order.orderNo)}
        showDetails
        detailOnly
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
          approvalFlow: {
            title: tAccount('approvalFlowTitle'),
            submitted: tAccount('approvalFlowSubmitted'),
            quote: tAccount('approvalFlowQuote'),
            delivery: tAccount('approvalFlowDelivery'),
            approval: tAccount('approvalFlowApproval'),
            payment: tAccount('approvalFlowPayment'),
            fulfillment: tAccount('approvalFlowFulfillment'),
            deliveryOwner: workflowOwnerName(
              enterpriseApprovalSettings,
              adminMembers,
              'delivery',
              tAccount('approvalUnassigned'),
            ),
            paymentInvoiceOwner: workflowOwnerName(
              enterpriseApprovalSettings,
              adminMembers,
              'paymentInvoice',
              tAccount('approvalUnassigned'),
            ),
            logisticsOwner: workflowOwnerName(
              enterpriseApprovalSettings,
              adminMembers,
              'logistics',
              tAccount('approvalUnassigned'),
            ),
            skipped: tAccount('approvalFlowSkipped'),
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
    <div className="bg-bg-surface rounded-md p-2.5 md:rounded-lg md:p-4">
      <p className="text-text-muted truncate text-xs md:text-sm">{label}</p>
      <p className="text-text-strong mt-1 truncate text-sm font-semibold tabular-nums md:mt-2 md:text-lg">
        {value}
      </p>
    </div>
  );
}
