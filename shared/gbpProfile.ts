/**
 * Google Business Profile copy and configuration.
 * Single source of truth for GBP fields, services, products, Q&A, posts, and sync data.
 * Operator checklists: local-seo-audit/02-gbp-plan.md
 */

import { SITE_CONFIG } from '@/shared/siteConfig';
import { CITIES, SERVICES } from '@/shared/contentData';

const SITE = SITE_CONFIG.siteUrl.replace(/\/$/, '');

/** Canonical NAP - use verbatim on GBP and all citations. */
export const GBP_NAP = {
  name: 'Boise Handyman Co',
  legalName: 'Boise Handyman Co',
  phone: SITE_CONFIG.phone,
  email: SITE_CONFIG.email,
  website: SITE,
  publicLocality: SITE_CONFIG.address.cityState,
  serviceAreaLabel: SITE_CONFIG.address.serviceArea,
  // Intentionally blank: the previous '2020' belonged to the prior
  // construction brand and would fabricate a years-in-business claim here.
  // [NEEDS: real founding year for Boise Handyman Co]
  founded: '',
  hours: {
    monday: '7:00 AM - 6:00 PM',
    tuesday: '7:00 AM - 6:00 PM',
    wednesday: '7:00 AM - 6:00 PM',
    thursday: '7:00 AM - 6:00 PM',
    friday: '7:00 AM - 6:00 PM',
    saturday: '8:00 AM - 4:00 PM',
    sunday: 'Closed',
  },
} as const;

export const GBP_SERVICE_AREAS = [
  'Boise, ID',
  'Meridian, ID',
  'Eagle, ID',
  'Nampa, ID',
  'Kuna, ID',
  'Star, ID',
  'Middleton, ID',
  'Caldwell, ID',
] as const;

// Primary category drives which local pack a listing competes in. "Handyman"
// is the category for small repair/install/maintenance intent; a contractor
// category would keep the profile ranking for the wrong searches.
export const GBP_CATEGORIES = {
  primary: 'Handyman',
  secondary: [
    'Drywall contractor',
    'Painter',
    'Furniture assembly service',
    'Fence contractor',
    'Gutter cleaning service',
  ],
} as const;

export const GBP_DESCRIPTION =
  'Boise Handyman Co is a locally owned handyman service for Boise, Meridian, Eagle, Nampa, Kuna, Star, Middleton, and Caldwell, Idaho. We handle small repairs, installs, and maintenance: drywall repair and patching, interior and exterior painting touch-ups, minor plumbing and electrical repairs, carpentry and trim repair, TV mounting and furniture assembly, fence, deck, and gutter repair, and caulking and home maintenance. Simple pricing with one upfront written quote before any work starts, and most jobs finished in a single visit. Larger remodels and licensed trade work are referred to trusted specialty contractors. Get an instant estimate online or book a handyman visit.';

export const GBP_LINKS = {
  website: SITE,
  appointment: `${SITE}/contact`,
  estimator: `${SITE}/estimate`,
  resources: `${SITE}/resources`,
  review: `${SITE}/review`,
} as const;

/**
 * Canonical social profiles. These feed `sameAs` in the LocalBusiness schema,
 * where a wrong URL actively misidentifies the business to search engines, so
 * they must point at profiles that genuinely belong to the company.
 *
 * [NEEDS: confirm social profile URLs for Boise Handyman] - these still use
 * the legacy `boiseremodeling` handles. If the profiles are renamed as part of
 * the rebrand, update both URLs here and nowhere else - the footer and schema
 * both read from this.
 */
export const GBP_SOCIAL = {
  facebook: 'https://www.facebook.com/boiseremodeling',
  instagram: 'https://www.instagram.com/boiseremodeling',
} as const;

export const GBP_ATTRIBUTES = {
  onlineEstimates: true,
  onsiteServices: true,
  payments: ['Cash', 'Check', 'Credit cards'],
  planning: 'Appointment required (scheduled visits)',
  serviceOptions: 'Free upfront quotes (photo quotes + online estimator)',
} as const;

export const GBP_MESSAGING = {
  welcomeMessage:
    'Thanks for reaching out to Boise Handyman Co. We respond within one business day. For faster help, call or text (208) 477-1169, or get an instant estimate at boisehandyman.co/estimate',
} as const;

export interface GbpService {
  name: string;
  description: string;
  startingPrice?: string;
}

/**
 * GBP service list mirrors shared/contentData.ts SERVICES. startingPrice
 * values are the same placeholder "From" figures used on the site:
 * [NEEDS: real pricing confirmation].
 */
export const GBP_SERVICES: GbpService[] = [
  {
    name: 'Drywall repair and patching',
    description:
      'Holes, cracks, and water-damaged patches repaired, textured to match, and paint-blended. Quoted upfront from photos.',
    startingPrice: '$149',
  },
  {
    name: 'Interior and exterior painting',
    description:
      'Rooms, accent walls, trim, doors, and exterior touch-ups with proper prep and clean lines. Upfront per-room quotes.',
    startingPrice: '$199',
  },
  {
    name: 'Minor plumbing repairs',
    description:
      'Faucets, toilets, disposals, supply lines, and slow drains fixed or swapped in one visit. Licensed-plumber work referred out.',
    startingPrice: '$129',
  },
  {
    name: 'Minor electrical repairs',
    description:
      'Outlets, switches, light fixtures, and ceiling fans replaced on existing wiring, tested before we leave. Panel work referred out.',
    startingPrice: '$129',
  },
  {
    name: 'Carpentry and trim repair',
    description:
      'Sticking doors, damaged baseboard and casing, stair rails, and small carpentry fixes finished cleanly.',
    startingPrice: '$149',
  },
  {
    name: 'TV mounting and furniture assembly',
    description:
      'TVs, shelves, mirrors, and curtain rods mounted level and anchored right; flat-pack furniture assembled and tightened.',
    startingPrice: '$99',
  },
  {
    name: 'Fence, deck, and gutter repair',
    description:
      'Leaning fence posts reset, deck boards and rails replaced, gutters cleaned, resealed, and re-pitched.',
    startingPrice: '$149',
  },
  {
    name: 'Caulking and home maintenance',
    description:
      'Kitchen and bath recaulking, weatherproofing, tile and grout touch-ups, and whole punch lists cleared in one visit.',
    startingPrice: '$99',
  },
  {
    name: 'Punch list and to-do list visits',
    description:
      'Bundle small tasks into one visit with one written price. Send the list with photos for an upfront quote.',
  },
  {
    name: 'Free upfront quotes',
    description:
      'Photo-based quotes within one business day, plus an instant online estimator. No obligation.',
  },
];

export interface GbpProduct {
  category: string;
  name: string;
  price: string;
  url: string;
  description: string;
}

export const GBP_PRODUCT_CATEGORIES = [
  'Handyman Services',
  'Quotes & Tools',
  'Areas We Serve',
] as const;

export const GBP_PRODUCTS: GbpProduct[] = [
  // Generated from the canonical service catalog so GBP products cannot drift
  // out of sync with the /services routes.
  ...SERVICES.map((service) => ({
    category: 'Handyman Services',
    name: service.name,
    price: `From ${service.planningFrom}`,
    url: `${SITE}/services/${service.slug}`,
    description: service.shortDescription,
  })),
  {
    category: 'Quotes & Tools',
    name: 'Instant Online Estimate',
    price: 'Free',
    url: `${SITE}/estimate`,
    description:
      'An instant planning range for your repair, install, or maintenance job. Not a bid - a starting point, confirmed with an upfront quote.',
  },
  {
    category: 'Quotes & Tools',
    name: 'Book a Handyman Visit',
    price: 'Free quote',
    url: `${SITE}/contact`,
    description:
      'Send your task list with photos and get an upfront quote within one business day. No pressure, no obligation.',
  },
  {
    category: 'Quotes & Tools',
    name: 'Home Maintenance Resources',
    price: 'Free',
    url: `${SITE}/resources`,
    description: 'Free guides and checklists for keeping a Treasure Valley home in shape.',
  },
  // Generated from the canonical city list so GBP area products cannot drift
  // out of sync with the /areas routes.
  ...CITIES.map((city) => ({
    category: 'Areas We Serve',
    name: `Handyman in ${city.name}, ID`,
    price: 'Free quote',
    url: `${SITE}/areas/${city.slug}`,
    description: `Handyman service in ${city.name}, Idaho: small repairs, installs, and maintenance with upfront quotes and one-trip fixes.`,
  })),
];

export interface GbpQaEntry {
  question: string;
  answer: string;
}

export const GBP_QA_SEED: GbpQaEntry[] = [
  {
    question: 'Do you provide free estimates?',
    answer: `Yes. Send your task list with photos and we reply with an upfront quote within one business day - no pressure, no obligation. You can also get an instant planning range online at ${SITE}/estimate`,
  },
  {
    question: 'What areas do you serve?',
    answer:
      'Boise, Meridian, Eagle, Nampa, Kuna, Star, Middleton, and Caldwell, Idaho - all of Ada and Canyon County in the Treasure Valley. Where you live in the service area never inflates the quote.',
  },
  {
    question: 'How much does a handyman cost in Boise?',
    answer: `Treasure Valley handyman rates typically run $60 to $120 per hour. We quote every job upfront as one written price, with most single-task visits starting around $99 to $149.`,
  },
  {
    question: 'What services do you offer?',
    answer: `Drywall repair, painting touch-ups, minor plumbing and electrical repairs, carpentry and trim repair, TV mounting and furniture assembly, fence, deck, and gutter repair, and caulking and home maintenance. Full list: ${SITE}/services`,
  },
  {
    question: 'How quickly can you come out?',
    answer:
      'We reply within one business day and most jobs are scheduled within the week. Because we quote from photos first, the visit is spent doing the work, not estimating it.',
  },
  {
    question: 'Is there a minimum charge?',
    answer:
      'Every visit carries a practical minimum, so a single small task starts around $99. Bundling several tasks into one visit is the best value, because extra tasks only add the time they take.',
  },
  {
    question: 'Are you licensed and insured?',
    answer:
      'We keep our work within the scope Idaho allows for handyman services and refer licensed-trade work (panels, repipes, gas, HVAC, roofing) to licensed specialists. Business registration and insurance details are available on request.',
  },
  {
    question: 'Do you do remodels?',
    answer: `No. We focus on small repair, install, and maintenance jobs, typically 1 to 8 hours. Remodels and additions get referred to general contractors we trust. What we do cover: ${SITE}/services`,
  },
  {
    question: 'Who supplies the materials?',
    answer:
      'Either works. Supply your own fixture, paint, or hardware, or we pick materials up on the way and list them on the invoice at store cost. Common small parts ride on the truck.',
  },
  {
    question: 'Do you mount TVs and assemble furniture?',
    answer: `Yes - TVs, shelves, mirrors, and curtain rods mounted into studs or rated anchors, and flat-pack furniture assembled and anchored: ${SITE}/services/mounting-assembly`,
  },
  {
    question: 'Can you clean my gutters?',
    answer: `Yes. Gutter cleaning, resealing, and re-pitching are part of our exterior repair service, best booked in late fall before the first freeze: ${SITE}/services/fence-deck-gutter-repair`,
  },
  {
    question: 'How do I get started?',
    answer: `Call or text (208) 477-1169, or book online: ${SITE}/contact. We respond within one business day.`,
  },
];

export interface GbpPost {
  week: number;
  headline: string;
  body: string;
  buttonLabel: string;
  buttonUrl: string;
  photoHint: string;
}

export const GBP_POSTS_STARTER: GbpPost[] = [
  {
    week: 1,
    headline: 'Small repairs, done right, in one trip',
    body: 'Drywall patches, sticking doors, leaky faucets, and to-do lists cleared in a single visit. Upfront quotes before any work starts.',
    buttonLabel: 'Learn more',
    buttonUrl: `${SITE}/services`,
    photoHint: 'Finished repair photo (before/after pair if available)',
  },
  {
    week: 2,
    headline: 'Know the price before you book',
    body: 'One written price, quoted upfront from photos before any work starts. Get an instant planning range online in about a minute.',
    buttonLabel: 'Get an estimate',
    buttonUrl: `${SITE}/estimate`,
    photoHint: 'Estimator screenshot or quote example',
  },
  {
    week: 3,
    headline: 'One visit, whole to-do list',
    body: 'One visit covers the whole list, however many tasks. Send your list with photos and clear the whole thing in one appointment.',
    buttonLabel: 'Send your list',
    buttonUrl: `${SITE}/contact`,
    photoHint: 'Punch-list style photo: tools and task list',
  },
  {
    week: 4,
    headline: 'Get ahead of the season',
    body: 'Gutters cleaned before winter, caulk and weatherstripping refreshed before the freeze, fence and deck repairs while the weather holds.',
    buttonLabel: 'Book a visit',
    buttonUrl: `${SITE}/services/home-maintenance`,
    photoHint: 'Seasonal exterior work photo',
  },
];

export const GBP_PHOTO_CHECKLIST = [
  { type: 'Logo', spec: 'Square, 720×720+', filename: 'boise-handyman-co-logo.jpg' },
  {
    type: 'Cover',
    spec: 'Landscape 1200×900+',
    filename: 'handyman-services-treasure-valley-cover.jpg',
  },
  {
    type: 'Completed jobs (10+)',
    spec: 'Before/after pairs and finished repairs, captioned by city + job type',
    filename: 'drywall-repair-boise-idaho-after.jpg',
  },
  {
    type: 'Team/owner',
    spec: 'Team member on a job with tools',
    filename: 'handyman-at-work-meridian.jpg',
  },
  {
    type: 'Work-in-progress',
    spec: 'Mid-job shots: patching, mounting, caulking',
    filename: 'tv-mounting-in-progress-eagle.jpg',
  },
  {
    type: 'Trust',
    spec: 'Branded vehicle or organized tool setup',
    filename: 'boise-handyman-co-vehicle.jpg',
  },
] as const;

export const GBP_CITATION_FIXES = [
  {
    platform: 'Yelp',
    action: 'Claim listing; set phone to (208) 477-1169; service-area model; no street address; category Handyman',
    url: 'https://www.yelp.com',
  },
  {
    platform: 'ProMatcher',
    action: 'Correct or delete profile - remove Lake Fork address and old phone (208) 405-8425',
    url: 'https://www.promatcher.com/profile/BoiseRemodelingCo',
  },
  {
    platform: 'Facebook',
    action: 'Confirm NAP matches canonical record and handle is updated from boiseremodeling',
    url: GBP_SOCIAL.facebook,
  },
  // Instagram dropped from the site, so no NAP to verify there.
  {
    platform: 'MapQuest',
    action: 'Submit correction after Yelp is fixed',
    url: 'https://www.mapquest.com',
  },
] as const;

export const GBP_PARALLEL_LISTINGS = [
  { platform: 'Bing Places', url: 'https://www.bingplaces.com', category: 'Handyman' },
  {
    platform: 'Apple Business Connect',
    url: 'https://businessconnect.apple.com',
    category: 'Home Improvement',
  },
] as const;

export const GBP_MONTHLY_SYNC = [
  'Publish 1 Google Post with deep link (see GBP_POSTS_STARTER rotation)',
  'Upload 2–4 new job photos with city + job type captions',
  'Respond to all reviews within 48 hours',
  'Check Q&A for new homeowner questions',
  'Verify NAP on Facebook, Bing, Apple still matches GBP_NAP',
  'Update BUSINESS_INFO.rating/reviewCount in lib/seo.ts if review count changed',
] as const;

export const GBP_QUARTERLY_SYNC = [
  'Search "Boise Construction Co" and "Boise Remodeling Co" - old brands should resolve to Boise Handyman Co',
  'Audit for duplicate GBP listings',
  'Update product/post links if new guides publish',
  'Append new citation URLs to BUSINESS_INFO.sameAs via env vars',
] as const;

/** GBP short review link from dashboard - set NEXT_PUBLIC_GBP_REVIEW_URL in production. */
export function getGbpReviewUrl(): string | undefined {
  const url = process.env.NEXT_PUBLIC_GBP_REVIEW_URL?.trim();
  return url || undefined;
}

/** GBP Maps listing URL - set NEXT_PUBLIC_GBP_URL after verification. */
export function getGbpProfileUrl(): string | undefined {
  const url = process.env.NEXT_PUBLIC_GBP_URL?.trim();
  return url || undefined;
}

/** Optional third-party profile URLs for schema sameAs (set via env after listings go live). */
export function getExternalProfileUrls(): string[] {
  const keys = [
    'NEXT_PUBLIC_GBP_URL',
    'NEXT_PUBLIC_BING_PLACES_URL',
    'NEXT_PUBLIC_APPLE_BUSINESS_URL',
    'NEXT_PUBLIC_YELP_URL',
    'NEXT_PUBLIC_HOUZZ_URL',
  ] as const;

  return keys
    .map((key) => process.env[key]?.trim())
    .filter((url): url is string => Boolean(url));
}
