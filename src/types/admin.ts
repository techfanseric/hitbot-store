import type { EnterpriseRole } from './procurement';
import type { Stock } from './product';

export type AdminPermission = 'catalog' | 'orders' | 'invoices' | 'permissions';
export type AdminPublishState = 'published' | 'draft';
export type AdminMemberStatus = 'active' | 'invited';
export type AdminAccessRequestStatus = 'pending' | 'approved' | 'rejected';
export type AdminAuditModule = 'catalog' | 'orders' | 'quotes' | 'permissions' | 'access';
export type AdminAuditAction =
  | 'catalog-draft'
  | 'catalog-publish'
  | 'catalog-reset'
  | 'order-approve'
  | 'order-paid'
  | 'order-advance'
  | 'quote-provide'
  | 'member-role'
  | 'member-permission'
  | 'member-invite'
  | 'member-activate'
  | 'access-request'
  | 'access-approve'
  | 'access-reject';

export interface AdminProductRecord {
  productId: string;
  priceCents: number;
  stock: Stock;
  catalogVisible: boolean;
  featured: boolean;
  publishState: AdminPublishState;
  updatedAt: string;
}

export interface AdminMember {
  id: string;
  enterpriseId?: string;
  companyName?: string;
  name: string;
  email: string;
  phone?: string;
  role: EnterpriseRole;
  roleName?: string;
  status: AdminMemberStatus;
  permissions: AdminPermission[];
  updatedAt: string;
}

export interface AdminEnterpriseAccessRequest {
  id: string;
  companyName: string;
  contactName: string;
  phone: string;
  email: string;
  intent: string;
  status: AdminAccessRequestStatus;
  requestedAt: string;
  reviewedAt?: string;
  reviewedBy?: string;
  enterpriseId?: string;
}

export interface AdminAuditLog {
  id: string;
  module: AdminAuditModule;
  action: AdminAuditAction;
  actor: string;
  target: string;
  summary: string;
  createdAt: string;
}
