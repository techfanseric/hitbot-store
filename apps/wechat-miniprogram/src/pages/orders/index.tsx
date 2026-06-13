import { useMemo, useState } from 'react';
import Taro from '@tarojs/taro';
import { Button, Picker, Text, View } from '@tarojs/components';
import { formatPrice, orderStatusLabel, type OrderStatus } from '@hitbot/domain';
import {
  advanceOrder,
  confirmOrderPayment,
  createOrderPayment,
} from '@/services/store';
import { useMiniStore } from '@/hooks/use-mini-store';
import './index.scss';

type QueueFilter = 'todo' | 'all';
type StatusFilter = 'all' | OrderStatus;
type TimeFilter = 'all' | '7d' | '30d' | 'month';

const actionableStatuses = new Set([
  'pending-quote',
  'pending-approval',
  'pending-payment',
  'paid',
  'in-production',
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
  const [filter, setFilter] = useState<QueueFilter>('todo');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [projectFilter, setProjectFilter] = useState('all');
  const [timeFilter, setTimeFilter] = useState<TimeFilter>('all');
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [visibleCount, setVisibleCount] = useState(ORDER_PAGE_SIZE);
  const [actingOrderNo, setActingOrderNo] = useState<string | null>(null);
  const orders = appState.orders;
  const projectOptions = useMemo(
    () => ['all', ...Array.from(new Set(orders.map((order) => order.projectName)))],
    [orders],
  );
  const filteredOrders = useMemo(
    () =>
      orders.filter((order) => {
        const queueMatch = filter === 'all' || actionableStatuses.has(order.status);
        const statusMatch = statusFilter === 'all' || order.status === statusFilter;
        const projectMatch = projectFilter === 'all' || order.projectName === projectFilter;
        const timeMatch = matchesTimeFilter(order.submittedAt, timeFilter);
        return queueMatch && statusMatch && projectMatch && timeMatch;
      }),
    [filter, orders, projectFilter, statusFilter, timeFilter],
  );
  const visibleOrders = useMemo(
    () => filteredOrders.slice(0, visibleCount),
    [filteredOrders, visibleCount],
  );
  const hasMoreOrders = visibleCount < filteredOrders.length;
  const pendingApproval = orders.filter((order) => order.status === 'pending-approval').length;
  const pendingPayment = orders.filter((order) => order.status === 'pending-payment').length;
  const pendingQuote = orders.filter((order) => order.status === 'pending-quote').length;

  async function handleAction(orderNo: string, label: string) {
    setActingOrderNo(orderNo);
    try {
      await advanceOrder(orderNo);
      Taro.showToast({ title: `${label}成功`, icon: 'success' });
    } finally {
      setActingOrderNo(null);
    }
  }

  async function handlePayment(orderNo: string) {
    setActingOrderNo(orderNo);
    try {
      const params = await createOrderPayment(orderNo);
      await Taro.requestPayment(params as Parameters<typeof Taro.requestPayment>[0]);
      await confirmOrderPayment(orderNo);
      Taro.showToast({ title: '付款成功', icon: 'success' });
    } catch {
      Taro.showToast({ title: '支付未完成', icon: 'none' });
    } finally {
      setActingOrderNo(null);
    }
  }

  function actionLabel(status: OrderStatus) {
    return {
      'pending-quote': '确认报价',
      'pending-approval': '审批通过',
      'pending-payment': '立即支付',
      paid: '开始生产',
      'in-production': '确认发货',
      shipped: '确认收货',
      completed: '查看详情',
    }[status];
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
    <View className="page orders-page">
      <View className="summary-strip">
        <View className="summary-copy">
          <Text className="summary-primary">{filteredOrders.length} 个订单</Text>
          <Text className="summary-secondary">
            待审批 {pendingApproval} · 待付款 {pendingPayment} · 待报价 {pendingQuote}
          </Text>
        </View>
        <Button className="filter-trigger" onClick={() => setFiltersOpen((value) => !value)}>
          {filtersOpen ? '收起筛选' : '筛选'}
        </Button>
      </View>

      <View className="filter-tabs">
        <Button className={filter === 'todo' ? 'tab active' : 'tab'} onClick={() => updateQueueFilter('todo')}>
          只看待办
        </Button>
        <Button className={filter === 'all' ? 'tab active' : 'tab'} onClick={() => updateQueueFilter('all')}>
          全部订单
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
        {visibleOrders.map((order) => (
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
              {order.status === 'pending-payment' && (
                <Button
                  className="primary-button"
                  disabled={actingOrderNo === order.orderNo}
                  onClick={() => handlePayment(order.orderNo)}
                >
                  {actingOrderNo === order.orderNo ? '处理中' : '立即支付'}
                </Button>
              )}
              {order.status !== 'pending-payment' && actionableStatuses.has(order.status) && (
                <Button
                  className={order.status === 'pending-quote' ? 'ghost-button' : 'primary-button'}
                  disabled={actingOrderNo === order.orderNo}
                  onClick={() => handleAction(order.orderNo, actionLabel(order.status))}
                >
                  {actingOrderNo === order.orderNo ? '处理中' : actionLabel(order.status)}
                </Button>
              )}
              {!actionableStatuses.has(order.status) && (
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
        ))}
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
            <Text className="project-name">暂无匹配订单</Text>
            <Text className="hint">调整状态、项目或时间筛选后再试。</Text>
          </View>
        )}
      </View>
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
