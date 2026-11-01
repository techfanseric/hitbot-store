# HITBOT 小程序 API Contract 草案

> 日期：2026-06-08
> 范围：小程序采购链路。在线体验 OS 和管理后台不在本 contract 范围内。

---

## 1. 鉴权

### POST `/mini/auth/wechat-login`

小程序通过 `wx.login` / `Taro.login` 获取 `code`，服务端换取微信身份并返回小程序会话。

Request:

```json
{
  "code": "wx-login-code"
}
```

Response:

```json
{
  "token": "session-token",
  "openId": "wechat-open-id",
  "profile": null,
  "bound": false
}
```

### POST `/mini/auth/bind-enterprise`

将微信身份绑定到企业成员。首版支持手机号或企业邀请码。

Request:

```json
{
  "phone": "15507540989",
  "inviteCode": "optional"
}
```

Response:

```json
{
  "token": "session-token",
  "openId": "wechat-open-id",
  "bound": true,
  "profile": {
    "enterpriseId": "ENT-HITBOT-CUSTOMER",
    "companyName": "深圳智造装备有限公司",
    "role": "buyer",
    "contactName": "陈思远",
    "phone": "15507540989",
    "email": "buyer@customer.example"
  }
}
```

### GET `/mini/auth/session`

返回当前 token 对应的会话和企业成员身份。

---

## 2. 商品

小程序商品接口应与 PC 商品接口共用字段：`Product`、`Category`、价格、库存、规格、筛选参数。

### GET `/mini/categories`

返回商品主分类。

Response:

```json
[
  {
    "id": "gripper",
    "name": { "zh": "电动夹爪", "en": "Electric Grippers" }
  }
]
```

### GET `/mini/products`

返回小程序可展示的商品列表。默认只返回 `catalogVisible=true` 的商品。

### GET `/mini/products/{slug}`

返回商品详情，字段与 `Product` 一致。

### 商品资料（2026-11-01）

`Product.resources?: ProductResource[]` 为公开资料，不依赖登录、企业绑定或加购权限。缺省或空数组时，两端不显示资料区。示例：

```json
{
  "resources": [
    {
      "id": "manual-zh-v1",
      "kind": "manual",
      "name": { "zh": "产品手册", "en": "Product manual" },
      "format": "pdf",
      "fileName": "product-manual-zh-v1.pdf",
      "sizeBytes": 9017754,
      "url": "https://files.example.com/product-manual-zh-v1.pdf",
      "downloadUrl": "https://files.example.com/product-manual-zh-v1.pdf?download=1",
      "language": "zh",
      "version": "V1.0"
    }
  ]
}
```

- `kind`：`manual` / `model`；`format`：`pdf` / `stp` / `step` / `zip`。大小为真实文件字节数。
- `url` 用于查看原文件，`downloadUrl` 可选，用于浏览器下载；外部存储的下载响应应设置 `Content-Disposition: attachment`，PDF 查看响应使用正确的 PDF 类型并允许内联显示。
- `language` 和 `version` 可选。文件语言与界面语言独立，不能因页面为英文而将中文手册标为英文。
- `isSample: true` 仅用于当前原型中的示例资料；正式上线替换文件时移除此标记并更新实际大小。
- 商品页只展示元数据，禁止自动下载或预加载附件。文件由存储服务承载；本仓库不实现上传后台或模型预览。
- 小程序 PDF 点击后下载临时文件并调用 `openDocument`，显示保存/转发菜单；实际保存能力需真机验证。下载失败、HTTP 非 200 或打开失败均显示重试。
- 小程序模型复制稳定商品资料页 `/store/products/{slug}#product-resources`，不复制临时签名下载地址。
- 小程序站点来源通过构建变量 `TARO_APP_STORE_URL` 配置，默认 `https://www.hitbot.cc`。正式资源域名必须为 HTTPS，并由小程序运营方配置到 `downloadFile` 合法域名；重定向涉及的域名也需核对。
- 当前示例资料在 `public/resources/examples/`：S622 展示手册和模型，EMG-4 展示仅手册，其余商品演示无资料状态。STP 为明确标记的 10 mm 示例方块，不是产品 CAD。

---

## 3. 方案清单 / BOM

### POST `/mini/cart/submit`

小程序提交当前项目清单，服务端按角色生成采购单、审批单或询价单。

Request:

```json
{
  "projectId": "os-line-pack-01",
  "projectName": "包装线上料工位改造",
  "items": [
    {
      "productId": "p-004",
      "qty": 1,
      "partClass": "standard",
      "source": "os",
      "selected": true,
      "sellable": true,
      "quoteRequired": false,
      "syncStatus": "pending",
      "addedAt": 1780845600000
    }
  ],
  "note": "optional"
}
```

Response:

```json
{
  "hasQuoteItems": false,
  "order": {
    "orderNo": "HB20260608093001",
    "enterpriseId": "ENT-HITBOT-CUSTOMER",
    "companyName": "深圳智造装备有限公司",
    "projectId": "os-line-pack-01",
    "projectName": "包装线上料工位改造",
    "role": "buyer",
    "submittedBy": "陈思远",
    "lines": [],
    "subtotalCents": 0,
    "itemCount": 0,
    "submittedAt": "2026-06-08T01:30:00.000Z",
    "status": "pending-approval",
    "paymentMethod": "corporate"
  }
}
```

状态规则建议：

- 工程师提交：`pending-approval`
- 采购提交且含定制件：`pending-quote` 或 `pending-approval`，取决于是否已有报价
- 管理员提交：可直接进入 `pending-payment`
- 对公付款不等同于即时支付，应等待后端确认凭证或财务状态

---

## 4. 订单

### GET `/mini/orders`

返回当前企业成员可见订单。小程序首屏优先展示行动队列。

### GET `/mini/orders/{orderNo}`

返回订单详情，包含清单、状态、收货地址、发票、付款方式。

### POST `/mini/orders/{orderNo}/advance`

小程序轻操作接口，用于 mock/首版动作推进。真实后端可拆成：

- `/approve`
- `/confirm-quote`
- `/confirm-payment`
- `/confirm-receipt`

当前统一接口响应更新后的订单。

### POST `/mini/orders/{orderNo}/payment`

创建微信支付参数。仅用于个人支付或适合微信支付的订单；对公付款应返回对公付款信息或由后端禁止创建微信支付。

Response:

```json
{
  "timeStamp": "1780845600",
  "nonceStr": "nonce",
  "package": "prepay_id=wx-prepay-id",
  "signType": "RSA",
  "paySign": "pay-sign"
}
```

### POST `/mini/orders/{orderNo}/confirm-payment`

支付完成后确认订单付款状态。真实微信支付仍应以后端回调为准，小程序确认只作为前端状态刷新触发。

---

## 5. 地址簿

### GET `/mini/profile/addresses`

返回当前企业常用收货地址。

### POST `/mini/profile/addresses`

新增地址。

### PUT `/mini/profile/addresses/{id}`

更新地址。

字段：

```json
{
  "label": "产线收货点",
  "recipient": "顾明澈",
  "phone": "17701551867",
  "province": "广东省",
  "city": "深圳市",
  "address": "宝安区智能制造园 2 号产线仓"
}
```

---

## 6. 发票抬头

### GET `/mini/profile/invoices`

返回当前企业可用发票抬头。

### POST `/mini/profile/invoices`

新增发票抬头。

### PUT `/mini/profile/invoices/{id}`

更新发票抬头。

字段：

```json
{
  "label": "客户公司抬头",
  "title": "深圳智造装备有限公司",
  "taxId": "91440300CUSTOMER01",
  "bankAccount": "招商银行深圳分行 6222 **** **** 001"
}
```

---

## 7. 前端切换方式

小程序当前在 `apps/wechat-miniprogram/src/config/env.ts` 配置：

```ts
export const miniEnv = {
  apiBaseUrl: '',
};
```

- `apiBaseUrl` 为空：使用本地 mock API，适合开发和验收原型。
- `apiBaseUrl` 有值：使用 Taro HTTP transport 调用上述接口。

所有小程序页面只依赖 `@hitbot/api-client` 的统一方法，不直接依赖 mock 实现。
