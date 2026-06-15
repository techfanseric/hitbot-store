/* eslint-disable jsx-a11y/alt-text */
import { useEffect, useMemo, useState } from 'react';
import Taro from '@tarojs/taro';
import { Button, Image, Text, Textarea, View } from '@tarojs/components';
import {
  formatPrice,
  localized,
  partClassLabel,
  type EnterpriseRole,
  type PaymentMethod,
} from '@hitbot/domain';
import {
  activeProject,
  activeCartCheckoutSummary,
  handoffActiveCart,
  isCompleteAddress,
  isCompleteInvoice,
  loadProfiles,
  patchCartItem,
  removeCartItem,
  selectMiniEnterpriseAddresses,
  selectMiniEnterpriseInvoices,
  setActiveProject,
  submitActiveCart,
} from '@/services/store';
import { useMiniStore } from '@/hooks/use-mini-store';
import './index.scss';

type CheckoutStep = 1 | 2 | 3 | 4;

export default function CartPage() {
  const appState = useMiniStore();
  const navMetrics = useMemo(() => getCartNavMetrics(), []);
  const [submitting, setSubmitting] = useState(false);
  const [currentStep, setCurrentStep] = useState<CheckoutStep>(1);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('corporate');
  const [addressId, setAddressId] = useState(appState.addresses[0]?.id ?? '');
  const [invoiceId, setInvoiceId] = useState(appState.invoices[0]?.id ?? '');
  const [note, setNote] = useState('');
  const project = activeProject();
  const items = project.items;
  const checkout = activeCartCheckoutSummary(paymentMethod);
  const profile = appState.session?.bound ? appState.session.profile : null;
  const addresses = useMemo(() => selectMiniEnterpriseAddresses(appState), [appState]);
  const invoices = useMemo(() => selectMiniEnterpriseInvoices(appState), [appState]);
  const selectedAddress = useMemo(
    () => addresses.find((address) => address.id === addressId) ?? null,
    [addressId, addresses],
  );
  const selectedInvoice = useMemo(
    () => invoices.find((invoice) => invoice.id === invoiceId) ?? null,
    [invoiceId, invoices],
  );
  const productMap = useMemo(
    () => new Map(appState.products.map((product) => [product.id, product])),
    [appState.products],
  );
  const subtotal = checkout.subtotalCents;
  const selectedCount = checkout.selectedCount;
  const quoteCount = checkout.selectedQuoteCount;
  const materialsReady = checkout.isEngineerOsHandoff
    ? checkout.bomLineCount > 0
    : checkout.selectedSubmittableCount > 0;
  const addressComplete = !checkout.requiresAddress || isCompleteAddress(selectedAddress);
  const invoiceComplete = !checkout.requiresInvoice || isCompleteInvoice(selectedInvoice);
  const canSubmit =
    checkout.isEnterpriseBound &&
    !checkout.isEngineerOrderBlocked &&
    materialsReady &&
    addressComplete &&
    invoiceComplete;
  const stepCanContinue =
    currentStep === 1
      ? materialsReady
      : currentStep === 2
        ? !checkout.isEnterpriseBound || addressComplete
        : currentStep === 3
          ? !checkout.isEnterpriseBound || invoiceComplete
          : canSubmit;
  const submitButtonDisabled =
    submitting ||
    (checkout.isEnterpriseBound ? !canSubmit && !checkout.isEngineerOrderBlocked : !materialsReady);

  useEffect(() => {
    loadProfiles().catch(() => {
      Taro.showToast({ title: '信息刷新失败，请稍后重试', icon: 'none' });
    });
  }, []);

  useEffect(() => {
    if (addresses.length > 0 && (!addressId || !addresses.some((address) => address.id === addressId))) {
      setAddressId(addresses[0].id);
    }
    if (addresses.length === 0 && addressId) setAddressId('');
    if (invoices.length > 0 && (!invoiceId || !invoices.some((invoice) => invoice.id === invoiceId))) {
      setInvoiceId(invoices[0].id);
    }
    if (invoices.length === 0 && invoiceId) setInvoiceId('');
  }, [addressId, addresses, invoiceId, invoices]);

  async function handleSubmit() {
    if (submitting) return;
    if (!materialsReady) {
      Taro.showToast({ title: '请先选择可提交物料', icon: 'none' });
      return;
    }
    if (!checkout.isEnterpriseBound) {
      Taro.showToast({ title: '请先登录企业账号', icon: 'none' });
      Taro.switchTab({ url: '/pages/account/index' });
      return;
    }
    if (checkout.isEngineerOrderBlocked) return;
    if (!addressComplete) {
      Taro.showToast({ title: '请选择完整收货地址', icon: 'none' });
      return;
    }
    if (!invoiceComplete) {
      Taro.showToast({ title: '请补全对公发票资料', icon: 'none' });
      return;
    }
    setSubmitting(true);
    try {
      if (checkout.isEngineerOsHandoff) {
        handoffActiveCart();
        Taro.showToast({ title: checkout.successTitle, icon: 'success' });
        Taro.switchTab({ url: '/pages/account/index' });
        return;
      }

      await submitActiveCart({
        paymentMethod,
        addressId,
        invoiceId: paymentMethod === 'corporate' ? invoiceId : undefined,
        note: note.trim() || undefined,
      });
      Taro.showToast({ title: checkout.successTitle, icon: 'success' });
      Taro.switchTab({ url: '/pages/orders/index' });
    } catch (error) {
      Taro.showToast({ title: submitErrorTitle(error), icon: 'none' });
    } finally {
      setSubmitting(false);
    }
  }

  function nextStep() {
    if (!stepCanContinue) {
      Taro.showToast({ title: stepBlockedTitle(currentStep), icon: 'none' });
      return;
    }
    setCurrentStep((step) => Math.min(4, step + 1) as CheckoutStep);
  }

  function previousStep() {
    setCurrentStep((step) => Math.max(1, step - 1) as CheckoutStep);
  }

  function handleRemove(productId: string) {
    removeCartItem(productId);
    Taro.showToast({ title: '已移除', icon: 'success' });
  }

  function toggleSelected(productId: string) {
    patchCartItem(productId, (current) => ({
      ...current,
      selected: !current.selected,
      syncStatus: 'local',
    }));
  }

  function stepBlockedTitle(step: CheckoutStep) {
    if (step === 1) return checkout.isEngineerOsHandoff ? '当前项目没有可移交物料' : '请先选择可提交物料';
    if (step === 2) return '请选择完整收货地址';
    if (step === 3) return '请补全对公发票资料';
    return '请先补全提交信息';
  }

  function identityReviewLabel() {
    if (!profile) return '未进入企业账号';
    return `${profile.companyName} · ${profile.contactName} · ${roleLabel(profile.role)}`;
  }

  function deliveryReviewLabel() {
    if (checkout.isEngineerRole) return '移交后由采购确认';
    if (!selectedAddress) return '未选择';
    return `${selectedAddress.recipient} · ${selectedAddress.city}${selectedAddress.address}`;
  }

  function paymentReviewLabel() {
    if (checkout.isEngineerRole) return '移交后由采购/管理员处理';
    if (paymentMethod === 'personal') return '个人支付，无需发票抬头';
    if (!selectedInvoice) return '对公付款，未选择发票资料';
    return `${selectedInvoice.title} · ${selectedInvoice.taxId}`;
  }

  function submitReviewHint() {
    if (!checkout.isEnterpriseBound) return '登录企业账号后，系统会按企业角色决定移交、审批或采购流程。';
    if (checkout.isEngineerOsHandoff) return '工程师移交项目不会生成可付款订单，采购接手后再提交采购。';
    if (checkout.isEngineerOrderBlocked) return '工程师身份仅能移交 OS 同步项目，不能直接提交采购订单。';
    if (checkout.isQuoteOnlySubmission) return '本次仅包含询价件，提交后进入报价确认。';
    if (checkout.isAdminRole) return '管理员提交后进入待付款流程。';
    return '采购提交后进入审批流程。';
  }

  return (
    <View className="page cart-page" style={navMetrics.cssVars}>
      <View className="cart-progress-nav">
        <View className="cart-progress">
          {[
            { step: 1, label: '物料' },
            { step: 2, label: '收货' },
            { step: 3, label: '付款' },
            { step: 4, label: '提交' },
          ].map((item) => (
            <View key={item.step} className={currentStep === item.step ? 'step-item active' : 'step-item'}>
              <Text className="step-dot">{item.step}</Text>
              <Text>{item.label}</Text>
            </View>
          ))}
        </View>
      </View>

      {currentStep === 1 && (
        <View className="surface project-card">
          <View className="between">
            <View className="project-line">
              <Text className="project-label">当前项目：</Text>
              <Text className="project-name">{project.projectName}</Text>
            </View>
            <Text className={project.source === 'os' ? 'tag tag-red' : 'tag'}>
              {project.source === 'os' ? '项目同步' : '商城选购'}
            </Text>
          </View>
          <View className="project-switch">
            <Button
              className={appState.activeProjectKey === 'os' ? 'switch-chip active' : 'switch-chip'}
              onClick={() => setActiveProject('os')}
            >
              同步项目
            </Button>
            <Button
              className={appState.activeProjectKey === 'web' ? 'switch-chip active' : 'switch-chip'}
              onClick={() => setActiveProject('web')}
            >
              商城购物车
            </Button>
          </View>
        </View>
      )}

      {currentStep === 1 && (
        <View className="cart-list">
          {items.length === 0 && (
            <View className="surface empty-cart">
              <Text className="section-title">购物车里还没有物料</Text>
              <Text className="section-body">从产品页加入标准件或询价件后，会在这里确认数量和提交信息。</Text>
              <Button className="secondary-button" onClick={() => Taro.switchTab({ url: '/pages/products/index' })}>
                去选产品
              </Button>
            </View>
          )}
          {items.map((item) => {
            const product = productMap.get(item.productId);
            if (!product) return null;
            const linePrice = item.selected && item.sellable ? product.priceCents * item.qty : 0;
            return (
              <View key={item.productId} className="surface cart-row">
                <Button
                  className={item.selected ? 'select-button selected' : 'select-button'}
                  aria-label={item.selected ? '取消选择商品' : '选择商品'}
                  onClick={() => toggleSelected(item.productId)}
                >
                  {item.selected && <Text className="select-check">✓</Text>}
                </Button>
                <View className={`mini-visual part-${item.partClass}`}>
                  {product.image ? (
                    <Image className="mini-image" src={product.image} mode="aspectFit" />
                  ) : (
                    <Text>{product.model.split('-')[0]}</Text>
                  )}
                </View>
                <View className="cart-info">
                  <View className="cart-head">
                    <View className="cart-title">
                      <Text className="model">{product.model}</Text>
                      <Text className="name">{localized(product.name)}</Text>
                    </View>
                    <Button
                      className="remove-icon-button"
                      aria-label="移除商品"
                      onClick={() => handleRemove(item.productId)}
                    >
                      <View className="trash-icon">
                        <View className="trash-handle" />
                        <View className="trash-lid" />
                        <View className="trash-bin">
                          <View className="trash-line" />
                          <View className="trash-line" />
                        </View>
                      </View>
                    </Button>
                  </View>
                  <View className="tag-row">
                    <Text className={item.partClass === 'custom' ? 'tag tag-yellow' : 'tag tag-red'}>
                      {partClassLabel(item.partClass)}
                    </Text>
                    {item.source === 'os' && <Text className="tag">项目同步</Text>}
                    <Text className={item.syncStatus === 'pending' ? 'tag tag-yellow' : 'tag'}>
                      {item.syncStatus === 'pending' ? '待同步' : item.syncStatus === 'synced' ? '已同步' : '本地'}
                    </Text>
                  </View>
                  <View className="between controls">
                    <View className="qty">
                      <Button
                        className="qty-button"
                        onClick={() =>
                          patchCartItem(item.productId, (current) => ({
                            ...current,
                            qty: Math.max(1, current.qty - 1),
                            syncStatus: 'local',
                          }))
                        }
                      >
                        -
                      </Button>
                      <Text>{item.qty}</Text>
                      <Button
                        className="qty-button"
                        onClick={() =>
                          patchCartItem(item.productId, (current) => ({
                            ...current,
                            qty: current.qty + 1,
                            syncStatus: 'local',
                          }))
                        }
                      >
                        +
                      </Button>
                    </View>
                    <Text className="line-price">
                      {item.quoteRequired ? '需询价' : formatPrice(linePrice, product.currency)}
                    </Text>
                  </View>
                </View>
              </View>
            );
          })}
        </View>
      )}

      {currentStep === 2 && (
        <View className="surface checkout-card">
          <View className="between">
            <View>
              <Text className="section-title">收货信息</Text>
              <Text className="section-body">
                {checkout.isEngineerRole
                  ? '工程师移交采购不强制收货地址，采购确认后再补齐交付信息。'
                  : '标准件订单需要可交付地址；询价件也会随项目留档。'}
              </Text>
            </View>
            <Button
              className="text-button"
              onClick={() =>
                checkout.isEnterpriseBound
                  ? Taro.navigateTo({ url: '/pages/addresses/index' })
                  : Taro.switchTab({ url: '/pages/account/index' })
              }
            >
              {checkout.isEnterpriseBound ? '管理' : '登录'}
            </Button>
          </View>
          {checkout.isEngineerRole ? (
            <View className="empty-block">
              <Text className="profile-title">移交采购</Text>
              <Text className="profile-body">采购负责人接手后，将按企业流程确认收货人与交付地址。</Text>
            </View>
          ) : (
            <View className="profile-options">
              {!checkout.isEnterpriseBound && (
                <View className="empty-block bind-required">
                  <Text className="profile-title">需要登录企业账号</Text>
                  <Text className="profile-body">登录后会读取当前企业的地址簿，避免使用默认企业资料。</Text>
                </View>
              )}
              {addresses.map((address) => (
                <View
                  key={address.id}
                  className={addressId === address.id ? 'profile-option active' : 'profile-option'}
                  onClick={() => setAddressId(address.id)}
                >
                  <View>
                    <Text className="profile-title">{address.label}</Text>
                    <Text className="profile-body">
                      {address.recipient} · {address.phone}
                    </Text>
                    <Text className="profile-body">
                      {address.city} {address.address}
                    </Text>
                  </View>
                  <Text className="profile-check">{addressId === address.id ? '✓' : ''}</Text>
                </View>
              ))}
              {checkout.isEnterpriseBound && addresses.length === 0 && (
                <View className="empty-block">
                  <Text className="profile-title">暂无地址</Text>
                  <Text className="profile-body">请先新增一个收货地址。</Text>
                </View>
              )}
              {selectedAddress && !isCompleteAddress(selectedAddress) && (
                <View className="empty-block warning-block">
                  <Text className="profile-title">地址信息不完整</Text>
                  <Text className="profile-body">收货人、手机号、城市和详细地址都需要填写。</Text>
                </View>
              )}
            </View>
          )}
        </View>
      )}

      {currentStep === 3 && (
        <View className="surface checkout-card">
          <Text className="section-title">付款与发票</Text>
          {checkout.isEngineerRole ? (
            <View className="empty-block">
              <Text className="profile-title">移交后确认付款</Text>
              <Text className="profile-body">工程师不会直接生成可付款订单，付款和发票由采购/管理员处理。</Text>
            </View>
          ) : (
            <>
              <View className="payment-tabs">
                <Button
                  className={paymentMethod === 'corporate' ? 'payment-tab active' : 'payment-tab'}
                  onClick={() => setPaymentMethod('corporate')}
                >
                  对公付款
                </Button>
                <Button
                  className={paymentMethod === 'personal' ? 'payment-tab active' : 'payment-tab'}
                  onClick={() => setPaymentMethod('personal')}
                >
                  个人支付
                </Button>
              </View>
              {paymentMethod === 'corporate' ? (
                <View className="profile-options">
                  <View className="between invoice-head">
                    <Text className="section-body">对公付款需要完整发票抬头、税号和开户行账号。</Text>
                    <Button
                      className="text-button"
                      onClick={() =>
                        checkout.isEnterpriseBound
                          ? Taro.navigateTo({ url: '/pages/invoices/index' })
                          : Taro.switchTab({ url: '/pages/account/index' })
                      }
                    >
                      {checkout.isEnterpriseBound ? '管理' : '登录'}
                    </Button>
                  </View>
                  {!checkout.isEnterpriseBound && (
                    <View className="empty-block bind-required">
                      <Text className="profile-title">需要登录企业账号</Text>
                      <Text className="profile-body">登录后会读取当前企业的发票抬头。</Text>
                    </View>
                  )}
                  {invoices.map((invoice) => (
                    <View
                      key={invoice.id}
                      className={invoiceId === invoice.id ? 'profile-option active' : 'profile-option'}
                      onClick={() => setInvoiceId(invoice.id)}
                    >
                      <View>
                        <Text className="profile-title">{invoice.label}</Text>
                        <Text className="profile-body">{invoice.title}</Text>
                        <Text className="profile-body">{invoice.taxId}</Text>
                      </View>
                      <Text className="profile-check">{invoiceId === invoice.id ? '✓' : ''}</Text>
                    </View>
                  ))}
                  {checkout.isEnterpriseBound && invoices.length === 0 && (
                    <View className="empty-block">
                      <Text className="profile-title">暂无发票抬头</Text>
                      <Text className="profile-body">请先维护对公发票资料。</Text>
                    </View>
                  )}
                  {selectedInvoice && !isCompleteInvoice(selectedInvoice) && (
                    <View className="empty-block warning-block">
                      <Text className="profile-title">发票资料不完整</Text>
                      <Text className="profile-body">发票抬头、税号和开户行账号都需要填写。</Text>
                    </View>
                  )}
                </View>
              ) : (
                <View className="empty-block">
                  <Text className="profile-title">个人支付</Text>
                  <Text className="profile-body">个人支付允许发票为空，后续可在订单里补充付款凭证。</Text>
                </View>
              )}
            </>
          )}
          <View className="summary-box">
            <Text className="summary-line">已选 {selectedCount} 件</Text>
            <Text className="summary-line">{quoteCount} 件需询价</Text>
            <Text className="summary-amount">{formatPrice(subtotal, 'CNY')}</Text>
          </View>
          <View className="note-field">
            <Text className="field-label">订单备注</Text>
            <Textarea
              value={note}
              maxlength={160}
              placeholder="补充交付要求、项目节拍、安装窗口等信息"
              onInput={(event) => setNote(String(event.detail.value))}
            />
            <Text className="note-count">{note.length}/160</Text>
          </View>
        </View>
      )}

      {currentStep === 4 && (
        <View className="surface checkout-card">
          <View>
            <Text className="section-title">提交确认</Text>
            <Text className="section-body">{submitReviewHint()}</Text>
          </View>
          <View className="review-list">
            <ReviewRow label="企业账号" value={identityReviewLabel()} ok={checkout.isEnterpriseBound} />
            <ReviewRow label="流程" value={checkout.routeLabel} ok={!checkout.isEngineerOrderBlocked} />
            <ReviewRow
              label="物料"
              value={`${checkout.bomLineCount} 行 BOM，${checkout.selectedSubmittableCount} 件可提交`}
              ok={materialsReady}
            />
            <ReviewRow label="收货" value={deliveryReviewLabel()} ok={addressComplete} />
            <ReviewRow label="付款/发票" value={paymentReviewLabel()} ok={invoiceComplete} />
            <ReviewRow label="负责人" value={checkout.approverLabel} ok={checkout.isEnterpriseBound} />
          </View>
          <View className="summary-box">
            <Text className="summary-line">标准采购 {checkout.selectedSellableCount} 件</Text>
            <Text className="summary-line">询价 {quoteCount} 件</Text>
            <Text className="summary-amount">{formatPrice(subtotal, 'CNY')}</Text>
          </View>
        </View>
      )}

      <View className="bottom-bar">
        <View>
          <Text className="hint">已选 {selectedCount} 件，{quoteCount} 件需询价</Text>
          <Text className="amount">{formatPrice(subtotal, 'CNY')}</Text>
        </View>
        {currentStep < 4 ? (
          <Button className="primary-button" disabled={currentStep === 1 && !materialsReady} onClick={nextStep}>
            下一步
          </Button>
        ) : (
          <View className="bottom-actions">
            <Button className="secondary-button back-button" onClick={previousStep}>
              上一步
            </Button>
            <Button className="primary-button" disabled={submitButtonDisabled} onClick={handleSubmit}>
              {submitting ? '提交中' : checkout.submitLabel}
            </Button>
          </View>
        )}
      </View>
    </View>
  );
}

function getCartNavMetrics() {
  const fallback = {
    capsuleTop: 54,
    capsuleHeight: 32,
    capsuleLeft: 288,
    navHeight: 98,
  };

  try {
    const capsule = Taro.getMenuButtonBoundingClientRect();
    const capsuleTop = capsule.top || fallback.capsuleTop;
    const capsuleHeight = capsule.height || fallback.capsuleHeight;
    const capsuleLeft = capsule.left || fallback.capsuleLeft;
    const navHeight = capsuleTop + capsuleHeight + 12;

    return {
      cssVars: [
        `--cart-capsule-top:${capsuleTop}px`,
        `--cart-capsule-height:${capsuleHeight}px`,
        `--cart-capsule-left:${capsuleLeft}px`,
        `--cart-nav-height:${navHeight}px`,
      ].join(';'),
    };
  } catch {
    return {
      cssVars: [
        `--cart-capsule-top:${fallback.capsuleTop}px`,
        `--cart-capsule-height:${fallback.capsuleHeight}px`,
        `--cart-capsule-left:${fallback.capsuleLeft}px`,
        `--cart-nav-height:${fallback.navHeight}px`,
      ].join(';'),
    };
  }
}

function roleLabel(role: EnterpriseRole) {
  const roleMap: Record<EnterpriseRole, string> = {
    admin: '管理员',
    buyer: '采购',
    engineer: '工程师',
  };
  return roleMap[role];
}

function submitErrorTitle(error: unknown) {
  const message = error instanceof Error ? error.message : '';
  const titleMap: Record<string, string> = {
    BIND_ENTERPRISE_REQUIRED: '请先登录企业账号',
    ENGINEER_HANDOFF_REQUIRED: '工程师请移交采购',
    ENGINEER_OS_HANDOFF_REQUIRED: '仅工程师可移交采购',
    CART_SELECTION_REQUIRED: '请先选择可提交物料',
    ADDRESS_REQUIRED: '请选择完整收货地址',
    INVOICE_REQUIRED: '请补全对公发票资料',
  };
  return titleMap[message] ?? '提交失败，请稍后重试';
}

function ReviewRow({ label, value, ok }: { label: string; value: string; ok: boolean }) {
  return (
    <View className={ok ? 'review-row ok' : 'review-row'}>
      <Text className="review-label">{label}</Text>
      <Text className="review-value">{value}</Text>
      <Text className="review-state">{ok ? '✓' : '!'}</Text>
    </View>
  );
}
