'use client';

import type React from 'react';
import { useEffect, useRef, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { toast } from 'sonner';
import {
  CheckCircle2,
  CircleDollarSign,
  ClipboardCheck,
  GitBranch,
  LogIn,
  Minus,
  Plus,
  Trash2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useCartSafe } from '@/hooks/use-cart';
import { DEFAULT_ENTERPRISE_ID, useProcurementStore } from '@/lib/procurement-store';
import { getProductById } from '@/mock-data';
import { formatPrice } from '@/lib/format';
import { PartClassBadge } from './part-class-badge';
import { ProductImage } from './product-image';
import type { PaymentMethod } from '@/types/procurement';

interface OsHandoff {
  projectId: string;
  projectName?: string;
}

interface CheckoutSummaryProps {
  osHandoff?: OsHandoff | null;
}

type CheckoutStep = 1 | 2 | 3 | 4;

function osHandoffLoginHref(osHandoff: OsHandoff) {
  const params = new URLSearchParams({ from: 'os' });
  if (osHandoff.projectName) params.set('project', osHandoff.projectName);
  params.set('projectId', osHandoff.projectId);

  return `/store/login?next=${encodeURIComponent(`/store/cart?${params.toString()}`)}`;
}

function navigateWithFallback(router: ReturnType<typeof useRouter>, href: string) {
  router.push(href);
  window.setTimeout(() => {
    if (window.location.pathname.includes('/checkout')) {
      window.location.assign(href);
    }
  }, 650);
}

export function CheckoutSummary({ osHandoff }: CheckoutSummaryProps) {
  const t = useTranslations('Checkout');
  const tCart = useTranslations('Cart');
  const locale = useLocale();
  const router = useRouter();
  const osHandoffImportedRef = useRef(false);
  const [currentStep, setCurrentStep] = useState<CheckoutStep>(1);
  const {
    items,
    projectName,
    projects,
    currentProjectId,
    selectedCount,
    setProject,
    importOsBom,
    setQty,
    setSelected,
    remove,
  } = useCartSafe();
  const {
    isAuthenticated,
    profile,
    checkoutDraft,
    addressBook,
    invoiceProfiles,
    orders,
    osHandoffs,
    updateCheckoutDraft,
    applyAddressProfile,
    applyInvoiceProfile,
    saveCheckoutAddress,
    saveCheckoutInvoice,
    submitLocalOrder,
    recordOsHandoff,
    acceptOsHandoff,
    markLocalOrderPaid,
  } = useProcurementStore();
  const osProjectName = osHandoff?.projectName || tCart('osProjectLine');
  const unsyncedCount = items.reduce(
    (count, item) => count + (item.syncStatus === 'synced' ? 0 : 1),
    0,
  );
  const purchaseItems = items.filter((item) => item.selected && item.sellable);
  const selectedSellableCount = purchaseItems.reduce((count, item) => count + item.qty, 0);
  const selectedQuoteCount = items.reduce(
    (count, item) => count + (item.selected && item.quoteRequired ? item.qty : 0),
    0,
  );
  const selectedSubmittableCount = selectedSellableCount + selectedQuoteCount;
  const isQuoteOnlySubmission = selectedSellableCount === 0 && selectedQuoteCount > 0;
  const isEngineerRole = isAuthenticated && profile.role === 'engineer';
  const isAdminRole = isAuthenticated && profile.role === 'admin';
  const bomLineCount = items.length;
  const orderLines = items.flatMap((item) => {
    const product = getProductById(item.productId);
    if (!product) return [];
    const lineSubtotal = item.selected && item.sellable ? product.priceCents * item.qty : 0;

    return [
      {
        productId: item.productId,
        model: product.model,
        name: product.name,
        partClass: item.partClass,
        qty: item.qty,
        source: item.source,
        selected: item.selected,
        sellable: item.sellable,
        quoteRequired: item.quoteRequired,
        unitPriceCents: product.priceCents,
        subtotalCents: lineSubtotal,
        currency: product.currency,
      },
    ];
  });
  const subtotal = purchaseItems.reduce((sum, item) => {
    const product = getProductById(item.productId);
    return sum + (product ? product.priceCents * item.qty : 0);
  }, 0);
  const requiresInvoice =
    checkoutDraft.paymentMethod === 'corporate' &&
    (!checkoutDraft.invoiceTitle || !checkoutDraft.taxId || !checkoutDraft.bankAccount);
  const canSubmitOrder =
    isAuthenticated &&
    !isEngineerRole &&
    Boolean(checkoutDraft.recipient) &&
    Boolean(checkoutDraft.phone) &&
    Boolean(checkoutDraft.city) &&
    Boolean(checkoutDraft.address) &&
    selectedSubmittableCount > 0 &&
    !requiresInvoice;
  const canSubmitHandoff = isEngineerRole && bomLineCount > 0;
  const canSubmit = canSubmitOrder || canSubmitHandoff;
  const enterpriseOrders = isAuthenticated
    ? orders.filter(
        (order) => (order.enterpriseId ?? DEFAULT_ENTERPRISE_ID) === profile.enterpriseId,
      )
    : [];
  const enterpriseAddressBook = isAuthenticated
    ? addressBook.filter(
        (address) => (address.enterpriseId ?? DEFAULT_ENTERPRISE_ID) === profile.enterpriseId,
      )
    : [];
  const enterpriseInvoiceProfiles = isAuthenticated
    ? invoiceProfiles.filter(
        (invoice) => (invoice.enterpriseId ?? DEFAULT_ENTERPRISE_ID) === profile.enterpriseId,
      )
    : [];
  const latestProjectOrder = enterpriseOrders.find(
    (order) => order.projectName === projectName && order.status !== 'completed',
  );
  const latestProjectHandoff = isAuthenticated
    ? osHandoffs.find(
        (handoff) =>
          (handoff.enterpriseId ?? DEFAULT_ENTERPRISE_ID) === profile.enterpriseId &&
          handoff.projectId === currentProjectId,
      )
    : undefined;
  const canPayLatest =
    isAuthenticated &&
    profile.role !== 'engineer' &&
    latestProjectOrder?.status === 'pending-payment';
  const approvalRouteLabel = isEngineerRole
    ? t('approvalBuyerRequired')
    : isAdminRole
      ? t('approvalAdminDirect')
      : t('approvalAdminRequired');
  const approvalOwnerLabel = isAdminRole ? profile.contactName : checkoutDraft.approver;
  const deliveryComplete =
    isEngineerRole ||
    (Boolean(checkoutDraft.recipient) &&
      Boolean(checkoutDraft.phone) &&
      Boolean(checkoutDraft.city) &&
      Boolean(checkoutDraft.address));
  const paymentComplete = isEngineerRole || !requiresInvoice;
  const stepCanContinue =
    currentStep === 1
      ? selectedSubmittableCount > 0 || canSubmitHandoff
      : currentStep === 2
        ? deliveryComplete
        : currentStep === 3
          ? paymentComplete
          : canSubmit;
  const flowSteps: Array<{
    index: CheckoutStep;
    label: string;
    title: string;
    hint: string;
  }> = [
    {
      index: 1,
      label: t('stepItems'),
      title: t('itemsStepTitle'),
      hint: projectName,
    },
    {
      index: 2,
      label: t('stepDelivery'),
      title: t('deliveryStepTitle'),
      hint: t('deliveryStepHint'),
    },
    {
      index: 3,
      label: t('stepPayment'),
      title: t('paymentStepTitle'),
      hint: t('paymentStepHint'),
    },
    {
      index: 4,
      label: t('stepSubmit'),
      title: t('submitStepTitle'),
      hint: t('submitStepHint'),
    },
  ];
  const currentStepMeta = flowSteps.find((step) => step.index === currentStep) ?? flowSteps[0];

  function previousStep() {
    setCurrentStep((step) => Math.max(1, step - 1) as CheckoutStep);
  }

  function nextStep() {
    if (!stepCanContinue) return;
    setCurrentStep((step) => Math.min(4, step + 1) as CheckoutStep);
  }

  useEffect(() => {
    if (!osHandoff || osHandoffImportedRef.current || !isAuthenticated) return;
    osHandoffImportedRef.current = true;
    importOsBom({
      projectId: osHandoff.projectId,
      projectName: osProjectName,
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
    });
    recordOsHandoff({
      projectId: osHandoff.projectId,
      projectName: osProjectName,
      itemCount: 4,
      submittedBy: '方案工程师',
    });
    if (isAuthenticated && profile.role !== 'engineer') {
      acceptOsHandoff(osHandoff.projectId);
    }
  }, [
    acceptOsHandoff,
    importOsBom,
    isAuthenticated,
    osHandoff,
    osProjectName,
    profile.role,
    recordOsHandoff,
  ]);

  const projectSyncSection = (
    <section className="bg-bg-elevated rounded-lg p-4 md:p-5">
      <div>
        <div>
          <p className="text-text-muted text-sm">{tCart('projectContext')}</p>
          <h2 className="text-text-strong mt-1 text-2xl font-semibold">{projectName}</h2>
        </div>
      </div>

      {projects.length > 1 && (
        <div className="mt-4 flex flex-wrap gap-2">
          {projects.map((project) => {
            const active = project.projectId === currentProjectId;
            return (
              <button
                key={project.projectId}
                type="button"
                onClick={() => setProject(project.projectId)}
                className={`rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                  active
                    ? 'bg-brand-soft text-brand-600'
                    : 'bg-bg-surface text-text-muted hover:text-text'
                }`}
              >
                {project.projectName}
              </button>
            );
          })}
        </div>
      )}

      <div className="border-divider mt-5 border-t pt-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-text-strong text-base font-semibold">{tCart('osSyncTitle')}</h3>
              <span className="bg-bg-control text-text-muted rounded-sm px-2 py-0.5 text-xs">
                {tCart('unsyncedCount', { count: unsyncedCount })}
              </span>
            </div>
            <p className="text-text-muted mt-1 text-sm leading-relaxed">{tCart('osSyncHint')}</p>
            {osHandoff && (
              <p className="text-text-strong mt-2 text-sm">
                {tCart('osHandoffHint', { project: osProjectName })}
              </p>
            )}
          </div>
        </div>
        <p className="text-text-muted mt-3 text-sm leading-relaxed">{tCart('syncHint')}</p>
      </div>
    </section>
  );

  function submit() {
    if (!canSubmit) return;
    if (isEngineerRole) {
      recordOsHandoff({
        projectId: currentProjectId,
        projectName,
        itemCount: bomLineCount,
        submittedBy: profile.contactName,
      });
      toast.success(t('handoffSubmitSuccess'));
      navigateWithFallback(router, `/${locale}/account`);
      return;
    }

    const orderNo = submitLocalOrder({
      projectId: currentProjectId,
      projectName,
      subtotalCents: subtotal,
      itemCount: selectedSubmittableCount,
      lines: orderLines,
      shippingAddress: {
        recipient: checkoutDraft.recipient,
        phone: checkoutDraft.phone,
        province: checkoutDraft.province,
        city: checkoutDraft.city,
        address: checkoutDraft.address,
      },
      invoice:
        checkoutDraft.paymentMethod === 'corporate'
          ? {
              title: checkoutDraft.invoiceTitle,
              taxId: checkoutDraft.taxId,
              bankAccount: checkoutDraft.bankAccount,
            }
          : null,
      note: checkoutDraft.note,
    });
    toast.success(
      isQuoteOnlySubmission
        ? t('quoteSubmitSuccess')
        : isAdminRole
          ? t('orderSubmitSuccess')
          : t('approvalSubmitSuccess'),
    );
    navigateWithFallback(
      router,
      orderNo ? `/${locale}/orders/${encodeURIComponent(orderNo)}` : `/${locale}/orders`,
    );
  }

  const submitLabel = isEngineerRole
    ? t('submitForBuyer')
    : isQuoteOnlySubmission
      ? t('submitQuoteRequest')
      : isAdminRole
        ? t('submitOrder')
        : t('submitForApproval');

  if (osHandoff && !isAuthenticated) {
    return (
      <div className="space-y-5">
        <section className="bg-bg-elevated rounded-lg p-5">
          <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
            <div className="flex items-start gap-3">
              <GitBranch className="text-brand-500 mt-1 size-5 shrink-0" />
              <div>
                <p className="text-text-muted text-sm">{tCart('projectContext')}</p>
                <h2 className="text-text-strong mt-1 text-2xl font-semibold">{osProjectName}</h2>
                <p className="text-text-muted mt-3 max-w-2xl text-base leading-relaxed">
                  {t('osHandoffLoginHint')}
                </p>
              </div>
            </div>
            <Button variant="primary" asChild>
              <Link href={osHandoffLoginHref(osHandoff)}>
                <LogIn className="size-4" />
                {t('osHandoffLoginCta')}
              </Link>
            </Button>
          </div>
        </section>
        <section className="bg-bg-elevated rounded-lg p-8">
          <p className="text-text-strong text-xl font-semibold">{t('osHandoffLoginTitle')}</p>
          <p className="text-text-muted mt-3 text-base leading-relaxed">{t('loginRequired')}</p>
        </section>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="space-y-5">
        {projectSyncSection}
        <div className="bg-bg-elevated rounded-lg p-8 text-center">
          <p className="text-text-muted text-lg">{t('empty')}</p>
          <Button variant="primary" className="mt-5" asChild>
            <Link href="/store/products">{t('backToProducts')}</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_380px] lg:items-start">
      <div className="space-y-5">
        <section className="bg-bg-elevated rounded-lg p-4 md:p-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h2 className="text-text-strong text-xl font-semibold">{t('flowTitle')}</h2>
              <p className="text-text-muted mt-1 text-sm leading-relaxed">{t('flowHint')}</p>
            </div>
            <div className="grid gap-2 sm:grid-cols-4 lg:min-w-[560px]">
              {flowSteps.map((step) => {
                const active = step.index === currentStep;
                return (
                  <button
                    key={step.index}
                    type="button"
                    aria-current={active ? 'step' : undefined}
                    onClick={() => setCurrentStep(step.index)}
                    className={`flex items-center gap-2 rounded-md px-3 py-2 text-left transition-colors ${
                      active
                        ? 'bg-text-strong text-bg-elevated'
                        : 'bg-bg-surface text-text-muted hover:text-text'
                    }`}
                  >
                    <span
                      className={`flex size-6 shrink-0 items-center justify-center rounded-sm text-xs font-semibold ${
                        active ? 'bg-bg-elevated text-text-strong' : 'bg-bg-control text-text-muted'
                      }`}
                    >
                      {step.index}
                    </span>
                    <span className="truncate text-sm font-medium">{step.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </section>

        {currentStep === 1 && projectSyncSection}

        {currentStep === 1 && (
          <section className="bg-bg-elevated rounded-lg p-4 md:p-5">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <div className="min-w-0">
                <StepHeader index={1} title={t('itemsStepTitle')} body={projectName} />
              </div>
              <p className="text-text-muted text-sm">
                {t('selected')}: {selectedSubmittableCount} /{' '}
                {t('bomTotal', { count: selectedCount })}
              </p>
            </div>
            <div className="divide-divider divide-y">
              {items.map((item) => {
                const product = getProductById(item.productId);
                if (!product) return null;
                const lineSubtotal =
                  item.selected && item.sellable ? product.priceCents * item.qty : 0;
                return (
                  <div
                    key={item.productId}
                    className="grid grid-cols-[auto_82px_minmax(0,1fr)] gap-4 py-4 md:grid-cols-[auto_88px_minmax(0,1fr)_auto_auto_auto] md:items-center"
                  >
                    <input
                      type="checkbox"
                      checked={item.selected}
                      onChange={(event) => setSelected(item.productId, event.target.checked)}
                      aria-label={tCart('selectItem')}
                      className="accent-brand-500 mt-6 size-5 shrink-0 md:mt-0"
                    />
                    <div className="bg-bg-surface relative flex h-[72px] w-[82px] shrink-0 items-center justify-center overflow-hidden rounded-md md:h-[76px] md:w-[88px]">
                      <ProductImage
                        src={product.images[0]}
                        alt={product.name[locale as 'zh' | 'en']}
                        model={product.model}
                        sizes="88px"
                        imageClassName="p-1 mix-blend-normal"
                        fallbackClassName="[&_p]:text-sm"
                      />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-text-strong truncate text-lg font-medium">
                        {product.name[locale as 'zh' | 'en']}
                      </p>
                      <div className="mt-1 flex flex-wrap items-center gap-2">
                        <span className="text-text-muted text-sm">{product.model}</span>
                        <PartClassBadge partClass={item.partClass} />
                        <span className="border-divider text-text-muted rounded-sm border px-1.5 py-0.5 text-xs font-medium">
                          {item.source === 'os' ? tCart('sourceOs') : tCart('sourceWeb')}
                        </span>
                        <span className="bg-bg-control text-text-muted rounded-sm px-1.5 py-0.5 text-xs font-medium">
                          {tCart(`syncStatus.${item.syncStatus}`)}
                        </span>
                        <span className="bg-bg-control text-text-muted rounded-sm px-1.5 py-0.5 text-xs font-medium">
                          {item.selected ? t('bomIncluded') : t('bomExcluded')}
                        </span>
                        {!item.sellable && (
                          <span className="bg-bg-control text-text-muted rounded-sm px-1.5 py-0.5 text-xs font-medium">
                            {item.quoteRequired ? tCart('quoteOnly') : tCart('notForSale')}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="col-start-3 flex shrink-0 items-center gap-1 md:col-start-auto">
                      <Button
                        variant="icon"
                        size="icon"
                        onClick={() => setQty(item.productId, item.qty - 1)}
                        aria-label={tCart('decrease')}
                      >
                        <Minus className="size-3" />
                      </Button>
                      <span className="text-text-strong w-8 text-center text-sm" aria-live="polite">
                        {item.qty}
                      </span>
                      <Button
                        variant="icon"
                        size="icon"
                        onClick={() => setQty(item.productId, item.qty + 1)}
                        aria-label={tCart('increase')}
                      >
                        <Plus className="size-3" />
                      </Button>
                    </div>
                    <div className="col-start-3 text-left md:col-start-auto md:text-right">
                      <p className="text-text-strong mt-1 text-lg font-semibold tabular-nums">
                        {formatPrice(
                          lineSubtotal,
                          product.currency,
                          locale === 'zh' ? 'zh-CN' : 'en-US',
                        )}
                      </p>
                      {!item.sellable && (
                        <p className="text-text-muted mt-1 text-xs">
                          {item.quoteRequired ? tCart('quoteOnly') : tCart('notForSale')}
                        </p>
                      )}
                    </div>
                    <Button
                      variant="icon"
                      size="icon"
                      className="col-start-3 justify-self-start md:col-start-auto"
                      onClick={() => remove(item.productId)}
                      aria-label={tCart('remove')}
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {currentStep === 2 && (
          <section className="bg-bg-elevated rounded-lg p-4 md:p-5">
            <div className="mb-5 flex items-start justify-between gap-4">
              <StepHeader index={2} title={t('deliveryStepTitle')} body={t('deliveryStepHint')} />
              <ClipboardCheck className="text-brand-500 mt-1 size-5 shrink-0" />
            </div>

            <div className="bg-bg-surface mb-5 rounded-lg p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-text-strong font-medium">{t('addressBookTitle')}</p>
                  <p className="text-text-muted mt-1 text-sm">{t('addressBookHint')}</p>
                </div>
                <Button
                  variant="secondary"
                  size="sm"
                  disabled={isEngineerRole}
                  onClick={saveCheckoutAddress}
                >
                  {t('saveAddress')}
                </Button>
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                {enterpriseAddressBook.map((address) => (
                  <button
                    key={address.id}
                    type="button"
                    disabled={isEngineerRole}
                    onClick={() => applyAddressProfile(address.id)}
                    className="bg-bg-control text-text-muted hover:text-text disabled:hover:text-text-muted rounded-sm px-3 py-2 text-left text-sm transition-colors disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <span className="text-text-strong block font-medium">{address.label}</span>
                    <span className="block">{address.city}</span>
                  </button>
                ))}
              </div>
            </div>

            {isEngineerRole && (
              <div className="bg-brand-soft mb-5 rounded-lg p-4">
                <p className="text-text-strong font-medium">{t('engineerBoundaryTitle')}</p>
                <p className="text-text-muted mt-2 text-sm leading-relaxed">
                  {t('engineerBoundaryHint')}
                </p>
              </div>
            )}

            <div className="grid gap-4 md:grid-cols-2">
              <Field label={t('recipient')}>
                <Input
                  value={checkoutDraft.recipient}
                  disabled={isEngineerRole}
                  onChange={(event) => updateCheckoutDraft({ recipient: event.target.value })}
                />
              </Field>
              <Field label={t('phone')}>
                <Input
                  value={checkoutDraft.phone}
                  disabled={isEngineerRole}
                  onChange={(event) => updateCheckoutDraft({ phone: event.target.value })}
                />
              </Field>
              <Field label={t('province')}>
                <Input
                  value={checkoutDraft.province}
                  disabled={isEngineerRole}
                  onChange={(event) => updateCheckoutDraft({ province: event.target.value })}
                />
              </Field>
              <Field label={t('city')}>
                <Input
                  value={checkoutDraft.city}
                  disabled={isEngineerRole}
                  onChange={(event) => updateCheckoutDraft({ city: event.target.value })}
                />
              </Field>
              <Field label={t('addressFull')} className="md:col-span-2">
                <Input
                  value={checkoutDraft.address}
                  disabled={isEngineerRole}
                  onChange={(event) => updateCheckoutDraft({ address: event.target.value })}
                />
              </Field>
            </div>
          </section>
        )}

        {currentStep === 3 && (
          <section className="bg-bg-elevated rounded-lg p-4 md:p-5">
            <div className="mb-5">
              <StepHeader index={3} title={t('paymentStepTitle')} body={t('paymentStepHint')} />
            </div>

            <div className="grid gap-5 md:grid-cols-2">
              <OptionGroup
                label={t('payment')}
                value={checkoutDraft.paymentMethod}
                options={[
                  { value: 'corporate', label: t('corporatePay') },
                  { value: 'personal', label: t('personalPay') },
                ]}
                disabled={isEngineerRole}
                onChange={(paymentMethod) =>
                  updateCheckoutDraft({ paymentMethod: paymentMethod as PaymentMethod })
                }
              />
              <Field label={t('approvalRoute')}>
                <ReadonlyValue>{approvalRouteLabel}</ReadonlyValue>
              </Field>
            </div>

            <div className="bg-bg-surface mt-5 rounded-lg p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-text-strong font-medium">{t('invoiceProfilesTitle')}</p>
                  <p className="text-text-muted mt-1 text-sm">{t('invoiceProfilesHint')}</p>
                </div>
                <Button
                  variant="secondary"
                  size="sm"
                  disabled={
                    isEngineerRole ||
                    !checkoutDraft.invoiceTitle ||
                    !checkoutDraft.taxId ||
                    !checkoutDraft.bankAccount
                  }
                  onClick={saveCheckoutInvoice}
                >
                  {t('saveInvoice')}
                </Button>
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                {enterpriseInvoiceProfiles.map((invoice) => (
                  <button
                    key={invoice.id}
                    type="button"
                    disabled={isEngineerRole}
                    onClick={() => applyInvoiceProfile(invoice.id)}
                    className="bg-bg-control text-text-muted hover:text-text disabled:hover:text-text-muted rounded-sm px-3 py-2 text-left text-sm transition-colors disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <span className="text-text-strong block max-w-[220px] truncate font-medium">
                      {invoice.label}
                    </span>
                    <span className="block max-w-[220px] truncate">{invoice.taxId}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-5 grid gap-4 md:grid-cols-3">
              <Field label={t('invoiceTitle')}>
                <Input
                  value={checkoutDraft.invoiceTitle}
                  disabled={isEngineerRole || checkoutDraft.paymentMethod !== 'corporate'}
                  onChange={(event) => updateCheckoutDraft({ invoiceTitle: event.target.value })}
                />
              </Field>
              <Field label={t('taxId')}>
                <Input
                  value={checkoutDraft.taxId}
                  disabled={isEngineerRole || checkoutDraft.paymentMethod !== 'corporate'}
                  onChange={(event) => updateCheckoutDraft({ taxId: event.target.value })}
                />
              </Field>
              <Field label={t('bankAccount')}>
                <Input
                  value={checkoutDraft.bankAccount}
                  disabled={isEngineerRole || checkoutDraft.paymentMethod !== 'corporate'}
                  onChange={(event) => updateCheckoutDraft({ bankAccount: event.target.value })}
                />
              </Field>
              <Field label={t('approver')} className="md:col-span-1">
                <ReadonlyValue>{approvalOwnerLabel}</ReadonlyValue>
              </Field>
              <Field label={t('note')} className="md:col-span-2">
                <textarea
                  value={checkoutDraft.note}
                  disabled={isEngineerRole}
                  onChange={(event) => updateCheckoutDraft({ note: event.target.value })}
                  className="bg-bg-control text-text-strong placeholder:text-text-muted focus-visible:ring-brand-500/35 hover:bg-bg-control-hover disabled:hover:bg-bg-control min-h-10 w-full resize-y rounded-md px-3 py-2 text-lg transition-[background-color,box-shadow] outline-none focus-visible:ring-2 disabled:cursor-not-allowed disabled:opacity-60"
                />
              </Field>
            </div>
          </section>
        )}

        {currentStep === 4 && (
          <section className="bg-bg-elevated rounded-lg p-4 md:p-5">
            <StepHeader index={4} title={t('submitStepTitle')} body={t('submitStepHint')} />
            {!isAuthenticated && (
              <div className="bg-brand-soft mt-5 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <LogIn className="text-brand-500 mt-0.5 size-5 shrink-0" />
                  <div>
                    <p className="text-text-strong font-medium">{t('accountRequiredTitle')}</p>
                    <p className="text-text-muted mt-2 text-sm leading-relaxed">
                      {t('loginRequired')}
                    </p>
                  </div>
                </div>
                <Button variant="primary" className="mt-4 w-full" asChild>
                  <Link href="/store/login?next=/store/cart">{t('signIn')}</Link>
                </Button>
              </div>
            )}
            <div className="mt-5 grid gap-4 md:grid-cols-2">
              <div className="bg-bg-surface rounded-lg p-4">
                <p className="text-text-muted">{t('orderSummary')}</p>
                <p className="text-text-strong mt-2 text-2xl font-semibold tabular-nums">
                  {formatPrice(subtotal, 'CNY', locale === 'zh' ? 'zh-CN' : 'en-US')}
                </p>
              </div>
              <div className="bg-bg-surface rounded-lg p-4">
                <p className="text-text-strong font-medium">{t('currentRole')}</p>
                <p className="text-text-muted mt-1 text-sm">{t(profile.role)}</p>
                <p className="text-text-strong mt-4 font-medium">{profile.companyName}</p>
                <p className="text-text-muted mt-1 text-sm">{profile.contactName}</p>
              </div>
            </div>
            {latestProjectOrder && (
              <div className="bg-brand-soft mt-5 rounded-lg p-4">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="text-brand-500 size-4" />
                  <p className="text-text-strong font-medium">{t('latestOrder')}</p>
                </div>
                <p className="text-text-muted mt-2 text-sm">{latestProjectOrder.orderNo}</p>
                <p className="text-text-muted mt-1 text-sm">
                  {t(`orderStatus.${latestProjectOrder.status}`)}
                </p>
              </div>
            )}
            {latestProjectHandoff && (
              <div className="bg-brand-soft mt-5 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <GitBranch className="text-brand-500 mt-0.5 size-5 shrink-0" />
                  <div>
                    <p className="text-text-strong font-medium">{t('handoffSubmittedTitle')}</p>
                    <p className="text-text-muted mt-1 text-sm leading-relaxed">
                      {t('handoffSubmittedHint', {
                        status: t(`handoffStatus.${latestProjectHandoff.status}`),
                      })}
                    </p>
                  </div>
                </div>
                <div className="text-text-muted mt-3 grid gap-1 text-sm">
                  <p>{latestProjectHandoff.projectName}</p>
                  <p>{t('handoffItems', { count: latestProjectHandoff.itemCount })}</p>
                  {latestProjectHandoff.submittedBy && (
                    <p>{t('handoffSubmittedBy', { name: latestProjectHandoff.submittedBy })}</p>
                  )}
                </div>
              </div>
            )}
            {latestProjectOrder && latestProjectOrder.status !== 'pending-quote' && (
              <div className="bg-bg-surface mt-5 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <CircleDollarSign className="text-brand-500 mt-0.5 size-5 shrink-0" />
                  <div>
                    <p className="text-text-strong font-medium">{t('cashierTitle')}</p>
                    <p className="text-text-muted mt-1 text-sm leading-relaxed">
                      {latestProjectOrder.status === 'pending-approval'
                        ? t('cashierApprovalHint')
                        : latestProjectOrder.status === 'pending-payment'
                          ? t(
                              latestProjectOrder.paymentMethod === 'personal'
                                ? 'cashierPersonalHint'
                                : 'cashierCorporateHint',
                            )
                          : t('cashierPaidHint')}
                    </p>
                  </div>
                </div>
                <div className="mt-4 grid gap-3">
                  <div>
                    <p className="text-text-muted text-xs">{t('cashierOrder')}</p>
                    <p className="text-text-strong mt-1 text-sm font-medium">
                      {latestProjectOrder.orderNo}
                    </p>
                  </div>
                  {(latestProjectOrder.approver || latestProjectOrder.approvedBy) && (
                    <div>
                      <p className="text-text-muted text-xs">{t('cashierApprover')}</p>
                      <p className="text-text-strong mt-1 text-sm font-medium">
                        {latestProjectOrder.approvedBy
                          ? t('cashierApprovedBy', { name: latestProjectOrder.approvedBy })
                          : latestProjectOrder.approver}
                      </p>
                    </div>
                  )}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <p className="text-text-muted text-xs">{t('payment')}</p>
                      <p className="text-text-strong mt-1 text-sm font-medium">
                        {latestProjectOrder.paymentMethod === 'personal'
                          ? t('personalPay')
                          : t('corporatePay')}
                      </p>
                    </div>
                    <div>
                      <p className="text-text-muted text-xs">{t('cashierAmount')}</p>
                      <p className="text-text-strong mt-1 text-sm font-medium tabular-nums">
                        {formatPrice(
                          latestProjectOrder.subtotalCents,
                          'CNY',
                          locale === 'zh' ? 'zh-CN' : 'en-US',
                        )}
                      </p>
                    </div>
                  </div>
                  {latestProjectOrder.invoice && (
                    <div>
                      <p className="text-text-muted text-xs">{t('cashierInvoice')}</p>
                      <p className="text-text-strong mt-1 text-sm font-medium">
                        {latestProjectOrder.invoice.title}
                      </p>
                      <p className="text-text-muted mt-1 text-xs">
                        {latestProjectOrder.invoice.taxId}
                      </p>
                    </div>
                  )}
                  {latestProjectOrder.paymentReference && (
                    <div>
                      <p className="text-text-muted text-xs">{t('paymentReceipt')}</p>
                      <p className="text-text-strong mt-1 text-sm font-medium">
                        {latestProjectOrder.paymentReference}
                      </p>
                      {latestProjectOrder.paidBy && (
                        <p className="text-text-muted mt-1 text-xs">
                          {t('paymentConfirmedBy', { name: latestProjectOrder.paidBy })}
                        </p>
                      )}
                    </div>
                  )}
                </div>
                <Button
                  variant="primary"
                  className="mt-4 w-full"
                  disabled={!canPayLatest}
                  onClick={() =>
                    latestProjectOrder && markLocalOrderPaid(latestProjectOrder.orderNo)
                  }
                >
                  {latestProjectOrder.status === 'pending-payment'
                    ? t('confirmLocalPayment')
                    : t('cashierUnavailable')}
                </Button>
                <Button variant="secondary" className="mt-3 w-full" asChild>
                  <Link href="/store/orders">{t('viewOrders')}</Link>
                </Button>
              </div>
            )}
          </section>
        )}
      </div>

      <aside className="bg-bg-elevated rounded-lg p-5 lg:sticky lg:top-[124px] lg:self-start">
        <p className="text-text-muted text-sm">
          {t('currentStep', { step: currentStep, total: flowSteps.length })}
        </p>
        <h2 className="text-text-strong mt-1 text-xl font-semibold">{currentStepMeta.title}</h2>
        <p className="text-text-muted mt-2 text-sm leading-relaxed">{currentStepMeta.hint}</p>
        <div className="mt-4 flex items-center justify-between">
          <span className="text-text-muted">{t('orderSummary')}</span>
          <span className="text-text-strong text-2xl font-semibold tabular-nums">
            {formatPrice(subtotal, 'CNY', locale === 'zh' ? 'zh-CN' : 'en-US')}
          </span>
        </div>
        <div className="bg-bg-surface mt-5 rounded-lg p-4">
          <p className="text-text-strong font-medium">{t('currentRole')}</p>
          <p className="text-text-muted mt-1 text-sm">{t(profile.role)}</p>
          <p className="text-text-strong mt-4 font-medium">{profile.companyName}</p>
          <p className="text-text-muted mt-1 text-sm">{profile.contactName}</p>
        </div>
        <p className="text-text-muted mt-4 text-sm leading-relaxed">
          {!isAuthenticated
            ? t('signInHint')
            : isEngineerRole
              ? canSubmitHandoff
                ? t('engineerReadyHint')
                : t('engineerMissingHint')
              : canSubmitOrder
                ? t('readyHint')
                : t('missingHint')}
        </p>
        <div className="mt-5 grid gap-2">
          {currentStep > 1 && (
            <Button variant="secondary" className="w-full" onClick={previousStep}>
              {t('previousStep')}
            </Button>
          )}
          {currentStep < 4 ? (
            <Button
              variant="primary"
              className="w-full"
              disabled={!stepCanContinue}
              onClick={nextStep}
            >
              {t('nextStep')}
            </Button>
          ) : (
            <Button variant="primary" className="w-full" disabled={!canSubmit} onClick={submit}>
              {submitLabel}
            </Button>
          )}
        </div>
      </aside>
    </div>
  );
}

function Field({
  label,
  className,
  children,
}: {
  label: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <label className={className}>
      <span className="text-text-muted mb-2 block text-sm">{label}</span>
      {children}
    </label>
  );
}

function StepHeader({ index, title, body }: { index: number; title: string; body: string }) {
  return (
    <div className="flex min-w-0 items-start gap-3">
      <span className="bg-text-strong text-bg-elevated mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-sm text-sm font-semibold">
        {index}
      </span>
      <div className="min-w-0">
        <h2 className="text-text-strong text-xl font-semibold">{title}</h2>
        <p className="text-text-muted mt-1 text-sm leading-relaxed">{body}</p>
      </div>
    </div>
  );
}

function ReadonlyValue({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-bg-control text-text-strong flex min-h-10 items-center rounded-md px-3 py-2 text-lg">
      {children}
    </div>
  );
}

function OptionGroup({
  label,
  value,
  options,
  disabled = false,
  onChange,
}: {
  label: string;
  value: string;
  options: Array<{ value: string; label: string }>;
  disabled?: boolean;
  onChange: (value: string) => void;
}) {
  return (
    <div>
      <p className="text-text-muted mb-2 text-sm">{label}</p>
      <div className="bg-bg-surface grid gap-1 rounded-md p-1">
        {options.map((option) => {
          const active = value === option.value;
          return (
            <button
              key={option.value}
              type="button"
              disabled={disabled}
              onClick={() => onChange(option.value)}
              className={`rounded-sm px-3 py-2 text-left text-lg transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
                active
                  ? 'bg-bg-elevated text-text-strong font-semibold'
                  : 'text-text-muted hover:text-text'
              }`}
            >
              {option.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
