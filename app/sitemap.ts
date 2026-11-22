import { MetadataRoute } from 'next';
import { getBaseUrl } from '@/lib/seo';
import { getXmlSiteUrls } from '@/lib/siteUrls';

/**
 * Rendered from lib/siteUrls.ts. The HTML sitemap page uses the same groups,
 * then getXmlSiteUrls() drops /sitemap and /instant-estimate from this file
 * only. Add or remove a public URL in lib/siteUrls.ts, never here. Omit
 * modification dates when there is no recorded content change; rebuilding
 * the site does not update every page.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = getBaseUrl().replace(/\/$/, '');
  return getXmlSiteUrls().map((e) => ({
    url: e.path === '/' ? baseUrl : `${baseUrl}${e.path}`,
    // Static pages carry no lastModified: a build timestamp is not a content change.
    ...(e.lastModified ? { lastModified: e.lastModified } : {}),
    changeFrequency: e.changeFrequency,
    priority: e.priority,
  }));
}
