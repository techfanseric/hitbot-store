import Link from 'next/link';

export default function NotFound() {
  return (
    <html lang="zh" className="light">
      <body className="bg-bg-app text-text-strong flex min-h-screen items-center justify-center">
        <div className="space-y-4 text-center">
          <h1 className="text-5xl font-semibold">404</h1>
          <p className="text-text-muted">页面不存在</p>
          <Link href="/zh" className="text-brand-500 hover:text-brand-400 inline-block">
            返回首页
          </Link>
        </div>
      </body>
    </html>
  );
}
