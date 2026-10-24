import { Metadata } from 'next';
import { GENERAL_FAQ } from '@/data/seoData';
import { siteConfig } from '@/data/config';
import FaqClient from './FaqClient';
import { getGeneralFaq } from '@/lib/faqData';


export const metadata: Metadata = {
  title: 'Frequently Asked Questions | ToolGhor',
  description:
    'Answers to common questions about ToolGhor — free online PDF, image, QR, video tools, calculators and resume builder. ToolGhor সম্পর্কে সাধারণ প্রশ্নের উত্তর।',
  openGraph: {
    title: 'Frequently Asked Questions | ToolGhor',
    description:
      'Answers to common questions about ToolGhor — free online PDF, image, QR, video tools, calculators and resume builder. ToolGhor সম্পর্কে সাধারণ প্রশ্নের উত্তর।',
  },
  twitter: {
    title: 'Frequently Asked Questions | ToolGhor',
    description:
      'Answers to common questions about ToolGhor — free online PDF, image, QR, video tools, calculators and resume builder. ToolGhor সম্পর্কে সাধারণ প্রশ্নের উত্তর।',
  },
  alternates: {
    canonical: `${siteConfig.url}/faq`,
  },
};

import { getPublicSiteData } from '@/lib/siteData';

export default async function FaqPage() {
  const [faqs, siteData] = await Promise.all([
    getGeneralFaq().then((res) => res || GENERAL_FAQ),
    getPublicSiteData(),
  ]);

  const faqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((f) => ({
      '@type': 'Question',
      name: f.en.q,
      acceptedAnswer: {
        '@type': 'Answer',
        text: f.en.a,
      },
    })),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(faqSchema),
        }}
      />
      <FaqClient faqs={faqs} contentTexts={siteData?.contentTexts} />
    </>
  );
}
