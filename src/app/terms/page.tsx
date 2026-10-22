import { Metadata } from 'next';
import { getAllPolicySections } from '@/lib/policiesData';
import TermsClient from './TermsClient';

export const metadata: Metadata = {
  title: 'Terms & Policies — ToolGhor',
  description:
    'Comprehensive Terms & Conditions, Acceptable Use, Disclaimer, Cookie Policy, and intellectual property terms for ToolGhor — Bangladesh’s trusted web tools platform.',
  keywords: ['Terms of Service', 'ToolGhor terms', 'Bangladesh legal web tools'],
};

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function TermsPage() {
  const allPolicies = await getAllPolicySections();
  const { privacy: _omitted, ...initialPolicies } = allPolicies;

  return <TermsClient initialPolicies={initialPolicies} />;
}
