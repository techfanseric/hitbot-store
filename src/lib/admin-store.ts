'use client';

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { products } from '@/mock-data';
import type {
  AdminAuditAction,
  AdminAuditLog,
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

interface AdminState {
  productRecords: AdminProductRecord[];
  members: AdminMember[];
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
  updateMemberRoleName: (memberId: string, roleName: string, actor?: string) => void;
  toggleMemberPermission: (memberId: string, permission: AdminPermission, actor?: string) => void;
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
    name: '企业管理员',
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
    name: '采购负责人',
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
    name: '方案工程师',
    email: 'engineer@customer.example',
    phone: '17701551867',
    role: 'engineer',
    roleName: '方案工程师',
    status: 'active',
    permissions: defaultPermissionsForRole('engineer'),
    updatedAt: '2026-06-01T00:00:00.000Z',
  },
];

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
                (mergedRole === 'admin' ? '企业管理员' : (defaultMember?.name ?? member.name));

              return {
                ...member,
                name: defaultMember?.name ?? member.name,
                email: defaultMember?.email ?? member.email,
                role: mergedRole,
                roleName,
                status: defaultMember?.status ?? member.status,
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
                phone: defaultMember?.phone ?? member.phone ?? approvedAccessRequest?.phone,
                permissions: normalizePermissions(member.permissions ?? defaultMember?.permissions),
              };
            })
          : defaultMembers;

        return {
          ...currentState,
          ...persisted,
          productRecords,
          members,
          enterpriseAccessRequests,
          auditLogs: persisted.auditLogs ?? [],
        };
      },
    },
  ),
);
