'use client';

import React from 'react';
import Link from 'next/link';
import { ToolItem } from '@/data/registry';
import { useApp } from '@/context/AppContext';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import ToolRunner from '@/components/ToolRunner';
import ToolCard from '@/components/ToolCard';

interface ToolPageClientProps {
  tool: ToolItem;
  relatedTools: ToolItem[];
}

const CAT_NAMES: Record<string, { bn: string; en: string }> = {
  documents: { bn: 'ডকুমেন্ট', en: 'Documents' },
  images: { bn: 'ছবি ও ইমেজ', en: 'Images' },
  calculators: { bn: 'ক্যালকুলেটর', en: 'Calculators' },
  qr: { bn: 'কিউআর কোড', en: 'QR Codes' },
  media: { bn: 'মিডিয়া ও ভিডিও', en: 'Media' },
  resume: { bn: 'রেজুমি ও সিভি', en: 'Resume' },
};

export default function ToolPageClient({ tool, relatedTools }: ToolPageClientProps) {
  const { lang } = useApp();

  const title = lang === 'bn' ? tool.bn : tool.en;
  const leadText = lang === 'bn' ? tool.intro : tool.introEn;
  const primaryCat = tool.cats[0] || 'documents';
  const catLabel = CAT_NAMES[primaryCat]
    ? lang === 'bn'
      ? CAT_NAMES[primaryCat].bn
      : CAT_NAMES[primaryCat].en
    : primaryCat;

  React.useEffect(() => {
    if (typeof document !== 'undefined') {
      document.title = `${title} | ToolGhor`;
    }
  }, [lang, title]);

  const trustText =
    lang === 'bn'
      ? 'আপনার ফাইল বা তথ্যগুলো সম্পূর্ণ আপনার ব্রাউজারে সুরক্ষিতভাবে প্রসেস হয়। কোনো ফাইলই সার্ভারে আপলোড হয় না।'
      : 'Your files and data are processed 100% securely directly in your browser. No files are ever uploaded to any server.';

  const howToTitle = lang === 'bn' ? 'কীভাবে ব্যবহার করবেন' : 'How to Use';
  const relatedTitle = lang === 'bn' ? 'আরও দরকারি টুলস' : 'Related Tools';
  const steps = lang === 'bn' ? tool.steps : tool.stepsEn;

  return (
    <>
      <Header />

      <main className={`wrap tool-page cat-${primaryCat}`}>
        {/* Breadcrumb */}
        <div className="crumb">
          <Link
            href="/"
            scroll={true}
            onClick={() => {
              if (typeof window !== 'undefined') {
                window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
              }
            }}
          >
            {lang === 'bn' ? 'হোম' : 'Home'}
          </Link> /{' '}
          <Link href={`/#cat-${primaryCat}`}>
            {catLabel}
          </Link>{' '}
          / {title}
        </div>

        {/* Heading */}
        <h1>{title}</h1>

        <p className="lead">{leadText}</p>

        {/* Privacy Note */}
        <div className="trust">
          <span className="ic" aria-hidden="true">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z" />
              <path d="m9 12 2 2 4-4" />
            </svg>
          </span>
          <span>{trustText}</span>
        </div>

        {/* Main Tool Runner Panel */}
        <div className="panel">
          <ToolRunner tool={tool} />
        </div>

        {/* How to use */}
        <div className="how">
          <h2>{howToTitle}</h2>
          <ol>
            {steps.map((step, idx) => (
              <li key={idx}>{step}</li>
            ))}
          </ol>
        </div>

        {/* Related Tools */}
        {relatedTools.length > 0 && (
          <div className="related">
            <h2>{relatedTitle}</h2>
            <div className="grid">
              {relatedTools.map((relTool) => (
                <ToolCard key={relTool.slug} tool={relTool} category={tool.cats[0]} />
              ))}
            </div>
          </div>
        )}
      </main>

      <Footer />
    </>
  );
}
