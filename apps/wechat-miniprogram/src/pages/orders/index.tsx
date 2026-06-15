import { useMemo, useState } from 'react';
import Taro from '@tarojs/taro';
import { Button, Picker, Text, View } from '@tarojs/components';
import { formatPrice, orderStatusLabel, type OrderStatus } from '@hitbot/domain';
import {
  advanceOrder,
  confirmOrderPayment,
  createOrderPayment,
  getMiniOrderTodoCounts,
  isEnterpriseBound,
  resolveMiniOrderAction,
  selectMiniEnterpriseOrders,
} from '@/services/store';
import { useMiniStore } from '@/hooks/use-mini-store';
import './index.scss';

type QueueFilter = 'todo' | 'all';
type StatusFilter = 'all' | OrderStatus;
type TimeFilter = 'all' | '7d' | '30d' | 'month';

const actionableStatuses = new Set([
  'pending-approval',
  'pending-payment',
  'shipped',
]);
const statusFilters: Array<{ key: StatusFilter; label: string }> = [
  { key: 'all', label: '全部状态' },
  { key: 'pending-quote', label: '待报价' },
  { key: 'pending-approval', label: '待审批' },
  { key: 'pending-payment', label: '待付款' },
  { key: 'paid', label: '已付款' },
  { key: 'in-production', label: '生产中' },
  { key: 'shipped', label: '已发货' },
  { key: 'completed', label: '已完成' },
];
const timeFilters: Array<{ key: TimeFilter; label: string }> = [
  { key: 'all', label: '全部时间' },
  { key: '7d', label: '近 7 天' },
  { key: '30d', label: '近 30 天' },
  { key: 'month', label: '本月' },
];
const ORDER_PAGE_SIZE = 8;

export default function OrdersPage() {
  const appState = useMiniStore();
  const navMetrics = useMemo(() => getNavMetrics(), []);
  const [filter, setFilter] = useState<QueueFilter>('todo');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [projectFilter, setProjectFilter] = useState('all');
  const [timeFilter, setTimeFilter] = useState<TimeFilter>('all');
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [visibleCount, setVisibleCount] = useState(ORDER_PAGE_SIZE);
  const [actingOrderNo, setActingOrderNo] = useState<string | null>(null);
  const isBound = isEnterpriseBound(appState);
  const orders = useMemo(() => selectMiniEnterpriseOrders(appState), [appState]);
  const todoCounts = useMemo(() => getMiniOrderTodoCounts(appState), [appState]);
  const projectOptions = useMemo(
    () => ['all', ...Array.from(new Set(orders.map((order) => order.projectName)))],
    [orders],
  );
  const filteredOrders = useMemo(
    () =>
      orders.filter((order) => {
        const queueMatch =
          filter === 'all' || resolveMiniOrderAction(order, appState).isTodo;
        const statusMatch = statusFilter === 'all' || order.status === statusFilter;
        const projectMatch = projectFilter === 'all' || order.projectName === projectFilter;
        const timeMatch = matchesTimeFilter(order.submittedAt, timeFilter);
        return queueMatch && statusMatch && projectMatch && timeMatch;
      }),
    [appState, filter, orders, projectFilter, statusFilter, timeFilter],
  );
  const allQueueCount = useMemo(
    () =>
      orders.filter((order) => {
        const statusMatch = statusFilter === 'all' || order.status === statusFilter;
        const projectMatch = projectFilter === 'all' || order.projectName === projectFilter;
        const timeMatch = matchesTimeFilter(order.submittedAt, timeFilter);
        return statusMatch && projectMatch && timeMatch;
      }).length,
    [orders, projectFilter, statusFilter, timeFilter],
  );
  const visibleOrders = useMemo(
    () => filteredOrders.slice(0, visibleCount),
    [filteredOrders, visibleCount],
  );
  const hasMoreOrders = visibleCount < filteredOrders.length;

  async function handleAction(orderNo: string, label: string) {
    const order = orders.find((item) => item.orderNo === orderNo);
    const action = order ? resolveMiniOrderAction(order, appState) : null;
    if (!action?.canAct || !['approve', 'receive'].includes(action.actionKind)) {
      Taro.showToast({ title: action?.lockedReason || '当前角色无权限', icon: 'none' });
      return;
    }

    setActingOrderNo(orderNo);
    try {
      await advanceOrder(orderNo);
      Taro.showToast({ title: `${label}成功`, icon: 'success' });
    } finally {
      setActingOrderNo(null);
    }
  }

  async function handlePayment(orderNo: string) {
    const order = orders.find((item) => item.orderNo === orderNo);
    const action = order ? resolveMiniOrderAction(order, appState) : null;
    if (!order || !action?.canAct || action.actionKind !== 'pay') {
      Taro.showToast({ title: action?.lockedReason || '当前角色无权限', icon: 'none' });
      return;
    }

    setActingOrderNo(orderNo);
    try {
      if (order.paymentMethod === 'personal') {
        const params = await createOrderPayment(orderNo);
        if (!isMockPayment(params)) {
          await Taro.requestPayment(params as Parameters<typeof Taro.requestPayment>[0]);
        }
      }
      await confirmOrderPayment(orderNo);
      Taro.showToast({
        title: order.paymentMethod === 'personal' ? '付款成功' : '付款已确认',
        icon: 'success',
      });
    } catch {
      Taro.showToast({
        title: order.paymentMethod === 'personal' ? '支付未完成' : '付款确认失败',
        icon: 'none',
      });
    } finally {
      setActingOrderNo(null);
    }
  }

  function updateQueueFilter(next: QueueFilter) {
    setFilter(next);
    setVisibleCount(ORDER_PAGE_SIZE);
  }

  function updateStatusFilter(next: StatusFilter) {
    setStatusFilter(next);
    setVisibleCount(ORDER_PAGE_SIZE);
  }

  function updateProjectFilter(next: string) {
    setProjectFilter(next);
    setVisibleCount(ORDER_PAGE_SIZE);
  }

  function updateTimeFilter(next: TimeFilter) {
    setTimeFilter(next);
    setVisibleCount(ORDER_PAGE_SIZE);
  }

  return (
    <View className="page orders-page" style={navMetrics.cssVars}>
      <View className="summary-strip">
        <View className="summary-copy">
          <Text className="summary-primary">订单中心</Text>
          <Text className="summary-secondary">
            {isBound
              ? `可审批 ${todoCounts.approval} · 待付款 ${todoCounts.payment} · 待收货 ${todoCounts.receipt}`
              : '登录企业账号后查看订单待办'}
          </Text>
        </View>
      </View>

      {!isBound && (
        <View className="surface auth-card">
          <Text className="project-name">尚未登录企业账号</Text>
          <Text className="hint">登录后才会加载当前企业订单，并按你的角色显示可处理待办。</Text>
          <Button className="primary-button" onClick={() => Taro.switchTab({ url: '/pages/account/index' })}>
            去登录企业账号
          </Button>
        </View>
      )}

      {isBound && (
        <>
      <View className="list-controls">
        <View className="filter-tabs">
          <Button className={filter === 'todo' ? 'tab active' : 'tab'} onClick={() => updateQueueFilter('todo')}>
            只看待办
            {todoCounts.total > 0 && <Text className="tab-count">{todoCounts.total}</Text>}
          </Button>
          <Button className={filter === 'all' ? 'tab active' : 'tab'} onClick={() => updateQueueFilter('all')}>
            <Text>全部订单</Text>
            <Text className="tab-count">{allQueueCount}</Text>
          </Button>
        </View>
        <Button className="filter-trigger" onClick={() => setFiltersOpen((value) => !value)}>
          {filtersOpen ? '收起' : '筛选'}
        </Button>
      </View>

      {filtersOpen && (
        <View className="surface filter-card">
          <View className="filter-head">
            <Text className="filter-title">筛选条件</Text>
            <Text className="filter-summary">{statusLabel(statusFilter)} · {timeLabel(timeFilter)}</Text>
          </View>
          <View className="filter-body">
            <View className="status-strip">
              {statusFilters.map((item) => (
                <Button
                  key={item.key}
                  className={statusFilter === item.key ? 'status-chip active' : 'status-chip'}
                  onClick={() => updateStatusFilter(item.key)}
                >
                  {item.label}
                </Button>
              ))}
            </View>
            <View className="picker-grid">
              <Picker
                mode="selector"
                range={projectOptions.map((project) => (project === 'all' ? '全部项目' : project))}
                value={Math.max(0, projectOptions.indexOf(projectFilter))}
                onChange={(event) => updateProjectFilter(projectOptions[Number(event.detail.value)] ?? 'all')}
              >
                <View className="picker-cell">
                  <Text className="picker-label">项目</Text>
                  <Text className="picker-value">{projectFilter === 'all' ? '全部项目' : projectFilter}</Text>
                </View>
              </Picker>
              <Picker
                mode="selector"
                range={timeFilters.map((item) => item.label)}
                value={Math.max(0, timeFilters.findIndex((item) => item.key === timeFilter))}
                onChange={(event) => updateTimeFilter(timeFilters[Number(event.detail.value)]?.key ?? 'all')}
              >
                <View className="picker-cell">
                  <Text className="picker-label">时间</Text>
                  <Text className="picker-value">{timeFilters.find((item) => item.key === timeFilter)?.label}</Text>
                </View>
              </Picker>
            </View>
          </View>
        </View>
      )}

      <View className="order-list">
        {visibleOrders.map((order) => {
          const action = resolveMiniOrderAction(order, appState);

          return (
          <View key={order.orderNo} className="surface order-card">
            <View
              className="order-head"
              onClick={() =>
                Taro.navigateTo({ url: `/pages/order-detail/index?orderNo=${order.orderNo}` })
              }
            >
              <View className="order-title">
                <Text className="order-no">{order.orderNo}</Text>
                <Text className="project-name">{order.projectName}</Text>
              </View>
              <Text className={`status-pill ${statusTone(order.status)}`}>
                {orderStatusLabel(order.status)}
              </Text>
            </View>
            <View className="order-meta">
              <Text>{formatOrderDate(order.submittedAt)}</Text>
              <Text>{order.submittedBy ?? '-'} 提交</Text>
              <Text>{order.itemCount} 件物料</Text>
            </View>
            <Text className={action.canAct ? 'permission-hint ready' : 'permission-hint'}>
              {action.canAct ? action.ownerLabel ?? '可处理待办' : action.lockedReason}
            </Text>
            <View className="order-lines">
              {order.lines.slice(0, 2).map((line) => (
                <Text key={`${order.orderNo}-${line.productId}`} className="line-text">
                  {line.model} x {line.qty}
                </Text>
              ))}
              {order.lines.length > 2 && (
                <Text className="line-text">另有 {order.lines.length - 2} 项</Text>
              )}
            </View>
            <View className="order-footer">
              <View className="amount-block">
                <Text className="amount-label">金额</Text>
                <Text className="order-amount">{formatPrice(order.subtotalCents, 'CNY')}</Text>
              </View>
              {action.canAct && action.actionKind === 'pay' && (
                <Button
                  className="primary-button"
                  disabled={actingOrderNo === order.orderNo}
                  onClick={() => handlePayment(order.orderNo)}
                >
                  {actingOrderNo === order.orderNo ? '处理中' : action.actionLabel}
                </Button>
              )}
              {action.canAct && action.actionKind !== 'pay' && (
                <Button
                  className="primary-button"
                  disabled={actingOrderNo === order.orderNo}
                  onClick={() => handleAction(order.orderNo, action.actionLabel)}
                >
                  {actingOrderNo === order.orderNo ? '处理中' : action.actionLabel}
                </Button>
              )}
              {!action.canAct && (
                <Button
                  className="secondary-button"
                  onClick={() =>
                    Taro.navigateTo({ url: `/pages/order-detail/index?orderNo=${order.orderNo}` })
                  }
                >
                  查看详情
                </Button>
              )}
            </View>
          </View>
          );
        })}
        {hasMoreOrders && (
          <Button
            className="secondary-button load-more"
            onClick={() => setVisibleCount((count) => count + ORDER_PAGE_SIZE)}
          >
            查看更多 {visibleOrders.length}/{filteredOrders.length}
          </Button>
        )}
        {visibleOrders.length === 0 && (
          <View className="surface empty-orders">
            <Text className="project-name">
              {filter === 'todo' ? '暂无需要你处理的订单' : '暂无匹配订单'}
            </Text>
            <Text className="hint">
              {filter === 'todo' ? '你仍可切换到全部订单查看进度。' : '调整状态、项目或时间筛选后再试。'}
            </Text>
          </View>
        )}
      </View>
        </>
      )}
    </View>
  );
}

function statusLabel(status: StatusFilter) {
  return statusFilters.find((item) => item.key === status)?.label ?? '全部状态';
}

function timeLabel(filter: TimeFilter) {
  return timeFilters.find((item) => item.key === filter)?.label ?? '全部时间';
}

function statusTone(status: OrderStatus) {
  if (status === 'pending-payment') return 'status-payment';
  if (status === 'pending-quote') return 'status-quote';
  if (status === 'completed') return 'status-done';
  return actionableStatuses.has(status) ? 'status-action' : 'status-neutral';
}

function formatOrderDate(value: string) {
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return value;
  const pad = (input: number) => String(input).padStart(2, '0');
  return `${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function matchesTimeFilter(value: string, filter: TimeFilter) {
  if (filter === 'all') return true;
  const date = new Date(value);
  const now = new Date();
  if (!Number.isFinite(date.getTime())) return true;

  if (filter === 'month') {
    return date.getFullYear() === now.getFullYear() && date.getMonth() === now.getMonth();
  }

  const days = filter === '7d' ? 7 : 30;
  return now.getTime() - date.getTime() <= days * 24 * 60 * 60 * 1000;
}

function isMockPayment(params: { package?: string }) {
  return params.package?.includes('mock-prepay') ?? false;
}

function getNavMetrics() {
  const fallback = {
    statusBarHeight: 44,
    capsuleTop: 54,
    capsuleHeight: 32,
    capsuleLeft: 288,
    navHeight: 98,
  };

  try {
    const systemInfo = Taro.getSystemInfoSync();
    const capsule = Taro.getMenuButtonBoundingClientRect();
    const statusBarHeight = systemInfo.statusBarHeight || fallback.statusBarHeight;
    const capsuleTop = capsule.top || fallback.capsuleTop;
    const capsuleHeight = capsule.height || fallback.capsuleHeight;
    const capsuleLeft = capsule.left || fallback.capsuleLeft;
    const navHeight = capsuleTop + capsuleHeight + 12;

    return {
      cssVars: [
        `--orders-status-top:${statusBarHeight}px`,
        `--orders-capsule-top:${capsuleTop}px`,
        `--orders-capsule-height:${capsuleHeight}px`,
        `--orders-capsule-left:${capsuleLeft}px`,
        `--orders-nav-height:${navHeight}px`,
      ].join(';'),
    };
  } catch {
    return {
      cssVars: [
        `--orders-status-top:${fallback.statusBarHeight}px`,
        `--orders-capsule-top:${fallback.capsuleTop}px`,
        `--orders-capsule-height:${fallback.capsuleHeight}px`,
        `--orders-capsule-left:${fallback.capsuleLeft}px`,
        `--orders-nav-height:${fallback.navHeight}px`,
      ].join(';'),
    };
  }
}
