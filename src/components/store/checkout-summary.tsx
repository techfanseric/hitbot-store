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
import { useProcurementHydrated } from '@/hooks/use-procurement-hydrated';
import { approvalSettingsForEnterprise, useAdminStore } from '@/lib/admin-store';
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

function osHandoffLoginHref(osHandoff: OsHandoff, locale: string) {
  const params = new URLSearchParams({ from: 'os' });
  if (osHandoff.projectName) params.set('project', osHandoff.projectName);
  params.set('projectId', osHandoff.projectId);

  return `/${locale}/login?next=${encodeURIComponent(`/${locale}/checkout?${params.toString()}`)}`;
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
  const authHydrated = useProcurementHydrated();
  const osHandoffImportedRef = useRef(false);
  const [currentStep, setCurrentStep] = useState<CheckoutStep>(1);
  const {
    items,
    projectName,
    projects,
    currentProjectId,
    selectedCount,
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
  const adminMembers = useAdminStore((state) => state.members);
  const approvalSettings = useAdminStore((state) => state.approvalSettings);
  const osProjectName = osHandoff?.projectName || tCart('osProjectLine');
  const currentProject = projects.find((project) => project.projectId === currentProjectId);
  const hasOsProjectContext =
    Boolean(osHandoff) ||
    currentProject?.source === 'os' ||
    items.some((item) => item.source === 'os');
  const osLineCount = items.reduce((count, item) => count + (item.source === 'os' ? 1 : 0), 0);
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
  const enterpriseApprovalSettings = isAuthenticated
    ? approvalSettingsForEnterprise(approvalSettings, adminMembers, profile.enterpriseId)
    : undefined;
  const approvalSettingsOwner = enterpriseApprovalSettings
    ? adminMembers.find((member) => member.id === enterpriseApprovalSettings.defaultApproverMemberId)
    : undefined;
  const amountRequiresApproval =
    Boolean(enterpriseApprovalSettings?.amountThresholdCents) &&
    subtotal >= (enterpriseApprovalSettings?.amountThresholdCents ?? 0);
  const currentOrderRequiresApproval =
    isAuthenticated &&
    profile.role === 'buyer' &&
    Boolean(
      enterpriseApprovalSettings?.requireBuyerOrderApproval ||
        (selectedQuoteCount > 0 && enterpriseApprovalSettings?.requireQuoteOrderApproval) ||
        amountRequiresApproval,
    );
  const approvalRouteLabel = isEngineerRole
    ? t('approvalBuyerRequired')
    : isAdminRole
      ? t('approvalAdminDirect')
      : currentOrderRequiresApproval
        ? t('approvalAdminRequired')
        : t('approvalNotRequired');
  const approvalOwnerLabel = isAdminRole
    ? profile.contactName
    : currentOrderRequiresApproval
      ? approvalSettingsOwner?.name || checkoutDraft.approver
      : isEngineerRole
        ? checkoutDraft.approver
        : t('approvalNoApprover');
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
  const roleLabel = t(profile.role);
  const contactLabel = profile.contactName === roleLabel ? null : profile.contactName;

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
      submittedBy: '周亦辰',
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

  const osProjectContextSection = hasOsProjectContext ? (
    <section className="border-divider bg-bg-elevated rounded-lg border px-3 py-2.5">
      <div className="flex min-w-0 items-center gap-2.5">
        <GitBranch className="text-brand-500 size-4 shrink-0" />
        <div className="min-w-0">
          <p className="text-text-strong truncate text-sm font-semibold">
            {tCart('osProjectContext', { project: osHandoff?.projectName || projectName })}
          </p>
          <p className="text-text-muted mt-0.5 text-xs">
            {tCart('osBomImported', { count: osLineCount || items.length })}
          </p>
        </div>
      </div>
    </section>
  ) : null;

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

  if (osHandoff && !authHydrated) {
    return <section className="bg-bg-elevated min-h-[180px] rounded-lg p-4 md:p-5" />;
  }

  if (osHandoff && !isAuthenticated) {
    return (
      <section className="bg-bg-elevated rounded-lg p-4 md:p-5">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div className="flex min-w-0 items-start gap-3">
            <GitBranch className="text-brand-500 mt-1 size-5 shrink-0" />
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-text-muted text-sm">{tCart('projectContext')}</p>
                <span className="bg-bg-control text-text-muted rounded-sm px-2 py-0.5 text-xs">
                  {t('osHandoffLoginTitle')}
                </span>
              </div>
              <h2 className="text-text-strong mt-1 truncate text-xl font-semibold md:text-2xl">
                {osProjectName}
              </h2>
              <p className="text-text-muted mt-2 max-w-3xl text-sm leading-relaxed md:text-base">
                {t('osHandoffLoginHint')}
              </p>
              <p className="text-text-muted mt-1.5 max-w-3xl text-sm leading-relaxed">
                {t('loginRequired')}
              </p>
            </div>
          </div>
          <Button variant="primary" className="w-full md:w-auto" asChild>
            <Link href={osHandoffLoginHref(osHandoff, locale)}>
              <LogIn className="size-4" />
              {t('osHandoffLoginCta')}
            </Link>
          </Button>
        </div>
      </section>
    );
  }

  if (items.length === 0) {
    return (
      <div className="space-y-5">
        {osProjectContextSection}
        <div className="bg-bg-elevated rounded-lg p-4 md:p-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-text-muted text-base">{t('empty')}</p>
            <Button variant="primary" className="w-full sm:w-auto" asChild>
              <Link href={`/${locale}/products`}>{t('backToProducts')}</Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="grid gap-4 min-[1100px]:grid-cols-[minmax(0,1fr)_320px] min-[1100px]:items-start xl:grid-cols-[minmax(0,1fr)_380px]">
      <div className="space-y-3 md:space-y-4">
        <section className="bg-bg-elevated rounded-lg p-2 md:p-4">
          <div className="flex flex-col gap-2 md:gap-3 min-[1100px]:flex-row min-[1100px]:items-center min-[1100px]:justify-between">
            <div className="min-w-0">
              <h2 className="text-text-strong text-base font-semibold md:text-xl">
                {t('flowTitle')}
              </h2>
              <p className="text-text-muted mt-1 hidden text-sm leading-relaxed xl:block">
                {t('flowHint')}
              </p>
            </div>
            <div className="grid grid-cols-4 gap-[8px] min-[1100px]:min-w-[552px] xl:min-w-[560px]">
              {flowSteps.map((step) => {
                const active = step.index === currentStep;
                return (
                  <button
                    key={step.index}
                    type="button"
                    aria-current={active ? 'step' : undefined}
                    onClick={() => setCurrentStep(step.index)}
                    className={`grid min-h-[52px] grid-cols-[32px_minmax(0,1fr)] items-center gap-[10px] rounded-md px-[10px] text-left transition-colors md:grid-cols-[36px_minmax(0,1fr)] md:px-[12px] ${
                      active
                        ? 'bg-text-strong text-bg-elevated'
                        : 'bg-bg-surface text-text-muted hover:text-text'
                    }`}
                  >
                    <span
                      className={`flex size-[32px] shrink-0 items-center justify-center rounded-sm text-sm leading-none font-semibold md:size-[36px] ${
                        active ? 'bg-bg-elevated text-text-strong' : 'bg-bg-control text-text-muted'
                      }`}
                    >
                      {step.index}
                    </span>
                    <span className="min-w-0 truncate text-sm leading-none font-semibold">
                      {step.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </section>

        {currentStep === 1 && osProjectContextSection}

        {currentStep === 1 && (
          <section className="bg-bg-elevated rounded-lg p-2.5 md:p-4">
            <div className="mb-2.5 flex flex-wrap items-center justify-between gap-2.5 md:mb-3">
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
                    className="grid grid-cols-[auto_72px_minmax(0,1fr)] gap-3 py-3 md:grid-cols-[auto_88px_minmax(0,1fr)_128px_112px_40px] md:items-center md:gap-4 md:py-4"
                  >
                    <input
                      type="checkbox"
                      checked={item.selected}
                      onChange={(event) => setSelected(item.productId, event.target.checked)}
                      aria-label={tCart('selectItem')}
                      className="accent-brand-500 mt-5 size-5 shrink-0 md:mt-0"
                    />
                    <div className="bg-bg-surface relative flex h-[64px] w-[72px] shrink-0 items-center justify-center overflow-hidden rounded-md md:h-[76px] md:w-[88px]">
                      <ProductImage
                        src={product.images[0]}
                        alt={product.name[locale as 'zh' | 'en']}
                        model={product.model}
                        sizes="(min-width: 768px) 88px, 72px"
                        imageClassName="p-1 mix-blend-normal"
                        fallbackClassName="[&_p]:text-sm"
                      />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-text-strong truncate text-base font-medium md:text-lg">
                        {product.name[locale as 'zh' | 'en']}
                      </p>
                      <div className="mt-1 flex flex-wrap items-center gap-1.5 md:gap-2">
                        <span className="text-text-muted text-sm">{product.model}</span>
                        <PartClassBadge partClass={item.partClass} />
                        {item.source === 'os' && (
                          <span className="border-divider text-text-muted rounded-sm border px-1.5 py-0.5 text-xs font-medium">
                            {tCart('sourceOs')}
                          </span>
                        )}
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
                    <div className="col-start-3 grid grid-cols-[112px_minmax(0,1fr)_40px] items-center gap-2 pt-1 sm:grid-cols-[128px_minmax(0,1fr)_40px] sm:gap-4 md:contents">
                      <div className="flex w-[112px] shrink-0 items-center justify-center gap-1 sm:w-[128px] md:justify-self-center">
                        <Button
                          variant="icon"
                          size="icon"
                          onClick={() => setQty(item.productId, item.qty - 1)}
                          aria-label={tCart('decrease')}
                        >
                          <Minus className="size-3" />
                        </Button>
                        <span
                          className="text-text-strong w-6 text-center text-sm sm:w-8"
                          aria-live="polite"
                        >
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
                      <div className="min-w-0 justify-self-end text-right md:w-[112px]">
                        <p className="text-text-strong text-base leading-tight font-semibold tabular-nums md:text-lg">
                          {formatPrice(
                            lineSubtotal,
                            product.currency,
                            locale === 'zh' ? 'zh-CN' : 'en-US',
                          )}
                        </p>
                        {!item.sellable && (
                          <p className="text-text-muted mt-1 text-xs leading-tight">
                            {item.quoteRequired ? tCart('quoteOnly') : tCart('notForSale')}
                          </p>
                        )}
                      </div>
                      <Button
                        variant="icon"
                        size="icon"
                        className="justify-self-end md:justify-self-center"
                        onClick={() => remove(item.productId)}
                        aria-label={tCart('remove')}
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    </div>
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
                  <Link href={`/${locale}/login?next=/${locale}/checkout`}>{t('signIn')}</Link>
                </Button>
              </div>
            )}
            <div className="border-divider mt-5 grid gap-4 border-t pt-4 md:grid-cols-2">
              <div>
                <p className="text-text-muted">{t('orderSummary')}</p>
                <p className="text-text-strong mt-1 text-xl font-semibold tabular-nums">
                  {formatPrice(subtotal, 'CNY', locale === 'zh' ? 'zh-CN' : 'en-US')}
                </p>
              </div>
              <dl className="grid gap-2 text-sm">
                <div className="grid grid-cols-[72px_minmax(0,1fr)] gap-3">
                  <dt className="text-text-muted">{t('currentRole')}</dt>
                  <dd className="text-text-strong truncate font-medium">{roleLabel}</dd>
                </div>
                <div className="grid grid-cols-[72px_minmax(0,1fr)] gap-3">
                  <dt className="text-text-muted">{t('companyLabel')}</dt>
                  <dd className="min-w-0">
                    <span className="text-text-strong block truncate font-medium">
                      {profile.companyName}
                    </span>
                    {contactLabel && (
                      <span className="text-text-muted mt-0.5 block truncate text-xs">
                        {contactLabel}
                      </span>
                    )}
                  </dd>
                </div>
              </dl>
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
                  <Link href={`/${locale}/orders`}>{t('viewOrders')}</Link>
                </Button>
              </div>
            )}
          </section>
        )}
      </div>

      <aside className="bg-bg-elevated rounded-lg p-3 md:p-4 min-[1100px]:sticky min-[1100px]:top-[124px] min-[1100px]:self-start">
        <p className="text-text-muted text-sm">
          {t('currentStep', { step: currentStep, total: flowSteps.length })}
        </p>
        <h2 className="text-text-strong mt-1 text-lg font-semibold">{currentStepMeta.title}</h2>
        <p className="text-text-muted mt-2 text-sm leading-relaxed">{currentStepMeta.hint}</p>
        <div className="border-divider mt-4 flex items-center justify-between border-t pt-4">
          <span className="text-text-muted">{t('orderSummary')}</span>
          <span className="text-text-strong text-xl font-semibold tabular-nums">
            {formatPrice(subtotal, 'CNY', locale === 'zh' ? 'zh-CN' : 'en-US')}
          </span>
        </div>
        <dl className="border-divider mt-3 grid gap-2 border-t pt-3 text-sm">
          <div className="grid grid-cols-[72px_minmax(0,1fr)] gap-3">
            <dt className="text-text-muted">{t('currentRole')}</dt>
            <dd className="text-text-strong min-w-0 truncate font-medium">{roleLabel}</dd>
          </div>
          <div className="grid grid-cols-[72px_minmax(0,1fr)] gap-3">
            <dt className="text-text-muted">{t('companyLabel')}</dt>
            <dd className="min-w-0">
              <span className="text-text-strong block truncate font-medium">
                {profile.companyName}
              </span>
              {contactLabel && (
                <span className="text-text-muted mt-0.5 block truncate text-xs">{contactLabel}</span>
              )}
            </dd>
          </div>
        </dl>
        <p className="text-text-muted border-divider mt-3 border-t pt-3 text-sm leading-relaxed">
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
        <div className="mt-4 grid gap-2">
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
