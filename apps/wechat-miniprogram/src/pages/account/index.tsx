import { useEffect, useMemo, useState } from 'react';
import Taro from '@tarojs/taro';
import { Button, Input, Picker, Text, View } from '@tarojs/components';
import { rememberedMiniMembers } from '@hitbot/api-client';
import { formatPrice, type LocalOsHandoff, type LocalQuoteRequest } from '@hitbot/domain';
import {
  Headphones,
  MapPin,
  ReceiptText,
  ShieldCheck,
  Users,
} from 'lucide-taro';
import { useMiniStore } from '@/hooks/use-mini-store';
import {
  acceptMiniHandoff,
  acceptQuoteRequest,
  currentEnterpriseProfile,
  getMiniOrderTodoCounts,
  hasEnterpriseSession,
  loginEnterpriseMember,
  miniRolePermissionSummary,
  provideQuoteRequest,
  selectMiniEnterpriseAddresses,
  selectMiniEnterpriseHandoffs,
  selectMiniEnterpriseInvoices,
  selectMiniEnterpriseQuoteRequests,
  setActiveProject,
  signOutEnterprise,
} from '@/services/store';
import './index.scss';

type LoginMember = (typeof rememberedMiniMembers)[number];
type AccountMenuIcon = 'address' | 'invoice' | 'permission' | 'approval' | 'sales';

const accountMenuIcons = {
  address: MapPin,
  invoice: ReceiptText,
  permission: Users,
  approval: ShieldCheck,
  sales: Headphones,
};

export default function AccountPage() {
  const appState = useMiniStore();
  const hasSession = hasEnterpriseSession(appState);
  const profile = currentEnterpriseProfile(appState);
  const handoffs = useMemo(() => selectMiniEnterpriseHandoffs(appState), [appState]);
  const activeHandoffs = useMemo(
    () => handoffs.filter((handoff) => handoff.status !== 'submitted'),
    [handoffs],
  );
  const quoteRequests = useMemo(() => selectMiniEnterpriseQuoteRequests(appState), [appState]);
  const activeQuoteRequests = useMemo(
    () => quoteRequests.filter((request) => request.status !== 'accepted'),
    [quoteRequests],
  );
  const addresses = useMemo(() => selectMiniEnterpriseAddresses(appState), [appState]);
  const invoices = useMemo(() => selectMiniEnterpriseInvoices(appState), [appState]);
  const todoCounts = useMemo(() => getMiniOrderTodoCounts(appState), [appState]);
  const isEnterpriseAdmin = profile?.role === 'admin';
  const canManageProcurementProfiles = profile?.role === 'admin' || profile?.role === 'buyer';
  const navMetrics = useMemo(() => getAccountNavMetrics(), []);
  const [selectedMemberEmail, setSelectedMemberEmail] = useState(profile?.email ?? '');
  const [password, setPassword] = useState('');
  const [loggingIn, setLoggingIn] = useState(false);
  const [actingQuoteNo, setActingQuoteNo] = useState<string | null>(null);
  const selectedMember = useMemo(
    () => rememberedMiniMembers.find((member) => member.email === selectedMemberEmail) ?? null,
    [selectedMemberEmail],
  );

  useEffect(() => {
    if (profile?.email) {
      setSelectedMemberEmail(profile.email);
    }
  }, [profile?.email]);

  async function handleLogin() {
    if (loggingIn) return;
    const trimmedPassword = password.trim();

    if (!selectedMember || !trimmedPassword) {
      Taro.showToast({ title: '请选择成员并输入密码', icon: 'none' });
      return;
    }

    setLoggingIn(true);
    try {
      await loginEnterpriseMember({ account: selectedMember.email, password: trimmedPassword });
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
    setSelectedMemberEmail('');
    setPassword('');
    Taro.showToast({ title: '已退出登录', icon: 'success' });
  }

  function handleAcceptHandoff(handoff: LocalOsHandoff) {
    const accepted = acceptMiniHandoff(handoff.projectId);
    Taro.showToast({
      title: accepted ? '已接收项目' : '当前身份不可接收',
      icon: accepted ? 'success' : 'none',
    });
    if (accepted) {
      setActiveProject(
        handoff.projectId === appState.projects.web.projectId ? 'web' : 'os',
      );
      Taro.switchTab({ url: '/pages/cart/index' });
    }
  }

  async function handleProvideQuote(requestNo: string) {
    if (actingQuoteNo) return;
    setActingQuoteNo(requestNo);
    try {
      await provideQuoteRequest(requestNo);
      Taro.showToast({ title: '报价已更新', icon: 'success' });
    } catch {
      Taro.showToast({ title: '报价暂未返回', icon: 'none' });
    } finally {
      setActingQuoteNo(null);
    }
  }

  async function handleAcceptQuote(requestNo: string) {
    if (actingQuoteNo) return;
    setActingQuoteNo(requestNo);
    try {
      await acceptQuoteRequest(requestNo);
      Taro.showToast({ title: '已确认报价', icon: 'success' });
    } catch {
      Taro.showToast({ title: '确认失败，请稍后重试', icon: 'none' });
    } finally {
      setActingQuoteNo(null);
    }
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
            {canManageProcurementProfiles ? (
              <>
                <Metric value={String(addresses.length)} label="地址" />
                <Metric value={String(invoices.length)} label="发票" />
              </>
            ) : (
              <>
                <Metric value={String(activeHandoffs.length)} label="项目" />
                <Metric value={String(activeQuoteRequests.length)} label="询价" />
              </>
            )}
          </View>
        )}
      </View>

      {!hasSession && (
        <View className="surface bind-card primary-bind-card">
          <View className="bind-head">
            <View>
              <Text className="section-title">企业成员登录</Text>
              <Text className="section-body">选择成员后输入任意密码即可进入。</Text>
            </View>
          </View>
          <View className="bind-form">
            <MemberSelector
              members={rememberedMiniMembers}
              value={selectedMemberEmail}
              onChange={setSelectedMemberEmail}
            />
            <View className="field">
              <Text className="field-label">密码</Text>
              <Input
                value={password}
                password
                placeholder="任意输入即可"
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
          {canManageProcurementProfiles && (
            <View className="surface menu-list">
              <MenuItem
                icon="address"
                title="地址簿"
                meta={`${addresses.length} 个`}
                onClick={() => Taro.navigateTo({ url: '/pages/addresses/index' })}
              />
              <MenuItem
                icon="invoice"
                title="发票抬头"
                meta={`${invoices.length} 个`}
                onClick={() => Taro.navigateTo({ url: '/pages/invoices/index' })}
              />
            </View>
          )}

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
                    onAccept={() => handleAcceptHandoff(handoff)}
                  />
                ))}
              </View>
            </View>
          )}

          {activeQuoteRequests.length > 0 && (
            <View className="surface quote-card">
              <View className="handoff-head">
                <View>
                  <Text className="section-title">询价</Text>
                  <Text className="section-body">加工件报价返回后，可在这里确认并推进订单。</Text>
                </View>
                <Text className="handoff-count">{activeQuoteRequests.length}</Text>
              </View>
              <View className="quote-list">
                {activeQuoteRequests.map((request) => (
                  <QuoteItem
                    key={request.requestNo}
                    request={request}
                    acting={actingQuoteNo === request.requestNo}
                    canAct={profile.role !== 'engineer'}
                    onProvide={() => handleProvideQuote(request.requestNo)}
                    onAccept={() => handleAcceptQuote(request.requestNo)}
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
            {isEnterpriseAdmin && (
              <>
                <MenuItem icon="permission" title="成员与权限" meta="管理员" />
                <MenuItem icon="approval" title="审批设置" meta="移动端只读" />
              </>
            )}
            <MenuItem icon="sales" title="联系销售" meta="询价与项目支持" />
          </View>

          <View className="account-footer-actions">
            <Button className="sign-out-button" onClick={handleSignOut}>
              退出登录
            </Button>
          </View>
        </>
      )}
    </View>
  );
}

function MemberSelector({
  members,
  value,
  onChange,
}: {
  members: LoginMember[];
  value: string;
  onChange: (email: string) => void;
}) {
  const selectedIndex = members.findIndex((member) => member.email === value);
  const selectedMember = selectedIndex >= 0 ? members[selectedIndex] : null;

  return (
    <View className="field">
      <Text className="field-label">成员</Text>
      <Picker
        mode="selector"
        range={members.map(memberPickerLabel)}
        value={Math.max(selectedIndex, 0)}
        onChange={(event) => {
          const nextMember = members[Number(event.detail.value)];
          if (nextMember) onChange(nextMember.email);
        }}
      >
        <View className={selectedMember ? 'member-picker' : 'member-picker placeholder'}>
          <View className="member-copy">
            <Text className="member-name">
              {selectedMember
                ? `${selectedMember.contactName} · ${roleLabel(selectedMember.role)}`
                : '选择企业成员'}
            </Text>
            <Text className="member-email">
              {selectedMember?.email ?? '与 Web 端登录成员一致'}
            </Text>
          </View>
          <Text className="member-arrow">›</Text>
        </View>
      </Picker>
    </View>
  );
}

function memberPickerLabel(member: LoginMember) {
  return `${member.contactName} · ${roleLabel(member.role)} · ${member.email}`;
}

function loginErrorTitle(error: unknown) {
  if (error instanceof Error) {
    if (error.message === 'MINI_ENTERPRISE_MEMBER_NOT_FOUND') return '未找到企业成员';
    if (error.message === 'MINI_ENTERPRISE_MEMBER_PASSWORD_REQUIRED') return '请输入任意密码';
    if (error.message === 'MINI_ENTERPRISE_MEMBER_AMBIGUOUS') return '请选择列表中的企业成员';
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
  icon,
  title,
  meta,
  onClick,
}: {
  icon: AccountMenuIcon;
  title: string;
  meta: string;
  onClick?: () => void;
}) {
  return (
    <View className={onClick ? 'menu-item actionable' : 'menu-item'} onClick={onClick}>
      <MenuIcon name={icon} />
      <View className="menu-copy">
        <Text className="menu-title">{title}</Text>
      </View>
      <Text className="menu-meta">{meta}</Text>
      {onClick && <Text className="menu-arrow">›</Text>}
    </View>
  );
}

function MenuIcon({ name }: { name: AccountMenuIcon }) {
  const Icon = accountMenuIcons[name];
  return (
    <View className="menu-icon">
      <Icon className="menu-symbol" size={18} strokeWidth={2.4} color="#bd1c22" />
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

function QuoteItem({
  request,
  acting,
  canAct,
  onProvide,
  onAccept,
}: {
  request: LocalQuoteRequest;
  acting: boolean;
  canAct: boolean;
  onProvide: () => void;
  onAccept: () => void;
}) {
  const isQuoted = request.status === 'quoted';
  const estimateLabel = request.estimateCents
    ? formatPrice(request.estimateCents, 'CNY')
    : '等待报价';
  const actionLabel = isQuoted ? '确认报价' : '获取报价';
  return (
    <View className="quote-item">
      <View className="handoff-copy">
        <Text className="handoff-title">{request.projectName}</Text>
        <Text className="handoff-meta">
          {request.lines.length} 项加工件 · {estimateLabel}
        </Text>
      </View>
      {canAct ? (
        <Button
          className={isQuoted ? 'quote-action primary' : 'quote-action'}
          disabled={acting}
          onClick={isQuoted ? onAccept : onProvide}
        >
          {acting ? '处理中' : actionLabel}
        </Button>
      ) : (
        <Text className="handoff-status">{quoteStatusLabel(request.status)}</Text>
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

function quoteStatusLabel(status: LocalQuoteRequest['status']) {
  return {
    'pending-quote': '待报价',
    quoted: '已报价',
    accepted: '已确认',
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
