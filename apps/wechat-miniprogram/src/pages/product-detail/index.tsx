/* eslint-disable jsx-a11y/alt-text */
import { useEffect, useMemo } from 'react';
import Taro, { useRouter } from '@tarojs/taro';
import { Button, Image, Text, View } from '@tarojs/components';
import {
  formatPrice,
  localized,
  partClassLabel,
  stockLabel,
} from '@hitbot/domain';
import {
  addProductToActiveCart,
  findProduct,
  getMiniCartProductQuantity,
  isEnterpriseBound,
  loadCatalog,
  relatedProducts,
  setActiveProject,
  setMiniCartProductQuantity,
} from '@/services/store';
import { useMiniStore } from '@/hooks/use-mini-store';
import { CartQuantityStepper } from '@/components/cart-quantity-stepper';
import './index.scss';

export default function ProductDetailPage() {
  const appState = useMiniStore();
  const router = useRouter();
  const slug = String(router.params.slug ?? '');
  const product = findProduct(slug);
  const isQuote = product ? product.priceCents === 0 || product.partClass === 'custom' : false;
  const isOutOfStock = product?.stock === 'out-of-stock';
  const category = product ? appState.categories.find((item) => item.id === product.category) : null;
  const related = useMemo(() => (product ? relatedProducts(product.id).slice(0, 3) : []), [product]);
  const enterpriseBound = isEnterpriseBound(appState);
  const cartQuantity = product ? getMiniCartProductQuantity(product.id, appState, 'web') : 0;

  useEffect(() => {
    loadCatalog().catch(() => {
      Taro.showToast({ title: '商品同步失败，已显示本地目录', icon: 'none' });
    });
  }, []);

  function handleAddToCart() {
    if (!product) return;
    if (isOutOfStock) {
      Taro.showToast({ title: '当前缺货，请联系销售', icon: 'none' });
      return;
    }
    if (!enterpriseBound) {
      Taro.showToast({ title: '请先登录企业账号', icon: 'none' });
      Taro.switchTab({ url: '/pages/account/index' });
      return;
    }
    setActiveProject('web');
    addProductToActiveCart(product.id);
    const nextQuantity = getMiniCartProductQuantity(product.id);
    Taro.showToast({
      title: isQuote ? `已加入询价，共${nextQuantity}件` : `已加入，共${nextQuantity}件`,
      icon: 'success',
    });
  }

  function updateProductQuantity(quantity: number) {
    if (!product) return;
    if (isOutOfStock) {
      Taro.showToast({ title: '当前缺货，请联系销售', icon: 'none' });
      return;
    }
    if (!enterpriseBound) {
      Taro.showToast({ title: '请先登录企业账号', icon: 'none' });
      Taro.switchTab({ url: '/pages/account/index' });
      return;
    }
    setMiniCartProductQuantity(product.id, quantity, 'web');
  }

  if (!product) {
    return (
      <View className="page">
        <View className="surface empty-detail">
          <Text className="title">商品不存在</Text>
          <Button className="primary-button" onClick={() => Taro.navigateBack()}>
            返回
          </Button>
        </View>
      </View>
    );
  }

  return (
    <View className="page detail-page">
      <View className={`detail-visual visual-${product.category}`}>
        {product.image ? (
          <Image className="detail-image" src={product.image} mode="aspectFit" />
        ) : (
          <Text>{product.model}</Text>
        )}
      </View>

      <View className="surface detail-main">
        <Text className="model">{product.model}</Text>
        <Text className="title">{localized(product.name)}</Text>
        <Text className="price">{formatPrice(product.priceCents, product.currency)}</Text>
        <View className="tag-row">
          {category && <Text className="tag">{localized(category.name)}</Text>}
          <Text className={isQuote ? 'tag tag-yellow' : 'tag tag-red'}>{partClassLabel(product.partClass)}</Text>
          <Text className={product.stock === 'in-stock' ? 'tag tag-green' : 'tag'}>{stockLabel(product.stock)}</Text>
        </View>
        <Text className="description">{localized(product.description)}</Text>
      </View>

      <View className="surface specs">
        <Text className="section-title">关键参数</Text>
        {product.specs.map((spec) => (
          <View key={`${spec.key.zh}-${spec.value}`} className="spec-row">
            <Text className="spec-key">{localized(spec.key)}</Text>
            <Text className="spec-value">{spec.value}</Text>
          </View>
        ))}
      </View>

      {related.length > 0 && (
        <View className="surface related">
          <Text className="section-title">兼容附件 / 相关产品</Text>
          {related.map((item) => (
            <View
              key={item.id}
              className="related-row"
              onClick={() => Taro.redirectTo({ url: `/pages/product-detail/index?slug=${item.slug}` })}
            >
              <View>
                <Text className="related-model">{item.model}</Text>
                <Text className="related-name">{localized(item.name)}</Text>
              </View>
              <Text className="related-price">{formatPrice(item.priceCents, item.currency)}</Text>
            </View>
          ))}
        </View>
      )}

      <View className="bottom-bar">
        <View>
          <Text className={cartQuantity > 0 ? 'hint in-cart' : 'hint'}>
            {cartQuantity > 0 ? `购物车已有 ${cartQuantity} 件` : isQuote ? '提交后由销售报价' : '可加入购物车'}
          </Text>
          <Text className="amount">{formatPrice(product.priceCents, product.currency)}</Text>
        </View>
        {cartQuantity > 0 ? (
          <CartQuantityStepper value={cartQuantity} onChange={updateProductQuantity} />
        ) : (
          <Button
            className="primary-button"
            disabled={isOutOfStock}
            onClick={handleAddToCart}
          >
            {isOutOfStock ? '暂不可购' : isQuote ? '提交询价' : '加入购物车'}
          </Button>
        )}
      </View>
    </View>
  );
}
