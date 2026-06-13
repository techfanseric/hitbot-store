import { getProductById } from './products';
import type { CartItem, CartProject, PartClass } from './types';

export const defaultEnterprise = {
  enterpriseId: 'ENT-HITBOT-CUSTOMER',
  companyName: '深圳智造装备有限公司',
};

export const defaultProject: CartProject = {
  ...defaultEnterprise,
  projectId: 'web-catalog',
  projectName: '商城商品选购',
  source: 'web',
  items: [
    {
      productId: 'p-002',
      qty: 1,
      partClass: 'standard',
      source: 'web',
      selected: true,
      sellable: true,
      quoteRequired: false,
      syncStatus: 'local',
      addedAt: Date.now(),
    },
    {
      productId: 'p-010',
      qty: 1,
      partClass: 'custom',
      source: 'web',
      selected: true,
      sellable: false,
      quoteRequired: true,
      syncStatus: 'local',
      addedAt: Date.now(),
    },
  ],
  updatedAt: Date.now(),
};

export const osDemoProject: CartProject = {
  ...defaultEnterprise,
  projectId: 'os-line-pack-01',
  projectName: '包装线上料工位改造',
  source: 'os',
  items: [
    {
      productId: 'p-004',
      qty: 1,
      partClass: 'standard',
      source: 'os',
      selected: true,
      sellable: true,
      quoteRequired: false,
      syncStatus: 'pending',
      addedAt: Date.now(),
    },
    {
      productId: 'p-002',
      qty: 1,
      partClass: 'standard',
      source: 'os',
      selected: true,
      sellable: true,
      quoteRequired: false,
      syncStatus: 'pending',
      addedAt: Date.now(),
    },
    {
      productId: 'p-010',
      qty: 1,
      partClass: 'custom',
      source: 'os',
      selected: true,
      sellable: false,
      quoteRequired: true,
      syncStatus: 'pending',
      addedAt: Date.now(),
    },
  ],
  updatedAt: Date.now(),
};

export function createCartItem(productId: string, partClass: PartClass): CartItem {
  const sellable = partClass === 'standard';
  return {
    productId,
    partClass,
    qty: 1,
    source: 'web',
    selected: sellable || partClass === 'custom',
    sellable,
    quoteRequired: !sellable,
    syncStatus: 'local',
    addedAt: Date.now(),
  };
}

export function cartSubtotal(items: CartItem[]) {
  return items.reduce((sum, item) => {
    const product = getProductById(item.productId);
    if (!product || !item.selected || !item.sellable) return sum;
    return sum + product.priceCents * item.qty;
  }, 0);
}

export function selectedItemCount(items: CartItem[]) {
  return items.reduce((sum, item) => sum + (item.selected ? item.qty : 0), 0);
}

export function quoteItemCount(items: CartItem[]) {
  return items.reduce((sum, item) => sum + (item.selected && item.quoteRequired ? item.qty : 0), 0);
}
