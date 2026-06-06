'use client';

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
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

const defaultProfile: EnterpriseProfile = {
  enterpriseId: 'ENT-HITBOT-CUSTOMER',
  companyName: '深圳智造装备有限公司',
  role: 'buyer',
  contactName: '采购负责人',
  phone: '15507540989',
  email: 'buyer@customer.example',
  signedInAt: null,
};

export const DEFAULT_ENTERPRISE_ID = defaultProfile.enterpriseId;

const defaultDraft: CheckoutDraft = {
  recipient: '采购负责人',
  phone: '15507540989',
  province: '广东省',
  city: '深圳市',
  address: '南山区科技园客户总部 A 栋 8 楼',
  paymentMethod: 'corporate',
  invoiceTitle: '深圳智造装备有限公司',
  taxId: '91440300CUSTOMER01',
  bankAccount: '招商银行深圳分行 6222 **** **** 001',
  approvalMode: 'admin-review',
  approver: '企业管理员',
  note: '',
};

const defaultAddressBook: AddressProfile[] = [
  {
    id: 'addr-hq',
    enterpriseId: defaultProfile.enterpriseId,
    companyName: defaultProfile.companyName,
    label: '客户总部',
    recipient: defaultDraft.recipient,
    phone: defaultDraft.phone,
    province: defaultDraft.province,
    city: defaultDraft.city,
    address: '南山区科技园客户总部 A 栋 8 楼',
    updatedAt: '2026-06-01T00:00:00.000Z',
  },
  {
    id: 'addr-lab',
    enterpriseId: defaultProfile.enterpriseId,
    companyName: defaultProfile.companyName,
    label: '产线收货点',
    recipient: '实验室管理员',
    phone: '17701551867',
    province: '广东省',
    city: '深圳市',
    address: '宝安区智能制造园 2 号产线仓',
    updatedAt: '2026-06-01T00:00:00.000Z',
  },
];

const defaultInvoiceProfiles: InvoiceProfile[] = [
  {
    id: 'inv-customer',
    enterpriseId: defaultProfile.enterpriseId,
    companyName: defaultProfile.companyName,
    label: '客户公司抬头',
    title: defaultDraft.invoiceTitle,
    taxId: defaultDraft.taxId,
    bankAccount: defaultDraft.bankAccount,
    updatedAt: '2026-06-01T00:00:00.000Z',
  },
];

function orderLine(
  productId: string,
  model: string,
  zhName: string,
  enName: string,
  qty: number,
  unitPriceCents: number,
  options: Partial<
    Pick<OrderLineSnapshot, 'partClass' | 'source' | 'sellable' | 'quoteRequired'>
  > = {},
): OrderLineSnapshot {
  return {
    productId,
    model,
    name: { zh: zhName, en: enName },
    partClass: options.partClass ?? 'standard',
    qty,
    source: options.source ?? 'web',
    selected: true,
    sellable: options.sellable ?? true,
    quoteRequired: options.quoteRequired ?? false,
    unitPriceCents,
    subtotalCents: unitPriceCents * qty,
    currency: 'CNY',
  };
}

const defaultOrderAddress: OrderAddressSnapshot = {
  recipient: '采购负责人',
  phone: '15507540989',
  province: '广东省',
  city: '深圳市',
  address: '宝安区智能制造园 2 号产线仓',
};

const defaultOrderInvoice: OrderInvoiceSnapshot = {
  title: defaultDraft.invoiceTitle,
  taxId: defaultDraft.taxId,
  bankAccount: defaultDraft.bankAccount,
};

const stationUpgradeLines = [
  orderLine('p-004', 'Z-Arm S622', 'Z-Arm S622 四轴机械臂', 'Z-Arm S622 SCARA Robot', 2, 1800000, {
    source: 'os',
  }),
  orderLine('p-003', 'Z-EFG-20', 'Z-EFG-20 电动夹爪', 'Z-EFG-20 Electric Gripper', 2, 450000, {
    source: 'os',
  }),
];

const labFixtureLines = [
  orderLine('p-010', 'Custom-Frame-A1', '定制工装框架 A1', 'Custom Fixture Frame A1', 1, 0, {
    partClass: 'custom',
    source: 'os',
    sellable: false,
    quoteRequired: true,
  }),
  orderLine('p-002', 'Z-EFG-8S', 'Z-EFG-8S 电动夹爪', 'Z-EFG-8S Electric Gripper', 4, 320000, {
    source: 'os',
  }),
];

const sortingCellLines = [
  orderLine('p-005', 'Z-Arm 2442', 'Z-Arm 2442 四轴机械臂', 'Z-Arm 2442 SCARA Robot', 1, 1200000),
  orderLine('p-008', 'Z-Mod-SE-54', 'Z-Mod-SE-54 末端模块', 'Z-Mod-SE-54 End Module', 2, 580000),
];

const defaultOrders: LocalOrderSnapshot[] = [
  {
    orderNo: 'HB20260601093001',
    enterpriseId: defaultProfile.enterpriseId,
    companyName: defaultProfile.companyName,
    projectId: 'line-pack-01',
    projectName: '包装线上料工位改造',
    handoffId: 'OS-line-pack-01-20260601090000',
    role: 'engineer',
    approvalMode: 'admin-review',
    submittedBy: '方案工程师',
    approver: '企业管理员',
    paymentMethod: 'corporate',
    lines: stationUpgradeLines,
    shippingAddress: defaultOrderAddress,
    invoice: defaultOrderInvoice,
    note: '需与现有输送线安装节拍匹配，审批后安排采购付款。',
    subtotalCents: 4500000,
    itemCount: 4,
    submittedAt: '2026-06-01T01:30:00.000Z',
    updatedAt: '2026-06-01T01:30:00.000Z',
    status: 'pending-approval',
  },
  {
    orderNo: 'HB20260602143018',
    enterpriseId: defaultProfile.enterpriseId,
    companyName: defaultProfile.companyName,
    projectId: 'sort-cell-02',
    projectName: '分拣单元末端执行器补充',
    role: 'buyer',
    approvalMode: 'admin-review',
    submittedBy: '采购负责人',
    approvedBy: '企业管理员',
    approvedAt: '2026-06-02T06:35:00.000Z',
    paymentMethod: 'corporate',
    lines: sortingCellLines,
    shippingAddress: defaultOrderAddress,
    invoice: defaultOrderInvoice,
    note: '本周内确认付款，设备到货后给工程组安装。',
    subtotalCents: 2360000,
    itemCount: 3,
    submittedAt: '2026-06-02T06:30:18.000Z',
    updatedAt: '2026-06-02T06:35:00.000Z',
    status: 'pending-payment',
  },
  {
    orderNo: 'HB20260603161042',
    enterpriseId: defaultProfile.enterpriseId,
    companyName: defaultProfile.companyName,
    projectId: 'lab-fixture-03',
    projectName: '实验室测试夹具升级',
    handoffId: 'OS-lab-fixture-03-20260603153000',
    role: 'engineer',
    approvalMode: 'buyer-review',
    submittedBy: '方案工程师',
    approvedBy: '采购负责人',
    approvedAt: '2026-06-03T08:05:00.000Z',
    paymentMethod: 'corporate',
    lines: labFixtureLines,
    shippingAddress: defaultOrderAddress,
    invoice: defaultOrderInvoice,
    note: '含定制加工件，待报价后确认总价。',
    subtotalCents: 1280000,
    itemCount: 5,
    submittedAt: '2026-06-03T07:50:42.000Z',
    updatedAt: '2026-06-03T08:05:00.000Z',
    status: 'pending-quote',
  },
  {
    orderNo: 'HB20260529101533',
    enterpriseId: defaultProfile.enterpriseId,
    companyName: defaultProfile.companyName,
    projectId: 'vision-pick-04',
    projectName: '视觉抓取验证线',
    role: 'buyer',
    approvalMode: 'admin-review',
    submittedBy: '采购负责人',
    approvedBy: '企业管理员',
    approvedAt: '2026-05-29T02:18:00.000Z',
    paidBy: '采购负责人',
    paidAt: '2026-05-29T03:20:00.000Z',
    paymentReference: 'PAY-CORP-0529101533',
    productionStartedAt: '2026-05-30T01:00:00.000Z',
    paymentMethod: 'corporate',
    lines: [
      orderLine(
        'p-006',
        'Z-Arm H1500',
        'Z-Arm H1500 协作机械臂',
        'Z-Arm H1500 Robot Arm',
        1,
        8500000,
      ),
    ],
    shippingAddress: defaultOrderAddress,
    invoice: defaultOrderInvoice,
    note: '设备进入装配排产，待出厂测试完成后发货。',
    subtotalCents: 8500000,
    itemCount: 1,
    submittedAt: '2026-05-29T02:15:33.000Z',
    updatedAt: '2026-05-30T01:00:00.000Z',
    status: 'in-production',
  },
];

const defaultQuoteRequests: LocalQuoteRequest[] = [
  {
    requestNo: 'HQ20260603161108',
    enterpriseId: defaultProfile.enterpriseId,
    companyName: defaultProfile.companyName,
    orderNo: 'HB20260603161042',
    projectName: '实验室测试夹具升级',
    lines: labFixtureLines,
    submittedBy: '方案工程师',
    submittedAt: '2026-06-03T07:51:08.000Z',
    updatedAt: '2026-06-03T07:51:08.000Z',
    status: 'pending-quote',
  },
  {
    requestNo: 'HQ20260604100519',
    enterpriseId: defaultProfile.enterpriseId,
    companyName: defaultProfile.companyName,
    orderNo: 'HB20260604100452',
    projectName: '治具快换安装板',
    lines: [
      orderLine(
        'p-010',
        'Custom-Frame-A1',
        '治具快换安装板',
        'Quick-change Fixture Plate',
        3,
        168000,
        {
          partClass: 'custom',
          source: 'web',
          quoteRequired: true,
        },
      ),
    ],
    submittedBy: '采购负责人',
    submittedAt: '2026-06-04T02:05:19.000Z',
    quotedAt: '2026-06-04T06:20:00.000Z',
    quotedBy: 'HITBOT 商务',
    estimateCents: 504000,
    note: '含加工、表面处理与随箱附件。',
    updatedAt: '2026-06-04T06:20:00.000Z',
    status: 'quoted',
  },
];

const defaultOsHandoffs: LocalOsHandoff[] = [
  {
    id: 'OS-line-pack-01-20260601090000',
    enterpriseId: defaultProfile.enterpriseId,
    companyName: defaultProfile.companyName,
    projectId: 'line-pack-01',
    projectName: '包装线上料工位改造',
    itemCount: 4,
    submittedBy: '方案工程师',
    submittedAt: '2026-06-01T01:00:00.000Z',
    acceptedBy: '采购负责人',
    acceptedAt: '2026-06-01T01:18:00.000Z',
    submittedOrderNo: 'HB20260601093001',
    orderSubmittedAt: '2026-06-01T01:30:00.000Z',
    updatedAt: '2026-06-01T01:30:00.000Z',
    status: 'submitted',
  },
  {
    id: 'OS-lab-fixture-03-20260603153000',
    enterpriseId: defaultProfile.enterpriseId,
    companyName: defaultProfile.companyName,
    projectId: 'lab-fixture-03',
    projectName: '实验室测试夹具升级',
    itemCount: 5,
    submittedBy: '方案工程师',
    submittedAt: '2026-06-03T07:30:00.000Z',
    acceptedBy: '采购负责人',
    acceptedAt: '2026-06-03T07:45:00.000Z',
    submittedOrderNo: 'HB20260603161042',
    orderSubmittedAt: '2026-06-03T07:50:42.000Z',
    updatedAt: '2026-06-03T07:50:42.000Z',
    status: 'submitted',
  },
  {
    id: 'OS-end-effector-05-20260605112000',
    enterpriseId: defaultProfile.enterpriseId,
    companyName: defaultProfile.companyName,
    projectId: 'end-effector-05',
    projectName: '末端执行器备件清单',
    itemCount: 6,
    submittedBy: '方案工程师',
    submittedAt: '2026-06-05T03:20:00.000Z',
    updatedAt: '2026-06-05T03:20:00.000Z',
    status: 'pending',
  },
];

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

function approverForRole(role: EnterpriseRole) {
  if (role === 'engineer') return '采购负责人';
  if (role === 'buyer') return '企业管理员';
  return '';
}

function normalizeCheckoutDraftForRole(
  profile: EnterpriseProfile,
  draft: CheckoutDraft,
): CheckoutDraft {
  return {
    ...draft,
    approvalMode: approvalModeForRole(profile.role),
    approver: approverForRole(profile.role),
  };
}

function defaultDraftForProfile(profile: EnterpriseProfile): CheckoutDraft {
  if (profile.enterpriseId === defaultProfile.enterpriseId) {
    return {
      ...defaultDraft,
      approvalMode: approvalModeForRole(profile.role),
      approver: approverForRole(profile.role),
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
    approver: approverForRole(profile.role),
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

function normalizeOrderApproval(order: LocalOrderSnapshot): LocalOrderSnapshot {
  const storedApprovalMode = order.approvalMode as string | undefined;
  if (storedApprovalMode !== 'self-submit') return order;

  const approvalMode = order.role === 'admin' ? 'admin-direct' : 'admin-review';
  const approvedBy =
    order.approvedBy && order.approvedBy === order.submittedBy ? '企业管理员' : order.approvedBy;

  return {
    ...order,
    approvalMode,
    approver: order.status === 'pending-approval' ? '企业管理员' : order.approver,
    approvedBy,
  };
}

export const useProcurementStore = create<ProcurementState>()(
  persist(
    (set, get) => ({
      isAuthenticated: false,
      profile: defaultProfile,
      checkoutDraft: defaultDraft,
      checkoutDrafts: {
        [defaultProfile.enterpriseId]: defaultDraft,
      },
      addressBook: defaultAddressBook,
      invoiceProfiles: defaultInvoiceProfiles,
      orders: defaultOrders,
      quoteRequests: defaultQuoteRequests,
      osHandoffs: defaultOsHandoffs,
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
            approver: approverForRole(member.role),
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
            approver: approverForRole(role),
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
        const approvalMode = approvalModeForRole(profile.role);
        const approver = approverForRole(profile.role);
        const submittedAt = new Date().toISOString();
        const orderNo = nextOrderNo();
        const quoteLines = lines.filter(
          (line) => line.selected !== false && line.quoteRequired === true,
        );
        const billableLines = lines.filter((line) => line.selected !== false && line.sellable);
        const quoteOnlyOrder = quoteLines.length > 0 && billableLines.length === 0;
        const status: LocalOrderSnapshot['status'] = quoteOnlyOrder
          ? 'pending-quote'
          : profile.role === 'admin'
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
              approvedBy: status === 'pending-payment' ? profile.contactName : undefined,
              approvedAt: status === 'pending-payment' ? submittedAt : undefined,
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

            const nextStatus = profile.role === 'admin' ? 'pending-payment' : 'pending-approval';

            return {
              ...order,
              status: nextStatus,
              approvalMode: approvalModeForRole(profile.role),
              subtotalCents: request.estimateCents ?? order.subtotalCents,
              approver:
                nextStatus === 'pending-approval' ? approverForRole(profile.role) : undefined,
              approvedBy: nextStatus === 'pending-payment' ? profile.contactName : undefined,
              approvedAt: nextStatus === 'pending-payment' ? updatedAt : undefined,
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
            : defaultAddressBook
          ).map(withDefaultEnterprise),
          invoiceProfiles: persisted.invoiceProfiles?.length
            ? persisted.invoiceProfiles.map((invoice) =>
                withDefaultEnterprise({
                  ...invoice,
                  title: normalizeCompanyText(invoice.title, profile.companyName),
                  label: normalizeCompanyText(invoice.label, profile.companyName),
                  companyName: normalizeCompanyText(invoice.companyName, profile.companyName),
                }),
              )
            : defaultInvoiceProfiles,
          orders: mergeDefaultRecords(persisted.orders, defaultOrders, (order) => order.orderNo)
            .map(normalizeOrderApproval)
            .map(withDefaultEnterprise),
          quoteRequests: mergeDefaultRecords(
            persisted.quoteRequests,
            defaultQuoteRequests,
            (request) => request.requestNo,
          ).map(withDefaultEnterprise),
          osHandoffs: mergeDefaultRecords(
            persisted.osHandoffs,
            defaultOsHandoffs,
            (handoff) => handoff.id,
          ).map(withDefaultEnterprise),
        };
      },
    },
  ),
);
