import type { ProductCategory } from '@/types/product';

export interface Category {
  id: ProductCategory;
  slug: string;
  name: { zh: string; en: string };
  icon: string;
  count: number;
}

export const categories: Category[] = [
  { id: 'gripper', slug: 'gripper', name: { zh: '抓取设备', en: 'Grippers' }, icon: 'Hand', count: 0 },
  { id: 'arm-4axis', slug: 'arm-4axis', name: { zh: '四轴机器臂', en: '4-Axis Arms' }, icon: 'Bot', count: 0 },
  { id: 'arm-6axis', slug: 'arm-6axis', name: { zh: '六轴机器臂', en: '6-Axis Arms' }, icon: 'Bot', count: 0 },
  { id: 'dex-hand', slug: 'dex-hand', name: { zh: '灵巧手', en: 'Dexterous Hands' }, icon: 'HandMetal', count: 0 },
  { id: 'humanoid', slug: 'humanoid', name: { zh: '人形机器人', en: 'Humanoid Robots' }, icon: 'PersonStanding', count: 0 },
  { id: 'cylinder', slug: 'cylinder', name: { zh: '智能电缸', en: 'Electric Cylinders' }, icon: 'Cylinder', count: 0 },
  { id: 'motor', slug: 'motor', name: { zh: '电机', en: 'Motors' }, icon: 'Cpu', count: 0 },
];

export function getCategoryById(id: ProductCategory): Category | undefined {
  return categories.find((c) => c.id === id);
}
