import type { PartClass } from './product';

export type CartSource = 'web' | 'os';
export type CartSyncStatus = 'local' | 'synced' | 'pending';

export interface CartItem {
  productId: string;
  qty: number;
  partClass: PartClass;
  source: CartSource;
  selected: boolean;
  sellable: boolean;
  quoteRequired: boolean;
  syncStatus: CartSyncStatus;
  addedAt: number;
}

export interface CartProject {
  enterpriseId?: string;
  companyName?: string;
  projectId: string;
  projectName: string;
  source: CartSource;
  items: CartItem[];
  updatedAt: number;
}

export interface OsBomItemInput {
  productId: string;
  qty: number;
  partClass: PartClass;
  sellable?: boolean;
  selected?: boolean;
  quoteRequired?: boolean;
}

export interface OsBomImportInput {
  projectId: string;
  projectName: string;
  items: OsBomItemInput[];
  replace?: boolean;
}
