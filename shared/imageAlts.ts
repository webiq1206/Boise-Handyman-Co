/**
 * Alt text written from the photographs themselves.
 * Paths that are not listed here were not identifiable, so callers leave
 * the existing alt alone (or empty, if it was already empty).
 */
const IMAGE_ALTS: Record<string, string> = {
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

export function altForImage(src: string | undefined | null): string | undefined {
  if (!src) return undefined;
  const path = src.split('?')[0].split('#')[0];
  return IMAGE_ALTS[path];
}
