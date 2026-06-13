import {
  advanceOrderAction,
  addressProfiles as seedAddressProfiles,
  categories as seedCategories,
  createOrderFromCart,
  defaultProfile,
  getProductBySlug,
  invoiceProfiles as seedInvoiceProfiles,
  orders as seedOrders,
  products as seedProducts,
  type AddressProfile,
  type CartItem,
  type Category,
  type EnterpriseProfile,
  type InvoiceProfile,
  type LocalOrderSnapshot,
  type Product,
  type SubmitCartInput,
  type SubmitCartResult,
} from '@hitbot/domain';

export interface MiniSession {
  token: string;
  openId: string;
  profile: EnterpriseProfile | null;
  bound: boolean;
}

export interface MiniLoginInput {
  code: string;
}

export interface BindEnterpriseInput {
  phone: string;
  inviteCode?: string;
}

export interface MiniStoreSnapshot {
  session: MiniSession | null;
  categories: Category[];
  products: Product[];
  orders: LocalOrderSnapshot[];
  addresses: AddressProfile[];
  invoices: InvoiceProfile[];
}

export interface PaymentParams {
  timeStamp: string;
  nonceStr: string;
  package: string;
  signType: 'RSA' | 'MD5';
  paySign: string;
}

export interface ApiRequestOptions<TBody = unknown> {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  path: string;
  body?: TBody;
  token?: string;
}

export interface ApiTransport {
  request<TResponse, TBody = unknown>(options: ApiRequestOptions<TBody>): Promise<TResponse>;
}

export interface HitbotMiniApi {
  loginWithWechat(input: MiniLoginInput): Promise<MiniSession>;
  bindEnterprise(input: BindEnterpriseInput): Promise<MiniSession>;
  getSession(): Promise<MiniSession | null>;
  listCategories(): Promise<Category[]>;
  listProducts(): Promise<Product[]>;
  getProduct(slug: string): Promise<Product | null>;
  listOrders(): Promise<LocalOrderSnapshot[]>;
  getOrder(orderNo: string): Promise<LocalOrderSnapshot | null>;
  listAddresses(): Promise<AddressProfile[]>;
  listInvoices(): Promise<InvoiceProfile[]>;
  saveAddress(input: Omit<AddressProfile, 'id' | 'updatedAt'> & { id?: string }): Promise<AddressProfile>;
  saveInvoice(input: Omit<InvoiceProfile, 'id' | 'updatedAt'> & { id?: string }): Promise<InvoiceProfile>;
  submitCart(input: Omit<SubmitCartInput, 'enterprise'> & { enterprise?: EnterpriseProfile }): Promise<SubmitCartResult>;
  advanceOrder(orderNo: string): Promise<LocalOrderSnapshot | null>;
  createPayment(orderNo: string): Promise<PaymentParams>;
  confirmPayment(orderNo: string): Promise<LocalOrderSnapshot | null>;
  hydrate?(snapshot: MiniStoreSnapshot): void;
  snapshot?(): MiniStoreSnapshot;
}

function createToken(seed: string) {
  return `mock-token-${seed || Date.now()}`;
}

export class MockHitbotMiniApiClient implements HitbotMiniApi {
  private session: MiniSession | null = null;
  private categories: Category[] = [...seedCategories];
  private products: Product[] = [...seedProducts];
  private orders: LocalOrderSnapshot[] = [...seedOrders];
  private addresses: AddressProfile[] = [...seedAddressProfiles];
  private invoices: InvoiceProfile[] = [...seedInvoiceProfiles];

  async loginWithWechat(input: MiniLoginInput): Promise<MiniSession> {
    this.session = {
      token: createToken(input.code),
      openId: `mock-openid-${input.code || 'dev'}`,
      profile: null,
      bound: false,
    };
    return this.session;
  }

  async bindEnterprise(input: BindEnterpriseInput): Promise<MiniSession> {
    const profile: EnterpriseProfile = {
      ...defaultProfile,
      phone: input.phone || defaultProfile.phone,
      role: input.inviteCode?.toLowerCase().includes('engineer') ? 'engineer' : defaultProfile.role,
    };
    this.session = {
      token: this.session?.token ?? createToken(input.phone),
      openId: this.session?.openId ?? `mock-openid-${input.phone || 'dev'}`,
      profile,
      bound: true,
    };
    return this.session;
  }

  async getSession(): Promise<MiniSession | null> {
    return this.session;
  }

  async listOrders(): Promise<LocalOrderSnapshot[]> {
    return this.orders;
  }

  async listCategories(): Promise<Category[]> {
    return this.categories;
  }

  async listProducts(): Promise<Product[]> {
    return this.products;
  }

  async getProduct(slug: string): Promise<Product | null> {
    return getProductBySlug(slug) ?? null;
  }

  async getOrder(orderNo: string): Promise<LocalOrderSnapshot | null> {
    return this.orders.find((order) => order.orderNo === orderNo) ?? null;
  }

  async listAddresses(): Promise<AddressProfile[]> {
    return this.addresses;
  }

  async listInvoices(): Promise<InvoiceProfile[]> {
    return this.invoices;
  }

  async saveAddress(input: Omit<AddressProfile, 'id' | 'updatedAt'> & { id?: string }): Promise<AddressProfile> {
    const next: AddressProfile = {
      ...input,
      id: input.id || `addr-${Date.now()}`,
      updatedAt: new Date().toISOString(),
    };
    this.addresses = this.addresses.some((address) => address.id === next.id)
      ? this.addresses.map((address) => (address.id === next.id ? next : address))
      : [next, ...this.addresses];
    return next;
  }

  async saveInvoice(input: Omit<InvoiceProfile, 'id' | 'updatedAt'> & { id?: string }): Promise<InvoiceProfile> {
    const next: InvoiceProfile = {
      ...input,
      id: input.id || `inv-${Date.now()}`,
      updatedAt: new Date().toISOString(),
    };
    this.invoices = this.invoices.some((invoice) => invoice.id === next.id)
      ? this.invoices.map((invoice) => (invoice.id === next.id ? next : invoice))
      : [next, ...this.invoices];
    return next;
  }

  async submitCart(input: Omit<SubmitCartInput, 'enterprise'> & { enterprise?: EnterpriseProfile }): Promise<SubmitCartResult> {
    const enterprise = input.enterprise ?? this.session?.profile ?? defaultProfile;
    const result = createOrderFromCart({ ...input, enterprise });
    this.orders = [result.order, ...this.orders];
    return result;
  }

  async advanceOrder(orderNo: string): Promise<LocalOrderSnapshot | null> {
    let updated: LocalOrderSnapshot | null = null;
    this.orders = this.orders.map((order) => {
      if (order.orderNo !== orderNo) return order;
      const nextOrder = advanceOrderAction(order);
      updated = nextOrder;
      return nextOrder;
    });
    return updated;
  }

  async createPayment(orderNo: string): Promise<PaymentParams> {
    return {
      timeStamp: String(Math.floor(Date.now() / 1000)),
      nonceStr: `mock-${orderNo}`,
      package: `prepay_id=mock-prepay-${orderNo}`,
      signType: 'RSA',
      paySign: 'mock-pay-sign',
    };
  }

  async confirmPayment(orderNo: string): Promise<LocalOrderSnapshot | null> {
    let updated: LocalOrderSnapshot | null = null;
    const now = new Date().toISOString();
    this.orders = this.orders.map((order) => {
      if (order.orderNo !== orderNo) return order;
      const nextOrder = advanceOrderAction({
        ...order,
        paidAt: order.paidAt ?? now,
        paidBy: this.session?.profile?.contactName ?? defaultProfile.contactName,
        paymentReference: order.paymentReference ?? `WX-MOCK-${orderNo.slice(-8)}`,
      });
      updated = nextOrder;
      return nextOrder;
    });
    return updated;
  }

  hydrate(snapshot: MiniStoreSnapshot) {
    this.session = snapshot.session;
    this.categories = [...seedCategories];
    this.products = [...seedProducts];
    this.orders = snapshot.orders;
    this.addresses = snapshot.addresses;
    this.invoices = snapshot.invoices;
  }

  snapshot(): MiniStoreSnapshot {
    return {
      session: this.session,
      categories: this.categories,
      products: this.products,
      orders: this.orders,
      addresses: this.addresses,
      invoices: this.invoices,
    };
  }
}

export class HttpHitbotMiniApiClient implements HitbotMiniApi {
  private session: MiniSession | null = null;

  constructor(private readonly transport: ApiTransport) {}

  async loginWithWechat(input: MiniLoginInput): Promise<MiniSession> {
    this.session = await this.transport.request<MiniSession, MiniLoginInput>({
      method: 'POST',
      path: '/mini/auth/wechat-login',
      body: input,
    });
    return this.session;
  }

  async bindEnterprise(input: BindEnterpriseInput): Promise<MiniSession> {
    this.session = await this.transport.request<MiniSession, BindEnterpriseInput>({
      method: 'POST',
      path: '/mini/auth/bind-enterprise',
      body: input,
      token: this.session?.token,
    });
    return this.session;
  }

  async getSession(): Promise<MiniSession | null> {
    if (!this.session?.token) return this.session;
    this.session = await this.transport.request<MiniSession>({
      path: '/mini/auth/session',
      token: this.session.token,
    });
    return this.session;
  }

  async listOrders(): Promise<LocalOrderSnapshot[]> {
    return this.transport.request<LocalOrderSnapshot[]>({
      path: '/mini/orders',
      token: this.session?.token,
    });
  }

  async listCategories(): Promise<Category[]> {
    return this.transport.request<Category[]>({
      path: '/mini/categories',
      token: this.session?.token,
    });
  }

  async listProducts(): Promise<Product[]> {
    return this.transport.request<Product[]>({
      path: '/mini/products',
      token: this.session?.token,
    });
  }

  async getProduct(slug: string): Promise<Product | null> {
    return this.transport.request<Product | null>({
      path: `/mini/products/${encodeURIComponent(slug)}`,
      token: this.session?.token,
    });
  }

  async getOrder(orderNo: string): Promise<LocalOrderSnapshot | null> {
    return this.transport.request<LocalOrderSnapshot | null>({
      path: `/mini/orders/${encodeURIComponent(orderNo)}`,
      token: this.session?.token,
    });
  }

  async listAddresses(): Promise<AddressProfile[]> {
    return this.transport.request<AddressProfile[]>({
      path: '/mini/profile/addresses',
      token: this.session?.token,
    });
  }

  async listInvoices(): Promise<InvoiceProfile[]> {
    return this.transport.request<InvoiceProfile[]>({
      path: '/mini/profile/invoices',
      token: this.session?.token,
    });
  }

  async saveAddress(input: Omit<AddressProfile, 'id' | 'updatedAt'> & { id?: string }): Promise<AddressProfile> {
    return this.transport.request<AddressProfile, typeof input>({
      method: input.id ? 'PUT' : 'POST',
      path: input.id
        ? `/mini/profile/addresses/${encodeURIComponent(input.id)}`
        : '/mini/profile/addresses',
      body: input,
      token: this.session?.token,
    });
  }

  async saveInvoice(input: Omit<InvoiceProfile, 'id' | 'updatedAt'> & { id?: string }): Promise<InvoiceProfile> {
    return this.transport.request<InvoiceProfile, typeof input>({
      method: input.id ? 'PUT' : 'POST',
      path: input.id
        ? `/mini/profile/invoices/${encodeURIComponent(input.id)}`
        : '/mini/profile/invoices',
      body: input,
      token: this.session?.token,
    });
  }

  async submitCart(input: Omit<SubmitCartInput, 'enterprise'> & { enterprise?: EnterpriseProfile }): Promise<SubmitCartResult> {
    return this.transport.request<SubmitCartResult, typeof input>({
      method: 'POST',
      path: '/mini/cart/submit',
      body: input,
      token: this.session?.token,
    });
  }

  async advanceOrder(orderNo: string): Promise<LocalOrderSnapshot | null> {
    return this.transport.request<LocalOrderSnapshot | null>({
      method: 'POST',
      path: `/mini/orders/${encodeURIComponent(orderNo)}/advance`,
      token: this.session?.token,
    });
  }

  async createPayment(orderNo: string): Promise<PaymentParams> {
    return this.transport.request<PaymentParams>({
      method: 'POST',
      path: `/mini/orders/${encodeURIComponent(orderNo)}/payment`,
      token: this.session?.token,
    });
  }

  async confirmPayment(orderNo: string): Promise<LocalOrderSnapshot | null> {
    return this.transport.request<LocalOrderSnapshot | null>({
      method: 'POST',
      path: `/mini/orders/${encodeURIComponent(orderNo)}/confirm-payment`,
      token: this.session?.token,
    });
  }

  hydrate(snapshot: MiniStoreSnapshot) {
    this.session = snapshot.session;
  }

  snapshot(): MiniStoreSnapshot {
    return {
      session: this.session,
      categories: [],
      products: [],
      orders: [],
      addresses: [],
      invoices: [],
    };
  }
}

export function createHitbotMiniApiClient(options?: { transport?: ApiTransport }) {
  if (options?.transport) return new HttpHitbotMiniApiClient(options.transport);
  return new MockHitbotMiniApiClient();
}

export const hitbotMiniApi = createHitbotMiniApiClient();
export type {
  AddressProfile,
  CartItem,
  Category,
  EnterpriseProfile,
  InvoiceProfile,
  LocalOrderSnapshot,
  Product,
  SubmitCartResult,
};
