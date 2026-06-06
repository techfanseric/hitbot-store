import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { Slot } from 'radix-ui';

import { cn } from '@/lib/utils';

/**
 * 状态徽标 10 套变体（与 docs/design/store-design-system.html §09 一致）：
 * - 商城业务：in-stock / out-of-stock / on-sale
 * - OS 端运行：running / compiling / idle / error
 * - 物料清单：standard / custom / reference
 * - 其他：default（品牌色兜底）
 */
const badgeVariants = cva(
  'inline-flex w-fit shrink-0 items-center justify-center gap-1 overflow-hidden rounded-sm px-2 py-0.5 text-xs font-medium whitespace-nowrap transition-colors',
  {
    variants: {
      variant: {
        // 商城业务
        'in-stock': 'bg-state-green/10 text-state-green-strong',
        'out-of-stock': 'bg-bg-control text-text-muted',
        'on-sale': 'bg-state-red-soft text-brand-500',
        // OS 端运行
        running: 'bg-state-green/12 text-state-green-strong',
        compiling: 'bg-state-yellow/20 text-state-yellow-strong',
        idle: 'bg-bg-control text-text-muted',
        error: 'bg-state-red-soft text-state-danger',
        // 物料清单三分类
        standard: 'bg-brand-soft text-brand-500',
        custom: 'bg-state-yellow/20 text-state-yellow-strong',
        reference: 'bg-bg-control text-text-muted',
        // 兜底
        default: 'bg-brand-500 text-neutral-0',
        secondary: 'bg-bg-control text-text',
        outline: 'bg-bg-control text-text',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  },
);

function Badge({
  className,
  variant = 'default',
  asChild = false,
  ...props
}: React.ComponentProps<'span'> & VariantProps<typeof badgeVariants> & { asChild?: boolean }) {
  const Comp = asChild ? Slot.Root : 'span';

  return (
    <Comp
      data-slot="badge"
      data-variant={variant}
      className={cn(badgeVariants({ variant }), className)}
      {...props}
    />
  );
}

export { Badge, badgeVariants };
