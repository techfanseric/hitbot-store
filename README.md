# HitbotOS Store 商城前台

慧灵科技 B2B 自营商城前台原型。目标态挂在官网 `hitbot.cc` 下，并与 OS 端共用项目 BOM / 购物车 / 订单数据；当前 M0 仍是 mock 数据 + localStorage 本地清单。

技术栈：Next.js 15 + Tailwind v4 + shadcn/ui + next-intl v4 + Zustand + next-themes。

---

## 快速开始

```bash
# 安装依赖
pnpm install

# 启动开发服务器（http://localhost:3000）
pnpm dev

# 类型检查
pnpm typecheck

# 代码检查
pnpm lint

# 生产构建
pnpm build

# 启动生产服务器
pnpm start
```

Node 版本要求：20.x 或 24.x（见 `.nvmrc`）。包管理器：**pnpm 10+**。

---

## 项目结构

```
src/
├── app/
│   ├── layout.tsx            根 layout（仅 import globals.css）
│   ├── [locale]/
│   │   ├── layout.tsx        locale layout（套 Providers + TopNav + Footer）
│   │   ├── page.tsx          首页
│   │   ├── products/         商品列表 + 详情
│   │   └── design-system/    Token 展示页
│   └── globals.css           ⭐ 所有设计 token + Tailwind v4 配置
│
├── components/
│   ├── ui/                   shadcn 原子组件（button / badge / sheet / ...）
│   ├── store/                业务组件（top-nav / product-card / cart-* / ...）
│   ├── theme/                next-themes 包装
│   └── providers.tsx         NextIntlClientProvider + ThemeProvider + Toaster
│
├── lib/
│   ├── utils.ts              cn() —— clsx + tailwind-merge
│   ├── cart-store.ts         Zustand + persist（localStorage）
│   └── format.ts             formatPrice / formatDate
│
├── hooks/
│   └── use-cart.ts           useCartSafe() —— SSR hydration 安全的购物车 hook
│
├── i18n/
│   ├── routing.ts            defineRouting + createNavigation
│   ├── request.ts            getRequestConfig (v4 API)
│   └── navigation.ts         Link / redirect / usePathname / useRouter
│
├── types/                    Product / CartItem / LocalizedString
├── mock-data/                10 个商品 + 7 个分类（写死常量）
└── middleware.ts             next-intl 路由中间件

messages/
├── zh.json
└── en.json
```

---

## 关键约定

### 1. 颜色和字号
**只用 Tailwind 类，不写 inline 颜色。** 全部 token 在 `src/app/globals.css` 的 `@theme inline` 块定义，常见类名：
- 品牌色：`bg-brand-500` / `text-brand-500` / `bg-brand-soft` / `text-brand-400`
- 主题色：`bg-bg-app` / `bg-bg-elevated` / `bg-bg-control` / `bg-bg-surface`
- 文字：`text-text-strong` / `text-text` / `text-text-muted`
- 状态：`bg-state-green` / `bg-state-yellow` / `bg-state-danger` / `text-state-green-strong`

完整列表见 `docs/design/DESIGN-TOKENS.md`。

### 2. 主题切换
`html.light` / `html.dark` 两套语义变量，由 `next-themes` 切换。`<html>` class 改了就生效。

### 3. 国际化
- **路由层**：`/zh` `/en` 前缀，middleware 自动处理 `/` → `/zh` 重定向
- **服务端**：`getTranslations('namespace')` 用于 RSC
- **客户端**：`useTranslations('namespace')` 用于 client component
- **添加新文案**：先在两个 `messages/*.json` 加 key，再在代码里用

### 4. 按钮
直接用 `<Button variant="primary">` 等 4 套之一，**不要再用 shadcn 默认 6 个 variant**。完整定义在 `src/components/ui/button.tsx`。

### 5. 状态徽标
`<Badge variant="in-stock">` 等 10 种之一。完整定义在 `src/components/ui/badge.tsx`。

### 6. 购物车
```tsx
import { useCartSafe } from '@/hooks/use-cart';
const { items, count, hydrated, add, remove, setQty, clear } = useCartSafe();
```

`hydrated` 在 SSR 阶段是 `false`，客户端 hydrate 后变 `true`，避免数字闪烁。

当前购物车按**项目 BOM**语义建模，而不是普通电商购物车。`CartItem` 已预留：

- `projectId/projectName`：当前项目或官网选购清单
- `source`：来源是官网 `web` 还是 OS 端 `os`
- `selected`：用户是否勾选进入本次下单
- `sellable`：是否可直接售卖
- `quoteRequired`：是否需要询价/定制承接
- `syncStatus`：本地暂存、待同步或已同步

M0 使用 `hitbot-cart-v2` localStorage；后续接后端时应保留这套语义字段，而不是退回普通商品篮子模型。

---

## 添加新组件

```bash
# 添加 shadcn 组件
pnpm dlx shadcn@latest add <name>

# 注意：shadcn 默认会写入 .light/.dark 之外的 :root 变量块
# 如果它污染了 globals.css，从我们自己的 token 块覆盖即可
```

**警告**：安装 shadcn 新组件后，**检查 `src/components/ui/button.tsx` 和 `src/components/ui/badge.tsx`** 不会被覆盖（我们重写了 cva）。如果被覆盖，git diff 看变化并恢复我们的版本。

---

## 添加新语言

1. 在 `src/i18n/routing.ts` 的 `locales` 数组加新 code
2. 复制 `messages/zh.json` → `messages/<code>.json`，翻译所有 key
3. `pnpm typecheck` + `pnpm build` 验证

---

## 添加新商品 / 分类

编辑 `src/mock-data/products.ts` 和 `src/mock-data/categories.ts`，所有商品走 `Product` 类型。**改完不需要重新 build**（mock 数据在客户端 bundle 中），HMR 自动生效。

---

## 文档目录

`docs/` 按用途拆分，避免需求源、设计规范、实现验收和过程截图混在一起：

- `docs/product/`：PRD 与会议 transcript
- `docs/research/`：官网与 HitbotOS 端调研，`references/` 内放调研截图
- `docs/design/`：设计系统源规范、token 映射、页头页脚实测规范
- `docs/verification/`：M0 验收清单与最终验收截图
- `docs/audits/`：阶段性审计截图
- `docs/archive/`：历史设计迭代截图

---

## 部署

```bash
pnpm build  # 生成 .next/ 目录
```

产物是纯静态 SSG + middleware，可部署到 Vercel / Cloudflare Pages / 任何支持 Next.js 的平台。
