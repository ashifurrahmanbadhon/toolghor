import { Metadata } from 'next';
import { siteConfig } from '@/data/config';
import GuideIndex from '@/components/GuideIndex';
import { getAllGuides } from '@/lib/guidesData';


export const metadata: Metadata = {
  title: 'Guides | ToolGhor',
  description:
    'Helpful guides for everyday tasks — photo sizes for applications, land measurement, passport photos and more, in English and বাংলা.',
  openGraph: {
    title: 'Guides | ToolGhor',
    description:
      'Helpful guides for everyday tasks — photo sizes for applications, land measurement, passport photos and more, in English and বাংলা.',
    url: `${siteConfig.url}/guides`,
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Guides | ToolGhor',
    description:
      'Helpful guides for everyday tasks — photo sizes for applications, land measurement, passport photos and more, in English and বাংলা.',
  },
  alternates: {
    canonical: `${siteConfig.url}/guides`,
  },
};

import { getPublicSiteData } from '@/lib/siteData';

export default async function GuidesPage() {
  const [guides, siteData] = await Promise.all([
    getAllGuides(),
    getPublicSiteData(),
  ]);
  return <GuideIndex guides={guides} contentTexts={siteData?.contentTexts} />;
}
