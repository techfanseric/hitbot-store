import { useState } from 'react';
import Taro from '@tarojs/taro';
import { Button, Input, Text, View } from '@tarojs/components';
import { defaultProfile } from '@hitbot/domain';
import { useMiniStore } from '@/hooks/use-mini-store';
import { loginAndBindEnterprise, signOutEnterprise } from '@/services/store';
import './index.scss';

export default function AccountPage() {
  const appState = useMiniStore();
  const profile = appState.session?.profile ?? defaultProfile;
  const [phone, setPhone] = useState(profile.phone);
  const [inviteCode, setInviteCode] = useState('');
  const [binding, setBinding] = useState(false);
  const [bindingOpen, setBindingOpen] = useState(!appState.session?.bound);
  const pendingOrders = appState.orders.filter((order) =>
    ['pending-quote', 'pending-approval', 'pending-payment'].includes(order.status),
  ).length;

  async function handleBind() {
    if (binding) return;
    setBinding(true);
    try {
      await loginAndBindEnterprise({ phone, inviteCode });
      Taro.showToast({ title: '企业账号已绑定', icon: 'success' });
    } finally {
      setBinding(false);
    }
  }

  function handleSignOut() {
    signOutEnterprise();
    Taro.showToast({ title: '已退出企业账号', icon: 'success' });
  }

  return (
    <View className="page account-page">
      <View className="surface profile-card">
        <View className="avatar">
          <Text>H</Text>
        </View>
        <View className="profile-main">
          <View className="profile-head">
            <Text className="company">{profile.companyName}</Text>
            <Text className={appState.session?.bound ? 'status-badge bound' : 'status-badge'}>
              {appState.session?.bound ? '已绑定' : '待绑定'}
            </Text>
          </View>
          <Text className="person">{profile.contactName} · {roleLabel(profile.role)}</Text>
          <Text className="hint">{profile.email}</Text>
        </View>
        <View className="profile-stats">
          <Metric value={String(pendingOrders)} label="待办" />
          <Metric value={String(appState.addresses.length)} label="地址" />
          <Metric value={String(appState.invoices.length)} label="发票" />
        </View>
      </View>

      <View className="surface menu-list">
        <MenuItem
          label="订单"
          title="订单中心"
          meta={`${pendingOrders} 个待办`}
          onClick={() => Taro.switchTab({ url: '/pages/orders/index' })}
        />
        <MenuItem
          label="地址"
          title="地址簿"
          meta={`${appState.addresses.length} 个`}
          onClick={() => Taro.navigateTo({ url: '/pages/addresses/index' })}
        />
        <MenuItem
          label="发票"
          title="发票抬头"
          meta={`${appState.invoices.length} 个`}
          onClick={() => Taro.navigateTo({ url: '/pages/invoices/index' })}
        />
      </View>

      <View className="surface bind-card">
        <View className="bind-head" onClick={() => setBindingOpen((value) => !value)}>
          <View>
            <Text className="section-title">企业账号</Text>
            <Text className="section-body">
              {appState.session?.bound ? '可切换或退出当前企业身份' : '绑定后可提交采购和处理订单'}
            </Text>
          </View>
          <Text className="bind-toggle">{bindingOpen ? '收起' : '管理'}</Text>
        </View>
        {bindingOpen && (
          <View className="bind-form">
            <View className="field">
              <Text className="field-label">手机号</Text>
              <Input
                value={phone}
                type="number"
                placeholder="输入企业成员手机号"
                onInput={(event) => setPhone(String(event.detail.value))}
              />
            </View>
            <View className="field">
              <Text className="field-label">企业邀请码</Text>
              <Input
                value={inviteCode}
                placeholder="可选，填写企业邀请码"
                onInput={(event) => setInviteCode(String(event.detail.value))}
              />
            </View>
            <Button className="primary-button" disabled={binding} onClick={handleBind}>
              {binding ? '绑定中' : appState.session?.bound ? '切换企业' : '绑定企业账号'}
            </Button>
            {appState.session?.bound && (
              <Button className="secondary-button" onClick={handleSignOut}>
                退出企业账号
              </Button>
            )}
          </View>
        )}
      </View>

      <View className="surface support-card">
        <MenuItem
          label="权限"
          title="成员与权限"
          meta={roleLabel(profile.role)}
        />
        <MenuItem
          label="销售"
          title="联系销售"
          meta="询价与项目支持"
          />
      </View>
    </View>
  );
}

function Metric({ value, label }: { value: string; label: string }) {
  return (
    <View className="metric">
      <Text className="metric-value">{value}</Text>
      <Text className="metric-label">{label}</Text>
    </View>
  );
}

function MenuItem({
  label,
  title,
  meta,
  onClick,
}: {
  label: string;
  title: string;
  meta: string;
  onClick?: () => void;
}) {
  return (
    <View className={onClick ? 'menu-item actionable' : 'menu-item'} onClick={onClick}>
      <Text className="menu-label">{label}</Text>
      <View className="menu-copy">
        <Text className="menu-title">{title}</Text>
      </View>
      <Text className="menu-meta">{meta}</Text>
      {onClick && <Text className="menu-arrow">›</Text>}
    </View>
  );
}

function roleLabel(role: string) {
  return {
    admin: '管理员',
    buyer: '采购',
    engineer: '工程师',
  }[role] ?? role;
}
