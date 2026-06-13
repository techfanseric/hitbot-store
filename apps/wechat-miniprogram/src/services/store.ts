import Taro from '@tarojs/taro';
import {
  type AddressProfile,
  type Category,
  type InvoiceProfile,
  type MiniSession,
  type MiniStoreSnapshot,
  type PaymentParams,
  type Product,
} from '@hitbot/api-client';
import {
  categories,
  createCartItem,
  defaultProject,
  osDemoProject,
  products,
  type CartItem,
  type CartProject,
  type EnterpriseProfile,
  type LocalOrderSnapshot,
  type PaymentMethod,
} from '@hitbot/domain';
import { hitbotMiniApi } from './api';

const STORAGE_KEY = 'hitbot-mini-store-v1';

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

export function activeProject() {
  return state.projects[state.activeProjectKey];
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

export async function loginAndBindEnterprise(input: { phone: string; inviteCode?: string }) {
  await hitbotMiniApi.loginWithWechat({ code: await getWechatLoginCode() });
  const session = await hitbotMiniApi.bindEnterprise(input);
  const [categoriesValue, productsValue, orders, addresses, invoices] = await Promise.all([
    hitbotMiniApi.listCategories(),
    hitbotMiniApi.listProducts(),
    hitbotMiniApi.listOrders(),
    hitbotMiniApi.listAddresses(),
    hitbotMiniApi.listInvoices(),
  ]);
  state = {
    ...state,
    session,
    categories: categoriesValue,
    products: productsValue,
    orders,
    addresses,
    invoices,
  };
  persist();
  emit();
  return session;
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
  const [categoriesValue, productsValue, orders, addresses, invoices] = await Promise.all([
    hitbotMiniApi.listCategories(),
    hitbotMiniApi.listProducts(),
    hitbotMiniApi.listOrders(),
    hitbotMiniApi.listAddresses(),
    hitbotMiniApi.listInvoices(),
  ]);
  state = { ...state, categories: categoriesValue, products: productsValue, orders, addresses, invoices };
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
  const shippingAddress = state.addresses.find((address) => address.id === options?.addressId);
  const invoice = state.invoices.find((item) => item.id === options?.invoiceId);
  const result = await hitbotMiniApi.submitCart({
    projectId: project.projectId,
    projectName: project.projectName,
    items: project.items,
    enterprise: state.session?.profile ?? undefined,
    paymentMethod: options?.paymentMethod,
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
      : options?.paymentMethod === 'personal'
        ? null
        : undefined,
    note: options?.note,
  });
  const orders = await hitbotMiniApi.listOrders();
  state = { ...state, orders };
  persist();
  emit();
  return result;
}

export async function advanceOrder(orderNo: string) {
  await hitbotMiniApi.advanceOrder(orderNo);
  const orders = await hitbotMiniApi.listOrders();
  state = { ...state, orders };
  persist();
  emit();
  return orders;
}

export async function createOrderPayment(orderNo: string): Promise<PaymentParams> {
  return hitbotMiniApi.createPayment(orderNo);
}

export async function confirmOrderPayment(orderNo: string) {
  await hitbotMiniApi.confirmPayment(orderNo);
  const orders = await hitbotMiniApi.listOrders();
  state = { ...state, orders };
  persist();
  emit();
  return orders;
}

export function currentProfile(): EnterpriseProfile | null {
  return state.session?.profile ?? null;
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
