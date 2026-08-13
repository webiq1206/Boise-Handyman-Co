/**
 * Topical authority registry - single source of truth for hubs and content manifest.
 *
 * Rebuilt for handyman repositioning. The previous registry carried six
 * home-building hubs (costs, choosing a builder, process, land and lots,
 * design, locations) built around new-construction intent this company no
 * longer serves. Those hubs are retired, not reworded: a "Land & Lots" hub has
 * no handyman equivalent, and keeping construction-intent category pages alive
 * would anchor the site to the wrong subject while it re-earns authority as a
 * repair and maintenance business.
 *
 * What replaced them is five hubs covering what a homeowner actually searches
 * for before calling a handyman: fixing something broken, installing or
 * upgrading something small, keeping the house maintained, understanding what
 * small jobs cost and who to hire, and looking after the outside of the house.
 *
 * Retired hub slugs must be redirected. See CONTENT_REDIRECTS in
 * shared/content/contentRedirects.js, which next.config.js consumes.
 */

export type ContentType = 'pillar' | 'cluster' | 'location' | 'neighborhood' | 'master';
export type ContentStatus = 'planned' | 'draft' | 'published';

/** Default status for manifest entries - all hubs finalized */
const PUBLISHED: ContentStatus = 'published';
export type ContentRoute = 'guide' | 'blog';

export interface ContentHub {
  hubSlug: string;
  title: string;
  categoryLabel: string;
  pillarSlug: string;
  pillarRoute: ContentRoute;
  description: string;
  priorityTier: 1 | 2 | 3 | 4 | 5;
  serviceSlugs: string[];
}

export interface ContentManifestEntry {
  slug: string;
  title: string;
  hubSlug: string;
  contentType: ContentType;
  route: ContentRoute;
  status: ContentStatus;
  replacesSlug?: string;
  primaryKeyword?: string;
}

export const CONTENT_HUBS: ContentHub[] = [
  {
    hubSlug: 'repairs-and-fixes',
    title: 'Repairs & Fixes',
    categoryLabel: 'Repairs & Fixes',
    pillarSlug: 'first-time-homeowner-repair-handbook',
    pillarRoute: 'guide',
    description:
      'Drywall holes, dripping faucets, dead outlets, sticking doors: what common home repairs involve, what you can safely do yourself, and when to call a pro.',
    priorityTier: 1,
    serviceSlugs: ['drywall-repair', 'plumbing-repairs', 'electrical-repairs', 'carpentry-trim-repair'],
  },
  {
    hubSlug: 'installs-and-upgrades',
    title: 'Installs & Upgrades',
    categoryLabel: 'Installs & Upgrades',
    pillarSlug: 'small-home-upgrades-that-pay-off',
    pillarRoute: 'guide',
    description:
      'TV mounting, shelving, ceiling fans, fresh paint, new fixtures: small installs and upgrades that improve a house in an afternoon instead of a renovation.',
    priorityTier: 2,
    serviceSlugs: ['mounting-assembly', 'painting-touch-ups', 'carpentry-trim-repair', 'electrical-repairs'],
  },
  {
    hubSlug: 'home-maintenance',
    title: 'Home Maintenance',
    categoryLabel: 'Home Maintenance',
    pillarSlug: 'boise-home-maintenance-guide',
    pillarRoute: 'guide',
    description:
      'Season-by-season upkeep for Treasure Valley homes: caulking, weatherstripping, gutter cleaning, and the small tasks that prevent expensive repairs.',
    priorityTier: 1,
    serviceSlugs: ['home-maintenance', 'fence-deck-gutter-repair', 'plumbing-repairs'],
  },
  {
    hubSlug: 'costs-and-hiring',
    title: 'Costs & Hiring',
    categoryLabel: 'Costs & Hiring',
    pillarSlug: 'boise-home-repair-cost-guide',
    pillarRoute: 'guide',
    description:
      'What small home repairs cost in the Boise area, how handyman pricing works, how to vet who you hire, and when a job needs a licensed trade instead.',
    priorityTier: 1,
    serviceSlugs: ['drywall-repair', 'plumbing-repairs', 'electrical-repairs', 'home-maintenance'],
  },
  {
    hubSlug: 'exterior-and-outdoor',
    title: 'Exterior & Outdoor',
    categoryLabel: 'Exterior & Outdoor',
    pillarSlug: 'treasure-valley-exterior-home-care-guide',
    pillarRoute: 'guide',
    description:
      'Fences, decks, gutters, siding, and exterior paint: keeping the outside of a Treasure Valley home sound through hot, dry summers and freezing winters.',
    priorityTier: 2,
    serviceSlugs: ['fence-deck-gutter-repair', 'painting-touch-ups', 'home-maintenance'],
  },
];

export const TREASURE_VALLEY_CITIES = [
  'Boise',
  'Meridian',
  'Eagle',
  'Kuna',
  'Star',
  'Middleton',
  'Nampa',
  'Caldwell',
] as const;

function hubPillar(hubSlug: string): Pick<ContentManifestEntry, 'hubSlug' | 'contentType' | 'route'> {
  const hub = CONTENT_HUBS.find((h) => h.hubSlug === hubSlug)!;
  return {
    hubSlug,
    contentType: 'pillar',
    route: hub.pillarRoute,
  };
}

function guide(
  slug: string,
  title: string,
  hubSlug: string,
  contentType: ContentType,
  status: ContentStatus = PUBLISHED,
): ContentManifestEntry {
  const hub = CONTENT_HUBS.find((h) => h.hubSlug === hubSlug)!;
  return {
    slug,
    title,
    hubSlug,
    contentType,
    route: 'guide',
    status,
  };
}

/**
 * Full content manifest.
 *
 * `replacesSlug` records the home-building page a handyman page inherits from,
 * where one existed. It is documentation of the migration, not a redirect
 * source - redirects live in shared/content/contentRedirects.js, because many
 * retired slugs have no successor of their own and point at a hub instead.
 *
 * Cluster (blog) entries are intentionally not listed here yet: the wave2 blog
 * library is being rewritten for handyman scope in parallel and its slugs are
 * still settling. Pillar pages hide their "go deeper" cluster block when a hub
 * has no published clusters, so nothing breaks in the meantime. Re-add cluster
 * entries from shared/content/wave2 once that rewrite lands.
 */
export const CONTENT_MANIFEST: ContentManifestEntry[] = [
  // Hub pillars
  { slug: 'boise-home-repair-cost-guide', title: 'Boise Home Repair Cost Guide', ...hubPillar('costs-and-hiring'), status: PUBLISHED, replacesSlug: 'boise-home-building-cost-guide' },
  { slug: 'hire-a-handyman-treasure-valley', title: 'How to Hire a Handyman in the Treasure Valley', hubSlug: 'costs-and-hiring', contentType: 'pillar', route: 'guide', status: PUBLISHED, replacesSlug: 'choose-home-builder-boise' },
  { slug: 'boise-home-maintenance-guide', title: 'The Complete Boise Home Maintenance Guide', ...hubPillar('home-maintenance'), status: PUBLISHED, replacesSlug: 'boise-home-building-process-guide' },
  { slug: 'small-home-upgrades-that-pay-off', title: 'Small Home Upgrades That Pay Off', ...hubPillar('installs-and-upgrades'), status: PUBLISHED, replacesSlug: 'custom-home-design-guide' },
  { slug: 'first-time-homeowner-repair-handbook', title: "The First-Time Homeowner's Repair Handbook", ...hubPillar('repairs-and-fixes'), status: PUBLISHED, replacesSlug: 'buying-land-to-build-boise' },
  { slug: 'treasure-valley-exterior-home-care-guide', title: 'The Treasure Valley Exterior Home Care Guide', ...hubPillar('exterior-and-outdoor'), status: PUBLISHED, replacesSlug: 'treasure-valley-home-building-guide' },

  // City and neighborhood handyman guides (under costs-and-hiring: local
  // hiring intent is what a "handyman in {city}" search expresses).
  guide('boise-handyman-guide', 'Handyman Services in Boise', 'costs-and-hiring', 'location', PUBLISHED),
  guide('meridian-handyman-guide', 'Handyman Services in Meridian', 'costs-and-hiring', 'location', PUBLISHED),
  guide('eagle-handyman-guide', 'Handyman Services in Eagle', 'costs-and-hiring', 'location', PUBLISHED),
  guide('kuna-handyman-guide', 'Handyman Services in Kuna', 'costs-and-hiring', 'location', PUBLISHED),
  guide('star-handyman-guide', 'Handyman Services in Star', 'costs-and-hiring', 'location', PUBLISHED),
  guide('middleton-handyman-guide', 'Handyman Services in Middleton', 'costs-and-hiring', 'location', PUBLISHED),
  guide('nampa-handyman-guide', 'Handyman Services in Nampa', 'costs-and-hiring', 'location', PUBLISHED),
  guide('caldwell-handyman-guide', 'Handyman Services in Caldwell', 'costs-and-hiring', 'location', PUBLISHED),
  guide('eagle-foothills-handyman-guide', 'Handyman Services in the Eagle Foothills', 'costs-and-hiring', 'neighborhood', PUBLISHED),
  guide('hidden-springs-handyman-guide', 'Handyman Services in Hidden Springs', 'costs-and-hiring', 'neighborhood', PUBLISHED),
  guide('harris-ranch-handyman-guide', 'Handyman Services in Harris Ranch', 'costs-and-hiring', 'neighborhood', PUBLISHED),

  // Blog cluster posts (wave2), restored after the handyman rewrite settled.
  { slug: 'ada-vs-canyon-county-permit-timelines', title: 'Ada vs Canyon County: Permits for Small Home Projects', hubSlug: 'costs-and-hiring', contentType: 'cluster', route: 'blog', status: PUBLISHED, primaryKeyword: 'do small home repairs need a permit in Idaho' },
  { slug: 'aging-in-place-home-design', title: 'Aging in Place: Small Home Modifications That Matter Most', hubSlug: 'installs-and-upgrades', contentType: 'cluster', route: 'blog', status: PUBLISHED, primaryKeyword: 'aging in place home modifications' },
  { slug: 'boise-building-permit-guide', title: 'Do Home Repairs Need a Permit in Boise? A Practical Guide', hubSlug: 'costs-and-hiring', contentType: 'cluster', route: 'blog', status: PUBLISHED, primaryKeyword: 'do home repairs need a permit in Boise' },
  { slug: 'caulking-guide-boise-homes', title: 'The Caulking Guide for Boise Homes: What, Where, and How Often', hubSlug: 'home-maintenance', contentType: 'cluster', route: 'blog', status: PUBLISHED, primaryKeyword: 'caulking guide home' },
  { slug: 'common-toilet-problems-and-fixes', title: 'Fixing Common Toilet Problems: Running, Rocking, and Leaks', hubSlug: 'repairs-and-fixes', contentType: 'cluster', route: 'blog', status: PUBLISHED, primaryKeyword: 'toilet repair boise' },
  { slug: 'deck-maintenance-boise', title: 'Deck Maintenance in Boise: The Annual Rhythm That Saves Your Deck', hubSlug: 'exterior-and-outdoor', contentType: 'cluster', route: 'blog', status: PUBLISHED, primaryKeyword: 'deck maintenance Boise' },
  { slug: 'diy-vs-hiring-a-handyman', title: 'DIY vs Hiring a Handyman: When Each Actually Makes Sense', hubSlug: 'costs-and-hiring', contentType: 'cluster', route: 'blog', status: PUBLISHED, primaryKeyword: 'DIY vs hiring a handyman' },
  { slug: 'drywall-repair-cost-boise', title: 'Drywall Repair Cost in Boise: What Patches Really Run', hubSlug: 'costs-and-hiring', contentType: 'cluster', route: 'blog', status: PUBLISHED, primaryKeyword: 'drywall repair cost Boise' },
  { slug: 'energy-saving-home-fixes-boise', title: 'Energy-Saving Fixes a Handyman Can Do in an Afternoon', hubSlug: 'home-maintenance', contentType: 'cluster', route: 'blog', status: PUBLISHED, primaryKeyword: 'energy saving home fixes' },
  { slug: 'fence-repair-treasure-valley', title: 'Fence Repair in the Treasure Valley: Posts, Panels, and Gates', hubSlug: 'exterior-and-outdoor', contentType: 'cluster', route: 'blog', status: PUBLISHED, primaryKeyword: 'fence repair treasure valley' },
  { slug: 'fixing-squeaky-floors-and-sticking-doors', title: 'Fixing Squeaky Floors and Sticking Doors in Boise Homes', hubSlug: 'repairs-and-fixes', contentType: 'cluster', route: 'blog', status: PUBLISHED, primaryKeyword: 'fix squeaky floors sticking doors' },
  { slug: 'gutter-cleaning-schedule-boise', title: 'Gutter Cleaning Schedule for Boise Homes', hubSlug: 'home-maintenance', contentType: 'cluster', route: 'blog', status: PUBLISHED, primaryKeyword: 'gutter cleaning boise' },
  { slug: 'handyman-prices-boise', title: 'What a Handyman Costs in Boise (2026)', hubSlug: 'costs-and-hiring', contentType: 'cluster', route: 'blog', status: PUBLISHED, primaryKeyword: 'handyman cost Boise' },
  { slug: 'handyman-red-flags', title: 'Handyman Red Flags: How to Avoid Hiring the Wrong One', hubSlug: 'costs-and-hiring', contentType: 'cluster', route: 'blog', status: PUBLISHED, primaryKeyword: 'handyman red flags' },
  { slug: 'handyman-vs-contractor', title: 'Handyman vs Contractor: Which Does Your Job Need?', hubSlug: 'costs-and-hiring', contentType: 'cluster', route: 'blog', status: PUBLISHED, primaryKeyword: 'handyman vs contractor' },
  { slug: 'home-maintenance-budget-idaho', title: 'How to Budget for Home Maintenance in Idaho', hubSlug: 'costs-and-hiring', contentType: 'cluster', route: 'blog', status: PUBLISHED, primaryKeyword: 'home maintenance budget' },
  { slug: 'home-repairs-before-selling-boise', title: 'Home Repairs Worth Making Before Selling Your Boise House', hubSlug: 'repairs-and-fixes', contentType: 'cluster', route: 'blog', status: PUBLISHED, primaryKeyword: 'home repairs before selling' },
  { slug: 'hourly-rate-vs-flat-rate-handyman', title: 'Hourly Rate vs Flat Rate: How Handyman Pricing Works', hubSlug: 'costs-and-hiring', contentType: 'cluster', route: 'blog', status: PUBLISHED, primaryKeyword: 'handyman hourly rate vs flat rate' },
  { slug: 'how-long-do-common-home-repairs-take', title: 'How Long Do Common Home Repairs Take?', hubSlug: 'repairs-and-fixes', contentType: 'cluster', route: 'blog', status: PUBLISHED, primaryKeyword: 'how long do home repairs take' },
  { slug: 'how-to-budget-home-repairs-boise', title: 'How to Budget a Home Repair Punch List in Boise', hubSlug: 'costs-and-hiring', contentType: 'cluster', route: 'blog', status: PUBLISHED, primaryKeyword: 'home repair budget' },
  { slug: 'how-to-compare-handyman-quotes', title: 'How to Compare Handyman Quotes', hubSlug: 'costs-and-hiring', contentType: 'cluster', route: 'blog', status: PUBLISHED, primaryKeyword: 'compare handyman quotes' },
  { slug: 'how-to-patch-drywall', title: 'How to Patch Drywall Like a Pro (and When to Call One)', hubSlug: 'repairs-and-fixes', contentType: 'cluster', route: 'blog', status: PUBLISHED, primaryKeyword: 'how to patch drywall' },
  { slug: 'interior-paint-touch-up-guide', title: 'Interior Paint Touch-Up Guide: Blending Without Repainting', hubSlug: 'repairs-and-fixes', contentType: 'cluster', route: 'blog', status: PUBLISHED, primaryKeyword: 'interior paint touch up' },
  { slug: 'new-home-punch-list-handyman', title: 'New-Home Punch List: What a Handyman Fixes After You Move In', hubSlug: 'home-maintenance', contentType: 'cluster', route: 'blog', status: PUBLISHED, primaryKeyword: 'new home punch list handyman' },
  { slug: 'preparing-your-boise-home-for-winter', title: 'Preparing Your Boise Home for Winter: The Checklist That Matters', hubSlug: 'home-maintenance', contentType: 'cluster', route: 'blog', status: PUBLISHED, primaryKeyword: 'winterize home Boise' },
  { slug: 'questions-to-ask-a-handyman', title: 'Questions to Ask a Handyman Before You Book', hubSlug: 'costs-and-hiring', contentType: 'cluster', route: 'blog', status: PUBLISHED, primaryKeyword: 'questions to ask a handyman' },
  { slug: 'replacing-faucets-and-fixtures', title: 'Replacing Faucets and Fixtures: A Homeowner Guide', hubSlug: 'installs-and-upgrades', contentType: 'cluster', route: 'blog', status: PUBLISHED, primaryKeyword: 'faucet replacement boise' },
  { slug: 'seasonal-home-maintenance-checklist-boise', title: 'Seasonal Home Maintenance Checklist for Boise Homes', hubSlug: 'home-maintenance', contentType: 'cluster', route: 'blog', status: PUBLISHED, primaryKeyword: 'seasonal home maintenance checklist' },
  { slug: 'small-home-upgrade-ideas-boise', title: 'Small Home Upgrade Ideas That Refresh a Room in a Day', hubSlug: 'installs-and-upgrades', contentType: 'cluster', route: 'blog', status: PUBLISHED, primaryKeyword: 'small home upgrade ideas' },
  { slug: 'tv-mounting-and-anchoring-guide', title: 'TV Mounting and Anchoring Guide for Boise Homes', hubSlug: 'installs-and-upgrades', contentType: 'cluster', route: 'blog', status: PUBLISHED, primaryKeyword: 'tv mounting boise' },
  { slug: 'what-small-home-repairs-cost-boise', title: 'What Small Home Repairs Cost in Boise', hubSlug: 'costs-and-hiring', contentType: 'cluster', route: 'blog', status: PUBLISHED, primaryKeyword: 'small home repair cost boise' },
  { slug: 'what-to-expect-first-handyman-visit', title: 'What to Expect at Your First Handyman Visit', hubSlug: 'costs-and-hiring', contentType: 'cluster', route: 'blog', status: PUBLISHED, primaryKeyword: 'what to expect handyman visit' },
  { slug: 'who-supplies-materials-handyman-jobs', title: 'Who Supplies Materials on a Handyman Job?', hubSlug: 'costs-and-hiring', contentType: 'cluster', route: 'blog', status: PUBLISHED, primaryKeyword: 'who supplies materials handyman job' },
  { slug: 'why-handyman-quotes-vary', title: 'Why Handyman Quotes Vary So Much', hubSlug: 'costs-and-hiring', contentType: 'cluster', route: 'blog', status: PUBLISHED, primaryKeyword: 'why handyman quotes vary' },
];

export function getHubBySlug(hubSlug: string): ContentHub | undefined {
  return CONTENT_HUBS.find((h) => h.hubSlug === hubSlug);
}

export function getManifestBySlug(slug: string): ContentManifestEntry | undefined {
  return CONTENT_MANIFEST.find((e) => e.slug === slug);
}

export function getPublishedManifest(route?: ContentRoute): ContentManifestEntry[] {
  return CONTENT_MANIFEST.filter(
    (e) => e.status === 'published' && (route === undefined || e.route === route),
  );
}

export function getClustersForHub(hubSlug: string, publishedOnly = false): ContentManifestEntry[] {
  return CONTENT_MANIFEST.filter(
    (e) =>
      e.hubSlug === hubSlug &&
      e.contentType === 'cluster' &&
      (!publishedOnly || e.status === 'published'),
  );
}

export function getHubPillarSlug(hubSlug: string): string {
  return getHubBySlug(hubSlug)?.pillarSlug ?? '';
}

export function guidePath(slug: string): string {
  return `/guides/${slug}`;
}

export function blogPath(slug: string): string {
  return `/blog/${slug}`;
}

export function categoryHubPath(hubSlug: string): string {
  return `/blog/category/${hubSlug}`;
}

/** Minimum published cluster count before category hub is indexable */
export const CATEGORY_HUB_MIN_POSTS = 3;

export function isCategoryHubIndexable(hubSlug: string, publishedClusterCount: number): boolean {
  return publishedClusterCount >= CATEGORY_HUB_MIN_POSTS;
}
