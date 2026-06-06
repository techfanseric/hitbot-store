import { useTranslations } from 'next-intl';
import { Badge } from '@/components/ui/badge';
import type { Stock } from '@/types/product';

interface StockBadgeProps {
  stock: Stock;
}

export function StockBadge({ stock }: StockBadgeProps) {
  const t = useTranslations('Products');
  const variantMap: Record<Stock, 'in-stock' | 'out-of-stock' | 'on-sale'> = {
    'in-stock': 'in-stock',
    'out-of-stock': 'out-of-stock',
    preorder: 'on-sale',
  };
  const labelMap: Record<Stock, string> = {
    'in-stock': t('inStock'),
    'out-of-stock': t('outOfStock'),
    preorder: t('onSale'),
  };

  return <Badge variant={variantMap[stock]}>{labelMap[stock]}</Badge>;
}
