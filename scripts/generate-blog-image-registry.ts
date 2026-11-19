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
const house = (name: string) => `/images/houses/kuna/${name}.webp`;

const LIBRARY = {
  // Added 19 November 2026 so posts that sat side by side in a list stop sharing one photograph.
  drywallPatch: {
    src: house('kuna-drywall-patch'),
    alt: 'A square drywall patch with fresh joint compound framed in blue tape, with a taping knife on a drop cloth',
  },
  underSink: {
    src: img('under-sink-plumbing'),
    alt: 'Open sink cabinet showing the drain trap and supply lines, with a tool bag and a drill on the floor',
  },
  doorWork: {
    src: img('hero-door-repair'),
    alt: 'A white interior door standing open, with a tool bag, a drill and hinges on a drop cloth',
  },
  doorLock: {
    src: img('door-lock-keypad'),
    alt: 'A black entry door with a keypad deadbolt and a lever handle',
  },
  hingeShims: {
    src: img('door-hinge-shims'),
    alt: 'A white interior door at its hinge, with a screwdriver, shims and screws on a cloth below',
  },
  shelfInstall: {
    src: img('floating-shelf-install'),
    alt: 'A floating oak shelf mounted on a wall, with a drill, a level and a tape measure on a drop cloth',
  },
  cabinetPulls: {
    src: img('cabinet-pulls-installed'),
    alt: 'White shaker cabinet drawers and doors with black bar pulls',
  },
  baseboard: {
    src: img('baseboard-new-length'),
    alt: 'A new length of white baseboard leaning against a wall above a wood floor',
  },
  baseboardCaulk: {
    src: img('baseboard-caulk-tools'),
    alt: 'White baseboard along a wood floor, with a hammer and a caulk gun on a drop cloth',
  },
  caulkGap: {
    src: img('caulk-baseboard-gap'),
    alt: 'A caulk gun, painter’s tape and a rag beside white baseboard on a wood floor',
  },
  fenceBoards: {
    src: img('fence-and-deck-boards'),
    alt: 'A cedar privacy fence with new pickets and a deck with replaced boards, with a drill on the deck',
  },
  tvShelves: {
    src: img('tv-and-shelves-mounted'),
    alt: 'A wall-mounted television above an oak media console, with two floating shelves and a level',
  },
  paintWall: {
    src: img('paint-wall-first-coat'),
    alt: 'A bedroom wall partly rolled with a first coat of white paint over a drop cloth',
  },
  porch: {
    src: img('front-porch-door'),
    alt: 'A covered front porch with a wood entry door, white lap siding and a wood railing',
  },
  gutterLeaves: {
    src: house('kuna-gutter-cleaning'),
    alt: 'White gutter with autumn leaves at the eave of a beige Kuna single-storey home',
  },
  deckBoards: {
    src: house('kuna-deck-board-replacement'),
    alt: 'New deck boards going down beside a single-storey home with a wood privacy fence',
  },
  doorRepair: {
    src: img('hero-door-hinge-branded'),
    alt: 'An interior door mid-repair, with a tool bag, a drill, a level and a new hinge on a drop cloth',
  },
  gutterCleaning: {
    src: img('hero-gutter-cleaning'),
    alt: 'An extension ladder set against the gutter of a two-story house, with a bucket on the lawn below',
  },
  drywall: {
    src: img('service-drywall-repair'),
    alt: 'Hands spreading joint compound over a drywall patch with a taping knife in a bright room',
  },
  painting: {
    src: img('service-painting-p5-reviewed-20260910'),
    alt: 'Freshly painted white window trim, with a brush resting on an open paint can over a drop cloth',
  },
  plumbing: {
    src: img('service-plumbing'),
    alt: 'A new brushed-nickel kitchen faucet at a sink, with a wrench and the old faucet on the counter',
  },
  electrical: {
    src: img('service-electrical'),
    alt: 'Hands replacing a white electrical outlet with a screwdriver, faceplate and voltage tester nearby',
  },
  carpentry: {
    src: img('front-door-repaint-p5-reviewed-20260910'),
    alt: 'A freshly painted sage-green front door with white trim and black hardware',
  },
  mounting: {
    src: img('service-mounting'),
    alt: 'Handyman holding a bubble level and drill while installing a TV wall-mount bracket in a living room',
  },
  fence: {
    src: img('service-fence-repair'),
    alt: 'Three new cedar pickets screwed onto a weathered fence, with a drill and a box of screws on the grass',
  },
  caulking: {
    src: img('service-caulking'),
    alt: 'Caulk gun applying a clean white silicone bead where a bathtub meets white subway tile',
  },
  consult: {
    src: img('consult-doorstep-branded'),
    alt: 'A canvas tool bag and a cordless drill on the front step beside a wood front door',
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
    alt: "A clipboard with a blank work-order form, a carpenter's pencil, a tape measure and a small level on a kitchen table",
  },
  deck: {
    src: img('deck-board-replacement'),
    alt: 'A new cedar deck board fastened beside an open gap in a weathered deck, with a drill and screws',
  },
  winterSpigot: {
    src: img('winterize-spigot'),
    alt: 'An insulated faucet cover fitted over an outdoor hose spigot, with frost on the grass',
  },
  hinge: {
    src: img('door-hinge-fix'),
    alt: 'A door hinge at the edge of a white interior door, with a screwdriver, shims and screws on a cloth below',
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
    src: img('front-door-repaint-p5-reviewed-20260910'),
    alt: 'A freshly painted sage-green front door with white trim and black hardware',
  },
  permits: {
    src: img('permit-paperwork'),
    alt: 'Permit paperwork and folded residential drawings on a municipal counter with a hand holding a pen',
  },
  boiseArea: {
    src: area('boise'),
    alt: 'A tree-lined street of two-story homes with a brush-covered hillside rising behind',
  },
  meridianArea: {
    src: area('meridian'),
    alt: 'A two-story white stucco home with dark siding, a two-car garage and a front lawn',
  },
  eagleArea: {
    src: area('eagle'),
    alt: 'A single-story white stucco home with a dark metal roof at dusk, set among gravel beds and ornamental grasses',
  },
  kunaArea: {
    // The Kuna area page hero, so the guide and the area page show one house.
    src: '/images/houses/kuna/kuna-single-storey-front.webp',
    alt: 'Beige single-storey home in Kuna with white trim, two-car garage and open fields beyond',
  },
  starArea: {
    src: area('star'),
    alt: 'A dark-sided two-story home with a covered patio on a lawn beside a tree-lined river',
  },
  middletonArea: {
    src: area('middleton'),
    alt: 'A white single-story home with an attached garage and a gravel drive, with farm fields and low hills behind',
  },
  nampaArea: {
    src: area('nampa'),
    alt: 'A single-story ranch house with tan siding, a brick base and a single garage, behind a bare shade tree',
  },
  caldwellArea: {
    // caldwell.webp is a Tuscan-style villa among vineyards, not a Treasure
    // Valley house. The guide uses the Caldwell area page hero instead (the
    // single-story home on sagebrush ground that no other city page shows),
    // with alt text that describes it rather than placing it.
    src: area('kuna'),
    alt: 'A single-story stucco home with a dark metal roof and a wood-clad entry, with sagebrush in front and mountains beyond',
  },
  // Added 19 November 2026 (every-page sweep): the generator had drifted from the
  // registry, which already gave these two guides their own street photographs.
  hiddenSpringsArea: {
    src: area('boise-hidden-springs'),
    alt: 'White two-story homes with covered porches on a street below a green hillside',
  },
  harrisRanchArea: {
    src: area('boise-harris-ranch'),
    alt: 'Two-story homes with grey lap siding and small covered entries below a dry foothill',
  },
  // A foothills photograph so the Eagle and Eagle Foothills guides stop sharing one picture.
  eagleFoothillsArea: {
    src: area('eagle-foothills'),
    alt: 'A small dark-sided single-story home with a metal roof and a wood door, set among sagebrush below dry foothills',
  },
} as const;

type LibraryKey = keyof typeof LIBRARY;

/**
 * Fallback per hub, used for any slug without an explicit assignment.
 *
 * Phase 3: the tool-bag photo is the RE-10 page's one image, so it no longer
 * heads a guide, a post or a blog category; those slots use library shots
 * that suit the topic and that the template around them does not already
 * show. Image descriptions stay factual without company-project claims.
 */
const HUB_DEFAULT: Record<string, LibraryKey> = {
  'repairs-and-fixes': 'electrical',
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
  'how-to-patch-drywall': 'drywallPatch',
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
  'seasonal-home-maintenance-checklist-boise': 'deckBoards',
  'preparing-your-boise-home-for-winter': 'winterSpigot',
  'energy-saving-home-fixes-boise': 'weatherstrip',
  'gutter-cleaning-schedule-boise': 'gutterCleaning',
  'new-home-punch-list-handyman': 'punchList',

  // Costs & hiring
  'handyman-prices-boise': 'estimate',
  'what-small-home-repairs-cost-boise': 'doorLock',
  'drywall-repair-cost-boise': 'drywall',
  'why-handyman-quotes-vary': 'underSink',
  'how-to-compare-handyman-quotes': 'materials',
  'hourly-rate-vs-flat-rate-handyman': 'doorWork',
  'how-to-budget-home-repairs-boise': 'caulkGap',
  'home-maintenance-budget-idaho': 'baseboardCaulk',
  'questions-to-ask-a-handyman': 'shelfInstall',
  'handyman-red-flags': 'hingeShims',
  'handyman-vs-contractor': 'baseboard',
  'what-to-expect-first-handyman-visit': 'porch',
  'diy-vs-hiring-a-handyman': 'paintWall',
  'who-supplies-materials-handyman-jobs': 'fenceBoards',
  'ada-vs-canyon-county-permit-timelines': 'nampaArea',
  'boise-building-permit-guide': 'permits',

  // Exterior & outdoor
  'fence-repair-treasure-valley': 'fence',
  'deck-maintenance-boise': 'deck',

  // Pillar guides
  'boise-home-repair-cost-guide': 'materials',
  'hire-a-handyman-treasure-valley': 'consult',
  'boise-home-maintenance-guide': 'caulking',
  'small-home-upgrades-that-pay-off': 'cabinetPulls',
  'first-time-homeowner-repair-handbook': 'doorRepair',
  'treasure-valley-exterior-home-care-guide': 'gutterLeaves',

  // Location guides - each place keeps a locally specific streetscape hero.
  'boise-handyman-guide': 'boiseArea',
  'meridian-handyman-guide': 'meridianArea',
  'eagle-handyman-guide': 'eagleArea',
  'kuna-handyman-guide': 'kunaArea',
  'star-handyman-guide': 'starArea',
  'middleton-handyman-guide': 'middletonArea',
  'nampa-handyman-guide': 'nampaArea',
  'caldwell-handyman-guide': 'caldwellArea',
  'eagle-foothills-handyman-guide': 'eagleFoothillsArea',
  'hidden-springs-handyman-guide': 'hiddenSpringsArea',
  'harris-ranch-handyman-guide': 'harrisRanchArea',
};

/**
 * Category page heroes. Kept apart from HUB_DEFAULT (19 November 2026): a
 * category page lists its posts, and a hero shared with one of those cards
 * showed the same photograph twice on the page.
 */
const HUB_HERO: Record<string, LibraryKey> = {
  ...HUB_DEFAULT,
  'costs-and-hiring': 'consult',
  'home-maintenance': 'gutterLeaves',
  'installs-and-upgrades': 'cabinetPulls',
};

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
