export type ProductCategory =
  | 'gripper'
  | 'arm-4axis'
  | 'arm-6axis'
  | 'dex-hand'
  | 'humanoid'
  | 'cylinder'
  | 'motor';

export type PartClass = 'standard' | 'custom' | 'reference';

export type Stock = 'in-stock' | 'out-of-stock' | 'preorder';

export type Currency = 'CNY' | 'USD';

export interface LocalizedString {
  zh: string;
  en: string;
}

export interface ProductSpec {
  key: LocalizedString;
  value: string;
}

export interface ProductSelection {
  reachMm?: number;
  payloadKg?: number;
  strokeMm?: number;
  gripForceN?: number;
  dof?: number;
}

export interface Product {
  id: string;
  slug: string;
  model: string;
  name: LocalizedString;
  category: ProductCategory;
  partClass: PartClass;
  catalogVisible: boolean;
  priceCents: number;
  currency: Currency;
  stock: Stock;
  images: string[];
  specs: ProductSpec[];
  selection?: ProductSelection;
  accessoryProductIds?: string[];
  description: LocalizedString;
  seoDescription?: LocalizedString;
  legacyUrls?: string[];
  featured: boolean;
  publishedAt: string;
}
