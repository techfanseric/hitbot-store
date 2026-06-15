import { getProductById } from './products';
import type { EnterpriseProfile, LocalOrderSnapshot, OrderLineSnapshot } from './types';

export const defaultProfile: EnterpriseProfile = {
  enterpriseId: 'ENT-HITBOT-CUSTOMER',
  companyName: '深圳智造装备有限公司',
  role: 'buyer',
  contactName: '陈思远',
  phone: '15507540989',
  email: 'buyer@customer.example',
  signedInAt: null,
};

function orderLine(
  productId: string,
  qty: number,
  options: Partial<
    Pick<OrderLineSnapshot, 'partClass' | 'source' | 'sellable' | 'quoteRequired'>
  > = {},
): OrderLineSnapshot {
  const product = getProductById(productId);
  if (!product) throw new Error(`Unknown product id: ${productId}`);

  const sellable = options.sellable ?? product.partClass === 'standard';
  return {
    productId: product.id,
    model: product.model,
    name: product.name,
    partClass: options.partClass ?? product.partClass,
    qty,
    source: options.source,
    selected: true,
    sellable,
    quoteRequired: options.quoteRequired ?? !sellable,
    unitPriceCents: product.priceCents,
    subtotalCents: sellable ? product.priceCents * qty : 0,
    currency: product.currency,
  };
}

export const orders: LocalOrderSnapshot[] = [
  {
    orderNo: 'HB20260601093001',
    enterpriseId: defaultProfile.enterpriseId,
    companyName: defaultProfile.companyName,
    projectId: 'line-pack-01',
    projectName: '包装线上料工位改造',
    role: 'engineer',
    submittedBy: '周亦辰',
    approver: '林若安',
    paymentMethod: 'corporate',
    lines: [orderLine('p-004', 2, { source: 'os' }), orderLine('p-002', 2, { source: 'os' })],
    subtotalCents: 4240000,
    itemCount: 4,
    submittedAt: '2026-06-01T01:30:00.000Z',
    updatedAt: '2026-06-01T01:30:00.000Z',
    status: 'pending-approval',
  },
  {
    orderNo: 'HB20260602143018',
    enterpriseId: defaultProfile.enterpriseId,
    companyName: defaultProfile.companyName,
    projectId: 'sort-cell-02',
    projectName: '分拣单元末端执行器补充',
    role: 'buyer',
    submittedBy: defaultProfile.contactName,
    approver: '林若安',
    paymentMethod: 'corporate',
    lines: [orderLine('p-008', 2)],
    subtotalCents: 1160000,
    itemCount: 2,
    submittedAt: '2026-06-02T06:30:18.000Z',
    updatedAt: '2026-06-02T06:35:00.000Z',
    status: 'pending-payment',
  },
  {
    orderNo: 'HB20260603161042',
    enterpriseId: defaultProfile.enterpriseId,
    companyName: defaultProfile.companyName,
    projectId: 'lab-fixture-03',
    projectName: '实验室测试夹具升级',
    role: 'engineer',
    submittedBy: '周亦辰',
    paymentMethod: 'corporate',
    lines: [
      orderLine('p-010', 1, {
        partClass: 'custom',
        source: 'os',
        sellable: false,
        quoteRequired: true,
      }),
    ],
    subtotalCents: 0,
    itemCount: 1,
    submittedAt: '2026-06-03T07:50:42.000Z',
    updatedAt: '2026-06-03T08:05:00.000Z',
    status: 'pending-quote',
  },
];
