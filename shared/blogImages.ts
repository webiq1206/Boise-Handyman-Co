import {
  BLOG_IMAGE_REGISTRY,
  HUB_HERO_IMAGES,
  type BlogImageEntry,
} from './blogImageRegistry';
import { FEATURED_PROPERTY_IMAGES } from './galleryData';
import { SITE_IMAGES } from './siteImages';

const DEFAULT_BLOG_IMAGE = SITE_IMAGES.hero;

export function getBlogImageEntry(slug: string): BlogImageEntry | undefined {
  return BLOG_IMAGE_REGISTRY[slug];
}

export function getBlogImageForSlug(
  slug: string,
  variant: 'hero' | 'thumbnail' = 'hero',
  override?: string,
): string {
  if (override) return override;
  const entry = BLOG_IMAGE_REGISTRY[slug];
  if (!entry) return DEFAULT_BLOG_IMAGE;
  if (variant === 'thumbnail' && entry.thumbnail) return entry.thumbnail;
  return entry.hero;
}

export function getBlogImageAlt(slug: string): string {
  return BLOG_IMAGE_REGISTRY[slug]?.alt ?? 'Handyman repair work';
}

export function getBlogHeroImage(
  slug: string,
  override?: string,
): string {
  return getBlogImageForSlug(slug, 'hero', override);
}

export function getBlogThumbnail(
  slug: string,
  override?: string,
): string {
  return getBlogImageForSlug(slug, 'thumbnail', override);
}

export function getHubHeroImage(hubSlug: string): string {
  return HUB_HERO_IMAGES[hubSlug] ?? DEFAULT_BLOG_IMAGE;
}

/** True for cost guides, cost hub articles, and slug/topic-tagged cost content. */
export function isCostRelatedContent(slug: string, hubSlug?: string): boolean {
  if (hubSlug === 'home-building-costs') return true;
  const entry = BLOG_IMAGE_REGISTRY[slug];
  if (entry?.topicTags.includes('cost')) return true;
  return slug.includes('cost');
}

export function getAbsoluteImageUrl(path: string, baseUrl: string): string {
  if (path.startsWith('http://') || path.startsWith('https://')) return path;
  const base = baseUrl.replace(/\/$/, '');
  return `${base}${path.startsWith('/') ? path : `/${path}`}`;
}

export interface ArticleInlineFigurePlacement {
  afterSectionIndex: number;
  src: string;
  alt: string;
  caption?: string;
}

/**
 * Editorial inline figures for long articles - inserted after key H2 sections
 * to break up text-heavy content (Phase 4), especially on mobile.
 */
const INLINE_HUB_ALTS: Record<string, string> = {
  "repairs-and-fixes": "Handyman tools arranged in a ready-to-go tool bag",
  "installs-and-upgrades": "Handyman mounting work inside a home",
  "home-maintenance": "Caulking work at an interior joint",
  "costs-and-hiring": "Calculator, blank clipboard and tape measure for repair planning",
  "exterior-and-outdoor": "Gutter cleaning at a residential roof edge"
};

const INLINE_POOL: { src: string; alt: string; hubs?: string[] }[] = [
  {
    src: SITE_IMAGES.processInProgress,
    alt: "An open canvas tool bag with a drill, level, and tape measure on a drop cloth",
    hubs: ["repairs-and-fixes", "costs-and-hiring"],
  },
  {
    src: SITE_IMAGES.valueCraft,
    alt: "Hands fitting white baseboard trim with a hammer during a repair",
    hubs: ["repairs-and-fixes", "installs-and-upgrades"],
  },
  {
    src: SITE_IMAGES.consultBg,
    alt: "A freshly painted sage-green front door with white trim and black hardware",
    hubs: ["exterior-and-outdoor", "home-maintenance"],
  },
  {
    src: FEATURED_PROPERTY_IMAGES.boiseBungalowExterior,
    alt: "Boise craftsman bungalow porch with a sage-green front door and white trim",
    hubs: ["exterior-and-outdoor", "home-maintenance", "costs-and-hiring"],
  },
  {
    src: "/images/handyman/service-caulking.webp",
    alt: "A caulk gun laying a white bead where a bathtub meets subway tile",
    hubs: ["home-maintenance", "repairs-and-fixes"],
  },
  {
    src: "/images/handyman/cabinet-hardware-upgrade.webp",
    alt: "Hands installing a brushed-brass knob on a white cabinet door",
    hubs: ["installs-and-upgrades"],
  },
];

function altForSrc(src: string, hubSlug?: string): string {
  const fromRegistry = Object.values(BLOG_IMAGE_REGISTRY).find((image) => image.hero === src)?.alt;
  if (fromRegistry) return fromRegistry;
  const fromPool = INLINE_POOL.find((item) => item.src === src)?.alt;
  if (fromPool) return fromPool;
  if (hubSlug && INLINE_HUB_ALTS[hubSlug]) return INLINE_HUB_ALTS[hubSlug];
  return "Handyman repair work in a Treasure Valley home";
}

export function getArticleInlineFigures(
  slug: string,
  sectionCount: number,
  hubSlug?: string,
): ArticleInlineFigurePlacement[] {
  if (sectionCount < 4) return [];

  const entry = BLOG_IMAGE_REGISTRY[slug];
  const primarySrc = entry?.hero ?? DEFAULT_BLOG_IMAGE;
  const used = new Set<string>([primarySrc]);
  const figures: ArticleInlineFigurePlacement[] = [];

  const candidates = INLINE_POOL.filter((item) => {
    if (used.has(item.src)) return false;
    if (!hubSlug || !item.hubs) return true;
    return item.hubs.includes(hubSlug);
  });

  // Prefer hub-tagged photos first, then fill from the rest of the pool.
  const fallback = INLINE_POOL.filter((item) => !used.has(item.src) && !candidates.includes(item));
  const queue = [...candidates, ...fallback];

  if (hubSlug) {
    const hubHero = getHubHeroImage(hubSlug);
    if (hubHero !== primarySrc) {
      queue.unshift({
        src: hubHero,
        alt: altForSrc(hubHero, hubSlug),
        hubs: [hubSlug],
      });
    }
  }

  // Place figures after early and mid sections so phone scrollers get relief
  // between H2 blocks instead of a long text wall.
  const slots =
    sectionCount >= 8
      ? [1, Math.floor(sectionCount / 2), sectionCount - 3]
      : sectionCount >= 6
        ? [1, Math.floor(sectionCount / 2)]
        : [Math.floor(sectionCount / 2)];

  for (const afterSectionIndex of slots) {
    const next = queue.find((item) => !used.has(item.src));
    if (!next) break;
    used.add(next.src);
    figures.push({
      afterSectionIndex,
      src: next.src,
      alt: next.alt || altForSrc(next.src, hubSlug),
    });
  }

  return figures;
}
