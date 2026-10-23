import { Metadata } from 'next';
import { siteConfig } from '@/data/config';
import GuideIndex from '@/components/GuideIndex';
import { getAllGuides } from '@/lib/guidesData';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

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

export default async function GuidesPage() {
  const guides = await getAllGuides();
  return <GuideIndex guides={guides} />;
}
