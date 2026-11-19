/**
 * The "Guides and planning" list under Keep exploring: which links it holds
 * and which thumbnail each one shows.
 *
 * A thumbnail is part of the same no-repeat set as the page's own photographs
 * and the cards above the list (owner, 19 November 2026). A link asks for the
 * photograph of the page it opens. When the page or a card already shows that
 * one, the link takes the next free general picture (tools and paperwork, no
 * trade's work), described as what it shows and not as the guide's subject.
 * When none is free the row has no thumbnail. A row never shows one trade's
 * work under another subject.
 */
import { getManifestLinks } from '../lib/internal-links';
import { getBlogHeroImage } from './blogImages';
import { getCityServiceImage } from './cityServiceImages';
import { SITE_IMAGES } from './siteImages';

const h = (name: string) => `/images/handyman/${name}.webp`;

/** General pictures a row may fall back to: tools, paperwork and a front door, no trade's finished work. */
export const READING_FALLBACK_IMAGES: readonly string[] = [
  h('estimate-clipboard'),
  h('repair-materials'),
  h('toolbag-ready'),
  h('consult-doorstep-branded'),
  h('permit-paperwork'),
  h('front-porch-door'),
];

/** The photograph that belongs to the page a link opens. */
export function pageImage(href: string): string | undefined {
  const [section, slug] = href.split('/').filter(Boolean);
  if ((section === 'blog' || section === 'guides') && slug) return getBlogHeroImage(slug);
  if (section === 'services' && slug) return getCityServiceImage(href);
  if (section === 'services') return SITE_IMAGES.hero;
  if (section === 'areas' && slug) return getCityServiceImage(href);
  if (section === 'resources') return h('estimate-clipboard');
  if (section === 'estimate') return h('repair-materials');
  return undefined;
}

export const MAX_READING = 6;

/**
 * The hiring guide, the services index, the worksheets, the estimator and the
 * page's related pages, each once. The guide points at its canonical slug, not
 * the legacy one, so no internal link is spent on a redirect hop.
 */
export function readingLinks(manifestPath: string | undefined, taken: Set<string>, readingOnly: boolean) {
  const fixed = [
    { href: '/guides/hire-a-handyman-treasure-valley', label: 'Hiring a handyman in the Treasure Valley' },
    { href: '/services', label: 'Explore repair and installation services' },
    { href: '/resources', label: 'Free home maintenance planning worksheets' },
    { href: '/estimate', label: 'Estimate your repair cost' },
  ];
  // Beside cards of places and services, the list holds guides and articles only.
  const related = (manifestPath ? getManifestLinks(manifestPath) : [])
    .filter((link) => !readingOnly || !/^\/(services|areas)\//.test(link.url))
    .map((link) => ({ href: link.url, label: link.anchor }));
  const out: { href: string; label: string }[] = [];
  for (const link of [...fixed, ...related]) {
    if (taken.has(link.href)) continue;
    taken.add(link.href);
    out.push(link);
    if (out.length === MAX_READING) break;
  }
  return out;
}

export interface ReadingPick {
  src?: string;
  /** True when the picture is the linked page's own photograph. */
  own: boolean;
}

/**
 * One thumbnail per link, none already in `shown`. `shown` is shared with the
 * page and the cards and is updated here.
 */
export function pickReadingImages(links: readonly { href: string }[], shown: Set<string>): ReadingPick[] {
  // A page's own photograph goes to that page's row first, so a fallback
  // handed to an earlier row never takes a later row's own picture.
  const wanted = links.map((link) => pageImage(link.href));
  const reserved = new Set<string>();
  const own = wanted.map((src) => {
    if (!src || shown.has(src) || reserved.has(src)) return false;
    reserved.add(src);
    return true;
  });
  reserved.forEach((src) => shown.add(src));
  return links.map((_, i) => {
    if (own[i]) return { src: wanted[i], own: true };
    const src = READING_FALLBACK_IMAGES.find((candidate) => !shown.has(candidate));
    if (!src) return { own: false };
    shown.add(src);
    return { src, own: false };
  });
}
