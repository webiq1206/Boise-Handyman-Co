export interface GalleryProject {
  serviceType: string;
  city: string;
  beforeImageUrl: string;
  afterImageUrl: string;
  title: string;
  description: string;
}

const g = (name: string) => `/images/gallery/${name}.webp`;

/**
 * Generated comparison assets for handyman-scope illustrations.
 *
 * These pairs are generated design photography for scroll rhythm and service
 * illustration. They are not completed customer projects and stay in the
 * unpublished dataset, outside project-proof consumers.
 *
 * Continuity: each pair shares one camera lock. The Boise painting and drywall
 * pairs were made as one house. `FEATURED_PROPERTY_IMAGES.boiseBungalowExterior`
 * is no longer that house: its photo was replaced on 13 November 2026.
 */
export const UNPUBLISHED_GALLERY_CONCEPTS: GalleryProject[] = [
  {
    serviceType: "painting-touch-ups",
    city: "boise",
    beforeImageUrl: g("gallery-painting-boise-before"),
    afterImageUrl: g("gallery-painting-boise-after"),
    title: "Front Door Paint Refresh",
    description:
      "Exterior door paint, trim and hardware. Final color and prep are tailored to your door.",
  },
  {
    serviceType: "drywall-repair",
    city: "boise",
    beforeImageUrl: g("gallery-drywall-boise-before"),
    afterImageUrl: g("gallery-drywall-boise-after"),
    title: "Hallway Drywall Patch",
    description:
      "Drywall patching, surface preparation and paint matching.",
  },
  {
    serviceType: "carpentry-trim-repair",
    city: "eagle",
    beforeImageUrl: g("gallery-carpentry-eagle-before"),
    afterImageUrl: g("gallery-carpentry-eagle-after"),
    title: "Sticking Interior Door",
    description:
      "Interior door alignment and hinge adjustments.",
  },
  {
    serviceType: "fence-deck-gutter-repair",
    city: "meridian",
    beforeImageUrl: g("gallery-fence-meridian-before"),
    afterImageUrl: g("gallery-fence-meridian-after"),
    title: "Cedar Fence Picket Repair",
    description:
      "Cedar fence pickets and rails.",
  },
  {
    serviceType: "mounting-assembly",
    city: "nampa",
    beforeImageUrl: g("gallery-mounting-nampa-before"),
    afterImageUrl: g("gallery-mounting-nampa-after"),
    title: "Living Room TV Mount",
    description:
      "TV bracket placement and mounting.",
  },
  {
    serviceType: "plumbing-repairs",
    city: "caldwell",
    beforeImageUrl: g("gallery-plumbing-caldwell-before"),
    afterImageUrl: g("gallery-plumbing-caldwell-after"),
    title: "Kitchen Faucet Swap",
    description:
      "Kitchen faucets and fixture connections.",
  },
  {
    serviceType: "electrical-repairs",
    city: "kuna",
    beforeImageUrl: g("gallery-electrical-kuna-before"),
    afterImageUrl: g("gallery-electrical-kuna-after"),
    title: "Outlet Replacement",
    description:
      "Receptacles and cover plates.",
  },
  {
    serviceType: "home-maintenance",
    city: "star",
    beforeImageUrl: g("gallery-maintenance-star-before"),
    afterImageUrl: g("gallery-maintenance-star-after"),
    title: "Door Weatherstripping",
    description:
      "Exterior door jambs and weatherstripping.",
  },
];

/** Generated comparison assets are retained for provenance, not published as work. */
export const GALLERY_PROJECTS: GalleryProject[] = [];

/**
 * Standalone service imagery remains available outside project-proof contexts.
 *
 * The key and file name are historical. Since 13 November 2026 the photo is a
 * single-story ranch home with gray-green siding and a wood front door, so
 * describe it that way in alt text, never as a bungalow or a porch.
 */
export const FEATURED_PROPERTY_IMAGES = {
  boiseBungalowExterior: g("gallery-boise-bungalow-exterior"),
} as const;

/**
 * Return gallery projects that match a specific service + city, used to embed
 * local proof on city x service landing pages.
 */
export function getGalleryProjectsFor(
  serviceSlug: string,
  citySlug: string,
): GalleryProject[] {
  return GALLERY_PROJECTS.filter(
    (p) => p.serviceType === serviceSlug && p.city === citySlug,
  );
}

/** Return all gallery projects for a city (any service). Used on area pages. */
export function getGalleryProjectsForCity(citySlug: string): GalleryProject[] {
  return GALLERY_PROJECTS.filter((p) => p.city === citySlug);
}

/**
 * Primary gallery project for a service hub page. Service slugs and
 * `serviceType` values match directly.
 */
export function getFeaturedGalleryProject(serviceSlug: string): GalleryProject | undefined {
  return GALLERY_PROJECTS.find((p) => p.serviceType === serviceSlug);
}
