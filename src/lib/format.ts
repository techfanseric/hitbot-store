/**
 * 货币格式化（i18n 感知）
 */
export function formatPrice(
  cents: number,
  currency: 'CNY' | 'USD' = 'CNY',
  locale: string = 'zh-CN',
): string {
  if (cents === 0) return '-';
  const amount = cents / 100;
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  }).format(amount);
}

/**
 * 简短日期格式：2026-02-10
 */
export function formatDate(iso: string, locale: string = 'zh-CN'): string {
  return new Intl.DateTimeFormat(locale, {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date(iso));
}
