'use client';

import { useLocale, useTranslations } from 'next-intl';
import { Minus, Plus, Trash2 } from 'lucide-react';
import { useCartSafe } from '@/hooks/use-cart';
import { Button } from '@/components/ui/button';
import { getProductById } from '@/mock-data';
import { formatPrice } from '@/lib/format';
import { PartClassBadge } from './part-class-badge';
import { ProductImage } from './product-image';
import type { CartItem } from '@/types/cart';

interface CartItemRowProps {
  item: CartItem;
}

export function CartItemRow({ item }: CartItemRowProps) {
  const t = useTranslations('Cart');
  const locale = useLocale();
  const { setQty, setSelected, remove } = useCartSafe();
  const product = getProductById(item.productId);

  if (!product) return null;

  return (
    <div className="grid grid-cols-[auto_72px_minmax(0,1fr)] gap-3 py-4 sm:grid-cols-[auto_76px_minmax(0,1fr)_auto_auto] sm:items-center">
      <input
        type="checkbox"
        checked={item.selected}
        onChange={(e) => setSelected(item.productId, e.target.checked)}
        aria-label={t('selectItem')}
        className="accent-brand-500 mt-6 size-5 shrink-0 sm:mt-0"
      />
      <div className="bg-bg-surface relative flex size-[72px] shrink-0 items-center justify-center overflow-hidden rounded-md sm:size-[76px]">
        <ProductImage
          src={product.images[0]}
          alt={product.name[locale as 'zh' | 'en']}
          model={product.model}
          sizes="76px"
          imageClassName="p-1 mix-blend-normal"
          fallbackClassName="[&_p]:text-sm"
        />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-text-strong truncate text-sm font-medium">
          {product.name[locale as 'zh' | 'en']}
        </p>
        <div className="mt-1 flex flex-wrap items-center gap-1.5">
          <span className="text-text-muted text-xs">{product.model}</span>
          <PartClassBadge partClass={item.partClass} />
          <span className="text-text-muted bg-bg-control rounded-sm px-2 py-0.5 text-xs">
            {item.source === 'os' ? t('sourceOs') : t('sourceWeb')}
          </span>
          <span className="text-text-muted bg-bg-control rounded-sm px-2 py-0.5 text-xs">
            {t(`syncStatus.${item.syncStatus}`)}
          </span>
          {!item.sellable && (
            <span className="text-text-muted bg-bg-control rounded-md px-2 py-0.5 text-xs">
              {item.quoteRequired ? t('quoteOnly') : t('notForSale')}
            </span>
          )}
        </div>
        <p className="text-text-strong mt-2 text-lg font-semibold tabular-nums">
          {formatPrice(product.priceCents, product.currency, locale === 'zh' ? 'zh-CN' : 'en-US')}
        </p>
      </div>
      <div className="col-start-3 flex items-center gap-1 sm:col-start-auto">
        <Button
          variant="icon"
          size="icon"
          onClick={() => setQty(item.productId, item.qty - 1)}
          aria-label={t('decrease')}
        >
          <Minus className="size-3" />
        </Button>
        <span className="text-text-strong w-8 text-center text-sm" aria-live="polite">
          {item.qty}
        </span>
        <Button
          variant="icon"
          size="icon"
          onClick={() => setQty(item.productId, item.qty + 1)}
          aria-label={t('increase')}
        >
          <Plus className="size-3" />
        </Button>
      </div>
      <Button
        variant="icon"
        size="icon"
        className="col-start-3 justify-self-start sm:col-start-auto"
        onClick={() => remove(item.productId)}
        aria-label={t('remove')}
      >
        <Trash2 className="size-4" />
      </Button>
    </div>
  );
}
