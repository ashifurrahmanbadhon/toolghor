import { MetadataRoute } from 'next';
import { getPublicSiteData } from '@/lib/siteData';
import { siteConfig } from '@/data/config';
import { TOOLS } from '@/data/registry';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = (siteConfig.url || 'https://toolghor.vercel.app').replace(/\/+$/, '');

  // Static routes per owner specification
  const homeEntry: MetadataRoute.Sitemap[number] = {
    url: `${baseUrl}/`,
    changeFrequency: 'weekly',
    priority: 1.0,
  };

  const termsEntry: MetadataRoute.Sitemap[number] = {
    url: `${baseUrl}/terms`,
    changeFrequency: 'monthly',
    priority: 0.3,
  };

  const privacyEntry: MetadataRoute.Sitemap[number] = {
    url: `${baseUrl}/privacy`,
    changeFrequency: 'monthly',
    priority: 0.3,
  };

  try {
    const siteData = await getPublicSiteData();
    let toolEntries: MetadataRoute.Sitemap = [];

    if (siteData && Array.isArray(siteData.tools) && siteData.tools.length > 0) {
      // Sourced directly from live database tool data — only active tools included
      const activeTools = siteData.tools.filter(
        (t: any) => t && t.slug && t.is_active !== false
      );

      toolEntries = activeTools.map((tool: any) => {
        const item: MetadataRoute.Sitemap[number] = {
          url: `${baseUrl}/tools/${tool.slug}`,
          changeFrequency: 'monthly',
          priority: 0.8,
        };

        if (tool.updated_at) {
          const parsedDate = new Date(tool.updated_at);
          if (!isNaN(parsedDate.getTime())) {
            item.lastModified = parsedDate;
          }
        }

        return item;
      });
    } else {
      // Resilient fallback using canonical tool registry
      toolEntries = TOOLS.map((t) => ({
        url: `${baseUrl}/tools/${t.slug}`,
        changeFrequency: 'monthly',
        priority: 0.8,
      }));
    }

    return [homeEntry, ...toolEntries, termsEntry, privacyEntry];
  } catch (error) {
    console.warn('[sitemap] Notice: Serving resilient fallback sitemap due to error:', error);
    const fallbackToolEntries: MetadataRoute.Sitemap = TOOLS.map((t) => ({
      url: `${baseUrl}/tools/${t.slug}`,
      changeFrequency: 'monthly',
      priority: 0.8,
    }));

    return [homeEntry, ...fallbackToolEntries, termsEntry, privacyEntry];
  }
}
