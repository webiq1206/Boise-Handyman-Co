/**
 * Crawl a production server and write indexation proof.
 *
 *   NEXT_PUBLIC_SITE_URL=https://boisehandyman.co npm run start -- --port 5000
 *   npx tsx scripts/qa-indexation-crawl.ts http://127.0.0.1:5000 qa/handyman-152
 *
 * Writes sitemap-crawl.txt, noindex-inbound.txt, and anchor-map.txt.
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { CITIES, SERVICES } from '../shared/contentData';
import { isCityServiceNoindex } from '../lib/page-metadata';
import { HOME_REPAIRS_ANCHOR, RE10_LINK_ANCHOR, serviceCityAnchor, servicePlainAnchor } from '../lib/seo';

const origin = (process.argv[2] ?? 'http://127.0.0.1:5000').replace(/\/$/, '');
const outDir = process.argv[3] ?? 'qa/handyman-152';

function pathOf(url: string): string {
  const parsed = new URL(url, origin);
  if (parsed.origin !== new URL(origin).origin) return '';
  const path = parsed.pathname.replace(/\/$/, '') || '/';
  return path;
}

function textOf(html: string): string {
  return html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
}

function anchors(html: string): Array<{ text: string; path: string }> {
  const found: Array<{ text: string; path: string }> = [];
  const re = /<a\b([^>]*)>([\s\S]*?)<\/a>/gi;
  let match: RegExpExecArray | null;
  while ((match = re.exec(html))) {
    const attrs = match[1];
    const href = /href="([^"]+)"/i.exec(attrs)?.[1];
    if (!href || href.startsWith('#') || href.startsWith('mailto:') || href.startsWith('tel:')) continue;
    const path = pathOf(href);
    if (!path) continue;
    const text = textOf(match[2]);
    if (!text) continue;
    found.push({ text, path });
  }
  return found;
}

async function get(url: string): Promise<{ status: number; html: string }> {
  const response = await fetch(url, { redirect: 'manual' });
  const html = response.status >= 300 && response.status < 400 ? '' : await response.text();
  return { status: response.status, html };
}

function meta(html: string, name: string): string {
  const tag = new RegExp(`<meta[^>]*name="${name}"[^>]*>`, 'i').exec(html)?.[0]
    ?? new RegExp(`<meta[^>]*name='${name}'[^>]*>`, 'i').exec(html)?.[0]
    ?? '';
  return /content="([^"]*)"/i.exec(tag)?.[1] ?? '';
}

function canonical(html: string): string {
  const tag = /<link[^>]*rel="canonical"[^>]*>/i.exec(html)?.[0] ?? '';
  return /href="([^"]*)"/i.exec(tag)?.[1] ?? '';
}

function expectedCanonical(loc: string): string {
  return loc;
}

async function main() {
  mkdirSync(outDir, { recursive: true });
  const sitemapUrl = `${origin}/sitemap.xml`;
  const sitemap = await get(sitemapUrl);
  if (sitemap.status !== 200) throw new Error(`sitemap status ${sitemap.status}`);
  const locs = [...sitemap.html.matchAll(/<loc>(.*?)<\/loc>/g)].map((match) =>
    match[1].replaceAll('&amp;', '&'),
  );
  const noindexPaths = SERVICES.flatMap((service) =>
    CITIES.filter((city) => isCityServiceNoindex(service.slug, city.slug)).map(
      (city) => `/services/${service.slug}/${city.slug}`,
    ),
  );
  const extraPaths = ['/handyman', '/style-guide', '/estimate/scope'];
  const crawlPaths = [...new Set([
    ...locs.map((loc) => new URL(loc).pathname.replace(/\/$/, '') || '/'),
    ...noindexPaths,
    ...extraPaths,
  ])];

  const pages = new Map<string, { status: number; html: string; canonical: string; robots: string }>();
  for (const path of crawlPaths) {
    const url = path === '/' ? `${origin}/` : `${origin}${path}`;
    const result = await get(url);
    pages.set(path, {
      status: result.status,
      html: result.html,
      canonical: canonical(result.html),
      robots: meta(result.html, 'robots'),
    });
  }

  const sitemapLines = ['url\tstatus\tcanonical\trobots\tself_canonical\tnoindex'];
  let selfCount = 0;
  let noindexCount = 0;
  for (const loc of locs) {
    const path = new URL(loc).pathname.replace(/\/$/, '') || '/';
    const page = pages.get(path);
    const self = page?.canonical === expectedCanonical(loc);
    const hidden = (page?.robots ?? '').includes('noindex');
    if (self) selfCount += 1;
    if (hidden) noindexCount += 1;
    sitemapLines.push([loc, page?.status ?? 0, page?.canonical ?? '', page?.robots || '(none)', self ? 'yes' : 'NO', hidden ? 'NOINDEX' : 'index'].join('\t'));
  }
  sitemapLines.push('');
  sitemapLines.push(`sitemap_urls\t${locs.length}`);
  sitemapLines.push(`self_canonical\t${selfCount}\tof\t${locs.length}`);
  sitemapLines.push(`noindex_on_sitemap\t${noindexCount}`);
  writeFileSync(join(outDir, 'sitemap-crawl.txt'), `${sitemapLines.join('\n')}\n`);

  const inbound = new Map<string, string[]>();
  for (const path of noindexPaths) inbound.set(path, []);
  for (const [from, page] of pages) {
    if (page.status !== 200) continue;
    for (const link of anchors(page.html)) {
      if (inbound.has(link.path)) inbound.get(link.path)!.push(from);
    }
  }
  const inSitemap = noindexPaths.filter((path) => locs.some((loc) => new URL(loc).pathname.replace(/\/$/, '') === path || new URL(loc).pathname === path));
  const linked = [...inbound.entries()].filter(([, from]) => from.length > 0);
  const noindexLines = [
    `noindex_city_service_pages\t${noindexPaths.length}`,
    `absent_from_sitemap\t${noindexPaths.length - inSitemap.length}`,
    `with_inbound_links\t${linked.length}`,
    '',
    'path\tinbound',
    ...noindexPaths.map((path) => `${path}\t${(inbound.get(path) ?? []).join(',') || '0'}`),
  ];
  writeFileSync(join(outDir, 'noindex-inbound.txt'), `${noindexLines.join('\n')}\n`);

  const byText = new Map<string, Set<string>>();
  for (const [, page] of pages) {
    if (page.status !== 200) continue;
    for (const link of anchors(page.html)) {
      const set = byText.get(link.text) ?? new Set<string>();
      set.add(link.path);
      byText.set(link.text, set);
    }
  }
  const collisions = [...byText.entries()].filter(([, paths]) => paths.size > 1).sort((a, b) => a[0].localeCompare(b[0]));
  const designated = [
    ...SERVICES.map((service) => `${servicePlainAnchor(service.slug, service.name)}\thttps://boisehandyman.co/services/${service.slug}`),
    ...SERVICES.flatMap((service) =>
      CITIES.filter((city) => !isCityServiceNoindex(service.slug, city.slug)).map(
        (city) => `${serviceCityAnchor(service.slug, service.name, city.name)}\thttps://boisehandyman.co/services/${service.slug}/${city.slug}`,
      ),
    ),
    `${HOME_REPAIRS_ANCHOR}\thttps://boisehandyman.co/services/home-repairs`,
    `${RE10_LINK_ANCHOR}\thttps://boisehandyman.co/re-10-repairs-boise`,
  ];
  const designatedPairs = designated.map((line) => {
    const [text, url] = line.split('\t');
    return { text, path: new URL(url).pathname };
  });
  const designatedMisses = designatedPairs.filter(({ text, path }) => {
    const paths = byText.get(text);
    return !paths || paths.size !== 1 || !paths.has(path);
  });
  const anchorLines = [
    'designated_anchor\ttarget\tobserved',
    ...designatedPairs.map(({ text, path }) => {
      const observed = [...(byText.get(text) ?? [])].sort().join(' | ') || '(not linked)';
      return `${text}\thttps://boisehandyman.co${path === '/' ? '' : path}\t${observed}`;
    }),
    '',
    `designated_anchor_mismatches\t${designatedMisses.length}`,
    `exact_anchor_collisions\t${collisions.length}`,
    'Collisions below are identical visible labels that point at more than one URL.',
    'Service and city-service labels are listed in the designated map and are not in this set.',
    ...collisions.map(([text, paths]) => `${text}\t${[...paths].sort().join(' | ')}`),
  ];
  writeFileSync(join(outDir, 'anchor-map.txt'), `${anchorLines.join('\n')}\n`);

  console.log(`sitemap ${selfCount}/${locs.length} self canonical, noindex on sitemap ${noindexCount}`);
  console.log(`noindex city pages ${noindexPaths.length}, inbound ${linked.length}, in sitemap ${inSitemap.length}`);
  console.log(`exact anchor collisions ${collisions.length}`);
  if (selfCount !== locs.length || noindexCount !== 0 || linked.length !== 0 || inSitemap.length !== 0 || noindexPaths.length !== 46) {
    process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
