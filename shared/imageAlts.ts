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
    'A worker painting white window trim with a brush over a drop cloth',
  '/images/handyman/service-painting.webp':
    'A worker painting white window trim with a brush over a drop cloth',
  '/images/handyman/service-plumbing.webp':
    'Hands installing a kitchen faucet at a sink with supply lines and a wrench',
  '/images/handyman/service-electrical.webp':
    'Hands installing a white duplex electrical outlet in an open wall box',
  '/images/handyman/service-mounting.webp':
    'A worker leveling a TV wall-mount bracket with a drill',
  '/images/handyman/service-fence-repair.webp':
    'Gloved hands fastening a cedar fence picket to a rail with a cordless drill',
  '/images/handyman/service-caulking.webp':
    'A caulk gun laying a white bead where a bathtub meets subway tile',
  '/images/handyman/hero-door-hinge-branded.webp':
    'A worker adjusting an interior door hinge with a screwdriver',
  '/images/handyman/toolbag-ready.webp':
    'An open canvas tool bag with a drill, level, and tape measure on a drop cloth',
  '/images/handyman/estimate-clipboard.webp':
    'A clipboard, calculator, pencil, and tape measure on a wood table',
  '/images/handyman/consult-doorstep-branded.webp':
    'A handyman and a homeowner reviewing a clipboard at a front door',
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
    'A hand tightening an interior door hinge screw with a screwdriver',
  '/images/handyman/cabinet-hardware-upgrade.webp':
    'Hands installing a brushed-brass knob on a white cabinet door',
  '/images/handyman/deck-board-replacement.webp':
    'Gloved hands replacing a deck board with a new cedar board',
  '/images/handyman/hero-gutter-cleaning.webp':
    'A worker on a ladder clearing leaves from a house gutter',
  '/images/handyman/weatherstripping.webp':
    'Hands applying foam weatherstripping to a white exterior door frame',
  '/images/handyman/winterize-spigot.webp':
    'An insulated cover fitted over an outdoor faucet, with frost on the grass',
  '/images/handyman/grab-bar-install.webp':
    'A brushed-nickel grab bar installed on subway tile in a shower',
  '/images/areas/boise.webp':
    'A handyman and a homeowner standing together in a bright home',
  '/images/areas/meridian.webp':
    'A modern suburban home exterior with a lawn and front walkway',
  '/images/areas/eagle.webp':
    'A two-story house with a lawn and driveway',
  '/images/areas/nampa.webp':
    'A modern single-story home with large windows and landscaping',
  '/images/areas/kuna.webp':
    'A craftsman-style home with a covered front porch',
  '/images/areas/star.webp':
    'A house exterior with a front yard and trees',
  '/images/areas/middleton.webp':
    'A single-story home with an attached garage',
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
    'Boise craftsman bungalow porch with a sage-green front door and white trim',
};

export function altForImage(src: string | undefined | null): string | undefined {
  if (!src) return undefined;
  const path = src.split('?')[0].split('#')[0];
  return IMAGE_ALTS[path];
}
