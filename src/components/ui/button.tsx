import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { Slot } from 'radix-ui';

import { cn } from '@/lib/utils';

/**
 * 按钮 4 套变体（与 docs/design/store-design-system.html §06 一致）：
 * - primary：实心品牌色，主操作
 * - secondary：灰色填充，次操作
 * - subtle：透明背景，文字按钮
 * - icon：方块图标按钮
 */
const buttonVariants = cva(
  "inline-flex shrink-0 items-center justify-center gap-2 rounded-md font-medium whitespace-nowrap transition-[background-color,color,opacity,transform] duration-200 outline-none focus-visible:ring-2 focus-visible:ring-brand-500/35 disabled:pointer-events-none disabled:opacity-45 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        primary: 'bg-brand-500 text-neutral-0 hover:bg-brand-600 active:translate-y-px',
        secondary: 'bg-bg-control text-text hover:bg-bg-control-hover active:translate-y-px',
        subtle:
          'bg-transparent text-text-muted hover:bg-bg-control-hover hover:text-text active:translate-y-px',
        icon: 'bg-transparent text-text-muted hover:bg-bg-control-hover hover:text-text',
        destructive: 'bg-brand-500 text-neutral-0 hover:bg-brand-600',
      },
      size: {
        sm: 'h-[32px] px-3 text-md',
        md: 'h-[40px] px-4 text-lg',
        lg: 'h-[44px] px-5 text-lg',
        icon: 'size-[40px] p-0',
      },
      shape: {
        square: 'rounded-md',
        pill: 'rounded-pill',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'md',
      shape: 'square',
    },
  },
);

function Button({
  className,
  variant = 'primary',
  size = 'md',
  shape = 'square',
  asChild = false,
  ...props
}: React.ComponentProps<'button'> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean;
  }) {
  const Comp = asChild ? Slot.Root : 'button';

  return (
    <Comp
      data-slot="button"
      data-variant={variant}
      data-size={size}
      data-shape={shape}
      className={cn(buttonVariants({ variant, size, shape, className }))}
      {...props}
    />
  );
}

export { Button, buttonVariants };
