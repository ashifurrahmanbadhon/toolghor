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
    <div className="min-h-screen flex flex-col bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100">
      <Header />

      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
        {/* Breadcrumb & Navigation */}
        <div className="flex items-center gap-2 text-xs text-zinc-500 mb-6">
          <Link
            href="/"
            className="flex items-center gap-1 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Home</span>
          </Link>
          <span>/</span>
          <span className="capitalize">{tool.cats[0]}</span>
          <span>/</span>
          <span className="text-zinc-800 dark:text-zinc-200 font-medium">{tool.en}</span>
        </div>

        {/* Tool Header */}
        <div className="mb-8">
          <div className="flex flex-wrap items-center gap-3 mb-2">
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              {tool.en} <span className="text-emerald-600 dark:text-emerald-400">({tool.bn})</span>
            </h1>
            {tool.badge && (
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                {tool.badge}
              </span>
            )}
          </div>
          <p className="text-sm sm:text-base text-zinc-600 dark:text-zinc-400 max-w-3xl leading-relaxed">
            {tool.introEn} <span className="block mt-1 text-zinc-500">{tool.intro}</span>
          </p>

          {/* Privacy badge */}
          <div className="inline-flex items-center gap-2 mt-4 px-3 py-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200/60 dark:border-emerald-900/60 text-xs text-emerald-800 dark:text-emerald-300">
            <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span>
              The files and details you enter are processed directly in your browser. No files are uploaded to our servers.
            </span>
          </div>
        </div>

        {/* Interactive Tool Runner Card */}
        <section className="mb-12 rounded-3xl bg-white dark:bg-zinc-900/90 border border-zinc-200/80 dark:border-zinc-800/80 p-6 sm:p-8 shadow-sm">
          <ToolRunner tool={tool} />
        </section>

        {/* How to use */}
        <section className="mb-12 p-6 sm:p-8 rounded-2xl bg-zinc-100/60 dark:bg-zinc-900/40 border border-zinc-200/60 dark:border-zinc-800/60">
          <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            <span>কীভাবে ব্যবহার করবেন (How to use)</span>
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h4 className="text-xs font-semibold uppercase tracking-wider text-zinc-500 mb-2">বাংলা নির্দেশিকা</h4>
              <ol className="space-y-2 text-sm text-zinc-700 dark:text-zinc-300 list-decimal list-inside">
                {tool.steps.map((st, i) => (
                  <li key={i} className="leading-relaxed">
                    {st}
                  </li>
                ))}
              </ol>
            </div>
            <div>
              <h4 className="text-xs font-semibold uppercase tracking-wider text-zinc-500 mb-2">English Guide</h4>
              <ol className="space-y-2 text-sm text-zinc-700 dark:text-zinc-300 list-decimal list-inside">
                {tool.stepsEn.map((st, i) => (
                  <li key={i} className="leading-relaxed">
                    {st}
                  </li>
                ))}
              </ol>
            </div>
          </div>
        </section>

        {/* Related Tools */}
        {relatedTools.length > 0 && (
          <section className="mb-12">
            <h2 className="text-xl font-bold mb-6">
              আরও দরকারি টুলস (More Useful Tools)
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
              {relatedTools.map((relTool) => (
                <ToolCard key={relTool.slug} tool={relTool} />
              ))}
            </div>
          </section>
        )}
      </main>

      <Footer />
    </div>
  );
}
