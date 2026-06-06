'use client';

import Image from 'next/image';
import { useState } from 'react';
import { cn } from '@/lib/utils';

interface ProductImageProps {
  src?: string;
  alt: string;
  model: string;
  sizes: string;
  priority?: boolean;
  imageClassName?: string;
  fallbackClassName?: string;
}

export function ProductImage({
  src,
  alt,
  model,
  sizes,
  priority,
  imageClassName,
  fallbackClassName,
}: ProductImageProps) {
  const [failed, setFailed] = useState(false);

  if (src && !failed) {
    return (
      <Image
        src={src}
        alt={alt}
        fill
        sizes={sizes}
        className={cn('object-contain mix-blend-multiply', imageClassName)}
        priority={priority}
        onError={() => setFailed(true)}
      />
    );
  }

  return (
    <div
      className={cn(
        'absolute inset-0 flex items-center justify-center p-4 text-center',
        fallbackClassName,
      )}
      role="img"
      aria-label={alt}
    >
      <div>
        <p className="text-text-strong text-lg font-semibold tracking-normal">{model}</p>
        <div className="bg-divider mx-auto mt-3 h-px w-10" />
      </div>
    </div>
  );
}
