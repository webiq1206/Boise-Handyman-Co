/**
 * SEO Utilities for Boise Handyman Co
 * Generates optimized meta tags, titles, and descriptions
 * for service and location pages
 */

import { publishedFoundingYear } from '@/shared/foundingYear';
import { SITE_CONFIG } from '@/shared/siteConfig';
import { GBP_SOCIAL, getExternalProfileUrls } from '@/shared/gbpProfile';
import { SHOW_TRUST_CLAIMS } from '@/shared/trustClaims';

export { SHOW_TRUST_CLAIMS };

interface SEOMetaData {
  title: string;
  description: string;
  canonical?: string;
  ogTitle?: string;
  ogDescription?: string;
  ogImage?: string;
  twitterCard?: string;
}

interface ServiceSEOParams {
  serviceName: string;
  serviceSlug: string;
  city?: string;
  citySlug?: string;
  isHomePage?: boolean;
}

/**
 * Intelligently truncate service name while keeping key words
 * Works on whole words to avoid breaking legitimate terms
 */
function truncateServiceName(serviceName: string, maxLength: number): string {
  if (serviceName.length <= maxLength) return serviceName;
  
  // Split into words
  const words = serviceName.split(' ');
  
  // Remove low-value filler words first (whole word removal only)
  const fillerWords = ['&', 'and', 'or', 'the', 'of', 'for', 'with', 'in', 'a', 'an'];
  let importantWords = words.filter(word => !fillerWords.includes(word.toLowerCase()));
  
  // Rebuild and check length
  let shortened = importantWords.join(' ');
  if (shortened.length <= maxLength) return shortened;
  
  // If still too long, remove words from end until it fits
  while (importantWords.length > 1 && shortened.length > maxLength) {
    importantWords.pop();
    shortened = importantWords.join(' ');
  }
  
  // If single word is too long, truncate it cleanly
  if (shortened.length > maxLength) {
    return shortened.substring(0, maxLength);
  }
  
  return shortened;
}

/** Brand suffix used in title budgeting; read from config so it stays in sync. */
const BRAND = SITE_CONFIG.name;

/**
 * Generate SEO-optimized page title
 * Format: "[Service] in [City], ID | Boise Handyman Co | Free Quotes"
 * Max 60 characters for optimal Google display
 * GUARANTEED ≤60 chars through intelligent truncation
 */
export function generatePageTitle(params: ServiceSEOParams): string {
  const { serviceName, city, isHomePage } = params;

  if (isHomePage) {
    return `${BRAND} | Handyman Services`;
  }

  if (city && serviceName) {
    // Full formula: "[Service] in [City], ID | Boise Handyman Co | Free Quotes"
    const fullTitle = `${serviceName} in ${city}, ID | ${BRAND} | Free Quotes`;

    if (fullTitle.length <= 60) {
      return fullTitle;
    }

    // Level 2: Drop "Free Quotes"
    const mediumTitle = `${serviceName} in ${city}, ID | ${BRAND}`;
    if (mediumTitle.length <= 60) {
      return mediumTitle;
    }

    // Level 3: Shorten brand
    const shortTitle = `${serviceName} in ${city}, ID | Handyman`;
    if (shortTitle.length <= 60) {
      return shortTitle;
    }

    const maxServiceLength = 60 - ` in ${city}, ID | Handyman`.length;
    const truncatedService = truncateServiceName(serviceName, maxServiceLength);
    return `${truncatedService} in ${city}, ID | Handyman`;
  }

  if (city) {
    const fullTitle = `Handyman in ${city}, ID | ${BRAND}`;
    if (fullTitle.length <= 60) {
      return fullTitle;
    }
    return `Handyman in ${city}, ID`;
  }

  // Service-only title
  if (!serviceName) {
    return `${BRAND} | Handyman Services`;
  }

  const fullTitle = `${serviceName} | ${BRAND} | Free Quotes`;
  if (fullTitle.length <= 60) {
    return fullTitle;
  }

  const mediumTitle = `${serviceName} | ${BRAND}`;
  if (mediumTitle.length <= 60) {
    return mediumTitle;
  }

  // Truncate service name intelligently
  const maxServiceLength = 60 - ` | ${BRAND}`.length;
  const truncatedService = truncateServiceName(serviceName, maxServiceLength);
  return `${truncatedService} | ${BRAND}`;
}

/**
 * Meta descriptions for the generated pages (home fallback, 8 service pages,
 * 9 area pages and every service x city page).
 *
 * Rules, enforced by tests/generated-descriptions.test.ts and by
 * verify:metadata-fit on every rendered page:
 * - keyword first: the description opens with the page's search term
 * - 140 to 155 characters, so it fills the snippet and ships uncut
 * - no phone number and no exclamation mark (the phone sits on the page,
 *   next to the actions, not in the search snippet)
 * Facts come from the service, area and guide copy already on the site.
 */
export const DESCRIPTION_MIN = 140;
export const DESCRIPTION_MAX = 155;

const HOME_DESCRIPTION =
  'Boise handyman for small repairs, installs and home maintenance across the Treasure Valley. One written quote before work starts. Send your list today.';

const GENERIC_DESCRIPTION =
  'Handyman services in Boise and the Treasure Valley: small repairs, installs and home maintenance, with one written quote before any work starts.';

/** Keyed by service slug (shared/contentData.ts). */
const SERVICE_DESCRIPTIONS: Record<string, string> = {
  'drywall-repair':
    'Drywall repair in Boise and the Treasure Valley: holes, stress cracks, water stains and texture patches, primed and blended. Send photos for a quote.',
  'painting-touch-ups':
    'Paint touch-ups in Boise and the Treasure Valley: room refreshes, trim and door repaints and exterior spot work with real prep. Send photos for a quote.',
  'plumbing-repairs':
    'Minor plumbing repairs in Boise and the Treasure Valley: dripping faucets, running toilets, disposals and slow drains. Send photos for one written quote.',
  'electrical-repairs':
    'Minor electrical repairs in Boise and the Treasure Valley: outlets, switches, fixtures and ceiling fans on existing circuits. Send photos for a quote.',
  'carpentry-trim-repair':
    'Carpentry and trim repair in Boise and the Treasure Valley: sticking doors, split casing, loose baseboard and stair rails. Send photos for a written quote.',
  'mounting-assembly':
    'TV mounting in Boise and the Treasure Valley, plus shelves, mirrors, curtain rods and furniture assembly, anchored right. Send photos for a written quote.',
  'fence-deck-gutter-repair':
    'Fence, deck and gutter repair in Boise and the Treasure Valley: leaning posts, sagging gates, loose deck boards, gutter cleaning. Send photos for a quote.',
  'home-maintenance':
    'Home maintenance and caulking in Boise and the Treasure Valley: tub and sink recaulking, weatherstripping, grout repair and punch lists. Quote first.',
};

/** Keyed by city name. Each housing note is from that city's guide or area copy. */
const AREA_DESCRIPTIONS: Record<string, string> = {
  Boise:
    'Handyman in Boise, Idaho: North End plaster to Harris Ranch nail pops. One written quote before work starts, same pricing valley-wide, no travel surcharge.',
  Meridian:
    'Handyman in Meridian, Idaho: settling cracks and builder-grade swaps in subdivision homes. One written quote before work starts, same pricing valley-wide.',
  Eagle:
    'Handyman in Eagle, Idaho: larger homes with more exterior to keep up, decks and fences included. One written quote before work starts, same valley pricing.',
  Nampa:
    'Handyman in Nampa, Idaho: older homes near downtown and new Canyon County subdivisions. One written quote before work starts, same pricing valley-wide.',
  Kuna:
    'Handyman in Kuna, Idaho: new-subdivision settling repairs and acreage fence upkeep. One written quote before work starts, same pricing across the valley.',
  Star:
    'Handyman in Star, Idaho: new builds, farmhouse-era homes and wind-tested fences. One written quote before work starts, same pricing across the valley.',
  Middleton:
    'Handyman in Middleton, Idaho: small-town and acreage homes plus new-subdivision repairs. One written quote before work starts, same pricing valley-wide.',
  'Garden City':
    'Handyman in Garden City, Idaho: small repairs, installs and upkeep for Ada County homes near the Greenbelt. One written quote before work starts.',
  Caldwell:
    'Handyman in Caldwell, Idaho: older homes near the historic core and new subdivisions. One written quote before work starts, same pricing across the valley.',
};

/**
 * Generate the meta description for the home, a service page or an area page.
 * Keyword first, 140 to 155 characters, no phone number, no exclamation mark.
 */
export function generateMetaDescription(params: ServiceSEOParams): string {
  const { serviceName, serviceSlug, city } = params;

  if (params.isHomePage) return HOME_DESCRIPTION;

  if (city && serviceName) {
    return generateCityServiceDescription(serviceName, city);
  }

  if (city) {
    return AREA_DESCRIPTIONS[city] ?? fitDescriptionCandidates([
      `Handyman in ${city}, Idaho: small repairs, installs and home maintenance. One written quote before work starts, same pricing across the Treasure Valley.`,
      `Handyman in ${city}, Idaho: small repairs, installs and home maintenance, with one written quote before work starts and the same pricing valley-wide.`,
      `Handyman in ${city}, Idaho: small repairs, installs and home maintenance. One written quote before work starts.`,
    ]);
  }

  if (serviceSlug && SERVICE_DESCRIPTIONS[serviceSlug]) return SERVICE_DESCRIPTIONS[serviceSlug];

  if (!serviceName) return GENERIC_DESCRIPTION;

  const lead = serviceName.charAt(0).toUpperCase() + serviceName.slice(1).toLowerCase();
  return fitDescriptionCandidates([
    `${lead} in Boise and the Treasure Valley from a local handyman, with one written quote before any work starts. Send your list and photos to begin.`,
    `${lead} in Boise and the Treasure Valley, with one written quote before work starts. Send your list and photos to begin.`,
  ]);
}

/** First candidate inside 140 to 155 characters, else the longest one that fits 155. */
function fitDescriptionCandidates(candidates: string[]): string {
  const clean = candidates.map((c) => c.replace(/\s+/g, ' ').trim());
  const inRange = clean.find((c) => c.length >= DESCRIPTION_MIN && c.length <= DESCRIPTION_MAX);
  if (inRange) return inRange;
  const fitting = clean.filter((c) => c.length <= DESCRIPTION_MAX).sort((a, b) => b.length - a.length);
  return fitting[0] ?? clean[clean.length - 1];
}

/**
 * City-service title (the layout template appends " | Boise Handyman Co", 20
 * characters, so the part here gets 40 of the 60).
 *
 * Each service is titled by the term people search for, not by a clipped
 * display name: "Plumbing Fixes", "Exterior Repair" and "Maintenance" dropped
 * the searched word and stopped matching the page's H1. Keyed by the `name`
 * values in shared/contentData.ts.
 */
const SERVICE_SEARCH_NAMES: Record<string, string> = {
  'Drywall Repair & Patching': 'Drywall Repair',
  'Interior & Exterior Painting': 'Painting Touch-Ups',
  'Minor Plumbing Repairs': 'Plumbing Repairs',
  'Minor Electrical Repairs': 'Electrical Repairs',
  'Carpentry & Trim Repair': 'Carpentry & Trim Repair',
  'Mounting & Assembly': 'TV Mounting & Assembly',
  'Fence, Deck & Gutter Repair': 'Fence & Deck Repair',
  'Caulking & Home Maintenance': 'Home Maintenance',
};

/** Budget after the layout template appends " | Boise Handyman Co" (20). */
export const CITY_SERVICE_TITLE_BUDGET = 40;

export function generateCityServiceTitle(serviceName: string, cityName: string): string {
  const name = SERVICE_SEARCH_NAMES[serviceName] ?? serviceName;

  // "Idaho" when it fits, the "ID" abbreviation when it does not. Every
  // service/city pair in the current matrix resolves at one of these two.
  const candidates = [
    `${name} in ${cityName}, Idaho`,
    `${name} in ${cityName}, ID`,
    `${name}, ${cityName}`,
  ];

  return (
    candidates.find((c) => c.length <= CITY_SERVICE_TITLE_BUDGET) ??
    candidates[candidates.length - 1]
  );
}

/**
 * The search term and the work it covers, per service, for service x city
 * descriptions. Keyed by the `name` values in shared/contentData.ts. Scopes
 * are lists from each service's own inclusions.
 */
const CITY_SERVICE_DESCRIPTION_PARTS: Record<string, { lead: string; scope: string }> = {
  'Drywall Repair & Patching': { lead: 'Drywall repair', scope: 'holes, cracks, nail pops, texture matched' },
  'Interior & Exterior Painting': { lead: 'Painting touch-ups', scope: 'rooms, trim, doors, exterior spots' },
  'Minor Plumbing Repairs': { lead: 'Minor plumbing repairs', scope: 'faucets, toilets, disposals, slow drains' },
  'Minor Electrical Repairs': { lead: 'Minor electrical repairs', scope: 'outlets, switches, fixtures, ceiling fans' },
  'Carpentry & Trim Repair': { lead: 'Carpentry and trim repair', scope: 'sticking doors, casing, baseboard, rails' },
  'Mounting & Assembly': { lead: 'TV mounting and assembly', scope: 'TVs, shelves, mirrors, furniture' },
  'Fence, Deck & Gutter Repair': { lead: 'Fence, deck and gutter repair', scope: 'leaning panels, loose boards, gutters' },
  'Caulking & Home Maintenance': { lead: 'Home maintenance', scope: 'recaulking, weatherstripping, punch lists' },
};

/**
 * Where in each city the work runs, from CITY_SEO_DATA neighborhoods and the
 * neighborhood guides already published (Harris Ranch is a Boise guide).
 */
const CITY_SPANS: Record<string, string> = {
  Boise: 'North End to Harris Ranch',
  Meridian: 'Lochsa Falls to Paramount',
  Eagle: 'Banbury to Floating Feather',
  Nampa: 'Downtown to Karcher',
  Caldwell: 'Wilson to Cleveland Blvd',
  Kuna: 'Crimson Point and beyond',
  Star: 'Star River Ranch and beyond',
  Middleton: 'Middleton Heights and beyond',
};

const CITY_SERVICE_CLOSERS = [
  'Send photos for one written quote before work starts.',
  'Send photos for one written quote before the visit.',
  'Send a few photos for one written quote first.',
  'Send a few photos for one written quote before work starts.',
  'Send photos for one written quote first.',
  'Send photos and get one written quote before any work starts.',
  'One written quote before work starts, same pricing valley-wide.',
  'Send your list and photos for one written quote before work starts.',
  'Send photos for a quote.',
];

/**
 * Service x city meta description: "{service} in {City}, Idaho, {span}: {scope}.
 * {closer}" Keyword first, 140 to 155 characters, no phone, no exclamation.
 */
export function generateCityServiceDescription(
  serviceName: string,
  cityName: string,
  _shortDescription?: string,
): string {
  const parts = CITY_SERVICE_DESCRIPTION_PARTS[serviceName] ?? {
    lead: serviceName.charAt(0).toUpperCase() + serviceName.slice(1).toLowerCase(),
    scope: 'small repairs, installs and upkeep',
  };
  const span = CITY_SPANS[cityName];
  const heads = [
    ...(span ? [`${parts.lead} in ${cityName}, Idaho, ${span}: ${parts.scope}.`] : []),
    `${parts.lead} in ${cityName}, Idaho: ${parts.scope}.`,
    `${parts.lead} in ${cityName}, Idaho, across the city: ${parts.scope}.`,
    `${parts.lead} in ${cityName}, Idaho, from a local Treasure Valley handyman: ${parts.scope}.`,
  ];
  const candidates: string[] = [];
  for (const head of heads) {
    for (const closer of CITY_SERVICE_CLOSERS) candidates.push(`${head} ${closer}`);
  }
  return fitDescriptionCandidates(candidates);
}


/** Keep complete authored titles; an optional secondary label may be omitted. */
export function generateSafePageTitle(primary: string, suffix?: string): string {
  const title = primary.replace(/\s+/g, ' ').trim();
  const detail = suffix?.replace(/\s+/g, ' ').trim();
  if (detail) {
    const candidate = title + ' | ' + detail;
    if (candidate.length + (' | ' + SITE_CONFIG.name).length <= 60) return candidate;
  }
  // Preserve the authored topic, including dates and qualifiers. A display
  // length preference must not become a broken title in the document itself.
  return title;
}

/**
 * Default Open Graph / Twitter image path used as a site-wide fallback so every
 * page emits an og:image. Pages with their own hero (blog posts, guides) override
 * this with a more specific image.
 * Purpose-built 1200x630 dark social card: reverse wordmark + Maker's Seal on #1C1F1E.
 */
export const DEFAULT_OG_IMAGE_PATH = '/images/og-default.png';

/**
 * Absolute URL for the default Open Graph image.
 */
export function getDefaultOgImage(): string {
  return `${getBaseUrl().replace(/\/$/, '')}${DEFAULT_OG_IMAGE_PATH}`;
}

/**
 * Get base URL based on environment
 */
export function getBaseUrl(): string {
  // In Next.js, check for environment variable first
  if (process.env.NEXT_PUBLIC_SITE_URL) {
    return process.env.NEXT_PUBLIC_SITE_URL;
  }
  
  // Check if we're in browser environment
  if (typeof window !== 'undefined') {
    // Use current origin in development, production domain in production
    if (window.location.hostname === 'localhost' || window.location.hostname.includes('replit')) {
      return window.location.origin;
    }
  }
  // Default to production URL for SSR/build time
  return SITE_CONFIG.siteUrl;
}

/**
 * Generate SEO-optimized alt tag for logo/icon featured image
 * Creates page-specific alt text that includes relevant keywords
 */
export function generateLogoAltTag(params: ServiceSEOParams): string {
  const { serviceName, city, isHomePage } = params;
  
  if (isHomePage) {
    return `${BRAND} logo - Handyman services in Boise, Idaho`;
  }

  if (city && serviceName) {
    // City-specific alt tag with service context
    return `${BRAND} logo - ${serviceName} in ${city} Idaho - Local handyman service`;
  }

  if (city) {
    // City page alt tag without service
    return `${BRAND} logo - Handyman services in ${city} Idaho`;
  }

  if (!serviceName) {
    // Fallback for pages without service
    return `${BRAND} logo - Handyman serving the Treasure Valley, Idaho`;
  }
  
  // Service-specific alt tag
  return `${BRAND} logo - ${serviceName.toLowerCase()} in the Treasure Valley, Idaho`;
}

/**
 * Generate complete SEO metadata object for a page
 */
export function generateSEOMetadata(params: ServiceSEOParams): SEOMetaData {
  const title = generatePageTitle(params);
  const description = generateMetaDescription(params);
  
  // Environment-aware canonical URL
  const baseUrl = getBaseUrl();
  let canonical = baseUrl;
  
  if (!params.isHomePage) {
    if (params.citySlug && params.serviceSlug) {
      canonical = `${baseUrl}/services/${params.serviceSlug}/${params.citySlug}`;
    } else if (params.citySlug && !params.serviceSlug) {
      canonical = `${baseUrl}/areas/${params.citySlug}`;
    } else if (params.serviceSlug) {
      canonical = `${baseUrl}/services/${params.serviceSlug}`;
    }
  }
  
  // Open Graph defaults to meta tags
  return {
    title,
    description,
    canonical,
    ogTitle: title,
    ogDescription: description,
    ogImage: `${baseUrl}/images/og-default.png`,
    twitterCard: 'summary_large_image',
  };
}

/**
 * City-specific data for local SEO
 */
export const CITY_SEO_DATA: Record<string, {
  population: string;
  founded: string;
  zipCodes: string[];
  neighborhoods: string[];
  landmarks: string[];
  climate: string;
  coordinates: { lat: number; lng: number };
}> = {
  Kuna: {
    population: '24,011',
    founded: '1992',
    zipCodes: ['83634'],
    neighborhoods: ['Crimson Point'],
    landmarks: ['Bernie Fisher Park'],
    climate: 'semi-arid high desert climate with hot summers and cold winters',
    coordinates: { lat: 43.4913, lng: -116.4201 },
  },
  Boise: {
    population: '235,421',
    founded: '1863',
    zipCodes: ['83702', '83703', '83704', '83705', '83706', '83709', '83712', '83713', '83714', '83716'],
    neighborhoods: ['North End', 'Bench', 'Downtown', 'East End', 'Southwest Boise'],
    landmarks: ['Idaho State Capitol', 'Boise River Greenbelt', 'Table Rock', 'Hyde Park'],
    climate: 'semi-arid climate with four distinct seasons',
    coordinates: { lat: 43.6150, lng: -116.2023 },
  },
  Meridian: {
    population: '117,635',
    founded: '1893',
    zipCodes: ['83642', '83646'],
    neighborhoods: ['Lochsa Falls', 'Tuscany', 'Paramount'],
    landmarks: ['The Village at Meridian', 'Julius M. Kleiner Memorial Park', 'Settlers Park'],
    climate: 'semi-arid with hot, dry summers and cold winters',
    coordinates: { lat: 43.6121, lng: -116.3915 },
  },
  Eagle: {
    population: '30,346',
    founded: '1864',
    zipCodes: ['83616'],
    // "The Estates" is the Dry Creek Ranch product, outside Eagle.
    neighborhoods: ['Banbury', 'Floating Feather'],
    landmarks: ['Eagle Island State Park', 'Heritage Park', 'Eagle Hills Golf Course'],
    climate: 'semi-arid with distinct four seasons',
    coordinates: { lat: 43.6954, lng: -116.3540 },
  },
  Star: {
    population: '12,701',
    founded: '1907',
    zipCodes: ['83669'],
    neighborhoods: ['Star River Ranch'],
    landmarks: ['Boise River', 'Star Riverwalk Park', 'Freedom Park'],
    climate: 'semi-arid climate with hot summers and cool winters',
    coordinates: { lat: 43.6921, lng: -116.4939 },
  },
  Middleton: {
    population: '10,141',
    founded: '1909',
    zipCodes: ['83644'],
    neighborhoods: ['Middleton Heights'],
    // The city does not list a park named Middleton City Park.
    landmarks: ['the Boise River'],
    climate: 'semi-arid high desert climate with warm summers and cool winters',
    coordinates: { lat: 43.7068, lng: -116.6209 },
  },
  Nampa: {
    population: '108,188',
    founded: '1886',
    zipCodes: ['83651', '83653', '83686', '83687'],
    neighborhoods: ['Downtown Nampa', 'Karcher', 'Greenhurst'],
    // Lake Lowell is the Deer Flat refuge outside Nampa city limits.
    landmarks: ['Ford Idaho Center', 'Nampa Train Depot'],
    climate: 'semi-arid with hot summers and cold winters',
    coordinates: { lat: 43.5407, lng: -116.5635 },
  },
  Caldwell: {
    population: '65,359',
    founded: '1883',
    zipCodes: ['83605', '83607'],
    neighborhoods: ['Wilson', 'Ustick', 'Cleveland Blvd'],
    landmarks: ['Indian Creek Plaza', 'Caldwell Night Rodeo', 'College of Idaho'],
    climate: 'semi-arid high desert with four distinct seasons',
    coordinates: { lat: 43.6629, lng: -116.6874 },
  },
};

/**
 * Business information for NAP consistency
 */
export const BUSINESS_INFO = {
  name: SITE_CONFIG.name,
  legalName: SITE_CONFIG.legalName,
  alternateName: ['Boise Handyman', 'BHC'],
  /**
   * No named individual is published on the site by request. Left empty so the
   * Organization schema omits the `founder` Person entity (the emit is gated on
   * this being non-empty). Set a name here only if the owner opts in later.
   */
  founderName: '',
  phone: SITE_CONFIG.phone,
  email: SITE_CONFIG.email,
  // Authorized public address. Schema reads the street, city, region code,
  // and postal code from SITE_CONFIG. State is spelled out here for citation
  // copy; JSON-LD uses the ID region code.
  address: {
    street: SITE_CONFIG.address.street,
    city: SITE_CONFIG.address.city,
    state: 'Idaho',
    postalCode: SITE_CONFIG.address.postalCode,
    country: 'United States',
  },
  // America/Boise. Sunday is closed and is omitted from the schema.
  hours: {
    monday: '9:00 AM - 6:00 PM',
    tuesday: '9:00 AM - 6:00 PM',
    wednesday: '9:00 AM - 6:00 PM',
    thursday: '9:00 AM - 6:00 PM',
    friday: '9:00 AM - 6:00 PM',
    saturday: '9:00 AM - 4:00 PM',
    sunday: 'Closed',
  },
  // Published year only. The unproven 2020 phrases stay in shared/foundingClaims.ts
  // and are omitted while SHOW_FOUNDING_YEAR is false. Schema emits foundingDate
  // only when this string is non-empty.
  founded: publishedFoundingYear(),
  serviceArea: ['Boise', 'Meridian', 'Eagle', 'Nampa', 'Kuna', 'Star', 'Middleton', 'Caldwell', 'Garden City'],
  serviceRadius: '35 miles',
  licenses: ['Idaho Registered Contractor #8381215'],
  // Bonded and insured is confirmed for the operating company, P5 Home Co LLC.
  // Insurance details stay available on request.
  certifications: [] as string[],
  insurance: 'Insurance details available upon request',
  rating: 0,
  reviewCount: 0,
  yearlyServicesCompleted: 0,
  // Instagram is intentionally omitted: it is being dropped from the site
  // alongside the footer, and its handle still carries the old slug. Facebook
  // stays as the one confirmed profile.
  sameAs: [
    GBP_SOCIAL.facebook,
    ...getExternalProfileUrls(),
  ].filter((url): url is string => Boolean(url)),
};

export type { SEOMetaData, ServiceSEOParams };
