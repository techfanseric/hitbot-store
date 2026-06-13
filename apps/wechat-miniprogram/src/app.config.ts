export default defineAppConfig({
  pages: [
    'pages/products/index',
    'pages/cart/index',
    'pages/orders/index',
    'pages/account/index',
    'pages/product-detail/index',
    'pages/order-detail/index',
    'pages/addresses/index',
    'pages/invoices/index',
  ],
  window: {
    backgroundTextStyle: 'light',
    navigationBarBackgroundColor: '#ffffff',
    navigationBarTitleText: 'HITBOT Store',
    navigationBarTextStyle: 'black',
    backgroundColor: '#f6f6f7',
  },
  tabBar: {
    color: '#777777',
    selectedColor: '#BD1C22',
    backgroundColor: '#ffffff',
    borderStyle: 'white',
    list: [
      {
        pagePath: 'pages/products/index',
        text: '产品',
        iconPath: 'assets/tab-products.png',
        selectedIconPath: 'assets/tab-products-active.png',
      },
      {
        pagePath: 'pages/cart/index',
        text: '购物车',
        iconPath: 'assets/tab-cart.png',
        selectedIconPath: 'assets/tab-cart-active.png',
      },
      {
        pagePath: 'pages/orders/index',
        text: '订单',
        iconPath: 'assets/tab-orders.png',
        selectedIconPath: 'assets/tab-orders-active.png',
      },
      {
        pagePath: 'pages/account/index',
        text: '我的',
        iconPath: 'assets/tab-account.png',
        selectedIconPath: 'assets/tab-account-active.png',
      },
    ],
  },
});
