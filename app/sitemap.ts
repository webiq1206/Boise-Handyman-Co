import { MetadataRoute } from 'next';
import { getBaseUrl } from '@/lib/seo';
import { getAllSiteUrls } from '@/lib/siteUrls';

/**
 * Rendered from lib/siteUrls.ts - the same list the HTML sitemap page
 * (app/sitemap/page.tsx) renders, so the two cannot drift. Add or remove a
 * public URL there, never here. Every indexable URL includes lastModified.
 * Pages without their own publish date use the linking revision in siteUrls.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = getBaseUrl().replace(/\/$/, '');
  return getAllSiteUrls().map((e) => ({
    url: e.path === '/' ? baseUrl : `${baseUrl}${e.path}`,
    lastModified: e.lastModified,
    changeFrequency: e.changeFrequency,
    priority: e.priority,
  }));
}
