'use client';

import { ArrowRight, ShoppingCart } from 'lucide-react';
import Link from 'next/link';
import { useLocale, useTranslations } from 'next-intl';
import { useCartSafe } from '@/hooks/use-cart';
import { formatPrice } from '@/lib/format';
import { cn } from '@/lib/utils';
import { getProductById } from '@/mock-data';

interface CartBadgeProps {
  className?: string;
  iconClassName?: string;
}

export function CartBadge({ className, iconClassName }: CartBadgeProps) {
  const t = useTranslations('Cart');
  const locale = useLocale();
  const { count, selectedCount, items, projectName, hydrated } = useCartSafe();
  const hasCartItems = hydrated && items.length > 0;
  const previewItems = items.slice(0, 3);
  const remainingCount = Math.max(0, items.length - previewItems.length);
  const subtotal = items.reduce((sum, item) => {
    const product = getProductById(item.productId);
    if (!product || !item.selected || !item.sellable) return sum;
    return sum + product.priceCents * item.qty;
  }, 0);

  return (
    <div className="group relative">
      <Link
        href={`/${locale}/checkout`}
        data-testid="cart-link"
        aria-label={t('title')}
        className={cn(
          'hover:bg-bg-control-hover text-text-muted hover:text-text relative inline-flex size-[36px] shrink-0 items-center justify-center rounded-md transition-colors',
          className,
        )}
      >
        <ShoppingCart className={cn('size-[20px]', iconClassName)} />
        {hydrated && count > 0 && (
          <span className="bg-brand-500 text-neutral-0 rounded-pill absolute top-0 right-0 flex h-[14px] min-w-[14px] items-center justify-center px-[3px] text-[10px] leading-none font-medium">
            {count}
          </span>
        )}
      </Link>
      <div className="invisible fixed top-[60px] right-5 left-5 z-50 pt-3 opacity-0 transition-opacity group-hover:visible group-hover:opacity-100 group-focus-within:visible group-focus-within:opacity-100 sm:absolute sm:top-full sm:right-0 sm:left-auto">
        <div className="bg-bg-elevated text-text-strong shadow-popover w-full rounded-md p-2 sm:w-[320px]">
          <div className="px-2 py-2">
            <span className="block text-sm font-semibold">{t('title')}</span>
            <span className="text-text-muted mt-1 block truncate text-xs">{projectName}</span>
          </div>
          <div className="bg-divider -mx-1 my-1 h-px" />
          {!hasCartItems ? (
            <div className="px-2 py-5 text-center">
              <p className="text-text-strong text-sm font-medium">{t('empty')}</p>
              <p className="text-text-muted mt-1 text-xs">{t('emptyHint')}</p>
            </div>
          ) : (
            <div className="py-1">
              <div className="divide-divider max-h-[216px] overflow-y-auto divide-y">
                {previewItems.map((item) => {
                  const product = getProductById(item.productId);
                  if (!product) return null;
                  return (
                    <div
                      key={item.productId}
                      className="grid grid-cols-[minmax(0,1fr)_auto] gap-3 px-2 py-2"
                    >
                      <div className="min-w-0">
                        <p className="text-text-strong truncate text-sm font-medium">
                          {product.name[locale as 'zh' | 'en']}
                        </p>
                        <p className="text-text-muted mt-0.5 truncate text-xs">
                          {product.model} · {item.source === 'os' ? t('sourceOs') : t('sourceWeb')}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-text-strong text-sm tabular-nums">x{item.qty}</p>
                        <p className="text-text-muted mt-0.5 text-xs tabular-nums">
                          {item.sellable
                            ? formatPrice(
                                product.priceCents * item.qty,
                                product.currency,
                                locale === 'zh' ? 'zh-CN' : 'en-US',
                              )
                            : item.quoteRequired
                              ? t('quoteOnly')
                              : t('notForSale')}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
              {remainingCount > 0 && (
                <p className="text-text-muted px-2 py-1 text-xs">
                  {t('moreItems', { count: remainingCount })}
                </p>
              )}
            </div>
          )}
          <div className="bg-divider -mx-1 my-1 h-px" />
          <div className="px-2 py-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-text-muted">{t('selectedItems')}</span>
              <span className="text-text-strong">{t('totalItems', { count: selectedCount })}</span>
            </div>
            <div className="mt-1 flex items-center justify-between">
              <span className="text-text-muted text-sm">{t('subtotal')}</span>
              <span className="text-text-strong font-semibold tabular-nums">
                {formatPrice(subtotal, 'CNY', locale === 'zh' ? 'zh-CN' : 'en-US')}
              </span>
            </div>
          </div>
          <div className="bg-divider -mx-1 my-1 h-px" />
          <div className="grid gap-1">
            {hasCartItems ? (
              <Link
                href={`/${locale}/checkout`}
                className="hover:bg-bg-control-hover flex min-h-[36px] items-center justify-between rounded-sm px-2 text-sm transition-colors"
              >
                <span>{t('checkout')}</span>
                <ArrowRight className="size-4" />
              </Link>
            ) : (
              <button
                type="button"
                disabled
                className="text-text-muted bg-bg-control flex min-h-[36px] cursor-not-allowed items-center justify-between rounded-sm px-2 text-sm opacity-60"
              >
                <span>{t('checkout')}</span>
                <ArrowRight className="size-4" />
              </button>
            )}
            <Link
              href={`/${locale}/products`}
              className="hover:bg-bg-control-hover flex min-h-[36px] items-center rounded-sm px-2 text-sm transition-colors"
            >
              {t('continueShopping')}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
