'use client';

import { useLocale, useTranslations } from 'next-intl';
import Link from 'next/link';
import { GitBranch, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useCartSafe } from '@/hooks/use-cart';
import { CartItemRow } from './cart-item-row';
import { getProductById } from '@/mock-data';
import { formatPrice } from '@/lib/format';

interface CartSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CartSheet({ open, onOpenChange }: CartSheetProps) {
  const t = useTranslations('Cart');
  const locale = useLocale();
  const {
    items,
    selectedCount,
    projectName,
    projects,
    currentProjectId,
    hydrated,
    setProject,
    importOsBom,
    syncProject,
    clear,
  } = useCartSafe();
  const unsyncedCount = items.reduce(
    (count, item) => count + (item.syncStatus === 'synced' ? 0 : 1),
    0,
  );

  const subtotal = items.reduce((sum, item) => {
    const p = getProductById(item.productId);
    if (!p || !item.selected || !item.sellable) return sum;
    return sum + p.priceCents * item.qty;
  }, 0);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50">
      <button
        type="button"
        aria-label="Close"
        className="absolute inset-0 bg-black/50"
        onClick={() => onOpenChange(false)}
      />
      <aside
        data-testid="cart-panel"
        className="bg-bg-elevated shadow-floating-strong absolute inset-y-0 right-0 flex w-full max-w-md flex-col gap-4 p-4"
      >
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-text-strong text-xl font-semibold">{t('title')}</h2>
          <Button variant="icon" size="icon" onClick={() => onOpenChange(false)} aria-label="Close">
            <X className="size-4" />
          </Button>
        </div>
        <div className="bg-bg-surface rounded-lg px-3 py-2">
          <p className="text-text-muted text-xs">{t('projectContext')}</p>
          <p className="text-text-strong mt-0.5 text-sm font-medium">{projectName}</p>
          {projects.length > 1 && (
            <div className="mt-2 flex flex-wrap gap-1.5">
              {projects.map((project) => (
                <button
                  key={project.projectId}
                  type="button"
                  onClick={() => setProject(project.projectId)}
                  className={`min-h-[36px] rounded-sm px-2 py-1 text-xs transition-colors ${
                    currentProjectId === project.projectId
                      ? 'bg-bg-elevated text-text-strong font-semibold'
                      : 'bg-bg-control text-text-muted hover:text-text'
                  }`}
                >
                  {project.projectName}
                </button>
              ))}
            </div>
          )}
        </div>
        <div className="bg-bg-surface rounded-lg px-3 py-3">
          <div className="flex items-start gap-2">
            <GitBranch className="text-brand-500 mt-0.5 size-4 shrink-0" />
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-text-strong text-sm font-medium">{t('osSyncTitle')}</p>
                <span className="bg-bg-control text-text-muted rounded-sm px-2 py-0.5 text-xs">
                  {t('unsyncedCount', { count: unsyncedCount })}
                </span>
              </div>
              <p className="text-text-muted mt-1 text-xs leading-relaxed">{t('osSyncHint')}</p>
            </div>
          </div>
          <Button
            variant="secondary"
            size="sm"
            className="mt-3 w-full"
            onClick={() =>
              importOsBom({
                projectId: 'os-project-line',
                projectName: t('osProjectLine'),
                replace: true,
                items: [
                  { productId: 'p-004', partClass: 'standard', qty: 1 },
                  { productId: 'p-002', partClass: 'standard', qty: 1 },
                  {
                    productId: 'p-010',
                    partClass: 'custom',
                    qty: 1,
                    selected: true,
                    sellable: false,
                    quoteRequired: true,
                  },
                  {
                    productId: 'p-009',
                    partClass: 'reference',
                    qty: 2,
                    selected: false,
                    sellable: false,
                    quoteRequired: false,
                  },
                ],
              })
            }
          >
            {t('importOsBom')}
          </Button>
          <Button
            variant="secondary"
            size="sm"
            className="mt-2 w-full"
            disabled={items.length === 0 || unsyncedCount === 0}
            onClick={syncProject}
          >
            {t('markSynced')}
          </Button>
        </div>
        <div className="flex-1 overflow-y-auto">
          {hydrated && items.length === 0 ? (
            <div className="bg-bg-surface text-text-muted rounded-lg p-4">
              <p className="text-text-strong text-base font-medium">{t('empty')}</p>
              <p className="mt-1 text-sm">{t('emptyHint')}</p>
              <Button variant="primary" className="mt-4 w-full" asChild>
                <Link href={`/${locale}/products`} onClick={() => onOpenChange(false)}>
                  {t('continueShopping')}
                </Link>
              </Button>
            </div>
          ) : (
            <div className="divide-divider divide-y">
              {items.map((item) => (
                <CartItemRow key={item.productId} item={item} />
              ))}
            </div>
          )}
        </div>
        {items.length > 0 && (
          <>
            <div className="bg-divider h-px" />
            <div className="space-y-3 pt-4">
              <div className="text-text-muted flex items-center justify-between text-sm">
                <span>{t('selectedItems')}</span>
                <span>{t('totalItems', { count: selectedCount })}</span>
              </div>
              <div className="text-text-strong flex items-center justify-between">
                <span>{t('subtotal')}</span>
                <span className="font-semibold tabular-nums">
                  {formatPrice(subtotal, 'CNY', locale === 'zh' ? 'zh-CN' : 'en-US')}
                </span>
              </div>
              <div className="flex gap-2">
                <Button variant="subtle" onClick={clear} className="flex-1">
                  {t('clear')}
                </Button>
                {selectedCount === 0 ? (
                  <Button variant="primary" className="flex-1" disabled>
                    {t('checkout')}
                  </Button>
                ) : (
                  <Button variant="primary" className="flex-1" asChild>
                    <Link href={`/${locale}/checkout`} onClick={() => onOpenChange(false)}>
                      {t('checkout')}
                    </Link>
                  </Button>
                )}
              </div>
              <p className="text-text-muted text-xs">{t('syncHint')}</p>
              <Link
                href={`/${locale}/products`}
                onClick={() => onOpenChange(false)}
                className="text-text-muted hover:bg-bg-control-hover flex min-h-[36px] items-center justify-center rounded-sm text-sm transition-colors"
              >
                {t('continueShopping')}
              </Link>
            </div>
          </>
        )}
      </aside>
    </div>
  );
}
