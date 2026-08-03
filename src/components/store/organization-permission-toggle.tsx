'use client';

import { useTranslations } from 'next-intl';
import type { AdminPermission } from '@/types/admin';

const permissionOptions: AdminPermission[] = ['orders', 'invoices', 'permissions'];

export function OrganizationPermissionToggle({
  permissions,
  disabled = false,
  onChange,
}: {
  permissions: AdminPermission[];
  disabled?: boolean;
  onChange: (permissions: AdminPermission[]) => void;
}) {
  const t = useTranslations('Account');

  return (
    <div className="flex flex-wrap gap-2">
      {permissionOptions.map((permission) => {
        const selected = permissions.includes(permission);
        return (
          <button
            key={permission}
            type="button"
            aria-pressed={selected}
            disabled={disabled}
            onClick={() =>
              onChange(
                selected
                  ? permissions.filter((item) => item !== permission)
                  : [...permissions, permission],
              )
            }
            className={`min-h-9 rounded-sm px-3 py-1.5 text-sm transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
              selected
                ? 'bg-text-strong text-bg-elevated font-semibold'
                : 'bg-bg-control text-text-muted hover:text-text'
            }`}
          >
            {t(`permission.${permission}`)}
          </button>
        );
      })}
    </div>
  );
}
