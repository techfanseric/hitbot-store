# 商城页头页脚规范

> 测量对象：https://www.hitbot.cc/
> 测量方式：Chrome DevTools 实测（视口宽度 1435px）
> 测量日期：2026-06-06
> 用途：商城页头页脚严格按此规范实现，所有数值有出处

---

## 一、官方素材清单

所有素材已下载到 `public/hitbot/`：

| 文件 | 用途 | 原始 URL | 尺寸建议 |
|---|---|---|---|
| `logo.svg` | 顶栏/页脚 logo | `/uploads/upload/images/20260213/9b16c66504c5c1d7770d654f951e9b80.svg` | 展示高 24px（h-6） |
| `icon-phone.svg` | 客服/售后 电话 | `/static/home/images/x-fo1.svg` | 16×16 |
| `icon-mail.svg` | 邮箱 | `/static/home/images/x-fo2.svg` | 16×16 |
| `icon-address.svg` | 公司地址 | `/static/home/images/x-fo3.svg` | 16×16 |
| `icon-link.svg` | 友情链接 | `/static/home/images/x-fo4.svg` | 16×16 |
| `icon-search.svg` | 顶栏搜索 | `/static/home/images/ico-search.svg` | 20×20 |
| `wechat-qr.jpg` | 微信二维码 | `/static/home/images/weixin.jpg` | 94×94（原图） |

> 注：所有 SVG 内部为黑色路径（currentColor），用 `text-text-muted` 控制颜色。

---

## 二、Header（顶栏）规范

### 2.1 容器

| 维度 | 官网实测 | 商城实现 |
|---|---|---|
| header 总高 | **101px** | `h-[100px]`（约等于 25 × 4px） |
| container 最大宽 | 1840px（实测 1292 内容） | `max-w-screen-2xl` 或保留 `max-w-7xl` |
| 垂直对齐 | flex / align-items: center | `flex items-center` |
| 背景色 | `rgb(255,255,255)` 透明 | `bg-bg-elevated` |
| 底部边框 | 无 | 无（保持 `border-divider/60` 浅分隔） |

### 2.2 Logo

| 维度 | 官网实测 |
|---|---|
| 尺寸 | **198 × 26px**（顶栏内展示） |
| 左 padding | 约 29px |

> 实现：`<Image width={200} height={24} className="h-6 w-auto" />`

### 2.3 导航项

| 维度 | 官网实测 |
|---|---|
| 字号 | **16px**（不是 14） |
| 字重 | 400 |
| 字色 | 白（在深色 header 上，浅色主题下用 `text-text`） |
| 项间距 | flex 默认，无 gap |
| 高度 | 撑满 container（100px） |

> 实现：保持当前 `text-sm`（14px）也可接受，但官方是 16px。统一改为 `text-base`。

### 2.4 右侧操作区

| 元素 | 尺寸 | 说明 |
|---|---|---|
| 搜索图标 | 79×100 容器，内嵌图标 | 圆形按钮 |
| 购物车 | 圆形 | 维持现状 |
| 语言切换 | 当前实现 | 维持现状 |
| 主题切换 | 当前实现 | 维持现状 |
| 登录按钮 | 文字按钮 | `Button variant="subtle"` |

> **2026-06-06 执行口径更新**：商城前台不做独立商城首页，也不服务闲逛式导航。当前实现只保留官网 logo、购物车、用户/个人中心入口；搜索、语言切换、主导航和移动抽屉不放入商城页头。

---

## 三、Footer（页脚）规范

### 3.1 整体结构（按官网三段式）

```
<footer> 525px 高
├── 顶部 logo 区（111px，含 padding）
├── 中部联系信息 + 4 列分类（364px）
└── 底部版权 + 政策（50px）
```

### 3.2 容器

| 维度 | 官网实测 |
|---|---|
| footer 背景 | `rgb(247, 247, 249)`（极浅灰） |
| footer 内边距 | 上 0 / 下 0（无） |
| container 最大宽 | 1600px |
| 顶部 logo 区内边距 | **上 52.8px / 下 33px** |

### 3.3 顶部 Logo

| 维度 | 官网实测 |
|---|---|
| 尺寸 | **204 × 24px**（h-6 正好） |
| 左 margin | 约 72px（含 container padding） |

> 实现：与 header 同款 `logo.svg`，`h-6 w-auto`

### 3.4 中部联系信息区（左侧）

| 维度 | 官网实测 |
|---|---|
| 区域宽度 | 662px |
| 字号 | **14px** |
| 行高 | 24px（地址/友情链接行因换行更高） |
| 行间距（margin-bottom） | **约 10px** |
| 图标尺寸 | **16 × 16px** |
| 图标与文字间距 | flex 横向排列，约 10px |
| 区域总高 | 258px（5 行） |

> 实现：每行用 `flex items-start gap-2.5`、行间距 `space-y-2.5`（≈10px）
> 5 行：客服 / 售后 / 邮箱 / 公司地址 / 友情链接

### 3.5 关注我们 + 微信

| 维度 | 官网实测 |
|---|---|
| 二维码尺寸 | **94 × 94px**（原图，未缩小） |
| 文字"关注我们：" | 14px 黑色（官网），主题色用 `text-text-strong` |

> 实现：直接显示原图 94×94，不缩小。

### 3.6 4 列产品分类（右侧）

| 维度 | 官网实测 |
|---|---|
| 列标题字号 | 14px |
| 列标题字色 | 黑色（`rgb(0,0,0)`）→ 浅色主题用 `text-text-strong` |
| 列标题字重 | 400（不加粗） |
| 列标题与列表间距 | 内置 0（标题 29px 含 padding-bottom） |
| 链接行高 | 29px（最后一行 24px） |
| 链接字号 | 14px |
| 链接字色 | 浅灰 → `text-text-muted` |
| 链接行间距 | 30px（实测 540→570→599） |

> 实现：列标题去掉 `font-semibold`（官网是 400），统一 `font-medium` 或 `font-normal` 接近官网。

### 3.7 底部版权行

| 维度 | 官网实测 |
|---|---|
| 区域高度 | **50px**（含上下 padding） |
| 字号 | 14px |
| 上下分隔 | 顶部 1px 浅色边框 |
| 左对齐 | 版权 + ICP + by Growthman |
| 右对齐 | 隐私政策 / 免责声明 / 网站地图 |

---

## 四、关键 Token 速查

```
header 高度:  100px
logo 高度:    24px
footer 顶部 logo 区 padding:  py-[53px] px-0 + 内容 24px
联系信息行高:  24px / 48px（换行）
行间距:        10px
图标尺寸:      16×16
字号:          14px（页脚）/ 16px（导航）/ 14px（顶栏小字）
二维码:        94×94
列标题字重:    400（不加粗）
```

---

## 五、当前实现与规范的差距

| 项 | 当前 | 规范 | 需调整 |
|---|---|---|---|
| header 高度 | h-20 (80px) | 100px | ✅ 改 h-[100px] |
| 导航字号 | text-sm (14px) | 16px | ✅ 改 text-base |
| footer 顶部 padding | pt-14 (56px) pb-6 (24px) | pt-[53px] pb-[33px] | ✅ |
| footer 联系行间距 | space-y-3 (12px) | 10px | ✅ 改 space-y-2.5 |
| footer 微信二维码 | 32×32 | 94×94 | ✅ |
| 列标题字重 | font-semibold | 400 | ✅ 改 font-normal |
| footer container max-w | max-w-7xl (1280) | 1600 | ⚠️ 商城布局保持 max-w-7xl 即可 |
| footer 底部高度 | 无固定 | 50px | ⚠️ 自由 padding 即可 |

---

## 六、规范来源说明

- 所有尺寸均通过 Chrome DevTools `getBoundingClientRect()` 与 `getComputedStyle()` 实测
- 实测视口宽度 1435px
- 部分 padding 数值是浮点（如 52.8px），实际实现可四舍五入为 53px
- 颜色、字体等来自 `getComputedStyle()` 读取
