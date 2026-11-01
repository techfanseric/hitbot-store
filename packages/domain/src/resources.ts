/** File sizes are metadata: rendering a product never requests its files. */
export function formatResourceSize(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes <= 0) return '';
  const units = ['B', 'KB', 'MB', 'GB'];
  const index = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  const size = bytes / 1024 ** index;
  return `${Number(size.toFixed(index === 0 || size >= 10 ? 0 : 1))} ${units[index]}`;
}

/** Stable storefront page, rather than an expiring storage download URL. */
export function productResourcesPath(slug: string): string {
  return `/store/products/${encodeURIComponent(slug)}#product-resources`;
}
