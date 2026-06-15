import { getRelatedProducts as getDomainRelatedProducts, type Product } from '@hitbot/domain';

export {
  getAccessoryProducts,
  getFeaturedProducts,
  getProductById,
  getProductBySlug,
  getProductsByCategory,
  products,
} from '@hitbot/domain';

export function getRelatedProducts(productId: string, category: string, limit = 4): Product[] {
  return getDomainRelatedProducts(productId, category, limit);
}
