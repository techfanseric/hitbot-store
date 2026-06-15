import { useEffect, useMemo, useState } from 'react';
import Taro from '@tarojs/taro';
import { Button, Input, Text, View } from '@tarojs/components';
import type { LocalOsHandoff } from '@hitbot/domain';
import { useMiniStore } from '@/hooks/use-mini-store';
import {
  acceptMiniHandoff,
  currentEnterpriseProfile,
  getMiniOrderTodoCounts,
  hasEnterpriseSession,
  loginEnterpriseMember,
  miniRolePermissionSummary,
  selectMiniEnterpriseAddresses,
  selectMiniEnterpriseHandoffs,
  selectMiniEnterpriseInvoices,
  selectMiniEnterpriseOrders,
  signOutEnterprise,
} from '@/services/store';
import './index.scss';

export default function AccountPage() {
  const appState = useMiniStore();
  const hasSession = hasEnterpriseSession(appState);
  const profile = currentEnterpriseProfile(appState);
  const enterpriseOrders = useMemo(() => selectMiniEnterpriseOrders(appState), [appState]);
  const handoffs = useMemo(() => selectMiniEnterpriseHandoffs(appState), [appState]);
  const activeHandoffs = useMemo(
    () => handoffs.filter((handoff) => handoff.status !== 'submitted'),
    [handoffs],
  );
  const addresses = useMemo(() => selectMiniEnterpriseAddresses(appState), [appState]);
  const invoices = useMemo(() => selectMiniEnterpriseInvoices(appState), [appState]);
  const todoCounts = useMemo(() => getMiniOrderTodoCounts(appState), [appState]);
  const navMetrics = useMemo(() => getAccountNavMetrics(), []);
  const [account, setAccount] = useState(profile?.email ?? '');
  const [password, setPassword] = useState('');
  const [loggingIn, setLoggingIn] = useState(false);
  const [loginOpen, setLoginOpen] = useState(!hasSession);

  useEffect(() => {
    if (!hasSession) {
      setLoginOpen(true);
      return;
    }

    if (profile?.email) {
      setAccount(profile.email);
    }
  }, [hasSession, profile?.email]);

  async function handleLogin() {
    if (loggingIn) return;
    const trimmedAccount = account.trim();
    const trimmedPassword = password.trim();

    if (!trimmedAccount || !trimmedPassword) {
      Taro.showToast({ title: '请输入账号和密码', icon: 'none' });
      return;
    }

    setLoggingIn(true);
    try {
      await loginEnterpriseMember({ account: trimmedAccount, password: trimmedPassword });
      setLoginOpen(false);
      setPassword('');
      Taro.showToast({ title: '已进入企业账号', icon: 'success' });
    } catch (error) {
      Taro.showToast({ title: loginErrorTitle(error), icon: 'none' });
    } finally {
      setLoggingIn(false);
    }
  }

  function handleSignOut() {
    signOutEnterprise();
    setPassword('');
    Taro.showToast({ title: '已退出登录', icon: 'success' });
  }

  function handleAcceptHandoff(projectId: string) {
    const accepted = acceptMiniHandoff(projectId);
    Taro.showToast({
      title: accepted ? '已接收项目' : '当前身份不可接收',
      icon: accepted ? 'success' : 'none',
    });
  }

  return (
    <View className="page account-page" style={navMetrics.cssVars}>
      <View className="account-title-nav">
        <Text className="nav-company">{profile?.companyName ?? '企业账号'}</Text>
      </View>

      <View className={hasSession ? 'surface profile-card' : 'surface profile-card guest-card'}>
        <View className="avatar">
          <Text>{hasSession ? 'H' : '企'}</Text>
        </View>
        <View className="profile-main">
          <View className="profile-head">
            <Text className="person">
              {profile ? `${profile.contactName} · ${roleLabel(profile.role)}` : '未进入企业账号'}
            </Text>
            <Text className={hasSession ? 'status-badge bound' : 'status-badge'}>
              {hasSession ? '已登录' : '未登录'}
            </Text>
          </View>
          <Text className="hint">
            {profile?.email ?? '登录后同步订单、地址和发票'}
          </Text>
        </View>
        {hasSession && (
          <View className="profile-stats">
            <Metric value={String(todoCounts.total)} label="待办" />
            <Metric value={String(addresses.length)} label="地址" />
            <Metric value={String(invoices.length)} label="发票" />
          </View>
        )}
      </View>

      {!hasSession && (
        <View className="surface bind-card primary-bind-card">
          <View className="bind-head">
            <View>
              <Text className="section-title">企业成员登录</Text>
              <Text className="section-body">可使用邮箱、姓名或手机号登录。</Text>
            </View>
          </View>
          <View className="bind-form">
            <View className="field">
              <Text className="field-label">账号</Text>
              <Input
                value={account}
                placeholder="邮箱 / 姓名 / 手机号"
                onInput={(event) => setAccount(String(event.detail.value))}
              />
            </View>
            <View className="field">
              <Text className="field-label">密码</Text>
              <Input
                value={password}
                password
                placeholder="输入登录密码"
                onInput={(event) => setPassword(String(event.detail.value))}
              />
            </View>
            <Button className="primary-button" disabled={loggingIn} onClick={handleLogin}>
              {loggingIn ? '登录中' : '登录企业账号'}
            </Button>
          </View>
        </View>
      )}

      {hasSession && profile && (
        <>
          <View className="surface menu-list">
            <MenuItem
              label="待办"
              title="订单待办"
              meta={`${todoCounts.total} 个可处理`}
              onClick={() => Taro.switchTab({ url: '/pages/orders/index' })}
            />
            <MenuItem
              label="订单"
              title="全部订单"
              meta={`${enterpriseOrders.length} 个`}
              onClick={() => Taro.switchTab({ url: '/pages/orders/index' })}
            />
            <MenuItem
              label="地址"
              title="地址簿"
              meta={`${addresses.length} 个`}
              onClick={() => Taro.navigateTo({ url: '/pages/addresses/index' })}
            />
            <MenuItem
              label="发票"
              title="发票抬头"
              meta={`${invoices.length} 个`}
              onClick={() => Taro.navigateTo({ url: '/pages/invoices/index' })}
            />
          </View>

          {activeHandoffs.length > 0 && (
            <View className="surface handoff-card">
              <View className="handoff-head">
                <View>
                  <Text className="section-title">项目接续</Text>
                  <Text className="section-body">工程师移交的项目 BOM，可由采购或管理员接收。</Text>
                </View>
                <Text className="handoff-count">{activeHandoffs.length}</Text>
              </View>
              <View className="handoff-list">
                {activeHandoffs.map((handoff) => (
                  <HandoffItem
                    key={handoff.id}
                    handoff={handoff}
                    canAccept={profile.role !== 'engineer' && handoff.status === 'pending'}
                    onAccept={() => handleAcceptHandoff(handoff.projectId)}
                  />
                ))}
              </View>
            </View>
          )}

          <View className="surface support-card">
            <View className="permission-summary">
              <Text className="section-title">角色与权限</Text>
              <Text className="section-body">{miniRolePermissionSummary(profile)}</Text>
            </View>
            <MenuItem label="权限" title="成员与权限" meta={roleLabel(profile.role)} />
            <MenuItem label="审批" title="审批设置" meta="移动端只读" />
            <MenuItem label="销售" title="联系销售" meta="询价与项目支持" />
          </View>

          <View className="surface bind-card">
            <View className="bind-head" onClick={() => setLoginOpen((value) => !value)}>
              <View>
                <Text className="section-title">企业账号</Text>
                <Text className="section-body">可切换或退出当前登录身份。</Text>
              </View>
              <Text className="bind-toggle">{loginOpen ? '收起' : '管理'}</Text>
            </View>
            {loginOpen && (
              <View className="bind-form">
                <View className="field">
                  <Text className="field-label">账号</Text>
                  <Input
                    value={account}
                    placeholder="邮箱 / 姓名 / 手机号"
                    onInput={(event) => setAccount(String(event.detail.value))}
                  />
                </View>
                <View className="field">
                  <Text className="field-label">密码</Text>
                  <Input
                    value={password}
                    password
                    placeholder="输入登录密码"
                    onInput={(event) => setPassword(String(event.detail.value))}
                  />
                </View>
                <Button className="primary-button" disabled={loggingIn} onClick={handleLogin}>
                  {loggingIn ? '切换中' : '切换账号'}
                </Button>
                <Button className="secondary-button" onClick={handleSignOut}>
                  退出企业账号
                </Button>
              </View>
            )}
          </View>
        </>
      )}
    </View>
  );
}

function loginErrorTitle(error: unknown) {
  if (error instanceof Error) {
    if (error.message === 'MINI_ENTERPRISE_MEMBER_NOT_FOUND') return '未找到企业成员';
    if (error.message === 'MINI_ENTERPRISE_MEMBER_PASSWORD_REQUIRED') return '请输入登录密码';
  }

  return '登录失败，请重试';
}

function getAccountNavMetrics() {
  const fallback = {
    capsuleTop: 54,
    capsuleHeight: 32,
    capsuleLeft: 288,
    navHeight: 98,
  };

  try {
    const capsule = Taro.getMenuButtonBoundingClientRect();
    const capsuleTop = capsule.top || fallback.capsuleTop;
    const capsuleHeight = capsule.height || fallback.capsuleHeight;
    const capsuleLeft = capsule.left || fallback.capsuleLeft;
    const navHeight = capsuleTop + capsuleHeight + 12;

    return {
      cssVars: [
        `--account-capsule-top:${capsuleTop}px`,
        `--account-capsule-height:${capsuleHeight}px`,
        `--account-capsule-left:${capsuleLeft}px`,
        `--account-nav-height:${navHeight}px`,
      ].join(';'),
    };
  } catch {
    return {
      cssVars: [
        `--account-capsule-top:${fallback.capsuleTop}px`,
        `--account-capsule-height:${fallback.capsuleHeight}px`,
        `--account-capsule-left:${fallback.capsuleLeft}px`,
        `--account-nav-height:${fallback.navHeight}px`,
      ].join(';'),
    };
  }
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

function HandoffItem({
  handoff,
  canAccept,
  onAccept,
}: {
  handoff: LocalOsHandoff;
  canAccept: boolean;
  onAccept: () => void;
}) {
  return (
    <View className="handoff-item">
      <View className="handoff-copy">
        <Text className="handoff-title">{handoff.projectName}</Text>
        <Text className="handoff-meta">
          {handoff.itemCount} 项 BOM · {handoff.submittedBy ?? '工程师'} · {formatShortDate(handoff.updatedAt)}
        </Text>
      </View>
      {canAccept ? (
        <Button className="handoff-action" onClick={onAccept}>
          接收
        </Button>
      ) : (
        <Text className="handoff-status">{handoffStatusLabel(handoff.status)}</Text>
      )}
    </View>
  );
}

function handoffStatusLabel(status: LocalOsHandoff['status']) {
  return {
    pending: '待接收',
    accepted: '已接收',
    submitted: '已生成订单',
  }[status];
}

function formatShortDate(value: string) {
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return value;
  const pad = (input: number) => String(input).padStart(2, '0');
  return `${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function roleLabel(role: string) {
  return {
    admin: '管理员',
    buyer: '采购',
    engineer: '工程师',
  }[role] ?? role;
}
