'use client';

import { useEffect, useMemo, useState } from 'react';
import type React from 'react';
import { Ban, Check, Copy, Link2, RefreshCcw, Save, ShieldCheck, UsersRound } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { organizationInvitationAvailability, useAdminStore } from '@/lib/admin-store';
import { useProcurementStore } from '@/lib/procurement-store';
import type { AdminMember, AdminOrganizationInvitation, AdminPermission } from '@/types/admin';
import { OrganizationPermissionToggle } from './organization-permission-toggle';

function toDateTimeLocal(date: Date) {
  const offset = date.getTimezoneOffset() * 60_000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 16);
}

function defaultExpiration() {
  return toDateTimeLocal(new Date(Date.now() + 4 * 60 * 60_000));
}

function formatDateTime(value: string, locale: string) {
  return new Intl.DateTimeFormat(locale === 'zh' ? 'zh-CN' : 'en-US', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value));
}

function invitationLink(locale: string, token: string) {
  const path = `/${locale}/join/${encodeURIComponent(token)}`;
  return typeof window === 'undefined' ? path : `${window.location.origin}${path}`;
}

function invitationVariant(status: ReturnType<typeof organizationInvitationAvailability>) {
  if (status === 'active') return 'in-stock' as const;
  if (status === 'revoked') return 'error' as const;
  return 'secondary' as const;
}

export function OrganizationMembersPanel() {
  const t = useTranslations('Account');
  const locale = useLocale();
  const profile = useProcurementStore((state) => state.profile);
  const members = useAdminStore((state) => state.members);
  const invitations = useAdminStore((state) => state.organizationInvitations);
  const createInvitation = useAdminStore((state) => state.createOrganizationInvitation);
  const revokeInvitation = useAdminStore((state) => state.revokeOrganizationInvitation);
  const enterpriseMembers = useMemo(
    () => members.filter((member) => member.enterpriseId === profile.enterpriseId),
    [members, profile.enterpriseId],
  );
  const enterpriseInvitations = useMemo(
    () =>
      invitations
        .filter((invitation) => invitation.enterpriseId === profile.enterpriseId)
        .sort((left, right) => Date.parse(right.createdAt) - Date.parse(left.createdAt)),
    [invitations, profile.enterpriseId],
  );
  const [expiresAt, setExpiresAt] = useState(defaultExpiration);
  const [maxUses, setMaxUses] = useState('');
  const [roleName, setRoleName] = useState(() => t('invitationRoleInitial'));
  const [permissions, setPermissions] = useState<AdminPermission[]>([]);
  const [createdToken, setCreatedToken] = useState('');
  const [copyStatus, setCopyStatus] = useState('');

  const durationLabel = useMemo(() => {
    const milliseconds = Date.parse(expiresAt) - Date.now();
    if (!Number.isFinite(milliseconds) || milliseconds <= 0) return t('durationExpired');
    const totalMinutes = Math.max(1, Math.round(milliseconds / 60_000));
    const days = Math.floor(totalMinutes / 1440);
    const hours = Math.floor((totalMinutes % 1440) / 60);
    const minutes = totalMinutes % 60;
    if (days > 0) return t('durationDaysHours', { days, hours });
    if (hours > 0) return t('durationHoursMinutes', { hours, minutes });
    return t('durationMinutes', { minutes });
  }, [expiresAt, t]);

  function create(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const expiresAtTimestamp = Date.parse(expiresAt);
    const numericMaxUses = Number(maxUses);
    if (!Number.isFinite(expiresAtTimestamp) || expiresAtTimestamp <= Date.now()) return;
    const invitation = createInvitation(
      {
        enterpriseId: profile.enterpriseId,
        companyName: profile.companyName,
        expiresAt: new Date(expiresAtTimestamp).toISOString(),
        maxUses:
          maxUses.trim() && Number.isFinite(numericMaxUses)
            ? Math.max(1, Math.floor(numericMaxUses))
            : null,
        roleName,
        permissions,
      },
      profile.contactName,
    );
    if (!invitation) return;
    setCreatedToken(invitation.token);
    setCopyStatus('');
    setExpiresAt(defaultExpiration());
  }

  async function copyLink(invitation: AdminOrganizationInvitation) {
    try {
      await navigator.clipboard.writeText(invitationLink(locale, invitation.token));
      setCopyStatus(t('invitationLinkCopied'));
    } catch {
      setCopyStatus(t('invitationLinkCopyFailed'));
    }
  }

  const createdInvitation = enterpriseInvitations.find(
    (invitation) => invitation.token === createdToken,
  );

  return (
    <section className="bg-bg-elevated rounded-lg p-4 md:p-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-3">
          <UsersRound className="text-brand-500 mt-1 size-5 shrink-0" />
          <div>
            <h2 className="text-text-strong text-xl font-semibold">{t('settingsAdminTitle')}</h2>
            <p className="text-text-muted mt-1.5 max-w-3xl text-sm leading-6">
              {t('memberInvitationHint')}
            </p>
          </div>
        </div>
        <Badge variant="in-stock">{t('adminOnly')}</Badge>
      </div>

      <div className="border-divider mt-6 grid gap-6 border-t pt-6 xl:grid-cols-[minmax(320px,0.9fr)_minmax(0,1.1fr)]">
        <form onSubmit={create}>
          <div className="flex items-center gap-2">
            <Link2 className="text-brand-500 size-4" />
            <h3 className="text-text-strong font-semibold">{t('createInvitationTitle')}</h3>
          </div>
          <p className="text-text-muted mt-1.5 text-sm leading-6">{t('createInvitationHint')}</p>

          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <label>
              <span className="text-text-muted mb-1.5 block text-sm">
                {t('invitationExpiresAt')}
              </span>
              <Input
                type="datetime-local"
                value={expiresAt}
                min={toDateTimeLocal(new Date(Date.now() + 60_000))}
                onChange={(event) => setExpiresAt(event.target.value)}
              />
              <span className="text-text-muted mt-1.5 block text-xs tabular-nums">
                {t('invitationDurationPreview', { duration: durationLabel })}
              </span>
            </label>
            <label>
              <span className="text-text-muted mb-1.5 block text-sm">{t('invitationMaxUses')}</span>
              <Input
                type="number"
                min="1"
                step="1"
                value={maxUses}
                placeholder={t('invitationUnlimited')}
                onChange={(event) => setMaxUses(event.target.value)}
              />
            </label>
            <label className="sm:col-span-2">
              <span className="text-text-muted mb-1.5 block text-sm">{t('memberRoleName')}</span>
              <Input
                value={roleName}
                maxLength={80}
                placeholder={t('memberRoleNamePlaceholder')}
                onChange={(event) => setRoleName(event.target.value)}
              />
            </label>
          </div>
          <div className="mt-4">
            <span className="text-text-muted mb-2 block text-sm">{t('memberPermissions')}</span>
            <OrganizationPermissionToggle permissions={permissions} onChange={setPermissions} />
          </div>
          <Button
            type="submit"
            variant="primary"
            className="mt-5 w-full sm:w-auto"
            disabled={!expiresAt || !roleName.trim() || Date.parse(expiresAt) <= Date.now()}
          >
            <Link2 className="size-4" />
            <span>{t('createInvitation')}</span>
          </Button>

          {createdInvitation && (
            <div className="bg-bg-control mt-5 rounded-md p-4">
              <div className="flex items-center gap-2">
                <Check className="text-state-green-strong size-4" />
                <p className="text-text-strong text-sm font-semibold">{t('invitationLinkReady')}</p>
              </div>
              <label className="mt-3 block">
                <span className="text-text-muted mb-1.5 block text-xs">
                  {t('invitationLinkLabel')}
                </span>
                <Input value={invitationLink(locale, createdInvitation.token)} readOnly />
              </label>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                className="mt-3"
                onClick={() => copyLink(createdInvitation)}
              >
                <Copy className="size-4" />
                <span>{t('copyInvitationLink')}</span>
              </Button>
              {copyStatus && (
                <p className="text-text-muted mt-2 text-xs" role="status">
                  {copyStatus}
                </p>
              )}
            </div>
          )}
        </form>

        <section className="min-w-0">
          <div className="flex items-center justify-between gap-3">
            <h3 className="text-text-strong font-semibold">{t('activeInvitations')}</h3>
            <Badge variant="secondary">
              {t('invitationCount', { count: enterpriseInvitations.length })}
            </Badge>
          </div>
          {enterpriseInvitations.length === 0 ? (
            <div className="mt-6 py-8 text-center">
              <Link2 className="text-text-muted mx-auto size-7" />
              <p className="text-text-muted mt-3 text-sm leading-6">{t('noInvitations')}</p>
            </div>
          ) : (
            <div className="mt-3 grid gap-1">
              {enterpriseInvitations.slice(0, 8).map((invitation) => {
                const status = organizationInvitationAvailability(invitation);
                return (
                  <article
                    key={invitation.id}
                    className="border-divider min-w-0 border-b py-4 last:border-0"
                  >
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="text-text-strong font-medium">{invitation.roleName}</p>
                          <Badge variant={invitationVariant(status)}>
                            {t(`invitationStatus.${status}`)}
                          </Badge>
                        </div>
                        <p className="text-text-muted mt-1.5 text-xs leading-5 tabular-nums">
                          {t('invitationUsage', {
                            used: invitation.joinedUses,
                            max: invitation.maxUses ?? t('unlimitedShort'),
                          })}
                          {' · '}
                          {t('invitationExpires', {
                            time: formatDateTime(invitation.expiresAt, locale),
                          })}
                        </p>
                        <p className="text-text-muted mt-1 truncate text-xs">
                          {t('permissionCount', { count: invitation.permissions.length })}
                        </p>
                      </div>
                      <div className="flex shrink-0 gap-2">
                        <Button
                          type="button"
                          variant="secondary"
                          size="sm"
                          disabled={status !== 'active'}
                          onClick={() => copyLink(invitation)}
                        >
                          <Copy className="size-4" />
                          <span>{t('copyLinkShort')}</span>
                        </Button>
                        <Button
                          type="button"
                          variant="secondary"
                          size="sm"
                          disabled={status !== 'active'}
                          onClick={() => revokeInvitation(invitation.id, profile.contactName)}
                        >
                          <Ban className="size-4" />
                          <span>{t('revokeInvitation')}</span>
                        </Button>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>
      </div>

      <div className="border-divider mt-7 border-t pt-6">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h3 className="text-text-strong font-semibold">{t('joinedMembers')}</h3>
            <p className="text-text-muted mt-1 text-sm">{t('joinedMembersHint')}</p>
          </div>
          <Badge variant="secondary">{t('memberCount', { count: enterpriseMembers.length })}</Badge>
        </div>
        <div className="mt-4 grid gap-3">
          {enterpriseMembers.map((member) => (
            <MemberRow
              key={member.id}
              member={member}
              currentEmail={profile.email}
              actor={profile.contactName}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

function MemberRow({
  member,
  currentEmail,
  actor,
}: {
  member: AdminMember;
  currentEmail: string;
  actor: string;
}) {
  const t = useTranslations('Account');
  const updateMemberRoleName = useAdminStore((state) => state.updateMemberRoleName);
  const toggleMemberPermission = useAdminStore((state) => state.toggleMemberPermission);
  const setMemberStatus = useAdminStore((state) => state.setMemberStatus);
  const [roleName, setRoleName] = useState(member.roleName ?? '');
  const [permissions, setPermissions] = useState<AdminPermission[]>(member.permissions);
  const [confirmSuspend, setConfirmSuspend] = useState(false);
  const [feedback, setFeedback] = useState('');
  const isCurrentMember = currentEmail.toLowerCase() === member.email.toLowerCase();
  const isAdmin = member.role === 'admin';
  const dirty =
    roleName.trim() !== (member.roleName ?? '') ||
    permissions.some((permission) => !member.permissions.includes(permission)) ||
    member.permissions.some((permission) => !permissions.includes(permission));

  useEffect(() => {
    setRoleName(member.roleName ?? '');
    setPermissions(member.permissions);
  }, [member]);

  function save() {
    if (!isAdmin && !roleName.trim()) return;
    if (!isAdmin && roleName.trim() !== (member.roleName ?? '')) {
      updateMemberRoleName(member.id, roleName, actor);
    }
    (['orders', 'invoices', 'permissions'] as AdminPermission[]).forEach((permission) => {
      if (permissions.includes(permission) !== member.permissions.includes(permission)) {
        toggleMemberPermission(member.id, permission, actor);
      }
    });
    setFeedback(t('memberSaved'));
  }

  function changeStatus(status: 'active' | 'suspended') {
    const changed = setMemberStatus(member.id, status, actor);
    setFeedback(
      changed
        ? t(status === 'active' ? 'memberRestored' : 'memberSuspended')
        : t('memberStatusBlocked'),
    );
    setConfirmSuspend(false);
  }

  const showEmail = !member.email.endsWith('@phone.hitbot.local');

  return (
    <article className="bg-bg-surface min-w-0 rounded-lg p-4">
      <div className="grid gap-4 xl:grid-cols-[minmax(220px,0.75fr)_minmax(320px,1.25fr)_auto] xl:items-start">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-text-strong truncate font-medium">{member.name}</p>
            {isCurrentMember && <Badge variant="standard">{t('memberActive')}</Badge>}
          </div>
          {member.phone && <p className="text-text-muted mt-1.5 text-sm">{member.phone}</p>}
          {showEmail && <p className="text-text-muted mt-1 truncate text-sm">{member.email}</p>}
          <Badge className="mt-2" variant={member.status === 'active' ? 'in-stock' : 'secondary'}>
            {t(`memberStatus.${member.status}`)}
          </Badge>
        </div>

        <div className="grid gap-4 sm:grid-cols-[minmax(180px,0.8fr)_minmax(220px,1.2fr)]">
          <label>
            <span className="text-text-muted mb-1.5 block text-xs">{t('memberRoleName')}</span>
            <Input
              value={roleName}
              maxLength={80}
              disabled={isAdmin}
              onChange={(event) => {
                setRoleName(event.target.value);
                setFeedback('');
              }}
            />
          </label>
          <div>
            <span className="text-text-muted mb-2 block text-xs">{t('memberPermissions')}</span>
            <OrganizationPermissionToggle
              permissions={permissions}
              disabled={isAdmin}
              onChange={(nextPermissions) => {
                setPermissions(nextPermissions);
                setFeedback('');
              }}
            />
          </div>
        </div>

        <div className="flex flex-wrap gap-2 xl:justify-end">
          <Button
            type="button"
            variant="secondary"
            size="sm"
            disabled={!dirty || (!isAdmin && !roleName.trim())}
            onClick={save}
          >
            <Save className="size-4" />
            <span>{t('saveMemberProfile')}</span>
          </Button>
          {member.status === 'suspended' ? (
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => changeStatus('active')}
            >
              <RefreshCcw className="size-4" />
              <span>{t('restoreMember')}</span>
            </Button>
          ) : confirmSuspend ? (
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                variant="primary"
                size="sm"
                onClick={() => changeStatus('suspended')}
              >
                <ShieldCheck className="size-4" />
                <span>{t('confirmSuspendMember')}</span>
              </Button>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => setConfirmSuspend(false)}
              >
                {t('cancel')}
              </Button>
            </div>
          ) : (
            <Button
              type="button"
              variant="secondary"
              size="sm"
              disabled={isCurrentMember}
              onClick={() => setConfirmSuspend(true)}
            >
              <Ban className="size-4" />
              <span>{t('suspendMember')}</span>
            </Button>
          )}
        </div>
      </div>
      {feedback && (
        <p className="text-text-muted mt-3 text-xs" role="status">
          {feedback}
        </p>
      )}
    </article>
  );
}
