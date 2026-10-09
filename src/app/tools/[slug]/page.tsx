import React from 'react';
import { notFound } from 'next/navigation';
import { Metadata } from 'next';
import Link from 'next/link';
import { TOOLS, TOOLS_BY_SLUG } from '@/data/registry';
import { siteConfig } from '@/data/config';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import ToolRunner from '@/components/ToolRunner';
import ToolCard from '@/components/ToolCard';
import { ShieldCheck, ArrowLeft, CheckCircle2 } from 'lucide-react';

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  return TOOLS.map((tool) => ({
    slug: tool.slug,
  }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const tool = TOOLS_BY_SLUG[slug];

  if (!tool) {
    return {
      title: 'Tool Not Found | ToolGhor',
    };
  }

  const title = `${tool.en} (${tool.bn}) | ${siteConfig.name}`;
  const description = `${tool.descEn}. ${tool.desc} - Free, fast, and 100% private in-browser tool.`;

  return {
    title,
    description,
    keywords: tool.keywords.split(' '),
    openGraph: {
      title,
      description,
      type: 'website',
      url: `${siteConfig.url}/tools/${tool.slug}`,
    },
    alternates: {
      canonical: `${siteConfig.url}/tools/${tool.slug}`,
    },
  };
}

export default async function ToolPage({ params }: Props) {
  const { slug } = await params;
  const tool = TOOLS_BY_SLUG[slug];

  if (!tool) {
    notFound();
  }

  // Related tools from the same category
  const relatedTools = TOOLS.filter(
    (t) => t.slug !== tool.slug && t.cats.some((cat) => tool.cats.includes(cat))
  ).slice(0, 4);

  return (
    <>
      <Header />

      <main className={`wrap tool-page cat-${tool.cats[0]}`}>
        {/* Breadcrumb */}
        <div className="crumb">
          <Link href="/">Home</Link> /{' '}
          <Link href={`/#cat-${tool.cats[0]}`} className="capitalize">
            {tool.cats[0]}
          </Link>{' '}
          / {tool.en}
        </div>

        {/* Heading */}
        <h1>
          {tool.en} <small>{tool.bn}</small>
        </h1>

        <p className="lead">
          {tool.introEn} <span style={{ display: 'block', marginTop: '4px', opacity: 0.85 }}>{tool.intro}</span>
        </p>

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
          <span>
            আপনার ফাইল বা তথ্যগুলো সম্পূর্ণ আপনার ব্রাউজারে সুরক্ষিতভাবে প্রসেস হয়। কোনো ফাইলই সার্ভারে আপলোড হয় না।
          </span>
        </div>

        {/* Main Tool Runner Panel */}
        <div className="panel">
          <ToolRunner tool={tool} />
        </div>

        {/* How to use */}
        <div className="how">
          <h2>কীভাবে ব্যবহার করবেন (How to Use)</h2>
          <ol>
            {tool.steps.map((step, idx) => (
              <li key={idx}>
                {step} {tool.stepsEn[idx] && <span style={{ opacity: 0.75, fontSize: '0.9em' }}>— {tool.stepsEn[idx]}</span>}
              </li>
            ))}
          </ol>
        </div>

        {/* Related Tools */}
        {relatedTools.length > 0 && (
          <div className="related">
            <h2>আরও দরকারি টুলস (Related Tools)</h2>
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
