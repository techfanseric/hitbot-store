import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { getAccessoryProducts, getProductBySlug, getRelatedProducts, products } from '@/mock-data';
import { getCategoryById } from '@/mock-data/categories';
import { PartClassBadge } from '@/components/store/part-class-badge';
import { StockBadge } from '@/components/store/stock-badge';
import { AddToCartButton } from '@/components/store/add-to-cart-button';
import { ProductGrid } from '@/components/store/product-grid';
import { ProductImage } from '@/components/store/product-image';
import { formatPrice } from '@/lib/format';
import { absoluteStoreUrl, localizedProductPath, publicProductPath } from '@/lib/store-paths';
import type { AppLocale } from '@/i18n/routing';
import type { Product } from '@/types/product';

export async function generateStaticParams() {
  return products.filter((p) => p.catalogVisible).map((p) => ({ slug: p.slug }));
}

interface ProductPageProps {
  params: Promise<{ locale: string; slug: string }>;
}

export async function generateMetadata({ params }: ProductPageProps): Promise<Metadata> {
  const { locale, slug } = await params;
  const product = getProductBySlug(slug);
  const appLocale = locale as AppLocale;
  const isZh = appLocale === 'zh';

  if (!product || !product.catalogVisible) {
    return {
      title: isZh ? '商品不存在' : 'Product not found',
      robots: { index: false, follow: false },
    };
  }

  const name = product.name[appLocale];
  const description = product.seoDescription?.[appLocale] ?? product.description[appLocale];
  const canonical = publicProductPath(product.slug);

  return {
    title: `${name} | ${product.model}`,
    description,
    alternates: {
      canonical,
      languages: {
        zh: localizedProductPath('zh', product.slug),
        en: localizedProductPath('en', product.slug),
      },
    },
    openGraph: {
      title: `${name} | HITBOT`,
      description,
      url: canonical,
      type: 'website',
      images: product.images[0] ? [product.images[0]] : ['/hitbot/logo-header.png'],
    },
  };
}

export default async function ProductPage({ params }: ProductPageProps) {
  const { locale, slug } = await params;
  setRequestLocale(locale);
  const t = await getTranslations('Product');
  const tProducts = await getTranslations('Products');

  const product = getProductBySlug(slug);
  if (!product || !product.catalogVisible) notFound();

  const appLocale = locale as AppLocale;
  const category = getCategoryById(product.category);
  const accessories = getAccessoryProducts(product);
  const related = getRelatedProducts(product.id, product.category);
  const requiresQuote = product.priceCents === 0;
  const outOfStock = product.stock === 'out-of-stock';
  const actionIntent = requiresQuote ? 'quote' : outOfStock ? 'unavailable' : 'cart';
  const priceLabel = requiresQuote
    ? t('requestQuote')
    : formatPrice(product.priceCents, product.currency, locale === 'zh' ? 'zh-CN' : 'en-US');

  return (
    <div className="bg-bg-app">
      <ProductStructuredData product={product} locale={locale as AppLocale} />
      <div className="mx-auto w-[90%] max-w-[1600px] py-10 md:py-14">
        <nav
          className="mb-8 flex flex-wrap items-center gap-2 text-lg"
          aria-label={t('breadcrumb')}
        >
          <Link href={`/${locale}/products`} className="text-text-muted hover:text-brand-500">
            {tProducts('title')}
          </Link>
          {category && (
            <>
              <span className="text-text-disabled">/</span>
              <Link
                href={`/${locale}/products?category=${category.id}`}
                className="text-text-muted hover:text-brand-500"
              >
                {category.name[appLocale]}
              </Link>
            </>
          )}
          <span className="text-text-disabled">/</span>
          <span className="text-text-strong">{product.model}</span>
        </nav>

        <div className="grid grid-cols-1 items-center gap-10 md:grid-cols-[minmax(0,1.05fr)_minmax(360px,0.95fr)] lg:gap-16">
          <div className="bg-bg-surface relative flex aspect-[5/4] items-center justify-center overflow-hidden rounded-lg md:aspect-square">
            <ProductImage
              src={product.images[0]}
              alt={product.name[locale as 'zh' | 'en']}
              model={product.model}
              sizes="(min-width: 768px) 45vw, 90vw"
              imageClassName="p-8 md:p-12"
              fallbackClassName="[&_p]:text-4xl"
              priority
            />
          </div>

          <div className="py-2 md:py-8">
            <div className="space-y-5">
              <p className="text-text-muted text-lg font-medium">{product.model}</p>
              <h1 className="text-text-strong text-4xl leading-tight font-semibold">
                {product.name[appLocale]}
              </h1>

              <div className="flex flex-wrap items-center gap-2">
                <PartClassBadge partClass={product.partClass} />
                <StockBadge stock={product.stock} />
              </div>

              <p
                className={`text-4xl font-semibold tabular-nums ${
                  requiresQuote ? 'text-text-muted' : 'text-text-strong'
                }`}
              >
                {priceLabel}
              </p>

              <p className="text-text max-w-[58ch] text-xl leading-relaxed">
                {product.description[locale as 'zh' | 'en']}
              </p>

              <AddToCartButton
                productId={product.id}
                partClass={product.partClass}
                size="lg"
                className="w-full md:w-auto"
                disabled={outOfStock}
                intent={actionIntent}
                variant={outOfStock ? 'secondary' : 'primary'}
              >
                {requiresQuote ? t('requestQuote') : outOfStock ? t('unavailable') : t('addToCart')}
              </AddToCartButton>
            </div>
          </div>
        </div>

        <section className="mt-12">
          <h2 className="mb-5 text-2xl font-semibold">{t('specs')}</h2>
          <div className="bg-bg-elevated rounded-lg p-3 md:p-4">
            <table className="w-full border-separate border-spacing-y-1 text-lg">
              <tbody>
                {product.specs.map((spec, idx) => (
                  <tr key={idx} className="last:[&_td]:pb-2">
                    <td className="text-text-muted bg-bg-surface py-3 pr-4 pl-3 first:rounded-l-md">
                      {spec.key[locale as 'zh' | 'en']}
                    </td>
                    <td className="text-text-strong bg-bg-surface py-3 pr-3 last:rounded-r-md">
                      {spec.value}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {accessories.length > 0 && (
          <section className="mt-12">
            <div className="mb-5 max-w-2xl">
              <h2 className="text-2xl font-semibold">{t('compatibleAccessories')}</h2>
              <p className="text-text-muted mt-2 text-lg leading-relaxed">
                {t('compatibleAccessoriesHint')}
              </p>
            </div>
            <ProductGrid products={accessories} />
          </section>
        )}

        {related.length > 0 && (
          <section className="mt-12">
            <h2 className="mb-4 text-2xl font-semibold">{t('relatedProducts')}</h2>
            <ProductGrid products={related} />
          </section>
        )}
      </div>
    </div>
  );
}

function ProductStructuredData({ product, locale }: { product: Product; locale: AppLocale }) {
  const description = product.seoDescription?.[locale] ?? product.description[locale];
  const url = absoluteStoreUrl(publicProductPath(product.slug));
  const image = product.images[0] ? absoluteStoreUrl(product.images[0]) : undefined;
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name[locale],
    model: product.model,
    description,
    image,
    url,
    brand: {
      '@type': 'Brand',
      name: 'HITBOT',
    },
    offers:
      product.priceCents > 0
        ? {
            '@type': 'Offer',
            priceCurrency: product.currency,
            price: product.priceCents / 100,
            availability:
              product.stock === 'out-of-stock'
                ? 'https://schema.org/OutOfStock'
                : 'https://schema.org/InStock',
            url,
          }
        : undefined,
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}
