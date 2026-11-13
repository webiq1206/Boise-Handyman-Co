/**
 * Marketing image paths. These point at photography in `public/images/`.
 *
 * All photography is AI-generated placeholder imagery produced for the
 * Boise Handyman conversion (2026-08). Swap for real job-site photography
 * when it exists. [NEEDS: real photography when available]
 */

export const SITE_IMAGES = {
  /** Default hero: an interior door mid-repair with a tool bag, drill and level beside it. No people (13 November 2026). */
  hero: "/images/handyman/hero-door-hinge-branded.webp",
  /** "How we work" split panels: a blank work-order form on a clipboard with a tape measure and a level. */
  process: "/images/handyman/estimate-clipboard.webp",
  /** Value and carpentry sections: approved people-free door, trim and hardware. */
  valueCraft: "/images/handyman/front-door-repaint-p5-reviewed-20260910.webp",
  /** Process sections: a tidy tool bag staged on a drop cloth for a repair visit. */
  processInProgress: "/images/handyman/toolbag-ready.webp",
  /** Full-bleed brand statement band: freshly painted window trim, a brush on an open paint can. No people. */
  statementBand: "/images/handyman/service-painting-p5-reviewed-20260910.webp",
  /** About/contact split panels and about hero: a tool bag and drill on a front step by the door. No people. */
  leadership: "/images/handyman/consult-doorstep-branded.webp",
  /** Consultation section background (homepage): a freshly repainted front door. */
  consultBg: "/images/handyman/front-door-repaint-p5-reviewed-20260910.webp",
  /** Pricing section subtle texture: new cabinet hardware going on. */
  budgetDetail: "/images/handyman/cabinet-hardware-upgrade.webp",
} as const;

/**
 * The shared handyman image library in public/images/handyman. The export
 * keeps its historical name (CONSTRUCTION_IMAGES) because serviceBackgrounds,
 * cityServiceImages, and the hero registries import it; the keys map old
 * building concepts to their nearest handyman-scope shot. It lives here
 * rather than beside either consumer because both need it and they already
 * depend on this module.
 */
const h = (name: string) => `/images/handyman/${name}.webp`;

export const CONSTRUCTION_IMAGES = {
  customHome: h("hero-gutter-cleaning"),
  semiCustom: h("front-door-repaint-p5-reviewed-20260910"),
  framing: h("service-drywall-repair"),
  foundation: h("service-fence-repair"),
  roughIn: h("service-plumbing"),
  insulation: h("weatherstripping"),
  interior: h("hero-door-hinge-branded"),
  kitchen: h("cabinet-hardware-upgrade"),
  lot: h("deck-board-replacement"),
  foothills: h("winterize-spigot"),
  ruralSite: h("service-fence-repair"),
  plans: h("estimate-clipboard"),
  budget: h("repair-materials"),
  meeting: h("consult-doorstep-branded"),
  outdoor: h("deck-board-replacement"),
  shopHome: h("toolbag-ready"),
} as const;
