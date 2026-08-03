import type { EnterpriseRole } from './procurement';
import type { Stock } from './product';

export type AdminPermission = 'catalog' | 'orders' | 'invoices' | 'permissions';
export type AdminPublishState = 'published' | 'draft';
export type AdminMemberStatus = 'active' | 'invited' | 'suspended';
export type AdminAuditModule =
  | 'catalog'
  | 'orders'
  | 'quotes'
  | 'permissions'
  | 'access'
  | 'memberships';
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
  | 'member-suspend'
  | 'member-restore'
  | 'invitation-create'
  | 'invitation-revoke'
  | 'member-join'
  | 'access-request';

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

export interface AdminApprovalSettings {
  enterpriseId: string;
  defaultApproverMemberId: string;
  orderReviewerMemberId?: string;
  deliveryOwnerMemberId?: string;
  paymentInvoiceOwnerMemberId?: string;
  logisticsOwnerMemberId?: string;
  requireBuyerOrderApproval: boolean;
  requireQuoteOrderApproval: boolean;
  amountThresholdCents: number | null;
  updatedAt: string;
}

export interface AdminOrganizationInvitation {
  id: string;
  token: string;
  enterpriseId: string;
  companyName: string;
  createdBy: string;
  createdAt: string;
  expiresAt: string;
  maxUses: number | null;
  joinedUses: number;
  roleName: string;
  permissions: AdminPermission[];
  revokedAt?: string;
  revokedBy?: string;
}

export type AdminInvitationJoinResult =
  | 'joined'
  | 'invalid-link'
  | 'expired'
  | 'revoked'
  | 'exhausted'
  | 'already-member'
  | 'invalid-phone';

export interface AdminEnterpriseAccessRequest {
  id: string;
  companyName: string;
  contactName: string;
  phone: string;
  email: string;
  intent: string;
  status: 'pending';
  requestedAt: string;
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
