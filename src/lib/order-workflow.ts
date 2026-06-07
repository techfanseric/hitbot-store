import type { AdminApprovalSettings, AdminMember } from '@/types/admin';
import type { EnterpriseProfile } from '@/types/procurement';

export type OrderWorkflowRole = 'review' | 'delivery' | 'paymentInvoice' | 'logistics';

const workflowOwnerField: Record<OrderWorkflowRole, keyof AdminApprovalSettings> = {
  review: 'orderReviewerMemberId',
  delivery: 'deliveryOwnerMemberId',
  paymentInvoice: 'paymentInvoiceOwnerMemberId',
  logistics: 'logisticsOwnerMemberId',
};

export function enterpriseMembers(members: AdminMember[], enterpriseId: string) {
  return members.filter(
    (member) => member.enterpriseId === enterpriseId && member.status === 'active',
  );
}

export function currentMemberForProfile(members: AdminMember[], profile: EnterpriseProfile) {
  const normalizedEmail = profile.email.toLowerCase();
  return (
    enterpriseMembers(members, profile.enterpriseId).find(
      (member) => member.email.toLowerCase() === normalizedEmail,
    ) ??
    members.find(
      (member) => member.status === 'active' && member.email.toLowerCase() === normalizedEmail,
    )
  );
}

export function workflowOwner(
  settings: AdminApprovalSettings,
  members: AdminMember[],
  role: OrderWorkflowRole,
) {
  const activeMembers = enterpriseMembers(members, settings.enterpriseId);
  const fallbackMembers = activeMembers.length
    ? activeMembers
    : members.filter((member) => member.status === 'active');
  const configuredId = settings[workflowOwnerField[role]];
  const configuredOwner = fallbackMembers.find((member) => member.id === configuredId);
  if (configuredOwner) return configuredOwner;

  if (role === 'logistics') {
    return (
      fallbackMembers.find((member) => member.role === 'engineer') ??
      fallbackMembers.find((member) => member.role === 'buyer') ??
      fallbackMembers[0]
    );
  }

  return fallbackMembers.find((member) => member.role === 'buyer') ?? fallbackMembers[0];
}

export function workflowOwnerName(
  settings: AdminApprovalSettings,
  members: AdminMember[],
  role: OrderWorkflowRole,
  fallback: string,
) {
  return workflowOwner(settings, members, role)?.name ?? fallback;
}

export function canHandleWorkflowRole(
  profile: EnterpriseProfile,
  settings: AdminApprovalSettings,
  members: AdminMember[],
  role: OrderWorkflowRole,
) {
  if (profile.role === 'admin') return true;
  const currentMember = currentMemberForProfile(members, profile);
  const owner = workflowOwner(settings, members, role);

  return Boolean(currentMember && owner && currentMember.id === owner.id);
}
