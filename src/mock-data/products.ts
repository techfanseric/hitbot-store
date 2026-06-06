import type { Product } from '@/types/product';

/**
 * Mock 商品数据，型号沿用 OS 端调研里发现的真实编号
 * (Z-EMG-4 / Z-EFG-8S / Z-Arm S622 等)
 * 所有金额单位为分（cents），¥2,800 = 280000
 */
export const products: Product[] = [
  {
    id: 'p-001',
    slug: 'z-emg-4',
    model: 'Z-EMG-4',
    name: { zh: '电动夹爪 EMG-4', en: 'Electric Gripper EMG-4' },
    category: 'gripper',
    partClass: 'standard',
    catalogVisible: true,
    priceCents: 280000,
    currency: 'CNY',
    stock: 'in-stock',
    images: ['/hitbot/products/z-emg-4.png'],
    specs: [
      { key: { zh: '行程', en: 'Stroke' }, value: '4 mm' },
      { key: { zh: '夹持力', en: 'Grip Force' }, value: '20 N' },
      { key: { zh: '重量', en: 'Weight' }, value: '180 g' },
      { key: { zh: '工作电压', en: 'Voltage' }, value: '24 V DC' },
      { key: { zh: '通讯', en: 'Comm' }, value: 'RS485 / Modbus RTU' },
    ],
    selection: {
      strokeMm: 4,
      gripForceN: 20,
    },
    description: {
      zh: '紧凑型电动夹爪，适合 3C 装配、零部件抓取等场景，开环控制，响应快。',
      en: 'Compact electric gripper for 3C assembly and parts handling. Open-loop, fast response.',
    },
    seoDescription: {
      zh: 'Z-EMG-4 紧凑型电动夹爪，适合 3C 装配、实验室自动化和小型零部件抓取。',
      en: 'Z-EMG-4 compact electric gripper for 3C assembly, lab automation, and small parts handling.',
    },
    legacyUrls: ['/terminal-gripper/'],
    featured: true,
    publishedAt: '2026-02-10',
  },
  {
    id: 'p-002',
    slug: 'z-efg-8s',
    model: 'Z-EFG-8S',
    name: { zh: '平行电爪 EFG-8S', en: 'Parallel Gripper EFG-8S' },
    category: 'gripper',
    partClass: 'standard',
    catalogVisible: true,
    priceCents: 320000,
    currency: 'CNY',
    stock: 'in-stock',
    images: ['/hitbot/products/z-efg-8s.jpg'],
    specs: [
      { key: { zh: '行程', en: 'Stroke' }, value: '8 mm' },
      { key: { zh: '夹持力', en: 'Grip Force' }, value: '40 N' },
      { key: { zh: '重量', en: 'Weight' }, value: '260 g' },
      { key: { zh: '重复精度', en: 'Repeatability' }, value: '±0.02 mm' },
    ],
    selection: {
      strokeMm: 8,
      gripForceN: 40,
    },
    description: {
      zh: '高性价比平行电爪，闭环节流控制，适用于实验室自动化与小型零件抓取。',
      en: 'High-value parallel gripper with closed-loop force control.',
    },
    seoDescription: {
      zh: 'Z-EFG-8S 平行电爪，闭环力控，适合实验室自动化、小型零件抓取和桌面工作站。',
      en: 'Z-EFG-8S parallel gripper with closed-loop force control for lab automation and compact workstations.',
    },
    legacyUrls: ['/terminal-gripper/'],
    featured: true,
    publishedAt: '2026-02-12',
  },
  {
    id: 'p-003',
    slug: 'z-efg-20',
    model: 'Z-EFG-20',
    name: { zh: '平行电爪 EFG-20', en: 'Parallel Gripper EFG-20' },
    category: 'gripper',
    partClass: 'standard',
    catalogVisible: true,
    priceCents: 450000,
    currency: 'CNY',
    stock: 'out-of-stock',
    images: ['/hitbot/products/z-efg-20.jpg'],
    specs: [
      { key: { zh: '行程', en: 'Stroke' }, value: '20 mm' },
      { key: { zh: '夹持力', en: 'Grip Force' }, value: '80 N' },
      { key: { zh: '重量', en: 'Weight' }, value: '450 g' },
    ],
    selection: {
      strokeMm: 20,
      gripForceN: 80,
    },
    description: {
      zh: '中行程平行电爪，夹持力大，适合较大尺寸工件。',
      en: 'Mid-stroke parallel gripper for larger workpieces.',
    },
    seoDescription: {
      zh: 'Z-EFG-20 中行程平行电爪，面向较大尺寸工件夹持和自动化上下料场景。',
      en: 'Z-EFG-20 mid-stroke parallel gripper for larger workpieces and automated handling.',
    },
    legacyUrls: ['/terminal-gripper/'],
    featured: false,
    publishedAt: '2026-01-20',
  },
  {
    id: 'p-004',
    slug: 'z-arm-s622',
    model: 'Z-Arm S622',
    name: { zh: '协作机械臂 S622', en: 'Collaborative Arm S622' },
    category: 'arm-4axis',
    partClass: 'standard',
    catalogVisible: true,
    priceCents: 1800000,
    currency: 'CNY',
    stock: 'in-stock',
    images: ['/hitbot/products/z-arm-s622.jpg'],
    specs: [
      { key: { zh: '臂长', en: 'Reach' }, value: '622 mm' },
      { key: { zh: '负载', en: 'Payload' }, value: '3 kg' },
      { key: { zh: '重复精度', en: 'Repeatability' }, value: '±0.02 mm' },
      { key: { zh: '自由度', en: 'DOF' }, value: '4' },
    ],
    selection: {
      reachMm: 622,
      payloadKg: 3,
      dof: 4,
    },
    accessoryProductIds: ['p-001', 'p-002', 'p-007'],
    description: {
      zh: '四轴协作机械臂，臂长 622mm，适合 3C 装配、检测、上下料。',
      en: '4-axis cobot, 622mm reach, for 3C assembly and pick-and-place.',
    },
    seoDescription: {
      zh: 'Z-Arm S622 四轴协作机械臂，622mm 臂展，适合 3C 装配、检测和上下料。',
      en: 'Z-Arm S622 4-axis collaborative robot with 622mm reach for 3C assembly, inspection, and pick-and-place.',
    },
    legacyUrls: ['/4-axis-robots/'],
    featured: true,
    publishedAt: '2026-02-20',
  },
  {
    id: 'p-005',
    slug: 'z-arm-2442',
    model: 'Z-Arm 2442',
    name: { zh: '轻量机械臂 2442', en: 'Lightweight Arm 2442' },
    category: 'arm-4axis',
    partClass: 'standard',
    catalogVisible: true,
    priceCents: 1200000,
    currency: 'CNY',
    stock: 'in-stock',
    images: ['/hitbot/products/z-arm-2442.jpg'],
    specs: [
      { key: { zh: '臂长', en: 'Reach' }, value: '440 mm' },
      { key: { zh: '负载', en: 'Payload' }, value: '2 kg' },
      { key: { zh: '自由度', en: 'DOF' }, value: '4' },
    ],
    selection: {
      reachMm: 440,
      payloadKg: 2,
      dof: 4,
    },
    accessoryProductIds: ['p-001', 'p-002', 'p-008'],
    description: {
      zh: '入门级四轴机械臂，桌面部署、编程简单。',
      en: 'Entry-level 4-axis arm, easy desktop setup.',
    },
    seoDescription: {
      zh: 'Z-Arm 2442 轻量四轴机械臂，适合桌面部署、教学实验和轻量自动化。',
      en: 'Z-Arm 2442 lightweight 4-axis robot arm for desktop deployment, education, and light automation.',
    },
    legacyUrls: ['/4-axis-robots/'],
    featured: false,
    publishedAt: '2026-01-15',
  },
  {
    id: 'p-006',
    slug: 'z-arm-h1500',
    model: 'Z-Arm H1500',
    name: { zh: '六轴协作臂 H1500', en: '6-Axis Cobot H1500' },
    category: 'arm-6axis',
    partClass: 'standard',
    catalogVisible: true,
    priceCents: 8500000,
    currency: 'CNY',
    stock: 'preorder',
    images: ['/hitbot/products/z-arm-h1500.png'],
    specs: [
      { key: { zh: '臂长', en: 'Reach' }, value: '1500 mm' },
      { key: { zh: '负载', en: 'Payload' }, value: '8 kg' },
      { key: { zh: '自由度', en: 'DOF' }, value: '6' },
    ],
    selection: {
      reachMm: 1500,
      payloadKg: 8,
      dof: 6,
    },
    accessoryProductIds: ['p-003', 'p-007', 'p-010'],
    description: {
      zh: '高负载六轴协作臂，复杂动作编辑、多机协同。',
      en: 'High-payload 6-axis cobot for complex motions.',
    },
    seoDescription: {
      zh: 'Z-Arm H1500 六轴协作机械臂，支持高负载、复杂动作编辑和多机协同。',
      en: 'Z-Arm H1500 6-axis collaborative robot for high-payload tasks, complex motion editing, and multi-robot workflows.',
    },
    legacyUrls: ['/6-axis-collaborative/'],
    featured: true,
    publishedAt: '2026-03-01',
  },
  {
    id: 'p-007',
    slug: 'z-hand-6',
    model: 'Z-Hand 6',
    name: { zh: '灵巧手 6 自由度', en: 'Dexterous Hand 6 DOF' },
    category: 'dex-hand',
    partClass: 'standard',
    catalogVisible: true,
    priceCents: 9800000,
    currency: 'CNY',
    stock: 'in-stock',
    images: ['/hitbot/products/ehand-6.png'],
    specs: [
      { key: { zh: '自由度', en: 'DOF' }, value: '6' },
      { key: { zh: '指节数', en: 'Fingers' }, value: '5' },
      { key: { zh: '抓取模式', en: 'Grip Mode' }, value: '精确 / 模糊' },
    ],
    selection: {
      dof: 6,
    },
    accessoryProductIds: ['p-004', 'p-006'],
    description: {
      zh: '6 自由度灵巧手，可模拟人手复杂抓取动作。',
      en: '6-DOF dexterous hand for human-like manipulation.',
    },
    seoDescription: {
      zh: 'Z-Hand 6 六自由度灵巧手，面向仿人抓取、科研验证和具身智能末端执行。',
      en: 'Z-Hand 6 six-DOF dexterous hand for human-like grasping, research validation, and embodied manipulation.',
    },
    legacyUrls: ['/dexterous-hand/'],
    featured: true,
    publishedAt: '2026-02-28',
  },
  {
    id: 'p-008',
    slug: 'z-mod-se-54',
    model: 'Z-Mod-SE-54',
    name: { zh: '智能电缸 SE-54', en: 'Smart Electric Cylinder SE-54' },
    category: 'cylinder',
    partClass: 'standard',
    catalogVisible: true,
    priceCents: 580000,
    currency: 'CNY',
    stock: 'in-stock',
    images: ['/hitbot/products/z-mod-se-54.jpg'],
    specs: [
      { key: { zh: '行程', en: 'Stroke' }, value: '50 mm' },
      { key: { zh: '推力', en: 'Thrust' }, value: '200 N' },
      { key: { zh: '重复精度', en: 'Repeatability' }, value: '±0.01 mm' },
    ],
    selection: {
      strokeMm: 50,
    },
    description: {
      zh: '高精度智能电缸，可独立控制或联网协同。',
      en: 'High-precision smart cylinder, stand-alone or networked.',
    },
    seoDescription: {
      zh: 'Z-Mod-SE-54 高精度智能电缸，支持独立控制和联网协同，适合精密推拉与定位。',
      en: 'Z-Mod-SE-54 high-precision smart electric cylinder for standalone or networked positioning tasks.',
    },
    featured: false,
    publishedAt: '2026-02-05',
  },
  {
    id: 'p-009',
    slug: 'bottle-cap-1',
    model: 'Bottle_Cap_1',
    name: { zh: '瓶盖（参考件）', en: 'Bottle Cap (Reference)' },
    category: 'gripper',
    partClass: 'reference',
    catalogVisible: false,
    priceCents: 0,
    currency: 'CNY',
    stock: 'in-stock',
    images: ['/hitbot/os/simulation-3c.jpg'],
    specs: [
      { key: { zh: '材质', en: 'Material' }, value: 'PE' },
      { key: { zh: '直径', en: 'Diameter' }, value: '24 mm' },
    ],
    description: {
      zh: '3D 场景中的瓶盖模型，仅作演示，不售卖。',
      en: 'Bottle cap model in 3D scene. Reference only, not for sale.',
    },
    featured: false,
    publishedAt: '2026-01-10',
  },
  {
    id: 'p-010',
    slug: 'custom-frame-kit',
    model: 'Custom-Frame-A1',
    name: { zh: '定制型材套件 A1', en: 'Custom Frame Kit A1' },
    category: 'cylinder',
    partClass: 'custom',
    catalogVisible: true,
    priceCents: 0,
    currency: 'CNY',
    stock: 'in-stock',
    images: ['/hitbot/products/custom-frame-kit.jpg'],
    specs: [
      { key: { zh: '材质', en: 'Material' }, value: '6061-T6 铝' },
      { key: { zh: '加工', en: 'Process' }, value: 'CNC + 阳极氧化' },
    ],
    description: {
      zh: '按图加工的型材组件，需走定制流程。',
      en: 'Custom-machined frame parts. Custom order required.',
    },
    seoDescription: {
      zh: '定制型材套件 A1，按图加工，适合机器人工作站框架、夹具和非标结构件。',
      en: 'Custom Frame Kit A1 for robot workstation frames, fixtures, and non-standard machined structures.',
    },
    featured: false,
    publishedAt: '2026-01-05',
  },
];

export function getProductBySlug(slug: string): Product | undefined {
  return products.find((p) => p.slug === slug);
}

export function getProductById(id: string): Product | undefined {
  return products.find((p) => p.id === id);
}

export function getProductsByCategory(category: string): Product[] {
  return products.filter((p) => p.catalogVisible && p.category === category);
}

export function getFeaturedProducts(): Product[] {
  return products.filter((p) => p.catalogVisible && p.featured);
}

export function getRelatedProducts(productId: string, category: string, limit = 4): Product[] {
  return products
    .filter((p) => p.catalogVisible && p.id !== productId && p.category === category)
    .slice(0, limit);
}

export function getAccessoryProducts(product: Product, limit = 4): Product[] {
  const explicit = product.accessoryProductIds
    ?.map((id) => getProductById(id))
    .filter((item): item is Product => Boolean(item?.catalogVisible));

  if (explicit?.length) return explicit.slice(0, limit);

  if (product.category === 'gripper' || product.category === 'dex-hand') {
    return products
      .filter(
        (item) =>
          item.catalogVisible &&
          item.id !== product.id &&
          (item.category === 'arm-4axis' || item.category === 'arm-6axis'),
      )
      .slice(0, limit);
  }

  return [];
}
