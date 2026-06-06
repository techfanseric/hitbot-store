import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { CategoryFilter } from '@/components/store/category-filter';
import { ProductGrid } from '@/components/store/product-grid';
import { products } from '@/mock-data';
import { localizedProductsPath, PUBLIC_PRODUCTS_PATH } from '@/lib/store-paths';
import type { AppLocale } from '@/i18n/routing';
import type { PartClass, Product, ProductCategory, Stock } from '@/types/product';

interface ProductsPageProps {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{
    category?: string;
    partClass?: string;
    stock?: string;
    payload?: string;
    reach?: string;
    stroke?: string;
    gripForce?: string;
    dof?: string;
  }>;
}

function numberParam(value: string | undefined): number | null {
  if (!value) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function productMatchesSelection(
  product: Product,
  filters: {
    category?: string;
    partClass?: string;
    stock?: string;
    payload: number | null;
    reach: number | null;
    stroke: number | null;
    gripForce: number | null;
    dof: number | null;
  },
) {
  if (filters.category && product.category !== (filters.category as ProductCategory)) return false;
  if (filters.partClass && product.partClass !== (filters.partClass as PartClass)) return false;
  if (filters.stock && product.stock !== (filters.stock as Stock)) return false;
  if (filters.payload !== null && (product.selection?.payloadKg ?? 0) < filters.payload)
    return false;
  if (filters.reach !== null && (product.selection?.reachMm ?? 0) < filters.reach) return false;
  if (filters.stroke !== null && (product.selection?.strokeMm ?? 0) < filters.stroke) return false;
  if (filters.gripForce !== null && (product.selection?.gripForceN ?? 0) < filters.gripForce)
    return false;
  if (filters.dof !== null && product.selection?.dof !== filters.dof) return false;

  return true;
}

export async function generateMetadata({ params }: ProductsPageProps): Promise<Metadata> {
  const { locale } = await params;
  const appLocale = locale as AppLocale;
  const isZh = appLocale === 'zh';
  const title = isZh ? '产品中心' : 'Products';
  const description = isZh
    ? 'HITBOT 官方产品中心，在线选购机器人末端执行器、协作机械臂、灵巧手和智能模组。'
    : 'Official HITBOT product center for robotic end-effectors, collaborative arms, dexterous hands, and smart modules.';

  return {
    title,
    description,
    alternates: {
      canonical: PUBLIC_PRODUCTS_PATH,
      languages: {
        zh: localizedProductsPath('zh'),
        en: localizedProductsPath('en'),
      },
    },
    openGraph: {
      title,
      description,
      url: PUBLIC_PRODUCTS_PATH,
      type: 'website',
      images: ['/hitbot/os/simulation-3c.jpg'],
    },
  };
}

export default async function ProductsPage({ params, searchParams }: ProductsPageProps) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations('Products');
  const paramsValue = await searchParams;
  const filters = {
    category: paramsValue.category,
    partClass: paramsValue.partClass,
    stock: paramsValue.stock,
    payload: numberParam(paramsValue.payload),
    reach: numberParam(paramsValue.reach),
    stroke: numberParam(paramsValue.stroke),
    gripForce: numberParam(paramsValue.gripForce),
    dof: numberParam(paramsValue.dof),
  };

  const catalogProducts = products.filter((p) => p.catalogVisible);
  const filtered = catalogProducts.filter((product) => productMatchesSelection(product, filters));

  return (
    <div className="bg-bg-app">
      <div className="mx-auto w-[90%] max-w-[1600px] py-10 md:py-14">
        <div className="mb-10 flex items-end justify-between gap-4">
          <div>
            <p className="text-brand-500 mb-3 text-lg font-medium">HITBOT Store</p>
            <h1 className="text-text-strong text-4xl font-semibold">{t('title')}</h1>
            <p className="text-text-muted mt-3 max-w-2xl text-lg leading-relaxed">
              {t('selectionSubtitle')}
            </p>
          </div>
          <span className="text-text-muted text-lg whitespace-nowrap tabular-nums">
            {t('resultCount', { count: filtered.length })}
          </span>
        </div>
        <div className="grid grid-cols-1 gap-8 md:grid-cols-[260px_1fr] lg:gap-10">
          <CategoryFilter />
          <div>
            {filtered.length === 0 ? (
              <p className="text-text-muted bg-bg-surface rounded-lg py-12 text-center text-lg">
                {t('noResults')}
              </p>
            ) : (
              <ProductGrid products={filtered} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
