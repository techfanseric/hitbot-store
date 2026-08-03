'use client';

import { useEffect, useState } from 'react';
import { Building2, Save } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAdminStore } from '@/lib/admin-store';
import { useProcurementStore } from '@/lib/procurement-store';

export function EnterpriseSettingsPanel() {
  const t = useTranslations('Account');
  const profile = useProcurementStore((state) => state.profile);
  const updateProfile = useProcurementStore((state) => state.updateProfile);
  const updateEnterpriseProfile = useAdminStore((state) => state.updateEnterpriseProfile);
  const [companyName, setCompanyName] = useState(profile.companyName);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setCompanyName(profile.companyName);
  }, [profile.companyName]);

  function save() {
    const nextCompanyName = companyName.trim();
    if (nextCompanyName && nextCompanyName !== profile.companyName) {
      updateEnterpriseProfile(profile.enterpriseId, nextCompanyName, profile.contactName);
      updateProfile({ companyName: nextCompanyName });
    }
    setSaved(true);
  }

  return (
    <section className="bg-bg-elevated rounded-lg p-4 md:p-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-3">
          <Building2 className="text-brand-500 mt-1 size-5 shrink-0" />
          <div>
            <h2 className="text-text-strong text-xl font-semibold">
              {t('enterpriseSettingsTitle')}
            </h2>
            <p className="text-text-muted mt-1.5 max-w-3xl text-sm leading-6">
              {t('enterpriseSettingsHint')}
            </p>
          </div>
        </div>
        <Badge variant="in-stock">{t('adminOnly')}</Badge>
      </div>

      <div className="border-divider mt-6 border-t pt-6">
        <div className="flex items-center gap-2">
          <Building2 className="text-brand-500 size-4" />
          <h3 className="text-text-strong font-semibold">{t('enterpriseProfileTitle')}</h3>
        </div>
        <div className="mt-4 grid max-w-3xl gap-4 sm:grid-cols-2">
          <label>
            <span className="text-text-muted mb-1.5 block text-sm">{t('companyName')}</span>
            <Input
              value={companyName}
              maxLength={120}
              onChange={(event) => {
                setCompanyName(event.target.value);
                setSaved(false);
              }}
            />
          </label>
          <label>
            <span className="text-text-muted mb-1.5 block text-sm">{t('enterpriseId')}</span>
            <Input value={profile.enterpriseId} disabled />
          </label>
        </div>
      </div>

      <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-end">
        {saved && (
          <span className="text-state-green-strong text-sm" role="status">
            {t('settingsSaved')}
          </span>
        )}
        <Button type="button" variant="primary" disabled={!companyName.trim()} onClick={save}>
          <Save className="size-4" />
          <span>{t('saveEnterpriseSettings')}</span>
        </Button>
      </div>
    </section>
  );
}
