'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { Ban, Check, LogIn, MessageCircle, ShoppingCart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useCartSafe } from '@/hooks/use-cart';
import { useProcurementHydrated } from '@/hooks/use-procurement-hydrated';
import { useProcurementStore } from '@/lib/procurement-store';
import { cn } from '@/lib/utils';
import type { PartClass } from '@/types/product';

interface AddToCartButtonProps extends Omit<
  React.ComponentProps<typeof Button>,
  'onClick' | 'children'
> {
  productId: string;
  partClass: PartClass;
  qty?: number;
  intent?: 'cart' | 'quote' | 'unavailable';
  children?: React.ReactNode;
}

export function AddToCartButton({
  productId,
  partClass,
  qty = 1,
  intent = 'cart',
  className,
  children,
  ...buttonProps
}: AddToCartButtonProps) {
  const t = useTranslations('Product');
  const locale = useLocale();
  const router = useRouter();
  const { add } = useCartSafe();
  const authHydrated = useProcurementHydrated();
  const isAuthenticated = useProcurementStore((state) => state.isAuthenticated);
  const [added, setAdded] = useState(false);
  const requiresAccount =
    authHydrated &&
    (intent === 'cart' || intent === 'quote') &&
    !isAuthenticated &&
    !buttonProps.disabled;

  function handleClick(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (intent === 'unavailable') return;
    if (requiresAccount) {
      toast.message(t('signInRequired'));
      const nextPath = `${window.location.pathname}${window.location.search}`;
      router.push(`/${locale}/login?next=${encodeURIComponent(nextPath)}`);
      return;
    }

    const sellable = intent === 'cart' && partClass === 'standard';
    add(productId, partClass, qty, {
      source: 'web',
      sellable,
      selected: true,
      quoteRequired: !sellable,
    });
    setAdded(true);
    toast.success(t('added'));
    setTimeout(() => setAdded(false), 1500);
  }

  return (
    <Button
      variant={added || requiresAccount ? 'secondary' : 'primary'}
      onClick={handleClick}
      className={cn('transition-colors', className)}
      {...buttonProps}
    >
      {added ? (
        <Check className="size-4" />
      ) : requiresAccount ? (
        <LogIn className="size-4" />
      ) : intent === 'quote' ? (
        <MessageCircle className="size-4" />
      ) : intent === 'unavailable' ? (
        <Ban className="size-4" />
      ) : (
        <ShoppingCart className="size-4" />
      )}
      <span>
        {added
          ? t('added')
          : requiresAccount
            ? t(intent === 'quote' ? 'signInToQuote' : 'signInToAdd')
            : (children ?? t('addToCart'))}
      </span>
    </Button>
  );
}
