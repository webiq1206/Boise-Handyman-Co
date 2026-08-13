/**
 * Generates shared/blogImageRegistry.ts from the content layer.
 *
 * The previous version of this script hard-coded a slug-to-image map that had
 * to be edited by hand every time a post was added, which is how it ended up
 * describing a set of articles that no longer existed. This one reads the
 * actual posts and guides and assigns each an image by topic, so the registry
 * cannot drift from the content again.
 *
 * Assignment is by explicit slug override first, then by hub. Several posts
 * legitimately share an image: there are more articles than there are distinct
 * things worth photographing about building a house, and a topically correct
 * shared photograph is better than a unique wrong one. verify:images reports
 * shared heroes as a quality note rather than an error for that reason.
 *
 * Run: npx tsx scripts/generate-blog-image-registry.ts
 */
import fs from 'fs';
import path from 'path';
import { BLOG_POSTS } from '../shared/blogContent';
import { GUIDE_PAGES } from '../shared/guideContent';
import { CONTENT_HUBS } from '../shared/contentHubs';

const root = path.join(__dirname, '..');

const img = (name: string) => `/images/handyman/${name}.webp`;
const area = (name: string) => `/images/areas/${name}.webp`;

/** The handyman image library, with the alt text each image warrants. */
const LIBRARY = {
  doorRepair: {
    src: img('hero-door-repair'),
    alt: 'Handyman adjusting a sticking white interior door in a bright Idaho home with a tool bag on a drop cloth nearby',
  },
  gutterCleaning: {
    src: img('hero-gutter-cleaning'),
    alt: 'Worker on a ladder clearing autumn leaves from the rain gutter of a single-story suburban Boise home',
  },
  drywall: {
    src: img('service-drywall-repair'),
    alt: 'Hands spreading joint compound over a drywall patch with a taping knife in a bright room',
  },
  painting: {
    src: img('service-painting'),
    alt: 'Painter cutting in crisp paint along white window trim with an angled brush and painter\'s tape',
  },
  plumbing: {
    src: img('service-plumbing'),
    alt: 'Hands installing a new brushed-nickel kitchen faucet with supply lines and a wrench at a farmhouse sink',
  },
  electrical: {
    src: img('service-electrical'),
    alt: 'Hands replacing a white electrical outlet with a screwdriver, faceplate and voltage tester nearby',
  },
  carpentry: {
    src: img('service-carpentry-trim'),
    alt: 'Carpenter fitting a new piece of white baseboard trim along a wood floor in a modern home',
  },
  mounting: {
    src: img('service-mounting'),
    alt: 'Handyman holding a bubble level and drill while installing a TV wall-mount bracket in a living room',
  },
  fence: {
    src: img('service-fence-repair'),
    alt: 'Gloved hands screwing a new cedar picket onto a backyard fence rail with a cordless drill',
  },
  caulking: {
    src: img('service-caulking'),
    alt: 'Caulk gun applying a clean white silicone bead where a bathtub meets white subway tile',
  },
  consult: {
    src: img('consult-doorstep'),
    alt: 'Handyman reviewing a small-job checklist on a clipboard with a homeowner at their front door',
  },
  toolbag: {
    src: img('toolbag-ready'),
    alt: 'Neatly organized canvas tool bag with drill, levels, and tape measure staged on a drop cloth in a living room',
  },
  toilet: {
    src: img('toilet-repair'),
    alt: 'Plumber lifting the porcelain lid off a toilet tank to service the fill valve in a clean bathroom',
  },
  weatherstrip: {
    src: img('weatherstripping'),
    alt: 'Hands applying self-adhesive foam weatherstripping to a white exterior door frame to seal drafts',
  },
  grabBar: {
    src: img('grab-bar-install'),
    alt: 'Brushed nickel safety grab bar freshly installed on white subway tile in a walk-in shower',
  },
  hardware: {
    src: img('cabinet-hardware-upgrade'),
    alt: 'Hands swapping new brushed brass knobs onto white shaker kitchen cabinet doors with a screwdriver',
  },
  estimate: {
    src: img('estimate-clipboard'),
    alt: 'Clipboard with estimate paper, calculator, pencil, and tape measure arranged on a wood kitchen table',
  },
  deck: {
    src: img('deck-board-replacement'),
    alt: 'Gloved hands replacing a weathered deck board with a new cedar board on a backyard deck',
  },
  winterSpigot: {
    src: img('winterize-spigot'),
    alt: 'Insulated faucet cover being fitted over an outdoor hose spigot with frost on the grass',
  },
  hinge: {
    src: img('door-hinge-fix'),
    alt: 'Hand tightening the hinge screws of a white interior door with a screwdriver',
  },
  punchList: {
    src: img('punch-list-markers'),
    alt: 'Blue painter\'s tape markers on a wall and window trim marking touch-up spots, notepad on the windowsill',
  },
  materials: {
    src: img('repair-materials'),
    alt: 'Assorted screws, wall anchors, and picture hangers organized in a small parts tray on a workbench',
  },
  frontDoor: {
    src: img('front-door-repaint'),
    alt: 'Freshly repainted sage green craftsman front door with painter\'s tape being peeled away',
  },
  permits: {
    src: img('permit-paperwork'),
    alt: 'Permit paperwork and folded residential drawings on a municipal counter with a hand holding a pen',
  },
  boiseArea: {
    src: area('boise'),
    alt: 'Established Boise, Idaho neighborhood of craftsman homes with covered porches and the Boise foothills rising behind the street',
  },
  meridianArea: {
    src: area('meridian'),
    alt: 'Craftsman two-story home lit at dusk on a landscaped subdivision lot in Meridian, Idaho',
  },
  eagleArea: {
    src: area('eagle'),
    alt: 'Custom home on a landscaped Eagle, Idaho acreage lot at sunset with the foothills in the distance',
  },
  kunaArea: {
    src: area('kuna'),
    alt: 'Modern farmhouse home on rural Kuna, Idaho acreage bordered by sagebrush and open farmland',
  },
  starArea: {
    src: area('star'),
    alt: 'Riverfront home in Star, Idaho with a lawn running down to the Boise River and shade trees along the bank',
  },
  middletonArea: {
    src: area('middleton'),
    alt: 'White farmhouse with a wraparound porch on a Middleton, Idaho parcel surrounded by wheat fields at sunset',
  },
  nampaArea: {
    src: area('nampa'),
    alt: 'Established brick ranch home on a landscaped corner lot in Nampa, Idaho with farmland behind',
  },
  caldwellArea: {
    src: area('caldwell'),
    alt: 'Stucco home overlooking the vineyards of the Sunnyslope wine district near Caldwell, Idaho at sunset',
  },
} as const;

type LibraryKey = keyof typeof LIBRARY;

/** Fallback per hub, used for any slug without an explicit assignment. */
const HUB_DEFAULT: Record<string, LibraryKey> = {
  'repairs-and-fixes': 'toolbag',
  'installs-and-upgrades': 'mounting',
  'home-maintenance': 'caulking',
  'costs-and-hiring': 'estimate',
  'exterior-and-outdoor': 'gutterCleaning',
};

/**
 * Slug-level assignments. Anything not listed here falls back to its hub
 * default, which is why only the posts with a genuinely better-matched image
 * need to appear.
 */
const BY_SLUG: Record<string, LibraryKey> = {
  // Repairs & fixes
  'how-to-patch-drywall': 'drywall',
  'interior-paint-touch-up-guide': 'painting',
  'common-toilet-problems-and-fixes': 'toilet',
  'fixing-squeaky-floors-and-sticking-doors': 'hinge',
  'how-long-do-common-home-repairs-take': 'doorRepair',
  'home-repairs-before-selling-boise': 'frontDoor',

  // Installs & upgrades
  'tv-mounting-and-anchoring-guide': 'mounting',
  'replacing-faucets-and-fixtures': 'plumbing',
  'small-home-upgrade-ideas-boise': 'hardware',
  'aging-in-place-home-design': 'grabBar',

  // Home maintenance
  'caulking-guide-boise-homes': 'caulking',
  'seasonal-home-maintenance-checklist-boise': 'toolbag',
  'preparing-your-boise-home-for-winter': 'winterSpigot',
  'energy-saving-home-fixes-boise': 'weatherstrip',
  'gutter-cleaning-schedule-boise': 'gutterCleaning',
  'new-home-punch-list-handyman': 'punchList',

  // Costs & hiring
  'handyman-prices-boise': 'estimate',
  'what-small-home-repairs-cost-boise': 'materials',
  'drywall-repair-cost-boise': 'drywall',
  'why-handyman-quotes-vary': 'estimate',
  'how-to-compare-handyman-quotes': 'estimate',
  'hourly-rate-vs-flat-rate-handyman': 'estimate',
  'how-to-budget-home-repairs-boise': 'materials',
  'home-maintenance-budget-idaho': 'estimate',
  'questions-to-ask-a-handyman': 'consult',
  'handyman-red-flags': 'consult',
  'handyman-vs-contractor': 'toolbag',
  'what-to-expect-first-handyman-visit': 'consult',
  'diy-vs-hiring-a-handyman': 'toolbag',
  'who-supplies-materials-handyman-jobs': 'materials',
  'ada-vs-canyon-county-permit-timelines': 'permits',
  'boise-building-permit-guide': 'permits',

  // Exterior & outdoor
  'fence-repair-treasure-valley': 'fence',
  'deck-maintenance-boise': 'deck',

  // Pillar guides
  'boise-home-repair-cost-guide': 'estimate',
  'hire-a-handyman-treasure-valley': 'consult',
  'boise-home-maintenance-guide': 'toolbag',
  'small-home-upgrades-that-pay-off': 'hardware',
  'first-time-homeowner-repair-handbook': 'doorRepair',
  'treasure-valley-exterior-home-care-guide': 'gutterCleaning',

  // Location guides - each place keeps a locally specific streetscape hero.
  'boise-handyman-guide': 'boiseArea',
  'meridian-handyman-guide': 'meridianArea',
  'eagle-handyman-guide': 'eagleArea',
  'kuna-handyman-guide': 'kunaArea',
  'star-handyman-guide': 'starArea',
  'middleton-handyman-guide': 'middletonArea',
  'nampa-handyman-guide': 'nampaArea',
  'caldwell-handyman-guide': 'caldwellArea',
  'eagle-foothills-handyman-guide': 'eagleArea',
  'hidden-springs-handyman-guide': 'boiseArea',
  'harris-ranch-handyman-guide': 'boiseArea',
};

const HUB_HERO: Record<string, LibraryKey> = HUB_DEFAULT;

interface Entry {
  hero: string;
  alt: string;
  topicTags: string[];
  hubSlug: string;
}

const entries: Record<string, Entry> = {};
const unmatched: string[] = [];

function add(slug: string, hubSlug: string, tags: string[]) {
  const key = BY_SLUG[slug] ?? HUB_DEFAULT[hubSlug];
  if (!key) {
    unmatched.push(`${slug} (hub ${hubSlug})`);
    return;
  }
  const image = LIBRARY[key];
  entries[slug] = {
    hero: image.src,
    alt: image.alt,
    // Tags are the post's own plus the hub, which is what the relevance check
    // in verify:images compares against.
    topicTags: Array.from(new Set([...tags, hubSlug.split('-')[0]])).slice(0, 5),
    hubSlug,
  };
}

for (const post of BLOG_POSTS) add(post.slug, post.hubSlug, post.tags);
for (const guide of GUIDE_PAGES) add(guide.slug, guide.hubSlug, guide.tags);

if (unmatched.length > 0) {
  console.error('No image assignment for:');
  unmatched.forEach((u) => console.error(`  - ${u}`));
  process.exit(1);
}

// Every referenced file must actually exist, or the site ships broken images.
const missing = new Set<string>();
for (const entry of Object.values(entries)) {
  const filePath = path.join(root, 'public', entry.hero.replace(/^\//, ''));
  if (!fs.existsSync(filePath)) missing.add(entry.hero);
}
for (const key of Object.values(HUB_HERO)) {
  const filePath = path.join(root, 'public', LIBRARY[key].src.replace(/^\//, ''));
  if (!fs.existsSync(filePath)) missing.add(LIBRARY[key].src);
}
if (missing.size > 0) {
  console.error('Referenced image files do not exist:');
  missing.forEach((m) => console.error(`  - ${m}`));
  process.exit(1);
}

const registryBody = Object.entries(entries)
  .map(
    ([slug, e]) => `  '${slug}': {
    hero: '${e.hero}',
    alt: '${e.alt.replace(/'/g, "\\'")}',
    topicTags: ${JSON.stringify(e.topicTags)},
    source: 'handyman',
  },`,
  )
  .join('\n');

const hubBody = CONTENT_HUBS.map(
  (h) => `  '${h.hubSlug}': '${LIBRARY[HUB_HERO[h.hubSlug]].src}',`,
).join('\n');

const ts = `/**
 * Per-slug hero imagery for blog posts and guides.
 *
 * Generated by scripts/generate-blog-image-registry.ts from the content layer.
 * Do not hand-edit. Change the assignment table in that script and re-run
 * \`npm run images:blog\`.
 */

export type BlogImageSource = 'handyman';

export interface BlogImageEntry {
  hero: string;
  thumbnail?: string;
  alt: string;
  topicTags: string[];
  source: BlogImageSource;
}

export const BLOG_IMAGE_REGISTRY: Record<string, BlogImageEntry> = {
${registryBody}
};

export const HUB_HERO_IMAGES: Record<string, string> = {
${hubBody}
};

/** Retained for the setup script's interface; nothing is copied any more. */
export const BLOG_ASSET_COPY_MAP: Record<string, string> = {};
`;

fs.writeFileSync(path.join(root, 'shared', 'blogImageRegistry.ts'), ts);
console.log(
  `Wrote blogImageRegistry.ts: ${Object.keys(entries).length} entries, ${CONTENT_HUBS.length} hub heroes.`,
);
