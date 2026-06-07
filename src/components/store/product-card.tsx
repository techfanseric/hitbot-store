'use client';

import Link from 'next/link';
import { useLocale, useTranslations } from 'next-intl';
import { Card } from '@/components/ui/card';
import { StockBadge } from './stock-badge';
import { PartClassBadge } from './part-class-badge';
import { AddToCartButton } from './add-to-cart-button';
import { ProductImage } from './product-image';
import { formatPrice } from '@/lib/format';
import type { Product } from '@/types/product';

interface ProductCardProps {
  product: Product;
  variant?: 'default' | 'compact';
}

export function ProductCard({ product, variant = 'default' }: ProductCardProps) {
  const locale = useLocale();
  const t = useTranslations('Products');
  const requiresQuote = product.priceCents === 0;
  const outOfStock = product.stock === 'out-of-stock';
  const actionIntent = requiresQuote ? 'quote' : outOfStock ? 'unavailable' : 'cart';
  const priceLabel = requiresQuote
    ? t('requestQuote')
    : formatPrice(product.priceCents, product.currency, locale === 'zh' ? 'zh-CN' : 'en-US');

  const compact = variant === 'compact';
  const productHref = `/${locale}/products/${product.slug}`;

  return (
    <Card
      className={
        compact
          ? 'group bg-bg-elevated hover:bg-neutral-0 grid grid-cols-[96px_minmax(0,1fr)] overflow-hidden rounded-lg p-0 transition-colors duration-200 sm:grid-cols-[112px_minmax(0,1fr)]'
          : 'group bg-bg-elevated hover:bg-neutral-0 grid grid-cols-[104px_minmax(0,1fr)] overflow-hidden rounded-lg p-0 transition-colors duration-200 sm:grid-cols-[112px_minmax(0,1fr)]'
      }
    >
      <Link
        href={productHref}
        className="bg-bg-surface relative flex min-h-[148px] items-center justify-center overflow-hidden sm:min-h-[160px]"
      >
        <ProductImage
          src={product.images[0]}
          alt={product.name[locale as 'zh' | 'en']}
          model={product.model}
          sizes="(min-width: 1536px) 22vw, (min-width: 1024px) 28vw, (min-width: 640px) 48vw, 100vw"
          imageClassName="p-3 transition-transform duration-300 group-hover:scale-[1.035] sm:p-4"
        />
      </Link>
      <div className="min-w-0 flex flex-1 flex-col gap-2 p-3 sm:p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-text-muted mb-1 truncate text-xs font-medium sm:text-sm">
              {product.model}
            </p>
            <Link
              href={productHref}
              className="text-text-strong hover:text-brand-500 inline-flex min-h-[36px] items-center text-base leading-snug font-semibold"
            >
              <span className="line-clamp-2">{product.name[locale as 'zh' | 'en']}</span>
            </Link>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-1.5">
          <PartClassBadge partClass={product.partClass} />
          <StockBadge stock={product.stock} />
        </div>
        <p
          className={`mt-auto text-xl font-semibold tabular-nums ${
            requiresQuote ? 'text-text-muted' : 'text-text-strong'
          }`}
        >
          {priceLabel}
        </p>
        <AddToCartButton
          productId={product.id}
          partClass={product.partClass}
          disabled={outOfStock}
          intent={actionIntent}
          variant="secondary"
          size="md"
          className={
            compact
              ? 'text-text w-full justify-center text-sm'
              : 'text-text w-fit max-w-full justify-center text-sm'
          }
        >
          {requiresQuote ? t('requestQuote') : outOfStock ? t('unavailable') : t('addToCart')}
        </AddToCartButton>
      </div>
    </Card>
  );
}
