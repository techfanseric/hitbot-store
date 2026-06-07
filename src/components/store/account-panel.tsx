'use client';

import { useEffect, useMemo, useState } from 'react';
import type React from 'react';
import Link from 'next/link';
import {
  Building2,
  ChevronDown,
  CircleDollarSign,
  ClipboardCheck,
  Clock3,
  Download,
  FileCheck2,
  GitBranch,
  ListFilter,
  LogOut,
  ReceiptText,
  Save,
  Send,
  ShieldCheck,
  Trash2,
  UserCog,
  UsersRound,
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
import { useProcurementHydrated } from '@/hooks/use-procurement-hydrated';
import { approvalSettingsForEnterprise, useAdminStore } from '@/lib/admin-store';
import { formatPrice } from '@/lib/format';
import {
  matchesOrderTimeFilter,
  type OrderDateRange,
  type OrderTimeFilter,
} from '@/lib/order-filters';
import { DEFAULT_ENTERPRISE_ID, useProcurementStore } from '@/lib/procurement-store';
import { canHandleWorkflowRole, workflowOwnerName } from '@/lib/order-workflow';
import { cn } from '@/lib/utils';
import { PartClassBadge } from './part-class-badge';
import { OrderTimeFilterControl } from './order-time-filter-control';
import { ApprovalFlow, type ApprovalFlowStep } from './approval-flow';
import type { AdminApprovalSettings, AdminMember, AdminPermission } from '@/types/admin';
import type {
  CheckoutDraft,
  InvoiceProfile,
  LocalOrderSnapshot,
  LocalOsHandoff,
  LocalQuoteRequest,
} from '@/types/procurement';
import type { EnterpriseProfile, OrderStatus } from '@/types/procurement';

type OrderStatusFilter = 'all' | OrderStatus;
type AccountTab = 'overview' | 'orders' | 'invoices' | 'members' | 'approval';
const ACCOUNT_ORDER_PAGE_SIZE = 8;
type MemberFormState = {
  name: string;
  email: string;
  phone: string;
  roleName: string;
  permissions: AdminPermission[];
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
  const authHydrated = useProcurementHydrated();
  const [activeTab, setActiveTab] = useState<AccountTab>('overview');
  const [statusFilter, setStatusFilter] = useState<OrderStatusFilter>('all');
  const [projectFilter, setProjectFilter] = useState('all');
  const [timeFilter, setTimeFilter] = useState<OrderTimeFilter>('all');
  const [customTimeRange, setCustomTimeRange] = useState<OrderDateRange>({});
  const [visibleOrderCount, setVisibleOrderCount] = useState(ACCOUNT_ORDER_PAGE_SIZE);
  const [orderFiltersOpen, setOrderFiltersOpen] = useState(false);
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
  const approvalSettings = useAdminStore((state) => state.approvalSettings);
  const enterpriseAccessRequests = useAdminStore((state) => state.enterpriseAccessRequests);
  const submitEnterpriseAccessRequest = useAdminStore(
    (state) => state.submitEnterpriseAccessRequest,
  );
  const inviteMember = useAdminStore((state) => state.inviteMember);
  const activateMember = useAdminStore((state) => state.activateMember);
  const toggleMemberPermission = useAdminStore((state) => state.toggleMemberPermission);
  const deleteMember = useAdminStore((state) => state.deleteMember);
  const updateEnterpriseProfile = useAdminStore((state) => state.updateEnterpriseProfile);
  const updateMemberProfile = useAdminStore((state) => state.updateMemberProfile);
  const updateApprovalSettings = useAdminStore((state) => state.updateApprovalSettings);
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
    advanceLocalOrder,
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
  const enterpriseMembers = useMemo(
    () =>
      members.filter(
        (member) => (member.enterpriseId ?? DEFAULT_ENTERPRISE_ID) === profile.enterpriseId,
      ),
    [members, profile.enterpriseId],
  );
  const enterpriseApprovalSettings = useMemo(
    () => approvalSettingsForEnterprise(approvalSettings, enterpriseMembers, profile.enterpriseId),
    [approvalSettings, enterpriseMembers, profile.enterpriseId],
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
        (order) =>
          order.status === 'pending-payment' &&
          canHandleWorkflowRole(profile, enterpriseApprovalSettings, members, 'paymentInvoice'),
      ),
    [enterpriseApprovalSettings, enterpriseOrders, members, profile],
  );
  const receivableOrders = useMemo(
    () =>
      enterpriseOrders.filter(
        (order) =>
          order.status === 'shipped' &&
          canHandleWorkflowRole(profile, enterpriseApprovalSettings, members, 'logistics'),
      ),
    [enterpriseApprovalSettings, enterpriseOrders, members, profile],
  );
  const continuableHandoffs = useMemo(
    () => enterpriseOsHandoffs.filter((handoff) => handoff.status !== 'submitted'),
    [enterpriseOsHandoffs],
  );
  const pendingQuotes = useMemo(
    () => enterpriseQuoteRequests.filter((request) => request.status !== 'accepted'),
    [enterpriseQuoteRequests],
  );
  const pendingOrderActions = pendingOrders.length;
  const projectContinuationCount = continuableHandoffs.length + pendingQuotes.length;
  const isEnterpriseAdmin = profile.role === 'admin';
  const canManageInvoices =
    isEnterpriseAdmin || Boolean(activeMember?.permissions.includes('invoices'));
  const accountTabs: Array<{ key: AccountTab; label: string; count?: number }> = [
    { key: 'overview', label: t('tabOverview') },
    { key: 'orders', label: t('tabOrders'), count: pendingOrderActions },
    ...(canManageInvoices
      ? [
          {
            key: 'invoices' as const,
            label: t('tabInvoices'),
            count: enterpriseInvoiceProfiles.length,
          },
        ]
      : []),
    ...(isEnterpriseAdmin
      ? [
          { key: 'members' as const, label: t('tabMembers') },
          { key: 'approval' as const, label: t('tabApproval') },
        ]
      : []),
  ];
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
    if (activeMember.name && activeMember.name !== profile.contactName) {
      profilePatch.contactName = activeMember.name;
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
      ((activeTab === 'members' || activeTab === 'approval') && !isEnterpriseAdmin) ||
      (activeTab === 'invoices' && !canManageInvoices)
    ) {
      setActiveTab('overview');
    }
  }, [activeTab, canManageInvoices, isEnterpriseAdmin]);

  useEffect(() => {
    setVisibleOrderCount(ACCOUNT_ORDER_PAGE_SIZE);
  }, [customTimeRange, projectFilter, statusFilter, timeFilter]);

  return (
    <div className="grid min-w-0 gap-4">
      {!authHydrated && <section className="bg-bg-elevated min-h-[180px] rounded-lg p-4 md:p-5" />}

      {authHydrated && !isAuthenticated && (
        <section className="bg-bg-elevated rounded-lg p-4 md:p-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex items-start gap-3">
              <Building2 className="text-brand-500 mt-1 size-5 shrink-0" />
              <div>
                <h2 className="text-text-strong text-xl font-semibold">
                  {t('accessRequestTitle')}
                </h2>
                <p className="text-text-muted mt-1.5 text-sm leading-relaxed md:text-base">
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

          <form className="mt-4 grid gap-3 md:gap-4" onSubmit={handleAccessRequestSubmit}>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
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
            <div className="grid gap-3">
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
                  className="border-divider bg-bg-control text-text-strong placeholder:text-text-muted focus:border-brand-500 min-h-[88px] w-full resize-y rounded-md border px-3 py-2 text-sm transition outline-none disabled:cursor-not-allowed disabled:opacity-60"
                />
              </Field>
              <div className="flex justify-end">
                <Button
                  type="submit"
                  variant="primary"
                  className="w-full sm:w-auto"
                  disabled={!canSubmitAccessRequest}
                >
                  <Send className="size-4" />
                  <span>{t('submitAccessRequest')}</span>
                </Button>
              </div>
            </div>
            {latestAccessRequest?.status === 'approved' && latestAccessRequest.enterpriseId && (
              <p className="text-state-green-strong text-sm">
                {t('accessApprovedHint', { enterpriseId: latestAccessRequest.enterpriseId })}
              </p>
            )}
          </form>
        </section>
      )}

      {authHydrated && isAuthenticated && (
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
                  className="text-text-muted hover:bg-bg-control-hover hover:text-brand-500 inline-flex size-[40px] shrink-0 items-center justify-center rounded-sm transition-colors"
                >
                  <LogOut className="size-4" />
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
              <div className="space-y-4">
                <section className="grid gap-4 md:grid-cols-3">
                  <OverviewCard
                    title={t('overviewOrders')}
                    count={pendingOrderActions}
                    body={
                      pendingOrderActions > 0
                        ? t('overviewOrdersBody', { count: pendingOrderActions })
                        : t('overviewOrdersEmpty')
                    }
                    onClick={() => setActiveTab('orders')}
                  />
                  <OverviewCard
                    title={t('overviewProjectActions')}
                    count={projectContinuationCount}
                    body={
                      projectContinuationCount > 0
                        ? t('overviewProjectActionsBody', {
                            handoffs: continuableHandoffs.length,
                            quotes: pendingQuotes.length,
                          })
                        : t('overviewProjectActionsEmpty')
                    }
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

                {projectContinuationCount > 0 && (
                  <section className="bg-bg-elevated rounded-lg p-3 md:p-4">
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2.5">
                          <GitBranch className="text-brand-500 size-4 md:size-5" />
                          <h2 className="text-text-strong text-base font-semibold md:text-lg">
                            {t('projectHandoffTitle')}
                          </h2>
                        </div>
                        <p className="text-text-muted mt-1 text-sm leading-relaxed">
                          {t('projectHandoffHint')}
                        </p>
                      </div>
                      <p className="text-text-muted text-sm">
                        {t('projectHandoffCount', { count: projectContinuationCount })}
                      </p>
                    </div>
                    <div className="mt-3 grid items-start gap-3 xl:grid-cols-2">
                      {continuableHandoffs.length > 0 && (
                        <ProjectActionGroup
                          compact
                          icon={<GitBranch className="text-brand-500 size-4" />}
                          title={t('handoffTitle')}
                          hint={t('handoffHint')}
                          count={t('handoffCount', { count: continuableHandoffs.length })}
                        >
                          {continuableHandoffs.map((handoff) => (
                            <HandoffRow
                              compact
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
                                    ? t('engineerCanReviewProject')
                                    : t('orderLocked'),
                              }}
                            />
                          ))}
                        </ProjectActionGroup>
                      )}
                      {pendingQuotes.length > 0 && (
                        <ProjectActionGroup
                          compact
                          icon={<FileCheck2 className="text-brand-500 size-4" />}
                          title={t('quotesTitle')}
                          hint={t('quotesHint')}
                          count={t('quoteCount', { count: pendingQuotes.length })}
                        >
                          {pendingQuotes.map((request) => (
                            <QuoteRequestRow
                              compact
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
                                    ? t('engineerCanReviewProject')
                                    : t('orderLocked'),
                                status: t(`quoteStatus.${request.status}`),
                              }}
                            />
                          ))}
                        </ProjectActionGroup>
                      )}
                    </div>
                  </section>
                )}
              </div>
            )}

            {isEnterpriseAdmin && activeTab === 'members' && (
              <MemberManagementPanel
                profile={profile}
                members={enterpriseMembers}
                memberForm={memberForm}
                setMemberForm={setMemberForm}
                updateProfile={updateProfile}
                updateEnterpriseProfile={updateEnterpriseProfile}
                updateMemberProfile={updateMemberProfile}
                toggleMemberPermission={toggleMemberPermission}
                deleteMember={deleteMember}
                activateMember={activateMember}
                onSubmit={handleMemberSubmit}
              />
            )}

            {isEnterpriseAdmin && activeTab === 'approval' && (
              <ApprovalSettingsPanel
                profile={profile}
                members={enterpriseMembers}
                settings={enterpriseApprovalSettings}
                updateApprovalSettings={updateApprovalSettings}
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
              <section className="bg-bg-elevated rounded-lg p-3 md:p-4">
                <div className="flex flex-col gap-2.5 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2.5">
                      <ClipboardCheck className="text-brand-500 size-4 md:size-5" />
                      <h2 className="text-text-strong text-base font-semibold md:text-xl">
                        {t('ordersTitle')}
                      </h2>
                    </div>
                    <p className="text-text-muted mt-1 hidden text-sm leading-relaxed xl:block">
                      {t('ordersHint')}
                    </p>
                  </div>
                </div>

                {enterpriseOrders.length === 0 ? (
                  <div className="bg-bg-surface mt-3 rounded-lg p-4">
                    <p className="text-text-strong font-medium">{t('noOrders')}</p>
                    <p className="text-text-muted mt-2 text-sm">{t('noOrdersHint')}</p>
                  </div>
                ) : (
                  <div className="mt-3 space-y-3 md:mt-4">
                    <section className="bg-bg-surface rounded-lg p-3">
                      <div className="flex flex-col gap-2.5 md:flex-row md:items-center md:justify-between">
                        <div className="min-w-0">
                          <p className="text-text-strong font-medium">{t('actionQueueTitle')}</p>
                          <p className="text-text-muted mt-1 text-sm">{t('actionQueueHint')}</p>
                        </div>
                        {actionableApprovalOrders.length > 0 ||
                        payableOrders.length > 0 ||
                        receivableOrders.length > 0 ? (
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
                                <span>
                                  {t('showPendingPayment', { count: payableOrders.length })}
                                </span>
                              </Button>
                            )}
                            {receivableOrders.length > 0 && (
                              <Button
                                variant="secondary"
                                size="sm"
                                onClick={() => setStatusFilter('shipped')}
                              >
                                <ClipboardCheck className="size-4" />
                                <span>
                                  {t('showPendingReceipt', { count: receivableOrders.length })}
                                </span>
                              </Button>
                            )}
                          </div>
                        ) : (
                          <span className="bg-bg-control text-text-muted inline-flex min-h-[36px] items-center rounded-sm px-3 text-sm">
                            {t('noActionQueue')}
                          </span>
                        )}
                      </div>
                    </section>

                    <section className="bg-bg-surface rounded-lg p-2.5 md:p-3">
                      <button
                        type="button"
                        className="flex min-h-[36px] w-full items-center justify-between gap-2 text-left lg:pointer-events-none"
                        onClick={() => setOrderFiltersOpen((value) => !value)}
                        aria-expanded={orderFiltersOpen}
                      >
                        <span className="flex items-center gap-2">
                          <ListFilter className="text-brand-500 size-4" />
                          <span className="text-text-strong font-medium">
                            {t('allOrderRecords')}
                          </span>
                        </span>
                        <span className="text-text-muted hidden text-sm sm:inline">
                          {t('filteredOrderCount', { count: filteredOrders.length })}
                        </span>
                        <ChevronDown
                          className={cn(
                            'size-4 shrink-0 transition-transform lg:hidden',
                            orderFiltersOpen && 'rotate-180',
                          )}
                        />
                      </button>
                      <div className={cn(orderFiltersOpen ? 'block' : 'hidden lg:block')}>
                        <div className="overflow-hidden lg:overflow-visible">
                          <div className="mt-3">
                            <p className="text-text-muted mb-2 text-xs font-medium">
                              {t('filterStatus')}
                            </p>
                            <div className="flex flex-wrap gap-1.5">
                              {statusFilters.map((filter) => (
                                <button
                                  key={filter.key}
                                  type="button"
                                  onClick={() => setStatusFilter(filter.key)}
                                  className={`text-md inline-flex h-[36px] items-center rounded-sm px-2.5 transition-colors ${
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
                              <SelectTrigger size="sm" className="text-md w-full">
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
                            <OrderTimeFilterControl
                              options={timeFilters}
                              value={timeFilter}
                              from={customTimeRange.from ?? ''}
                              to={customTimeRange.to ?? ''}
                              labels={{
                                from: t('timeFrom'),
                                to: t('timeTo'),
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
                          <p className="text-text-muted mt-3 text-sm sm:hidden">
                            {t('filteredOrderCount', { count: filteredOrders.length })}
                          </p>
                        </div>
                      </div>
                    </section>

                    {filteredOrders.length === 0 ? (
                      <div className="bg-bg-surface rounded-lg p-4">
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
                            statusLabel={t(`orderStatus.${order.status}`)}
                            submittedAtLabel={formatDate(order.submittedAt, locale)}
                            canApprove={isAuthenticated && canApproveOrder(profile, order)}
                            canPay={
                              isAuthenticated &&
                              order.status === 'pending-payment' &&
                              canHandleWorkflowRole(
                                profile,
                                enterpriseApprovalSettings,
                                members,
                                'paymentInvoice',
                              )
                            }
                            canAdvance={
                              isAuthenticated &&
                              order.status === 'shipped' &&
                              canHandleWorkflowRole(
                                profile,
                                enterpriseApprovalSettings,
                                members,
                                'logistics',
                              )
                            }
                            onApprove={() => approveLocalOrder(order.orderNo)}
                            onPay={() => markLocalOrderPaid(order.orderNo)}
                            onAdvance={() => advanceLocalOrder(order.orderNo)}
                            detailHref={`/${locale}/orders/${encodeURIComponent(order.orderNo)}`}
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
                              approvalFlow: {
                                title: t('approvalFlowTitle'),
                                submitted: t('approvalFlowSubmitted'),
                                quote: t('approvalFlowQuote'),
                                delivery: t('approvalFlowDelivery'),
                                approval: t('approvalFlowApproval'),
                                payment: t('approvalFlowPayment'),
                                fulfillment: t('approvalFlowFulfillment'),
                                deliveryOwner: workflowOwnerName(
                                  enterpriseApprovalSettings,
                                  members,
                                  'delivery',
                                  t('approvalUnassigned'),
                                ),
                                paymentInvoiceOwner: workflowOwnerName(
                                  enterpriseApprovalSettings,
                                  members,
                                  'paymentInvoice',
                                  t('approvalUnassigned'),
                                ),
                                logisticsOwner: workflowOwnerName(
                                  enterpriseApprovalSettings,
                                  members,
                                  'logistics',
                                  t('approvalUnassigned'),
                                ),
                                skipped: t('approvalFlowSkipped'),
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

function MemberManagementPanel({
  profile,
  members,
  memberForm,
  setMemberForm,
  updateProfile,
  updateEnterpriseProfile,
  updateMemberProfile,
  toggleMemberPermission,
  deleteMember,
  activateMember,
  onSubmit,
}: {
  profile: EnterpriseProfile;
  members: AdminMember[];
  memberForm: MemberFormState;
  setMemberForm: React.Dispatch<React.SetStateAction<MemberFormState>>;
  updateProfile: (patch: Partial<EnterpriseProfile>) => void;
  updateEnterpriseProfile: (enterpriseId: string, companyName: string, actor?: string) => void;
  updateMemberProfile: (
    memberId: string,
    patch: { name?: string; email?: string; phone?: string; roleName?: string },
    actor?: string,
  ) => void;
  toggleMemberPermission: (memberId: string, permission: AdminPermission, actor?: string) => void;
  deleteMember: (memberId: string, actor?: string) => void;
  activateMember: (memberId: string, actor?: string) => void;
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
}) {
  const t = useTranslations('Account');
  const [enterpriseDraft, setEnterpriseDraft] = useState({
    companyName: profile.companyName,
  });
  const [memberDrafts, setMemberDrafts] = useState<
    Record<string, { name: string; email: string; phone: string; roleName: string }>
  >({});

  useEffect(() => {
    setEnterpriseDraft({ companyName: profile.companyName });
  }, [profile.companyName]);

  useEffect(() => {
    setMemberDrafts((current) => {
      const nextDrafts: Record<
        string,
        { name: string; email: string; phone: string; roleName: string }
      > = {};
      members.forEach((member) => {
        nextDrafts[member.id] = current[member.id] ?? {
          name: member.name,
          email: member.email,
          phone: member.phone ?? '',
          roleName: member.roleName ?? '',
        };
      });
      return nextDrafts;
    });
  }, [members]);

  function saveEnterpriseProfile() {
    const companyName = enterpriseDraft.companyName.trim();
    if (!companyName || companyName === profile.companyName) return;
    updateEnterpriseProfile(profile.enterpriseId, companyName, profile.contactName);
    updateProfile({ companyName });
  }

  function updateMemberDraft(
    memberId: string,
    patch: Partial<{ name: string; email: string; phone: string; roleName: string }>,
  ) {
    setMemberDrafts((current) => ({
      ...current,
      [memberId]: {
        name: current[memberId]?.name ?? '',
        email: current[memberId]?.email ?? '',
        phone: current[memberId]?.phone ?? '',
        roleName: current[memberId]?.roleName ?? '',
        ...patch,
      },
    }));
  }

  function saveMember(member: AdminMember) {
    const draft = memberDrafts[member.id];
    if (!draft) return;

    const name = draft.name.trim();
    const email = draft.email.trim().toLowerCase();
    const phone = draft.phone.trim();
    const roleName = draft.roleName.trim();
    if (!name || !email) return;

    updateMemberProfile(
      member.id,
      {
        name,
        email,
        phone,
        roleName,
      },
      profile.contactName,
    );

    if (profile.email === member.email) {
      updateProfile({
        contactName: name,
        email,
        phone,
      });
    }
  }

  return (
    <section className="bg-bg-elevated rounded-lg p-4 md:p-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-3">
          <UsersRound className="text-brand-500 mt-1 size-5 shrink-0" />
          <div>
            <h2 className="text-text-strong text-xl font-semibold">{t('settingsAdminTitle')}</h2>
            <p className="text-text-muted mt-1.5 text-sm leading-relaxed md:text-base">
              {t('settingsAdminHint')}
            </p>
          </div>
        </div>
        <Badge variant="in-stock">{t('adminOnly')}</Badge>
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-[minmax(0,1fr)_320px]">
        <form className="bg-bg-surface rounded-lg p-4" onSubmit={onSubmit}>
          <h3 className="text-text-strong font-semibold">{t('createMemberTitle')}</h3>
          <div className="mt-4 grid gap-4">
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
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <h3 className="text-text-strong font-semibold">{t('enterpriseProfileTitle')}</h3>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              className="w-full sm:w-fit"
              disabled={
                !enterpriseDraft.companyName.trim() ||
                enterpriseDraft.companyName.trim() === profile.companyName
              }
              onClick={saveEnterpriseProfile}
            >
              <Save className="size-4" />
              <span>{t('saveEnterpriseProfile')}</span>
            </Button>
          </div>
          <div className="mt-4 space-y-4">
            <Field label={t('companyName')}>
              <Input
                value={enterpriseDraft.companyName}
                onChange={(event) => setEnterpriseDraft({ companyName: event.target.value })}
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
            const isCurrentMember = profile.email === member.email;
            const isEnterpriseOwner = member.role === 'admin';
            const canDeleteMember = !isCurrentMember && !isEnterpriseOwner;
            const draft = memberDrafts[member.id] ?? {
              name: member.name,
              email: member.email,
              phone: member.phone ?? '',
              roleName: member.roleName ?? '',
            };
            const memberDirty =
              draft.name.trim() !== member.name ||
              draft.email.trim().toLowerCase() !== member.email ||
              draft.phone.trim() !== (member.phone ?? '') ||
              draft.roleName.trim() !== (member.roleName ?? '');

            return (
              <article key={member.id} className="bg-bg-surface min-w-0 rounded-lg p-4">
                <div className="grid gap-4 xl:grid-cols-[minmax(260px,1.2fr)_minmax(260px,1fr)_auto] xl:items-start">
                  <div className="min-w-0 space-y-3">
                    <div className="grid gap-2 sm:grid-cols-2">
                      <Field
                        label={t('memberName')}
                        labelSuffix={
                          isCurrentMember ? (
                            <Badge variant="standard">{t('memberActive')}</Badge>
                          ) : undefined
                        }
                      >
                        <Input
                          value={draft.name}
                          onChange={(event) =>
                            updateMemberDraft(member.id, { name: event.target.value })
                          }
                        />
                      </Field>
                      <Field label={t('memberEmail')}>
                        <Input
                          value={draft.email}
                          placeholder={t('memberEmailPlaceholder')}
                          onChange={(event) =>
                            updateMemberDraft(member.id, { email: event.target.value })
                          }
                        />
                      </Field>
                      <Field label={t('memberPhone')}>
                        <Input
                          value={draft.phone}
                          placeholder={t('memberPhonePlaceholder')}
                          onChange={(event) =>
                            updateMemberDraft(member.id, { phone: event.target.value })
                          }
                        />
                      </Field>
                      <Field label={t('memberRoleName')}>
                        <Input
                          value={draft.roleName}
                          disabled={isEnterpriseOwner}
                          placeholder={isEnterpriseOwner ? t('adminRoleLocked') : undefined}
                          onChange={(event) =>
                            updateMemberDraft(member.id, { roleName: event.target.value })
                          }
                        />
                      </Field>
                    </div>
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

                  <div className="flex flex-wrap items-center gap-2 xl:justify-end">
                    {member.status === 'invited' && (
                      <Badge variant="secondary">{t('memberInvited')}</Badge>
                    )}
                    <Button
                      type="button"
                      variant="icon"
                      size="icon"
                      disabled={!draft.name.trim() || !draft.email.trim() || !memberDirty}
                      onClick={() => saveMember(member)}
                      aria-label={t('saveMemberProfile')}
                      title={t('saveMemberProfile')}
                    >
                      <Save className="size-4" />
                    </Button>
                    <Button
                      type="button"
                      variant="icon"
                      size="icon"
                      disabled={!canDeleteMember}
                      onClick={() => deleteMember(member.id, profile.contactName)}
                      aria-label={t('deleteMemberProfile')}
                      title={t('deleteMemberProfile')}
                    >
                      <Trash2 className="size-4" />
                    </Button>
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

function ApprovalSettingsPanel({
  profile,
  members,
  settings,
  updateApprovalSettings,
}: {
  profile: EnterpriseProfile;
  members: AdminMember[];
  settings: AdminApprovalSettings;
  updateApprovalSettings: (
    enterpriseId: string,
    patch: Partial<Omit<AdminApprovalSettings, 'enterpriseId' | 'updatedAt'>>,
    actor?: string,
  ) => void;
}) {
  const t = useTranslations('Account');
  const locale = useLocale();
  const approverOptions = members.filter(
    (member) => member.status === 'active' && member.role === 'admin',
  );
  const fallbackApprover = members.find((member) => member.status === 'active');
  const selectedApprover =
    members.find((member) => member.id === settings.defaultApproverMemberId) ??
    approverOptions[0] ??
    fallbackApprover;
  const responsibilityOptions = members.filter((member) => member.status === 'active');
  const thresholdValue =
    settings.amountThresholdCents === null ? '' : String(settings.amountThresholdCents / 100);

  function updateSettings(
    patch: Partial<Omit<AdminApprovalSettings, 'enterpriseId' | 'updatedAt'>>,
  ) {
    updateApprovalSettings(profile.enterpriseId, patch, profile.contactName);
  }

  return (
    <section className="bg-bg-elevated rounded-lg p-4 md:p-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-3">
          <ShieldCheck className="text-brand-500 mt-1 size-5 shrink-0" />
          <div>
            <h2 className="text-text-strong text-xl font-semibold">{t('approvalSettingsTitle')}</h2>
            <p className="text-text-muted mt-1.5 text-sm leading-relaxed md:text-base">
              {t('approvalSettingsHint')}
            </p>
          </div>
        </div>
        <Badge variant="standard">{t('adminOnly')}</Badge>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(300px,380px)]">
        <div className="bg-bg-surface rounded-lg p-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Field label={t('approvalDefaultApprover')}>
              <Select
                value={selectedApprover?.id ?? ''}
                onValueChange={(defaultApproverMemberId) =>
                  updateSettings({ defaultApproverMemberId })
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(approverOptions.length > 0 ? approverOptions : members).map((member) => (
                    <SelectItem key={member.id} value={member.id}>
                      {member.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field label={t('approvalAmountThreshold')}>
              <Input
                type="number"
                min="0"
                value={thresholdValue}
                placeholder={t('approvalAmountPlaceholder')}
                onChange={(event) => {
                  const value = event.target.value;
                  const numericValue = Number(value);
                  updateSettings({
                    amountThresholdCents:
                      value && Number.isFinite(numericValue)
                        ? Math.max(0, Math.round(numericValue * 100))
                        : null,
                  });
                }}
              />
            </Field>
          </div>

          <div className="border-divider mt-5 border-t pt-4">
            <h3 className="text-text-strong font-semibold">{t('workflowSettingsTitle')}</h3>
            <p className="text-text-muted mt-1 text-sm leading-relaxed">
              {t('workflowSettingsHint')}
            </p>
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <MemberSelectField
                label={t('workflowReviewOwner')}
                value={settings.orderReviewerMemberId}
                members={responsibilityOptions}
                onChange={(orderReviewerMemberId) => updateSettings({ orderReviewerMemberId })}
              />
              <MemberSelectField
                label={t('workflowDeliveryOwner')}
                value={settings.deliveryOwnerMemberId}
                members={responsibilityOptions}
                onChange={(deliveryOwnerMemberId) => updateSettings({ deliveryOwnerMemberId })}
              />
              <MemberSelectField
                label={t('workflowPaymentInvoiceOwner')}
                value={settings.paymentInvoiceOwnerMemberId}
                members={responsibilityOptions}
                onChange={(paymentInvoiceOwnerMemberId) =>
                  updateSettings({ paymentInvoiceOwnerMemberId })
                }
              />
              <MemberSelectField
                label={t('workflowLogisticsOwner')}
                value={settings.logisticsOwnerMemberId}
                members={responsibilityOptions}
                onChange={(logisticsOwnerMemberId) => updateSettings({ logisticsOwnerMemberId })}
              />
            </div>
          </div>

          <div className="mt-4 grid gap-3">
            <ApprovalToggle
              checked={settings.requireBuyerOrderApproval}
              title={t('approvalBuyerOrders')}
              body={t('approvalBuyerOrdersHint')}
              onChange={(requireBuyerOrderApproval) =>
                updateSettings({ requireBuyerOrderApproval })
              }
            />
            <ApprovalToggle
              checked={settings.requireQuoteOrderApproval}
              title={t('approvalQuoteOrders')}
              body={t('approvalQuoteOrdersHint')}
              onChange={(requireQuoteOrderApproval) =>
                updateSettings({ requireQuoteOrderApproval })
              }
            />
          </div>
        </div>

        <div className="bg-bg-surface rounded-lg p-4">
          <h3 className="text-text-strong font-semibold">{t('approvalRuleTitle')}</h3>
          <div className="text-text-muted mt-3 space-y-2 text-sm">
            <p>
              {t('workflowRuleReview', {
                name: workflowOwnerName(settings, members, 'review', t('approvalUnassigned')),
              })}
            </p>
            <p>
              {t('workflowRuleDelivery', {
                name: workflowOwnerName(settings, members, 'delivery', t('approvalUnassigned')),
              })}
            </p>
            <p>
              {t('workflowRulePaymentInvoice', {
                name: workflowOwnerName(
                  settings,
                  members,
                  'paymentInvoice',
                  t('approvalUnassigned'),
                ),
              })}
            </p>
            <p>
              {t('workflowRuleLogistics', {
                name: workflowOwnerName(settings, members, 'logistics', t('approvalUnassigned')),
              })}
            </p>
            <p>
              {t('approvalRuleApprover', {
                name: selectedApprover?.name ?? t('approvalUnassigned'),
              })}
            </p>
            <p>
              {settings.requireBuyerOrderApproval
                ? t('approvalRuleBuyerRequired')
                : t('approvalRuleBuyerOptional')}
            </p>
            <p>
              {settings.requireQuoteOrderApproval
                ? t('approvalRuleQuoteRequired')
                : t('approvalRuleQuoteOptional')}
            </p>
            <p>
              {settings.amountThresholdCents === null
                ? t('approvalRuleNoThreshold')
                : t('approvalRuleThreshold', {
                    amount: formatPrice(
                      settings.amountThresholdCents,
                      'CNY',
                      locale === 'zh' ? 'zh-CN' : 'en-US',
                    ),
                  })}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

function MemberSelectField({
  label,
  value,
  members,
  onChange,
}: {
  label: string;
  value?: string;
  members: AdminMember[];
  onChange: (memberId: string) => void;
}) {
  return (
    <Field label={label}>
      <Select value={value ?? ''} onValueChange={onChange}>
        <SelectTrigger className="w-full">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {members.map((member) => (
            <SelectItem key={member.id} value={member.id}>
              {member.name}
              {member.roleName ? ` · ${member.roleName}` : ''}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </Field>
  );
}

function ApprovalToggle({
  checked,
  title,
  body,
  onChange,
}: {
  checked: boolean;
  title: string;
  body: string;
  onChange: (checked: boolean) => void;
}) {
  return (
    <label className="bg-bg-control hover:bg-bg-control-hover flex cursor-pointer items-start gap-3 rounded-md p-3 transition-colors">
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        className="accent-brand-500 mt-1 size-4"
      />
      <span>
        <span className="text-text-strong block text-sm font-medium">{title}</span>
        <span className="text-text-muted mt-1 block text-sm leading-relaxed">{body}</span>
      </span>
    </label>
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
            className={`min-h-[36px] rounded-sm px-3 py-1.5 text-sm transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
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
    <section className="bg-bg-elevated rounded-lg p-4 md:p-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-3">
          <ReceiptText className="text-brand-500 mt-1 size-5 shrink-0" />
          <div>
            <h2 className="text-text-strong text-xl font-semibold">{t('invoicesTitle')}</h2>
            <p className="text-text-muted mt-1.5 text-sm leading-relaxed md:text-base">
              {t('invoicesHint')}
            </p>
          </div>
        </div>
        <Badge variant="standard">
          {t('invoiceProfileCount', { count: invoiceProfiles.length })}
        </Badge>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(320px,400px)]">
        <div className="bg-bg-surface rounded-lg p-4">
          <h3 className="text-text-strong font-semibold">{t('invoiceEditTitle')}</h3>
          <div className="mt-4 grid gap-4">
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
            <Field label={t('bankAccount')}>
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
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => applyInvoiceProfile(invoice.id)}
                  >
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
          <Badge variant="secondary">
            {t('invoiceHistoryCount', { count: invoiceHistory.length })}
          </Badge>
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
                    {formatPrice(order.subtotalCents, 'CNY', locale === 'zh' ? 'zh-CN' : 'en-US')}
                  </p>
                  {order.paymentReference && (
                    <p className="text-text-muted mt-1 text-xs">{order.paymentReference}</p>
                  )}
                </div>
                <Button variant="secondary" size="sm" asChild>
                  <Link href={`/${locale}/orders/${encodeURIComponent(order.orderNo)}`}>
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
  onClick?: () => void;
}) {
  const className =
    'bg-bg-elevated min-h-[88px] rounded-lg p-3 text-left transition-colors' +
    (onClick ? ' hover:bg-bg-control' : '');
  const content = (
    <>
      <span className="text-text-muted text-sm">{title}</span>
      <span className="text-text-strong mt-2 block text-2xl font-semibold tabular-nums">
        {count}
      </span>
      <span className="text-text-muted mt-1.5 block text-sm leading-relaxed">{body}</span>
    </>
  );

  if (!onClick) {
    return <div className={className}>{content}</div>;
  }

  return (
    <button type="button" onClick={onClick} className={className}>
      {content}
    </button>
  );
}

export function ProjectActionGroup({
  icon,
  title,
  hint,
  count,
  children,
  compact = false,
}: {
  icon: React.ReactNode;
  title: string;
  hint: string;
  count: string;
  children: React.ReactNode;
  compact?: boolean;
}) {
  return (
    <div className={cn(compact ? 'bg-bg-elevated rounded-md p-3' : 'bg-bg-surface rounded-lg p-4')}>
      <div className="flex flex-col gap-2.5 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex items-center gap-2.5">
            {icon}
            <h3 className="text-text-strong text-base font-semibold">{title}</h3>
          </div>
          <p className="text-text-muted mt-1.5 text-sm leading-relaxed">{hint}</p>
        </div>
        <Badge variant="standard">{count}</Badge>
      </div>
      <div className="mt-3 flex flex-col gap-2.5">{children}</div>
    </div>
  );
}

export function OrderRow({
  order,
  locale,
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
  detailOnly = false,
  labels,
}: {
  order: LocalOrderSnapshot;
  locale: string;
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
  detailOnly?: boolean;
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
    approvalFlow: {
      title: string;
      submitted: string;
      quote: string;
      delivery: string;
      approval: string;
      payment: string;
      fulfillment: string;
      deliveryOwner: string;
      paymentInvoiceOwner: string;
      logisticsOwner: string;
      skipped: string;
    };
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
  const approvalFlowSteps = orderApprovalFlowSteps(order, locale, labels.approvalFlow);

  function handleDownloadBom() {
    if (!order.lines?.length) return;
    downloadCsv(`${order.orderNo}-bom.csv`, buildBomCsv(order, locale, labels.csvHeaders));
  }

  const actionControls = (
    <>
      {canApprove && (
        <Button variant="secondary" size="sm" className="h-[36px] px-3" onClick={onApprove}>
          <FileCheck2 className="size-4" />
          <span>{labels.approve}</span>
        </Button>
      )}
      {canPay && (
        <Button variant="primary" size="sm" className="h-[36px] px-3" onClick={onPay}>
          <CircleDollarSign className="size-4" />
          <span>{labels.pay}</span>
        </Button>
      )}
      {canAdvance && (
        <Button variant="secondary" size="sm" className="h-[36px] px-3" onClick={onAdvance}>
          <FileCheck2 className="size-4" />
          <span>{labels.advance}</span>
        </Button>
      )}
      {!canApprove && !canPay && !canAdvance && showDetails && !detailOnly && (
        <span className="text-text-muted bg-bg-control text-md inline-flex h-[36px] items-center rounded-sm px-3">
          {labels.locked}
        </span>
      )}
      <Button
        variant="secondary"
        size="sm"
        className="h-[36px] px-3"
        disabled={!canDownloadBom}
        onClick={handleDownloadBom}
      >
        <Download className="size-4" />
        <span>{canDownloadBom ? labels.downloadBom : labels.downloadUnavailable}</span>
      </Button>
      {detailHref && (
        <Button variant="secondary" size="sm" className="h-[36px] px-3" asChild>
          <Link href={detailHref}>
            <ClipboardCheck className="size-4" />
            <span>{labels.viewDetail}</span>
          </Link>
        </Button>
      )}
    </>
  );

  return (
    <article className="bg-bg-surface rounded-lg p-2.5 md:p-3">
      {!detailOnly && (
        <>
          <div className="flex flex-col gap-2.5 md:gap-3 xl:flex-row xl:items-start xl:justify-between">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-text-strong text-base font-semibold md:text-lg">
                  {order.orderNo}
                </p>
                <Badge variant={statusVariant(order.status)}>
                  <StatusIcon className="size-3.5" />
                  {statusLabel}
                </Badge>
              </div>
              <p className="text-text mt-1 text-base font-medium">{order.projectName}</p>
              <div className="text-text-muted mt-1.5 flex flex-wrap gap-x-3 gap-y-1 text-sm md:gap-x-4">
                <span>{submittedAtLabel}</span>
                <span>{labels.submittedBy}</span>
                <span>{orderSourceLabel}</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-[1fr_1fr_auto] xl:min-w-[400px]">
              <div>
                <p className="text-text-muted text-xs">{labels.items}</p>
                <p className="text-text-strong mt-1 text-base font-medium">{order.itemCount}</p>
              </div>
              <div>
                <p className="text-text-muted text-xs">{labels.payment}</p>
                <p className="text-text-strong mt-1 text-base font-medium tabular-nums">
                  {formatPrice(order.subtotalCents, 'CNY', locale === 'zh' ? 'zh-CN' : 'en-US')}
                </p>
              </div>
              <div className="col-span-2 sm:col-span-1 sm:text-right">
                <p className="text-text-muted text-xs">{labels.approval}</p>
                <p className="text-text-muted mt-1 text-sm">{latestEvent(order, locale)}</p>
                <p className="text-text-strong mt-1 text-sm">{labels.approvalOwner}</p>
              </div>
            </div>
          </div>
        </>
      )}

      {(!detailOnly || !showDetails) && (
        <div className={`${detailOnly ? '' : 'mt-3'} flex flex-wrap items-center gap-1.5 md:gap-2`}>
          {actionControls}
        </div>
      )}

      {showDetails && (
        <>
          {detailOnly ? (
            <div className="flex flex-wrap items-center gap-1.5 md:gap-2">
              <div className="flex flex-wrap items-center gap-1.5 md:gap-2">{actionControls}</div>
            </div>
          ) : null}
          <ApprovalFlow
            title={labels.approvalFlow.title}
            steps={approvalFlowSteps}
            className="border-divider mt-3 border-t pt-3"
          />

          <div className="mt-4 grid gap-3 lg:grid-cols-[minmax(0,1fr)_260px]">
            <div className="bg-bg-elevated rounded-md p-3">
              <p className="text-text-strong font-medium">{labels.bomTitle}</p>
              {order.lines && order.lines.length > 0 ? (
                <div className="divide-divider mt-2 divide-y">
                  {order.lines.map((line) => (
                    <div
                      key={`${order.orderNo}-${line.productId}`}
                      className="grid grid-cols-3 gap-x-3 gap-y-2 py-3 sm:grid-cols-[minmax(0,1fr)_64px_96px_96px] sm:gap-3"
                    >
                      <div className="col-span-3 min-w-0 sm:col-span-1">
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
                      <div className="min-w-0 text-sm sm:text-right">
                        <p className="text-text-muted">{labels.qty}</p>
                        <p className="text-text-strong font-medium tabular-nums">{line.qty}</p>
                      </div>
                      <div className="min-w-0 text-sm sm:text-right">
                        <p className="text-text-muted">{labels.unitPrice}</p>
                        <p className="text-text-strong font-medium tabular-nums">
                          {formatPrice(
                            line.unitPriceCents,
                            line.currency,
                            locale === 'zh' ? 'zh-CN' : 'en-US',
                          )}
                        </p>
                      </div>
                      <div className="min-w-0 text-sm sm:text-right">
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

export function HandoffRow({
  handoff,
  locale,
  canAccept,
  onAccept,
  labels,
  compact = false,
}: {
  handoff: LocalOsHandoff;
  locale: string;
  canAccept: boolean;
  onAccept: () => void;
  compact?: boolean;
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
    <article
      className={cn(compact ? 'bg-bg-surface rounded-md p-3' : 'bg-bg-surface rounded-lg p-4')}
    >
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
              href={`/${locale}/checkout?from=os&project=${encodeURIComponent(
                handoff.projectName,
              )}&projectId=${encodeURIComponent(handoff.projectId)}`}
              onClick={onAccept}
            >
              <GitBranch className="size-4" />
              <span>{labels.continueCheckout}</span>
            </Link>
          </Button>
        ) : (
          <span className="text-text-muted bg-bg-control inline-flex min-h-[36px] items-center rounded-sm px-3 text-sm">
            {labels.locked}
          </span>
        )}
      </div>
    </article>
  );
}

export function QuoteRequestRow({
  request,
  locale,
  canProvide,
  canAccept,
  onProvide,
  onAccept,
  labels,
  compact = false,
}: {
  request: LocalQuoteRequest;
  locale: string;
  canProvide: boolean;
  canAccept: boolean;
  onProvide: () => void;
  onAccept: () => void;
  compact?: boolean;
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
    <article
      className={cn(compact ? 'bg-bg-surface rounded-md p-3' : 'bg-bg-surface rounded-lg p-4')}
    >
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
        <div
          className={cn(
            'grid gap-3 sm:grid-cols-2',
            compact ? 'grid-cols-2 lg:min-w-0' : 'lg:min-w-[300px]',
          )}
        >
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

      <div className={cn('divide-divider mt-3 hidden divide-y lg:block', compact && 'lg:hidden')}>
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
          <span className="text-text-muted bg-bg-control inline-flex min-h-[36px] items-center rounded-sm px-3 text-sm">
            {labels.locked}
          </span>
        )}
      </div>
    </article>
  );
}

function orderApprovalFlowSteps(
  order: LocalOrderSnapshot,
  locale: string,
  labels: {
    submitted: string;
    quote: string;
    delivery: string;
    approval: string;
    payment: string;
    fulfillment: string;
    deliveryOwner: string;
    paymentInvoiceOwner: string;
    logisticsOwner: string;
    skipped: string;
  },
): ApprovalFlowStep[] {
  const statusOrder: OrderStatus[] = [
    'pending-quote',
    'pending-approval',
    'pending-payment',
    'paid',
    'in-production',
    'shipped',
    'completed',
  ];
  const statusIndex = statusOrder.indexOf(order.status);
  const approvalRequired =
    order.approvalMode !== 'not-required' && order.approvalMode !== 'admin-direct';
  const paymentDone = ['paid', 'in-production', 'shipped', 'completed'].includes(order.status);
  const fulfillmentDone = order.status === 'completed';
  const fulfillmentCurrent = ['paid', 'in-production', 'shipped'].includes(order.status);
  const approvalMeta = order.approvedBy
    ? `${order.approvedBy} · ${formatDate(order.approvedAt ?? order.updatedAt ?? order.submittedAt, locale)}`
    : order.approver
      ? order.approver
      : approvalRequired
        ? undefined
        : labels.skipped;
  const steps: ApprovalFlowStep[] = [
    {
      key: 'submitted',
      title: labels.submitted,
      meta: `${order.submittedBy ?? order.role} · ${formatDate(order.submittedAt, locale)}`,
      status: 'done',
    },
  ];

  if (order.status === 'pending-quote') {
    steps.push({
      key: 'quote',
      title: labels.quote,
      status: 'current',
    });
  }

  steps.push({
    key: 'delivery',
    title: labels.delivery,
    meta: order.shippingAddress?.recipient ?? labels.deliveryOwner,
    status: order.shippingAddress ? 'done' : 'pending',
  });

  steps.push({
    key: 'approval',
    title: labels.approval,
    meta: approvalMeta,
    status: approvalRequired
      ? order.status === 'pending-approval'
        ? 'current'
        : statusIndex > statusOrder.indexOf('pending-approval')
          ? 'done'
          : 'pending'
      : 'skipped',
  });

  steps.push({
    key: 'payment',
    title: labels.payment,
    meta: order.paidBy
      ? `${order.paidBy} · ${formatDate(order.paidAt ?? order.updatedAt ?? order.submittedAt, locale)}`
      : labels.paymentInvoiceOwner,
    status: order.status === 'pending-payment' ? 'current' : paymentDone ? 'done' : 'pending',
  });

  steps.push({
    key: 'fulfillment',
    title: labels.fulfillment,
    meta:
      order.completedAt || order.shippedAt || order.productionStartedAt
        ? formatDate(
            order.completedAt ?? order.shippedAt ?? order.productionStartedAt ?? order.submittedAt,
            locale,
          )
        : labels.logisticsOwner,
    status: fulfillmentDone ? 'done' : fulfillmentCurrent ? 'current' : 'pending',
  });

  return steps;
}

function Field({
  label,
  labelSuffix,
  className,
  children,
}: {
  label: string;
  labelSuffix?: React.ReactNode;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <label className={className}>
      <span className="text-text-muted mb-2 flex min-h-[22px] items-center gap-2 text-sm">
        <span>{label}</span>
        {labelSuffix}
      </span>
      {children}
    </label>
  );
}

export function statusVariant(
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
