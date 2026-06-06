import createMiddleware from 'next-intl/middleware';
import { NextRequest, NextResponse } from 'next/server';
import { routing } from '@/i18n/routing';

const intlMiddleware = createMiddleware(routing);

const storePathMap: Record<string, string> = {
  '/store': '/zh/products',
  '/store/': '/zh/products',
  '/store/products': '/zh/products',
  '/store/checkout': '/zh/checkout',
  '/store/orders': '/zh/orders',
  '/store/account': '/zh/account',
  '/store/login': '/zh/login',
  '/store/try-os': '/zh/try-os',
  '/try-os': '/zh/try-os',
};

const storeRedirectMap: Record<string, string> = {
  '/store/cart': '/zh/checkout',
  '/store/admin': '/zh/account',
};

export default function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const redirectPath = storeRedirectMap[pathname];

  if (redirectPath) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = redirectPath;
    return NextResponse.redirect(redirectUrl);
  }

  const productDetailMatch = pathname.match(/^\/store\/products\/([^/]+)$/);
  const orderDetailMatch = pathname.match(/^\/store\/orders\/([^/]+)$/);
  const mappedPath = productDetailMatch
    ? `/zh/products/${productDetailMatch[1]}`
    : orderDetailMatch
      ? `/zh/orders/${orderDetailMatch[1]}`
      : storePathMap[pathname];

  if (mappedPath) {
    const rewriteUrl = request.nextUrl.clone();
    rewriteUrl.pathname = mappedPath;
    return NextResponse.rewrite(rewriteUrl);
  }

  return intlMiddleware(request);
}

export const config = {
  matcher: ['/((?!api|_next|_vercel|.*\\..*).*)'],
};
