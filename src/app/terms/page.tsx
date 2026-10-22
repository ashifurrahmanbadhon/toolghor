import { Metadata } from 'next';
import { getAllPolicySections } from '@/lib/policiesData';
import TermsClient from './TermsClient';

export const metadata: Metadata = {
  title: 'Terms & Policies — ToolGhor',
  description:
    'Comprehensive Terms & Conditions, Acceptable Use, Disclaimer, Cookie Policy, and intellectual property terms for ToolGhor — Bangladesh’s trusted web tools platform.',
  keywords: ['Terms of Service', 'ToolGhor terms', 'Privacy Policy', 'Bangladesh legal web tools'],
};

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function TermsPage() {
  const initialPolicies = await getAllPolicySections();

  return <TermsClient initialPolicies={initialPolicies} />;
}
