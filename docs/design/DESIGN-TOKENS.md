# Design Tokens 映射表

把 `docs/design/store-design-system.html` 里的所有视觉 token 落到 `src/app/globals.css` 的 CSS 变量，再通过 `@theme inline` 暴露为 Tailwind 工具类。

> **M0 范围**：本表只列出实际写进 globals.css 的 token。规范页里有但 M0 暂时未用到的 token（如运动曲线、字号 `text-4xl`、阴影 `shadow-strong`）留到 M1+ 补。

---

## 1. 品牌色（跨主题不变）

| Token | 值 | Tailwind 类 | 用途 |
|---|---|---|---|
| brand-500 | `#BD1C22` | `bg-brand-500` / `text-brand-500` | 主品牌色，按钮、链接、价格 |
| brand-600 | `#B71C1C` | `bg-brand-600` | hover 备用 |
| brand-400 | `#D22A30` | `bg-brand-400` / `text-brand-400` | light 主题 hover |
| brand-100 | `#FBE7E8` | `bg-brand-100` | 浅色品牌色 |
| brand-50  | `#FCEFEE` | `bg-brand-50`  | 极浅色 |
| brand-soft | `rgba(189,28,34,0.10)` | `bg-brand-soft` / `text-brand-soft` | 徽标底色 |
| brand-soft-2 | `rgba(189,28,34,0.22)` | `bg-brand-soft-2` | 选中态 |

---

## 2. 中性色（跨主题不变）

| Token | 值 | 用途 |
|---|---|---|
| neutral-1000 | `#000000` | 纯黑，hero 背景 |
| neutral-900  | `#1A1A1A` | 文字主色（dark 主题对比文字） |
| neutral-800  | `#2B2B2F` | |
| neutral-700  | `#3A3A3A` | |
| neutral-600  | `#555555` | |
| neutral-500  | `#777777` | 次要文字 |
| neutral-400  | `#999999` | |
| neutral-300  | `#C8C5BA` | |
| neutral-200  | `#D5D5D5` | |
| neutral-100  | `#EBEBEB` | |
| neutral-50   | `#F7F7F8` | |
| neutral-0    | `#FFFFFF` | 白色文字（深色背景上） |

---

## 3. 状态色

| Token | 值 | 用途 |
|---|---|---|
| state-green | `#42D987` | 运行中 |
| state-green-strong | `#7BE0A6` | 现货、运行中文字 |
| state-yellow | `#F2B84B` | 编译中、加工件 |
| state-yellow-strong | `#FFD37A` | 加工件文字 |
| state-blue | `#3C7EFF` | 信息 |
| state-danger | `#FF7478` | 错误 |
| state-red-soft | `rgba(255,116,120,0.15)` | 错误底色 |

---

## 4. 主题语义（按 .light / .dark 切换）

### light 主题
| Token | 值 | 用途 |
|---|---|---|
| bg-app | `#FFFFFF` | 页面底色 |
| bg-surface | `#F7F7F8` | 卡片图位 |
| bg-elevated | `#FFFFFF` | 卡片、商品卡、徽标容器 |
| bg-control | `#EBEBEB` | 次级按钮、输入框 |
| bg-control-hover | `#D5D5D5` | hover |
| bg-control-active | `#C8C5BA` | active |
| text-strong | `#1A1A1A` | 主文字 |
| text | `#2B2B2F` | 默认文字 |
| text-muted | `#777777` | 次要文字 |
| divider | `#EBEBEB` | 分隔线 |

### dark 主题
| Token | 值 | 用途 |
|---|---|---|
| bg-app | `#242424` | 页面底色 |
| bg-surface | `#2B2B2B` | 卡片图位 |
| bg-elevated | `#2F2F2F` | 卡片、商品卡、徽标容器 |
| bg-control | `#3A3A3A` | 次级按钮 |
| bg-control-hover | `#454545` | hover |
| bg-control-active | `#505050` | active |
| text-strong | `#FFFFFF` | 主文字 |
| text | `#DDDDDD` | 默认文字 |
| text-muted | `#A5A5A5` | 次要文字 |
| divider | `rgba(255,255,255,0.08)` | 分隔线 |

---

## 5. 字号（8 档基础字号）

| 类 | 实际值 | 用途 |
|---|---|---|
| `text-xs` | 10px | 徽标、角标 |
| `text-sm` | 11px | 次要文字 |
| `text-md` | 12px | OS 端基线（默认 body） |
| `text-lg` | 14px | 段落正文 |
| `text-xl` | 16px | 面板标题 |
| `text-2xl` | 20px | 区块标题 |
| `text-3xl` | 24px | 页面标题 |
| `text-5xl` | 48px | 营销头图 |

> **注意**：body 默认字号是 `text-md` (12px)，不是 Tailwind 默认的 16px。OS 端基线即如此。

---

## 6. 间距（8 档，4 的倍数）

| 类 | 值 |
|---|---|
| `spacing-1` | 4px |
| `spacing-2` | 8px |
| `spacing-3` | 12px |
| `spacing-4` | 16px |
| `spacing-5` | 24px |
| `spacing-6` | 32px |
| `spacing-7` | 48px |
| `spacing-8` | 64px |

用 `p-3` / `m-2` / `gap-4` 等通用类即可，不必硬套 `spacing-*`。仅在需要非常规值时使用。

---

## 7. 圆角（6 档 + pill）

| 类 | 值 | 用途 |
|---|---|---|
| `rounded-xs` | 2px | |
| `rounded-sm` | 3px | |
| `rounded-md` | 4px | **默认圆角**（按钮、卡片、输入框） |
| `rounded-lg` | 6px | 大卡片 |
| `rounded-xl` | 8px | 弹窗、浮层 |
| `rounded-pill` | 9999px | 徽标、tag |

---

## 8. 阴影（4 档，仅用于浮层/弹窗）

| 类 | 值 | 用途 |
|---|---|---|
| `shadow-floating` | `0 14px 34px rgba(0,0,0,0.24)` | 浮层 |
| `shadow-popover` | `0 6px 16px rgba(0,0,0,0.18)` | 气泡 |
| `shadow-floating-strong` | `0 24px 60px rgba(0,0,0,0.32)` | 强浮层 |
| `shadow-light` | `0 2px 6px rgba(0,0,0,0.08)` | 轻浮层 |

> **零边框原则**：所有分隔靠**背景色差**或**间距**，不用 border。规范页里 `--border: transparent` 体现此精神。

---

## 9. shadcn 变量映射

我们自己的 token 喂给 shadcn 默认变量，使 shadcn 组件（dialog、dropdown-menu、input、select）自动适配主题：

```css
.light, .dark {
  --background: var(--bg-app);
  --foreground: var(--text-strong);
  --card: var(--bg-elevated);
  --card-foreground: var(--text-strong);
  --popover: var(--bg-elevated);
  --popover-foreground: var(--text-strong);
  --primary: var(--brand-500);
  --primary-foreground: var(--neutral-0);
  --secondary: var(--bg-control);
  --secondary-foreground: var(--text);
  --muted: var(--bg-surface);
  --muted-foreground: var(--text-muted);
  --accent: var(--brand-soft);
  --accent-foreground: var(--brand-500);
  --destructive: var(--brand-500);
  --destructive-foreground: var(--neutral-0);
  --border: transparent;       /* 零边框 */
  --input: transparent;
  --ring: var(--brand-500);
  --radius: 4px;               /* 默认圆角 = md */
}
```

---

## 10. 按钮 4 套

| variant | 用途 | 类组合 |
|---|---|---|
| `primary` | 主操作 | `bg-brand-500 text-neutral-0 hover:bg-brand-400` |
| `secondary` | 次操作 | `bg-bg-control text-text hover:bg-bg-control-hover` |
| `subtle` | 弱操作 | `bg-transparent text-text-muted hover:bg-bg-control-hover hover:text-text` |
| `icon` | 图标按钮 | `bg-transparent text-text-muted hover:bg-bg-control-hover hover:text-text size-8` |
| `destructive` | 危险操作 | `bg-brand-500 text-neutral-0 hover:bg-brand-400` |

size：`sm` (h-6) / `md` (h-8) / `lg` (h-9) / `icon` (size-8)。
shape：`square` (rounded-md) / `pill` (rounded-pill)。

---

## 11. 状态徽标 10 种

| variant | 用途 | 类组合 |
|---|---|---|
| `in-stock` | 现货 | `bg-state-green/15 text-state-green-strong` |
| `out-of-stock` | 缺货 | `bg-bg-control text-text-muted` |
| `on-sale` | 活动中 | `bg-state-red-soft text-state-danger` |
| `running` | 运行中 | `bg-state-green/20 text-state-green-strong` |
| `compiling` | 编译中 | `bg-state-yellow/20 text-state-yellow-strong` |
| `idle` | 未运行 | `bg-bg-control text-text-muted` |
| `error` | 错误 | `bg-state-red-soft text-state-danger` |
| `standard` | 标准件 | `bg-brand-soft text-brand-500` |
| `custom` | 加工件 | `bg-state-yellow/20 text-state-yellow-strong` |
| `reference` | 参考件 | `bg-bg-control text-text-muted` |
| `default` | 默认 | `bg-brand-soft text-brand-500` |

---

## 12. 字体

M0 使用系统字体栈（`-apple-system, BlinkMacSystemFont, 'Segoe UI', ...`）。后续 M1 拿到庞门正道授权后接入 `next/font` 替换 `--font-sans`。
