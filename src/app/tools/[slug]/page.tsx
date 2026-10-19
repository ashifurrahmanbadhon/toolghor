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
import { getPublicSiteData } from '@/lib/siteData';
import ToolPageClient from './ToolPageClient';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export function generateStaticParams() {
  return TOOLS.map((t) => ({ slug: t.slug }));
}

interface Props {
  params: Promise<{ slug: string }>;
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
      images: [
        {
          url: '/og-image.png',
          width: 1200,
          height: 630,
          alt: `${tool.en} - ToolGhor`,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: ['/og-image.png'],
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

  // Check database status: if deactivated by admin, tool must NOT be accessible
  const siteData = await getPublicSiteData();
  const dbTool = siteData?.tools?.find((t: any) => t.slug === slug);
  if (dbTool && dbTool.is_active === false) {
    notFound();
  }

  // Active categories map
  const activeCatMap = new Set(
    (siteData?.categories || [])
      .filter((c: any) => c.is_active)
      .map((c: any) => c.slug)
  );

  // If tool's categories are all deactivated by admin, tool is also deactivated
  if (siteData?.categories && siteData.categories.length > 0) {
    const hasActiveCategory = tool.cats.some((cat) => activeCatMap.has(cat));
    if (!hasActiveCategory) {
      notFound();
    }
  }

  // Related tools from the same category that are strictly active in DB
  const dbToolMap = new Map((siteData?.tools || []).map((t: any) => [t.slug, t.is_active]));
  const relatedTools = TOOLS.filter(
    (t) =>
      t.slug !== tool.slug &&
      t.cats.some((cat) => tool.cats.includes(cat) && activeCatMap.has(cat)) &&
      dbToolMap.get(t.slug) !== false
  ).slice(0, 4);

  return <ToolPageClient tool={tool} relatedTools={relatedTools} apiKeys={siteData?.apiKeys} />;
}
