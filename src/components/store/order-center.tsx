'use client';

import { useEffect, useMemo, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import Link from 'next/link';
import {
  ArrowRight,
  CircleDollarSign,
  ClipboardCheck,
  FileCheck2,
  ListFilter,
  LogIn,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { DEFAULT_ENTERPRISE_ID, useProcurementStore } from '@/lib/procurement-store';
import { formatPrice } from '@/lib/format';
import { matchesOrderTimeFilter, type OrderTimeFilter } from '@/lib/order-filters';
import { OrderRow } from './account-panel';
import type { EnterpriseProfile, LocalOrderSnapshot, OrderStatus } from '@/types/procurement';

type OrderStatusFilter = 'all' | OrderStatus;
const ORDER_PAGE_SIZE = 10;

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

export function OrderCenter() {
  const t = useTranslations('Orders');
  const tAccount = useTranslations('Account');
  const locale = useLocale();
  const [statusFilter, setStatusFilter] = useState<OrderStatusFilter>('all');
  const [projectFilter, setProjectFilter] = useState('all');
  const [timeFilter, setTimeFilter] = useState<OrderTimeFilter>('all');
  const [visibleOrderCount, setVisibleOrderCount] = useState(ORDER_PAGE_SIZE);
  const { isAuthenticated, profile, orders, approveLocalOrder, markLocalOrderPaid } =
    useProcurementStore();
  const enterpriseOrders = useMemo(
    () =>
      isAuthenticated
        ? orders.filter(
            (order) => (order.enterpriseId ?? DEFAULT_ENTERPRISE_ID) === profile.enterpriseId,
          )
        : [],
    [isAuthenticated, orders, profile.enterpriseId],
  );
  const statusFilters: Array<{ key: OrderStatusFilter; label: string }> = [
    { key: 'all', label: tAccount('allOrders') },
    { key: 'pending-quote', label: tAccount('orderStatus.pending-quote') },
    { key: 'pending-approval', label: tAccount('orderStatus.pending-approval') },
    { key: 'pending-payment', label: tAccount('orderStatus.pending-payment') },
    { key: 'paid', label: tAccount('orderStatus.paid') },
    { key: 'in-production', label: tAccount('orderStatus.in-production') },
    { key: 'shipped', label: tAccount('orderStatus.shipped') },
    { key: 'completed', label: tAccount('orderStatus.completed') },
  ];
  const projectOptions = useMemo(
    () => ['all', ...Array.from(new Set(enterpriseOrders.map((order) => order.projectName)))],
    [enterpriseOrders],
  );
  const timeFilters: Array<{ key: OrderTimeFilter; label: string }> = [
    { key: 'all', label: tAccount('allTime') },
    { key: '7d', label: tAccount('last7Days') },
    { key: '30d', label: tAccount('last30Days') },
    { key: 'month', label: tAccount('thisMonth') },
  ];
  const filteredOrders = useMemo(
    () =>
      enterpriseOrders.filter((order) => {
        const statusMatch = statusFilter === 'all' || order.status === statusFilter;
        const projectMatch = projectFilter === 'all' || order.projectName === projectFilter;
        const timeMatch = matchesOrderTimeFilter(order.submittedAt, timeFilter);
        return statusMatch && projectMatch && timeMatch;
      }),
    [enterpriseOrders, projectFilter, statusFilter, timeFilter],
  );
  const visibleOrders = filteredOrders.slice(0, visibleOrderCount);
  const hasMoreOrders = visibleOrderCount < filteredOrders.length;
  const actionableApprovalOrders = useMemo(
    () => enterpriseOrders.filter((order) => canApproveOrder(profile, order)),
    [enterpriseOrders, profile],
  );
  const payableOrders = useMemo(
    () =>
      enterpriseOrders.filter(
        (order) => profile.role !== 'engineer' && order.status === 'pending-payment',
      ),
    [enterpriseOrders, profile.role],
  );

  useEffect(() => {
    setVisibleOrderCount(ORDER_PAGE_SIZE);
  }, [projectFilter, statusFilter, timeFilter]);
  const pendingCount = enterpriseOrders.filter((order) =>
    ['pending-quote', 'pending-approval', 'pending-payment'].includes(order.status),
  ).length;
  const activeCount = enterpriseOrders.filter((order) =>
    ['paid', 'in-production', 'shipped'].includes(order.status),
  ).length;
  const completedCount = enterpriseOrders.filter((order) => order.status === 'completed').length;
  const totalCents = enterpriseOrders.reduce((sum, order) => sum + order.subtotalCents, 0);

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
              <Link href="/store/login?next=/store/orders">
                <LogIn className="size-4" />
                <span>{tAccount('signIn')}</span>
              </Link>
            </Button>
            <Button variant="secondary" asChild>
              <Link href="/store/account">
                <span>{t('openAccount')}</span>
                <ArrowRight className="size-4" />
              </Link>
            </Button>
          </div>
        </div>
      </section>
    );
  }

  return (
    <div className="space-y-4">
      <section className="grid gap-3 md:grid-cols-4">
        <OrderMetric label={t('totalOrders')} value={String(enterpriseOrders.length)} />
        <OrderMetric label={t('pendingOrders')} value={String(pendingCount)} />
        <OrderMetric label={t('activeOrders')} value={String(activeCount)} />
        <OrderMetric
          label={t('totalAmount')}
          value={formatPrice(totalCents, 'CNY', locale === 'zh' ? 'zh-CN' : 'en-US')}
        />
      </section>

      <section className="bg-bg-elevated rounded-lg p-4 md:p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <div className="flex items-center gap-3">
              <ClipboardCheck className="text-brand-500 size-5" />
              <h2 className="text-text-strong text-xl font-semibold">{t('workspaceTitle')}</h2>
            </div>
            <p className="text-text-muted mt-2 max-w-3xl text-base leading-relaxed">
              {t('workspaceHint', {
                company: profile.companyName,
                role: tAccount(profile.role),
              })}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="secondary" asChild>
              <Link href="/store/checkout">
                <span>{t('continueCheckout')}</span>
                <ArrowRight className="size-4" />
              </Link>
            </Button>
            <Button variant="secondary" asChild>
              <Link href="/store/account">
                <span>{t('openAccount')}</span>
                <ArrowRight className="size-4" />
              </Link>
            </Button>
          </div>
        </div>

        {enterpriseOrders.length === 0 ? (
          <div className="bg-bg-surface mt-5 rounded-lg p-5">
            <p className="text-text-strong font-medium">{tAccount('noOrders')}</p>
            <p className="text-text-muted mt-2 text-sm">{t('emptyHint')}</p>
          </div>
        ) : (
          <div className="mt-4 space-y-3">
            {(actionableApprovalOrders.length > 0 || payableOrders.length > 0) && (
              <div className="bg-bg-surface flex flex-col gap-3 rounded-lg p-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-text-strong font-medium">{tAccount('actionQueueTitle')}</p>
                  <p className="text-text-muted mt-1 text-sm">{tAccount('actionQueueHint')}</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {actionableApprovalOrders.length > 0 && (
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => setStatusFilter('pending-approval')}
                    >
                      <FileCheck2 className="size-4" />
                      <span>
                        {tAccount('showPendingApproval', {
                          count: actionableApprovalOrders.length,
                        })}
                      </span>
                    </Button>
                  )}
                  {payableOrders.length > 0 && (
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => setStatusFilter('pending-payment')}
                    >
                      <CircleDollarSign className="size-4" />
                      <span>{tAccount('showPendingPayment', { count: payableOrders.length })}</span>
                    </Button>
                  )}
                </div>
              </div>
            )}

            <div className="bg-bg-surface rounded-lg p-3">
              <div className="mb-3 flex items-center gap-2">
                <ListFilter className="text-brand-500 size-4" />
                <p className="text-text-strong font-medium">{tAccount('filterOrders')}</p>
              </div>
              <div className="grid gap-3 xl:grid-cols-[1.25fr_1fr_0.8fr]">
                <div>
                  <p className="text-text-muted mb-2 text-xs font-medium">
                    {tAccount('filterStatus')}
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {statusFilters.map((filter) => (
                      <button
                        key={filter.key}
                        type="button"
                        onClick={() => setStatusFilter(filter.key)}
                        className={`inline-flex h-[32px] items-center rounded-sm px-2.5 text-md transition-colors ${
                          statusFilter === filter.key
                            ? 'bg-bg-elevated text-text-strong font-semibold'
                            : 'bg-bg-control text-text-muted hover:text-text'
                        }`}
                      >
                        {filter.label}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="text-text-muted mb-2 text-xs font-medium">
                    {tAccount('filterProject')}
                  </p>
                  <Select value={projectFilter} onValueChange={setProjectFilter}>
                    <SelectTrigger size="sm" className="w-full text-md">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="max-h-72">
                      {projectOptions.map((project) => (
                        <SelectItem key={project} value={project} className="text-md">
                          {project === 'all' ? tAccount('allProjects') : project}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <p className="text-text-muted mb-2 text-xs font-medium">
                    {tAccount('filterTime')}
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {timeFilters.map((filter) => (
                      <button
                        key={filter.key}
                        type="button"
                        onClick={() => setTimeFilter(filter.key)}
                        className={`inline-flex h-[32px] items-center rounded-sm px-2.5 text-md transition-colors ${
                          timeFilter === filter.key
                            ? 'bg-bg-elevated text-text-strong font-semibold'
                            : 'bg-bg-control text-text-muted hover:text-text'
                        }`}
                      >
                        {filter.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
              <p className="text-text-muted mt-3 text-sm">
                {tAccount('filteredOrderCount', { count: filteredOrders.length })}
              </p>
            </div>

            {filteredOrders.length === 0 ? (
              <div className="bg-bg-surface rounded-lg p-5">
                <p className="text-text-strong font-medium">{tAccount('noFilteredOrders')}</p>
                <p className="text-text-muted mt-2 text-sm">{tAccount('noFilteredOrdersHint')}</p>
              </div>
            ) : (
              <div className="space-y-3">
                {visibleOrders.map((order) => (
                  <OrderRow
                    key={order.orderNo}
                    order={order}
                    locale={locale}
                    roleLabel={tAccount(order.role)}
                    statusLabel={tAccount(`orderStatus.${order.status}`)}
                    submittedAtLabel={formatDate(order.submittedAt, locale)}
                    canApprove={isAuthenticated && canApproveOrder(profile, order)}
                    canPay={
                      isAuthenticated &&
                      profile.role !== 'engineer' &&
                      order.status === 'pending-payment'
                    }
                    canAdvance={false}
                    onApprove={() => approveLocalOrder(order.orderNo)}
                    onPay={() => markLocalOrderPaid(order.orderNo)}
                    onAdvance={() => undefined}
                    detailHref={`/store/orders/${encodeURIComponent(order.orderNo)}`}
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
                ))}
                {hasMoreOrders && (
                  <div className="flex justify-center pt-1">
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() =>
                        setVisibleOrderCount((count) =>
                          Math.min(count + ORDER_PAGE_SIZE, filteredOrders.length),
                        )
                      }
                    >
                      <span>
                        {t('showMoreOrders', {
                          shown: visibleOrders.length,
                          total: filteredOrders.length,
                        })}
                      </span>
                    </Button>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </section>

      {completedCount > 0 && (
        <p className="text-text-muted text-sm">{t('completedHint', { count: completedCount })}</p>
      )}
    </div>
  );
}

function OrderMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-bg-elevated rounded-lg p-3.5">
      <p className="text-text-muted text-sm">{label}</p>
      <p className="text-text-strong mt-1.5 text-xl font-semibold tabular-nums">{value}</p>
    </div>
  );
}
