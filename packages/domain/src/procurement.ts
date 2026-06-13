import { getProductById } from './products';
import type {
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
  return `HB${stamp}`;
}

export function cartItemsToOrderLines(items: CartItem[]): OrderLineSnapshot[] {
  return items.flatMap((item) => {
    if (!item.selected) return [];
    const product = getProductById(item.productId);
    if (!product) return [];
    const subtotalCents = item.sellable ? product.priceCents * item.qty : 0;
    return [
      {
        productId: product.id,
        model: product.model,
        name: product.name,
        partClass: item.partClass,
        qty: item.qty,
        source: item.source,
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
  const hasQuoteItems = lines.some((line) => line.quoteRequired);
  const subtotalCents = lines.reduce((sum, line) => sum + line.subtotalCents, 0);
  const now = new Date().toISOString();
  const status: OrderStatus =
    input.enterprise.role === 'engineer'
      ? 'pending-approval'
      : hasQuoteItems && subtotalCents === 0
        ? 'pending-quote'
        : input.enterprise.role === 'admin'
          ? 'pending-payment'
          : 'pending-approval';
  const order: LocalOrderSnapshot = {
    orderNo: nextOrderNo(new Date(now)),
    enterpriseId: input.enterprise.enterpriseId,
    companyName: input.enterprise.companyName,
    projectId: input.projectId,
    projectName: input.projectName,
    role: input.enterprise.role,
    submittedBy: input.enterprise.contactName,
    approver: input.enterprise.role === 'admin' ? input.enterprise.contactName : '林若安',
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
    'pending-payment': 'paid',
    paid: 'in-production',
    'in-production': 'shipped',
    shipped: 'completed',
  };
  const nextStatus = nextStatusByAction[order.status] ?? order.status;
  const patchByStatus: Partial<Record<OrderStatus, Partial<LocalOrderSnapshot>>> = {
    'pending-payment': {
      approvedAt: order.approvedAt ?? now,
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
