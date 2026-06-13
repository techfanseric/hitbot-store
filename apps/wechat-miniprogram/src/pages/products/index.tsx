/* eslint-disable jsx-a11y/alt-text */
import { type ReactNode, useEffect, useMemo, useState } from 'react';
import Taro from '@tarojs/taro';
import { Button, Image, Input, ScrollView, Text, View } from '@tarojs/components';
import {
  formatPrice,
  localized,
  partClassLabel,
  stockLabel,
  type PartClass,
  type ProductCategory,
  type Stock,
} from '@hitbot/domain';
import { addProductToActiveCart, loadCatalog, setActiveProject } from '@/services/store';
import { useMiniStore } from '@/hooks/use-mini-store';
import './index.scss';

type ActiveCategory = 'all' | ProductCategory;

const partClassOptions: PartClass[] = ['standard', 'custom'];
const stockOptions: Stock[] = ['in-stock', 'preorder', 'out-of-stock'];
const payloadOptions = [2, 3, 8];
const reachOptions = [500, 1000];
const strokeOptions = [8, 20, 50];
const gripForceOptions = [40, 80];
const dofOptions = [4, 6];

export default function ProductsPage() {
  const appState = useMiniStore();
  const [activeCategory, setActiveCategory] = useState<ActiveCategory>('all');
  const [keyword, setKeyword] = useState('');
  const [loading, setLoading] = useState(false);
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const [partClass, setPartClass] = useState<PartClass | 'all'>('all');
  const [stock, setStock] = useState<Stock | 'all'>('all');
  const [payload, setPayload] = useState<number | null>(null);
  const [reach, setReach] = useState<number | null>(null);
  const [stroke, setStroke] = useState<number | null>(null);
  const [gripForce, setGripForce] = useState<number | null>(null);
  const [dof, setDof] = useState<number | null>(null);
  const normalizedKeyword = keyword.trim().toLowerCase();
  const categories = appState.categories;
  const products = appState.products;
  const scopedProducts = useMemo(
    () =>
      products.filter(
        (product) =>
          product.catalogVisible &&
          (activeCategory === 'all' || product.category === activeCategory),
      ),
    [activeCategory, products],
  );
  const activeFilterCount = [
    activeCategory !== 'all',
    keyword.trim().length > 0,
    partClass !== 'all',
    stock !== 'all',
    payload !== null,
    reach !== null,
    stroke !== null,
    gripForce !== null,
    dof !== null,
  ].filter(Boolean).length;
  const visibleProducts = useMemo(
    () =>
      scopedProducts.filter((product) => {
        if (partClass !== 'all' && product.partClass !== partClass) return false;
        if (stock !== 'all' && product.stock !== stock) return false;
        if (payload !== null && (product.selection?.payloadKg ?? 0) < payload) return false;
        if (reach !== null && (product.selection?.reachMm ?? 0) < reach) return false;
        if (stroke !== null && (product.selection?.strokeMm ?? 0) < stroke) return false;
        if (gripForce !== null && (product.selection?.gripForceN ?? 0) < gripForce) return false;
        if (dof !== null && product.selection?.dof !== dof) return false;
        if (!normalizedKeyword) return true;
        return (
          product.model.toLowerCase().includes(normalizedKeyword) ||
          localized(product.name).toLowerCase().includes(normalizedKeyword)
        );
      }),
    [dof, gripForce, normalizedKeyword, partClass, payload, reach, scopedProducts, stock, stroke],
  );
  const availability = useMemo(
    () => ({
      partClass: new Set(scopedProducts.map((product) => product.partClass)),
      stock: new Set(scopedProducts.map((product) => product.stock)),
      payload: payloadOptions.filter((value) =>
        scopedProducts.some((product) => (product.selection?.payloadKg ?? 0) >= value),
      ),
      reach: reachOptions.filter((value) =>
        scopedProducts.some((product) => (product.selection?.reachMm ?? 0) >= value),
      ),
      stroke: strokeOptions.filter((value) =>
        scopedProducts.some((product) => (product.selection?.strokeMm ?? 0) >= value),
      ),
      gripForce: gripForceOptions.filter((value) =>
        scopedProducts.some((product) => (product.selection?.gripForceN ?? 0) >= value),
      ),
      dof: dofOptions.filter((value) =>
        scopedProducts.some((product) => product.selection?.dof === value),
      ),
    }),
    [scopedProducts],
  );

  useEffect(() => {
    setLoading(true);
    loadCatalog()
      .catch(() => {
        Taro.showToast({ title: '商品同步失败，已显示本地目录', icon: 'none' });
      })
      .finally(() => setLoading(false));
  }, []);

  function openProduct(slug: string) {
    Taro.navigateTo({ url: `/pages/product-detail/index?slug=${slug}` });
  }

  function addProduct(productId: string, quoteRequired: boolean) {
    setActiveProject('web');
    addProductToActiveCart(productId);
    Taro.showToast({ title: quoteRequired ? '已加入购物车，提交时询价' : '已加入购物车', icon: 'success' });
  }

  function clearFilters() {
    setActiveCategory('all');
    setKeyword('');
    setPartClass('all');
    setStock('all');
    setPayload(null);
    setReach(null);
    setStroke(null);
    setGripForce(null);
    setDof(null);
  }

  return (
    <View className="page products-page">
      <View className="search-shell">
        <Input
          value={keyword}
          placeholder="搜索型号 / 品类 / 名称"
          confirmType="search"
          onInput={(event) => setKeyword(String(event.detail.value))}
        />
      </View>

      <ScrollView className="category-strip" scrollX enhanced showScrollbar={false}>
        <Button
          className={`category-chip ${activeCategory === 'all' ? 'active' : ''}`}
          onClick={() => setActiveCategory('all')}
        >
          全部
        </Button>
        {categories.map((category) => (
          <Button
            key={category.id}
            className={`category-chip ${activeCategory === category.id ? 'active' : ''}`}
            onClick={() => setActiveCategory(category.id)}
          >
            {localized(category.name)}
          </Button>
        ))}
      </ScrollView>

      <View className="between result-row">
        <Text className="hint">{loading ? '同步商品中' : `${visibleProducts.length} 个结果`}</Text>
        <View className="result-actions">
          {activeFilterCount > 0 && (
            <Button className="clear-button" onClick={clearFilters}>
              清空
            </Button>
          )}
          <Button className="filter-button" onClick={() => setAdvancedOpen((value) => !value)}>
            {advancedOpen ? '收起' : activeFilterCount > 0 ? `筛选 ${activeFilterCount}` : '筛选'}
          </Button>
        </View>
      </View>

      {advancedOpen && (
        <View className="surface filter-panel">
          <FilterGroup title="类型">
            <FilterChip active={partClass === 'all'} onClick={() => setPartClass('all')}>
              全部
            </FilterChip>
            {partClassOptions
              .filter((option) => availability.partClass.has(option))
              .map((option) => (
                <FilterChip
                  key={option}
                  active={partClass === option}
                  onClick={() => setPartClass(partClass === option ? 'all' : option)}
                >
                  {partClassLabel(option)}
                </FilterChip>
              ))}
          </FilterGroup>
          <FilterGroup title="库存">
            <FilterChip active={stock === 'all'} onClick={() => setStock('all')}>
              全部
            </FilterChip>
            {stockOptions
              .filter((option) => availability.stock.has(option))
              .map((option) => (
                <FilterChip
                  key={option}
                  active={stock === option}
                  onClick={() => setStock(stock === option ? 'all' : option)}
                >
                  {stockLabel(option)}
                </FilterChip>
              ))}
          </FilterGroup>
          {availability.payload.length > 0 && (
            <FilterGroup title="负载">
              {availability.payload.map((value) => (
                <FilterChip
                  key={value}
                  active={payload === value}
                  onClick={() => setPayload(payload === value ? null : value)}
                >
                  ≥ {value}kg
                </FilterChip>
              ))}
            </FilterGroup>
          )}
          {availability.reach.length > 0 && (
            <FilterGroup title="臂展">
              {availability.reach.map((value) => (
                <FilterChip
                  key={value}
                  active={reach === value}
                  onClick={() => setReach(reach === value ? null : value)}
                >
                  ≥ {value}mm
                </FilterChip>
              ))}
            </FilterGroup>
          )}
          {availability.stroke.length > 0 && (
            <FilterGroup title="行程">
              {availability.stroke.map((value) => (
                <FilterChip
                  key={value}
                  active={stroke === value}
                  onClick={() => setStroke(stroke === value ? null : value)}
                >
                  ≥ {value}mm
                </FilterChip>
              ))}
            </FilterGroup>
          )}
          {availability.gripForce.length > 0 && (
            <FilterGroup title="夹持力">
              {availability.gripForce.map((value) => (
                <FilterChip
                  key={value}
                  active={gripForce === value}
                  onClick={() => setGripForce(gripForce === value ? null : value)}
                >
                  ≥ {value}N
                </FilterChip>
              ))}
            </FilterGroup>
          )}
          {availability.dof.length > 0 && (
            <FilterGroup title="自由度">
              {availability.dof.map((value) => (
                <FilterChip
                  key={value}
                  active={dof === value}
                  onClick={() => setDof(dof === value ? null : value)}
                >
                  {value} 轴
                </FilterChip>
              ))}
            </FilterGroup>
          )}
        </View>
      )}

      <View className="product-list">
        {visibleProducts.map((product) => (
          <View key={product.id} className="surface product-card" onClick={() => openProduct(product.slug)}>
            <View className={`product-visual visual-${product.category}`}>
              {product.image ? (
                <Image className="product-image" src={product.image} mode="aspectFit" />
              ) : (
                <Text>{product.model.split(' ')[0]}</Text>
              )}
            </View>
            <View className="product-info">
              <Text className="model">{product.model}</Text>
              <Text className="name">{localized(product.name)}</Text>
              <Text className="desc">{localized(product.description)}</Text>
              <View className="tag-row">
                <Text className={product.partClass === 'custom' ? 'tag tag-yellow' : 'tag tag-red'}>
                  {partClassLabel(product.partClass)}
                </Text>
                <Text className={product.stock === 'in-stock' ? 'tag tag-green' : 'tag'}>
                  {stockLabel(product.stock)}
                </Text>
              </View>
              <View className="between">
                <Text className="price">{formatPrice(product.priceCents, product.currency)}</Text>
                <Button
                  className={product.partClass === 'custom' ? 'ghost-button compact' : 'secondary-button compact'}
                  onClick={(event) => {
                    event.stopPropagation();
                    addProduct(product.id, product.partClass === 'custom' || product.priceCents === 0);
                  }}
                >
                  {product.partClass === 'custom' ? '询价' : '加入购物车'}
                </Button>
              </View>
            </View>
          </View>
        ))}
      </View>
    </View>
  );
}

function FilterGroup({ title, children }: { title: string; children: ReactNode }) {
  return (
    <View className="filter-group">
      <Text className="filter-title">{title}</Text>
      <View className="filter-options">{children}</View>
    </View>
  );
}

function FilterChip({
  active,
  children,
  onClick,
}: {
  active: boolean;
  children: ReactNode;
  onClick: () => void;
}) {
  return (
    <Button className={active ? 'filter-chip active' : 'filter-chip'} onClick={onClick}>
      {children}
    </Button>
  );
}
