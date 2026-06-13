import { useState } from 'react';
import Taro from '@tarojs/taro';
import { Button, Input, Text, View } from '@tarojs/components';
import { useMiniStore } from '@/hooks/use-mini-store';
import { currentProfile, saveInvoiceProfile } from '@/services/store';
import '../addresses/index.scss';

export default function InvoicesPage() {
  const appState = useMiniStore();
  const profile = currentProfile();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    label: '新发票抬头',
    title: profile?.companyName ?? '',
    taxId: '',
    bankAccount: '',
  });

  async function submit() {
    if (saving) return;
    if (!form.title || !form.taxId || !form.bankAccount) {
      Taro.showToast({ title: '请补全发票资料', icon: 'none' });
      return;
    }
    setSaving(true);
    try {
      await saveInvoiceProfile({
        ...form,
        enterpriseId: profile?.enterpriseId,
        companyName: profile?.companyName,
      });
      setForm((current) => ({ ...current, taxId: '', bankAccount: '' }));
      Taro.showToast({ title: '发票抬头已保存', icon: 'success' });
    } finally {
      setSaving(false);
    }
  }

  return (
    <View className="page profile-list-page">
      <View className="profile-list">
        {appState.invoices.map((invoice) => (
          <View key={invoice.id} className="surface profile-row">
            <View>
              <Text className="row-title">{invoice.label}</Text>
              <Text className="row-body">{invoice.title}</Text>
              <Text className="row-body">{invoice.taxId}</Text>
              <Text className="row-body">{invoice.bankAccount}</Text>
            </View>
            <Text className="tag tag-red">对公</Text>
          </View>
        ))}
        {appState.invoices.length === 0 && (
          <View className="surface empty-profile">
            <Text className="row-title">暂无发票抬头</Text>
            <Text className="row-body">新增后可在提交购物车时选择。</Text>
          </View>
        )}
      </View>

      <View className="surface form-card">
        <Text className="section-title">新增抬头</Text>
        <Field label="标签" value={form.label} onInput={(value) => setForm((current) => ({ ...current, label: value }))} />
        <Field label="发票抬头" value={form.title} onInput={(value) => setForm((current) => ({ ...current, title: value }))} />
        <Field label="税号" value={form.taxId} onInput={(value) => setForm((current) => ({ ...current, taxId: value }))} />
        <Field label="开户行及账号" value={form.bankAccount} onInput={(value) => setForm((current) => ({ ...current, bankAccount: value }))} />
        <Button className="primary-button" disabled={saving} onClick={submit}>
          {saving ? '保存中' : '保存抬头'}
        </Button>
      </View>
    </View>
  );
}

function Field({
  label,
  value,
  onInput,
}: {
  label: string;
  value: string;
  onInput: (value: string) => void;
}) {
  return (
    <View className="field">
      <Text className="field-label">{label}</Text>
      <Input value={value} onInput={(event) => onInput(String(event.detail.value))} />
    </View>
  );
}
