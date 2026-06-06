'use client';

import { useEffect, useMemo, useState } from 'react';
import type React from 'react';
import Link from 'next/link';
import {
  Building2,
  CircleDollarSign,
  ClipboardCheck,
  Clock3,
  Download,
  FileCheck2,
  GitBranch,
  ListFilter,
  LogOut,
  ReceiptText,
  Send,
  ShieldCheck,
  Trash2,
  UserCog,
  UsersRound,
  Wrench,
} from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useAdminStore } from '@/lib/admin-store';
import { formatPrice } from '@/lib/format';
import { matchesOrderTimeFilter, type OrderTimeFilter } from '@/lib/order-filters';
import { DEFAULT_ENTERPRISE_ID, useProcurementStore } from '@/lib/procurement-store';
import { PartClassBadge } from './part-class-badge';
import type { AdminMember, AdminPermission } from '@/types/admin';
import type {
  CheckoutDraft,
  InvoiceProfile,
  LocalOrderSnapshot,
  LocalOsHandoff,
  LocalQuoteRequest,
} from '@/types/procurement';
import type { EnterpriseProfile, OrderStatus } from '@/types/procurement';

type OrderStatusFilter = 'all' | OrderStatus;
type AccountTab = 'overview' | 'orders' | 'invoices' | 'settings';
const ACCOUNT_ORDER_PAGE_SIZE = 8;
type MemberFormState = {
  name: string;
  email: string;
  phone: string;
  roleName: string;
  permissions: AdminPermission[];
};

const roleIcons = {
  admin: ShieldCheck,
  buyer: UserCog,
  engineer: Wrench,
};
const permissionOptions: AdminPermission[] = ['orders', 'invoices', 'permissions'];

function canApproveOrder(profile: EnterpriseProfile, order: LocalOrderSnapshot) {
  if ((order.enterpriseId ?? DEFAULT_ENTERPRISE_ID) !== profile.enterpriseId) return false;
  if (profile.role === 'engineer' || order.status !== 'pending-approval') return false;
  if (profile.role === 'admin') return true;
  if (order.approvalMode === 'admin-review') return false;
  if (!order.approver) return false;

  return order.approver === profile.contactName || order.approver === profile.email;
}

export function AccountPanel() {
  const t = useTranslations('Account');
  const locale = useLocale();
  const [activeTab, setActiveTab] = useState<AccountTab>('overview');
  const [statusFilter, setStatusFilter] = useState<OrderStatusFilter>('all');
  const [projectFilter, setProjectFilter] = useState('all');
  const [timeFilter, setTimeFilter] = useState<OrderTimeFilter>('all');
  const [visibleOrderCount, setVisibleOrderCount] = useState(ACCOUNT_ORDER_PAGE_SIZE);
  const [accessForm, setAccessForm] = useState({
    companyName: '',
    contactName: '',
    phone: '',
    email: '',
    intent: '',
  });
  const [memberForm, setMemberForm] = useState<MemberFormState>({
    name: '',
    email: '',
    phone: '',
    roleName: '',
    permissions: [],
  });
  const members = useAdminStore((state) => state.members);
  const enterpriseAccessRequests = useAdminStore((state) => state.enterpriseAccessRequests);
  const submitEnterpriseAccessRequest = useAdminStore(
    (state) => state.submitEnterpriseAccessRequest,
  );
  const inviteMember = useAdminStore((state) => state.inviteMember);
  const activateMember = useAdminStore((state) => state.activateMember);
  const updateMemberRoleName = useAdminStore((state) => state.updateMemberRoleName);
  const toggleMemberPermission = useAdminStore((state) => state.toggleMemberPermission);
  const {
    isAuthenticated,
    profile,
    checkoutDraft,
    invoiceProfiles,
    orders,
    quoteRequests,
    osHandoffs,
    updateProfile,
    updateCheckoutDraft,
    applyInvoiceProfile,
    saveCheckoutInvoice,
    deleteInvoiceProfile,
    approveLocalOrder,
    markLocalOrderPaid,
    acceptLocalQuote,
    acceptOsHandoff,
    signOut,
  } = useProcurementStore();
  const enterpriseOrders = useMemo(
    () =>
      isAuthenticated
        ? orders.filter(
            (order) => (order.enterpriseId ?? DEFAULT_ENTERPRISE_ID) === profile.enterpriseId,
          )
        : [],
    [isAuthenticated, orders, profile.enterpriseId],
  );
  const enterpriseQuoteRequests = useMemo(
    () =>
      isAuthenticated
        ? quoteRequests.filter(
            (request) => (request.enterpriseId ?? DEFAULT_ENTERPRISE_ID) === profile.enterpriseId,
          )
        : [],
    [isAuthenticated, profile.enterpriseId, quoteRequests],
  );
  const enterpriseOsHandoffs = useMemo(
    () =>
      isAuthenticated
        ? osHandoffs.filter(
            (handoff) => (handoff.enterpriseId ?? DEFAULT_ENTERPRISE_ID) === profile.enterpriseId,
          )
        : [],
    [isAuthenticated, osHandoffs, profile.enterpriseId],
  );
  const enterpriseInvoiceProfiles = useMemo(
    () =>
      isAuthenticated
        ? invoiceProfiles.filter(
            (invoice) => (invoice.enterpriseId ?? DEFAULT_ENTERPRISE_ID) === profile.enterpriseId,
          )
        : [],
    [invoiceProfiles, isAuthenticated, profile.enterpriseId],
  );
  const activeMember = useMemo(
    () =>
      isAuthenticated
        ? members.find((member) => member.email === profile.email && member.status === 'active')
        : undefined,
    [isAuthenticated, members, profile.email],
  );
  const statusFilters: Array<{ key: OrderStatusFilter; label: string }> = [
    { key: 'all', label: t('allOrders') },
    { key: 'pending-quote', label: t('orderStatus.pending-quote') },
    { key: 'pending-approval', label: t('orderStatus.pending-approval') },
    { key: 'pending-payment', label: t('orderStatus.pending-payment') },
    { key: 'paid', label: t('orderStatus.paid') },
    { key: 'in-production', label: t('orderStatus.in-production') },
    { key: 'shipped', label: t('orderStatus.shipped') },
    { key: 'completed', label: t('orderStatus.completed') },
  ];
  const projectOptions = useMemo(
    () => ['all', ...Array.from(new Set(enterpriseOrders.map((order) => order.projectName)))],
    [enterpriseOrders],
  );
  const timeFilters: Array<{ key: OrderTimeFilter; label: string }> = [
    { key: 'all', label: t('allTime') },
    { key: '7d', label: t('last7Days') },
    { key: '30d', label: t('last30Days') },
    { key: 'month', label: t('thisMonth') },
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
  const pendingOrders = useMemo(
    () =>
      enterpriseOrders.filter((order) =>
        ['pending-quote', 'pending-approval', 'pending-payment'].includes(order.status),
      ),
    [enterpriseOrders],
  );
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
  const pendingHandoffs = useMemo(
    () => enterpriseOsHandoffs.filter((handoff) => handoff.status === 'pending'),
    [enterpriseOsHandoffs],
  );
  const pendingQuotes = useMemo(
    () => enterpriseQuoteRequests.filter((request) => request.status !== 'accepted'),
    [enterpriseQuoteRequests],
  );
  const pendingProjectActions = pendingOrders.length + pendingHandoffs.length + pendingQuotes.length;
  const isEnterpriseAdmin = profile.role === 'admin';
  const canManageInvoices =
    isEnterpriseAdmin || Boolean(activeMember?.permissions.includes('invoices'));
  const accountTabs: Array<{ key: AccountTab; label: string; count?: number }> = [
    { key: 'overview', label: t('tabOverview') },
    { key: 'orders', label: t('tabOrders'), count: pendingProjectActions },
    ...(canManageInvoices
      ? [
          {
            key: 'invoices' as const,
            label: t('tabInvoices'),
            count: enterpriseInvoiceProfiles.length,
          },
        ]
      : []),
    ...(isEnterpriseAdmin ? [{ key: 'settings' as const, label: t('tabSettings') }] : []),
  ];
  const enterpriseMembers = useMemo(
    () =>
      members.filter(
        (member) => (member.enterpriseId ?? DEFAULT_ENTERPRISE_ID) === profile.enterpriseId,
      ),
    [members, profile.enterpriseId],
  );
  const accessLookupEmail = accessForm.email.trim().toLowerCase();
  const latestAccessRequest = useMemo(
    () =>
      accessLookupEmail
        ? enterpriseAccessRequests.find(
            (request) => request.email.toLowerCase() === accessLookupEmail,
          )
        : undefined,
    [accessLookupEmail, enterpriseAccessRequests],
  );
  const canSubmitAccessRequest = Boolean(
    accessForm.companyName.trim() &&
    accessForm.contactName.trim() &&
    accessForm.phone.trim() &&
    accessForm.email.trim(),
  );

  useEffect(() => {
    if (!isAuthenticated || !activeMember) return;

    const profilePatch: Partial<EnterpriseProfile> = {};
    if (activeMember.enterpriseId && activeMember.enterpriseId !== profile.enterpriseId) {
      profilePatch.enterpriseId = activeMember.enterpriseId;
    }
    if (activeMember.companyName && activeMember.companyName !== profile.companyName) {
      profilePatch.companyName = activeMember.companyName;
    }
    if (activeMember.phone && activeMember.phone !== profile.phone) {
      profilePatch.phone = activeMember.phone;
    }

    if (Object.keys(profilePatch).length > 0) {
      updateProfile(profilePatch);
    }
  }, [activeMember, isAuthenticated, profile, updateProfile]);

  function handleAccessRequestSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!canSubmitAccessRequest) return;
    submitEnterpriseAccessRequest(accessForm);
  }

  function handleMemberSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (
      !memberForm.name.trim() ||
      !memberForm.email.trim() ||
      !memberForm.roleName.trim() ||
      !isEnterpriseAdmin
    ) {
      return;
    }
    inviteMember(
      {
        ...memberForm,
        enterpriseId: profile.enterpriseId,
        companyName: profile.companyName,
      },
      profile.contactName,
    );
    setMemberForm({ name: '', email: '', phone: '', roleName: '', permissions: [] });
  }

  useEffect(() => {
    if (
      (activeTab === 'settings' && !isEnterpriseAdmin) ||
      (activeTab === 'invoices' && !canManageInvoices)
    ) {
      setActiveTab('overview');
    }
  }, [activeTab, canManageInvoices, isEnterpriseAdmin]);

  useEffect(() => {
    setVisibleOrderCount(ACCOUNT_ORDER_PAGE_SIZE);
  }, [projectFilter, statusFilter, timeFilter]);

  return (
    <div className="grid min-w-0 gap-4">
      {!isAuthenticated && (
        <section className="bg-bg-elevated rounded-lg p-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex items-start gap-3">
              <Building2 className="text-brand-500 mt-1 size-5 shrink-0" />
              <div>
                <h2 className="text-text-strong text-xl font-semibold">
                  {t('accessRequestTitle')}
                </h2>
                <p className="text-text-muted mt-2 text-lg leading-relaxed">
                  {t('accessRequestHint')}
                </p>
              </div>
            </div>
            {latestAccessRequest && (
              <Badge variant={latestAccessRequest.status === 'approved' ? 'in-stock' : 'standard'}>
                {t(`accessRequestStatus.${latestAccessRequest.status}`)}
              </Badge>
            )}
          </div>

          <form className="mt-5 grid gap-4" onSubmit={handleAccessRequestSubmit}>
            <div className="grid gap-4 md:grid-cols-2">
              <Field label={t('companyName')}>
                <Input
                  value={accessForm.companyName}
                  placeholder={t('accessCompanyPlaceholder')}
                  onChange={(event) =>
                    setAccessForm((current) => ({
                      ...current,
                      companyName: event.target.value,
                    }))
                  }
                />
              </Field>
              <Field label={t('contactName')}>
                <Input
                  value={accessForm.contactName}
                  placeholder={t('accessContactPlaceholder')}
                  onChange={(event) =>
                    setAccessForm((current) => ({
                      ...current,
                      contactName: event.target.value,
                    }))
                  }
                />
              </Field>
              <Field label={t('phone')}>
                <Input
                  value={accessForm.phone}
                  placeholder={t('accessPhonePlaceholder')}
                  onChange={(event) =>
                    setAccessForm((current) => ({
                      ...current,
                      phone: event.target.value,
                    }))
                  }
                />
              </Field>
              <Field label={t('email')}>
                <Input
                  value={accessForm.email}
                  placeholder={t('accessEmailPlaceholder')}
                  onChange={(event) =>
                    setAccessForm((current) => ({
                      ...current,
                      email: event.target.value,
                    }))
                  }
                />
              </Field>
            </div>
            <Field label={t('accessIntent')}>
              <textarea
                value={accessForm.intent}
                placeholder={t('accessIntentPlaceholder')}
                onChange={(event) =>
                  setAccessForm((current) => ({
                    ...current,
                    intent: event.target.value,
                  }))
                }
                className="border-divider bg-bg-control text-text-strong placeholder:text-text-muted focus:border-brand-500 min-h-24 w-full rounded-md border px-3 py-2 text-sm transition outline-none disabled:cursor-not-allowed disabled:opacity-60"
              />
            </Field>
            {latestAccessRequest?.status === 'approved' && latestAccessRequest.enterpriseId && (
              <p className="text-state-green-strong text-sm">
                {t('accessApprovedHint', { enterpriseId: latestAccessRequest.enterpriseId })}
              </p>
            )}
            <Button
              type="submit"
              variant="primary"
              className="w-full sm:w-fit"
              disabled={!canSubmitAccessRequest}
            >
              <Send className="size-4" />
              <span>{t('submitAccessRequest')}</span>
            </Button>
          </form>
        </section>
      )}

      {isAuthenticated && (
        <div className="grid gap-4 lg:grid-cols-[220px_minmax(0,1fr)] lg:items-start">
          <aside className="bg-bg-elevated rounded-lg p-2 lg:sticky lg:top-[124px]">
            <div className="border-divider mb-2 border-b px-2 py-3">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-text-strong truncate text-sm font-medium">
                    {profile.companyName}
                  </p>
                  <p className="text-text-muted mt-1 truncate text-xs">{t(profile.role)}</p>
                </div>
                <button
                  type="button"
                  onClick={signOut}
                  aria-label={t('signOut')}
                  title={t('signOut')}
                  className="text-text-muted hover:bg-bg-control-hover hover:text-brand-500 inline-flex size-[28px] shrink-0 items-center justify-center rounded-sm transition-colors"
                >
                  <LogOut className="size-3.5" />
                </button>
              </div>
            </div>
            <nav
              className="flex gap-2 overflow-x-auto lg:flex-col lg:overflow-visible"
              aria-label={t('workspaceNav')}
            >
              {accountTabs.map((tab) => (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => setActiveTab(tab.key)}
                  className={`flex min-h-[40px] shrink-0 items-center justify-between gap-2 rounded-md px-3 text-left text-lg transition-colors lg:w-full ${
                    activeTab === tab.key
                      ? 'bg-text-strong text-bg-elevated font-semibold'
                      : 'text-text-muted hover:bg-bg-control hover:text-text'
                  }`}
                >
                  <span>{tab.label}</span>
                  {tab.count !== undefined && tab.count > 0 && (
                    <span
                      className={`rounded-pill px-2 py-0.5 text-xs tabular-nums ${
                        activeTab === tab.key
                          ? 'bg-bg-elevated/20 text-bg-elevated'
                          : 'bg-brand-soft text-brand-500'
                      }`}
                    >
                      {tab.count}
                    </span>
                  )}
                </button>
              ))}
            </nav>
          </aside>

          <div className="min-w-0 space-y-4">
            {activeTab === 'overview' && (
              <section className="grid gap-4 md:grid-cols-2">
                <OverviewCard
                  title={t('overviewProjectActions')}
                  count={pendingProjectActions}
                  body={
                    pendingProjectActions > 0
                      ? t('overviewProjectActionsBody', {
                          orders: pendingOrders.length,
                          handoffs: pendingHandoffs.length,
                          quotes: pendingQuotes.length,
                        })
                      : t('overviewProjectActionsEmpty')
                  }
                  onClick={() => setActiveTab('orders')}
                />
                <OverviewCard
                  title={t('overviewInvoiceProfiles')}
                  count={enterpriseInvoiceProfiles.length}
                  body={
                    canManageInvoices
                      ? t('overviewInvoiceProfilesHint')
                      : t('overviewInvoiceProfilesReadonly')
                  }
                  onClick={() => setActiveTab(canManageInvoices ? 'invoices' : 'orders')}
                />
              </section>
            )}

            {isEnterpriseAdmin && activeTab === 'settings' && (
              <EnterpriseSettingsPanel
                profile={profile}
                members={enterpriseMembers}
                memberForm={memberForm}
                setMemberForm={setMemberForm}
                updateProfile={updateProfile}
                updateMemberRoleName={updateMemberRoleName}
                toggleMemberPermission={toggleMemberPermission}
                activateMember={activateMember}
                onSubmit={handleMemberSubmit}
              />
            )}

            {isAuthenticated && activeTab === 'invoices' && canManageInvoices && (
              <InvoiceManagementPanel
                checkoutDraft={checkoutDraft}
                invoiceProfiles={enterpriseInvoiceProfiles}
                orders={enterpriseOrders}
                locale={locale}
                updateCheckoutDraft={updateCheckoutDraft}
                applyInvoiceProfile={applyInvoiceProfile}
                saveCheckoutInvoice={saveCheckoutInvoice}
                deleteInvoiceProfile={deleteInvoiceProfile}
              />
            )}

            {isAuthenticated && activeTab === 'orders' && (
              <section className="bg-bg-elevated rounded-lg p-5">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <div className="flex items-center gap-3">
                      <ClipboardCheck className="text-brand-500 size-5" />
                      <h2 className="text-text-strong text-xl font-semibold">{t('ordersTitle')}</h2>
                    </div>
                    <p className="text-text-muted mt-2 text-lg leading-relaxed">
                      {t('ordersHint')}
                    </p>
                  </div>
                  <Badge variant={isAuthenticated ? 'in-stock' : 'secondary'}>
                    {isAuthenticated ? t('signedInBadge') : t('signedOut')}
                  </Badge>
                </div>

                {enterpriseOrders.length === 0 ? (
                  <div className="bg-bg-surface mt-5 rounded-lg p-5">
                    <p className="text-text-strong font-medium">{t('noOrders')}</p>
                    <p className="text-text-muted mt-2 text-sm">{t('noOrdersHint')}</p>
                  </div>
                ) : (
                  <div className="mt-5 space-y-4">
                    {(enterpriseOsHandoffs.length > 0 || enterpriseQuoteRequests.length > 0) && (
                      <div className="grid gap-4 xl:grid-cols-2">
                        {enterpriseOsHandoffs.length > 0 && (
                          <ProjectActionGroup
                            icon={<GitBranch className="text-brand-500 size-5" />}
                            title={t('handoffTitle')}
                            hint={t('handoffHint')}
                            count={t('handoffCount', { count: enterpriseOsHandoffs.length })}
                          >
                            {enterpriseOsHandoffs.map((handoff) => (
                              <HandoffRow
                                key={handoff.id}
                                handoff={handoff}
                                locale={locale}
                                canAccept={isAuthenticated && profile.role !== 'engineer'}
                                onAccept={() => acceptOsHandoff(handoff.projectId)}
                                labels={{
                                  status: t(`handoffStatus.${handoff.status}`),
                                  itemCount: t('handoffItems', { count: handoff.itemCount }),
                                  submittedBy: t('submittedBy', {
                                    name: handoff.submittedBy ?? t('engineer'),
                                  }),
                                  acceptedBy: handoff.acceptedBy
                                    ? t('handoffAcceptedBy', { name: handoff.acceptedBy })
                                    : '',
                                  orderNo: handoff.submittedOrderNo
                                    ? t('handoffOrderNo', { orderNo: handoff.submittedOrderNo })
                                    : '',
                                  continueCheckout: t('handoffContinue'),
                                  locked:
                                    profile.role === 'engineer'
                                      ? t('engineerCannotProcess')
                                      : t('orderLocked'),
                                }}
                              />
                            ))}
                          </ProjectActionGroup>
                        )}
                        {enterpriseQuoteRequests.length > 0 && (
                          <ProjectActionGroup
                            icon={<FileCheck2 className="text-brand-500 size-5" />}
                            title={t('quotesTitle')}
                            hint={t('quotesHint')}
                            count={t('quoteCount', { count: enterpriseQuoteRequests.length })}
                          >
                            {enterpriseQuoteRequests.map((request) => (
                              <QuoteRequestRow
                                key={request.requestNo}
                                request={request}
                                locale={locale}
                                canProvide={false}
                                canAccept={
                                  isAuthenticated &&
                                  profile.role !== 'engineer' &&
                                  request.status === 'quoted'
                                }
                                onProvide={() => undefined}
                                onAccept={() => acceptLocalQuote(request.requestNo)}
                                labels={{
                                  lines: t('quoteLines'),
                                  submittedBy: t('submittedBy', {
                                    name: request.submittedBy ?? t('engineer'),
                                  }),
                                  estimate: t('quoteEstimate'),
                                  noEstimate: t('quoteNoEstimate'),
                                  provide: t('provideQuote'),
                                  accept: t('acceptQuote'),
                                  locked:
                                    profile.role === 'engineer'
                                      ? t('engineerCannotProcess')
                                      : t('orderLocked'),
                                  status: t(`quoteStatus.${request.status}`),
                                }}
                              />
                            ))}
                          </ProjectActionGroup>
                        )}
                      </div>
                    )}

                    {(actionableApprovalOrders.length > 0 || payableOrders.length > 0) && (
                      <div className="bg-bg-surface flex flex-col gap-3 rounded-lg p-3 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                          <p className="text-text-strong font-medium">{t('actionQueueTitle')}</p>
                          <p className="text-text-muted mt-1 text-sm">{t('actionQueueHint')}</p>
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
                                {t('showPendingApproval', {
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
                              <span>{t('showPendingPayment', { count: payableOrders.length })}</span>
                            </Button>
                          )}
                        </div>
                      </div>
                    )}

                    <div className="bg-bg-surface rounded-lg p-3">
                      <div className="mb-3 flex items-center gap-2">
                        <ListFilter className="text-brand-500 size-4" />
                        <p className="text-text-strong font-medium">{t('filterOrders')}</p>
                      </div>
                      <div>
                        <p className="text-text-muted mb-2 text-xs font-medium">
                          {t('filterStatus')}
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
                      <div className="mt-3">
                        <p className="text-text-muted mb-2 text-xs font-medium">
                          {t('filterProject')}
                        </p>
                        <Select value={projectFilter} onValueChange={setProjectFilter}>
                          <SelectTrigger size="sm" className="w-full text-md">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="max-h-72">
                            {projectOptions.map((project) => (
                              <SelectItem key={project} value={project} className="text-md">
                                {project === 'all' ? t('allProjects') : project}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="mt-3">
                        <p className="text-text-muted mb-2 text-xs font-medium">
                          {t('filterTime')}
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
                      <p className="text-text-muted mt-3 text-sm">
                        {t('filteredOrderCount', { count: filteredOrders.length })}
                      </p>
                    </div>

                    {filteredOrders.length === 0 ? (
                      <div className="bg-bg-surface rounded-lg p-5">
                        <p className="text-text-strong font-medium">{t('noFilteredOrders')}</p>
                        <p className="text-text-muted mt-2 text-sm">{t('noFilteredOrdersHint')}</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {visibleOrders.map((order) => (
                          <OrderRow
                            key={order.orderNo}
                            order={order}
                            locale={locale}
                            roleLabel={t(order.role)}
                            statusLabel={t(`orderStatus.${order.status}`)}
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
                              items: t('items'),
                              approval: order.approvalMode
                                ? t(`approvalMode.${order.approvalMode}`)
                                : t('approvalUnknown'),
                              approvalOwner: order.approvedBy
                                ? t('approvedBy', { name: order.approvedBy })
                                : order.approver
                                  ? t('assignedTo', { name: order.approver })
                                  : t('approvalUnassigned'),
                              payment:
                                order.status === 'pending-quote'
                                  ? t('quoteEstimate')
                                  : order.paymentMethod === 'personal'
                                    ? t('personalPay')
                                    : t('corporatePay'),
                              paymentReceipt: t('paymentReceipt'),
                              paymentConfirmedBy: order.paidBy
                                ? t('paymentConfirmedBy', { name: order.paidBy })
                                : '',
                              submittedBy: t('submittedBy', {
                                name: order.submittedBy ?? t(order.role),
                              }),
                              orderSource: t('orderSource'),
                              sourceWeb: t('sourceWeb'),
                              sourceOs: t('sourceOs'),
                              osProject: t('osProject'),
                              approve: t('approveOrder'),
                              pay: t('markPaid'),
                              advance:
                                order.status === 'paid'
                                  ? t('startProduction')
                                  : order.status === 'in-production'
                                    ? t('shipOrder')
                                    : t('completeOrder'),
                              locked:
                                profile.role === 'engineer'
                                  ? t('engineerCannotProcess')
                                  : t('orderLocked'),
                              downloadBom: t('downloadBom'),
                              downloadUnavailable: t('downloadUnavailable'),
                              viewDetail: t('viewOrderDetail'),
                              bomTitle: t('bomTitle'),
                              deliveryTitle: t('deliveryTitle'),
                              invoiceSummaryTitle: t('invoiceSummaryTitle'),
                              noSnapshot: t('noSnapshot'),
                              noInvoice: t('noInvoice'),
                              qty: t('qty'),
                              unitPrice: t('unitPrice'),
                              lineSubtotal: t('lineSubtotal'),
                              bomIncluded: t('bomIncluded'),
                              bomExcluded: t('bomExcluded'),
                              quoteOnly: t('quoteOnly'),
                              notForSale: t('notForSale'),
                              recipient: t('recipient'),
                              note: t('orderNote'),
                              carrier: t('carrier'),
                              trackingNo: t('trackingNo'),
                              progressSteps: {
                                'pending-quote': t('orderStatus.pending-quote'),
                                'pending-approval': t('orderStatus.pending-approval'),
                                'pending-payment': t('orderStatus.pending-payment'),
                                paid: t('orderStatus.paid'),
                                'in-production': t('orderStatus.in-production'),
                                shipped: t('orderStatus.shipped'),
                                completed: t('orderStatus.completed'),
                              },
                              csvHeaders: {
                                orderNo: t('csv.orderNo'),
                                project: t('csv.project'),
                                productId: t('csv.productId'),
                                model: t('csv.model'),
                                name: t('csv.name'),
                                partClass: t('csv.partClass'),
                                qty: t('csv.qty'),
                                source: t('csv.source'),
                                selected: t('csv.selected'),
                                sellable: t('csv.sellable'),
                                quoteRequired: t('csv.quoteRequired'),
                                unitPrice: t('csv.unitPrice'),
                                subtotal: t('csv.subtotal'),
                                currency: t('csv.currency'),
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
                                  Math.min(count + ACCOUNT_ORDER_PAGE_SIZE, filteredOrders.length),
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
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function EnterpriseSettingsPanel({
  profile,
  members,
  memberForm,
  setMemberForm,
  updateProfile,
  updateMemberRoleName,
  toggleMemberPermission,
  activateMember,
  onSubmit,
}: {
  profile: EnterpriseProfile;
  members: AdminMember[];
  memberForm: MemberFormState;
  setMemberForm: React.Dispatch<React.SetStateAction<MemberFormState>>;
  updateProfile: (patch: Partial<EnterpriseProfile>) => void;
  updateMemberRoleName: (memberId: string, roleName: string, actor?: string) => void;
  toggleMemberPermission: (memberId: string, permission: AdminPermission, actor?: string) => void;
  activateMember: (memberId: string, actor?: string) => void;
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
}) {
  const t = useTranslations('Account');

  return (
    <section className="bg-bg-elevated rounded-lg p-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-3">
          <UsersRound className="text-brand-500 mt-1 size-5 shrink-0" />
          <div>
            <h2 className="text-text-strong text-xl font-semibold">{t('settingsAdminTitle')}</h2>
            <p className="text-text-muted mt-2 text-lg leading-relaxed">{t('settingsAdminHint')}</p>
          </div>
        </div>
        <Badge variant="in-stock">{t('adminOnly')}</Badge>
      </div>

      <div className="mt-5 grid gap-4 xl:grid-cols-[minmax(0,1fr)_320px]">
        <form className="bg-bg-surface rounded-lg p-4" onSubmit={onSubmit}>
          <h3 className="text-text-strong font-semibold">{t('createMemberTitle')}</h3>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <Field label={t('memberName')}>
              <Input
                value={memberForm.name}
                placeholder={t('memberNamePlaceholder')}
                onChange={(event) =>
                  setMemberForm((current) => ({ ...current, name: event.target.value }))
                }
              />
            </Field>
            <Field label={t('memberEmail')}>
              <Input
                value={memberForm.email}
                placeholder={t('memberEmailPlaceholder')}
                onChange={(event) =>
                  setMemberForm((current) => ({ ...current, email: event.target.value }))
                }
              />
            </Field>
            <Field label={t('memberPhone')}>
              <Input
                value={memberForm.phone}
                placeholder={t('memberPhonePlaceholder')}
                onChange={(event) =>
                  setMemberForm((current) => ({ ...current, phone: event.target.value }))
                }
              />
            </Field>
            <Field label={t('memberRoleName')}>
              <Input
                value={memberForm.roleName}
                placeholder={t('memberRoleNamePlaceholder')}
                onChange={(event) =>
                  setMemberForm((current) => ({ ...current, roleName: event.target.value }))
                }
              />
            </Field>
            <div className="md:col-span-2">
              <p className="text-text-muted mb-2 block text-sm">{t('memberPermissions')}</p>
              <PermissionToggleGroup
                permissions={memberForm.permissions}
                disabled={false}
                onToggle={(permission) =>
                  setMemberForm((current) => ({
                    ...current,
                    permissions: current.permissions.includes(permission)
                      ? current.permissions.filter((item) => item !== permission)
                      : [...current.permissions, permission],
                  }))
                }
                t={t}
              />
            </div>
          </div>
          <Button
            type="submit"
            variant="primary"
            className="mt-4 w-full sm:w-fit"
            disabled={
              !memberForm.name.trim() || !memberForm.email.trim() || !memberForm.roleName.trim()
            }
          >
            <UserCog className="size-4" />
            <span>{t('createMember')}</span>
          </Button>
        </form>

        <div className="bg-bg-surface rounded-lg p-4">
          <h3 className="text-text-strong font-semibold">{t('enterpriseProfileTitle')}</h3>
          <div className="mt-4 space-y-4">
            <Field label={t('companyName')}>
              <Input
                value={profile.companyName}
                onChange={(event) => updateProfile({ companyName: event.target.value })}
              />
            </Field>
            <Field label={t('enterpriseId')}>
              <Input value={profile.enterpriseId} disabled />
            </Field>
          </div>
        </div>
      </div>

      <div className="mt-5">
        <h3 className="text-text-strong font-semibold">{t('permissionsTitle')}</h3>
        <div className="mt-3 space-y-3">
          {members.map((member) => {
            const Icon = roleIcons[member.role];
            const isCurrentMember = profile.email === member.email;
            const isEnterpriseOwner = member.role === 'admin';

            return (
              <article
                key={member.id}
                className={`bg-bg-surface min-w-0 rounded-lg p-4 ${
                  isCurrentMember ? 'ring-brand-500/35 ring-2' : ''
                }`}
              >
                <div className="grid gap-4 xl:grid-cols-[minmax(180px,1fr)_minmax(220px,1fr)_minmax(220px,1fr)_auto] xl:items-center">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <Icon className="text-brand-500 size-4 shrink-0" />
                      <p className="text-text-strong truncate font-semibold">{member.name}</p>
                    </div>
                    <p className="text-text-muted mt-1 truncate text-sm">{member.email}</p>
                    {member.phone && (
                      <p className="text-text-muted mt-1 truncate text-xs">{member.phone}</p>
                    )}
                  </div>

                  <div>
                    <Field label={t('memberRoleName')}>
                      <Input
                        value={member.roleName ?? t(member.role)}
                        disabled={isCurrentMember || isEnterpriseOwner}
                        onChange={(event) =>
                          updateMemberRoleName(member.id, event.target.value, profile.contactName)
                        }
                      />
                    </Field>
                  </div>

                  <div>
                    <p className="text-text-muted mb-2 text-xs font-medium">
                      {t('permissionsTitle')}
                    </p>
                    <PermissionToggleGroup
                      permissions={member.permissions}
                      disabled={isCurrentMember || isEnterpriseOwner}
                      onToggle={(permission) =>
                        toggleMemberPermission(member.id, permission, profile.contactName)
                      }
                      t={t}
                    />
                  </div>

                  <div className="flex items-center gap-2 xl:justify-end">
                    <Badge variant={member.status === 'active' ? 'in-stock' : 'secondary'}>
                      {isCurrentMember
                        ? t('memberActive')
                        : member.status === 'active'
                          ? (member.roleName ?? t(member.role))
                          : t('memberInvited')}
                    </Badge>
                    {member.status === 'invited' && (
                      <Button
                        type="button"
                        variant="secondary"
                        onClick={() => activateMember(member.id, profile.contactName)}
                      >
                        <ShieldCheck className="size-4" />
                        <span>{t('activateMember')}</span>
                      </Button>
                    )}
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function PermissionToggleGroup({
  permissions,
  disabled,
  onToggle,
  t,
}: {
  permissions: AdminPermission[];
  disabled: boolean;
  onToggle: (permission: AdminPermission) => void;
  t: (key: string) => string;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {permissionOptions.map((permission) => {
        const selected = permissions.includes(permission);

        return (
          <button
            key={permission}
            type="button"
            aria-pressed={selected}
            disabled={disabled}
            onClick={() => onToggle(permission)}
            className={`rounded-sm px-3 py-1.5 text-sm transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
              selected
                ? 'bg-text-strong text-bg-elevated font-semibold'
                : 'bg-bg-control text-text-muted hover:text-text'
            }`}
          >
            {t(`permission.${permission}`)}
          </button>
        );
      })}
    </div>
  );
}

function InvoiceManagementPanel({
  checkoutDraft,
  invoiceProfiles,
  orders,
  locale,
  updateCheckoutDraft,
  applyInvoiceProfile,
  saveCheckoutInvoice,
  deleteInvoiceProfile,
}: {
  checkoutDraft: CheckoutDraft;
  invoiceProfiles: InvoiceProfile[];
  orders: LocalOrderSnapshot[];
  locale: string;
  updateCheckoutDraft: (patch: Partial<Omit<CheckoutDraft, 'approvalMode' | 'approver'>>) => void;
  applyInvoiceProfile: (invoiceId: string) => void;
  saveCheckoutInvoice: () => void;
  deleteInvoiceProfile: (invoiceId: string) => void;
}) {
  const t = useTranslations('Account');
  const invoiceHistory = useMemo(
    () =>
      orders
        .filter((order) => Boolean(order.invoice))
        .sort((left, right) => Date.parse(right.submittedAt) - Date.parse(left.submittedAt)),
    [orders],
  );

  return (
    <section className="bg-bg-elevated rounded-lg p-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-3">
          <ReceiptText className="text-brand-500 mt-1 size-5 shrink-0" />
          <div>
            <h2 className="text-text-strong text-xl font-semibold">{t('invoicesTitle')}</h2>
            <p className="text-text-muted mt-2 text-lg leading-relaxed">{t('invoicesHint')}</p>
          </div>
        </div>
        <Badge variant="standard">
          {t('invoiceProfileCount', { count: invoiceProfiles.length })}
        </Badge>
      </div>

      <div className="mt-5 grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(320px,400px)]">
        <div className="bg-bg-surface rounded-lg p-4">
          <h3 className="text-text-strong font-semibold">{t('invoiceEditTitle')}</h3>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <Field label={t('invoiceTitle')}>
              <Input
                value={checkoutDraft.invoiceTitle}
                onChange={(event) => updateCheckoutDraft({ invoiceTitle: event.target.value })}
              />
            </Field>
            <Field label={t('taxId')}>
              <Input
                value={checkoutDraft.taxId}
                onChange={(event) => updateCheckoutDraft({ taxId: event.target.value })}
              />
            </Field>
            <Field label={t('bankAccount')} className="md:col-span-2">
              <Input
                value={checkoutDraft.bankAccount}
                onChange={(event) => updateCheckoutDraft({ bankAccount: event.target.value })}
              />
            </Field>
          </div>
          <Button
            variant="primary"
            className="mt-4 w-full sm:w-fit"
            disabled={
              !checkoutDraft.invoiceTitle || !checkoutDraft.taxId || !checkoutDraft.bankAccount
            }
            onClick={saveCheckoutInvoice}
          >
            <FileCheck2 className="size-4" />
            <span>{t('saveInvoiceProfile')}</span>
          </Button>
        </div>

        <div className="bg-bg-surface rounded-lg p-4">
          <h3 className="text-text-strong font-semibold">{t('invoiceProfilesTitle')}</h3>
          {invoiceProfiles.length === 0 ? (
            <p className="text-text-muted mt-3 text-sm">{t('noInvoiceProfiles')}</p>
          ) : (
            <div className="mt-3 space-y-2">
              {invoiceProfiles.map((invoice) => (
                <article
                  key={invoice.id}
                  className="bg-bg-control grid gap-3 rounded-sm px-3 py-2 text-sm sm:grid-cols-[minmax(0,1fr)_auto_auto] sm:items-center"
                >
                  <div className="min-w-0">
                    <p className="text-text-strong truncate font-medium">{invoice.label}</p>
                    <p className="text-text-muted mt-1 truncate">{invoice.title}</p>
                    <p className="text-text-muted mt-1 truncate">{invoice.taxId}</p>
                  </div>
                  <Button variant="secondary" size="sm" onClick={() => applyInvoiceProfile(invoice.id)}>
                    {t('useInvoiceProfile')}
                  </Button>
                  <Button
                    variant="icon"
                    size="icon"
                    onClick={() => deleteInvoiceProfile(invoice.id)}
                    aria-label={t('deleteInvoiceProfile')}
                    title={t('deleteInvoiceProfile')}
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </article>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="bg-bg-surface mt-4 rounded-lg p-4">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h3 className="text-text-strong font-semibold">{t('invoiceHistoryTitle')}</h3>
            <p className="text-text-muted mt-1 text-sm">{t('invoiceHistoryHint')}</p>
          </div>
          <Badge variant="secondary">{t('invoiceHistoryCount', { count: invoiceHistory.length })}</Badge>
        </div>

        {invoiceHistory.length === 0 ? (
          <p className="text-text-muted mt-4 text-sm">{t('noInvoiceHistory')}</p>
        ) : (
          <div className="divide-divider mt-4 divide-y">
            {invoiceHistory.map((order) => (
              <article
                key={`${order.orderNo}-invoice`}
                className="grid gap-3 py-3 lg:grid-cols-[minmax(0,1fr)_minmax(160px,auto)_auto] lg:items-center"
              >
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-text-strong truncate font-medium">{order.projectName}</p>
                    <Badge variant={statusVariant(order.status)}>
                      {t(`orderStatus.${order.status}`)}
                    </Badge>
                  </div>
                  <p className="text-text-muted mt-1 text-sm">{order.orderNo}</p>
                  <p className="text-text-muted mt-1 truncate text-sm">{order.invoice?.title}</p>
                  <p className="text-text-muted mt-1 truncate text-xs">{order.invoice?.taxId}</p>
                </div>
                <div className="text-sm lg:text-right">
                  <p className="text-text-muted">{formatDate(order.submittedAt, locale)}</p>
                  <p className="text-text-strong mt-1 font-semibold tabular-nums">
                    {formatPrice(
                      order.subtotalCents,
                      'CNY',
                      locale === 'zh' ? 'zh-CN' : 'en-US',
                    )}
                  </p>
                  {order.paymentReference && (
                    <p className="text-text-muted mt-1 text-xs">{order.paymentReference}</p>
                  )}
                </div>
                <Button variant="secondary" size="sm" asChild>
                  <Link href={`/store/orders/${encodeURIComponent(order.orderNo)}`}>
                    <ClipboardCheck className="size-4" />
                    <span>{t('viewOrderDetail')}</span>
                  </Link>
                </Button>
              </article>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

function OverviewCard({
  title,
  count,
  body,
  onClick,
}: {
  title: string;
  count: number;
  body: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="bg-bg-elevated hover:bg-bg-control min-h-[112px] rounded-lg p-4 text-left transition-colors"
    >
      <span className="text-text-muted text-sm">{title}</span>
      <span className="text-text-strong mt-3 block text-3xl font-semibold tabular-nums">
        {count}
      </span>
      <span className="text-text-muted mt-2 block text-sm leading-relaxed">{body}</span>
    </button>
  );
}

function ProjectActionGroup({
  icon,
  title,
  hint,
  count,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  hint: string;
  count: string;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-bg-surface rounded-lg p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex items-center gap-3">
            {icon}
            <h3 className="text-text-strong text-lg font-semibold">{title}</h3>
          </div>
          <p className="text-text-muted mt-2 text-sm leading-relaxed">{hint}</p>
        </div>
        <Badge variant="standard">{count}</Badge>
      </div>
      <div className="mt-4 space-y-3">{children}</div>
    </div>
  );
}

export function OrderRow({
  order,
  locale,
  roleLabel,
  statusLabel,
  submittedAtLabel,
  canApprove,
  canPay,
  canAdvance,
  onApprove,
  onPay,
  onAdvance,
  detailHref,
  showDetails = false,
  labels,
}: {
  order: LocalOrderSnapshot;
  locale: string;
  roleLabel: string;
  statusLabel: string;
  submittedAtLabel: string;
  canApprove: boolean;
  canPay: boolean;
  canAdvance: boolean;
  onApprove: () => void;
  onPay: () => void;
  onAdvance: () => void;
  detailHref?: string;
  showDetails?: boolean;
  labels: {
    items: string;
    approval: string;
    approvalOwner: string;
    payment: string;
    paymentReceipt: string;
    paymentConfirmedBy: string;
    submittedBy: string;
    orderSource: string;
    sourceWeb: string;
    sourceOs: string;
    osProject: string;
    approve: string;
    pay: string;
    advance: string;
    locked: string;
    downloadBom: string;
    downloadUnavailable: string;
    viewDetail: string;
    bomTitle: string;
    deliveryTitle: string;
    invoiceSummaryTitle: string;
    noSnapshot: string;
    noInvoice: string;
    qty: string;
    unitPrice: string;
    lineSubtotal: string;
    bomIncluded: string;
    bomExcluded: string;
    quoteOnly: string;
    notForSale: string;
    recipient: string;
    note: string;
    carrier: string;
    trackingNo: string;
    progressSteps: Record<OrderStatus, string>;
    csvHeaders: {
      orderNo: string;
      project: string;
      productId: string;
      model: string;
      name: string;
      partClass: string;
      qty: string;
      source: string;
      selected: string;
      sellable: string;
      quoteRequired: string;
      unitPrice: string;
      subtotal: string;
      currency: string;
    };
  };
}) {
  const statusIcon =
    order.status === 'completed'
      ? FileCheck2
      : ['pending-payment', 'paid', 'in-production', 'shipped'].includes(order.status)
        ? CircleDollarSign
        : Clock3;
  const StatusIcon = statusIcon;
  const canDownloadBom = Boolean(order.lines?.length);
  const isOsOrder =
    Boolean(order.handoffId) || Boolean(order.lines?.some((line) => line.source === 'os'));
  const orderSourceLabel = isOsOrder
    ? `${labels.orderSource}: ${labels.sourceOs}`
    : `${labels.orderSource}: ${labels.sourceWeb}`;

  function handleDownloadBom() {
    if (!order.lines?.length) return;
    downloadCsv(`${order.orderNo}-bom.csv`, buildBomCsv(order, locale, labels.csvHeaders));
  }

  return (
    <article className="bg-bg-surface rounded-lg p-4">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-text-strong text-lg font-semibold">{order.orderNo}</p>
            <Badge variant={statusVariant(order.status)}>
              <StatusIcon className="size-3.5" />
              {statusLabel}
            </Badge>
          </div>
          <p className="text-text mt-2 text-lg">{order.projectName}</p>
          <div className="text-text-muted mt-3 flex flex-wrap gap-x-4 gap-y-1 text-sm">
            <span>{submittedAtLabel}</span>
            <span>{roleLabel}</span>
            <span>{labels.submittedBy}</span>
            <span>{orderSourceLabel}</span>
            {isOsOrder && <span>{`${labels.osProject}: ${order.projectName}`}</span>}
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-[1fr_1fr_auto] xl:min-w-[420px]">
          <div>
            <p className="text-text-muted text-xs">{labels.items}</p>
            <p className="text-text-strong mt-1 text-lg font-medium">{order.itemCount}</p>
          </div>
          <div>
            <p className="text-text-muted text-xs">{labels.payment}</p>
            <p className="text-text-strong mt-1 text-lg font-medium tabular-nums">
              {formatPrice(order.subtotalCents, 'CNY', locale === 'zh' ? 'zh-CN' : 'en-US')}
            </p>
          </div>
          <div className="sm:text-right">
            <p className="text-text-muted text-xs">{labels.approval}</p>
            <p className="text-text-muted mt-1 text-sm">{latestEvent(order, locale)}</p>
            <p className="text-text-strong mt-1 text-sm">{labels.approvalOwner}</p>
          </div>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        {canApprove && (
          <Button variant="secondary" size="sm" onClick={onApprove}>
            <FileCheck2 className="size-4" />
            <span>{labels.approve}</span>
          </Button>
        )}
        {canPay && (
          <Button variant="primary" size="sm" onClick={onPay}>
            <CircleDollarSign className="size-4" />
            <span>{labels.pay}</span>
          </Button>
        )}
        {canAdvance && (
          <Button variant="secondary" size="sm" onClick={onAdvance}>
            <FileCheck2 className="size-4" />
            <span>{labels.advance}</span>
          </Button>
        )}
        {!canApprove && !canPay && !canAdvance && (
          <span className="text-text-muted bg-bg-control inline-flex h-[32px] items-center rounded-sm px-3 text-md">
            {labels.locked}
          </span>
        )}
        <Button
          variant="secondary"
          size="sm"
          disabled={!canDownloadBom}
          onClick={handleDownloadBom}
        >
          <Download className="size-4" />
          <span>{canDownloadBom ? labels.downloadBom : labels.downloadUnavailable}</span>
        </Button>
        {detailHref && (
          <Button variant="secondary" size="sm" asChild>
            <Link href={detailHref}>
              <ClipboardCheck className="size-4" />
              <span>{labels.viewDetail}</span>
            </Link>
          </Button>
        )}
      </div>

      {showDetails && (
        <>
          <OrderProgress status={order.status} labels={labels.progressSteps} />

          <div className="mt-4 grid gap-3 lg:grid-cols-[minmax(0,1fr)_260px]">
            <div className="bg-bg-elevated rounded-md p-3">
              <p className="text-text-strong font-medium">{labels.bomTitle}</p>
              {order.lines && order.lines.length > 0 ? (
                <div className="divide-divider mt-2 divide-y">
                  {order.lines.map((line) => (
                    <div
                      key={`${order.orderNo}-${line.productId}`}
                      className="grid gap-3 py-3 sm:grid-cols-[minmax(0,1fr)_64px_96px_96px]"
                    >
                      <div className="min-w-0">
                        <p className="text-text-strong truncate text-sm">
                          {line.name[locale === 'zh' ? 'zh' : 'en']}
                        </p>
                        <div className="mt-1 flex flex-wrap items-center gap-2">
                          <span className="text-text-muted text-xs">{line.model}</span>
                          <PartClassBadge partClass={line.partClass} />
                          <span className="bg-bg-control text-text-muted rounded-sm px-1.5 py-0.5 text-xs">
                            {line.selected === false ? labels.bomExcluded : labels.bomIncluded}
                          </span>
                          {line.sellable === false && (
                            <span className="bg-bg-control text-text-muted rounded-sm px-1.5 py-0.5 text-xs">
                              {line.quoteRequired ? labels.quoteOnly : labels.notForSale}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="text-sm sm:text-right">
                        <p className="text-text-muted">{labels.qty}</p>
                        <p className="text-text-strong font-medium tabular-nums">{line.qty}</p>
                      </div>
                      <div className="text-sm sm:text-right">
                        <p className="text-text-muted">{labels.unitPrice}</p>
                        <p className="text-text-strong font-medium tabular-nums">
                          {formatPrice(
                            line.unitPriceCents,
                            line.currency,
                            locale === 'zh' ? 'zh-CN' : 'en-US',
                          )}
                        </p>
                      </div>
                      <div className="text-sm sm:text-right">
                        <p className="text-text-muted">{labels.lineSubtotal}</p>
                        <p className="text-text-strong font-medium tabular-nums">
                          {formatPrice(
                            line.subtotalCents,
                            line.currency,
                            locale === 'zh' ? 'zh-CN' : 'en-US',
                          )}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-text-muted mt-2 text-sm">{labels.noSnapshot}</p>
              )}
            </div>

            <div className="bg-bg-elevated rounded-md p-3">
              <p className="text-text-strong font-medium">{labels.deliveryTitle}</p>
              {order.shippingAddress ? (
                <div className="text-text-muted mt-2 space-y-1 text-sm">
                  <p>
                    {labels.recipient}: {order.shippingAddress.recipient} ·{' '}
                    {order.shippingAddress.phone}
                  </p>
                  <p>
                    {order.shippingAddress.province} {order.shippingAddress.city}{' '}
                    {order.shippingAddress.address}
                  </p>
                </div>
              ) : (
                <p className="text-text-muted mt-2 text-sm">{labels.noSnapshot}</p>
              )}

              <p className="text-text-strong mt-4 font-medium">{labels.invoiceSummaryTitle}</p>
              {order.invoice ? (
                <div className="text-text-muted mt-2 space-y-1 text-sm">
                  <p>{order.invoice.title}</p>
                  <p>{order.invoice.taxId}</p>
                  <p>{order.invoice.bankAccount}</p>
                </div>
              ) : (
                <p className="text-text-muted mt-2 text-sm">{labels.noInvoice}</p>
              )}

              {order.paymentReference && (
                <>
                  <p className="text-text-strong mt-4 font-medium">{labels.paymentReceipt}</p>
                  <div className="text-text-muted mt-2 space-y-1 text-sm">
                    <p>{order.paymentReference}</p>
                    {labels.paymentConfirmedBy && <p>{labels.paymentConfirmedBy}</p>}
                  </div>
                </>
              )}

              {order.note && (
                <p className="text-text-muted mt-4 text-sm">{`${labels.note}: ${order.note}`}</p>
              )}

              {(order.carrier || order.trackingNo) && (
                <div className="text-text-muted mt-4 space-y-1 text-sm">
                  {order.carrier && (
                    <p>
                      {labels.carrier}: {order.carrier}
                    </p>
                  )}
                  {order.trackingNo && (
                    <p>
                      {labels.trackingNo}: {order.trackingNo}
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </article>
  );
}

function HandoffRow({
  handoff,
  locale,
  canAccept,
  onAccept,
  labels,
}: {
  handoff: LocalOsHandoff;
  locale: string;
  canAccept: boolean;
  onAccept: () => void;
  labels: {
    status: string;
    itemCount: string;
    submittedBy: string;
    acceptedBy: string;
    orderNo: string;
    continueCheckout: string;
    locked: string;
  };
}) {
  return (
    <article className="bg-bg-surface rounded-lg p-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-text-strong font-semibold">{handoff.projectName}</p>
            <Badge variant={handoff.status === 'submitted' ? 'in-stock' : 'standard'}>
              {labels.status}
            </Badge>
          </div>
          <div className="text-text-muted mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm">
            <span>{formatDate(handoff.submittedAt, locale)}</span>
            <span>{labels.submittedBy}</span>
            <span>{labels.itemCount}</span>
            {labels.acceptedBy && <span>{labels.acceptedBy}</span>}
            {labels.orderNo && <span>{labels.orderNo}</span>}
          </div>
        </div>
        {canAccept ? (
          <Button variant="secondary" size="sm" asChild>
            <Link
              href={`/store/checkout?from=os&project=${encodeURIComponent(
                handoff.projectName,
              )}&projectId=${encodeURIComponent(handoff.projectId)}`}
              onClick={onAccept}
            >
              <GitBranch className="size-4" />
              <span>{labels.continueCheckout}</span>
            </Link>
          </Button>
        ) : (
          <span className="text-text-muted bg-bg-control rounded-sm px-3 py-1 text-sm">
            {labels.locked}
          </span>
        )}
      </div>
    </article>
  );
}

function QuoteRequestRow({
  request,
  locale,
  canProvide,
  canAccept,
  onProvide,
  onAccept,
  labels,
}: {
  request: LocalQuoteRequest;
  locale: string;
  canProvide: boolean;
  canAccept: boolean;
  onProvide: () => void;
  onAccept: () => void;
  labels: {
    lines: string;
    submittedBy: string;
    estimate: string;
    noEstimate: string;
    provide: string;
    accept: string;
    locked: string;
    status: string;
  };
}) {
  return (
    <article className="bg-bg-surface rounded-lg p-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-text-strong font-semibold">{request.requestNo}</p>
            <Badge variant={request.status === 'accepted' ? 'in-stock' : 'standard'}>
              {labels.status}
            </Badge>
          </div>
          <p className="text-text mt-2">{request.projectName}</p>
          <div className="text-text-muted mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm">
            <span>{formatDate(request.submittedAt, locale)}</span>
            <span>{labels.submittedBy}</span>
          </div>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:min-w-[300px]">
          <div>
            <p className="text-text-muted text-xs">{labels.lines}</p>
            <p className="text-text-strong mt-1 font-medium tabular-nums">{request.lines.length}</p>
          </div>
          <div>
            <p className="text-text-muted text-xs">{labels.estimate}</p>
            <p className="text-text-strong mt-1 font-medium tabular-nums">
              {request.estimateCents
                ? formatPrice(request.estimateCents, 'CNY', locale === 'zh' ? 'zh-CN' : 'en-US')
                : labels.noEstimate}
            </p>
          </div>
        </div>
      </div>

      <div className="divide-divider mt-3 divide-y">
        {request.lines.map((line) => (
          <div
            key={`${request.requestNo}-${line.productId}`}
            className="grid gap-3 py-3 sm:grid-cols-[minmax(0,1fr)_auto]"
          >
            <div className="min-w-0">
              <p className="text-text-strong truncate text-sm">
                {line.name[locale === 'zh' ? 'zh' : 'en']}
              </p>
              <div className="mt-1 flex flex-wrap items-center gap-2">
                <span className="text-text-muted text-xs">{line.model}</span>
                <PartClassBadge partClass={line.partClass} />
              </div>
            </div>
            <p className="text-text-muted text-sm sm:text-right">
              x<span className="text-text-strong ml-1 tabular-nums">{line.qty}</span>
            </p>
          </div>
        ))}
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        {canProvide && (
          <Button variant="secondary" size="sm" onClick={onProvide}>
            <FileCheck2 className="size-4" />
            <span>{labels.provide}</span>
          </Button>
        )}
        {canAccept && (
          <Button variant="primary" size="sm" onClick={onAccept}>
            <FileCheck2 className="size-4" />
            <span>{labels.accept}</span>
          </Button>
        )}
        {!canProvide && !canAccept && (
          <span className="text-text-muted bg-bg-control rounded-sm px-3 py-1 text-sm">
            {labels.locked}
          </span>
        )}
      </div>
    </article>
  );
}

function OrderProgress({
  status,
  labels,
}: {
  status: OrderStatus;
  labels: Record<OrderStatus, string>;
}) {
  const steps: OrderStatus[] = [
    status === 'pending-quote' ? 'pending-quote' : 'pending-approval',
    'pending-payment',
    'paid',
    'in-production',
    'shipped',
    'completed',
  ];
  const currentIndex = steps.indexOf(status);

  return (
    <div className="mt-4 grid gap-2 sm:grid-cols-6">
      {steps.map((step, index) => {
        const active = index <= currentIndex;
        return (
          <div
            key={step}
            className={`rounded-sm px-2 py-2 text-xs transition-colors ${
              active ? 'bg-brand-soft text-brand-500' : 'bg-bg-control text-text-muted'
            }`}
          >
            <span className="tabular-nums">{index + 1}</span>
            <span className="ml-1">{labels[step]}</span>
          </div>
        );
      })}
    </div>
  );
}

function Field({
  label,
  className,
  children,
}: {
  label: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <label className={className}>
      <span className="text-text-muted mb-2 block text-sm">{label}</span>
      {children}
    </label>
  );
}

function statusVariant(
  status: LocalOrderSnapshot['status'],
): 'in-stock' | 'standard' | 'secondary' {
  if (status === 'completed') return 'in-stock';
  if (['paid', 'in-production', 'shipped', 'pending-payment'].includes(status)) return 'standard';
  return 'secondary';
}

function latestEvent(order: LocalOrderSnapshot, locale: string): string {
  return formatDate(
    order.completedAt ??
      order.shippedAt ??
      order.productionStartedAt ??
      order.paidAt ??
      order.approvedAt ??
      order.updatedAt ??
      order.submittedAt,
    locale,
  );
}

function formatDate(value: string, locale: string): string {
  return new Intl.DateTimeFormat(locale === 'zh' ? 'zh-CN' : 'en-US', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value));
}

function buildBomCsv(
  order: LocalOrderSnapshot,
  locale: string,
  headers: {
    orderNo: string;
    project: string;
    productId: string;
    model: string;
    name: string;
    partClass: string;
    qty: string;
    source: string;
    selected: string;
    sellable: string;
    quoteRequired: string;
    unitPrice: string;
    subtotal: string;
    currency: string;
  },
): string {
  const rows = [
    [
      headers.orderNo,
      headers.project,
      headers.productId,
      headers.model,
      headers.name,
      headers.partClass,
      headers.qty,
      headers.source,
      headers.selected,
      headers.sellable,
      headers.quoteRequired,
      headers.unitPrice,
      headers.subtotal,
      headers.currency,
    ],
    ...(order.lines ?? []).map((line) => [
      order.orderNo,
      order.projectName,
      line.productId,
      line.model,
      line.name[locale === 'zh' ? 'zh' : 'en'],
      line.partClass,
      String(line.qty),
      line.source ?? '',
      line.selected === false ? '0' : '1',
      line.sellable === false ? '0' : '1',
      line.quoteRequired ? '1' : '0',
      String(line.unitPriceCents / 100),
      String(line.subtotalCents / 100),
      line.currency,
    ]),
  ];

  return rows.map((row) => row.map(csvCell).join(',')).join('\n');
}

function csvCell(value: string): string {
  return `"${value.replaceAll('"', '""')}"`;
}

function downloadCsv(filename: string, csv: string) {
  const blob = new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}
