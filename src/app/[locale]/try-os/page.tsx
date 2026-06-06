import type { Metadata } from 'next';
import { setRequestLocale } from 'next-intl/server';
import { TrialExperience } from '@/components/store/trial-experience';

export const metadata: Metadata = {
  title: '在线体验 OS',
  description: '在线预览 HITBOTOS 体验模式，了解机器人设备库、仿真场景和引导式 OS 工作流。',
  alternates: {
    canonical: '/try-os',
  },
  openGraph: {
    title: '在线体验 OS | HITBOT',
    description: '在线预览 HITBOTOS 体验模式，了解机器人设备库、仿真场景和引导式 OS 工作流。',
    url: '/try-os',
    images: ['/hitbot/os/hitbot-os-system.png'],
  },
};

interface TrialPageProps {
  params: Promise<{ locale: string }>;
}

export default async function TrialPage({ params }: TrialPageProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <div className="bg-bg-app">
      <TrialExperience />
    </div>
  );
}
