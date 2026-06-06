import * as React from 'react';

import { cn } from '@/lib/utils';

function Input({ className, type, ...props }: React.ComponentProps<'input'>) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        'bg-bg-control text-text-strong selection:bg-brand-soft selection:text-text-strong file:text-text-strong placeholder:text-text-muted h-[40px] w-full min-w-0 rounded-md px-3 py-2 text-lg transition-[background-color,box-shadow] outline-none file:inline-flex file:h-[28px] file:border-0 file:bg-transparent file:text-sm file:font-medium disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-45',
        'hover:bg-bg-control-hover focus-visible:ring-brand-500/35 focus-visible:ring-2',
        'aria-invalid:ring-state-danger/35 aria-invalid:ring-2',
        className,
      )}
      {...props}
    />
  );
}

export { Input };
