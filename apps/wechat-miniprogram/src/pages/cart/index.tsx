/* eslint-disable jsx-a11y/alt-text */
import { useEffect, useMemo, useState } from 'react';
import Taro from '@tarojs/taro';
import { Button, Image, Text, Textarea, View } from '@tarojs/components';
import {
  formatPrice,
  localized,
  partClassLabel,
  quoteItemCount,
  selectedItemCount,
  type PaymentMethod,
} from '@hitbot/domain';
import {
  activeProject,
  loadProfiles,
  patchCartItem,
  removeCartItem,
  setActiveProject,
  submitActiveCart,
} from '@/services/store';
import { useMiniStore } from '@/hooks/use-mini-store';
import './index.scss';

type CheckoutStep = 1 | 2 | 3;

export default function CartPage() {
  const appState = useMiniStore();
  const [submitting, setSubmitting] = useState(false);
  const [currentStep, setCurrentStep] = useState<CheckoutStep>(1);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('corporate');
  const [addressId, setAddressId] = useState(appState.addresses[0]?.id ?? '');
  const [invoiceId, setInvoiceId] = useState(appState.invoices[0]?.id ?? '');
  const [note, setNote] = useState('');
  const project = activeProject();
  const items = project.items;
  const productMap = useMemo(
    () => new Map(appState.products.map((product) => [product.id, product])),
    [appState.products],
  );
  const subtotal = useMemo(
    () =>
      items.reduce((sum, item) => {
        const product = productMap.get(item.productId);
        if (!product || !item.selected || !item.sellable) return sum;
        return sum + product.priceCents * item.qty;
      }, 0),
    [items, productMap],
  );
  const selectedCount = useMemo(() => selectedItemCount(items), [items]);
  const quoteCount = useMemo(() => quoteItemCount(items), [items]);
  const needsAddress = selectedCount > 0;
  const needsInvoice = paymentMethod === 'corporate' && subtotal > 0;
  const canSubmit =
    selectedCount > 0 &&
    (!needsAddress || Boolean(addressId)) &&
    (!needsInvoice || Boolean(invoiceId));

  useEffect(() => {
    loadProfiles().catch(() => {
      Taro.showToast({ title: '信息刷新失败，请稍后重试', icon: 'none' });
    });
  }, []);

  useEffect(() => {
    if (!addressId && appState.addresses[0]?.id) setAddressId(appState.addresses[0].id);
    if (!invoiceId && appState.invoices[0]?.id) setInvoiceId(appState.invoices[0].id);
  }, [addressId, appState.addresses, appState.invoices, invoiceId]);

  async function handleSubmit() {
    if (!canSubmit || submitting) {
      Taro.showToast({ title: '请先补全提交信息', icon: 'none' });
      return;
    }
    setSubmitting(true);
    try {
      const result = await submitActiveCart({
        paymentMethod,
        addressId,
        invoiceId: paymentMethod === 'corporate' ? invoiceId : undefined,
        note: note.trim() || undefined,
      });
      Taro.showToast({
        title: result.hasQuoteItems ? '已提交询价/采购' : '已提交采购',
        icon: 'success',
      });
      Taro.switchTab({ url: '/pages/orders/index' });
    } finally {
      setSubmitting(false);
    }
  }

  function nextStep() {
    if (currentStep === 1 && selectedCount === 0) {
      Taro.showToast({ title: '请先选择物料', icon: 'none' });
      return;
    }
    if (currentStep === 2 && needsAddress && !addressId) {
      Taro.showToast({ title: '请选择收货地址', icon: 'none' });
      return;
    }
    setCurrentStep((step) => Math.min(3, step + 1) as CheckoutStep);
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

  return (
    <View className="page cart-page">
      <View className="surface project-card">
        <View className="between">
          <View>
            <Text className="project-label">当前项目</Text>
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

      <View className="surface step-card">
        {[
          { step: 1, label: '物料' },
          { step: 2, label: '收货' },
          { step: 3, label: '付款' },
        ].map((item) => (
          <View key={item.step} className={currentStep === item.step ? 'step-item active' : 'step-item'}>
            <Text className="step-dot">{item.step}</Text>
            <Text>{item.label}</Text>
          </View>
        ))}
      </View>

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
                      {item.syncStatus === 'pending' ? '待同步' : '本地'}
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
              <Text className="section-body">标准件订单需要可交付地址；询价件也会随项目留档。</Text>
            </View>
            <Button className="text-button" onClick={() => Taro.navigateTo({ url: '/pages/addresses/index' })}>
              管理
            </Button>
          </View>
          <View className="profile-options">
            {appState.addresses.map((address) => (
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
            {appState.addresses.length === 0 && (
              <View className="empty-block">
                <Text className="profile-title">暂无地址</Text>
                <Text className="profile-body">请先新增一个收货地址。</Text>
              </View>
            )}
          </View>
        </View>
      )}

      {currentStep === 3 && (
        <View className="surface checkout-card">
          <Text className="section-title">付款与发票</Text>
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
                <Text className="section-body">选择发票抬头后随订单提交。</Text>
                <Button className="text-button" onClick={() => Taro.navigateTo({ url: '/pages/invoices/index' })}>
                  管理
                </Button>
              </View>
              {appState.invoices.map((invoice) => (
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
              {appState.invoices.length === 0 && (
                <View className="empty-block">
                  <Text className="profile-title">暂无发票抬头</Text>
                  <Text className="profile-body">请先维护对公发票资料。</Text>
                </View>
              )}
            </View>
          ) : (
            <View className="empty-block">
              <Text className="profile-title">个人支付</Text>
              <Text className="profile-body">订单会跳过发票抬头校验，付款后可在订单里补充凭证。</Text>
            </View>
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

      <View className="bottom-bar">
        <View>
          <Text className="hint">已选 {selectedCount} 件，{quoteCount} 件需询价</Text>
          <Text className="amount">{formatPrice(subtotal, 'CNY')}</Text>
        </View>
        {currentStep < 3 ? (
          <Button className="primary-button" disabled={selectedCount === 0} onClick={nextStep}>
            下一步
          </Button>
        ) : (
          <View className="bottom-actions">
            <Button className="secondary-button back-button" onClick={previousStep}>
              上一步
            </Button>
            <Button className="primary-button" disabled={!canSubmit || submitting} onClick={handleSubmit}>
              {submitting ? '提交中' : quoteCount > 0 ? '提交询价/采购' : '提交采购'}
            </Button>
          </View>
        )}
      </View>
    </View>
  );
}
