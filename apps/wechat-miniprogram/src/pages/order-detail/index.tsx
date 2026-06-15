import { useState } from 'react';
import Taro, { useRouter } from '@tarojs/taro';
import { Button, Text, View } from '@tarojs/components';
import { formatPrice, orderStatusLabel, partClassLabel, type OrderStatus } from '@hitbot/domain';
import {
  advanceOrder,
  confirmOrderPayment,
  createOrderPayment,
  findEnterpriseOrder,
  isEnterpriseBound,
  resolveMiniOrderAction,
} from '@/services/store';
import { useMiniStore } from '@/hooks/use-mini-store';
import './index.scss';

export default function OrderDetailPage() {
  const appState = useMiniStore();
  const [acting, setActing] = useState(false);
  const router = useRouter();
  const orderNo = String(router.params.orderNo ?? '');
  const isBound = isEnterpriseBound(appState);
  const order = findEnterpriseOrder(orderNo, appState);
  const action = order ? resolveMiniOrderAction(order, appState) : null;

  async function handleAction() {
    if (!order) return;
    if (!action?.canAct) {
      Taro.showToast({ title: action?.lockedReason || '当前角色无权限', icon: 'none' });
      return;
    }

    setActing(true);
    try {
      if (action.actionKind === 'pay') {
        if (order.paymentMethod === 'personal') {
          const params = await createOrderPayment(order.orderNo);
          if (!isMockPayment(params)) {
            await Taro.requestPayment(params as Parameters<typeof Taro.requestPayment>[0]);
          }
        }
        await confirmOrderPayment(order.orderNo);
        Taro.showToast({
          title: order.paymentMethod === 'personal' ? '付款成功' : '付款已确认',
          icon: 'success',
        });
        return;
      }

      if (action.actionKind === 'approve' || action.actionKind === 'receive') {
        await advanceOrder(order.orderNo);
        Taro.showToast({ title: `${action.actionLabel}成功`, icon: 'success' });
      }
    } catch {
      Taro.showToast({
        title:
          action.actionKind === 'pay'
            ? order.paymentMethod === 'personal'
              ? '支付未完成'
              : '付款确认失败'
            : '操作失败',
        icon: 'none',
      });
    } finally {
      setActing(false);
    }
  }

  function copyBom() {
    if (!order) return;
    const header = ['订单号', '项目', '型号', '名称', '数量', '类型', '来源', '小计'];
    const rows = order.lines.map((line) => [
      order.orderNo,
      order.projectName,
      line.model,
      line.name.zh,
      String(line.qty),
      partClassLabel(line.partClass),
      line.source === 'os' ? '项目同步' : '商城选购',
      line.quoteRequired ? '需询价' : formatPrice(line.subtotalCents, line.currency),
    ]);
    Taro.setClipboardData({
      data: [header, ...rows].map((row) => row.join(',')).join('\n'),
      success: () => Taro.showToast({ title: '物料已复制', icon: 'success' }),
    });
  }

  if (!isBound) {
    return (
      <View className="page order-detail-page">
        <View className="surface empty-detail">
          <Text className="title">尚未登录企业账号</Text>
          <Text className="info-line">登录后才能查看当前企业订单详情和处理待办。</Text>
          <Button className="primary-button" onClick={() => Taro.switchTab({ url: '/pages/account/index' })}>
            去登录企业账号
          </Button>
        </View>
      </View>
    );
  }

  if (!order) {
    return (
      <View className="page order-detail-page">
        <View className="surface empty-detail">
          <Text className="title">订单不存在</Text>
          <Button className="primary-button" onClick={() => Taro.navigateBack()}>
            返回
          </Button>
        </View>
      </View>
    );
  }

  const canAct = Boolean(action?.canAct);
  const currentStep = statusStep(order.status);
  const nextActionLabel = action?.actionLabel ?? '查看详情';
  const statusEvents = [
    { label: '提交', value: order.submittedAt },
    { label: '审批/报价', value: order.approvedAt },
    { label: '付款', value: order.paidAt },
    { label: '生产', value: order.productionStartedAt },
    { label: '发货', value: order.shippedAt },
    { label: '完成', value: order.completedAt },
  ].filter((event) => Boolean(event.value));

  return (
    <View className="page order-detail-page">
      <View className="hero">
        <Text className="eyebrow">{order.orderNo}</Text>
        <Text className="title">{order.projectName}</Text>
        <Text className="hint">提交人：{order.submittedBy ?? '-'} · 物料 {order.itemCount} 件</Text>
      </View>

      <View className="surface status-card">
        <View className="between">
          <View>
            <Text className="section-title">当前状态</Text>
            <Text className="status-text">{orderStatusLabel(order.status)}</Text>
          </View>
          <Text className="tag tag-red">{roleLabel(order.role)}提交</Text>
        </View>
        <Text className={canAct ? 'permission-line ready' : 'permission-line'}>
          {canAct ? `${action?.ownerLabel ?? '你的待办'}：${nextActionLabel}` : action?.lockedReason}
        </Text>
        <View className="timeline">
          {['提交', '审批/报价', '付款', '生产', '交付'].map((step, index) => (
            <View key={step} className="timeline-step">
              <Text className={index <= currentStep ? 'dot active' : 'dot'} />
              <Text>{step}</Text>
            </View>
          ))}
        </View>
      </View>

      <View className="surface section">
        <View className="between">
          <Text className="section-title">物料明细</Text>
          <Button className="text-button" onClick={copyBom}>
            复制物料
          </Button>
        </View>
        {order.lines.map((line) => (
          <View key={`${line.productId}-${line.model}`} className="line-row">
            <View>
              <Text className="line-model">{line.model}</Text>
              <Text className="line-name">{line.name.zh}</Text>
              <Text className="line-meta">
                {partClassLabel(line.partClass)} · {line.source === 'os' ? '项目同步' : '商城选购'}
              </Text>
            </View>
            <View className="line-amount">
              <Text>x {line.qty}</Text>
              <Text>{line.quoteRequired ? '需询价' : formatPrice(line.subtotalCents, line.currency)}</Text>
            </View>
          </View>
        ))}
      </View>

      <View className="surface section">
        <Text className="section-title">收货与发票</Text>
        <Text className="info-line">
          地址：{order.shippingAddress ? `${order.shippingAddress.recipient} · ${order.shippingAddress.phone} · ${order.shippingAddress.city} ${order.shippingAddress.address}` : '待采购确认'}
        </Text>
        <Text className="info-line">
          发票：{order.invoice?.title ?? (order.paymentMethod === 'corporate' ? '待选择发票抬头' : '个人支付')}
        </Text>
        <Text className="info-line">金额：{formatPrice(order.subtotalCents, 'CNY')}</Text>
        {order.note && <Text className="info-line">备注：{order.note}</Text>}
      </View>

      <View className="surface section">
        <Text className="section-title">状态记录</Text>
        <View className="event-list">
          {statusEvents.map((event) => (
            <View key={event.label} className="event-row">
              <Text className="event-label">{event.label}</Text>
              <Text className="event-value">{formatDateTime(event.value ?? '')}</Text>
            </View>
          ))}
        </View>
        {order.paymentReference && (
          <Text className="info-line">支付流水：{order.paymentReference}</Text>
        )}
        {order.paidBy && <Text className="info-line">付款确认：{order.paidBy}</Text>}
        {order.carrier && order.trackingNo && (
          <Text className="info-line">物流：{order.carrier} · {order.trackingNo}</Text>
        )}
      </View>

      {canAct && (
        <View className="bottom-bar">
          <View>
            <Text className="hint">订单金额</Text>
            <Text className="amount">{formatPrice(order.subtotalCents, 'CNY')}</Text>
          </View>
          <Button className="primary-button" disabled={acting} onClick={handleAction}>
            {acting ? '处理中' : nextActionLabel}
          </Button>
        </View>
      )}
    </View>
  );
}

function formatDateTime(value: string) {
  if (!value) return '-';
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return value;
  const pad = (input: number) => String(input).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function statusStep(status: OrderStatus) {
  return {
    'pending-quote': 1,
    'pending-approval': 1,
    'pending-payment': 2,
    paid: 3,
    'in-production': 3,
    shipped: 4,
    completed: 4,
  }[status];
}

function isMockPayment(params: { package?: string }) {
  return params.package?.includes('mock-prepay') ?? false;
}

function roleLabel(role: string) {
  return {
    admin: '管理员',
    buyer: '采购',
    engineer: '工程师',
  }[role] ?? role;
}
