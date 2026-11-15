// Content Data for Boise Handyman Co
// Service area: Boise, Meridian, Nampa, Eagle, Kuna, Caldwell, Star,
// plus Ada County and Canyon County. Other town pages stay published.

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

/**
 * Published town pages. Middleton and Garden City stay in this list so their
 * pages, city guides, and sitemap entries remain. They are not part of the
 * service-area lists below.
 */
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

/**
 * Google Business Profile service area. Owner decision, 15 November 2026:
 * these seven cities, in this order, plus Ada County and Canyon County.
 */
export const SERVICE_AREA_CITY_NAMES = [
  'Boise',
  'Meridian',
  'Nampa',
  'Eagle',
  'Kuna',
  'Caldwell',
  'Star',
] as const;

export const SERVICE_AREA_COUNTIES = ['Ada County', 'Canyon County'] as const;

export function formatNameList(names: readonly string[], conjunction = 'and'): string {
  if (names.length <= 1) return names[0] ?? '';
  if (names.length === 2) return `${names[0]} ${conjunction} ${names[1]}`;
  return `${names.slice(0, -1).join(', ')}, ${conjunction} ${names[names.length - 1]}`;
}

export const SERVICE_AREA_CITIES: CityData[] = SERVICE_AREA_CITY_NAMES.map((name) => {
  const city = CITIES.find((item) => item.name === name);
  if (!city) throw new Error(`Service area city ${name} has no published page`);
  return city;
});

/** "Boise, Meridian, Nampa, Eagle, Kuna, Caldwell, and Star" */
export const TREASURE_VALLEY_CITIES = formatNameList(SERVICE_AREA_CITY_NAMES);

/** Cities plus the two counties, for service-area sentences. */
export const SERVICE_AREA_LINE = `${TREASURE_VALLEY_CITIES}, plus ${formatNameList(SERVICE_AREA_COUNTIES)}`;

export function isServiceAreaCity(value: string): boolean {
  return (SERVICE_AREA_CITY_NAMES as readonly string[]).includes(value);
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
