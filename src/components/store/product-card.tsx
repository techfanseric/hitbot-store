'use client';

import Link from 'next/link';
import { useLocale, useTranslations } from 'next-intl';
import { Card } from '@/components/ui/card';
import { StockBadge } from './stock-badge';
import { PartClassBadge } from './part-class-badge';
import { AddToCartButton } from './add-to-cart-button';
import { ProductImage } from './product-image';
import { formatPrice } from '@/lib/format';
import { publicProductPath } from '@/lib/store-paths';
import type { Product } from '@/types/product';

interface ProductCardProps {
  product: Product;
}

export function ProductCard({ product }: ProductCardProps) {
  const locale = useLocale();
  const t = useTranslations('Products');
  const requiresQuote = product.priceCents === 0;
  const outOfStock = product.stock === 'out-of-stock';
  const actionIntent = requiresQuote ? 'quote' : outOfStock ? 'unavailable' : 'cart';
  const keySpecs = product.specs.slice(0, 3);
  const priceLabel = requiresQuote
    ? t('requestQuote')
    : formatPrice(product.priceCents, product.currency, locale === 'zh' ? 'zh-CN' : 'en-US');

  return (
    <Card className="group bg-bg-elevated hover:bg-neutral-0 flex flex-col overflow-hidden rounded-lg p-0 transition-colors duration-200">
      <Link
        href={publicProductPath(product.slug)}
        className="bg-bg-surface relative flex aspect-[3/2] items-center justify-center overflow-hidden md:aspect-[4/3]"
      >
        <ProductImage
          src={product.images[0]}
          alt={product.name[locale as 'zh' | 'en']}
          model={product.model}
          sizes="(min-width: 1536px) 22vw, (min-width: 1024px) 28vw, (min-width: 640px) 48vw, 100vw"
          imageClassName="p-6 transition-transform duration-300 group-hover:scale-[1.035] md:p-7"
        />
      </Link>
      <div className="flex flex-1 flex-col gap-3 p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-text-muted mb-1 truncate text-sm font-medium">{product.model}</p>
            <Link
              href={publicProductPath(product.slug)}
              className="text-text-strong hover:text-brand-500 line-clamp-2 text-base leading-snug font-semibold"
            >
              {product.name[locale as 'zh' | 'en']}
            </Link>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-1.5">
          <PartClassBadge partClass={product.partClass} />
          <StockBadge stock={product.stock} />
        </div>
        <dl className="bg-bg-surface grid grid-cols-1 gap-1 rounded-md p-3 text-sm">
          {keySpecs.map((spec) => (
            <div key={`${spec.key.zh}-${spec.value}`} className="flex justify-between gap-3">
              <dt className="text-text-muted shrink-0">{spec.key[locale as 'zh' | 'en']}</dt>
              <dd className="text-text-strong truncate text-right">{spec.value}</dd>
            </div>
          ))}
        </dl>
        <p
          className={`mt-auto text-2xl font-semibold tabular-nums ${
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
          className="text-text w-full justify-center"
        >
          {requiresQuote ? t('requestQuote') : outOfStock ? t('unavailable') : t('addToCart')}
        </AddToCartButton>
      </div>
    </Card>
  );
}
