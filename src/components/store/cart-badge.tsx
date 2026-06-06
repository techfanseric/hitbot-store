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
        href="/store/cart"
        data-testid="cart-link"
        aria-label={t('title')}
        className={cn(
          'hover:bg-bg-control-hover text-text-muted hover:text-text relative inline-flex size-9 shrink-0 items-center justify-center rounded-md transition-colors',
          className,
        )}
      >
        <ShoppingCart className={cn('size-[20px]', iconClassName)} />
        {hydrated && count > 0 && (
          <span className="bg-brand-500 text-neutral-0 rounded-pill absolute top-0 right-0 flex h-4 min-w-4 translate-x-1/3 -translate-y-1/3 items-center justify-center px-1 text-xs font-medium">
            {count}
          </span>
        )}
      </Link>
      <div className="invisible absolute top-full right-0 z-50 pt-3 opacity-0 transition-opacity group-hover:visible group-hover:opacity-100 group-focus-within:visible group-focus-within:opacity-100">
        <div className="bg-bg-elevated text-text-strong shadow-popover w-[320px] rounded-md p-2">
          <div className="px-2 py-2">
            <span className="block text-sm font-semibold">{t('title')}</span>
            <span className="text-text-muted mt-1 block truncate text-xs">{projectName}</span>
          </div>
          <div className="bg-divider -mx-1 my-1 h-px" />
        {!hydrated || items.length === 0 ? (
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
            <Link
              href="/store/checkout"
              className="hover:bg-bg-control-hover flex min-h-[32px] items-center justify-between rounded-sm px-2 text-sm transition-colors"
            >
              <span>{t('checkout')}</span>
              <ArrowRight className="size-4" />
            </Link>
            <Link
              href="/store/products"
              className="hover:bg-bg-control-hover flex min-h-[32px] items-center rounded-sm px-2 text-sm transition-colors"
            >
              {t('continueShopping')}
            </Link>
            <Link
              href="/store/cart"
              className="hover:bg-bg-control-hover flex min-h-[32px] items-center rounded-sm px-2 text-sm transition-colors"
            >
              {t('viewCart')}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
