/**
 * SEO Utilities for Boise Handyman Co
 * Generates optimized meta tags, titles, and descriptions
 * for service and location pages
 */

import { SITE_CONFIG } from '@/shared/siteConfig';
import { GBP_SOCIAL, getExternalProfileUrls } from '@/shared/gbpProfile';

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

const CITY_DESCRIPTION_VARIANTS: Record<string, string> = {
  Kuna: "Kuna's trusted local",
  Boise: "Boise's local",
  Meridian: "Meridian's trusted",
  Eagle: "Eagle's preferred",
  Star: "Star's reliable",
  Middleton: "Middleton's expert",
  Nampa: "Nampa's trusted",
  Caldwell: "Caldwell's trusted",
};

const CITY_CTA_VARIANTS: Record<string, string> = {
  Kuna: "Free upfront quotes",
  Boise: "Treasure Valley handyman",
  Eagle: "Upfront quotes",
  Meridian: "One-trip fixes",
  Star: "Same-week scheduling",
  Middleton: "Workmanship guarantee",
  Nampa: "Ada & Canyon County service",
  Caldwell: "Repairs and installs",
};

/**
 * Generate SEO-optimized meta description
 * 150-160 characters with phone number, CTA, and unique value prop
 * Phone: (208) 477-1169
 */
export function generateMetaDescription(params: ServiceSEOParams): string {
  const { serviceName, city } = params;
  const phone = SITE_CONFIG.phone;
  
  if (params.isHomePage) {
    return `Handyman services in Boise, Meridian, Eagle & the Treasure Valley. Repairs, installs & maintenance with upfront quotes. Call ${phone} to book a visit!`;
  }

  if (city && serviceName) {
    const serviceLC = serviceName.toLowerCase();
    const cityVariant = CITY_DESCRIPTION_VARIANTS[city] || `${city}'s trusted`;
    const ctaVariant = CITY_CTA_VARIANTS[city] || "Satisfaction guaranteed";
    return `${cityVariant} ${serviceLC} team. Upfront quotes. ${ctaVariant}. Call ${phone} to book a visit!`;
  }

  if (city) {
    return `Handyman in ${city}, Idaho. Locally owned repairs, installs & maintenance. Call ${phone} to book a handyman visit in ${city}!`;
  }

  if (!serviceName) {
    return `Handyman services in Boise & the Treasure Valley. Small repairs, installs & home maintenance with upfront quotes. Call ${phone} to book a visit!`;
  }

  const serviceLC = serviceName.toLowerCase();
  return `${serviceLC} in Boise & the Treasure Valley. Upfront quotes and one-trip fixes from a local handyman. Call ${phone} to book a visit!`;
}

/**
 * Generate varied city-service title (used for page metadata title field)
 * Does NOT include brand name since layout template appends "| Boise Handyman Co"
 * Target: under 36 chars so final rendered title stays under 60 chars
 */

/**
 * Shorter display names for the longest services, used only when the full name
 * would push a city-service title past the budget. Keyed by the `name` values
 * in shared/contentData.ts.
 */
const SERVICE_SHORT_NAMES: Record<string, string> = {
  'Drywall Repair & Patching': 'Drywall Repair',
  'Interior & Exterior Painting': 'Painting',
  'Minor Plumbing Repairs': 'Plumbing Fixes',
  'Minor Electrical Repairs': 'Electrical Fixes',
  'Carpentry & Trim Repair': 'Carpentry Repair',
  'Fence, Deck & Gutter Repair': 'Exterior Repair',
  'Caulking & Home Maintenance': 'Maintenance',
};

/** Budget after the layout template appends " | Boise Handyman Co" (20). */
const CITY_SERVICE_TITLE_BUDGET = 36;

export function generateCityServiceTitle(serviceName: string, cityName: string): string {
  const short = SERVICE_SHORT_NAMES[serviceName] ?? serviceName;

  // Degrade in steps rather than truncating mid-word: full name with "Idaho",
  // then the short name, then the "ID" abbreviation. Every service/city pair in
  // the current matrix resolves at one of these levels.
  const candidates = [
    `${serviceName} in ${cityName}, Idaho`,
    `${short} in ${cityName}, Idaho`,
    `${short} in ${cityName}, ID`,
    `${short}, ${cityName}`,
  ];

  return (
    candidates.find((c) => c.length <= CITY_SERVICE_TITLE_BUDGET) ??
    candidates[candidates.length - 1]
  );
}

/**
 * Generate varied city-service meta description
 * Guaranteed under 160 characters
 */
export function generateCityServiceDescription(
  serviceName: string,
  cityName: string,
  shortDescription?: string,
): string {
  const phone = SITE_CONFIG.phone;
  const serviceLC = serviceName.toLowerCase();
  const cityVariant = CITY_DESCRIPTION_VARIANTS[cityName] || `${cityName}'s trusted`;
  const cityData = CITY_SEO_DATA[cityName as keyof typeof CITY_SEO_DATA];
  const neighborhood = cityData?.neighborhoods?.[0];

  if (neighborhood) {
    const withNeighborhood = `${cityVariant} ${serviceLC}. Serving ${neighborhood} & all ${cityName}. Upfront quotes. Call ${phone}!`;
    if (withNeighborhood.length <= 160) return withNeighborhood;
  }

  if (shortDescription) {
    const desc = `${cityVariant} ${serviceLC}. ${shortDescription}. Upfront quotes. Call ${phone}!`;
    if (desc.length <= 160) return desc;
  }

  const base = `${cityVariant} ${serviceLC} in ${cityName}, ID. Upfront quotes. Call ${phone} to book a visit!`;
  if (base.length <= 160) return base;

  return `${serviceLC} in ${cityName}, ID. Upfront quotes from a local handyman. Call ${phone} to book a visit!`;
}

/**
 * Generate a page title for any service or area page
 * Ensures final rendered title (with layout template " | Boise Handyman Co")
 * stays under 60 characters
 */
export function generateSafePageTitle(primary: string, suffix?: string): string {
  const templateSuffix = ` | ${BRAND}`;
  const maxLen = 60 - templateSuffix.length;

  if (suffix) {
    const full = `${primary} | ${suffix}`;
    if (full.length <= maxLen) return full;
  }

  if (primary.length <= maxLen) return primary;

  // Truncate on a word boundary without a baked-in ellipsis (the ellipsis would
  // become a literal part of the <title>, not SERP truncation).
  const words = primary.split(' ');
  let truncated = '';
  for (const word of words) {
    const candidate = truncated ? `${truncated} ${word}` : word;
    if (candidate.length > maxLen) break;
    truncated = candidate;
  }

  // A word-boundary cut can still land on a dangling connector, producing
  // titles like "Energy-Efficient Homes in the". Drop trailing connectors so
  // an overflowing title degrades to a clean phrase instead of a broken one.
  const DANGLING = new Set(['in', 'the', 'a', 'an', 'of', 'for', 'and', '&', 'to', 'at', 'on', 'with']);
  let cleaned = truncated.trim();
  let parts = cleaned.split(' ');
  while (parts.length > 1 && DANGLING.has(parts[parts.length - 1].toLowerCase())) {
    parts.pop();
    cleaned = parts.join(' ');
  }

  return cleaned || truncated || primary.substring(0, maxLen).trim();
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
    neighborhoods: ['Indian Creek', 'Black Cat', 'Crimson Point', 'Ten Mile Creek'],
    landmarks: ['Kuna Caves', 'Swan Falls Dam', 'Indian Creek Plaza'],
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
    neighborhoods: ['Lochsa Falls', 'Tuscany', 'Paramount', 'Meridian Ranch'],
    landmarks: ['The Village at Meridian', 'Julius M. Kleiner Memorial Park', 'Eagle Island State Park'],
    climate: 'semi-arid with hot, dry summers and cold winters',
    coordinates: { lat: 43.6121, lng: -116.3915 },
  },
  Eagle: {
    population: '30,346',
    founded: '1864',
    zipCodes: ['83616'],
    neighborhoods: ['Shadow Valley', 'Banbury', 'The Estates', 'Floating Feather'],
    landmarks: ['Eagle Island State Park', 'Heritage Park', 'Eagle Hills Golf Course'],
    climate: 'semi-arid with distinct four seasons',
    coordinates: { lat: 43.6954, lng: -116.3540 },
  },
  Star: {
    population: '12,701',
    founded: '1907',
    zipCodes: ['83669'],
    neighborhoods: ['Star River Ranch', 'Hillsdale', 'Paramount', 'Star Crossing'],
    landmarks: ['Boise River', 'Star Riverfront Park', 'Celebration Park'],
    climate: 'semi-arid climate with hot summers and cool winters',
    coordinates: { lat: 43.6921, lng: -116.4939 },
  },
  Middleton: {
    population: '10,141',
    founded: '1909',
    zipCodes: ['83644'],
    neighborhoods: ['Middleton Heights', 'Purple Sage', 'Puckett Estates', 'Windermere'],
    landmarks: ['Boise River', 'Middleton City Park', 'Purple Sage Golf Course'],
    climate: 'semi-arid high desert climate with warm summers and cool winters',
    coordinates: { lat: 43.7068, lng: -116.6209 },
  },
  Nampa: {
    population: '108,188',
    founded: '1886',
    zipCodes: ['83651', '83653', '83686', '83687'],
    neighborhoods: ['Downtown Nampa', 'Karcher', 'Greenhurst', 'Columbia Village'],
    landmarks: ['Ford Idaho Center', 'Lake Lowell', 'Nampa Train Depot'],
    climate: 'semi-arid with hot summers and cold winters',
    coordinates: { lat: 43.5407, lng: -116.5635 },
  },
  Caldwell: {
    population: '65,359',
    founded: '1883',
    zipCodes: ['83605', '83607'],
    neighborhoods: ['Indian Creek', 'Cleveland Blvd', 'Ustick', 'Wilson'],
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
  // Canonical NAP sourced from SITE_CONFIG. Street + ZIP feed structured data
  // and off-site citations; locality (Meridian, Idaho) stays consistent.
  address: {
    street: SITE_CONFIG.address.street,
    city: SITE_CONFIG.address.city,
    state: 'Idaho',
    postalCode: SITE_CONFIG.address.postalCode,
    country: 'United States',
  },
  hours: {
    monday: '7:00 AM - 6:00 PM',
    tuesday: '7:00 AM - 6:00 PM',
    wednesday: '7:00 AM - 6:00 PM',
    thursday: '7:00 AM - 6:00 PM',
    friday: '7:00 AM - 6:00 PM',
    saturday: '8:00 AM - 4:00 PM',
    sunday: 'Closed',
  },
  // Founding year intentionally blank for Boise Handyman Co: emitting the old
  // brand's date would fabricate a years-in-business claim. Schema gates
  // foundingDate on this being non-empty. [NEEDS: real founding year]
  founded: '',
  serviceArea: ['Boise', 'Meridian', 'Eagle', 'Nampa', 'Kuna', 'Star', 'Middleton', 'Caldwell', 'Garden City'],
  serviceRadius: '35 miles',
  licenses: ['Registration details available upon request'],
  // No certification or insured/bonded claims are published until confirmed
  // for the handyman entity. [NEEDS: confirm insurance/bond status]
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
