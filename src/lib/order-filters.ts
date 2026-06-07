export type OrderTimeFilter = 'all' | '7d' | '30d' | 'month' | 'custom';

export interface OrderDateRange {
  from?: string;
  to?: string;
}

function parseDateStart(value?: string) {
  if (!value) return null;
  const date = new Date(`${value}T00:00:00`);
  return Number.isNaN(date.getTime()) ? null : date;
}

function parseDateEnd(value?: string) {
  if (!value) return null;
  const date = new Date(`${value}T23:59:59.999`);
  return Number.isNaN(date.getTime()) ? null : date;
}

function matchesCustomDateRange(value: string, range?: OrderDateRange) {
  const submittedAt = new Date(value);
  if (Number.isNaN(submittedAt.getTime())) return false;

  const from = parseDateStart(range?.from);
  const to = parseDateEnd(range?.to);

  if (from && submittedAt < from) return false;
  if (to && submittedAt > to) return false;
  return true;
}

export function matchesOrderTimeFilter(
  value: string,
  filter: OrderTimeFilter,
  now = new Date(),
  range?: OrderDateRange,
) {
  if (filter === 'custom') return matchesCustomDateRange(value, range);
  if (filter === 'all') return true;

  const submittedAt = new Date(value);
  if (Number.isNaN(submittedAt.getTime())) return false;

  if (filter === 'month') {
    return (
      submittedAt.getFullYear() === now.getFullYear() && submittedAt.getMonth() === now.getMonth()
    );
  }

  const days = filter === '7d' ? 7 : 30;
  return now.getTime() - submittedAt.getTime() <= days * 24 * 60 * 60 * 1000;
}
