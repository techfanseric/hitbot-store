import type { AppLocale } from '@/i18n/routing';

export const SITE_ORIGIN = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://www.hitbot.cc';
export const PUBLIC_PRODUCTS_PATH = '/store/products';

export function publicProductPath(slug: string): string {
  return `${PUBLIC_PRODUCTS_PATH}/${slug}`;
}

export function localizedProductPath(locale: AppLocale, slug: string): string {
  return `/${locale}/products/${slug}`;
}

export function localizedProductsPath(locale: AppLocale): string {
  return `/${locale}/products`;
}

export function absoluteStoreUrl(path: string): string {
  return new URL(path, SITE_ORIGIN).toString();
}
