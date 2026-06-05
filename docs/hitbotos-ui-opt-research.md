# hitbotos-ui-opt 现状调研报告

> 调研日期：2026-06-05
> 调研方式：源码通读 + Chrome DevTools 实测
> 在线地址：https://techfanseric.github.io/hitbotos-ui-opt/
> 仓库：~/hitbotos-ui-opt
> 目的：为商城 PRD §4 / §6 / §8 在 OS 端的落地提供决策依据

---

## 一、项目基本盘

| 项 | 数据 |
|---|---|
| 项目名 | HitbotOS UI - 仿真面板 |
| 类型 | **纯 HTML / CSS / JavaScript**（无构建工具） |
| 当前版本 | v1.4.0（2026-05-25） |
| 代码体量 | HTML 718 + CSS ~7500 + JS ~6500 行 |
| 部署 | GitHub Pages（自动从 main 部署） |
| 入口文件 | `index.html` |
| 启动 | `python -m http.server` 或 `open index.html` |

### 1.1 项目定位

这是 HitbotOS 端**仿真编辑器**的 UI 原型，核心是让工程师在 3D 场景里搭建方案、写 Blockly / 流程图程序、跑仿真。**不直接面向最终客户**，只面向工程师 / 管理员 / 产品 / 市场。

### 1.2 关键判断

- **不是生产环境代码**——是 UI 原型（纯静态、mock 数据 `js/device-data.js`）
- **不接后端**——所有数据都是 fixture JSON（`docs/fixtures-*.json`）
- **不接账号**——`vendor/original-blockly/` 内嵌了一份 Blockly 编辑器，URL 参数里写了 `userName=yanshiwei`、`roleId=2`，但只是 iframe 参数
- **没有"购物车 / 物料清单 / 体验入口"任何痕迹**——grep 全空

> **结论**：把商城购物车挂到 OS 端，**没有现成代码包袱**，从零建即可。

---

## 二、文件与模块结构

### 2.1 物理结构

```
~/hitbotos-ui-opt/
├── index.html                  # 入口（718 行）
├── panel-tabs-content.html     # 右侧属性面板内容（异步加载，492 行）
├── css/
│   ├── main.css                # 菜单/工作空间/状态栏（1680 行）
│   ├── window.css              # 窗口系统（409 行）
│   ├── simulator-toolbar.css   # 3D 视口工具栏（470 行）
│   ├── panel-tabs.css          # 右侧 tab（498 行）
│   ├── panel-ui-components.css # 通用面板组件（621 行）
│   ├── device-library-panel.css# 设备库面板（461 行）
│   ├── binding-panel.css       # 电气绑定面板（722 行）
│   ├── arm-property-panel.css  # 机械臂属性面板（850 行）
│   ├── design-system.css       # 设计 token + 交互基类（901 行）★
│   └── borderless.css          # 全局去边框规则（182 行）★
├── js/
│   ├── layout-manager.js       # 窗口系统核心（1031 行）★
│   ├── script.js               # 主控制器（2732 行）
│   ├── panel-loader.js         # 右侧 tab 加载器（542 行）
│   ├── device-library-panel.js # 设备库面板（460 行）★
│   ├── device-data.js          # mock 设备数据（77 行）
│   ├── action-editor.js        # 动作编辑器包装（400 行）
│   ├── binding-panel.js        # 绑定面板（467 行）
│   └── simple-webgl-scene.js   # 3D 场景（864 行）
├── vendor/
│   └── original-blockly/       # 嵌入的 Blockly 编辑器
├── docs/
│   ├── fixtures-*.json         # 模拟数据（拓扑、设备类型、Blockly 方案等）
│   ├── requirements/           # 需求文档、xmind、PDF
│   ├── meetings/               # 会议纪要 + transcript
│   └── plans/                  # 设计/实现/URL 布局计划
├── flow-path/                  # 流程图编辑独立子项目（含 Monaco editor）
├── concepts/                   # 设计概念（目前空）
├── README.md                   # 版本历史、功能介绍
├── CLAUDE.md                   # Claude Code 上下文
└── workflow.md                 # 流程图
```

标 ★ 的是和商城集成最相关的文件。

### 2.2 三大窗口（业务主体）

| 窗口 | DOM 类 | 状态 | 用途 |
|---|---|---|---|
| **3D 仿真** | `.simulation-window` | 默认显示 | 3D 场景 + 视口工具栏 + 左侧工具栏 + 右侧属性面板 |
| **电气拓扑** | `.electrical-window` | 隐藏（`display:none`） | 电气拓扑编辑（当前只是占位文案） |
| **动作编辑** | `.action-window` | 隐藏（`display:none`） | 嵌入 iframe Blockly 编辑器 |

布局由 `layout-manager.js` 控制，6 种预设布局：
- `layout1`：上下分层
- `layout2`（默认）：电气 + 仿真 | 动作编辑
- `layout3`：三列并排
- `dual-lr-73`：左 70% / 右 30%
- `dual-lr-55`：左右 5:5
- `dual-tb-55`：上下 5:5

布局状态持久化到 localStorage（`hitbotos-layout` key），刷新自动恢复。

> ⚠️ **目前没有"top 图/2D 设备库"独立窗口**——3D 仿真是唯一的场景编辑界面。设备库是 3D 视口里的**浮动面板**。PRD §3.2 提到的 "top 图/2D 设备库 页面**和** 3D 仿真页面都有购物车图标"——需要确认后续是否要做 2D 视图（如果做，购物车要复制 1 份到那个视图）。

---

## 三、关键模块分析

### 3.1 顶部菜单栏（`index.html:24-136`）

**最关键的改动区域**——购物车图标应挂这里。

```html
<div class="top-menu-bar">
  <div class="menu-left">
    <div class="project-dropdown">...</div>  <!-- 方案切换 -->
    <div class="platform-badge">平台版</div>
  </div>
  <div class="menu-right">
    <button data-tooltip="AI">...</button>
    <button data-tooltip="功能引导">...</button>
    <button data-tooltip="机械臂示教">...</button>
    <button data-tooltip="设备监控">...</button>
    <button data-tooltip="日志查看">...</button>
    <button data-tooltip="国际化">...</button>
    <button data-tooltip="后台管理">...</button>
    <button data-tooltip="下载">...</button>
    <button data-tooltip="系统配置">...</button>
    <span class="top-menu-divider"></span>
    <div class="current-user-dropdown">严世威</div>
  </div>
</div>
```

| 维度 | 现状 |
|---|---|
| 购物车入口 | **完全没有** |
| 适合插入位置 | 系统配置（最后一个）**和**用户头像之间；或最右端（紧贴用户） |
| 设计模式 | 浅色背景（`#f7f7f8`），与官网红黑白风格**形成视觉对比**——这是有意的"亮外壳 + 暗内核"分层 |
| 数量徽标 | 暂不支持（Bootstrap Icons 通用模式：角标 `.cart-count` 元素） |
| 跨页同步 | localStorage 已经有（布局状态），购物车数据可同样落到 localStorage 或后端 |

### 3.2 3D 视口工具栏（`index.html:259-377`）

视口顶部居中**永久常驻**的细长工具栏，**第二个改动区域**——3D 场景的购物车入口。

```html
<div class="viewport-toolbar permanent" id="sub-toolbar">
  <button title="测量">测量</button>
  <button title="对齐">对齐</button>
  <button title="捕捉">捕捉</button>           <!-- disabled -->
  <button title="挂载">挂载</button>
  <button title="复制">复制</button>
  <button title="属性">属性</button>
  <button title="调度">调度</button>
  <button title="成组">成组</button>
  <button title="解组">解组</button>
  <button title="刻度">刻度</button>
  <button title="导入">导入</button>
  <button title="碰撞">碰撞</button>           <!-- disabled -->
  <button title="录屏">录屏</button>
  <button class="viewport-toolbar-handle">收起</button>
</div>
```

紧接其后是**执行工具栏**（默认收起，点"运行"展开）：
```html
<div class="execute-toolbar" id="execute-toolbar">
  <div class="execute-toolbar-panel">
    <select data-execute-source>             <!-- 数据源：编辑器/Blockly/流程图 -->
    <select data-execute-play-source>       <!-- 播放源 -->
    <select data-execute-region>            <!-- Blockly 二级：主区域/子区域 -->
    <button data-execute-action="stop">停止</button>
    <button data-execute-action="reset">复位</button>
  </div>
  <button class="execute-toolbar-toggle">运行</button>
</div>
```

| 维度 | 现状 |
|---|---|
| 购物车入口 | **完全没有** |
| 适合插入位置 | 视口工具栏最右（**录屏之后、handle 之前**）；或"执行工具栏"内的播放源选择器旁 |
| 数据源切换 | **已经存在**（数据源下拉：编辑器/Blockly/流程图）——和 PRD §8.1 完全对应 |
| Blockly 二级下拉 | **已经存在**（`data-execute-region`，但默认 `hidden`，需 Blockly 选中才显）——和 PRD §8.1 完全对应 |
| 运行模式切换 | **不在这里**——是 Blockly iframe 内的"真机/仿真"复选框（`uid=3_68/3_69`）——**与 PRD §8.2 "工具栏切换"不一致** |

### 3.3 左侧工具栏（`index.html:238-255`）

3D 视口左侧的窄条按钮：

```html
<button data-tool="tools">工具</button>
<button data-tool="scene">场景</button>
<button data-tool="devices">设备库</button>
<button data-tool="bind">绑定</button>
```

| 维度 | 现状 |
|---|---|
| 设备库入口 | ✅ 有（点击展开浮动面板） |
| 购物车入口 | ❌ 无 |
| 适合插入位置 | 紧贴"设备库"按钮下方（语义上：设备库负责选，购物车负责收） |

### 3.4 设备库面板（`js/device-library-panel.js` + `css/device-library-panel.css`）

**商城集成的最关键页面**——7 个分类、16 个 mock 设备，拖拽到 3D 场景里添加。

```js
// 设备数据：js/device-data.js
[
  { category: "抓取设备",   devices: [Z-EMG-4, Z-EFG-8S, Z-EFG-20S, Z-EMG-CO-1..5] },  // 8
  { category: "四轴机器臂", devices: [Z-EMG-4, Z-EFG-8S] },                          // 2
  { category: "六轴机器臂", devices: [Z-EFG-20S] },                                  // 1
  { category: "灵巧手",     devices: [Z-EMG-CO-1] },                                 // 1
  { category: "人形机器人", devices: [Z-EMG-CO-2] },                                 // 1
  { category: "智能电缸",   devices: [Z-EMG-CO-3] },                                 // 1
  { category: "电机",       devices: [Z-EMG-CO-4, Z-EMG-CO-5] }                      // 2
]
```

| 维度 | 现状 |
|---|---|
| 设备分类 | 7 类，按"产品类型"分（抓取/四轴/六轴/灵巧手/人形/电缸/电机） |
| 设备 ID 命名 | Z-EMG / Z-EFG / Z-EMG-CO 系列——**和官网产品中心的产品 ID 完全对得上**（如 Z-EMG-4、Z-EFG-8S） |
| 卡片样式 | 3 列网格，红色 `bi-box` 图标 + 型号文字（**品牌色就是官网红 `#BD1C22`**） |
| 搜索 | 实时过滤（型号/分类名） |
| 拖拽 | `dragstart` 写入 `dataTransfer.setData('deviceId', id)`——**是 3D 场景添加设备的入口** |
| 选中 | 单选高亮（`device-card.selected`） |
| 悬停详情 | 500ms 延迟显示设备参数浮层（边界感知定位） |
| 添加到购物车 | ❌ **完全没有**——只能拖到 3D 场景里，**没"加入购物车"按钮** |
| 物料清单生成 | ❌ **完全没有**——3D 场景里加的设备，PRD §3.4 说的"一键生成 BOM"功能不在 |

> **重要发现**：设备 ID 命名规范和官网产品中心一致（如 Z-EMG-4 在两处都出现），说明两边数据源是同一份。**商城购物车可以直接复用这套 ID 体系**。

### 3.5 动作编辑窗口（Blockly iframe）

通过 iframe 嵌入 `vendor/original-blockly/`，URL 带参数 `solution_uid`、`id`、`locale=zh-cn`、`roleId=2`、`userName=yanshiwei`。

| 维度 | 现状 |
|---|---|
| 编辑器 | Blockly 块编程 + Python 预览（"查看代码"切到只读 Monaco） |
| 仿真/真机切换 | iframe 内的"真机/仿真"复选框 |
| 跨端同步 | **未实现**（PRD §8.3 要求 MQTT 同步） |
| 启动上下文 | iframe 独立，**与外部 host 通信机制不明**（没看到 postMessage 代码） |

> **现状与 PRD 偏离点**：运行模式切换（真机/仿真/孪生）当前在 Blockly 内部以复选框形式存在，PRD §8.2 要求做成 host 工具栏的下拉式 + 上面板联动。这是后续改造点。

### 3.6 状态栏（`index.html:668-709`）

```html
<div class="status-bar">
  <button>运行日志</button>
  <button>错误日志 (3)</button>
  <div class="window-manager">
    <div class="window-item">电气拓扑</div>
    <div class="window-item">3D仿真</div>
    <div class="window-item">动作编辑</div>
  </div>
  <button>清除日志</button>
  <button>导出日志</button>
</div>
```

> **潜在改造点**：状态栏的"窗口管理"区域，可以加一个"购物车"快捷入口（PRD §3.2 要求"OS 端购物车**全局可见**"——状态栏是天然的"全局"位置）。

---

## 四、视觉设计规范

### 4.1 设计 token 体系（`css/design-system.css:1-64`）

```css
:root {
  /* 字体 */
  --ds-font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
  --ds-font-xs: 10px;  --ds-font-sm: 11px;
  --ds-font-md: 12px;  --ds-font-lg: 14px;

  /* 间距 */
  --ds-space-1: 4px;   --ds-space-2: 8px;
  --ds-space-3: 12px;  --ds-space-4: 16px;  --ds-space-5: 24px;

  /* 圆角 */
  --ds-radius-xs: 2px;  --ds-radius-sm: 3px;  --ds-radius-md: 4px;
  --ds-radius-lg: 6px;  --ds-radius-xl: 8px; --ds-radius-pill: 999px;

  /* 背景色（深色工业） */
  --ds-bg-app: #242424;          --ds-bg-workspace: #2b2b2b;
  --ds-bg-window: #2f2f2f;       --ds-bg-panel: #303030;
  --ds-bg-panel-docked: #2f2f2f; --ds-bg-panel-raised: #383838;
  --ds-bg-panel-floating: #383838; --ds-bg-popover: #3b3b3b;
  --ds-bg-control: #3a3a3a;      --ds-bg-control-hover: #454545;
  --ds-bg-control-active: #505050; --ds-bg-control-disabled: #343434;

  /* 文字色 */
  --ds-text-strong: #ffffff; --ds-text: #dddddd;
  --ds-text-muted: #a5a5a5;  --ds-text-disabled: #777777;

  /* 品牌色 */
  --ds-accent: #BD1C22;       /* 主品牌红，和官网 #B71C1C~#C00000 几乎一致 */
  --ds-accent-hover: #d22a30; --ds-accent-soft: rgba(189, 28, 34, 0.22);

  /* 状态色 */
  --ds-blue: #3C7EFF;  --ds-green: #42d987;
  --ds-yellow: #f2b84b; --ds-danger: #ff7478;

  /* 阴影（关键——所有浮动面板用这个） */
  --ds-shadow-floating: 0 14px 34px rgba(0, 0, 0, 0.24);
  --ds-shadow-floating-strong: 0 22px 52px rgba(0, 0, 0, 0.48), 0 6px 18px rgba(0, 0, 0, 0.28);
  --ds-shadow-popover: 0 18px 42px rgba(0, 0, 0, 0.44), 0 4px 14px rgba(0, 0, 0, 0.24);

  /* 控件尺寸 */
  --ds-control-h-sm: 24px; --ds-control-h-md: 30px; --ds-control-h-lg: 36px;
  --ds-toolbar-target: 48px;
}
```

### 4.2 状态色（用色块/明度表达状态）

| 状态 | 文字色 | 背景色 | 使用场景 |
|---|---|---|---|
| running | `#7BE0A6` | `rgba(35, 195, 112, 0.16)` | 程序运行中 |
| compiling | `#ffd37a` | `rgba(255, 183, 77, 0.16)` | 编译中 |
| built/downloading/paused | `#9fc8ff` | `rgba(60, 126, 255, 0.16)` | 构建/下载/暂停 |
| error | `#ffffff` | `#BD1C22` | 错误日志计数、激活态 |
| idle/muted | `#a5a5a5` | `rgba(255, 255, 255, 0.08)` | 静态/未运行 |

> **设计哲学**（来自 design-system.css 注释第 1-2 行）：
> > "深色工业后台、**去描边**、**少套标准**、**状态由色块/明度/少量位移表达**"
>
> 100% 匹配 PRD §7 "去边框、用强对比色"。

### 4.3 去边框强制规则（`css/borderless.css`）

**整个项目有 182 行**专门用来"去边框"——是设计系统的硬约束。

```css
button, input:not([type="range"]), select, textarea,
.ds-table, .ds-table thead/tbody/tfoot/tr/th/td,
.window, .panel, .card, .modal, .dialog, .dropdown-menu,
.window-item, .status-bar, .status-item,
.top-menu-divider, .project-dropdown-item::after,
.host-run-inline-group::before, .host-run-cluster-divider {
  border-color: transparent !important;
}

button:focus, input:focus, select:focus, textarea:focus, [tabindex]:focus {
  outline: none !important;
  box-shadow: none !important;
  border-color: transparent !important;
}

input, select, textarea, .standard-input, .panel-search input {
  box-shadow: none !important;
}
```

> 整个 CSS 里 grep `border:` 出现 200+ 次，但**所有非零的 border 都是显式 `border: 0` 或 `border-color: transparent`**——装饰性边框已被工程化清零。

### 4.4 交互组件颜色规范（已统一）

`design-system.css:124-148` 统一了**4 套按钮体系**：

| 类型 | 类 | 背景 | 文字 | hover |
|---|---|---|---|---|
| Primary | `.panel-primary-btn` `.binding-primary-btn` `.arm-mount-btn` | `--ds-accent` | strong | accent-hover |
| Secondary | `.panel-secondary-btn` `.binding-secondary-btn` 等 | `--ds-bg-control` | text | control-hover |
| Subtle | `.menu-btn` `.top-icon-btn` `.toolbar-btn` | transparent | text-muted | control-hover |
| Icon | 同上 + active 时 accent | accent | strong | — |

**所有新组件**（含购物车按钮、购物车面板）必须套这套规范。

### 4.5 字体

- 字体族：`'Segoe UI', Tahoma, Geneva, Verdana, sans-serif`（**西文优先**——OS 端是工程师工具，无中文展示字体声明）
- 基础字号：12px（`--ds-font-md`）
- 行高：1.45（`--ds-line-base`），交互元素 1.0（`--ds-line-tight`）
- 与官网（庞门正道 + 默认无衬线）**字体族不同**——但这是合理的：OS 是工具软件，官网是营销页

### 4.6 图标

- `Bootstrap Icons` v1.11.0（`<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.0/font/bootstrap-icons.css">`）
- 购物车候选：`bi-cart` / `bi-cart-plus` / `bi-cart-check`（带数字角标可用 `bi-cart-fill` + `<span class="cart-count">` 拼装）

### 4.7 OS 端独有的"亮外壳 + 暗内核"分层

```
外层（亮色）：.main-container #ffffff + .top-menu-bar #f7f7f8 + .status-bar #f0f0f0
内层（暗色）：.workspace #2b2b2b（实际是 #e5e5e5，3D 渲染区）、.window、.panel
```

> 设计意图很清晰：菜单栏 + 状态栏 = 操作系统任务栏/菜单（亮）；工作区 = 应用窗口（暗）。
> **商城购物车按钮在亮色 top-menu-bar 上**——视觉上是"系统功能"层级，OK。

---

## 五、与 PRD 对齐检查

| PRD 约束 | 现状 | 评估 |
|---|---|---|
| **§3.2 购物车全局入口** | 完全无 | ❌ 需新增：top-menu + 视口工具栏 + 状态栏 三处入口 |
| **§3.2 OS 端与官网共用购物车数据** | 无后端、无购物车数据模型 | ❌ 需从零搭（建议用 localStorage 做本地态，后端同步走 PRD §2.4 账号体系） |
| **§3.2 OS 端 top 图/2D + 3D 仿真都有购物车图标** | 没有 top 图/2D 视图；只有 3D 仿真 | ⚠️ 需先和 PM 确认"top 图/2D 设备库"是不是要单做视图 |
| **§3.3 物料清单三分类（标准件/加工件/参考件）** | 设备库只有 1 个分类粒度 | ❌ 需在 device-data.js 增加 type 字段（standard / custom / reference） |
| **§3.3 用颜色区分三分类（不用边框）** | 设备卡片已是红黑 + 暗灰，**已有配色** | ✅ 容易加：标准件=品牌红、加工件=黄、参考件=灰 |
| **§3.4 OS 端"生成购物车/物料清单"按钮** | 无 | ❌ 需新增：放在状态栏的"窗口管理"区或 3D 视口工具栏 |
| **§3.5 按项目分组的订单** | 已有 project-dropdown（XYZ演示 / kj核酸线4-5站） | ✅ 项目维度天然存在 |
| **§4.1 设备库页面购物车图标** | 设备库是浮动面板，**可加图标** | ✅ 改造点明确 |
| **§4.2 3D 仿真 + 设备库 + 购物车共用** | 数据未打通 | ❌ 需建立"项目-购物车"数据模型 |
| **§4.3 一键下单跳转官网** | 无 | ❌ 需新增按钮 + 跳转逻辑（OS 端不结算） |
| **§6 在线体验 OS 入口（手机号假项目）** | 无 | ❌ 需新建一个独立的"体验模式"分支（或用现有 OS 加 disabled 状态） |
| **§7.1 统一交互组件颜色** | design-system.css 已 4 套按钮规范 | ✅ 商城组件直接套用 |
| **§7.2 边框基本不用** | borderless.css 强制全清 | ✅ **完美吻合**——比官网还彻底 |
| **§7.3 字体规范** | 仅字体族 + 4 档字号 | ⚠️ 字号/间距表需要再出（已有 token 体系） |
| **§8.1 数据源切换（3D/Blockly/流程图）** | **已存在** execute-toolbar 的数据源下拉 | ✅ 部分完成——需对照 PRD 调整为"不默认选中" |
| **§8.1 Blockly 二级下拉（区域）** | **已存在** 但默认 hidden | ✅ 框架已搭 |
| **§8.2 真机/仿真/孪生三模式工具栏切换** | **不在 host 工具栏**——是 Blockly iframe 内复选框 | ❌ **与 PRD 偏离**——需重构到 host 工具栏 |
| **§8.3 跨端 MQTT 同步** | 无 | ❌ 需后端配合（先有账号 + 购物车后端） |

---

## 六、商城接入点（落地清单）

### 6.1 购物车入口（3 处必加）

| 位置 | 优先级 | 建议形态 |
|---|---|---|
| **顶部菜单栏**（`index.html:120` 之后，用户头像之前） | P0 | `bi-cart` 图标 + 数字角标；点击弹下拉（最近加购 / 去购物车 / 清空） |
| **3D 视口工具栏**（`index.html:333` 录屏之后、handle 之前） | P0 | `bi-cart` 图标，**与录屏成对**——录屏=输出、购物车=下单 |
| **状态栏窗口管理区**（`index.html:684-696`） | P1 | 紧贴"动作编辑"右侧，第 4 个 `.window-item` |
| 设备库面板内（每个 device-card 右下角"加入购物车"小图标） | P1 | `bi-cart-plus`，hover 显示 |

> **设计原则**：购物车图标和设备库图标**视觉对仗**——`bi-box-seam`（设备库）+ `bi-cart`（购物车），都带数字角标，OS 端 0 状态时是灰、>0 时是品牌红。

### 6.2 物料清单生成入口

| 位置 | 形态 |
|---|---|
| **3D 视口工具栏** | "录屏"和"购物车"之间插一个"生成 BOM"按钮（`bi-list-check` 或 `bi-receipt`） |
| **状态栏"窗口管理"区** | 同购物车的位置策略 |
| **设备库面板** | 顶部 `panel-controls` 内加一个"全部加入购物车"链接 |

### 6.3 数据模型（最小可行）

```js
// 购物车数据（建议落到 localStorage，后端再同步）
{
  projectId: "XYZ演示",           // 来自 project-dropdown
  items: [
    { id: "Z-EMG-4", name: "Z-EMG-4", category: "抓取设备", type: "standard", qty: 1, addedAt: ... },
    { id: "Z-EFG-8S", name: "Z-EFG-8S", category: "抓取设备", type: "standard", qty: 2, addedAt: ... }
  ],
  lastSync: ...
}
```

- **type 三分类** 在 `js/device-data.js` 的设备元数据里加 `type: "standard" | "custom" | "reference"` 字段
- **跨端同步** 走 `fetch` + 后端 API，登录态从项目 dropdown 旁的用户头像拿
- **离线支持** OS 端先落 localStorage，恢复网络后批量同步

### 6.4 与官网商城的对接

- OS 端购物车数据格式 = 官网购物车数据格式（同一份后端）
- OS 端"一键下单"= 跳到 `https://www.hitbot.cc/store/cart?from=os&project=XYZ演示`（或 `store.hitbot.cc`，看商城最终域名）
- OS 端**不结算**（PRD §4.3），结算全部走官网

### 6.5 体验入口（PRD §6）

> "在 3D 场景内直接编辑，简化版只读 OS，不持久化，不调后端"——本项目**本身就是体验版**的天然候选。

**方案 A（推荐）**：复用本项目，URL 加 `?mode=trial`，进入后：
- 禁用持久化（不写 localStorage）
- 隐藏工程按钮（"后台管理"/"系统配置"/"下载"）
- 顶部菜单栏加红色"体验模式"标识
- 设备库禁用加购物车按钮

**方案 B**：新建独立 `trial/` 目录，复制本项目精简版

**推荐 A**——本项目已经是 mock 数据 + 静态部署，改造 1-2 个开关即可。

### 6.6 Blockly iframe 通信（待确认）

OS 端 ↔ Blockly iframe 通信机制**未在源码看到**。需要和前端确认：
- 是否走 `window.postMessage`？
- 还是走共享的 `window.parent` 全局变量？
- 真机/仿真切换如何在 host 工具栏上做（需 Blockly 暴露 API）

### 6.7 风格：与官网商城对齐

| 项 | 官网（hitbot-cc-research.md） | OS 端（hitbotos-ui-opt） | 商城组件应**采用** |
|---|---|---|---|
| 品牌色 | `#B71C1C`~`#C00000` | `#BD1C22` | **OS 端 token**（已统一） |
| 边框 | 极简（表单零边框） | **强制全清** | OS 端 borderless.css |
| 按钮 | 红底白字 / 黑描边 / 文字 | 4 套（primary/secondary/subtle/icon） | **OS 端 4 套** |
| 字体 | 庞门正道 + 默认无衬线 | Segoe UI | **OS 端 Segoe UI**（OS 是工具，商城嵌入 OS 也用 Segoe UI） |
| 状态色 | 红黑白 | 红 + 绿/蓝/黄 | **OS 端 4 色状态** |

> **关键判断**：商城在 OS 端以**弹窗/抽屉/独立页**出现时，**直接套 OS 端 design-system.css**；商城在官网前台出现时，套官网的浅色风格。**两套视觉但同一套交互组件命名**（primary/secondary/subtle/icon 通用），靠 token 切换。

---

## 七、给后续项目的提醒

1. **本项目是 UI 原型**——纯静态 + mock 数据，**生产化时要拆组件库**，从 design-system.css 起做 Design System
2. **OS 端"top 图/2D 设备库"窗口目前不存在**——PRD §3.2 提到的"top 图/2D 设备库 页面**和** 3D 仿真页面都有购物车图标"需要先和 PM 确认这是不是要做新窗口（当前设备库是 3D 视口内的浮动面板）
3. **Blockly iframe 是独立体系**——很多 PRD 提到的 OS 端功能（如运行模式切换、跨端同步）实际上跑在 iframe 内部，要改造需要 Blockly 端配合
4. **设备 ID 和官网产品 ID 已对齐**（Z-EMG-4、Z-EFG-8S 等），**商城购物车可共用同一份 SKU 字典**
5. **GitHub Pages 自动部署**——所有改动走 main 分支 push 即上线，**没有 staging 环境**——重要改动建议开 worktree 分支

---

## 附录 A：OS 端 UI 关键截图

调研过程中拍摄的关键截图（用于设计参考）：

- `screenshots/os-overview.jpeg` —— 三窗口默认布局（电气拓扑 + 3D仿真 + 动作编辑）
- `screenshots/os-device-library.jpeg` —— 设备库面板展开状态
- `screenshots/os-device-cards.jpeg` —— 设备卡片 3 列网格 + 抓取设备 8 个
- `screenshots/os-layout-selector.jpeg` —— 6 种窗口布局选择器

## 附录 B：改造影响面估算

| 改造项 | 涉及文件 | 工作量（估） |
|---|---|---|
| 购物车按钮 + 数字角标 | `index.html`（+3 处）+ `css/main.css`/`simulator-toolbar.css` + `js/script.js`（state 监听） | 0.5 天 |
| 购物车下拉面板 | 新建 `js/cart-panel.js` + `css/cart-panel.css` | 1 天 |
| 设备库"加入购物车"按钮 | `js/device-library-panel.js` + `css/device-library-panel.css` | 0.5 天 |
| 物料清单生成（3D 场景 → BOM） | `js/simple-webgl-scene.js` 提取场景设备列表 + `js/cart-panel.js` 接收 | 1.5 天 |
| 体验模式开关 | `js/script.js` URL 参数解析 + 多处 disabled 控制 | 1 天 |
| Blockly host 通信 | 新建 `js/host-bridge.js` + Blockly 端配合 | 1.5 天（需 Blockly 团队配合） |
| 跨端 MQTT 同步 | 后端 + 前端 WS 客户端 | 后端 2 周 + 前端 2 天（不在本项目范围） |

合计 **~1.5 周**（不含后端）即可跑通 OS 端 → 商城购物车的最小闭环。
