import type { Metadata } from 'next';
import { setRequestLocale } from 'next-intl/server';
import { OrganizationInviteJoinPanel } from '@/components/store/organization-invite-join-panel';

export const metadata: Metadata = {
  title: '加入企业组织',
  description: '验证手机号并加入受邀的 HITBOT 商城企业组织。',
  robots: { index: false, follow: false },
};

interface JoinOrganizationPageProps {
  params: Promise<{ locale: string; token: string }>;
}

export default async function JoinOrganizationPage({ params }: JoinOrganizationPageProps) {
  const { locale, token } = await params;
  setRequestLocale(locale);

  return (
    <main className="bg-bg-app">
      <div className="mx-auto w-[90%] max-w-[600px] py-8 md:py-12">
        <OrganizationInviteJoinPanel token={decodeURIComponent(token)} />
      </div>
    </main>
  );
}
