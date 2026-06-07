'use client';

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { products } from '@/mock-data';
import type {
  AdminAuditAction,
  AdminAuditLog,
  AdminApprovalSettings,
  AdminAuditModule,
  AdminEnterpriseAccessRequest,
  AdminMember,
  AdminPermission,
  AdminProductRecord,
} from '@/types/admin';
import type { EnterpriseRole } from '@/types/procurement';
import type { Stock } from '@/types/product';

interface UpdateProductInput {
  priceCents?: number;
  stock?: Stock;
  catalogVisible?: boolean;
  featured?: boolean;
}

interface AuditInput {
  module: AdminAuditModule;
  action: AdminAuditAction;
  actor: string;
  target: string;
  summary: string;
}

interface InviteMemberInput {
  name: string;
  email: string;
  phone?: string;
  roleName: string;
  permissions: AdminPermission[];
  enterpriseId?: string;
  companyName?: string;
}

interface UpdateMemberProfileInput {
  name?: string;
  email?: string;
  phone?: string;
  roleName?: string;
}

interface AdminState {
  productRecords: AdminProductRecord[];
  members: AdminMember[];
  approvalSettings: AdminApprovalSettings[];
  enterpriseAccessRequests: AdminEnterpriseAccessRequest[];
  auditLogs: AdminAuditLog[];
  updateProductRecord: (productId: string, patch: UpdateProductInput, actor?: string) => void;
  publishProductRecord: (productId: string, actor?: string) => void;
  resetProductRecord: (productId: string, actor?: string) => void;
  submitEnterpriseAccessRequest: (
    input: Omit<AdminEnterpriseAccessRequest, 'id' | 'status' | 'requestedAt'>,
  ) => void;
  approveEnterpriseAccessRequest: (requestId: string, actor?: string) => void;
  rejectEnterpriseAccessRequest: (requestId: string, actor?: string) => void;
  updateEnterpriseProfile: (enterpriseId: string, companyName: string, actor?: string) => void;
  updateMemberProfile: (memberId: string, patch: UpdateMemberProfileInput, actor?: string) => void;
  updateMemberRoleName: (memberId: string, roleName: string, actor?: string) => void;
  toggleMemberPermission: (memberId: string, permission: AdminPermission, actor?: string) => void;
  deleteMember: (memberId: string, actor?: string) => void;
  updateApprovalSettings: (
    enterpriseId: string,
    patch: Partial<Omit<AdminApprovalSettings, 'enterpriseId' | 'updatedAt'>>,
    actor?: string,
  ) => void;
  inviteMember: (input: InviteMemberInput, actor?: string) => void;
  inviteEngineer: (
    actor?: string,
    enterprise?: Pick<AdminMember, 'enterpriseId' | 'companyName'>,
  ) => void;
  activateMember: (memberId: string, actor?: string) => void;
  appendAuditLog: (input: AuditInput) => void;
}

function now() {
  return new Date().toISOString();
}

function nextAuditId() {
  const stamp = new Date().toISOString().replace(/\D/g, '').slice(0, 17);
  const suffix = Math.random().toString(36).slice(2, 5).toUpperCase();
  return `AUD${stamp}${suffix}`;
}

function nextEnterpriseId() {
  const stamp = new Date().toISOString().replace(/\D/g, '').slice(0, 12);
  return `HB-CORP-${stamp}`;
}

function auditEntry(input: AuditInput): AdminAuditLog {
  return {
    id: nextAuditId(),
    ...input,
    actor: input.actor || 'System',
    createdAt: now(),
  };
}

function appendAudit(logs: AdminAuditLog[], input: AuditInput) {
  const entry = auditEntry(input);
  const latest = logs[0];
  const shouldReplaceLatest =
    latest &&
    latest.action === input.action &&
    latest.target === input.target &&
    latest.actor === input.actor;

  return (shouldReplaceLatest ? [entry, ...logs.slice(1)] : [entry, ...logs]).slice(0, 20);
}

const adminPermissionOptions: AdminPermission[] = ['orders', 'invoices', 'permissions'];

function defaultPermissionsForRole(role: EnterpriseRole): AdminPermission[] {
  if (role === 'admin') return adminPermissionOptions;
  if (role === 'buyer') return ['orders', 'invoices'];
  return [];
}

function normalizePermissions(permissions: AdminPermission[] = []) {
  const allowed = new Set(adminPermissionOptions);
  return permissions.filter((permission) => allowed.has(permission));
}

function roleForPermissions(permissions: AdminPermission[]): EnterpriseRole {
  return permissions.some((permission) => permission === 'orders' || permission === 'invoices')
    ? 'buyer'
    : 'engineer';
}

function normalizeCompanyName(value: string | undefined, fallback = '深圳智造装备有限公司') {
  if (!value || value.includes('示例公司') || value.includes('DEMO')) return fallback;
  return value;
}

const defaultProductRecords: AdminProductRecord[] = products.map((product) => ({
  productId: product.id,
  priceCents: product.priceCents,
  stock: product.stock,
  catalogVisible: product.catalogVisible,
  featured: product.featured,
  publishState: 'published',
  updatedAt: product.publishedAt,
}));

const defaultMembers: AdminMember[] = [
  {
    id: 'member-admin',
    enterpriseId: 'ENT-HITBOT-CUSTOMER',
    companyName: '深圳智造装备有限公司',
    name: '林若安',
    email: 'admin@customer.example',
    phone: '15507540989',
    role: 'admin',
    roleName: '企业管理员',
    status: 'active',
    permissions: defaultPermissionsForRole('admin'),
    updatedAt: '2026-06-01T00:00:00.000Z',
  },
  {
    id: 'member-buyer',
    enterpriseId: 'ENT-HITBOT-CUSTOMER',
    companyName: '深圳智造装备有限公司',
    name: '陈思远',
    email: 'buyer@customer.example',
    phone: '15507540989',
    role: 'buyer',
    roleName: '采购负责人',
    status: 'active',
    permissions: defaultPermissionsForRole('buyer'),
    updatedAt: '2026-06-01T00:00:00.000Z',
  },
  {
    id: 'member-engineer',
    enterpriseId: 'ENT-HITBOT-CUSTOMER',
    companyName: '深圳智造装备有限公司',
    name: '周亦辰',
    email: 'engineer@customer.example',
    phone: '17701551867',
    role: 'engineer',
    roleName: '方案工程师',
    status: 'active',
    permissions: defaultPermissionsForRole('engineer'),
    updatedAt: '2026-06-01T00:00:00.000Z',
  },
];

const defaultApprovalSettings: AdminApprovalSettings[] = [
  {
    enterpriseId: 'ENT-HITBOT-CUSTOMER',
    defaultApproverMemberId: 'member-admin',
    orderReviewerMemberId: 'member-buyer',
    deliveryOwnerMemberId: 'member-buyer',
    paymentInvoiceOwnerMemberId: 'member-buyer',
    logisticsOwnerMemberId: 'member-engineer',
    requireBuyerOrderApproval: true,
    requireQuoteOrderApproval: true,
    amountThresholdCents: null,
    updatedAt: '2026-06-01T00:00:00.000Z',
  },
];

function defaultApprovalSettingsForEnterprise(
  enterpriseId: string,
  members: AdminMember[],
): AdminApprovalSettings {
  const defaultApprover =
    members.find(
      (member) =>
        member.enterpriseId === enterpriseId &&
        member.role === 'admin' &&
        member.status === 'active',
    ) ??
    members.find((member) => member.enterpriseId === enterpriseId && member.status === 'active');
  const defaultBuyer =
    members.find(
      (member) =>
        member.enterpriseId === enterpriseId &&
        member.role === 'buyer' &&
        member.status === 'active',
    ) ?? defaultApprover;
  const defaultLogisticsOwner =
    members.find(
      (member) =>
        member.enterpriseId === enterpriseId &&
        member.role === 'engineer' &&
        member.status === 'active',
    ) ?? defaultBuyer;

  return {
    enterpriseId,
    defaultApproverMemberId: defaultApprover?.id ?? '',
    orderReviewerMemberId: defaultBuyer?.id ?? '',
    deliveryOwnerMemberId: defaultBuyer?.id ?? '',
    paymentInvoiceOwnerMemberId: defaultBuyer?.id ?? '',
    logisticsOwnerMemberId: defaultLogisticsOwner?.id ?? defaultBuyer?.id ?? '',
    requireBuyerOrderApproval: true,
    requireQuoteOrderApproval: true,
    amountThresholdCents: null,
    updatedAt: now(),
  };
}

export function approvalSettingsForEnterprise(
  settings: AdminApprovalSettings[],
  members: AdminMember[],
  enterpriseId: string,
): AdminApprovalSettings {
  return (
    settings.find((item) => item.enterpriseId === enterpriseId) ??
    defaultApprovalSettingsForEnterprise(enterpriseId, members)
  );
}

function productRecordFor(productId: string): AdminProductRecord {
  return (
    defaultProductRecords.find((record) => record.productId === productId) ?? {
      productId,
      priceCents: 0,
      stock: 'preorder',
      catalogVisible: false,
      featured: false,
      publishState: 'draft',
      updatedAt: now(),
    }
  );
}

function productAuditTarget(productId: string) {
  const product = products.find((item) => item.id === productId);
  return product ? `${product.model} / ${productId}` : productId;
}

export const useAdminStore = create<AdminState>()(
  persist(
    (set) => ({
      productRecords: defaultProductRecords,
      members: defaultMembers,
      approvalSettings: defaultApprovalSettings,
      enterpriseAccessRequests: [],
      auditLogs: [],
      updateProductRecord: (productId, patch, actor = 'System') =>
        set((state) => ({
          productRecords: state.productRecords.map((record) =>
            record.productId === productId
              ? {
                  ...record,
                  ...patch,
                  publishState: 'draft',
                  updatedAt: now(),
                }
              : record,
          ),
          auditLogs: appendAudit(state.auditLogs, {
            module: 'catalog',
            action: 'catalog-draft',
            actor,
            target: productAuditTarget(productId),
            summary: productAuditTarget(productId),
          }),
        })),
      publishProductRecord: (productId, actor = 'System') =>
        set((state) => ({
          productRecords: state.productRecords.map((record) =>
            record.productId === productId
              ? {
                  ...record,
                  publishState: 'published',
                  updatedAt: now(),
                }
              : record,
          ),
          auditLogs: appendAudit(state.auditLogs, {
            module: 'catalog',
            action: 'catalog-publish',
            actor,
            target: productAuditTarget(productId),
            summary: productAuditTarget(productId),
          }),
        })),
      resetProductRecord: (productId, actor = 'System') =>
        set((state) => ({
          productRecords: state.productRecords.map((record) =>
            record.productId === productId ? productRecordFor(productId) : record,
          ),
          auditLogs: appendAudit(state.auditLogs, {
            module: 'catalog',
            action: 'catalog-reset',
            actor,
            target: productAuditTarget(productId),
            summary: productAuditTarget(productId),
          }),
        })),
      submitEnterpriseAccessRequest: (input) =>
        set((state) => {
          const timestamp = now();
          const normalizedEmail = input.email.trim().toLowerCase();
          const existingPending = state.enterpriseAccessRequests.find(
            (request) =>
              request.email.toLowerCase() === normalizedEmail && request.status === 'pending',
          );
          const nextRequest: AdminEnterpriseAccessRequest = {
            id: existingPending?.id ?? `access-${Date.now()}`,
            companyName: input.companyName.trim(),
            contactName: input.contactName.trim(),
            phone: input.phone.trim(),
            email: normalizedEmail,
            intent: input.intent.trim(),
            status: 'pending',
            requestedAt: timestamp,
          };

          return {
            enterpriseAccessRequests: existingPending
              ? state.enterpriseAccessRequests.map((request) =>
                  request.id === existingPending.id ? nextRequest : request,
                )
              : [nextRequest, ...state.enterpriseAccessRequests].slice(0, 12),
            auditLogs: appendAudit(state.auditLogs, {
              module: 'access',
              action: 'access-request',
              actor: nextRequest.contactName,
              target: nextRequest.email,
              summary: nextRequest.companyName,
            }),
          };
        }),
      approveEnterpriseAccessRequest: (requestId, actor = 'System') =>
        set((state) => {
          const request = state.enterpriseAccessRequests.find((item) => item.id === requestId);
          if (!request || request.status !== 'pending') return state;

          const timestamp = now();
          const enterpriseId = request.enterpriseId ?? nextEnterpriseId();
          const existingMember = state.members.find(
            (member) => member.email.toLowerCase() === request.email.toLowerCase(),
          );
          const approvedRequest: AdminEnterpriseAccessRequest = {
            ...request,
            status: 'approved',
            reviewedAt: timestamp,
            reviewedBy: actor,
            enterpriseId,
          };
          const enterpriseAdmin: AdminMember = {
            id: existingMember?.id ?? `member-enterprise-${Date.now()}`,
            enterpriseId,
            companyName: request.companyName,
            name: request.contactName || request.companyName,
            email: request.email,
            phone: request.phone,
            role: 'admin',
            roleName: '企业管理员',
            status: 'active',
            permissions: defaultPermissionsForRole('admin'),
            updatedAt: timestamp,
          };

          return {
            enterpriseAccessRequests: state.enterpriseAccessRequests.map((item) =>
              item.id === requestId ? approvedRequest : item,
            ),
            members: existingMember
              ? state.members.map((member) =>
                  member.id === existingMember.id ? { ...member, ...enterpriseAdmin } : member,
                )
              : [...state.members, enterpriseAdmin],
            approvalSettings: state.approvalSettings.some(
              (settings) => settings.enterpriseId === enterpriseId,
            )
              ? state.approvalSettings
              : [
                  ...state.approvalSettings,
                  {
                    enterpriseId,
                    defaultApproverMemberId: enterpriseAdmin.id,
                    orderReviewerMemberId: enterpriseAdmin.id,
                    deliveryOwnerMemberId: enterpriseAdmin.id,
                    paymentInvoiceOwnerMemberId: enterpriseAdmin.id,
                    logisticsOwnerMemberId: enterpriseAdmin.id,
                    requireBuyerOrderApproval: true,
                    requireQuoteOrderApproval: true,
                    amountThresholdCents: null,
                    updatedAt: timestamp,
                  },
                ],
            auditLogs: appendAudit(state.auditLogs, {
              module: 'access',
              action: 'access-approve',
              actor,
              target: request.email,
              summary: `${request.companyName} / ${enterpriseId}`,
            }),
          };
        }),
      rejectEnterpriseAccessRequest: (requestId, actor = 'System') =>
        set((state) => {
          const request = state.enterpriseAccessRequests.find((item) => item.id === requestId);
          if (!request || request.status !== 'pending') return state;

          return {
            enterpriseAccessRequests: state.enterpriseAccessRequests.map((item) =>
              item.id === requestId
                ? {
                    ...item,
                    status: 'rejected',
                    reviewedAt: now(),
                    reviewedBy: actor,
                  }
                : item,
            ),
            auditLogs: appendAudit(state.auditLogs, {
              module: 'access',
              action: 'access-reject',
              actor,
              target: request.email,
              summary: request.companyName,
            }),
          };
        }),
      updateEnterpriseProfile: (enterpriseId, companyName, actor = 'System') =>
        set((state) => {
          const nextCompanyName = companyName.trim();
          if (!nextCompanyName) return state;

          return {
            members: state.members.map((member) =>
              (member.enterpriseId ?? 'ENT-HITBOT-CUSTOMER') === enterpriseId
                ? {
                    ...member,
                    companyName: nextCompanyName,
                    updatedAt: now(),
                  }
                : member,
            ),
            auditLogs: appendAudit(state.auditLogs, {
              module: 'permissions',
              action: 'member-role',
              actor,
              target: enterpriseId,
              summary: nextCompanyName,
            }),
          };
        }),
      updateMemberProfile: (memberId, patch, actor = 'System') =>
        set((state) => {
          const currentMember = state.members.find((member) => member.id === memberId);
          if (!currentMember) return state;

          const nextName = patch.name?.trim();
          const nextEmail = patch.email?.trim().toLowerCase();
          const nextPhone = patch.phone?.trim();
          const nextRoleName = patch.roleName?.trim();
          const nextMember: AdminMember = {
            ...currentMember,
            name: nextName || currentMember.name,
            email: nextEmail || currentMember.email,
            phone: nextPhone === undefined ? currentMember.phone : nextPhone,
            roleName:
              currentMember.role === 'admin'
                ? currentMember.roleName
                : nextRoleName || currentMember.roleName,
            updatedAt: now(),
          };

          return {
            members: state.members.map((member) => (member.id === memberId ? nextMember : member)),
            auditLogs: appendAudit(state.auditLogs, {
              module: 'permissions',
              action: 'member-role',
              actor,
              target: memberId,
              summary: `${nextMember.name}:${nextMember.roleName ?? ''}`,
            }),
          };
        }),
      updateMemberRoleName: (memberId, roleName, actor = 'System') =>
        set((state) => ({
          members: state.members.map((member) =>
            member.id === memberId
              ? {
                  ...member,
                  roleName: member.role === 'admin' ? member.roleName : roleName.trim(),
                  updatedAt: now(),
                }
              : member,
          ),
          auditLogs: appendAudit(state.auditLogs, {
            module: 'permissions',
            action: 'member-role',
            actor,
            target: memberId,
            summary: `${memberId}:${roleName}`,
          }),
        })),
      toggleMemberPermission: (memberId, permission, actor = 'System') =>
        set((state) => ({
          members: state.members.map((member) =>
            member.id === memberId
              ? {
                  ...member,
                  permissions: member.permissions.includes(permission)
                    ? member.permissions.filter((item) => item !== permission)
                    : [...member.permissions, permission],
                  role:
                    member.role === 'admin'
                      ? 'admin'
                      : roleForPermissions(
                          member.permissions.includes(permission)
                            ? member.permissions.filter((item) => item !== permission)
                            : [...member.permissions, permission],
                        ),
                  updatedAt: now(),
                }
              : member,
          ),
          auditLogs: appendAudit(state.auditLogs, {
            module: 'permissions',
            action: 'member-permission',
            actor,
            target: memberId,
            summary: `${memberId}:${permission}`,
          }),
        })),
      deleteMember: (memberId, actor = 'System') =>
        set((state) => {
          const member = state.members.find((item) => item.id === memberId);
          if (!member || member.role === 'admin') return state;

          const clearDeletedOwner = (value?: string) => (value === memberId ? '' : value);

          return {
            members: state.members.filter((item) => item.id !== memberId),
            approvalSettings: state.approvalSettings.map((settings) => ({
              ...settings,
              defaultApproverMemberId: clearDeletedOwner(settings.defaultApproverMemberId) ?? '',
              orderReviewerMemberId: clearDeletedOwner(settings.orderReviewerMemberId),
              deliveryOwnerMemberId: clearDeletedOwner(settings.deliveryOwnerMemberId),
              paymentInvoiceOwnerMemberId: clearDeletedOwner(settings.paymentInvoiceOwnerMemberId),
              logisticsOwnerMemberId: clearDeletedOwner(settings.logisticsOwnerMemberId),
              updatedAt: now(),
            })),
            auditLogs: appendAudit(state.auditLogs, {
              module: 'permissions',
              action: 'member-permission',
              actor,
              target: memberId,
              summary: `delete:${member.email}`,
            }),
          };
        }),
      updateApprovalSettings: (enterpriseId, patch, actor = 'System') =>
        set((state) => {
          const current = approvalSettingsForEnterprise(
            state.approvalSettings,
            state.members,
            enterpriseId,
          );
          const nextSettings: AdminApprovalSettings = {
            ...current,
            ...patch,
            amountThresholdCents:
              patch.amountThresholdCents === undefined
                ? current.amountThresholdCents
                : patch.amountThresholdCents,
            updatedAt: now(),
          };

          return {
            approvalSettings: state.approvalSettings.some(
              (settings) => settings.enterpriseId === enterpriseId,
            )
              ? state.approvalSettings.map((settings) =>
                  settings.enterpriseId === enterpriseId ? nextSettings : settings,
                )
              : [...state.approvalSettings, nextSettings],
            auditLogs: appendAudit(state.auditLogs, {
              module: 'permissions',
              action: 'member-permission',
              actor,
              target: enterpriseId,
              summary: `approval-settings:${enterpriseId}`,
            }),
          };
        }),
      inviteMember: (input, actor = 'System') =>
        set((state) => {
          const timestamp = now();
          const normalizedEmail = input.email.trim().toLowerCase();
          const existingMember = state.members.find(
            (member) => member.email.toLowerCase() === normalizedEmail,
          );
          const memberId = existingMember?.id ?? `member-${Date.now()}`;
          const permissions = normalizePermissions(input.permissions);
          const nextMember: AdminMember = {
            id: memberId,
            enterpriseId: input.enterpriseId,
            companyName: input.companyName,
            name: input.name.trim(),
            email: normalizedEmail,
            phone: input.phone?.trim(),
            role: roleForPermissions(permissions),
            roleName: input.roleName.trim(),
            status: 'invited',
            permissions,
            updatedAt: timestamp,
          };

          return {
            members: existingMember
              ? state.members.map((member) =>
                  member.id === existingMember.id ? { ...member, ...nextMember } : member,
                )
              : [...state.members, nextMember],
            auditLogs: appendAudit(state.auditLogs, {
              module: 'permissions',
              action: 'member-invite',
              actor,
              target: memberId,
              summary: normalizedEmail,
            }),
          };
        }),
      inviteEngineer: (actor = 'System', enterprise) =>
        set((state) => {
          const invitedCount = state.members.filter((member) => member.status === 'invited').length;
          const nextIndex = invitedCount + 1;
          const timestamp = now();
          const memberId = `member-invited-${Date.now()}`;

          return {
            members: [
              ...state.members,
              {
                id: memberId,
                enterpriseId: enterprise?.enterpriseId,
                companyName: enterprise?.companyName,
                name: `工程师账号 ${nextIndex}`,
                email: `engineer${nextIndex}@example.com`,
                role: 'engineer',
                roleName: `项目成员 ${nextIndex}`,
                status: 'invited',
                permissions: [],
                updatedAt: timestamp,
              },
            ],
            auditLogs: appendAudit(state.auditLogs, {
              module: 'permissions',
              action: 'member-invite',
              actor,
              target: memberId,
              summary: `engineer${nextIndex}@example.com`,
            }),
          };
        }),
      activateMember: (memberId, actor = 'System') =>
        set((state) => ({
          members: state.members.map((member) =>
            member.id === memberId && member.status === 'invited'
              ? {
                  ...member,
                  status: 'active',
                  updatedAt: now(),
                }
              : member,
          ),
          auditLogs: appendAudit(state.auditLogs, {
            module: 'permissions',
            action: 'member-activate',
            actor,
            target: memberId,
            summary: memberId,
          }),
        })),
      appendAuditLog: (input) =>
        set((state) => ({
          auditLogs: appendAudit(state.auditLogs, input),
        })),
    }),
    {
      name: 'hitbot-admin-v1',
      storage: createJSONStorage(() => localStorage),
      merge: (persistedState, currentState) => {
        const persisted = (persistedState ?? {}) as Partial<AdminState>;
        const persistedRecords = persisted.productRecords ?? [];
        const enterpriseAccessRequests = persisted.enterpriseAccessRequests ?? [];
        const productRecords = defaultProductRecords.map((record) => ({
          ...record,
          ...persistedRecords.find((item) => item.productId === record.productId),
        }));
        const members = persisted.members?.length
          ? persisted.members.map((member) => {
              const defaultMember = defaultMembers.find((item) => item.id === member.id);
              const approvedAccessRequest = enterpriseAccessRequests.find(
                (request) =>
                  request.status === 'approved' &&
                  request.email.toLowerCase() === member.email.toLowerCase(),
              );

              const mergedRole = defaultMember?.role ?? member.role;
              const roleName =
                member.roleName ??
                defaultMember?.roleName ??
                (mergedRole === 'admin' ? '企业管理员' : member.name);

              return {
                ...member,
                name: member.name ?? defaultMember?.name,
                email: member.email ?? defaultMember?.email,
                role: mergedRole,
                roleName,
                status: member.status ?? defaultMember?.status,
                enterpriseId:
                  member.enterpriseId ??
                  approvedAccessRequest?.enterpriseId ??
                  defaultMember?.enterpriseId ??
                  'ENT-HITBOT-CUSTOMER',
                companyName:
                  defaultMember?.companyName ??
                  normalizeCompanyName(
                    member.companyName ?? approvedAccessRequest?.companyName,
                    '深圳智造装备有限公司',
                  ),
                phone: member.phone ?? defaultMember?.phone ?? approvedAccessRequest?.phone,
                permissions: normalizePermissions(member.permissions ?? defaultMember?.permissions),
              };
            })
          : defaultMembers;
        const knownEnterpriseIds = Array.from(
          new Set([
            ...members.map((member) => member.enterpriseId).filter(Boolean),
            ...defaultApprovalSettings.map((settings) => settings.enterpriseId),
          ]),
        ) as string[];
        const approvalSettings = knownEnterpriseIds.map((enterpriseId) => ({
          ...defaultApprovalSettingsForEnterprise(enterpriseId, members),
          ...defaultApprovalSettings.find((settings) => settings.enterpriseId === enterpriseId),
          ...persisted.approvalSettings?.find((settings) => settings.enterpriseId === enterpriseId),
        }));

        return {
          ...currentState,
          ...persisted,
          productRecords,
          members,
          approvalSettings,
          enterpriseAccessRequests,
          auditLogs: persisted.auditLogs ?? [],
        };
      },
    },
  ),
);
