# HitbotOS Store 商城前台

慧灵科技 B2B 自营商城前台原型。目标态挂在官网 `hitbot.cc` 下，并与 OS 端共用项目 BOM / 购物车 / 订单数据；当前 M0 仍是 mock 数据 + localStorage 本地清单。

技术栈：Next.js 15 + Tailwind v4 + shadcn/ui + next-intl v4 + Zustand + next-themes。

---

## 产品资料下载 — Web 与微信小程序

更新日期：2026-11-02

本次更新为商城网页端和微信小程序增加产品资料入口，用户可在商品详情中获取产品手册与三维模型文件：

- 商品参数下方新增「产品资料」区，手册和模型各占一行，保持紧凑布局。
- 资料公开获取，无需登录；只显示已配置的文件，没有资料时隐藏整个区域。
- Web 端支持 PDF 手册查看与下载、STP 模型下载，适配桌面、手机、中英文与深色主题。
- 微信小程序提供手册查看入口，模型支持复制商品资料页链接，方便在电脑端下载。
- 两端共用商品资料配置，展示文件格式、大小及语言等信息，点击后才获取文件。

以下按同一商品、相同页面宽度展示更新前后对比，左侧为 Before，右侧为 After。表格使用等宽缩略图，点击可查看原图。

### Web 桌面版

| Before | After |
| --- | --- |
| [![Web 桌面版 Before](./docs/verification/screenshots/product-resources-2026-11-01/thumbnails/web-before.png)](./docs/verification/screenshots/product-resources-2026-11-01/web-before.png) | [![Web 桌面版 After](./docs/verification/screenshots/product-resources-2026-11-01/thumbnails/web-after.png)](./docs/verification/screenshots/product-resources-2026-11-01/web-after.png) |

### Web 手机版

| Before | After |
| --- | --- |
| [![Web 手机版 Before](./docs/verification/screenshots/product-resources-2026-11-01/thumbnails/web-mobile-before.png)](./docs/verification/screenshots/product-resources-2026-11-01/web-mobile-before.png) | [![Web 手机版 After](./docs/verification/screenshots/product-resources-2026-11-01/thumbnails/web-mobile-after.png)](./docs/verification/screenshots/product-resources-2026-11-01/web-mobile-after.png) |

### 微信小程序

| Before | After |
| --- | --- |
| [![微信小程序 Before](./docs/verification/screenshots/product-resources-2026-11-01/thumbnails/mini-before.png)](./docs/verification/screenshots/product-resources-2026-11-01/mini-before.png) | [![微信小程序 After](./docs/verification/screenshots/product-resources-2026-11-01/thumbnails/mini-after.png)](./docs/verification/screenshots/product-resources-2026-11-01/mini-after.png) |

[Web 桌面局部截图](./docs/verification/screenshots/product-resources-2026-11-01/web-after-detail.png) · [PDF 手册查看](./docs/verification/screenshots/product-resources-2026-11-01/web-pdf-preview.png) · [验证记录](./docs/verification/PRODUCT-RESOURCES-2026-11-01.md) · [资料接口约定](./docs/product/mini-program-api-contract.md#商品资料2026-11-01)

---

## Unreleased — 容器宽度规范与宽屏档

提交：`5e64368` · 2026-09-06

把商城内页散乱硬编码的 `max-w-[xxx]` 统一到一个共享组件，并加一档宽屏档：

- 新增 `<StoreContainer>` 组件（`src/components/store/store-container.tsx`），所有内页主内容宽度都走它，宽度来源规范文档（`docs/design/header-footer-spec.md:181` + `docs/design/store-design-system.html:265`）。
- 两档宽度：`wide=false` 默认 `max-w-7xl`（1280px），`wide=true` 升到 `max-w-[1600px]`（1600px），适配宽屏显示器。
- 之前 7 个内页（订单/订单详情/企业账号/企业申请/结算/商品列表/商品详情）和 `trial-experience` 各自硬编码 1080/1200/1280/1400/1500/1600，现在全部统一引用 `<StoreContainer>`，商品页与试用页用 `wide`。
- 配套在「关键约定」加了一节「内页容器宽度」（见下文）。

---

## v0.3.0 — 企业邀请制与成员权限治理

发布日期：2026-08-03

本版本将企业开通和成员加入重构为两条独立流程，并以可传播的邀请链接取代手工输入邀请码：

- 企业开通使用独立的 `/enterprise/apply` 页面，联系人完成手机验证后提交企业资料；个人账户中心不再混入企业开通或加入入口。
- 企业开通审核属于独立后台业务，商城前台不再提供审核页面或 `/admin` 入口。
- 企业管理员创建完整邀请链接，链接内携带不可见的邀请凭证，可直接复制传播。
- 邀请实际保存精确的失效日期与时分；创建表单默认填入当前时间后四小时，并实时计算预计有效时长。
- 每条邀请链接独立选择岗位与权限，成员加入后继承该链接配置，管理员仍可继续单独调整。
- 访问有效邀请链接不要求预先登录或注册；填写手机号和验证码后直接加入企业，已有账户自动关联，没有账户则建立最小成员账户。
- 失效、撤销、人数已满或不存在的链接直接显示不可用状态，不继续展示手机号与验证码表单。
- 链接邀请不再经过管理员审批，因此移除了成员加入申请、邮箱域名免审、加入审批模式和裸邀请码输入逻辑。
- 已加入成员支持修改岗位与权限，并可停用或恢复；邀请链接、成员关系和企业申请使用新的本地数据版本，旧错误流程资料不再回灌。

本版本验收截图以功能区域为主，仅移动端邀请页保留完整视口。

| 功能说明                                                                         | 对应界面                                                                                                             |
| -------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------- |
| **独立企业开通**：企业资料、联系人手机验证和提交状态集中在单独页面。             | ![独立企业开通申请](./docs/verification/screenshots/v0.3.0-organization-membership/01-enterprise-application.png)    |
| **创建邀请链接**：为链接选择岗位与权限，设置精确失效时间和人数，并复制完整链接。 | ![创建企业邀请链接](./docs/verification/screenshots/v0.3.0-organization-membership/02-invitation-link-created.png)   |
| **手机号直接加入**：链接已确定企业和岗位，用户只需完成手机号验证。               | ![手机号验证加入企业](./docs/verification/screenshots/v0.3.0-organization-membership/03-phone-verification-join.png) |
| **不可用链接**：失效、撤销、满员或无效链接不会继续显示加入表单。                 | ![邀请链接不可用](./docs/verification/screenshots/v0.3.0-organization-membership/04-invitation-unavailable.png)      |
| **成员权限治理**：验证成功的成员立即出现，管理员可继续修改岗位、权限和状态。     | ![成员岗位与权限管理](./docs/verification/screenshots/v0.3.0-organization-membership/05-member-permissions.png)      |
| **移动端邀请体验**：移动端保持完整的企业信息、手机号验证与直接加入路径。         | ![移动端邀请加入](./docs/verification/screenshots/v0.3.0-organization-membership/06-mobile-invite-join.png)          |

完整验收截图见 [`docs/verification/screenshots/v0.3.0-organization-membership/`](docs/verification/screenshots/v0.3.0-organization-membership/)。

---

## v0.2.0 — 个人购买与多组织身份

发布日期：2026-08-02

本版本补齐了个人用户购买能力，并将商城账户与实际购买身份分离：

- 开放个人账户注册，Maker 等个人用户可直接注册、选购和下单。
- 企业受邀成员登录后直接进入所属组织；单组织用户无需额外选择身份。
- 同一账户可同时拥有个人身份和多个企业组织身份，并在账户菜单中切换。
- 身份列表采用二级菜单按需展示，一级菜单只显示当前身份，避免暴露其他组织信息。
- 购物车、订单、地址和发票资料按购买身份隔离，切换身份不会混用交易数据。
- 个人购买使用个人结算链路；企业购买继续保留组织资料、角色权限和审批逻辑。
- 桌面端支持侧向二级菜单与键盘操作，移动端使用独立第二层菜单并提供返回入口。

下表直接引用完整验收截图；Markdown 预览会按表格列宽缩小展示，右键图片可打开原始尺寸。

| 功能说明                                                                           | 对应界面                                                                                       |
| ---------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------- |
| **登录入口**：企业受邀成员直接登录所属组织，同时提供个人注册入口。                 | ![商城登录入口](./docs/verification/identity-context/01-login.png)                             |
| **个人注册**：Maker 等个人用户可填写基本资料，自主创建商城账户。                   | ![个人用户注册](./docs/verification/identity-context/02-personal-registration.png)             |
| **个人账户**：注册后直接进入个人购买身份，不要求加入企业组织。                     | ![个人账户中心](./docs/verification/identity-context/03-personal-account.png)                  |
| **隐私友好的一级菜单**：只显示当前购买身份，不直接暴露其他组织名称。               | ![购买身份一级菜单](./docs/verification/identity-context/04-account-menu-private-default.png)  |
| **多身份切换**：二级菜单按需列出个人身份和多个企业组织，当前身份使用右侧勾选标识。 | ![购买身份二级菜单](./docs/verification/identity-context/04-multi-context-account-menu.png)    |
| **个人结算资料**：个人购买使用独立的收货、付款和发票资料，不进入企业审批链路。     | ![个人结算付款资料](./docs/verification/identity-context/05-personal-checkout-payment.png)     |
| **个人订单提交**：结算页明确当前购买身份，并按个人链路直接提交订单。               | ![个人订单提交](./docs/verification/identity-context/06-personal-checkout-submit.png)          |
| **移动端一级菜单**：窄屏下同样默认隐藏其他购买身份。                               | ![移动端购买身份一级菜单](./docs/verification/identity-context/07-mobile-account-menu.png)     |
| **移动端二级菜单**：使用独立第二层列表，并提供返回账户菜单的触控入口。             | ![移动端购买身份二级菜单](./docs/verification/identity-context/07b-mobile-context-submenu.png) |
| **个人订单详情**：订单快照记录下单时的购买身份、地址和交易资料。                   | ![个人订单详情](./docs/verification/identity-context/08-personal-order-detail.png)             |
| **个人订单列表**：订单中心只展示当前购买身份下的订单，避免跨组织混用。             | ![个人订单列表](./docs/verification/identity-context/09-personal-orders.png)                   |

完整验收截图见 [`docs/verification/identity-context/`](docs/verification/identity-context/)。

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

### 7. 内页容器宽度

所有商城内页主内容**必须**用 `<StoreContainer>`，不要自己再写 `mx-auto w-[90%] max-w-[xxx]`。

```tsx
import { StoreContainer } from '@/components/store/store-container';

// 默认：max-w-7xl = 1280px
<StoreContainer className="py-6 md:py-10">…</StoreContainer>

// 宽屏档：max-w-[1600px] = 1600px
<StoreContainer wide className="py-5 md:py-8">…</StoreContainer>
```

两档宽度：

| `wide` | Tailwind 类 | 像素 | 适用场景 |
| --- | --- | --- | --- |
| `false`（默认） | `max-w-7xl` | 1280 | 订单、订单详情、企业账号、企业申请、结算 |
| `true` | `max-w-[1600px]` | 1600 | 商品列表、商品详情、`trial-experience` |

**已知的合理例外**（不要替换成 `StoreContainer`）：

- `src/app/[locale]/login/page.tsx` `max-w-[960px]`：登录页是居中卡片，1280 全宽会显得空。
- `src/app/[locale]/join/[token]/page.tsx` `max-w-[600px]`：邀请页是更窄的居中卡片。
- `src/app/[locale]/design-system/page.tsx` `max-w-[1600px]`：设计系统展示页。
- `src/components/store/site-footer.tsx` `max-w-[1600px]`：footer 容器，footer 自己的 1600 规范（见 `header-footer-spec.md:181`）。
- `src/components/store/trial-experience.tsx` 用 `w-[94%]` 不是 `w-[90%]`：trial 是独立体验线，视觉密度比内页稍宽。

将来需要再加一档（如控制台/报表的 1840）时，只在 `StoreContainer` 里加一个新的 prop，**不要** 在新页面里硬编码新的 `max-w-[xxx]`。

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
