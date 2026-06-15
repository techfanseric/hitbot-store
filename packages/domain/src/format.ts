import type { Currency, Locale, OrderStatus, PartClass, Stock } from './types';

export function localized<T extends { zh: string; en: string }>(value: T, locale: Locale = 'zh') {
  return value[locale];
}

export function formatPrice(cents: number, currency: Currency = 'CNY', locale: Locale = 'zh') {
  if (cents <= 0) return locale === 'zh' ? '询价' : 'Quote';
  return new Intl.NumberFormat(locale === 'zh' ? 'zh-CN' : 'en-US', {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  }).format(cents / 100);
}

export function stockLabel(stock: Stock) {
  return {
    'in-stock': '现货',
    preorder: '预订',
    'out-of-stock': '缺货',
  }[stock];
}

export function partClassLabel(partClass: PartClass) {
  return {
    standard: '标准件',
    custom: '加工件',
    reference: '参考件',
  }[partClass];
}

export function orderStatusLabel(status: OrderStatus) {
  return {
    'pending-quote': '待报价',
    'pending-approval': '待审批',
    'pending-payment': '待付款',
    paid: '已付款',
    'in-production': '生产中',
    shipped: '待收货',
    completed: '已完成',
  }[status];
}
