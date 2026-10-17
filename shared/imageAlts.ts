/**
 * Alt text written from the photographs themselves.
 * Paths that are not listed here were not identifiable, so callers leave
 * the existing alt alone (or empty, if it was already empty).
 */
const IMAGE_ALTS: Record<string, string> = {
  '/images/handyman/drywall-patch-coat.webp':
    'Taped drywall patch with a first coat of compound, and a knife on a mud pan',
  '/images/handyman/baseboard-trim-fit.webp':
    'New white baseboard with a loose square-cut piece, a hammer and a coping saw on an oak floor',
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
  '/images/handyman/front-porch-toolbag.webp':
    'Canvas tool bag set down on a front porch beside a wood door',
  '/images/handyman/punch-list-markers.webp':
    "Blue painter's tape marking touch-up spots on a wall and window trim",
  '/images/handyman/front-door-repaint-p5-reviewed-20260910.webp':
    'A freshly painted sage-green front door with white trim and black hardware',
  '/images/handyman/front-door-repaint.webp':
    'A freshly painted sage-green front door with white trim and black hardware',
  '/images/handyman/toilet-tank-service.webp':
    'Toilet with a chrome shutoff valve and supply line, and a wrench on a towel',
  '/images/handyman/parts-tray.webp':
    'Washers, hex nuts and cabinet knobs sorted in a parts tray',
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
  '/images/handyman/spigot-winterize.webp':
    'Outdoor spigot with the hose disconnected and coiled on frosty grass',
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
};

export function altForImage(src: string | undefined | null): string | undefined {
  if (!src) return undefined;
  const path = src.split('?')[0].split('#')[0];
  return IMAGE_ALTS[path];
}
