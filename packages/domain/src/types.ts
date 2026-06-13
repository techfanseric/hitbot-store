export type Locale = 'zh' | 'en';

export interface LocalizedString {
  zh: string;
  en: string;
}

export type ProductCategory =
  | 'gripper'
  | 'arm-4axis'
  | 'arm-6axis'
  | 'dex-hand'
  | 'humanoid'
  | 'cylinder'
  | 'motor';

export type PartClass = 'standard' | 'custom' | 'reference';
export type Stock = 'in-stock' | 'out-of-stock' | 'preorder';
export type Currency = 'CNY' | 'USD';

export interface ProductSpec {
  key: LocalizedString;
  value: string;
}

export interface ProductSelection {
  reachMm?: number;
  payloadKg?: number;
  strokeMm?: number;
  gripForceN?: number;
  dof?: number;
}

export interface Product {
  id: string;
  slug: string;
  model: string;
  name: LocalizedString;
  category: ProductCategory;
  partClass: PartClass;
  catalogVisible: boolean;
  priceCents: number;
  currency: Currency;
  stock: Stock;
  image?: string;
  specs: ProductSpec[];
  selection?: ProductSelection;
  accessoryProductIds?: string[];
  description: LocalizedString;
  featured: boolean;
}

export interface Category {
  id: ProductCategory;
  name: LocalizedString;
}

export type CartSource = 'web' | 'os';
export type CartSyncStatus = 'local' | 'synced' | 'pending';

export interface CartItem {
  productId: string;
  qty: number;
  partClass: PartClass;
  source: CartSource;
  selected: boolean;
  sellable: boolean;
  quoteRequired: boolean;
  syncStatus: CartSyncStatus;
  addedAt: number;
}

export interface CartProject {
  enterpriseId?: string;
  companyName?: string;
  projectId: string;
  projectName: string;
  source: CartSource;
  items: CartItem[];
  updatedAt: number;
}

export type EnterpriseRole = 'admin' | 'buyer' | 'engineer';
export type PaymentMethod = 'corporate' | 'personal';
export type OrderStatus =
  | 'pending-quote'
  | 'pending-approval'
  | 'pending-payment'
  | 'paid'
  | 'in-production'
  | 'shipped'
  | 'completed';

export interface EnterpriseProfile {
  enterpriseId: string;
  companyName: string;
  role: EnterpriseRole;
  contactName: string;
  phone: string;
  email: string;
}

export interface AddressProfile {
  id: string;
  enterpriseId?: string;
  companyName?: string;
  label: string;
  recipient: string;
  phone: string;
  province: string;
  city: string;
  address: string;
  updatedAt: string;
}

export interface InvoiceProfile {
  id: string;
  enterpriseId?: string;
  companyName?: string;
  label: string;
  title: string;
  taxId: string;
  bankAccount: string;
  updatedAt: string;
}

export interface OrderLineSnapshot {
  productId: string;
  model: string;
  name: LocalizedString;
  partClass: PartClass;
  qty: number;
  source?: CartSource;
  sellable?: boolean;
  quoteRequired?: boolean;
  unitPriceCents: number;
  subtotalCents: number;
  currency: Currency;
}

export interface LocalOrderSnapshot {
  orderNo: string;
  enterpriseId?: string;
  companyName?: string;
  projectId?: string;
  projectName: string;
  role: EnterpriseRole;
  submittedBy?: string;
  lines: OrderLineSnapshot[];
  subtotalCents: number;
  itemCount: number;
  submittedAt: string;
  updatedAt?: string;
  status: OrderStatus;
  paymentMethod?: PaymentMethod;
  approver?: string;
  approvedAt?: string;
  paidAt?: string;
  paidBy?: string;
  paymentReference?: string;
  productionStartedAt?: string;
  shippedAt?: string;
  completedAt?: string;
  carrier?: string;
  trackingNo?: string;
  shippingAddress?: Pick<AddressProfile, 'recipient' | 'phone' | 'province' | 'city' | 'address'>;
  invoice?: Pick<InvoiceProfile, 'title' | 'taxId' | 'bankAccount'> | null;
  note?: string;
}

export interface SubmitCartInput {
  projectId: string;
  projectName: string;
  enterprise: EnterpriseProfile;
  items: CartItem[];
  paymentMethod?: PaymentMethod;
  shippingAddress?: Pick<AddressProfile, 'recipient' | 'phone' | 'province' | 'city' | 'address'>;
  invoice?: Pick<InvoiceProfile, 'title' | 'taxId' | 'bankAccount'> | null;
  note?: string;
}

export interface SubmitCartResult {
  order: LocalOrderSnapshot;
  hasQuoteItems: boolean;
}
