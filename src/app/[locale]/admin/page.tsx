import { redirect } from 'next/navigation';
import { setRequestLocale } from 'next-intl/server';

interface AdminPageProps {
  params: Promise<{ locale: string }>;
}

export default async function AdminPage({ params }: AdminPageProps) {
  const { locale } = await params;
  setRequestLocale(locale);
  redirect(`/${locale}/account`);
}
