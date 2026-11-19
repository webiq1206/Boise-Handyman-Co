import { cityForSlug, localAlt, type LocalAltContext } from './localAlt';

/**
 * Alt text written from the photographs themselves.
 * Paths that are not listed here were not identifiable, so callers leave
 * the existing alt alone (or empty, if it was already empty).
 */
const IMAGE_ALTS: Record<string, string> = {
  '/images/handyman/hero-door-repair.webp':
    "A white interior door standing open, with a tool bag, a drill and hinges on a drop cloth",
  '/images/houses/kuna/kuna-fence-gate-latch.webp':
    "A black latch on a wood fence gate",
  '/images/houses/kuna/kuna-tv-mount.webp':
    "A television wall bracket above a television resting on the floor, with a level and a drill",
  // Added 19 November 2026 (second pass) so drywall and plumbing city pages rotate through more than two or three photographs.
  '/images/handyman/wall-prep-ladder.webp':
    "An empty room with blue tape along the baseboard, a step ladder, a paint can and a roller tray on a drop cloth",
  '/images/handyman/vanity-faucet-cabinet.webp':
    "A bathroom vanity with a black faucet beside an open recessed oak medicine cabinet",
  '/images/handyman/bathroom-vanity-faucet.webp':
    "An oak bathroom vanity with a white top and a black faucet under a black-framed mirror",
  '/images/handyman/front-porch-door.webp':
    "A covered front porch with a wood entry door, white lap siding and a wood railing",
  '/images/houses/kuna/kuna-drywall-patch.webp':
    "A square drywall patch with fresh joint compound framed in blue tape, with a taping knife on a drop cloth",
  // Added 19 November 2026 from the owner's photo folder, to widen each trade's rotation.
  '/images/handyman/paint-trim-brush.webp':
    "A paint brush resting on an open can of white paint beside a freshly painted door casing",
  '/images/handyman/paint-wall-first-coat.webp':
    "A bedroom wall partly rolled with a first coat of white paint over a drop cloth",
  '/images/handyman/paint-ceiling-roller.webp':
    "A step ladder and a paint roller on an extension pole in a room with a sloped ceiling",
  '/images/handyman/paint-room-masked.webp':
    "An empty room with blue tape along the baseboard and a drop cloth on the floor",
  '/images/handyman/under-sink-plumbing.webp':
    "Open sink cabinet showing the drain trap and supply lines, with a tool bag and a drill on the floor",
  '/images/handyman/baseboard-new-length.webp':
    "A new length of white baseboard leaning against a wall above a wood floor",
  '/images/handyman/baseboard-caulk-tools.webp':
    "White baseboard along a wood floor, with a hammer and a caulk gun on a drop cloth",
  '/images/handyman/door-hinge-shims.webp':
    "A white interior door at its hinge, with a screwdriver, shims and screws on a cloth below",
  '/images/handyman/door-lock-keypad.webp':
    "A black entry door with a keypad deadbolt and a lever handle",
  '/images/handyman/tv-and-shelves-mounted.webp':
    "A wall-mounted television above an oak media console, with two floating shelves and a level",
  '/images/handyman/entry-bench-assembled.webp':
    "An assembled oak bench against a white entry wall",
  '/images/handyman/floating-shelf-install.webp':
    "A floating oak shelf mounted on a wall, with a drill, a level and a tape measure on a drop cloth",
  '/images/handyman/cabinet-pulls-installed.webp':
    "White shaker cabinet drawers and doors with black bar pulls",
  '/images/handyman/fence-and-deck-boards.webp':
    "A cedar privacy fence with new pickets and a deck with replaced boards, with a drill on the deck",
  '/images/handyman/caulk-baseboard-gap.webp':
    "A caulk gun, painter’s tape and a rag beside white baseboard on a wood floor",
  '/images/handyman/service-drywall-repair.webp':
    'Hands spreading joint compound over a drywall patch with a taping knife',
  '/images/handyman/service-carpentry-trim-branded.webp':
    'Hands fitting white baseboard trim with a hammer during a repair',
  '/images/handyman/service-painting-p5-reviewed-20260910.webp':
    'Freshly painted white window trim, with a brush resting on an open paint can over a drop cloth',
  '/images/handyman/service-painting.webp':
    'Freshly painted white window trim, with a brush resting on an open paint can over a drop cloth',
  '/images/handyman/service-plumbing.webp':
    'A new brushed-nickel kitchen faucet at a sink, with a wrench and the old faucet on the counter',
  '/images/handyman/service-electrical.webp':
    'Hands installing a white duplex electrical outlet in an open wall box',
  '/images/handyman/electrical-gfci-outlet.webp':
    'Gloved hands fastening a white GFCI outlet into a wall box with an insulated screwdriver',
  '/images/handyman/electrical-light-switch.webp':
    'Hands setting a white rocker light switch into a wall box beside a door frame',
  '/images/handyman/electrical-ceiling-fan.webp':
    'A worker on a step ladder joining the wires of a white ceiling fan at the ceiling box',
  '/images/handyman/electrical-exterior-wall-light.webp':
    'Hands mounting a black wall light on gray lap siding beside a front door',
  '/images/handyman/service-mounting.webp':
    'A worker leveling a TV wall-mount bracket with a drill',
  '/images/handyman/service-fence-repair.webp':
    'Three new cedar pickets screwed onto a weathered fence, with a drill and a box of screws on the grass',
  '/images/handyman/service-caulking.webp':
    'A caulk gun laying a white bead where a bathtub meets subway tile',
  '/images/handyman/hero-door-hinge-branded.webp':
    'An interior door mid-repair, with a tool bag, a drill, a level and a new hinge on a drop cloth',
  '/images/handyman/toolbag-ready.webp':
    'An open canvas tool bag with a drill, level, and tape measure on a drop cloth',
  '/images/handyman/estimate-clipboard.webp':
    "A clipboard with a blank work-order form, a carpenter's pencil, a tape measure and a small level on a kitchen table",
  '/images/handyman/consult-doorstep-branded.webp':
    'A canvas tool bag and a cordless drill on the front step beside a wood front door',
  '/images/handyman/punch-list-markers.webp':
    "Blue painter's tape marking touch-up spots on a wall and window trim",
  '/images/handyman/front-door-repaint-p5-reviewed-20260910.webp':
    'A freshly painted sage-green front door with white trim and black hardware',
  '/images/handyman/front-door-repaint.webp':
    'A freshly painted sage-green front door with white trim and black hardware',
  '/images/handyman/toilet-repair.webp':
    'Hands lifting a toilet tank lid to reach the fill valve',
  '/images/handyman/repair-materials.webp':
    'Screws, wall anchors, and picture hangers sorted in a parts tray',
  '/images/handyman/door-hinge-fix.webp':
    'A door hinge at the edge of a white interior door, with a screwdriver, shims and screws on a cloth below',
  '/images/handyman/cabinet-hardware-upgrade.webp':
    'Hands installing a brushed-brass knob on a white cabinet door',
  '/images/handyman/deck-board-replacement.webp':
    'A new cedar deck board fastened beside an open gap in a weathered deck, with a drill and screws',
  '/images/handyman/hero-gutter-cleaning.webp':
    'An extension ladder set against the gutter of a two-story house, with a bucket on the lawn below',
  '/images/handyman/weatherstripping.webp':
    'Hands applying foam weatherstripping to a white exterior door frame',
  '/images/handyman/winterize-spigot.webp':
    'An insulated cover fitted over an outdoor faucet, with frost on the grass',
  '/images/handyman/grab-bar-install.webp':
    'A brushed-nickel grab bar installed on subway tile in a shower',
  '/images/areas/boise-hidden-springs.webp':
    'White two-story homes with covered porches on a street below a green hillside',
  '/images/areas/boise-harris-ranch.webp':
    'Two-story homes with grey lap siding and small covered entries below a dry foothill',
  '/images/areas/boise.webp':
    'A tree-lined street of two-story homes with a brush-covered hillside rising behind',
  '/images/areas/meridian.webp':
    'A two-story white stucco home with dark siding, a two-car garage and a front lawn',
  '/images/areas/eagle.webp':
    'A single-story white stucco home with a dark metal roof at dusk, set among gravel beds and ornamental grasses',
  '/images/areas/nampa.webp':
    'A single-story ranch house with tan siding, a brick base and a single garage, behind a bare shade tree',
  '/images/areas/kuna.webp':
    'A single-story stucco home with a dark metal roof and a wood-clad entry, with sagebrush in front and mountains beyond',
  '/images/areas/star.webp':
    'A dark-sided two-story home with a covered patio on a lawn beside a tree-lined river',
  '/images/areas/middleton.webp':
    'A white single-story home with an attached garage and a gravel drive, with farm fields and low hills behind',
  '/images/areas/caldwell.webp':
    'A residential street lined with houses and trees',
  '/images/gallery/gallery-painting-boise-before.webp':
    'Weathered craftsman porch door with peeling blue-gray paint on a Boise bungalow',
  '/images/gallery/gallery-painting-boise-after.webp':
    'Freshly painted sage-green craftsman porch door with white trim on a Boise bungalow',
  '/images/gallery/gallery-drywall-boise-before.webp':
    'Cream hallway wall with an open drywall scar above white baseboard',
  '/images/gallery/gallery-drywall-boise-after.webp':
    'Smooth cream hallway wall after a drywall patch and paint touch-up',
  '/images/gallery/gallery-carpentry-eagle-before.webp':
    'White six-panel interior door sticking ajar in an Eagle foothills foyer',
  '/images/gallery/gallery-carpentry-eagle-after.webp':
    'White six-panel interior door hanging plumb in an Eagle foothills foyer',
  '/images/gallery/gallery-fence-meridian-before.webp':
    'Meridian cedar fence with missing pickets and a gap in the run',
  '/images/gallery/gallery-fence-meridian-after.webp':
    'Meridian cedar fence with pickets fastened flush after repair',
  '/images/gallery/gallery-mounting-nampa-before.webp':
    'Blank beige living-room wall with faint pencil marks for a TV mount',
  '/images/gallery/gallery-mounting-nampa-after.webp':
    'Flat-screen TV mounted level on a beige living-room wall',
  '/images/gallery/gallery-plumbing-caldwell-before.webp':
    'Dated chrome kitchen faucet with mineral deposits at a white sink',
  '/images/gallery/gallery-plumbing-caldwell-after.webp':
    'Brushed-nickel pull-down kitchen faucet installed at a white sink',
  '/images/gallery/gallery-electrical-kuna-before.webp':
    'Yellowed duplex outlet askew on a cream laundry-room wall',
  '/images/gallery/gallery-electrical-kuna-after.webp':
    'New white duplex outlet seated level in a neat cover plate',
  '/images/gallery/gallery-maintenance-star-before.webp':
    'Daylight gap along a white exterior door jamb before weatherstripping',
  '/images/gallery/gallery-maintenance-star-after.webp':
    'White exterior door jamb sealed with fresh foam weatherstripping',
  '/images/gallery/gallery-boise-bungalow-exterior.webp':
    'A single-story ranch home with gray-green siding, a wood front door and a shaded front lawn',
  '/images/houses/kuna/kuna-gutter-cleaning.webp':
    'White gutter with autumn leaves at the eave of a beige Kuna single-storey home',
  '/images/houses/kuna/kuna-single-storey-front.webp':
    'Beige single-storey home in Kuna with white trim, two-car garage and open fields beyond',
  '/images/houses/kuna/kuna-deck-board-replacement.webp':
    'New deck boards going down beside a single-storey home with a wood privacy fence',
};

/** What the picture shows, with no local wording. */
export function imageDescription(src: string | undefined | null): string | undefined {
  if (!src) return undefined;
  const path = src.split('?')[0].split('#')[0];
  return IMAGE_ALTS[path];
}

/** The place an area photograph belongs to, read from its path. */
function cityFromPath(path: string): string | undefined {
  const area = path.match(/\/areas\/([^./]+)\.webp$/);
  if (area) return cityForSlug(area[1]);
  if (path.includes('/houses/kuna/')) return 'Kuna';
  return undefined;
}

/**
 * The alt for a content photograph: the work and the place, then what the
 * picture shows (shared/localAlt.ts). Pass the page's own service and city;
 * without them an area photograph supplies its city and Boise is the place.
 * Returns undefined for a path with no description, as before.
 */
export function altForImage(src: string | undefined | null, context: LocalAltContext = {}): string | undefined {
  const description = imageDescription(src);
  if (!description || !src) return undefined;
  const path = src.split('?')[0].split('#')[0];
  return localAlt(description, { subject: context.subject, city: context.city ?? cityFromPath(path) });
}
