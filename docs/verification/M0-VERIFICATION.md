# M0 脚手架验收清单

## 启动验证

```bash
cd ~/hitbot-store
pnpm install
pnpm dev
# 浏览器打开 http://localhost:3000 → 应 307 跳到 /zh
```

## 路由清单

| 路径 | 状态 | 预期内容 |
|---|---|---|
| `/` | 307 → `/zh` | middleware 自动重定向 |
| `/zh` | 200 | 首页（深色 hero + 4 个分类卡 + 6 个精选商品 + 站点 footer） |
| `/en` | 200 | 首页全英文 |
| `/zh/products` | 200 | 列表页（公开商品，参考件不进入官网目录；左侧 7 个分类筛选，右侧 grid） |
| `/zh/products/z-emg-4` | 200 | 详情页（缩略图 + 名称 + 价格 + 加入购物车 + 规格表 + 相关推荐） |
| `/zh/products?category=gripper` | 200 | 列表页筛选 |
| `/zh/checkout` | 200 | 项目 BOM 确认页占位（只确认清单，不接地址/付款/发票） |
| `/zh/account` | 200 | 企业账号占位（三角色说明，不接真实登录） |
| `/zh/try-os` | 200 | 在线体验 OS 占位（手机号/假项目/disabled 边界说明） |
| `/zh/design-system` | 200 | Token 展示页（颜色/字号/间距/圆角/阴影/按钮/状态徽标） |

## 构建验证

```bash
pnpm typecheck   # 0 错 0 警（先 next typegen，再 tsc --noEmit）
pnpm lint        # 0 错，1 个 warning（prettier.config.mjs anonymous default export）
pnpm build       # 0 错 0 警
```

### Build 产物概览
```
Route (app)                                 Size  First Load JS
┌ ○ /_not-found                            120 B         102 kB
├ ● /[locale]                              316 B         219 kB    (zh, en)
├ ● /[locale]/account                      171 B         119 kB    (zh, en)
├ ● /[locale]/checkout                   3.29 kB         135 kB    (zh, en)
├ ● /[locale]/design-system                296 B         191 kB    (zh, en)
├ ● /[locale]/products                     753 B         151 kB    (zh, en)
├ ● /[locale]/products/[slug]              320 B         219 kB    (18 公开商品路径，zh/en)
└ ● /[locale]/try-os                       306 B         196 kB    (zh, en)
```

## 交互验证

- [x] 切到 `/en`，所有页面文案变英文
- [x] 点 `LocaleSwitcher`，URL 切到 `/zh` 或 `/en`，文案跟随
- [x] 点 `ThemeSwitcher`，`<html>` class 在 `light`/`dark` 间切换
- [x] 在商品详情点 "加入购物车"，cart-badge 数字 +1
- [x] 顶栏购物车入口进入 `/zh/checkout`，看到当前项目/BOM 语境与已勾选项
- [x] 只有勾选且可售的标准件进入 `/zh/checkout` 小计
- [x] 刷新页面，购物车数字仍在（localStorage 持久化）
- [x] 首页 "在线体验 OS" 跳到 `/zh/try-os`
- [x] 顶栏 "登录" 跳到 `/zh/account`
- [x] 切主题到 dark，进 `/zh/design-system`，按钮/卡片按 dark 主题渲染
- [x] 在 `/zh/products` 选分类筛选，URL `?category=gripper` 更新，grid 过滤
- [x] DevTools Console 无 React 警告、无 hydration mismatch

## 截图归档

存放在 `docs/verification/screenshots/`：

| 文件 | 内容 |
|---|---|
| `store-home-zh-light.png` | 中文首页（亮色） |
| `store-home-zh-dark.png` | 中文首页（暗色） |
| `store-home-en-light.png` | 英文首页（亮色） |
| `store-products-zh.png` | 商品列表页（中文） |
| `store-product-detail-zh.png` | 商品详情页（中文） |
| `store-checkout-zh.png` | 项目 BOM 确认页（中文，含已勾选商品） |
| `store-design-system-zh-light.png` | Token 展示页（亮色） |
| `store-design-system-zh-dark.png` | Token 展示页（暗色） |

## M0 范围外（明确边界）

下列功能 **M0 不做**，留给后续里程碑：

- ❌ 后端 API（mock 数据用 TS 常量）
- ❌ 真实登录/账号（PRD M2）
- ❌ 真实收银台/支付（PRD M1 后段；M0 只有 `/checkout` 占位）
- ❌ 管理后台（PRD M4）
- ❌ OS 端购物车接入（PRD M3）
- ❌ 真实体验 OS（PRD M5；M0 只有 `/try-os` 官网入口占位）
- ❌ Storybook / Playwright / Lighthouse CI
- ❌ E2E 测试

## M0 已知小限制

1. **首页 hero 背景** 是 `bg-neutral-1000` 纯黑；规范页里是带品牌色渐变，M1 可换。
2. **庞门正道字体** 未接入；M0 用系统字体栈。等授权后用 `next/font` 替换 `--font-sans`。
3. **`timeZone` 警告** —— next-intl v4 dev 模式下偶发打印 `ENVIRONMENT_FALLBACK` 警告，不影响渲染。已在 `src/i18n/request.ts` 和 `Providers` 中都设了 `timeZone: 'Asia/Shanghai'`，build 阶段无警告。
4. **商品图片** —— M0 已接入 `public/hitbot/` 下的真实图片，但仍是静态 mock 数据。
5. **`useSearchParams`** —— 当前 build 无 warning；后续新增客户端筛选组件时仍需注意 Suspense 要求。
6. **`pnpm typecheck` 顺序** —— `typecheck` 脚本已改为 `next typegen && tsc --noEmit`，避免干净仓库缺 `.next/types` 时失败。不要和 `pnpm build` 并行运行，二者都会读写 `.next/types`。
7. **购物车本地存储 key** —— 已升级为 `hitbot-cart-v2`，用于承载项目 BOM 字段；旧 `hitbot-cart-v1` 不迁移。
