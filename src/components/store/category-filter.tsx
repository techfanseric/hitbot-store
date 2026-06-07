'use client';

import type { ReactNode } from 'react';
import { useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { useRouter, useSearchParams } from 'next/navigation';
import { ChevronDown } from 'lucide-react';
import { categories } from '@/mock-data';
import { products } from '@/mock-data/products';
import { cn } from '@/lib/utils';
import type { PartClass, ProductCategory, Stock } from '@/types/product';

const partClassOptions: PartClass[] = ['standard', 'custom'];
const stockOptions: Stock[] = ['in-stock', 'preorder', 'out-of-stock'];
const payloadOptions = ['2', '3', '8'];
const reachOptions = ['500', '1000'];
const strokeOptions = ['8', '20', '50'];
const gripForceOptions = ['40', '80'];
const dofOptions = ['4', '6'];
const secondaryFilterKeys = [
  'partClass',
  'stock',
  'payload',
  'reach',
  'stroke',
  'gripForce',
  'dof',
];
const catalogProducts = products.filter((product) => product.catalogVisible);

export function CategoryFilter() {
  const t = useTranslations('Products');
  const locale = useLocale();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const validIds = new Set<ProductCategory>(categories.map((c) => c.id));
  const raw = searchParams.get('category');
  const active = raw && validIds.has(raw as ProductCategory) ? (raw as ProductCategory) : null;
  const hasActiveFilters = searchParams.toString().length > 0;
  const hasSecondaryFilters = secondaryFilterKeys.some((key) => searchParams.has(key));
  const showLinkedFilters = Boolean(active) || hasSecondaryFilters;
  const productsInScope = active
    ? catalogProducts.filter((product) => product.category === active)
    : catalogProducts;
  const availableKeys = new Set(availableFilterKeys(productsInScope));
  const localizedProductsPath = `/${locale}/products`;

  function pushParams(params: URLSearchParams) {
    const query = params.toString();
    router.push(query ? `${localizedProductsPath}?${query}` : localizedProductsPath);
  }

  function toggleParam(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (params.get(key) === value) {
      params.delete(key);
    } else {
      params.set(key, value);
    }

    if (key === 'category') {
      const category = params.get('category') as ProductCategory | null;
      const nextScope = category
        ? catalogProducts.filter((product) => product.category === category)
        : catalogProducts;
      const nextAvailableKeys = new Set(availableFilterKeys(nextScope));
      secondaryFilterKeys.forEach((filterKey) => {
        if (!nextAvailableKeys.has(filterKey)) params.delete(filterKey);
      });
    }

    pushParams(params);
  }

  function clearFilters() {
    router.push(localizedProductsPath);
  }

  return (
    <aside className="self-start bg-transparent">
      <div className="mb-[12px] flex items-center justify-between gap-[12px]">
        <h3 className="text-text-strong text-lg font-semibold">{t('selectionTitle')}</h3>
        {hasActiveFilters && (
          <button
            type="button"
            onClick={clearFilters}
            className="text-text-muted hover:text-brand-500 inline-flex min-h-[36px] min-w-[36px] items-center justify-end text-sm"
          >
            {t('clearFilters')}
          </button>
        )}
      </div>

      <div className="mb-[12px] lg:mb-[16px]">
        <p className="text-text-muted mb-[8px] text-sm font-medium lg:mb-[12px]">
          {t('majorCategory')}
        </p>
        <div className="flex gap-[8px] overflow-x-auto pb-[4px] lg:grid lg:grid-cols-2 lg:overflow-visible lg:pb-0">
          <CategoryButton active={!active} count={catalogProducts.length} onClick={clearFilters}>
            {t('allCategories')}
          </CategoryButton>
          {categories.map((cat) => (
            <CategoryButton
              key={cat.id}
              active={active === cat.id}
              count={countForCategory(cat.id, searchParams)}
              onClick={() => toggleParam('category', cat.id)}
            >
              {cat.name[locale as 'zh' | 'en']}
            </CategoryButton>
          ))}
        </div>
      </div>

      <div className="border-divider border-t pt-[12px] lg:pt-[20px]">
        <button
          type="button"
          className="flex min-h-[40px] w-full items-center justify-between gap-[12px] text-left lg:hidden"
          onClick={() => setAdvancedOpen((value) => !value)}
          aria-expanded={advancedOpen}
        >
          <span>
            <span className="text-text-strong block text-sm font-semibold">
              {t('linkedFilters')}
            </span>
            <span className="text-text-muted mt-[2px] block text-sm leading-snug">
              {active ? t('linkedFiltersHint') : t('chooseCategoryHint')}
            </span>
          </span>
          <ChevronDown
            className={cn('size-4 shrink-0 transition-transform', advancedOpen && 'rotate-180')}
          />
        </button>
        <div className={cn('hidden lg:block', showLinkedFilters && 'mb-[12px]')}>
          <p className="text-text-strong text-sm font-semibold">{t('linkedFilters')}</p>
          <p className="text-text-muted mt-[4px] text-sm leading-relaxed">
            {active ? t('linkedFiltersHint') : t('chooseCategoryHint')}
          </p>
        </div>

        <div
          className={cn(
            'grid transition-[grid-template-rows,opacity] duration-200',
            advancedOpen ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0',
            showLinkedFilters && 'lg:block lg:opacity-100',
            !showLinkedFilters && 'lg:hidden',
          )}
        >
          <div className="overflow-hidden lg:overflow-visible">
            {availableKeys.has('partClass') && (
              <FilterGroup title={t('partClass')}>
                {partClassOptions
                  .filter((option) => hasOption(productsInScope, 'partClass', option))
                  .map((option) => (
                    <FilterButton
                      key={option}
                      active={searchParams.get('partClass') === option}
                      onClick={() => toggleParam('partClass', option)}
                    >
                      {t(`partClassOption.${option}`)}
                    </FilterButton>
                  ))}
              </FilterGroup>
            )}

            {availableKeys.has('stock') && (
              <FilterGroup title={t('stock')}>
                {stockOptions
                  .filter((option) => hasOption(productsInScope, 'stock', option))
                  .map((option) => (
                    <FilterButton
                      key={option}
                      active={searchParams.get('stock') === option}
                      onClick={() => toggleParam('stock', option)}
                    >
                      {t(`stockOption.${option}`)}
                    </FilterButton>
                  ))}
              </FilterGroup>
            )}

            {availableKeys.has('payload') && (
              <FilterGroup title={t('payload')}>
                {payloadOptions
                  .filter((option) => hasSelectionThreshold(productsInScope, 'payloadKg', option))
                  .map((option) => (
                    <FilterButton
                      key={option}
                      active={searchParams.get('payload') === option}
                      onClick={() => toggleParam('payload', option)}
                    >
                      {t('payloadAtLeast', { value: option })}
                    </FilterButton>
                  ))}
              </FilterGroup>
            )}

            {availableKeys.has('reach') && (
              <FilterGroup title={t('reach')}>
                {reachOptions
                  .filter((option) => hasSelectionThreshold(productsInScope, 'reachMm', option))
                  .map((option) => (
                    <FilterButton
                      key={option}
                      active={searchParams.get('reach') === option}
                      onClick={() => toggleParam('reach', option)}
                    >
                      {t('reachAtLeast', { value: option })}
                    </FilterButton>
                  ))}
              </FilterGroup>
            )}

            {availableKeys.has('stroke') && (
              <FilterGroup title={t('stroke')}>
                {strokeOptions
                  .filter((option) => hasSelectionThreshold(productsInScope, 'strokeMm', option))
                  .map((option) => (
                    <FilterButton
                      key={option}
                      active={searchParams.get('stroke') === option}
                      onClick={() => toggleParam('stroke', option)}
                    >
                      {t('strokeAtLeast', { value: option })}
                    </FilterButton>
                  ))}
              </FilterGroup>
            )}

            {availableKeys.has('gripForce') && (
              <FilterGroup title={t('gripForce')}>
                {gripForceOptions
                  .filter((option) => hasSelectionThreshold(productsInScope, 'gripForceN', option))
                  .map((option) => (
                    <FilterButton
                      key={option}
                      active={searchParams.get('gripForce') === option}
                      onClick={() => toggleParam('gripForce', option)}
                    >
                      {t('gripForceAtLeast', { value: option })}
                    </FilterButton>
                  ))}
              </FilterGroup>
            )}

            {availableKeys.has('dof') && (
              <FilterGroup title={t('dof')}>
                {dofOptions
                  .filter((option) => hasSelectionValue(productsInScope, 'dof', option))
                  .map((option) => (
                    <FilterButton
                      key={option}
                      active={searchParams.get('dof') === option}
                      onClick={() => toggleParam('dof', option)}
                    >
                      {t('dofValue', { value: option })}
                    </FilterButton>
                  ))}
              </FilterGroup>
            )}
          </div>
        </div>
      </div>
    </aside>
  );
}

function countForCategory(category: ProductCategory, searchParams: URLSearchParams) {
  const scope = catalogProducts.filter((product) => product.category === category);
  const availableKeys = new Set(availableFilterKeys(scope));
  const params = new URLSearchParams(searchParams.toString());
  params.delete('category');
  secondaryFilterKeys.forEach((key) => {
    if (!availableKeys.has(key)) params.delete(key);
  });

  return scope.filter((product) => {
    if (params.get('partClass') && product.partClass !== params.get('partClass')) return false;
    if (params.get('stock') && product.stock !== params.get('stock')) return false;
    if (
      params.get('payload') &&
      (product.selection?.payloadKg ?? 0) < Number(params.get('payload'))
    )
      return false;
    if (params.get('reach') && (product.selection?.reachMm ?? 0) < Number(params.get('reach')))
      return false;
    if (params.get('stroke') && (product.selection?.strokeMm ?? 0) < Number(params.get('stroke')))
      return false;
    if (
      params.get('gripForce') &&
      (product.selection?.gripForceN ?? 0) < Number(params.get('gripForce'))
    )
      return false;
    if (params.get('dof') && product.selection?.dof !== Number(params.get('dof'))) return false;

    return true;
  }).length;
}

function availableFilterKeys(scope: typeof catalogProducts) {
  const keys = new Set<string>();
  if (scope.some((product) => product.partClass)) keys.add('partClass');
  if (scope.some((product) => product.stock)) keys.add('stock');
  if (scope.some((product) => product.selection?.payloadKg !== undefined)) keys.add('payload');
  if (scope.some((product) => product.selection?.reachMm !== undefined)) keys.add('reach');
  if (scope.some((product) => product.selection?.strokeMm !== undefined)) keys.add('stroke');
  if (scope.some((product) => product.selection?.gripForceN !== undefined)) keys.add('gripForce');
  if (scope.some((product) => product.selection?.dof !== undefined)) keys.add('dof');
  return Array.from(keys);
}

function hasOption(scope: typeof catalogProducts, key: 'partClass' | 'stock', option: string) {
  return scope.some((product) => product[key] === option);
}

function hasSelectionThreshold(
  scope: typeof catalogProducts,
  key: 'payloadKg' | 'reachMm' | 'strokeMm' | 'gripForceN',
  option: string,
) {
  return scope.some((product) => (product.selection?.[key] ?? 0) >= Number(option));
}

function hasSelectionValue(scope: typeof catalogProducts, key: 'dof', option: string) {
  return scope.some((product) => product.selection?.[key] === Number(option));
}

function CategoryButton({
  active,
  count,
  onClick,
  children,
}: {
  active: boolean;
  count: number;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        'flex min-h-[36px] shrink-0 items-center justify-between gap-[8px] rounded-md px-[12px] text-left text-sm transition-colors lg:w-full lg:px-[10px]',
        active
          ? 'bg-text-strong text-bg-elevated font-semibold hover:bg-text-strong hover:text-bg-elevated'
          : 'text-text bg-bg-surface hover:bg-bg-control',
      )}
    >
      <span className="truncate">{children}</span>
      <span
        className={cn(
          'rounded-pill px-2 py-0.5 text-xs tabular-nums',
          active ? 'bg-bg-elevated/20 text-bg-elevated' : 'bg-bg-control text-text-muted',
        )}
      >
        {count}
      </span>
    </button>
  );
}

function FilterGroup({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="border-divider mb-[12px] border-b pb-[12px] first:mt-[12px] last:mb-0 last:border-b-0 last:pb-0 lg:grid lg:grid-cols-[64px_minmax(0,1fr)] lg:gap-x-2 lg:first:mt-0">
      <p className="text-text-muted mb-[8px] text-sm font-medium lg:mb-0 lg:pt-2">{title}</p>
      <div className="flex gap-[8px] overflow-x-auto pb-[4px] lg:flex-wrap lg:overflow-visible lg:pb-0">
        {children}
      </div>
    </div>
  );
}

function FilterButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        'rounded-pill inline-flex min-h-[36px] shrink-0 items-center px-[12px] text-left text-sm transition-colors',
        active
          ? 'bg-brand-soft text-brand-500 font-semibold hover:bg-brand-soft hover:text-brand-500'
          : 'text-text hover:bg-bg-control',
      )}
    >
      {children}
    </button>
  );
}
