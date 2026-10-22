import { Metadata } from 'next';
import { getPolicySection } from '@/lib/policiesData';
import PrivacyClient from './PrivacyClient';

export const metadata: Metadata = {
  title: 'Privacy Policy — ToolGhor',
  description:
    'ToolGhor Privacy Policy. Learn how your files are processed 100% inside your browser, our privacy-first principles, local storage usage, and third-party API processors.',
  keywords: ['Privacy Policy', 'ToolGhor privacy', 'client-side security', 'Bangladesh web tools'],
};

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function PrivacyPage() {
  const privacyPolicy = await getPolicySection('privacy');

  return <PrivacyClient initialPolicy={privacyPolicy} />;
}
