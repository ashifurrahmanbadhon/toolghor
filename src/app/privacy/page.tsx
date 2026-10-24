import { Metadata } from 'next';
import { getPolicySection } from '@/lib/policiesData';
import { siteConfig } from '@/data/config';
import PrivacyClient from './PrivacyClient';

export const metadata: Metadata = {
  title: 'Privacy Policy — ToolGhor',
  description:
    'ToolGhor Privacy Policy. Learn how your files are processed 100% inside your browser, our privacy-first principles, local storage usage, and third-party API processors.',
  keywords: ['Privacy Policy', 'ToolGhor privacy', 'client-side security', 'Bangladesh web tools'],
  alternates: {
    canonical: `${siteConfig.url}/privacy`,
  },
};


import { getPublicSiteData } from '@/lib/siteData';

export default async function PrivacyPage() {
  const [privacyPolicy, siteData] = await Promise.all([
    getPolicySection('privacy'),
    getPublicSiteData(),
  ]);

  return <PrivacyClient initialPolicy={privacyPolicy} contentTexts={siteData?.contentTexts} />;
}
