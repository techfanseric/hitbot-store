import type { Product } from './types';

export const products: Product[] = [
  {
    id: 'p-001',
    slug: 'z-emg-4',
    model: 'Z-EMG-4',
    name: { zh: 'Z-EMG-4 电动夹爪', en: 'Z-EMG-4 Electric Gripper' },
    category: 'gripper',
    partClass: 'standard',
    catalogVisible: true,
    priceCents: 280000,
    currency: 'CNY',
    stock: 'in-stock',
    image: '/assets/products/z-emg-4.jpg',
    specs: [
      { key: { zh: '夹持力', en: 'Grip force' }, value: '20-40 N' },
      { key: { zh: '行程', en: 'Stroke' }, value: '8 mm' },
      { key: { zh: '重量', en: 'Weight' }, value: '0.18 kg' },
    ],
    selection: { strokeMm: 8, gripForceN: 40 },
    description: {
      zh: '适用于桌面级装配、检测与轻量搬运的紧凑型电动夹爪。',
      en: 'Compact electric gripper for desktop assembly, inspection, and light handling.',
    },
    featured: true,
  },
  {
    id: 'p-002',
    slug: 'z-efg-8s',
    model: 'Z-EFG-8S',
    name: { zh: 'Z-EFG-8S 电动夹爪', en: 'Z-EFG-8S Electric Gripper' },
    category: 'gripper',
    partClass: 'standard',
    catalogVisible: true,
    priceCents: 320000,
    currency: 'CNY',
    stock: 'in-stock',
    image: '/assets/products/z-efg-8s.jpg',
    specs: [
      { key: { zh: '夹持力', en: 'Grip force' }, value: '40-80 N' },
      { key: { zh: '行程', en: 'Stroke' }, value: '20 mm' },
      { key: { zh: '通讯', en: 'Communication' }, value: 'Modbus RTU' },
    ],
    selection: { strokeMm: 20, gripForceN: 80 },
    accessoryProductIds: ['p-008'],
    description: {
      zh: '适合轻工业自动化场景的高性价比电动夹爪。',
      en: 'Cost-effective electric gripper for light industrial automation.',
    },
    featured: true,
  },
  {
    id: 'p-003',
    slug: 'z-efg-20',
    model: 'Z-EFG-20',
    name: { zh: 'Z-EFG-20 平行电爪', en: 'Z-EFG-20 Parallel Gripper' },
    category: 'gripper',
    partClass: 'standard',
    catalogVisible: true,
    priceCents: 450000,
    currency: 'CNY',
    stock: 'out-of-stock',
    image: '/assets/products/z-efg-20.jpg',
    specs: [
      { key: { zh: '夹持力', en: 'Grip force' }, value: '80 N' },
      { key: { zh: '行程', en: 'Stroke' }, value: '20 mm' },
      { key: { zh: '重量', en: 'Weight' }, value: '0.45 kg' },
    ],
    selection: { strokeMm: 20, gripForceN: 80 },
    description: {
      zh: '中行程平行电爪，夹持力大，适合较大尺寸工件。',
      en: 'Mid-stroke parallel gripper for larger workpieces.',
    },
    featured: false,
  },
  {
    id: 'p-004',
    slug: 'z-arm-s622',
    model: 'Z-Arm S622',
    name: { zh: 'Z-Arm S622 四轴机械臂', en: 'Z-Arm S622 SCARA Robot' },
    category: 'arm-4axis',
    partClass: 'standard',
    catalogVisible: true,
    priceCents: 1800000,
    currency: 'CNY',
    stock: 'in-stock',
    image: '/assets/products/z-arm-s622.jpg',
    specs: [
      { key: { zh: '负载', en: 'Payload' }, value: '2 kg' },
      { key: { zh: '臂展', en: 'Reach' }, value: '620 mm' },
      { key: { zh: '自由度', en: 'DOF' }, value: '4' },
    ],
    selection: { payloadKg: 2, reachMm: 620, dof: 4 },
    accessoryProductIds: ['p-001', 'p-002'],
    description: {
      zh: '面向包装、上下料和检测工位的紧凑四轴机械臂。',
      en: 'Compact 4-axis arm for packaging, loading, and inspection cells.',
    },
    featured: true,
  },
  {
    id: 'p-005',
    slug: 'z-arm-2442',
    model: 'Z-Arm 2442',
    name: { zh: 'Z-Arm 2442 轻量机械臂', en: 'Z-Arm 2442 Lightweight Arm' },
    category: 'arm-4axis',
    partClass: 'standard',
    catalogVisible: true,
    priceCents: 1200000,
    currency: 'CNY',
    stock: 'in-stock',
    image: '/assets/products/z-arm-2442.jpg',
    specs: [
      { key: { zh: '负载', en: 'Payload' }, value: '2 kg' },
      { key: { zh: '臂展', en: 'Reach' }, value: '440 mm' },
      { key: { zh: '自由度', en: 'DOF' }, value: '4' },
    ],
    selection: { payloadKg: 2, reachMm: 440, dof: 4 },
    accessoryProductIds: ['p-001', 'p-002', 'p-008'],
    description: {
      zh: '入门级四轴机械臂，桌面部署、编程简单。',
      en: 'Entry-level 4-axis arm, easy desktop setup.',
    },
    featured: false,
  },
  {
    id: 'p-006',
    slug: 'z-arm-h1500',
    model: 'Z-Arm H1500',
    name: { zh: 'Z-Arm H1500 协作机械臂', en: 'Z-Arm H1500 Collaborative Arm' },
    category: 'arm-6axis',
    partClass: 'standard',
    catalogVisible: true,
    priceCents: 8500000,
    currency: 'CNY',
    stock: 'in-stock',
    image: '/assets/products/z-arm-h1500.png',
    specs: [
      { key: { zh: '负载', en: 'Payload' }, value: '8 kg' },
      { key: { zh: '臂展', en: 'Reach' }, value: '1500 mm' },
      { key: { zh: '自由度', en: 'DOF' }, value: '6' },
    ],
    selection: { payloadKg: 8, reachMm: 1500, dof: 6 },
    description: {
      zh: '覆盖中大负载搬运、装配和协作应用的六轴机械臂。',
      en: '6-axis collaborative arm for medium-load handling and assembly.',
    },
    featured: false,
  },
  {
    id: 'p-007',
    slug: 'z-hand-6',
    model: 'Z-Hand 6',
    name: { zh: 'Z-Hand 6 灵巧手', en: 'Z-Hand 6 Dexterous Hand' },
    category: 'dex-hand',
    partClass: 'standard',
    catalogVisible: true,
    priceCents: 9800000,
    currency: 'CNY',
    stock: 'in-stock',
    image: '/assets/products/ehand-6.png',
    specs: [
      { key: { zh: '自由度', en: 'DOF' }, value: '6' },
      { key: { zh: '控制方式', en: 'Control' }, value: 'Integrated controller' },
    ],
    selection: { dof: 6 },
    description: {
      zh: '用于复杂抓取、展示和科研验证的多自由度灵巧手。',
      en: 'Multi-DOF dexterous hand for complex grasping and research demos.',
    },
    featured: false,
  },
  {
    id: 'p-008',
    slug: 'z-mod-se-54',
    model: 'Z-Mod-SE-54',
    name: { zh: 'Z-Mod-SE-54 末端模块', en: 'Z-Mod-SE-54 End Module' },
    category: 'motor',
    partClass: 'standard',
    catalogVisible: true,
    priceCents: 580000,
    currency: 'CNY',
    stock: 'in-stock',
    image: '/assets/products/z-mod-se-54.jpg',
    specs: [
      { key: { zh: '接口', en: 'Interface' }, value: 'HITBOT quick mount' },
      { key: { zh: '用途', en: 'Use' }, value: 'End adapter' },
    ],
    description: {
      zh: '用于末端执行器快换与转接的标准模块。',
      en: 'Standard end module for quick-change and adapter use.',
    },
    featured: false,
  },
  {
    id: 'p-010',
    slug: 'custom-frame-a1',
    model: 'Custom-Frame-A1',
    name: { zh: '定制工装框架 A1', en: 'Custom Fixture Frame A1' },
    category: 'cylinder',
    partClass: 'custom',
    catalogVisible: true,
    priceCents: 0,
    currency: 'CNY',
    stock: 'preorder',
    image: '/assets/products/custom-frame-kit.jpg',
    specs: [
      { key: { zh: '交付方式', en: 'Delivery' }, value: '提交后报价' },
      { key: { zh: '加工', en: 'Machining' }, value: '按项目定制' },
    ],
    description: {
      zh: '按项目尺寸和安装方式定制的工装框架，提交后由销售报价。',
      en: 'Project-specific fixture frame quoted by the sales team.',
    },
    featured: false,
  },
];

export function getProductById(productId: string) {
  return products.find((product) => product.id === productId);
}

export function getProductBySlug(slug: string) {
  return products.find((product) => product.slug === slug);
}

export function getRelatedProducts(productId: string) {
  const current = getProductById(productId);
  if (!current) return [];
  const relatedIds = current.accessoryProductIds ?? [];
  return products.filter(
    (product) =>
      product.id !== current.id &&
      product.catalogVisible &&
      (relatedIds.includes(product.id) || product.category === current.category),
  );
}
