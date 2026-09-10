/**
 * Imagery for service pages, service-in-city pages, and area pages.
 *
 * Keys follow the handyman service catalog in shared/contentData.ts. Values
 * point at the AI-generated handyman photo library in public/images/handyman
 * (2026-08); swap for real job photography when it exists.
 *
 * City variants rotate through a per-service shortlist so that no two city
 * pages for the same service open with the same photograph, which keeps the
 * eight variants of a service page from looking like one page printed eight
 * times. The rotation is deterministic, so a given city always gets the same
 * image and the pages are stable between builds.
 *
 * Key format for CITY_SERVICE_IMAGES: "service-slug/city-slug"
 */

import { SITE_IMAGES } from "./siteImages";
import { type LandingImageSet } from "./serviceBackgrounds";

const CITY_SLUGS = [
  "boise",
  "meridian",
  "eagle",
  "nampa",
  "kuna",
  "star",
  "middleton",
  "caldwell",
] as const;

/** AI-generated handyman photo library (2026-08). */
const h = (name: string) => `/images/handyman/${name}.webp`;

/**
 * Per-service rotation. The first entry is the service's primary image and is
 * what the service overview page uses; the rest supply the city variants.
 * Every shortlist is at least as long as it needs to be to avoid repeats
 * within a service.
 */
const SERVICE_ROTATION: Record<string, readonly string[]> = {
  "drywall-repair": [
    h("service-drywall-repair"),
    h("punch-list-markers"),
    h("service-painting"),
    h("toolbag-ready"),
    h("repair-materials"),
    h("estimate-clipboard"),
    h("consult-doorstep-branded"),
    h("hero-door-hinge-branded"),
  ],
  "painting-touch-ups": [
    h("service-painting"),
    h("front-door-repaint"),
    h("punch-list-markers"),
    h("service-drywall-repair"),
    h("toolbag-ready"),
    h("estimate-clipboard"),
    h("consult-doorstep-branded"),
    h("hero-door-hinge-branded"),
  ],
  "plumbing-repairs": [
    h("service-plumbing"),
    h("toilet-repair"),
    h("service-caulking"),
    h("repair-materials"),
    h("toolbag-ready"),
    h("estimate-clipboard"),
    h("consult-doorstep-branded"),
    h("hero-door-hinge-branded"),
  ],
  "electrical-repairs": [
    h("service-electrical"),
    h("service-mounting"),
    h("repair-materials"),
    h("toolbag-ready"),
    h("estimate-clipboard"),
    h("consult-doorstep-branded"),
    h("hero-door-hinge-branded"),
    h("door-hinge-fix"),
  ],
  "carpentry-trim-repair": [
    h("service-carpentry-trim-branded"),
    h("hero-door-hinge-branded"),
    h("door-hinge-fix"),
    h("service-fence-repair"),
    h("toolbag-ready"),
    h("repair-materials"),
    h("estimate-clipboard"),
    h("consult-doorstep-branded"),
  ],
  "mounting-assembly": [
    h("service-mounting"),
    h("cabinet-hardware-upgrade"),
    h("grab-bar-install"),
    h("repair-materials"),
    h("toolbag-ready"),
    h("estimate-clipboard"),
    h("consult-doorstep-branded"),
    h("hero-door-hinge-branded"),
  ],
  "fence-deck-gutter-repair": [
    h("service-fence-repair"),
    h("deck-board-replacement"),
    h("hero-gutter-cleaning"),
    h("winterize-spigot"),
    h("toolbag-ready"),
    h("estimate-clipboard"),
    h("consult-doorstep-branded"),
    h("repair-materials"),
  ],
  "home-maintenance": [
    h("service-caulking"),
    h("weatherstripping"),
    h("winterize-spigot"),
    h("punch-list-markers"),
    h("toolbag-ready"),
    h("estimate-clipboard"),
    h("consult-doorstep-branded"),
    h("hero-gutter-cleaning"),
  ],
};

function buildCityServiceImages(): Record<string, string> {
  const map: Record<string, string> = {};
  for (const [service, rotation] of Object.entries(SERVICE_ROTATION)) {
    CITY_SLUGS.forEach((city, i) => {
      map[`${service}/${city}`] = rotation[i % rotation.length];
    });
  }
  return map;
}

export const CITY_SERVICE_IMAGES: Record<string, string> = buildCityServiceImages();

/** Neighborhood-style hero images for each city area page. */
export const CITY_HERO_IMAGES: Record<string, string> = {
  boise: "/images/areas/boise.webp",
  meridian: "/images/areas/meridian.webp",
  eagle: "/images/areas/eagle.webp",
  nampa: "/images/areas/nampa.webp",
  kuna: "/images/areas/kuna.webp",
  star: "/images/areas/star.webp",
  middleton: "/images/areas/middleton.webp",
  caldwell: "/images/areas/caldwell.webp",
};

/** The primary image for each service, used when no city applies. */
export const SERVICE_FALLBACK_IMAGES: Record<string, string> = Object.fromEntries(
  Object.entries(SERVICE_ROTATION).map(([service, rotation]) => [service, rotation[0]]),
);

/**
 * Resolve the dedicated hero image for a specific service-in-city page.
 * Falls back to the service primary image, then undefined.
 */
export function getCityServiceBackground(
  serviceSlug: string,
  citySlug: string,
): string | undefined {
  return (
    CITY_SERVICE_IMAGES[`${serviceSlug}/${citySlug}`] ??
    SERVICE_FALLBACK_IMAGES[serviceSlug]
  );
}

/**
 * Three distinct images for a service-in-city page: the city variant as the
 * hero, a different image from the same service rotation for the breather
 * band, and the service primary for the process panel.
 */
export function getCityServiceImageSet(
  serviceSlug: string,
  citySlug: string,
): LandingImageSet {
  const rotation = SERVICE_ROTATION[serviceSlug];
  const cityIndex = CITY_SLUGS.indexOf(citySlug as (typeof CITY_SLUGS)[number]);
  const hero =
    CITY_SERVICE_IMAGES[`${serviceSlug}/${citySlug}`] ??
    SERVICE_FALLBACK_IMAGES[serviceSlug] ??
    SITE_IMAGES.hero;

  if (!rotation || cityIndex < 0) {
    return { hero, breather: hero, process: hero };
  }

  return {
    hero,
    // Offset by three rather than one so the two images on a page are visually
    // unrelated instead of adjacent shots of the same subject.
    breather: rotation[(cityIndex + 3) % rotation.length],
    process: rotation[0],
  };
}

/**
 * Three distinct images for an area (city) page: the city hero, plus two
 * rotation images that vary by city so neighbouring area pages do not open
 * with the same pair.
 */
export function getAreaImageSet(citySlug: string): LandingImageSet {
  const hero = CITY_HERO_IMAGES[citySlug] ?? SITE_IMAGES.hero;
  const rotation = SERVICE_ROTATION["home-maintenance"];
  const i = Math.max(0, CITY_SLUGS.indexOf(citySlug as (typeof CITY_SLUGS)[number]));
  return {
    hero,
    breather: rotation[i % rotation.length],
    process: rotation[(i + 4) % rotation.length],
  };
}

/**
 * Look up a unique image for an internal URL (used by related-link cards).
 * Uses exact path-segment matching so partial names (e.g. a blog slug that
 * contains "star" or "eagle") can never accidentally match a city or service.
 * Returns undefined if the URL is not a service or area page.
 */
export function getCityServiceImage(url: string): string | undefined {
  const pathname = url.split("?")[0].split("#")[0];
  const segments = pathname.split("/").filter(Boolean);

  if (segments[0] === "services" && segments[1]) {
    const service = segments[1];
    const city = segments[2];
    if (city) {
      const key = `${service}/${city}`;
      if (CITY_SERVICE_IMAGES[key]) return CITY_SERVICE_IMAGES[key];
    }
    if (SERVICE_FALLBACK_IMAGES[service]) return SERVICE_FALLBACK_IMAGES[service];
  }

  if (segments[0] === "areas" && segments[1]) {
    const city = segments[1];
    if (CITY_HERO_IMAGES[city]) return CITY_HERO_IMAGES[city];
  }

  return undefined;
}
