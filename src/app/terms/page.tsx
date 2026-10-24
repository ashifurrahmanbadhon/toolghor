import { Metadata } from 'next';
import { getAllPolicySections } from '@/lib/policiesData';
import { siteConfig } from '@/data/config';
import TermsClient from './TermsClient';

export const metadata: Metadata = {
  title: 'Terms & Policies — ToolGhor',
  description:
    'Comprehensive Terms & Conditions, Acceptable Use, Disclaimer, Cookie Policy, and intellectual property terms for ToolGhor — Bangladesh’s trusted web tools platform.',
  keywords: ['Terms of Service', 'ToolGhor terms', 'Bangladesh legal web tools'],
  alternates: {
    canonical: `${siteConfig.url}/terms`,
  },
};


import { getPublicSiteData } from '@/lib/siteData';

export default async function TermsPage() {
  const [allPolicies, siteData] = await Promise.all([
    getAllPolicySections(),
    getPublicSiteData(),
  ]);
  const { privacy: _omitted, ...initialPolicies } = allPolicies;

  return <TermsClient initialPolicies={initialPolicies} contentTexts={siteData?.contentTexts} />;
}
