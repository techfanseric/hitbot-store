import type { Currency, LocalizedString, PartClass } from './product';
import type { CartSource } from './cart';

export type EnterpriseRole = 'admin' | 'buyer' | 'engineer';
export type PaymentMethod = 'corporate' | 'personal';
export type ApprovalMode = 'buyer-review' | 'admin-review' | 'admin-direct';
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
  signedInAt: string | null;
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
  lines?: OrderLineSnapshot[];
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
