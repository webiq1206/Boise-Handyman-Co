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
 * Representative design imagery for handyman-scope visits.
 *
 * These pairs are generated design photography for scroll rhythm and service
 * illustration. They are not completed customer projects. Copy below states
 * that plainly so pages never present them as job proof.
 *
 * Continuity: each pair shares one camera lock. The Boise painting and drywall
 * pairs belong to the same craftsman bungalow (see also
 * `FEATURED_PROPERTY_IMAGES.boiseBungalowExterior`).
 */
export const GALLERY_PROJECTS: GalleryProject[] = [
  {
    serviceType: "painting-touch-ups",
    city: "boise",
    beforeImageUrl: g("gallery-painting-boise-before"),
    afterImageUrl: g("gallery-painting-boise-after"),
    title: "Front Door Paint Refresh",
    description:
      "Representative design imagery for a Boise craftsman porch door. Drag to compare weathered finish with a fresh sage cut-in. Final color and prep are tailored to your door.",
  },
  {
    serviceType: "drywall-repair",
    city: "boise",
    beforeImageUrl: g("gallery-drywall-boise-before"),
    afterImageUrl: g("gallery-drywall-boise-after"),
    title: "Hallway Drywall Patch",
    description:
      "Representative design imagery inside the same Boise bungalow hallway. Drag to compare an open wall scar with a smooth paint-ready patch.",
  },
  {
    serviceType: "carpentry-trim-repair",
    city: "eagle",
    beforeImageUrl: g("gallery-carpentry-eagle-before"),
    afterImageUrl: g("gallery-carpentry-eagle-after"),
    title: "Sticking Interior Door",
    description:
      "Representative design imagery for an Eagle foothills foyer door that binds in the jamb. Drag to compare the sticking door with a plumb, freely closing swing.",
  },
  {
    serviceType: "fence-deck-gutter-repair",
    city: "meridian",
    beforeImageUrl: g("gallery-fence-meridian-before"),
    afterImageUrl: g("gallery-fence-meridian-after"),
    title: "Cedar Fence Picket Repair",
    description:
      "Representative design imagery for a Meridian side-yard cedar fence. Drag to compare missing pickets with a flush repaired run.",
  },
  {
    serviceType: "mounting-assembly",
    city: "nampa",
    beforeImageUrl: g("gallery-mounting-nampa-before"),
    afterImageUrl: g("gallery-mounting-nampa-after"),
    title: "Living Room TV Mount",
    description:
      "Representative design imagery for a Nampa ranch living room. Drag to compare a blank marked wall with a level flat-screen mount.",
  },
  {
    serviceType: "plumbing-repairs",
    city: "caldwell",
    beforeImageUrl: g("gallery-plumbing-caldwell-before"),
    afterImageUrl: g("gallery-plumbing-caldwell-after"),
    title: "Kitchen Faucet Swap",
    description:
      "Representative design imagery for a Caldwell kitchen sink. Drag to compare a worn builder faucet with a clean brushed-nickel install.",
  },
  {
    serviceType: "electrical-repairs",
    city: "kuna",
    beforeImageUrl: g("gallery-electrical-kuna-before"),
    afterImageUrl: g("gallery-electrical-kuna-after"),
    title: "Outlet Replacement",
    description:
      "Representative design imagery for a Kuna laundry-room outlet. Drag to compare a yellowed askew receptacle with a level new cover plate.",
  },
  {
    serviceType: "home-maintenance",
    city: "star",
    beforeImageUrl: g("gallery-maintenance-star-before"),
    afterImageUrl: g("gallery-maintenance-star-after"),
    title: "Door Weatherstripping",
    description:
      "Representative design imagery for a Star exterior door jamb. Drag to compare a daylight draft gap with a sealed weatherstrip.",
  },
];

/** Establishing shots that keep featured property sets visually linked. */
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
