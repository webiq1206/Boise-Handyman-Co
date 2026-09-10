/**
 * Imagery for service pages, service-in-city pages, and area pages.
 *
 * Keys follow the handyman service catalog in shared/contentData.ts. Values
 * point at the AI-generated handyman photo library in public/images/handyman
 * (2026-08); swap for real job photography when it exists.
 *
 * City variants use a trade-specific shortlist. Relevant representative
 * images may repeat across cities; unrelated work must never fill a slot.
 * The rotation is deterministic between builds.
 *
 * Key format for CITY_SERVICE_IMAGES: "service-slug/city-slug"
 */

import { SITE_IMAGES } from "./siteImages";
import { getServiceImageSet, type LandingImageSet } from "./serviceBackgrounds";

const CITY_SLUGS = [
  "boise",
  "meridian",
  "eagle",
  "nampa",
  "kuna",
  "star",
  "middleton",
  "caldwell",
  "garden-city",
] as const;

/** AI-generated handyman photo library (2026-08). */
const h = (name: string) => `/images/handyman/${name}.webp`;

/**
 * Per-service rotation. The first entry is the service's primary image and is
 * what the service overview page uses; the rest supply the city variants.
 * Reuse within a service is intentional when only one suitable trade image exists.
 */
const SERVICE_ROTATION: Record<string, readonly string[]> = {
  "drywall-repair": [
    h("service-drywall-repair"),
    h("punch-list-markers"),
  ],
  "painting-touch-ups": [
    h("service-painting-p5-reviewed-20260910"),
    h("front-door-repaint-p5-reviewed-20260910"),
  ],
  "plumbing-repairs": [
    h("service-plumbing"),
    h("toilet-repair"),
  ],
  "electrical-repairs": [
    h("service-electrical"),
  ],
  "carpentry-trim-repair": [
    h("service-carpentry-trim-branded"),
    h("hero-door-hinge-branded"),
    h("door-hinge-fix"),
  ],
  "mounting-assembly": [
    h("service-mounting"),
    h("grab-bar-install"),
    h("cabinet-hardware-upgrade"),
  ],
  "fence-deck-gutter-repair": [
    h("service-fence-repair"),
    h("deck-board-replacement"),
    h("hero-gutter-cleaning"),
  ],
  "home-maintenance": [
    h("service-caulking"),
    h("weatherstripping"),
    h("winterize-spigot"),
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
 * A relevant service hero, a complementary detail, and a quote-planning
 * image for the process panel. These do not represent one customer project.
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
    // Keep the visible work within this trade. Related city pages may share
    // a suitable representative photo when a distinct job image is unavailable.
    breather: rotation.length > 1
      ? rotation[(cityIndex + 1) % rotation.length]
      : getServiceImageSet(serviceSlug).breather,
    process: rotation.find(src => src !== hero && src !== rotation[(cityIndex + 1) % rotation.length])
      ?? getServiceImageSet(serviceSlug).process,
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
