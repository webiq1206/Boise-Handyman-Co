// Content Data for Boise Handyman Co
// Serves the Treasure Valley: Boise, Meridian, Eagle, Nampa, Kuna, Star, Middleton

export interface ServiceData {
  slug: string;
  name: string;
  shortDescription: string;
  // No planningFrom: each job is priced case by case after we review the
  // scope (owner decision D6, 8 November 2026). Do not reintroduce a public
  // starting price here.
  /**
   * Secondary services expand keyword coverage. They get full service + city
   * pages, nav, and sitemap entries, but are kept off the homepage grid so the
   * primary five stay front-and-center. Shown in full on /services.
   */
  secondary?: boolean;
}

/**
 * Sentence-case form of a catalog service name, for headings and menu labels
 * (owner decision C, 1 November 2026): the same words with only the letter
 * case changed, acronyms such as "TV" kept. `name` itself stays as it is,
 * because it is also a lookup key (estimator categories, metadata and
 * description maps) and the value carried to leads and schema.
 */
export function serviceHeading(name: string): string {
  return name
    .split(' ')
    .map((word, i) => (i === 0 || /^[A-Z0-9-]{2,}$/.test(word) ? word : word.toLowerCase()))
    .join(' ');
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
 */
export const SERVICES: ServiceData[] = [
  {
    slug: 'drywall-repair',
    name: 'Drywall Repair & Patching',
    shortDescription: 'Holes, cracks, water-stained patches, and popcorn-ceiling repairs finished and blended to match.',
  },
  {
    slug: 'painting-touch-ups',
    name: 'Interior & Exterior Painting',
    shortDescription: 'Room refreshes, trim and door repaints, and exterior touch-ups with proper prep and clean lines.',
  },
  {
    slug: 'plumbing-repairs',
    name: 'Minor Plumbing Repairs',
    shortDescription: 'Faucets, toilets, garbage disposals, supply lines, and slow drains reviewed for repair or replacement.',
  },
  {
    slug: 'electrical-repairs',
    name: 'Minor Electrical Repairs',
    shortDescription: 'Outlets, switches, light fixtures, and ceiling fans replaced or repaired safely and to code.',
  },
  {
    slug: 'carpentry-trim-repair',
    name: 'Carpentry & Trim Repair',
    shortDescription: 'Doors that stick, damaged trim and baseboard, stair rails, and small carpentry fixes done cleanly.',
  },
  {
    slug: 'mounting-assembly',
    name: 'Mounting & Assembly',
    shortDescription: 'TVs, shelves, mirrors, and curtain rods mounted level and anchored right; furniture assembled fast.',
    secondary: true,
  },
  {
    slug: 'fence-deck-gutter-repair',
    name: 'Fence, Deck & Gutter Repair',
    shortDescription: 'Leaning fence panels, loose deck boards and rails, gutter cleaning, and minor exterior repairs.',
    secondary: true,
  },
  {
    slug: 'home-maintenance',
    name: 'Caulking & Home Maintenance',
    shortDescription: 'Caulking and weatherproofing, tile and grout touch-ups, and punch-list work planned around your repair list.',
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
  { slug: 'garden-city', name: 'Garden City', county: 'ada', isPrimary: false },
  { slug: 'caldwell', name: 'Caldwell', county: 'canyon', isPrimary: false },
];

export const SERVICE_AREA_CITY_NAMES = CITIES.map((c) => c.name);
export const TREASURE_VALLEY_CITIES = CITIES.map((c) => c.name).join(', ');

export function isServiceAreaCity(value: string): boolean {
  return SERVICE_AREA_CITY_NAMES.includes(value);
}

export function getServiceBySlug(slug: string): ServiceData | undefined {
  return SERVICES.find((s) => s.slug === slug);
}

export function getCityBySlug(slug: string): CityData | undefined {
  return CITIES.find((c) => c.slug === slug);
}

export function getCountyLabel(county: CityData['county']): string {
  return county === 'ada' ? 'Ada County' : 'Canyon County';
}
