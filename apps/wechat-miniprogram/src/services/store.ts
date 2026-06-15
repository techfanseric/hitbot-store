import Taro from '@tarojs/taro';
import {
  type AddressProfile,
  type Category,
  type InvoiceProfile,
  type MiniSession,
  type MiniStoreSnapshot,
  type PaymentParams,
  type Product,
  type EnterpriseMemberLoginInput,
} from '@hitbot/api-client';
import {
  categories,
  createCartItem,
  defaultProfile,
  defaultProject,
  osDemoProject,
  products,
  type CartItem,
  type CartProject,
  type EnterpriseProfile,
  type ApprovalMode,
  type LocalOsHandoff,
  type LocalOrderSnapshot,
  type LocalQuoteRequest,
  type PaymentMethod,
} from '@hitbot/domain';
import { hitbotMiniApi } from './api';

const STORAGE_KEY = 'hitbot-mini-store-v1';
const DEFAULT_ENTERPRISE_ID = defaultProfile.enterpriseId;

type MiniOrderWithApproval = LocalOrderSnapshot & {
  approvalMode?: ApprovalMode;
  approvedBy?: string;
};
export type MiniOrderActionKind = 'approve' | 'pay' | 'receive' | 'view';
export type MiniOrderTodoKind = 'approval' | 'payment' | 'receipt';

export interface MiniOrderActionState {
  actionKind: MiniOrderActionKind;
  actionLabel: string;
  canAct: boolean;
  isTodo: boolean;
  lockedLabel: string;
  lockedReason: string;
  todoKind?: MiniOrderTodoKind;
  ownerLabel?: string;
}

export interface ActiveCartCheckoutSummary {
  selectedCount: number;
  selectedSellableCount: number;
  selectedQuoteCount: number;
  selectedSubmittableCount: number;
  bomLineCount: number;
  subtotalCents: number;
  requiresAddress: boolean;
  requiresInvoice: boolean;
  isEnterpriseBound: boolean;
  isEngineerRole: boolean;
  isAdminRole: boolean;
  isEngineerOsHandoff: boolean;
  isEngineerOrderBlocked: boolean;
  isQuoteOnlySubmission: boolean;
  submitLabel: string;
  successTitle: string;
  approverLabel: string;
  routeLabel: string;
}

export interface MiniAppState {
  session: MiniSession | null;
  categories: Category[];
  products: Product[];
  activeProjectKey: 'os' | 'web';
  projects: {
    os: CartProject;
    web: CartProject;
  };
  orders: LocalOrderSnapshot[];
  handoffs: LocalOsHandoff[];
  quoteRequests: LocalQuoteRequest[];
  addresses: AddressProfile[];
  invoices: InvoiceProfile[];
}

const defaultState: MiniAppState = {
  session: null,
  categories,
  products,
  activeProjectKey: 'os',
  projects: {
    os: osDemoProject,
    web: defaultProject,
  },
  orders: [],
  handoffs: [],
  quoteRequests: [],
  addresses: [],
  invoices: [],
};

let state: MiniAppState = { ...defaultState };
const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((listener) => listener());
}

function persist() {
  Taro.setStorageSync(STORAGE_KEY, state);
  const apiSnapshot: MiniStoreSnapshot = {
    session: state.session,
    categories: state.categories,
    products: state.products,
    orders: state.orders,
    quoteRequests: state.quoteRequests,
    handoffs: state.handoffs,
    addresses: state.addresses,
    invoices: state.invoices,
  };
  hitbotMiniApi.hydrate(apiSnapshot);
}

function normalizeCachedCopy(nextState: MiniAppState): MiniAppState {
  const webProject = nextState.projects.web;
  return {
    ...nextState,
    projects: {
      ...nextState.projects,
      web: {
        ...webProject,
        projectName:
          webProject.projectName === '官网商品选购' ? defaultProject.projectName : webProject.projectName,
      },
    },
  };
}

export function initMiniStore() {
  const cached = Taro.getStorageSync<MiniAppState>(STORAGE_KEY);
  if (cached) {
    state = normalizeCachedCopy({
      ...defaultState,
      ...cached,
      projects: {
        ...defaultState.projects,
        ...cached.projects,
      },
    });
    hitbotMiniApi.hydrate({
      session: state.session,
      categories: state.categories,
      products: state.products,
      orders: state.orders,
      quoteRequests: state.quoteRequests,
      handoffs: state.handoffs,
      addresses: state.addresses,
      invoices: state.invoices,
    });
    void loadCatalog();
  } else {
    void loadBootstrapData();
  }
}

export function subscribeMiniStore(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function getMiniState() {
  return state;
}

export function hasEnterpriseSession(snapshot: MiniAppState = state) {
  return Boolean(snapshot.session?.bound && snapshot.session.profile);
}

export function isEnterpriseBound(snapshot: MiniAppState = state) {
  return hasEnterpriseSession(snapshot);
}

export function currentEnterpriseProfile(snapshot: MiniAppState = state): EnterpriseProfile | null {
  return hasEnterpriseSession(snapshot) ? snapshot.session?.profile ?? null : null;
}

export function selectMiniEnterpriseOrders(snapshot: MiniAppState = state) {
  const profile = currentEnterpriseProfile(snapshot);
  if (!profile) return [];

  return snapshot.orders.filter((order) => isSameEnterprise(profile, order));
}

export function selectMiniEnterpriseHandoffs(snapshot: MiniAppState = state) {
  const profile = currentEnterpriseProfile(snapshot);
  if (!profile) return [];

  return snapshot.handoffs.filter((handoff) => isSameEnterprise(profile, handoff));
}

export function selectMiniEnterpriseQuoteRequests(snapshot: MiniAppState = state) {
  const profile = currentEnterpriseProfile(snapshot);
  if (!profile) return [];

  return snapshot.quoteRequests.filter((request) => isSameEnterprise(profile, request));
}

export function selectMiniEnterpriseAddresses(snapshot: MiniAppState = state) {
  const profile = currentEnterpriseProfile(snapshot);
  if (!profile) return [];

  return snapshot.addresses.filter((address) => isSameEnterprise(profile, address));
}

export function selectMiniEnterpriseInvoices(snapshot: MiniAppState = state) {
  const profile = currentEnterpriseProfile(snapshot);
  if (!profile) return [];

  return snapshot.invoices.filter((invoice) => isSameEnterprise(profile, invoice));
}

export function findEnterpriseOrder(orderNo: string, snapshot: MiniAppState = state) {
  return selectMiniEnterpriseOrders(snapshot).find((order) => order.orderNo === orderNo) ?? null;
}

export function resolveMiniOrderAction(
  order: LocalOrderSnapshot,
  snapshot: MiniAppState = state,
): MiniOrderActionState {
  const profile = currentEnterpriseProfile(snapshot);
  const lockedBase = {
    actionKind: 'view' as const,
    actionLabel: '查看详情',
    canAct: false,
    isTodo: false,
    lockedLabel: '查看详情',
  };

  if (!profile) {
    return {
      ...lockedBase,
      lockedReason: '登录企业账号后可处理订单',
    };
  }

  if (!isSameEnterprise(profile, order)) {
    return {
      ...lockedBase,
      lockedReason: '仅当前企业成员可处理',
    };
  }

  if (canApproveMiniOrder(profile, order)) {
    return {
      actionKind: 'approve',
      actionLabel: '审批通过',
      canAct: true,
      isTodo: true,
      lockedLabel: '',
      lockedReason: '',
      todoKind: 'approval',
      ownerLabel: profile.role === 'admin' ? '管理员审批' : '指定审批人',
    };
  }

  if (order.status === 'pending-payment') {
    if (canPayMiniOrder(profile)) {
      return {
        actionKind: 'pay',
        actionLabel: order.paymentMethod === 'personal' ? '微信支付' : '确认付款',
        canAct: true,
        isTodo: true,
        lockedLabel: '',
        lockedReason: '',
        todoKind: 'payment',
        ownerLabel: '付款/发票负责人',
      };
    }

    return {
      ...lockedBase,
      lockedReason: '需采购或管理员处理付款',
      ownerLabel: '付款/发票负责人',
    };
  }

  if (order.status === 'shipped') {
    if (canReceiveMiniOrder(profile)) {
      return {
        actionKind: 'receive',
        actionLabel: '确认收货',
        canAct: true,
        isTodo: true,
        lockedLabel: '',
        lockedReason: '',
        todoKind: 'receipt',
        ownerLabel: '物流/收货负责人',
      };
    }

    return {
      ...lockedBase,
      lockedReason: '需物流或管理员确认收货',
      ownerLabel: '物流/收货负责人',
    };
  }

  if (order.status === 'pending-approval') {
    return {
      ...lockedBase,
      lockedReason:
        profile.role === 'engineer'
          ? '工程师提交后仅可查看审批进度'
          : order.approver
            ? `待 ${order.approver} 审批`
            : '待管理员审批',
      ownerLabel: order.approver ? `审批人：${order.approver}` : '审批人待分配',
    };
  }

  if (order.status === 'pending-quote') {
    return {
      ...lockedBase,
      lockedReason: '待销售报价后进入审批或付款',
      ownerLabel: '销售报价',
    };
  }

  if (order.status === 'paid' || order.status === 'in-production') {
    return {
      ...lockedBase,
      lockedReason: '履约环节由生产/物流负责人推进',
      ownerLabel: '履约跟踪',
    };
  }

  return {
    ...lockedBase,
    lockedReason: '订单已完成',
  };
}

export function getMiniOrderTodoCounts(snapshot: MiniAppState = state) {
  return selectMiniEnterpriseOrders(snapshot).reduce(
    (counts, order) => {
      const action = resolveMiniOrderAction(order, snapshot);
      if (action.todoKind === 'approval') counts.approval += 1;
      if (action.todoKind === 'payment') counts.payment += 1;
      if (action.todoKind === 'receipt') counts.receipt += 1;
      counts.total = counts.approval + counts.payment + counts.receipt;
      return counts;
    },
    { approval: 0, payment: 0, receipt: 0, total: 0 },
  );
}

export function miniRolePermissionSummary(profile: EnterpriseProfile | null) {
  if (!profile) return '未进入企业账号，暂无订单处理权限';

  if (profile.role === 'admin') {
    return '可审批、付款、确认收货，并查看企业订单';
  }

  if (profile.role === 'buyer') {
    return '可处理指定审批和付款/发票待办，查看企业订单';
  }

  return '可查看项目订单，并处理物流/收货待办';
}

export function activeProject() {
  return state.projects[state.activeProjectKey];
}

export function isCompleteAddress(address?: AddressProfile | null) {
  return Boolean(address?.recipient && address.phone && address.city && address.address);
}

export function isCompleteInvoice(invoice?: InvoiceProfile | null) {
  return Boolean(invoice?.title && invoice.taxId && invoice.bankAccount);
}

function selectedCartQuantity(items: CartItem[]) {
  return items.reduce((sum, item) => sum + (item.selected ? item.qty : 0), 0);
}

function selectedSellableQuantity(items: CartItem[]) {
  return items.reduce((sum, item) => sum + (item.selected && item.sellable ? item.qty : 0), 0);
}

function selectedQuoteQuantity(items: CartItem[]) {
  return items.reduce(
    (sum, item) => sum + (item.selected && item.quoteRequired ? item.qty : 0),
    0,
  );
}

function activeCartSubtotalCents(items: CartItem[]) {
  return items.reduce((sum, item) => {
    const product = state.products.find((entry) => entry.id === item.productId);
    if (!product || !item.selected || !item.sellable) return sum;
    return sum + product.priceCents * item.qty;
  }, 0);
}

export function activeCartCheckoutSummary(
  paymentMethod: PaymentMethod = 'corporate',
): ActiveCartCheckoutSummary {
  const project = activeProject();
  const profile = currentEnterpriseProfile();
  const enterpriseBound = hasEnterpriseSession();
  const isEngineerRole = enterpriseBound && profile?.role === 'engineer';
  const isAdminRole = enterpriseBound && profile?.role === 'admin';
  const selectedSellableCount = selectedSellableQuantity(project.items);
  const selectedQuoteCount = selectedQuoteQuantity(project.items);
  const selectedSubmittableCount = selectedSellableCount + selectedQuoteCount;
  const isEngineerOsHandoff = isEngineerRole;
  const isEngineerOrderBlocked = false;
  const isQuoteOnlySubmission = selectedSellableCount === 0 && selectedQuoteCount > 0;
  const submitLabel = !enterpriseBound
    ? '登录企业账号'
    : isEngineerOsHandoff
      ? '移交采购'
      : isQuoteOnlySubmission
        ? '提交询价'
        : isAdminRole
          ? '提交采购'
          : '提交审批';
  const successTitle = isEngineerOsHandoff
    ? '已移交采购'
    : isQuoteOnlySubmission
      ? '已提交询价'
      : isAdminRole
        ? '已提交采购'
        : '已提交审批';
  const approverLabel = !enterpriseBound
    ? '登录后确认'
    : isEngineerOsHandoff
      ? '采购负责人'
      : isAdminRole
        ? profile?.contactName ?? '管理员'
        : isQuoteOnlySubmission
          ? '报价负责人'
          : '林若安';
  const routeLabel = !enterpriseBound
    ? '待登录企业账号'
    : isEngineerOsHandoff
      ? '工程师移交采购'
      : isAdminRole
        ? '管理员直接提交'
        : isQuoteOnlySubmission
          ? '提交询价'
          : '采购提交审批';

  return {
    selectedCount: selectedCartQuantity(project.items),
    selectedSellableCount,
    selectedQuoteCount,
    selectedSubmittableCount,
    bomLineCount: project.items.length,
    subtotalCents: activeCartSubtotalCents(project.items),
    requiresAddress: !isEngineerRole && selectedSubmittableCount > 0,
    requiresInvoice:
      !isEngineerRole && paymentMethod === 'corporate' && selectedSubmittableCount > 0,
    isEnterpriseBound: enterpriseBound,
    isEngineerRole,
    isAdminRole,
    isEngineerOsHandoff,
    isEngineerOrderBlocked,
    isQuoteOnlySubmission,
    submitLabel,
    successTitle,
    approverLabel,
    routeLabel,
  };
}

export function setActiveProject(key: MiniAppState['activeProjectKey']) {
  state = { ...state, activeProjectKey: key };
  persist();
  emit();
}

export function patchCartItem(productId: string, patcher: (item: CartItem) => CartItem) {
  const key = state.activeProjectKey;
  const project = state.projects[key];
  state = {
    ...state,
    projects: {
      ...state.projects,
      [key]: {
        ...project,
        items: project.items.map((item) => (item.productId === productId ? patcher(item) : item)),
        updatedAt: Date.now(),
      },
    },
  };
  persist();
  emit();
}

export function removeCartItem(productId: string) {
  const key = state.activeProjectKey;
  const project = state.projects[key];
  state = {
    ...state,
    projects: {
      ...state.projects,
      [key]: {
        ...project,
        items: project.items.filter((item) => item.productId !== productId),
        updatedAt: Date.now(),
      },
    },
  };
  persist();
  emit();
}

export function addProductToActiveCart(productId: string) {
  const product = state.products.find((item) => item.id === productId);
  if (!product) return null;
  if (product.stock === 'out-of-stock') return null;

  const key = state.activeProjectKey;
  const project = state.projects[key];
  const existingItem = project.items.find((item) => item.productId === productId);
  const nextItems = existingItem
    ? project.items.map((item) =>
        item.productId === productId
          ? {
              ...item,
              qty: item.qty + 1,
              selected: true,
              syncStatus: 'local' as const,
            }
          : item,
      )
    : [
        {
          ...createCartItem(productId, product.partClass),
          source: project.source,
        },
        ...project.items,
      ];

  state = {
    ...state,
    projects: {
      ...state.projects,
      [key]: {
        ...project,
        items: nextItems,
        updatedAt: Date.now(),
      },
    },
  };
  persist();
  emit();
  return product;
}

async function getWechatLoginCode() {
  try {
    const result = await Taro.login();
    return result.code || `dev-${Date.now()}`;
  } catch {
    return `dev-${Date.now()}`;
  }
}

export async function loginEnterpriseMember(input: EnterpriseMemberLoginInput) {
  const previousApiSnapshot = hitbotMiniApi.snapshot?.();

  try {
    await hitbotMiniApi.loginWithWechat({ code: await getWechatLoginCode() });
    const session = await hitbotMiniApi.loginEnterpriseMember(input);
    const [categoriesValue, productsValue, orders, quoteRequests, handoffs, addresses, invoices] =
      await Promise.all([
      hitbotMiniApi.listCategories(),
      hitbotMiniApi.listProducts(),
      hitbotMiniApi.listOrders(),
      hitbotMiniApi.listQuoteRequests(),
      hitbotMiniApi.listHandoffs(),
      hitbotMiniApi.listAddresses(),
      hitbotMiniApi.listInvoices(),
    ]);
    state = {
      ...state,
      session,
      categories: categoriesValue,
      products: productsValue,
      orders,
      quoteRequests,
      handoffs,
      addresses,
      invoices,
    };
    persist();
    emit();
    return session;
  } catch (error) {
    if (previousApiSnapshot) {
      hitbotMiniApi.hydrate?.(previousApiSnapshot);
    }
    throw error;
  }
}

export async function loginAndBindEnterprise(input: {
  phone?: string;
  inviteCode?: string;
  account?: string;
  password?: string;
}) {
  return loginEnterpriseMember({
    account: input.account ?? input.phone ?? '',
    password: input.password ?? input.inviteCode ?? '',
  });
}

export function signOutEnterprise() {
  state = {
    ...state,
    session: null,
  };
  persist();
  emit();
}

export async function loadBootstrapData() {
  const [categoriesValue, productsValue, orders, quoteRequests, handoffs, addresses, invoices] =
    await Promise.all([
    hitbotMiniApi.listCategories(),
    hitbotMiniApi.listProducts(),
    hitbotMiniApi.listOrders(),
    hitbotMiniApi.listQuoteRequests(),
    hitbotMiniApi.listHandoffs(),
    hitbotMiniApi.listAddresses(),
    hitbotMiniApi.listInvoices(),
  ]);
  state = {
    ...state,
    categories: categoriesValue,
    products: productsValue,
    orders,
    quoteRequests,
    handoffs,
    addresses,
    invoices,
  };
  persist();
  emit();
  return state;
}

export async function loadOrders() {
  const orders = await hitbotMiniApi.listOrders();
  state = { ...state, orders };
  persist();
  emit();
  return orders;
}

export async function loadCatalog() {
  const [categoriesValue, productsValue] = await Promise.all([
    hitbotMiniApi.listCategories(),
    hitbotMiniApi.listProducts(),
  ]);
  state = { ...state, categories: categoriesValue, products: productsValue };
  persist();
  emit();
  return { categories: categoriesValue, products: productsValue };
}

export async function loadProfiles() {
  const [addresses, invoices] = await Promise.all([
    hitbotMiniApi.listAddresses(),
    hitbotMiniApi.listInvoices(),
  ]);
  state = { ...state, addresses, invoices };
  persist();
  emit();
  return { addresses, invoices };
}

export async function saveAddressProfile(
  input: Omit<AddressProfile, 'id' | 'updatedAt'> & { id?: string },
) {
  const address = await hitbotMiniApi.saveAddress(input);
  const addresses = await hitbotMiniApi.listAddresses();
  state = { ...state, addresses };
  persist();
  emit();
  return address;
}

export async function saveInvoiceProfile(
  input: Omit<InvoiceProfile, 'id' | 'updatedAt'> & { id?: string },
) {
  const invoice = await hitbotMiniApi.saveInvoice(input);
  const invoices = await hitbotMiniApi.listInvoices();
  state = { ...state, invoices };
  persist();
  emit();
  return invoice;
}

export async function submitActiveCart(options?: {
  note?: string;
  paymentMethod?: PaymentMethod;
  addressId?: string;
  invoiceId?: string;
}) {
  const project = activeProject();
  const profile = currentEnterpriseProfile();
  const paymentMethod = options?.paymentMethod ?? 'corporate';
  if (!profile) {
    throw new Error('BIND_ENTERPRISE_REQUIRED');
  }
  if (profile.role === 'engineer') {
    throw new Error('ENGINEER_HANDOFF_REQUIRED');
  }

  const checkout = activeCartCheckoutSummary(paymentMethod);
  if (checkout.selectedSubmittableCount === 0) {
    throw new Error('CART_SELECTION_REQUIRED');
  }

  const shippingAddress = selectMiniEnterpriseAddresses().find(
    (address) => address.id === options?.addressId,
  );
  const invoice = selectMiniEnterpriseInvoices().find((item) => item.id === options?.invoiceId);
  if (!isCompleteAddress(shippingAddress)) {
    throw new Error('ADDRESS_REQUIRED');
  }
  if (paymentMethod === 'corporate' && !isCompleteInvoice(invoice)) {
    throw new Error('INVOICE_REQUIRED');
  }
  const activeHandoff = state.handoffs.find(
    (handoff) =>
      handoff.projectId === project.projectId &&
      handoff.status !== 'submitted' &&
      isSameEnterprise(profile, handoff),
  );
  const clientRequestId = createSubmitClientRequestId(profile, project);

  const result = await hitbotMiniApi.submitCart({
    projectId: project.projectId,
    projectName: project.projectName,
    handoffId: activeHandoff?.id,
    clientRequestId,
    items: project.items,
    paymentMethod,
    shippingAddress: shippingAddress
      ? {
          recipient: shippingAddress.recipient,
          phone: shippingAddress.phone,
          province: shippingAddress.province,
          city: shippingAddress.city,
          address: shippingAddress.address,
        }
      : undefined,
    invoice: invoice
      ? {
          title: invoice.title,
          taxId: invoice.taxId,
          bankAccount: invoice.bankAccount,
        }
      : paymentMethod === 'personal'
        ? null
        : undefined,
    note: options?.note,
  });
  const orders = await hitbotMiniApi.listOrders();
  const quoteRequests = await hitbotMiniApi.listQuoteRequests();
  const submittedAt = new Date().toISOString();
  const key = state.activeProjectKey;
  const submittedProductIds = new Set(
    project.items
      .filter((item) => item.selected && (item.sellable || item.quoteRequired))
      .map((item) => item.productId),
  );
  const remainingItems = project.items.filter((item) => !submittedProductIds.has(item.productId));
  state = {
    ...state,
    orders,
    quoteRequests,
    projects: {
      ...state.projects,
      [key]: {
        ...project,
        items: remainingItems,
        updatedAt: Date.now(),
      },
    },
    handoffs: state.handoffs.map((handoff) =>
      handoff.projectId === project.projectId &&
      handoff.status !== 'submitted' &&
      isSameEnterprise(profile, handoff)
        ? {
            ...handoff,
            status: 'submitted',
            submittedOrderNo: result.order.orderNo,
            orderSubmittedAt: submittedAt,
            updatedAt: submittedAt,
          }
        : handoff,
    ),
  };
  persist();
  emit();
  return result;
}

export function handoffActiveCart() {
  const project = activeProject();
  const profile = currentEnterpriseProfile();
  if (!profile) {
    throw new Error('BIND_ENTERPRISE_REQUIRED');
  }
  if (profile.role !== 'engineer') {
    throw new Error('ENGINEER_OS_HANDOFF_REQUIRED');
  }
  if (project.items.length === 0) {
    throw new Error('CART_SELECTION_REQUIRED');
  }

  const key = state.activeProjectKey;
  const now = new Date().toISOString();
  const existingHandoff = state.handoffs.find(
    (handoff) => handoff.projectId === project.projectId && isSameEnterprise(profile, handoff),
  );
  const canUpdateExisting = Boolean(existingHandoff && existingHandoff.status !== 'submitted');
  const snapshotItems = project.items.map((item) => ({
    ...item,
    syncStatus: 'synced' as const,
  }));
  const nextHandoff: LocalOsHandoff = {
    id: canUpdateExisting && existingHandoff ? existingHandoff.id : nextHandoffId(project.projectId),
    enterpriseId: canUpdateExisting && existingHandoff ? existingHandoff.enterpriseId : profile.enterpriseId,
    companyName: canUpdateExisting && existingHandoff ? existingHandoff.companyName : profile.companyName,
    projectId: project.projectId,
    projectName: project.projectName,
    itemCount: snapshotItems.length,
    items: snapshotItems,
    submittedBy: canUpdateExisting && existingHandoff ? existingHandoff.submittedBy : profile.contactName,
    submittedAt: canUpdateExisting && existingHandoff ? existingHandoff.submittedAt : now,
    acceptedBy: canUpdateExisting && existingHandoff ? existingHandoff.acceptedBy : undefined,
    acceptedAt: canUpdateExisting && existingHandoff ? existingHandoff.acceptedAt : undefined,
    submittedOrderNo: canUpdateExisting && existingHandoff ? existingHandoff.submittedOrderNo : undefined,
    orderSubmittedAt: canUpdateExisting && existingHandoff ? existingHandoff.orderSubmittedAt : undefined,
    status: canUpdateExisting && existingHandoff ? existingHandoff.status : 'pending',
    updatedAt: now,
  };

  state = {
    ...state,
    projects: {
      ...state.projects,
      [key]: {
        ...project,
        items: snapshotItems,
        updatedAt: Date.now(),
      },
    },
    handoffs: canUpdateExisting && existingHandoff
      ? state.handoffs.map((handoff) =>
          handoff.id === existingHandoff.id ? nextHandoff : handoff,
        )
      : [nextHandoff, ...state.handoffs].slice(0, 8),
  };
  persist();
  emit();

  return {
    projectId: project.projectId,
    projectName: project.projectName,
    itemCount: project.items.length,
    submittedBy: profile.contactName,
  };
}

export function acceptMiniHandoff(projectId: string) {
  const profile = currentEnterpriseProfile();
  if (!profile || profile.role === 'engineer') return null;

  const acceptedAt = new Date().toISOString();
  const targetHandoff = state.handoffs.find(
    (handoff) =>
      handoff.projectId === projectId &&
      handoff.status === 'pending' &&
      isSameEnterprise(profile, handoff),
  );
  if (!targetHandoff) return null;

  const accepted: LocalOsHandoff = {
    ...targetHandoff,
    status: 'accepted',
    acceptedBy: profile.contactName,
    acceptedAt,
    updatedAt: acceptedAt,
  };
  const snapshotItems = (targetHandoff.items ?? []).map((item) => ({
    ...item,
    syncStatus: 'synced' as const,
  }));
  const nextHandoffs = state.handoffs.map((handoff) =>
    handoff.id === accepted.id ? accepted : handoff,
  );

  const projectKey: MiniAppState['activeProjectKey'] =
    state.projects.web.projectId === accepted.projectId ? 'web' : 'os';
  const currentProject = state.projects[projectKey];
  state = {
    ...state,
    activeProjectKey: projectKey,
    projects:
      snapshotItems && snapshotItems.length > 0
        ? {
            ...state.projects,
            [projectKey]: {
              ...currentProject,
              enterpriseId: accepted.enterpriseId,
              companyName: accepted.companyName,
              projectId: accepted.projectId,
              projectName: accepted.projectName,
              source: projectKey,
              items: snapshotItems,
              updatedAt: Date.now(),
            },
          }
        : state.projects,
    handoffs: nextHandoffs,
  };
  persist();
  emit();
  return accepted;
}

export async function advanceOrder(orderNo: string) {
  await hitbotMiniApi.advanceOrder(orderNo);
  const orders = await hitbotMiniApi.listOrders();
  state = { ...state, orders };
  persist();
  emit();
  return orders;
}

export async function provideQuoteRequest(requestNo: string) {
  await hitbotMiniApi.provideQuote(requestNo);
  const quoteRequests = await hitbotMiniApi.listQuoteRequests();
  state = { ...state, quoteRequests };
  persist();
  emit();
  return quoteRequests;
}

export async function acceptQuoteRequest(requestNo: string) {
  await hitbotMiniApi.acceptQuote(requestNo);
  const [orders, quoteRequests] = await Promise.all([
    hitbotMiniApi.listOrders(),
    hitbotMiniApi.listQuoteRequests(),
  ]);
  state = { ...state, orders, quoteRequests };
  persist();
  emit();
  return { orders, quoteRequests };
}

export async function createOrderPayment(orderNo: string): Promise<PaymentParams> {
  return hitbotMiniApi.createPayment(orderNo);
}

export async function confirmOrderPayment(orderNo: string) {
  const order = findEnterpriseOrder(orderNo);
  if (order?.paymentMethod === 'personal') {
    await hitbotMiniApi.confirmPayment(orderNo);
  } else {
    await hitbotMiniApi.confirmCorporatePayment(orderNo);
  }
  const orders = await hitbotMiniApi.listOrders();
  state = { ...state, orders };
  persist();
  emit();
  return orders;
}

export function currentProfile(): EnterpriseProfile | null {
  return currentEnterpriseProfile();
}

export function findOrder(orderNo: string) {
  return state.orders.find((order) => order.orderNo === orderNo) ?? null;
}

export function findProduct(slug: string) {
  return state.products.find((product) => product.slug === slug) ?? null;
}

export function relatedProducts(productId: string) {
  const current = state.products.find((product) => product.id === productId);
  if (!current) return [];
  const relatedIds = current.accessoryProductIds ?? [];
  return state.products.filter(
    (product) =>
      product.id !== current.id &&
      product.catalogVisible &&
      (relatedIds.includes(product.id) || product.category === current.category),
  );
}

function canApproveMiniOrder(profile: EnterpriseProfile, order: LocalOrderSnapshot) {
  const approvalOrder = order as MiniOrderWithApproval;
  if (!isSameEnterprise(profile, order)) return false;
  if (profile.role === 'engineer' || order.status !== 'pending-approval') return false;
  if (profile.role === 'admin') return true;
  if (approvalOrder.approvalMode === 'admin-review') return false;
  if (approvalOrder.approvalMode === 'admin-direct' || approvalOrder.approvalMode === 'not-required') {
    return false;
  }
  if (!order.approver) return false;

  return order.approver === profile.contactName || order.approver === profile.email;
}

function canPayMiniOrder(profile: EnterpriseProfile) {
  return profile.role === 'admin' || profile.role === 'buyer';
}

function canReceiveMiniOrder(profile: EnterpriseProfile) {
  return profile.role === 'admin' || profile.role === 'engineer';
}

function nextHandoffId(projectId: string) {
  const stamp = new Date().toISOString().replace(/\D/g, '').slice(0, 14);
  return `OS-${projectId}-${stamp}`;
}

function createSubmitClientRequestId(profile: EnterpriseProfile, project: CartProject) {
  const selectedRevision = project.items
    .filter((item) => item.selected && (item.sellable || item.quoteRequired))
    .map((item) => `${item.productId}:${item.qty}:${item.source}:${item.partClass}`)
    .sort()
    .join('|');
  return [
    'mini-submit',
    profile.enterpriseId,
    project.projectId,
    project.updatedAt,
    selectedRevision,
  ].join(':');
}

function isSameEnterprise(profile: EnterpriseProfile, record: { enterpriseId?: string }) {
  return (record.enterpriseId ?? DEFAULT_ENTERPRISE_ID) === profile.enterpriseId;
}
