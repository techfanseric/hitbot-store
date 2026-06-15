'use client';

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import {
  addressProfiles as sharedAddressBook,
  defaultProfile as sharedDefaultProfile,
  invoiceProfiles as sharedInvoiceProfiles,
  orders as sharedOrders,
  osHandoffs as sharedOsHandoffs,
  quoteRequests as sharedQuoteRequests,
} from '@hitbot/domain';
import { approvalSettingsForEnterprise, useAdminStore } from '@/lib/admin-store';
import type {
  AddressProfile,
  ApprovalMode,
  CheckoutDraft,
  EnterpriseProfile,
  EnterpriseRole,
  InvoiceProfile,
  LocalOsHandoff,
  LocalOrderSnapshot,
  LocalQuoteRequest,
  OrderAddressSnapshot,
  OrderInvoiceSnapshot,
  OrderLineSnapshot,
} from '@/types/procurement';

const MOCK_ADMIN_NAME = '林若安';
const MOCK_BUYER_NAME = '陈思远';
const MOCK_ENGINEER_NAME = '周亦辰';

const defaultProfile: EnterpriseProfile = {
  enterpriseId: 'ENT-HITBOT-CUSTOMER',
  companyName: '深圳智造装备有限公司',
  role: 'buyer',
  contactName: MOCK_BUYER_NAME,
  phone: '15507540989',
  email: 'buyer@customer.example',
  signedInAt: null,
};

export const DEFAULT_ENTERPRISE_ID = defaultProfile.enterpriseId;

const defaultDraft: CheckoutDraft = {
  recipient: MOCK_BUYER_NAME,
  phone: '15507540989',
  province: '广东省',
  city: '深圳市',
  address: '南山区科技园客户总部 A 栋 8 楼',
  paymentMethod: 'corporate',
  invoiceTitle: '深圳智造装备有限公司',
  taxId: '91440300CUSTOMER01',
  bankAccount: '招商银行深圳分行 6222 **** **** 001',
  approvalMode: 'admin-review',
  approver: MOCK_ADMIN_NAME,
  note: '',
};

interface SubmitOrderInput {
  projectId: string;
  projectName: string;
  subtotalCents: number;
  itemCount: number;
  lines: OrderLineSnapshot[];
  shippingAddress: OrderAddressSnapshot;
  invoice: OrderInvoiceSnapshot | null;
  note: string;
}

interface EnterMemberInput {
  name: string;
  email: string;
  phone?: string;
  role: EnterpriseRole;
  enterpriseId?: string;
  companyName?: string;
}

interface RecordOsHandoffInput {
  projectId: string;
  projectName: string;
  itemCount: number;
  submittedBy?: string;
}

interface ProcurementState {
  isAuthenticated: boolean;
  profile: EnterpriseProfile;
  checkoutDraft: CheckoutDraft;
  checkoutDrafts: Record<string, CheckoutDraft>;
  addressBook: AddressProfile[];
  invoiceProfiles: InvoiceProfile[];
  orders: LocalOrderSnapshot[];
  quoteRequests: LocalQuoteRequest[];
  osHandoffs: LocalOsHandoff[];
  signIn: () => void;
  signOut: () => void;
  enterMember: (member: EnterMemberInput) => void;
  updateProfile: (patch: Partial<EnterpriseProfile>) => void;
  setRole: (role: EnterpriseRole) => void;
  updateCheckoutDraft: (patch: Partial<Omit<CheckoutDraft, 'approvalMode' | 'approver'>>) => void;
  applyAddressProfile: (addressId: string) => void;
  applyInvoiceProfile: (invoiceId: string) => void;
  saveCheckoutAddress: () => void;
  saveCheckoutInvoice: () => void;
  deleteInvoiceProfile: (invoiceId: string) => void;
  submitLocalOrder: (input: SubmitOrderInput) => string | undefined;
  recordOsHandoff: (input: RecordOsHandoffInput) => void;
  acceptOsHandoff: (projectId: string) => void;
  provideLocalQuote: (requestNo: string) => void;
  acceptLocalQuote: (requestNo: string) => void;
  approveLocalOrder: (orderNo: string) => void;
  markLocalOrderPaid: (orderNo: string) => void;
  advanceLocalOrder: (orderNo: string) => void;
  resetCheckoutDraft: () => void;
}

function nextOrderNo(): string {
  const stamp = new Date().toISOString().replace(/\D/g, '').slice(0, 17);
  const suffix = Math.random().toString(36).slice(2, 5).toUpperCase();
  return `HB${stamp}${suffix}`;
}

function nextQuoteNo(): string {
  const stamp = new Date().toISOString().replace(/\D/g, '').slice(0, 17);
  const suffix = Math.random().toString(36).slice(2, 5).toUpperCase();
  return `HQ${stamp}${suffix}`;
}

function nextHandoffId(projectId: string): string {
  const stamp = new Date().toISOString().replace(/\D/g, '').slice(0, 14);
  return `OS-${projectId}-${stamp}`;
}

function nextProfileId(prefix: string): string {
  const stamp = new Date().toISOString().replace(/\D/g, '').slice(0, 14);
  const suffix = Math.random().toString(36).slice(2, 5).toUpperCase();
  return `${prefix}-${stamp}-${suffix}`;
}

function nextTrackingNo(orderNo: string): string {
  return `SF${orderNo.replace(/\D/g, '').slice(-10).padStart(10, '0')}`;
}

function nextPaymentReference(orderNo: string, method?: string) {
  const channel = method === 'personal' ? 'PERS' : 'CORP';
  return `PAY-${channel}-${orderNo.replace(/\D/g, '').slice(-10).padStart(10, '0')}`;
}

function approvalModeForRole(role: EnterpriseRole): ApprovalMode {
  if (role === 'engineer') return 'buyer-review';
  if (role === 'buyer') return 'admin-review';
  return 'admin-direct';
}

function configuredApproverForEnterprise(enterpriseId: string) {
  const adminState = useAdminStore.getState();
  const settings = approvalSettingsForEnterprise(
    adminState.approvalSettings,
    adminState.members,
    enterpriseId,
  );
  const approver = adminState.members.find(
    (member) => member.id === settings.defaultApproverMemberId,
  );

  return approver?.name ?? MOCK_ADMIN_NAME;
}

function procurementOwnerForEnterprise(enterpriseId: string) {
  const members = useAdminStore.getState().members;
  const buyer = members.find(
    (member) =>
      member.enterpriseId === enterpriseId &&
      member.status === 'active' &&
      member.permissions.includes('orders') &&
      member.role !== 'admin',
  );

  return buyer?.name ?? MOCK_BUYER_NAME;
}

function approverForProfile(profile: EnterpriseProfile) {
  if (profile.role === 'engineer') return procurementOwnerForEnterprise(profile.enterpriseId);
  if (profile.role === 'buyer') return configuredApproverForEnterprise(profile.enterpriseId);
  return '';
}

function orderRequiresApproval(
  profile: EnterpriseProfile,
  subtotalCents: number,
  quoteRequired: boolean,
) {
  if (profile.role === 'admin') return false;
  if (profile.role === 'engineer') return true;

  const adminState = useAdminStore.getState();
  const settings = approvalSettingsForEnterprise(
    adminState.approvalSettings,
    adminState.members,
    profile.enterpriseId,
  );
  const amountRequiresApproval =
    settings.amountThresholdCents !== null && subtotalCents >= settings.amountThresholdCents;

  return (
    settings.requireBuyerOrderApproval ||
    (quoteRequired && settings.requireQuoteOrderApproval) ||
    amountRequiresApproval
  );
}

function normalizeCheckoutDraftForRole(
  profile: EnterpriseProfile,
  draft: CheckoutDraft,
): CheckoutDraft {
  return {
    ...draft,
    approvalMode: approvalModeForRole(profile.role),
    approver: approverForProfile(profile),
  };
}

function defaultDraftForProfile(profile: EnterpriseProfile): CheckoutDraft {
  if (profile.enterpriseId === defaultProfile.enterpriseId) {
    return {
      ...defaultDraft,
      approvalMode: approvalModeForRole(profile.role),
      approver: approverForProfile(profile),
    };
  }

  return {
    ...defaultDraft,
    recipient: profile.contactName,
    phone: profile.phone,
    province: '',
    city: '',
    address: '',
    invoiceTitle: profile.companyName,
    taxId: '',
    bankAccount: '',
    approvalMode: approvalModeForRole(profile.role),
    approver: approverForProfile(profile),
    note: '',
  };
}

function draftForProfile(
  profile: EnterpriseProfile,
  checkoutDrafts: Record<string, CheckoutDraft>,
): CheckoutDraft {
  return normalizeCheckoutDraftForRole(
    profile,
    checkoutDrafts[profile.enterpriseId] ?? defaultDraftForProfile(profile),
  );
}

function canApproveOrder(profile: EnterpriseProfile, order: LocalOrderSnapshot) {
  if (!isSameEnterprise(profile, order)) return false;
  if (profile.role === 'engineer' || order.status !== 'pending-approval') return false;
  if (profile.role === 'admin') return true;
  if (order.approvalMode === 'admin-review') return false;
  if (!order.approver) return false;

  return order.approver === profile.contactName || order.approver === profile.email;
}

function isSameEnterprise(profile: EnterpriseProfile, record: { enterpriseId?: string }): boolean {
  return (record.enterpriseId ?? defaultProfile.enterpriseId) === profile.enterpriseId;
}

function quoteEstimateCents(lines: OrderLineSnapshot[]) {
  return lines.reduce((sum, line) => sum + Math.max(line.unitPriceCents, 120000) * line.qty, 0);
}

function mergeDefaultRecords<T>(
  persistedRecords: T[] | undefined,
  defaultRecords: T[],
  getKey: (record: T) => string,
): T[] {
  const records = persistedRecords?.length ? persistedRecords : defaultRecords;
  const existingKeys = new Set(records.map(getKey));
  return [...records, ...defaultRecords.filter((record) => !existingKeys.has(getKey(record)))];
}

function normalizeCompanyText(value: string | undefined, fallback = defaultProfile.companyName) {
  if (!value || value.includes('示例公司') || value.includes('DEMO')) return fallback;
  return value;
}

function normalizeMockPersonName(value: string | undefined) {
  if (value === '企业管理员') return MOCK_ADMIN_NAME;
  if (value === '采购负责人') return MOCK_BUYER_NAME;
  if (value === '方案工程师') return MOCK_ENGINEER_NAME;
  return value;
}

function normalizeOrderApproval(order: LocalOrderSnapshot): LocalOrderSnapshot {
  const storedApprovalMode = order.approvalMode as string | undefined;
  const withNames: LocalOrderSnapshot = {
    ...order,
    submittedBy: normalizeMockPersonName(order.submittedBy),
    approver: normalizeMockPersonName(order.approver),
    approvedBy: normalizeMockPersonName(order.approvedBy),
    paidBy: normalizeMockPersonName(order.paidBy),
  };

  if (storedApprovalMode !== 'self-submit') return withNames;

  const approvalMode = order.role === 'admin' ? 'admin-direct' : 'admin-review';
  const approvedBy =
    withNames.approvedBy && withNames.approvedBy === withNames.submittedBy
      ? MOCK_ADMIN_NAME
      : withNames.approvedBy;

  return {
    ...withNames,
    approvalMode,
    approver: order.status === 'pending-approval' ? MOCK_ADMIN_NAME : withNames.approver,
    approvedBy,
  };
}

function normalizeQuoteRequestPeople(request: LocalQuoteRequest): LocalQuoteRequest {
  return {
    ...request,
    submittedBy: normalizeMockPersonName(request.submittedBy),
  };
}

function normalizeOsHandoffPeople(handoff: LocalOsHandoff): LocalOsHandoff {
  return {
    ...handoff,
    submittedBy: normalizeMockPersonName(handoff.submittedBy),
    acceptedBy: normalizeMockPersonName(handoff.acceptedBy),
  };
}

export const useProcurementStore = create<ProcurementState>()(
  persist(
    (set, get) => ({
      isAuthenticated: false,
      profile: sharedDefaultProfile,
      checkoutDraft: defaultDraft,
      checkoutDrafts: {
        [defaultProfile.enterpriseId]: defaultDraft,
      },
      addressBook: sharedAddressBook,
      invoiceProfiles: sharedInvoiceProfiles,
      orders: sharedOrders,
      quoteRequests: sharedQuoteRequests,
      osHandoffs: sharedOsHandoffs,
      signIn: () =>
        set((state) => ({
          isAuthenticated: true,
          profile: {
            ...state.profile,
            signedInAt: new Date().toISOString(),
          },
          checkoutDraft: draftForProfile(state.profile, state.checkoutDrafts),
        })),
      signOut: () =>
        set((state) => ({
          isAuthenticated: false,
          profile: {
            ...state.profile,
            signedInAt: null,
          },
        })),
      enterMember: (member) =>
        set((state) => {
          const currentDrafts = {
            ...state.checkoutDrafts,
            [state.profile.enterpriseId]: state.checkoutDraft,
          };
          const nextProfile: EnterpriseProfile = {
            ...state.profile,
            enterpriseId: member.enterpriseId ?? state.profile.enterpriseId,
            companyName: member.companyName ?? state.profile.companyName,
            role: member.role,
            contactName: member.name,
            email: member.email,
            phone: member.phone ?? state.profile.phone,
            signedInAt: new Date().toISOString(),
          };
          const baseDraft = draftForProfile(nextProfile, currentDrafts);
          const shouldMoveRecipient =
            baseDraft.recipient === state.profile.contactName ||
            baseDraft.recipient === defaultDraft.recipient;
          const nextDraft: CheckoutDraft = {
            ...baseDraft,
            recipient: shouldMoveRecipient ? member.name : baseDraft.recipient,
            phone: member.phone ?? baseDraft.phone,
            approvalMode: approvalModeForRole(member.role),
            approver: approverForProfile(nextProfile),
          };

          return {
            isAuthenticated: true,
            profile: nextProfile,
            checkoutDraft: nextDraft,
            checkoutDrafts: {
              ...currentDrafts,
              [nextProfile.enterpriseId]: nextDraft,
            },
          };
        }),
      updateProfile: (patch) =>
        set((state) => {
          const nextProfile = {
            ...state.profile,
            ...patch,
          };
          const currentDrafts = {
            ...state.checkoutDrafts,
            [state.profile.enterpriseId]: state.checkoutDraft,
          };
          const enterpriseChanged =
            nextProfile.enterpriseId !== state.profile.enterpriseId ||
            nextProfile.companyName !== state.profile.companyName;
          const nextDraft = enterpriseChanged
            ? draftForProfile(nextProfile, currentDrafts)
            : state.checkoutDraft;

          return {
            profile: nextProfile,
            checkoutDraft: nextDraft,
            checkoutDrafts: {
              ...currentDrafts,
              [nextProfile.enterpriseId]: nextDraft,
            },
          };
        }),
      setRole: (role) =>
        set((state) => {
          const nextProfile = {
            ...state.profile,
            role,
          };
          const nextDraft: CheckoutDraft = {
            ...state.checkoutDraft,
            approvalMode: approvalModeForRole(role),
            approver: approverForProfile(nextProfile),
          };

          return {
            profile: nextProfile,
            checkoutDraft: nextDraft,
            checkoutDrafts: {
              ...state.checkoutDrafts,
              [nextProfile.enterpriseId]: nextDraft,
            },
          };
        }),
      updateCheckoutDraft: (patch) =>
        set((state) => {
          const nextDraft = normalizeCheckoutDraftForRole(state.profile, {
            ...state.checkoutDraft,
            ...patch,
          });

          return {
            checkoutDraft: nextDraft,
            checkoutDrafts: {
              ...state.checkoutDrafts,
              [state.profile.enterpriseId]: nextDraft,
            },
          };
        }),
      applyAddressProfile: (addressId) =>
        set((state) => {
          const address = state.addressBook.find(
            (item) => item.id === addressId && isSameEnterprise(state.profile, item),
          );
          if (!address) return state;
          const nextDraft = {
            ...state.checkoutDraft,
            recipient: address.recipient,
            phone: address.phone,
            province: address.province,
            city: address.city,
            address: address.address,
          };

          return {
            checkoutDraft: nextDraft,
            checkoutDrafts: {
              ...state.checkoutDrafts,
              [state.profile.enterpriseId]: nextDraft,
            },
          };
        }),
      applyInvoiceProfile: (invoiceId) =>
        set((state) => {
          const invoice = state.invoiceProfiles.find(
            (item) => item.id === invoiceId && isSameEnterprise(state.profile, item),
          );
          if (!invoice) return state;
          const nextDraft = {
            ...state.checkoutDraft,
            invoiceTitle: invoice.title,
            taxId: invoice.taxId,
            bankAccount: invoice.bankAccount,
            paymentMethod: 'corporate' as const,
          };

          return {
            checkoutDraft: nextDraft,
            checkoutDrafts: {
              ...state.checkoutDrafts,
              [state.profile.enterpriseId]: nextDraft,
            },
          };
        }),
      saveCheckoutAddress: () =>
        set((state) => {
          const { checkoutDraft } = state;
          const updatedAt = new Date().toISOString();
          const existing = state.addressBook.find(
            (item) =>
              isSameEnterprise(state.profile, item) &&
              item.recipient === checkoutDraft.recipient &&
              item.phone === checkoutDraft.phone &&
              item.province === checkoutDraft.province &&
              item.city === checkoutDraft.city &&
              item.address === checkoutDraft.address,
          );
          const nextAddress: AddressProfile = {
            id: existing?.id ?? nextProfileId('addr'),
            enterpriseId: state.profile.enterpriseId,
            companyName: state.profile.companyName,
            label: existing?.label ?? `${checkoutDraft.city || '收货'}地址`,
            recipient: checkoutDraft.recipient,
            phone: checkoutDraft.phone,
            province: checkoutDraft.province,
            city: checkoutDraft.city,
            address: checkoutDraft.address,
            updatedAt,
          };

          return {
            addressBook: existing
              ? state.addressBook.map((item) => (item.id === existing.id ? nextAddress : item))
              : [nextAddress, ...state.addressBook].slice(0, 6),
          };
        }),
      saveCheckoutInvoice: () =>
        set((state) => {
          const { checkoutDraft } = state;
          const updatedAt = new Date().toISOString();
          const existing = state.invoiceProfiles.find(
            (item) =>
              isSameEnterprise(state.profile, item) &&
              item.title === checkoutDraft.invoiceTitle &&
              item.taxId === checkoutDraft.taxId &&
              item.bankAccount === checkoutDraft.bankAccount,
          );
          const nextInvoice: InvoiceProfile = {
            id: existing?.id ?? nextProfileId('inv'),
            enterpriseId: state.profile.enterpriseId,
            companyName: state.profile.companyName,
            label: (existing?.label ?? checkoutDraft.invoiceTitle) || '发票抬头',
            title: checkoutDraft.invoiceTitle,
            taxId: checkoutDraft.taxId,
            bankAccount: checkoutDraft.bankAccount,
            updatedAt,
          };

          return {
            invoiceProfiles: existing
              ? state.invoiceProfiles.map((item) => (item.id === existing.id ? nextInvoice : item))
              : [nextInvoice, ...state.invoiceProfiles].slice(0, 6),
          };
        }),
      deleteInvoiceProfile: (invoiceId) =>
        set((state) => ({
          invoiceProfiles: state.invoiceProfiles.filter(
            (invoice) => invoice.id !== invoiceId || !isSameEnterprise(state.profile, invoice),
          ),
        })),
      submitLocalOrder: ({
        projectId,
        projectName,
        subtotalCents,
        itemCount,
        lines,
        shippingAddress,
        invoice,
        note,
      }) => {
        const { isAuthenticated, profile } = get();
        if (!isAuthenticated) return undefined;
        if (profile.role === 'engineer') {
          get().recordOsHandoff({
            projectId,
            projectName,
            itemCount,
            submittedBy: profile.contactName,
          });
          return undefined;
        }

        const { checkoutDraft } = get();
        const approver = approverForProfile(profile);
        const submittedAt = new Date().toISOString();
        const orderNo = nextOrderNo();
        const quoteLines = lines.filter(
          (line) => line.selected !== false && line.quoteRequired === true,
        );
        const billableLines = lines.filter((line) => line.selected !== false && line.sellable);
        const quoteOnlyOrder = quoteLines.length > 0 && billableLines.length === 0;
        const requiresApproval = orderRequiresApproval(
          profile,
          subtotalCents,
          quoteLines.length > 0,
        );
        const approvalMode: ApprovalMode = requiresApproval
          ? approvalModeForRole(profile.role)
          : profile.role === 'admin'
            ? 'admin-direct'
            : 'not-required';
        const status: LocalOrderSnapshot['status'] = quoteOnlyOrder
          ? 'pending-quote'
          : !requiresApproval
            ? 'pending-payment'
            : 'pending-approval';
        const quoteRequest: LocalQuoteRequest | null = quoteLines.length
          ? {
              requestNo: nextQuoteNo(),
              enterpriseId: profile.enterpriseId,
              companyName: profile.companyName,
              orderNo,
              projectName,
              lines: quoteLines,
              submittedBy: profile.contactName,
              submittedAt,
              updatedAt: submittedAt,
              status: 'pending-quote',
            }
          : null;
        set((state) => ({
          orders: [
            {
              orderNo,
              enterpriseId: profile.enterpriseId,
              companyName: profile.companyName,
              projectId,
              projectName,
              handoffId: state.osHandoffs.find(
                (handoff) => handoff.projectId === projectId && isSameEnterprise(profile, handoff),
              )?.id,
              role: profile.role,
              approvalMode,
              submittedBy: profile.contactName,
              approver: status === 'pending-approval' ? approver : undefined,
              approvedBy:
                status === 'pending-payment' && profile.role === 'admin'
                  ? profile.contactName
                  : undefined,
              approvedAt:
                status === 'pending-payment' && profile.role === 'admin' ? submittedAt : undefined,
              paymentMethod: checkoutDraft.paymentMethod,
              lines,
              shippingAddress,
              invoice,
              note,
              subtotalCents,
              itemCount,
              submittedAt,
              updatedAt: submittedAt,
              status,
            },
            ...state.orders,
          ].slice(0, 8),
          quoteRequests: quoteRequest
            ? [quoteRequest, ...state.quoteRequests].slice(0, 8)
            : state.quoteRequests,
          osHandoffs: state.osHandoffs.map((handoff) =>
            handoff.projectId === projectId && isSameEnterprise(profile, handoff)
              ? {
                  ...handoff,
                  status: 'submitted',
                  submittedOrderNo: orderNo,
                  orderSubmittedAt: submittedAt,
                  updatedAt: submittedAt,
                }
              : handoff,
          ),
        }));
        return orderNo;
      },
      recordOsHandoff: ({ projectId, projectName, itemCount, submittedBy = 'HITBOTOS' }) => {
        const { profile } = get();
        const submittedAt = new Date().toISOString();
        set((state) => {
          const existing = state.osHandoffs.find(
            (handoff) => handoff.projectId === projectId && isSameEnterprise(profile, handoff),
          );
          const nextHandoff: LocalOsHandoff = {
            id: existing?.id ?? nextHandoffId(projectId),
            enterpriseId: existing?.enterpriseId ?? profile.enterpriseId,
            companyName: existing?.companyName ?? profile.companyName,
            projectId,
            projectName,
            itemCount,
            submittedBy: existing?.submittedBy ?? submittedBy,
            submittedAt: existing?.submittedAt ?? submittedAt,
            acceptedBy: existing?.acceptedBy,
            acceptedAt: existing?.acceptedAt,
            submittedOrderNo: existing?.submittedOrderNo,
            orderSubmittedAt: existing?.orderSubmittedAt,
            status: existing?.status ?? 'pending',
            updatedAt: submittedAt,
          };

          return {
            osHandoffs: existing
              ? state.osHandoffs.map((handoff) =>
                  handoff.projectId === projectId && isSameEnterprise(profile, handoff)
                    ? nextHandoff
                    : handoff,
                )
              : [nextHandoff, ...state.osHandoffs].slice(0, 8),
          };
        });
      },
      acceptOsHandoff: (projectId) => {
        const { isAuthenticated, profile } = get();
        if (!isAuthenticated || profile.role === 'engineer') return;

        const acceptedAt = new Date().toISOString();
        set((state) => ({
          osHandoffs: state.osHandoffs.map((handoff) =>
            handoff.projectId === projectId &&
            handoff.status === 'pending' &&
            isSameEnterprise(profile, handoff)
              ? {
                  ...handoff,
                  status: 'accepted',
                  acceptedBy: isAuthenticated ? profile.contactName : undefined,
                  acceptedAt,
                  updatedAt: acceptedAt,
                }
              : handoff,
          ),
        }));
      },
      provideLocalQuote: (requestNo) => {
        const { isAuthenticated, profile } = get();
        if (!isAuthenticated || profile.role === 'engineer') return;

        const updatedAt = new Date().toISOString();
        set((state) => ({
          quoteRequests: state.quoteRequests.map((request) =>
            request.requestNo === requestNo &&
            request.status === 'pending-quote' &&
            isSameEnterprise(profile, request)
              ? {
                  ...request,
                  status: 'quoted',
                  quotedAt: updatedAt,
                  quotedBy: profile.contactName,
                  estimateCents: quoteEstimateCents(request.lines),
                  note: request.note ?? '含加工、表面处理与随箱附件。',
                  updatedAt,
                }
              : request,
          ),
        }));
      },
      acceptLocalQuote: (requestNo) => {
        const { isAuthenticated, profile } = get();
        if (!isAuthenticated || profile.role === 'engineer') return;

        const updatedAt = new Date().toISOString();
        set((state) => ({
          quoteRequests: state.quoteRequests.map((request) =>
            request.requestNo === requestNo &&
            request.status === 'quoted' &&
            isSameEnterprise(profile, request)
              ? {
                  ...request,
                  status: 'accepted',
                  updatedAt,
                }
              : request,
          ),
          orders: state.orders.map((order) => {
            const request = state.quoteRequests.find(
              (item) =>
                item.requestNo === requestNo &&
                item.status === 'quoted' &&
                item.orderNo === order.orderNo &&
                isSameEnterprise(profile, item),
            );

            if (!request || order.status !== 'pending-quote' || !isSameEnterprise(profile, order)) {
              return order;
            }

            const requiresApproval = orderRequiresApproval(
              profile,
              request.estimateCents ?? order.subtotalCents,
              true,
            );
            const nextStatus = requiresApproval ? 'pending-approval' : 'pending-payment';
            const approvalMode: ApprovalMode = requiresApproval
              ? approvalModeForRole(profile.role)
              : profile.role === 'admin'
                ? 'admin-direct'
                : 'not-required';

            return {
              ...order,
              status: nextStatus,
              approvalMode,
              subtotalCents: request.estimateCents ?? order.subtotalCents,
              approver: nextStatus === 'pending-approval' ? approverForProfile(profile) : undefined,
              approvedBy:
                nextStatus === 'pending-payment' && profile.role === 'admin'
                  ? profile.contactName
                  : order.approvedBy,
              approvedAt:
                nextStatus === 'pending-payment' && profile.role === 'admin'
                  ? updatedAt
                  : undefined,
              updatedAt,
            };
          }),
        }));
      },
      approveLocalOrder: (orderNo) => {
        const { isAuthenticated, profile } = get();
        if (!isAuthenticated || profile.role === 'engineer') return;

        const updatedAt = new Date().toISOString();
        set((state) => ({
          orders: state.orders.map((order) =>
            order.orderNo === orderNo && canApproveOrder(profile, order)
              ? {
                  ...order,
                  status: 'pending-payment',
                  approvedBy: profile.contactName,
                  approvedAt: updatedAt,
                  updatedAt,
                }
              : order,
          ),
        }));
      },
      markLocalOrderPaid: (orderNo) => {
        const { isAuthenticated, profile } = get();
        if (!isAuthenticated || profile.role === 'engineer') return;

        const updatedAt = new Date().toISOString();
        set((state) => ({
          orders: state.orders.map((order) =>
            order.orderNo === orderNo &&
            order.status === 'pending-payment' &&
            isSameEnterprise(profile, order)
              ? {
                  ...order,
                  status: 'paid',
                  paidAt: updatedAt,
                  paidBy: profile.contactName,
                  paymentReference: nextPaymentReference(order.orderNo, order.paymentMethod),
                  updatedAt,
                }
              : order,
          ),
        }));
      },
      advanceLocalOrder: (orderNo) => {
        const { isAuthenticated, profile } = get();
        if (!isAuthenticated || profile.role === 'engineer') return;

        const updatedAt = new Date().toISOString();
        set((state) => ({
          orders: state.orders.map((order) => {
            if (order.orderNo !== orderNo) return order;
            if (!isSameEnterprise(profile, order)) return order;

            if (order.status === 'paid') {
              return {
                ...order,
                status: 'in-production',
                productionStartedAt: updatedAt,
                updatedAt,
              };
            }

            if (order.status === 'in-production') {
              return {
                ...order,
                status: 'shipped',
                shippedAt: updatedAt,
                carrier: order.carrier ?? 'SF Express',
                trackingNo: order.trackingNo ?? nextTrackingNo(order.orderNo),
                updatedAt,
              };
            }

            if (order.status === 'shipped') {
              return {
                ...order,
                status: 'completed',
                completedAt: updatedAt,
                updatedAt,
              };
            }

            return order;
          }),
        }));
      },
      resetCheckoutDraft: () =>
        set((state) => {
          const nextDraft = defaultDraftForProfile(state.profile);

          return {
            checkoutDraft: nextDraft,
            checkoutDrafts: {
              ...state.checkoutDrafts,
              [state.profile.enterpriseId]: nextDraft,
            },
          };
        }),
    }),
    {
      name: 'hitbot-procurement-v1',
      storage: createJSONStorage(() => localStorage),
      merge: (persistedState, currentState) => {
        const persisted = (persistedState ?? {}) as Partial<ProcurementState>;
        const withDefaultEnterprise = <T extends { enterpriseId?: string; companyName?: string }>(
          item: T,
        ): T => ({
          ...item,
          enterpriseId: item.enterpriseId ?? defaultProfile.enterpriseId,
          companyName: item.companyName ?? defaultProfile.companyName,
        });
        const profile = {
          ...defaultProfile,
          ...persisted.profile,
          companyName: normalizeCompanyText(persisted.profile?.companyName),
          contactName:
            normalizeMockPersonName(persisted.profile?.contactName) ?? defaultProfile.contactName,
        };
        const checkoutDrafts: Record<string, CheckoutDraft> = {
          [defaultProfile.enterpriseId]: {
            ...defaultDraft,
            ...(persisted.checkoutDrafts?.[defaultProfile.enterpriseId] ?? persisted.checkoutDraft),
          },
          ...(persisted.checkoutDrafts ?? {}),
        };
        const profileDraft = draftForProfile(profile, checkoutDrafts);
        const checkoutDraft = {
          ...profileDraft,
          recipient: normalizeMockPersonName(profileDraft.recipient) ?? profileDraft.recipient,
          approver: normalizeMockPersonName(profileDraft.approver) ?? profileDraft.approver,
          invoiceTitle: normalizeCompanyText(profileDraft.invoiceTitle, profile.companyName),
        };

        return {
          ...currentState,
          ...persisted,
          profile,
          checkoutDraft,
          checkoutDrafts: {
            ...checkoutDrafts,
            [profile.enterpriseId]: checkoutDraft,
          },
          addressBook: (persisted.addressBook?.length
            ? persisted.addressBook
            : sharedAddressBook
          ).map((address) =>
            withDefaultEnterprise({
              ...address,
              recipient: normalizeMockPersonName(address.recipient) ?? address.recipient,
            }),
          ),
          invoiceProfiles: persisted.invoiceProfiles?.length
            ? persisted.invoiceProfiles.map((invoice) =>
                withDefaultEnterprise({
                  ...invoice,
                  title: normalizeCompanyText(invoice.title, profile.companyName),
                  label: normalizeCompanyText(invoice.label, profile.companyName),
                  companyName: normalizeCompanyText(invoice.companyName, profile.companyName),
                }),
              )
            : sharedInvoiceProfiles,
          orders: mergeDefaultRecords(persisted.orders, sharedOrders, (order) => order.orderNo)
            .map(normalizeOrderApproval)
            .map(withDefaultEnterprise),
          quoteRequests: mergeDefaultRecords(
            persisted.quoteRequests,
            sharedQuoteRequests,
            (request) => request.requestNo,
          )
            .map(normalizeQuoteRequestPeople)
            .map(withDefaultEnterprise),
          osHandoffs: mergeDefaultRecords(
            persisted.osHandoffs,
            sharedOsHandoffs,
            (handoff) => handoff.id,
          )
            .map(normalizeOsHandoffPeople)
            .map(withDefaultEnterprise),
        };
      },
    },
  ),
);
