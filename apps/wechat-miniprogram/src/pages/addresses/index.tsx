import { useState } from 'react';
import Taro from '@tarojs/taro';
import { Button, Input, Text, View } from '@tarojs/components';
import { useMiniStore } from '@/hooks/use-mini-store';
import { currentProfile, saveAddressProfile } from '@/services/store';
import './index.scss';

export default function AddressesPage() {
  const appState = useMiniStore();
  const profile = currentProfile();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    label: '新收货地址',
    recipient: profile?.contactName ?? '',
    phone: profile?.phone ?? '',
    province: '广东省',
    city: '深圳市',
    address: '',
  });

  async function submit() {
    if (saving) return;
    if (!form.recipient || !form.phone || !form.city || !form.address) {
      Taro.showToast({ title: '请补全地址', icon: 'none' });
      return;
    }
    setSaving(true);
    try {
      await saveAddressProfile({
        ...form,
        enterpriseId: profile?.enterpriseId,
        companyName: profile?.companyName,
      });
      setForm((current) => ({ ...current, address: '' }));
      Taro.showToast({ title: '地址已保存', icon: 'success' });
    } finally {
      setSaving(false);
    }
  }

  return (
    <View className="page profile-list-page">
      <View className="profile-list">
        {appState.addresses.map((address) => (
          <View key={address.id} className="surface profile-row">
            <View>
              <Text className="row-title">{address.label}</Text>
              <Text className="row-body">{address.recipient} · {address.phone}</Text>
              <Text className="row-body">{address.province} {address.city} {address.address}</Text>
            </View>
            <Text className="tag">常用</Text>
          </View>
        ))}
        {appState.addresses.length === 0 && (
          <View className="surface empty-profile">
            <Text className="row-title">暂无收货地址</Text>
            <Text className="row-body">新增地址后，提交购物车时可以直接选择。</Text>
          </View>
        )}
      </View>

      <View className="surface form-card">
        <Text className="section-title">新增地址</Text>
        <Field label="标签" value={form.label} onInput={(value) => setForm((current) => ({ ...current, label: value }))} />
        <Field label="收货人" value={form.recipient} onInput={(value) => setForm((current) => ({ ...current, recipient: value }))} />
        <Field label="手机号" value={form.phone} onInput={(value) => setForm((current) => ({ ...current, phone: value }))} />
        <Field label="省份" value={form.province} onInput={(value) => setForm((current) => ({ ...current, province: value }))} />
        <Field label="城市" value={form.city} onInput={(value) => setForm((current) => ({ ...current, city: value }))} />
        <Field label="详细地址" value={form.address} onInput={(value) => setForm((current) => ({ ...current, address: value }))} />
        <Button className="primary-button" disabled={saving} onClick={submit}>
          {saving ? '保存中' : '保存地址'}
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
