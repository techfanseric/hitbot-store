import { useTranslations } from 'next-intl';
import { Badge } from '@/components/ui/badge';
import type { PartClass } from '@/types/product';

interface PartClassBadgeProps {
  partClass: PartClass;
}

export function PartClassBadge({ partClass }: PartClassBadgeProps) {
  const t = useTranslations('Product');
  const labelMap: Record<PartClass, string> = {
    standard: t('standardPart'),
    custom: t('customPart'),
    reference: t('referencePart'),
  };

  return <Badge variant={partClass}>{labelMap[partClass]}</Badge>;
}
