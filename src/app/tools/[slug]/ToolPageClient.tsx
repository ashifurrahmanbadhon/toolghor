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

export default function ToolPageClient({ tool, relatedTools }: ToolPageClientProps) {
  const { lang } = useApp();

  React.useEffect(() => {
    if (typeof document !== 'undefined') {
      document.title =
        lang === 'bn'
          ? `${tool.bn} (${tool.en}) | ToolGhor`
          : `${tool.en} (${tool.bn}) | ToolGhor`;
    }
  }, [lang, tool]);

  const title = lang === 'bn' ? tool.bn : tool.en;
  const subTitle = lang === 'bn' ? tool.en : tool.bn;
  const leadText = lang === 'bn' ? tool.intro : tool.introEn;

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

      <main className={`wrap tool-page cat-${tool.cats[0]}`}>
        {/* Breadcrumb */}
        <div className="crumb">
          <Link href="/">{lang === 'bn' ? 'হোম' : 'Home'}</Link> /{' '}
          <Link href={`/#cat-${tool.cats[0]}`} className="capitalize">
            {tool.cats[0]}
          </Link>{' '}
          / {title}
        </div>

        {/* Heading */}
        <h1>
          {title} <small>{subTitle}</small>
        </h1>

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
