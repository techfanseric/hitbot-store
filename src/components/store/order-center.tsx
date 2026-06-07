'use client';

import { useEffect, useMemo, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import Link from 'next/link';
import {
  ArrowRight,
  ChevronDown,
  CircleDollarSign,
  ClipboardCheck,
  FileCheck2,
  ListFilter,
  LogIn,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useProcurementHydrated } from '@/hooks/use-procurement-hydrated';
import { approvalSettingsForEnterprise, useAdminStore } from '@/lib/admin-store';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { DEFAULT_ENTERPRISE_ID, useProcurementStore } from '@/lib/procurement-store';
import { formatPrice } from '@/lib/format';
import { canHandleWorkflowRole, workflowOwnerName } from '@/lib/order-workflow';
import {
  matchesOrderTimeFilter,
  type OrderDateRange,
  type OrderTimeFilter,
} from '@/lib/order-filters';
import { cn } from '@/lib/utils';
import { OrderRow } from './account-panel';
import { OrderTimeFilterControl } from './order-time-filter-control';
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
  const authHydrated = useProcurementHydrated();
  const [statusFilter, setStatusFilter] = useState<OrderStatusFilter>('all');
  const [projectFilter, setProjectFilter] = useState('all');
  const [timeFilter, setTimeFilter] = useState<OrderTimeFilter>('all');
  const [customTimeRange, setCustomTimeRange] = useState<OrderDateRange>({});
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [visibleOrderCount, setVisibleOrderCount] = useState(ORDER_PAGE_SIZE);
  const { isAuthenticated, profile, orders, approveLocalOrder, markLocalOrderPaid, advanceLocalOrder } =
    useProcurementStore();
  const adminMembers = useAdminStore((state) => state.members);
  const approvalSettings = useAdminStore((state) => state.approvalSettings);
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
  const filteredOrders = useMemo(
    () =>
      enterpriseOrders.filter((order) => {
        const statusMatch = statusFilter === 'all' || order.status === statusFilter;
        const projectMatch = projectFilter === 'all' || order.projectName === projectFilter;
        const timeMatch = matchesOrderTimeFilter(
          order.submittedAt,
          timeFilter,
          new Date(),
          customTimeRange,
        );
        return statusMatch && projectMatch && timeMatch;
      }),
    [customTimeRange, enterpriseOrders, projectFilter, statusFilter, timeFilter],
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
        (order) =>
          order.status === 'pending-payment' &&
          canHandleWorkflowRole(profile, enterpriseApprovalSettings, adminMembers, 'paymentInvoice'),
      ),
    [adminMembers, enterpriseApprovalSettings, enterpriseOrders, profile],
  );
  const receivableOrders = useMemo(
    () =>
      enterpriseOrders.filter(
        (order) =>
          order.status === 'shipped' &&
          canHandleWorkflowRole(profile, enterpriseApprovalSettings, adminMembers, 'logistics'),
      ),
    [adminMembers, enterpriseApprovalSettings, enterpriseOrders, profile],
  );

  useEffect(() => {
    setVisibleOrderCount(ORDER_PAGE_SIZE);
  }, [customTimeRange, projectFilter, statusFilter, timeFilter]);
  const pendingCount = enterpriseOrders.filter((order) =>
    ['pending-quote', 'pending-approval', 'pending-payment'].includes(order.status),
  ).length;
  const activeCount = enterpriseOrders.filter((order) =>
    ['paid', 'in-production', 'shipped'].includes(order.status),
  ).length;
  const completedCount = enterpriseOrders.filter((order) => order.status === 'completed').length;
  const totalCents = enterpriseOrders.reduce((sum, order) => sum + order.subtotalCents, 0);

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
              <Link href={`/${locale}/login?next=/${locale}/orders`}>
                <LogIn className="size-4" />
                <span>{tAccount('signIn')}</span>
              </Link>
            </Button>
            <Button variant="secondary" asChild>
              <Link href={`/${locale}/account`}>
                <span>{t('openAccessRequest')}</span>
                <ArrowRight className="size-4" />
              </Link>
            </Button>
          </div>
        </div>
      </section>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <section className="grid grid-cols-2 gap-2 md:grid-cols-4 md:gap-[12px]">
        <OrderMetric label={t('totalOrders')} value={String(enterpriseOrders.length)} />
        <OrderMetric label={t('pendingOrders')} value={String(pendingCount)} />
        <OrderMetric label={t('activeOrders')} value={String(activeCount)} />
        <OrderMetric
          label={t('totalAmount')}
          value={formatPrice(totalCents, 'CNY', locale === 'zh' ? 'zh-CN' : 'en-US')}
        />
      </section>

      <section className="bg-bg-elevated rounded-lg p-2.5 md:p-4">
        <div className="flex flex-col gap-2.5 lg:flex-row lg:items-center lg:justify-between">
          <div className="min-w-0">
            <div className="flex items-center gap-2.5">
              <ClipboardCheck className="text-brand-500 size-4 md:size-5" />
              <h2 className="text-text-strong text-base font-semibold md:text-xl">
                {t('workspaceTitle')}
              </h2>
            </div>
            <p className="text-text-muted mt-1 hidden max-w-3xl text-sm leading-relaxed xl:block">
              {t('workspaceHint', {
                company: profile.companyName,
                role: tAccount(profile.role),
              })}
            </p>
          </div>
          <div className="flex flex-wrap gap-1.5">
            <Button variant="secondary" size="sm" className="h-[36px] px-3" asChild>
              <Link href={`/${locale}/checkout`}>
                <span>{t('continueCheckout')}</span>
                <ArrowRight className="size-4" />
              </Link>
            </Button>
            <Button variant="secondary" size="sm" className="h-[36px] px-3" asChild>
              <Link href={`/${locale}/account`}>
                <span>{t('openWorkspace')}</span>
                <ArrowRight className="size-4" />
              </Link>
            </Button>
          </div>
        </div>

        {enterpriseOrders.length === 0 ? (
          <div className="bg-bg-surface mt-3 rounded-lg p-4">
            <p className="text-text-strong font-medium">{tAccount('noOrders')}</p>
            <p className="text-text-muted mt-2 text-sm">{t('emptyHint')}</p>
          </div>
        ) : (
          <div className="mt-2.5 space-y-2.5 md:mt-4 md:space-y-3">
            {(actionableApprovalOrders.length > 0 ||
              payableOrders.length > 0 ||
              receivableOrders.length > 0) && (
              <div className="bg-bg-surface flex flex-wrap items-center justify-between gap-2 rounded-lg p-2.5">
                <div>
                  <p className="text-text-strong font-medium">{tAccount('actionQueueTitle')}</p>
                  <p className="text-text-muted mt-1 hidden text-sm xl:block">
                    {tAccount('actionQueueHint')}
                  </p>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {actionableApprovalOrders.length > 0 && (
                    <Button
                      variant="secondary"
                      size="sm"
                      className="h-[36px] px-3"
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
                      className="h-[36px] px-3"
                      onClick={() => setStatusFilter('pending-payment')}
                    >
                      <CircleDollarSign className="size-4" />
                      <span>{tAccount('showPendingPayment', { count: payableOrders.length })}</span>
                    </Button>
                  )}
                  {receivableOrders.length > 0 && (
                    <Button
                      variant="secondary"
                      size="sm"
                      className="h-[36px] px-3"
                      onClick={() => setStatusFilter('shipped')}
                    >
                      <ClipboardCheck className="size-4" />
                      <span>
                        {tAccount('showPendingReceipt', { count: receivableOrders.length })}
                      </span>
                    </Button>
                  )}
                </div>
              </div>
            )}

            <div className="bg-bg-surface rounded-lg p-2.5 md:p-3">
              <button
                type="button"
                className="flex min-h-[36px] w-full items-center justify-between gap-2 text-left"
                onClick={() => setFiltersOpen((value) => !value)}
                aria-expanded={filtersOpen}
              >
                <span className="flex items-center gap-2">
                  <ListFilter className="text-brand-500 size-4" />
                  <span className="text-text-strong font-medium">{tAccount('filterOrders')}</span>
                </span>
                <span className="flex items-center gap-2">
                  <span className="text-text-muted text-sm">
                    {tAccount('filteredOrderCount', { count: filteredOrders.length })}
                  </span>
                  <ChevronDown
                    className={cn(
                      'size-4 shrink-0 transition-transform',
                      filtersOpen && 'rotate-180',
                    )}
                  />
                </span>
              </button>
              <div className={cn(filtersOpen ? 'block' : 'hidden')}>
                <div className="mt-2.5 grid gap-3 xl:grid-cols-[1.25fr_1fr_0.8fr]">
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
                          className={`inline-flex h-[36px] items-center rounded-sm px-2.5 text-md transition-colors ${
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
                    <OrderTimeFilterControl
                      options={timeFilters}
                      value={timeFilter}
                      from={customTimeRange.from ?? ''}
                      to={customTimeRange.to ?? ''}
                      labels={{
                        from: tAccount('timeFrom'),
                        to: tAccount('timeTo'),
                      }}
                      onValueChange={(value) => {
                        setTimeFilter(value);
                        setCustomTimeRange({});
                      }}
                      onFromChange={(value) => {
                        const nextRange = { ...customTimeRange, from: value };
                        setCustomTimeRange(nextRange);
                        setTimeFilter(nextRange.from || nextRange.to ? 'custom' : 'all');
                      }}
                      onToChange={(value) => {
                        const nextRange = { ...customTimeRange, to: value };
                        setCustomTimeRange(nextRange);
                        setTimeFilter(nextRange.from || nextRange.to ? 'custom' : 'all');
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>

            {filteredOrders.length === 0 ? (
              <div className="bg-bg-surface rounded-lg p-4">
                <p className="text-text-strong font-medium">{tAccount('noFilteredOrders')}</p>
                <p className="text-text-muted mt-2 text-sm">{tAccount('noFilteredOrdersHint')}</p>
              </div>
            ) : (
              <div className="space-y-2.5 md:space-y-3">
                {visibleOrders.map((order) => (
                  <OrderRow
                    key={order.orderNo}
                    order={order}
                    locale={locale}
                    statusLabel={tAccount(`orderStatus.${order.status}`)}
                    submittedAtLabel={formatDate(order.submittedAt, locale)}
                    canApprove={isAuthenticated && canApproveOrder(profile, order)}
                    canPay={
                      isAuthenticated &&
                      order.status === 'pending-payment' &&
                      canHandleWorkflowRole(
                        profile,
                        enterpriseApprovalSettings,
                        adminMembers,
                        'paymentInvoice',
                      )
                    }
                    canAdvance={
                      isAuthenticated &&
                      order.status === 'shipped' &&
                      canHandleWorkflowRole(
                        profile,
                        enterpriseApprovalSettings,
                        adminMembers,
                        'logistics',
                      )
                    }
                    onApprove={() => approveLocalOrder(order.orderNo)}
                    onPay={() => markLocalOrderPaid(order.orderNo)}
                    onAdvance={() => advanceLocalOrder(order.orderNo)}
                    detailHref={`/${locale}/orders/${encodeURIComponent(order.orderNo)}`}
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
    <div className="bg-bg-elevated rounded-lg p-2.5 md:p-3.5">
      <p className="text-text-muted text-xs md:text-sm">{label}</p>
      <p className="text-text-strong mt-1 text-lg font-semibold tabular-nums md:mt-1.5 md:text-xl">
        {value}
      </p>
    </div>
  );
}
