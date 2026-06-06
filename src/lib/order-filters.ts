export type OrderTimeFilter = 'all' | '7d' | '30d' | 'month';

export function matchesOrderTimeFilter(value: string, filter: OrderTimeFilter, now = new Date()) {
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
