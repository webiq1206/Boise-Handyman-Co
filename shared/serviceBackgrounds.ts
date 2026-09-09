import { SITE_IMAGES } from "./siteImages";

export interface ServiceBackgroundConfig {
  [key: string]: string;
}

/** AI-generated handyman photo library (2026-08). Swap for real job photos when available. */
const h = (name: string) => `/images/handyman/${name}.webp`;

const DEFAULT_BACKGROUND = h("hero-door-repair-branded-v2");

/**
 * Hero background per service, keyed by the handyman service slugs in
 * shared/contentData.ts. Each service leads with its own trade's photograph.
 */
export const SERVICE_BACKGROUNDS: ServiceBackgroundConfig = {
  "drywall-repair": h("service-drywall-repair"),
  "painting-touch-ups": h("service-painting"),
  "plumbing-repairs": h("service-plumbing"),
  "electrical-repairs": h("service-electrical"),
  "carpentry-trim-repair": h("service-carpentry-trim-branded-v2"),
  "mounting-assembly": h("service-mounting"),
  "fence-deck-gutter-repair": h("service-fence-repair"),
  "home-maintenance": h("service-caulking"),
};

export const DEFAULT_SERVICE_BACKGROUND = DEFAULT_BACKGROUND;

export function getServiceBackground(serviceSlug: string): string {
  return SERVICE_BACKGROUNDS[serviceSlug] || DEFAULT_SERVICE_BACKGROUND;
}

/**
 * A set of distinct images for a landing page: a hero, a full-bleed breather
 * band, and the split process panel. Consumers fall back to `hero` for any
 * slot that has no dedicated photo.
 */
export interface LandingImageSet {
  hero: string;
  breather: string;
  process: string;
}

/**
 * Three images per service, chosen so a visitor scrolling one page does not
 * see the same photograph three times: the trade shot leads, a complementary
 * detail breathes mid-page, and the process slot shows how a visit runs.
 */
const SERVICE_IMAGE_SETS: Record<string, LandingImageSet> = {
  "drywall-repair": {
    hero: h("service-drywall-repair"),
    breather: h("punch-list-markers"),
    process: SITE_IMAGES.processInProgress,
  },
  "painting-touch-ups": {
    hero: h("service-painting"),
    breather: h("front-door-repaint"),
    process: h("estimate-clipboard"),
  },
  "plumbing-repairs": {
    hero: h("service-plumbing"),
    breather: h("toilet-repair"),
    process: h("toolbag-ready"),
  },
  "electrical-repairs": {
    hero: h("service-electrical"),
    breather: h("repair-materials"),
    process: h("estimate-clipboard"),
  },
  "carpentry-trim-repair": {
    hero: h("service-carpentry-trim-branded-v2"),
    breather: h("door-hinge-fix"),
    process: h("toolbag-ready"),
  },
  "mounting-assembly": {
    hero: h("service-mounting"),
    breather: h("cabinet-hardware-upgrade"),
    process: h("estimate-clipboard"),
  },
  "fence-deck-gutter-repair": {
    hero: h("service-fence-repair"),
    breather: h("deck-board-replacement"),
    process: h("hero-gutter-cleaning"),
  },
  "home-maintenance": {
    hero: h("service-caulking"),
    breather: h("weatherstripping"),
    process: h("punch-list-markers"),
  },
};

export function getServiceImageSet(serviceSlug: string): LandingImageSet {
  return (
    SERVICE_IMAGE_SETS[serviceSlug] ?? {
      hero: DEFAULT_SERVICE_BACKGROUND,
      breather: h("toolbag-ready"),
      process: h("consult-doorstep-branded-v2"),
    }
  );
}
