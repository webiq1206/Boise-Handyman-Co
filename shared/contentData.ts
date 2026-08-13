// Content Data for Boise Handyman Co
// Serves the Treasure Valley: Boise, Meridian, Eagle, Nampa, Kuna, Star, Middleton

export interface ServiceData {
  slug: string;
  name: string;
  shortDescription: string;
  /**
   * Planning starting point (a floor, not a bid or a wide range). Rendered as
   * "From $X" to give price context without committing to a spread - the real
   * number comes from the estimator + on-site look. Floors derive from the
   * estimate engine's placeholder model ($49 trip fee + $95/hr, one-hour
   * minimum = $144 first visit). PLACEHOLDER figures:
   * [NEEDS: real pricing confirmation] before launch.
   */
  planningFrom: string;
  /**
   * Secondary services expand keyword coverage. They get full service + city
   * pages, nav, and sitemap entries, but are kept off the homepage grid so the
   * primary five stay front-and-center. Shown in full on /services.
   */
  secondary?: boolean;
}

export interface CityData {
  slug: string;
  name: string;
  county: 'ada' | 'canyon';
  isPrimary: boolean;
}

/**
 * Each service maps to a distinct buyer intent rather than a keyword variation,
 * so the service and service+city pages do not compete with each other. Generic
 * "handyman {city}" intent is carried by the location pages, which is why there
 * is no separate generic handyman-services page.
 *
 * planningFrom figures are per-visit starting points for a small job of that
 * type in the Treasure Valley. They are deliberately conservative placeholders
 * pending real pricing: [NEEDS: real pricing confirmation].
 */
export const SERVICES: ServiceData[] = [
  {
    slug: 'drywall-repair',
    name: 'Drywall Repair & Patching',
    shortDescription: 'Holes, cracks, water-stained patches, and popcorn-ceiling repairs finished and blended to match.',
    planningFrom: '$149',
  },
  {
    slug: 'painting-touch-ups',
    name: 'Interior & Exterior Painting',
    shortDescription: 'Room refreshes, trim and door repaints, and exterior touch-ups with proper prep and clean lines.',
    planningFrom: '$199',
  },
  {
    slug: 'plumbing-repairs',
    name: 'Minor Plumbing Repairs',
    shortDescription: 'Faucets, toilets, garbage disposals, supply lines, and slow drains fixed or swapped in a single visit.',
    planningFrom: '$145',
  },
  {
    slug: 'electrical-repairs',
    name: 'Minor Electrical Repairs',
    shortDescription: 'Outlets, switches, light fixtures, and ceiling fans replaced or repaired safely and to code.',
    planningFrom: '$145',
  },
  {
    slug: 'carpentry-trim-repair',
    name: 'Carpentry & Trim Repair',
    shortDescription: 'Doors that stick, damaged trim and baseboard, stair rails, and small carpentry fixes done cleanly.',
    planningFrom: '$149',
  },
  {
    slug: 'mounting-assembly',
    name: 'Mounting & Assembly',
    shortDescription: 'TVs, shelves, mirrors, and curtain rods mounted level and anchored right; furniture assembled fast.',
    planningFrom: '$145',
    secondary: true,
  },
  {
    slug: 'fence-deck-gutter-repair',
    name: 'Fence, Deck & Gutter Repair',
    shortDescription: 'Leaning fence panels, loose deck boards and rails, gutter cleaning, and minor exterior repairs.',
    planningFrom: '$149',
    secondary: true,
  },
  {
    slug: 'home-maintenance',
    name: 'Caulking & Home Maintenance',
    shortDescription: 'Caulking and weatherproofing, tile and grout touch-ups, and punch-list work knocked out in one trip.',
    planningFrom: '$145',
    secondary: true,
  },
];

// Alias so existing imports stay compatible
export const PRIORITY_SERVICES = SERVICES;

export const CITIES: CityData[] = [
  { slug: 'boise', name: 'Boise', county: 'ada', isPrimary: true },
  { slug: 'meridian', name: 'Meridian', county: 'ada', isPrimary: false },
  { slug: 'eagle', name: 'Eagle', county: 'ada', isPrimary: false },
  { slug: 'nampa', name: 'Nampa', county: 'canyon', isPrimary: false },
  { slug: 'kuna', name: 'Kuna', county: 'ada', isPrimary: false },
  { slug: 'star', name: 'Star', county: 'ada', isPrimary: false },
  { slug: 'middleton', name: 'Middleton', county: 'canyon', isPrimary: false },
  { slug: 'caldwell', name: 'Caldwell', county: 'canyon', isPrimary: false },
];

export const TREASURE_VALLEY_CITIES = CITIES.map((c) => c.name).join(', ');

export function getServiceBySlug(slug: string): ServiceData | undefined {
  return SERVICES.find((s) => s.slug === slug);
}

export function getCityBySlug(slug: string): CityData | undefined {
  return CITIES.find((c) => c.slug === slug);
}

export function getCountyLabel(county: CityData['county']): string {
  return county === 'ada' ? 'Ada County' : 'Canyon County';
}
