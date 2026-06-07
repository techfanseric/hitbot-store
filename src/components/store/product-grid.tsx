import { ProductCard } from './product-card';
import type { Product } from '@/types/product';

interface ProductGridProps {
  products: Product[];
  variant?: 'default' | 'compact';
}

export function ProductGrid({ products, variant = 'default' }: ProductGridProps) {
  return (
    <div
      className={
        variant === 'compact'
          ? 'grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3'
          : 'grid grid-cols-1 gap-3 min-[900px]:grid-cols-2 min-[900px]:gap-4 xl:grid-cols-3'
      }
    >
      {products.map((p) => (
        <ProductCard key={p.id} product={p} variant={variant} />
      ))}
    </div>
  );
}
