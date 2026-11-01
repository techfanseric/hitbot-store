# 产品资料区第一版验证

日期：2026-11-01。修改前代码：`df8e03d`。本次为本地实现，未部署到正式站点。

## 本次行为

- 网页和小程序都在参数之后、配件之前加入紧凑的产品资料区，默认两行；公开获取，不要求登录或绑定企业。
- 网页：PDF 查看/下载，STP 下载；小程序：PDF 查看，模型复制稳定的商品资料页链接，并提示电脑打开。
- 无资料隐藏模块，只有手册时只显示一行；空参数不再显示空标题，资料区独立渲染。
- 元数据来自共享 `Product.resources`，页面加载不请求文件。语言、版本可选。
- S622 使用两份明确标注“示例”的真实小文件；EMG-4 只有示例 PDF。PDF 非正式产品手册，STP 为 10 mm 示例方块，非产品 CAD。正式上线需替换文件和真实大小。

## 实际截图

截图来自运行中的 Next.js 页面及微信开发者工具原生小程序模拟器，没有用 HTML 仿制小程序。Before/After 使用相同商品 S622、相同滚动位置。

| 场景 | Before | After |
| --- | --- | --- |
| 网页桌面全页 | [Before](screenshots/product-resources-2026-11-01/web-before.png) | [After](screenshots/product-resources-2026-11-01/web-after.png) |
| 网页手机 390px | [Before](screenshots/product-resources-2026-11-01/web-mobile-before.png) | [After](screenshots/product-resources-2026-11-01/web-mobile-after.png) |
| 微信小程序 | [Before](screenshots/product-resources-2026-11-01/mini-before.png) | [After](screenshots/product-resources-2026-11-01/mini-after.png) |

补充：[桌面局部](screenshots/product-resources-2026-11-01/web-after-detail.png)、[浏览器 PDF 查看器](screenshots/product-resources-2026-11-01/web-pdf-preview.png)、[英文](screenshots/product-resources-2026-11-01/web-english-after.png)、[320px 英文](screenshots/product-resources-2026-11-01/web-320-english.png)、[深色主题](screenshots/product-resources-2026-11-01/web-dark-after.png)、[小程序复制提示](screenshots/product-resources-2026-11-01/mini-copy-link.png)、[小程序 PDF 失败重试](screenshots/product-resources-2026-11-01/mini-pdf-error.png)。

网页桌面实测资料区高度约 159px，文件列表本体 120px。390px 中文和 320px 英文均无横向溢出。小程序采用其现有卡片样式，两个文件保持两行条目。

## 验证结果

| 检查 | 结果 | 证据/范围 |
| --- | --- | --- |
| 未登录 PDF 查看 | 通过 | 实际点击后新窗口显示浏览器 PDF 阅读器 |
| 未登录 PDF/STP 下载 | 通过 | 实际浏览器下载事件、正确文件名，下载字节与源文件逐字节一致 |
| 文件按点击获取 | 通过 | 首次商品页加载，附件网络请求为 0 |
| 仅手册商品 | 两端通过 | EMG-4 资料区实际显示 1 行 |
| 无资料商品 | 两端通过 | 2442 页面没有资料区节点 |
| 手机/英文/深色 | 通过 | 运行页面截图；窄屏无横向溢出 |
| 小程序默认资料展示 | 通过 | 微信模拟器实际渲染，公共浏览状态无需企业登录 |
| 小程序模型复制链接 | 通过 | 实际点击并读回剪贴板：`https://www.hitbot.cc/store/products/z-arm-s622#product-resources` |
| 复制链接对应网页路由 | 通过 | 本地生产服务正常打开且定位到资料区；标题顶部 120px，页头底部 101px，不被遮挡；[截图](screenshots/product-resources-2026-11-01/web-anchor-after.png) |
| 小程序 PDF 失败反馈 | 通过 | 注入 HTTP 404 响应，出现“手册打开失败，请重试”及“重试”按钮 |
| 小程序 PDF 重试成功后的 UI | 通过，接口桩 | 注入下载成功和 openDocument 成功响应，错误消失并恢复“查看”；不代表原生查看器已经验证 |
| 小程序 PDF 原生下载/预览/保存 | 待合法域名和真机联调 | 实际请求本地文件被微信合法域名校验拦截，未关闭域名校验；未声称预览或保存成功 |
| `pnpm build` | 通过 | Next.js 生产构建与静态页面生成完成 |
| `pnpm typecheck` | 通过 | Web 类型检查通过 |
| `pnpm lint` | 通过 | 全仓库 ESLint 通过 |
| `pnpm mini:build` | 通过 | Taro 微信构建通过，默认正式站点来源已恢复 |
| `pnpm mini:typecheck` | 基线已有失败 | 4 条诊断均来自未改动的订单详情页；从 HEAD 导出的独立基线复现了完全相同的 4 条诊断，无新增诊断 |
| `git diff --check` | 通过 | 无空白错误 |

下载校验：

| 文件 | 字节数 | SHA-256 |
| --- | --- | --- |
| PDF | 2207 | `6f7b5b4493f69c7fa549f885ac4bb2eb17f89005d42bbece297a13e09da20a48` |
| STP | 2277 | `ebfd19ad546b1e032f0af50d0c4887849c9f608b652436694bc1e33d61292165` |

原始结果保存在[证据目录](screenshots/product-resources-2026-11-01/evidence/)，实际下载文件也一并留存。

## 环境与边界

- 网页使用 ego-browser 操作本地站点，最终构建也使用生产服务验证。对比截图保存原始捕获结果。
- 原项目 AppID 在开发者工具启动时出现 `MaxCodeSize/MinTabbarCount` 异常；隔离复制构建产物，使用游客测试项目、基础库 3.10.3 完成布局验证。未修改仓库现有 AppID、未关闭域名校验。
- 当前开发者工具 `Tool.getInfo` 返回 `version`，自动化 SDK 仍读取 `SDKVersion`。仅在临时测试脚本中兼容这项元数据差异，没有修改产品或 SDK 文件。
- PDF 真下载尝试使用隔离构建变量 `TARO_APP_STORE_URL=http://127.0.0.1:3107`，被合法域名校验拦截。最终已重建默认来源 `https://www.hitbot.cc`。
- 正式文件域名及 `downloadFile` 合法域名配置、真实大文件带宽和真机保存/转发体验仍待部署联调；这次不引入上传后台和 3D 预览。
- 小程序既有类型错误：`currentStep` 可能为空（117、153 行）；状态映射缺少 `shipment-review`、`awaiting-stock`（239 行）。本次未改动订单业务。

## 本地查看

运行 `pnpm dev --port 3107` 后打开 `/zh/products/z-arm-s622`。如果使用现成生产构建，可以运行 `pnpm start --port 3107`。不要让 dev 与 build 同时操作同一个 `.next` 目录。

小程序运行 `pnpm mini:build` 后用微信开发者工具打开 `apps/wechat-miniprogram`，进入 S622 详情。正式资料字段及部署要求见 [API contract](../product/mini-program-api-contract.md)。
