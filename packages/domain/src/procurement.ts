import { getProductById } from './products';
import type {
  ApprovalMode,
  CartItem,
  LocalOrderSnapshot,
  OrderLineSnapshot,
  OrderStatus,
  SubmitCartInput,
  SubmitCartResult,
} from './types';

function nextOrderNo(now = new Date()) {
  const stamp = [
    now.getFullYear(),
    String(now.getMonth() + 1).padStart(2, '0'),
    String(now.getDate()).padStart(2, '0'),
    String(now.getHours()).padStart(2, '0'),
    String(now.getMinutes()).padStart(2, '0'),
    String(now.getSeconds()).padStart(2, '0'),
  ].join('');
  const millis = String(now.getMilliseconds()).padStart(3, '0');
  const suffix = Math.random().toString(36).slice(2, 5).toUpperCase();
  return `HB${stamp}${millis}${suffix}`;
}

export function cartItemsToOrderLines(items: CartItem[]): OrderLineSnapshot[] {
  return items.flatMap((item) => {
    if (!item.selected || (!item.sellable && !item.quoteRequired)) return [];
    if (!Number.isFinite(item.qty) || item.qty <= 0) {
      throw new Error('CART_ITEM_QTY_INVALID');
    }
    const product = getProductById(item.productId);
    if (!product) {
      throw new Error('PRODUCT_NOT_FOUND');
    }
    const subtotalCents = item.sellable ? product.priceCents * item.qty : 0;
    return [
      {
        productId: product.id,
        model: product.model,
        name: product.name,
        partClass: item.partClass,
        qty: item.qty,
        source: item.source,
        selected: item.selected,
        sellable: item.sellable,
        quoteRequired: item.quoteRequired,
        unitPriceCents: product.priceCents,
        subtotalCents,
        currency: product.currency,
      },
    ];
  });
}

export function createOrderFromCart(input: SubmitCartInput): SubmitCartResult {
  const lines = cartItemsToOrderLines(input.items);
  if (lines.length === 0) {
    throw new Error('CART_SELECTION_REQUIRED');
  }
  const quoteLines = lines.filter((line) => line.quoteRequired);
  const billableLines = lines.filter((line) => line.sellable);
  const hasQuoteItems = quoteLines.length > 0;
  const quoteOnlyOrder = hasQuoteItems && billableLines.length === 0;
  const subtotalCents = lines.reduce((sum, line) => sum + line.subtotalCents, 0);
  const now = new Date().toISOString();
  const requiresApproval = input.enterprise.role !== 'admin' && !quoteOnlyOrder;
  const approvalMode: ApprovalMode = requiresApproval
    ? input.enterprise.role === 'buyer'
      ? 'admin-review'
      : 'buyer-review'
    : input.enterprise.role === 'admin'
      ? 'admin-direct'
      : 'not-required';
  const status: OrderStatus = quoteOnlyOrder
    ? 'pending-quote'
    : !requiresApproval
      ? 'pending-payment'
      : 'pending-approval';
  const order: LocalOrderSnapshot = {
    orderNo: nextOrderNo(new Date(now)),
    enterpriseId: input.enterprise.enterpriseId,
    companyName: input.enterprise.companyName,
    projectId: input.projectId,
    projectName: input.projectName,
    handoffId: input.handoffId,
    role: input.enterprise.role,
    approvalMode,
    submittedBy: input.enterprise.contactName,
    approver: status === 'pending-approval' ? '林若安' : undefined,
    approvedBy:
      status === 'pending-payment' && input.enterprise.role === 'admin'
        ? input.enterprise.contactName
        : undefined,
    approvedAt: status === 'pending-payment' && input.enterprise.role === 'admin' ? now : undefined,
    paymentMethod: input.paymentMethod ?? 'corporate',
    lines,
    subtotalCents,
    itemCount: lines.reduce((sum, line) => sum + line.qty, 0),
    submittedAt: now,
    updatedAt: now,
    status,
    shippingAddress: input.shippingAddress,
    invoice: input.invoice,
    note: input.note,
  };
  return { order, hasQuoteItems };
}

export function advanceOrderAction(order: LocalOrderSnapshot): LocalOrderSnapshot {
  const now = new Date().toISOString();
  const nextStatusByAction: Partial<Record<OrderStatus, OrderStatus>> = {
    'pending-quote': 'pending-approval',
    'pending-approval': 'pending-payment',
    'pending-payment': 'shipment-review',
    paid: 'in-production',
    'shipment-review': 'shipped',
    'awaiting-stock': 'shipped',
    'in-production': 'shipped',
    shipped: 'completed',
  };
  const nextStatus = nextStatusByAction[order.status] ?? order.status;
  const patchByStatus: Partial<Record<OrderStatus, Partial<LocalOrderSnapshot>>> = {
    'pending-payment': {
      approvedAt: order.approvedAt ?? now,
    },
    'shipment-review': {
      paidAt: order.paidAt ?? now,
    },
    'in-production': {
      productionStartedAt: order.productionStartedAt ?? now,
    },
    shipped: {
      shippedAt: order.shippedAt ?? now,
      carrier: order.carrier ?? '顺丰速运',
      trackingNo: order.trackingNo ?? `SF${order.orderNo.slice(-10)}`,
    },
    completed: {
      completedAt: order.completedAt ?? now,
    },
  };
  return {
    ...order,
    ...(patchByStatus[nextStatus] ?? {}),
    status: nextStatus,
    updatedAt: now,
  };
}
