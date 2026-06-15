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
  images: string[];
  specs: ProductSpec[];
  selection?: ProductSelection;
  accessoryProductIds?: string[];
  description: LocalizedString;
  seoDescription?: LocalizedString;
  legacyUrls?: string[];
  featured: boolean;
  publishedAt: string;
}

export interface Category {
  id: ProductCategory;
  slug: string;
  name: LocalizedString;
  icon: string;
  count: number;
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

export interface OsBomItemInput {
  productId: string;
  qty: number;
  partClass: PartClass;
  sellable?: boolean;
  selected?: boolean;
  quoteRequired?: boolean;
}

export interface OsBomImportInput {
  projectId: string;
  projectName: string;
  items: OsBomItemInput[];
  replace?: boolean;
}

export type EnterpriseRole = 'admin' | 'buyer' | 'engineer';
export type PaymentMethod = 'corporate' | 'personal';
export type ApprovalMode = 'buyer-review' | 'admin-review' | 'admin-direct' | 'not-required';
export type OrderStatus =
  | 'pending-quote'
  | 'pending-approval'
  | 'pending-payment'
  | 'paid'
  | 'in-production'
  | 'shipped'
  | 'completed';
export type QuoteStatus = 'pending-quote' | 'quoted' | 'accepted';
export type OsHandoffStatus = 'pending' | 'accepted' | 'submitted';

export interface EnterpriseProfile {
  enterpriseId: string;
  companyName: string;
  role: EnterpriseRole;
  contactName: string;
  phone: string;
  email: string;
  signedInAt?: string | null;
}

export interface CheckoutDraft {
  recipient: string;
  phone: string;
  province: string;
  city: string;
  address: string;
  paymentMethod: PaymentMethod;
  invoiceTitle: string;
  taxId: string;
  bankAccount: string;
  approvalMode: ApprovalMode;
  approver: string;
  note: string;
}

export interface OrderAddressSnapshot {
  recipient: string;
  phone: string;
  province: string;
  city: string;
  address: string;
}

export interface OrderInvoiceSnapshot {
  title: string;
  taxId: string;
  bankAccount: string;
}

export interface AddressProfile extends OrderAddressSnapshot {
  id: string;
  enterpriseId?: string;
  companyName?: string;
  label: string;
  updatedAt: string;
}

export interface InvoiceProfile extends OrderInvoiceSnapshot {
  id: string;
  enterpriseId?: string;
  companyName?: string;
  label: string;
  updatedAt: string;
}

export interface OrderLineSnapshot {
  productId: string;
  model: string;
  name: LocalizedString;
  partClass: PartClass;
  qty: number;
  source?: CartSource;
  selected?: boolean;
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
  handoffId?: string;
  role: EnterpriseRole;
  approvalMode?: ApprovalMode;
  submittedBy?: string;
  approver?: string;
  approvedBy?: string;
  paymentMethod?: PaymentMethod;
  lines: OrderLineSnapshot[];
  shippingAddress?: OrderAddressSnapshot;
  invoice?: OrderInvoiceSnapshot | null;
  note?: string;
  subtotalCents: number;
  itemCount: number;
  submittedAt: string;
  approvedAt?: string;
  paidAt?: string;
  paidBy?: string;
  paymentReference?: string;
  productionStartedAt?: string;
  shippedAt?: string;
  completedAt?: string;
  carrier?: string;
  trackingNo?: string;
  updatedAt?: string;
  status: OrderStatus;
}

export interface LocalOsHandoff {
  id: string;
  enterpriseId?: string;
  companyName?: string;
  projectId: string;
  projectName: string;
  itemCount: number;
  items?: CartItem[];
  submittedBy?: string;
  submittedAt: string;
  acceptedBy?: string;
  acceptedAt?: string;
  submittedOrderNo?: string;
  orderSubmittedAt?: string;
  updatedAt: string;
  status: OsHandoffStatus;
}

export interface LocalQuoteRequest {
  requestNo: string;
  enterpriseId?: string;
  companyName?: string;
  orderNo: string;
  projectName: string;
  lines: OrderLineSnapshot[];
  submittedBy?: string;
  submittedAt: string;
  quotedAt?: string;
  quotedBy?: string;
  estimateCents?: number;
  note?: string;
  updatedAt: string;
  status: QuoteStatus;
}

export interface SubmitCartInput {
  projectId: string;
  projectName: string;
  handoffId?: string;
  clientRequestId?: string;
  enterprise: EnterpriseProfile;
  items: CartItem[];
  paymentMethod?: PaymentMethod;
  shippingAddress?: OrderAddressSnapshot;
  invoice?: OrderInvoiceSnapshot | null;
  note?: string;
}

export interface SubmitCartResult {
  order: LocalOrderSnapshot;
  hasQuoteItems: boolean;
  quoteRequest?: LocalQuoteRequest;
}
