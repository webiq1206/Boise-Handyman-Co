/**
 * 301 map for the remodeling-to-construction repositioning.
 *
 * CommonJS on purpose: next.config.js is not transpiled, so it cannot require a
 * .ts module. Scripts that audit the map require this same file, which keeps
 * one copy of the truth.
 *
 * Three kinds of entry live here.
 *
 * 1. Renamed. The page still exists under a construction title and a new slug.
 *    Point the old slug at the new one.
 * 2. Consolidated. Several thin remodeling posts collapsed into one better
 *    construction post. All of them point at the survivor.
 * 3. Retired. The topic does not exist on a home builder's site - bathroom
 *    remodel ROI, living through a remodel, garage conversions. These point at
 *    the closest hub rather than the homepage, because a hub keeps the visitor
 *    in the subject they were reading about and passes the link equity to a
 *    page that can rank, whereas the homepage absorbs it.
 *
 * A retired URL must never 404 and must never point somewhere irrelevant. Both
 * waste an inbound link that took years to earn.
 */

/** @type {Record<string, string>} old blog slug -> new path */
const BLOG_REDIRECTS = {
  // ---------------------------------------------------------------- renamed
  '/blog/remodel-cost-per-square-foot-boise': '/blog/handyman-prices-boise',
  '/blog/what-impacts-remodeling-costs-boise': '/blog/what-small-home-repairs-cost-boise',
  '/blog/how-to-budget-remodel-boise': '/blog/how-to-budget-home-repairs-boise',
  '/blog/luxury-remodel-cost-boise': '/blog/tv-mounting-and-anchoring-guide',
  '/blog/remodeling-vs-moving': '/blog/diy-vs-hiring-a-handyman',
  '/blog/whole-home-remodel-cost-boise': '/blog/handyman-prices-boise',
  '/blog/questions-to-ask-remodeling-contractor': '/blog/questions-to-ask-a-handyman',
  '/blog/remodeling-contractor-red-flags': '/blog/handyman-red-flags',
  '/blog/how-to-compare-remodeling-estimates': '/blog/how-to-compare-handyman-quotes',
  '/blog/why-remodeling-bids-vary': '/blog/why-handyman-quotes-vary',
  '/blog/whole-home-remodel-timeline': '/blog/how-long-do-common-home-repairs-take',
  '/blog/boise-permit-guide': '/blog/boise-building-permit-guide',
  '/blog/construction-phase-guide': '/blog/interior-paint-touch-up-guide',
  '/blog/material-selection-guide': '/blog/category/installs-and-upgrades',
  '/blog/punch-list-guide': '/blog/new-home-punch-list-handyman',
  '/blog/consultation-process-remodeling': '/blog/what-to-expect-first-handyman-visit',
  '/blog/kitchen-layout-ideas-boise-homes': '/blog/small-home-upgrade-ideas-boise',
  '/blog/multigenerational-living-remodels': '/blog/common-toilet-problems-and-fixes',
  '/blog/aging-in-place-bathroom-design': '/blog/aging-in-place-home-design',
  '/blog/energy-efficiency-roi': '/blog/energy-saving-home-fixes-boise',
  '/blog/covered-patios-boise': '/blog/deck-maintenance-boise',

  // ----------------------------------------------------------- consolidated
  // Timeline questions all answered by the one build-duration post.
  '/blog/remodeling-timeline-guide': '/blog/how-long-do-common-home-repairs-take',
  '/blog/home-addition-timeline-guide': '/blog/how-long-do-common-home-repairs-take',
  '/blog/kitchen-remodel-timeline-boise': '/blog/how-long-do-common-home-repairs-take',
  '/blog/how-long-does-a-bathroom-remodel-take': '/blog/how-long-do-common-home-repairs-take',

  // Builder-selection duplicates.
  '/blog/what-makes-great-remodeling-contractor': '/blog/questions-to-ask-a-handyman',
  '/blog/how-to-choose-design-build-contractor': '/guides/hire-a-handyman-treasure-valley',
  '/blog/design-build-process-guide': '/blog/handyman-vs-contractor',

  // Planning and process duplicates.
  '/blog/remodel-planning-guide': '/guides/boise-home-maintenance-guide',
  '/blog/whole-home-remodel-planning-checklist': '/guides/boise-home-maintenance-guide',
  '/blog/preconstruction-guide': '/blog/interior-paint-touch-up-guide',
  '/blog/design-development-guide': '/guides/small-home-upgrades-that-pay-off',
  '/blog/warranty-guide-remodeling': '/blog/new-home-punch-list-handyman',
  '/blog/remodeling-mistakes-to-avoid': '/blog/questions-to-ask-a-handyman',

  // Additions became design decisions inside a new plan, not separate projects.
  '/blog/primary-suite-additions': '/blog/small-home-upgrade-ideas-boise',
  '/blog/bedroom-additions': '/blog/small-home-upgrade-ideas-boise',
  '/blog/second-story-additions': '/blog/how-to-patch-drywall',
  '/blog/room-addition-guide-treasure-valley': '/blog/small-home-upgrade-ideas-boise',
  '/blog/home-addition-cost-boise': '/blog/handyman-prices-boise',
  '/blog/adu-guide-boise': '/blog/category/costs-and-hiring',
  '/blog/basement-finishing-boise': '/blog/handyman-prices-boise',
  '/blog/garage-conversions': '/blog/category/costs-and-hiring',

  // Kitchen and bath selections inside a new build.
  '/blog/kitchen-cabinet-trends': '/blog/category/installs-and-upgrades',
  '/blog/kitchen-cabinet-trends-boise': '/blog/category/installs-and-upgrades',
  '/blog/quartz-vs-quartzite-kitchen': '/blog/category/installs-and-upgrades',
  '/blog/quartz-vs-quartzite-countertops': '/blog/category/installs-and-upgrades',
  '/blog/walk-in-pantry-design-guide': '/blog/small-home-upgrade-ideas-boise',
  '/blog/kitchen-island-design-guide': '/blog/small-home-upgrade-ideas-boise',
  '/blog/open-concept-kitchen-remodeling': '/blog/small-home-upgrade-ideas-boise',
  '/blog/small-kitchen-remodel-ideas-boise': '/blog/small-home-upgrade-ideas-boise',
  '/blog/kitchen-remodel-cost-boise': '/blog/handyman-prices-boise',
  '/blog/bathroom-remodel-cost-boise': '/blog/handyman-prices-boise',
  '/blog/walk-in-shower-guide': '/blog/category/installs-and-upgrades',
  '/blog/curbless-shower-guide': '/blog/aging-in-place-home-design',
  '/blog/luxury-bathroom-features': '/blog/tv-mounting-and-anchoring-guide',
  '/blog/small-bathroom-remodel-ideas': '/blog/small-home-upgrade-ideas-boise',
  '/blog/bathroom-layout-planning-guide': '/blog/small-home-upgrade-ideas-boise',

  // ------------------------------------------------------------- retired
  // No construction equivalent. Sent to the nearest hub, not the homepage.
  '/blog/kitchen-remodel-roi': '/blog/diy-vs-hiring-a-handyman',
  '/blog/bathroom-remodel-roi': '/blog/diy-vs-hiring-a-handyman',
  '/blog/exterior-remodeling-roi': '/blog/diy-vs-hiring-a-handyman',
  '/blog/addition-roi-remodeling': '/blog/diy-vs-hiring-a-handyman',
  '/blog/outdoor-living-roi': '/blog/deck-maintenance-boise',
  '/blog/remodeling-before-selling': '/blog/diy-vs-hiring-a-handyman',
  '/blog/remodeling-long-term-living': '/blog/aging-in-place-home-design',
  '/blog/living-through-a-remodel': '/blog/how-long-do-common-home-repairs-take',
  '/blog/decks-vs-patios-boise': '/blog/deck-maintenance-boise',
  '/blog/outdoor-fireplaces-boise': '/blog/deck-maintenance-boise',
  '/blog/outdoor-entertaining-spaces': '/blog/deck-maintenance-boise',
  '/blog/luxury-outdoor-living': '/blog/deck-maintenance-boise',
  '/blog/backyard-transformations-boise': '/blog/deck-maintenance-boise',
  '/blog/outdoor-kitchens-boise': '/blog/deck-maintenance-boise',

  // Superseded before the repositioning; kept so the chain stays one hop.
  '/blog/kitchen-remodel-cost-treasure-valley': '/blog/handyman-prices-boise',
  '/blog/bathroom-remodel-cost-idaho': '/blog/handyman-prices-boise',
  '/blog/kitchen-roi-remodeling': '/blog/diy-vs-hiring-a-handyman',
  '/blog/bathroom-roi-remodeling': '/blog/diy-vs-hiring-a-handyman',

  // ------------------------------------------- construction-to-handyman
  // 2026-08 repositioning: builder-scope posts replaced by handyman posts.
  // Every deleted slug points at its topical successor, or at the nearest
  // hub when no honest successor exists. See scratchpad blog-a/b/c reports.
  '/blog/adu-cost-boise': '/blog/category/costs-and-hiring',
  '/blog/allowances-explained-new-home': '/blog/who-supplies-materials-handyman-jobs',
  '/blog/build-vs-buy-boise': '/blog/diy-vs-hiring-a-handyman',
  '/blog/building-in-the-boise-foothills': '/blog/category/exterior-and-outdoor',
  '/blog/choosing-finishes-for-a-new-home': '/blog/category/installs-and-upgrades',
  '/blog/construction-loan-basics-idaho': '/blog/home-maintenance-budget-idaho',
  '/blog/cost-to-build-a-house-boise': '/blog/handyman-prices-boise',
  '/blog/covered-outdoor-living-new-home': '/blog/deck-maintenance-boise',
  '/blog/custom-home-cost-per-square-foot-boise': '/blog/handyman-prices-boise',
  '/blog/home-builder-red-flags': '/blog/handyman-red-flags',
  '/blog/design-build-vs-general-contractor': '/blog/handyman-vs-contractor',
  '/blog/energy-efficient-home-building-boise': '/blog/energy-saving-home-fixes-boise',
  '/blog/first-meeting-with-a-home-builder': '/blog/what-to-expect-first-handyman-visit',
  '/blog/fixed-price-vs-cost-plus': '/blog/hourly-rate-vs-flat-rate-handyman',
  '/blog/how-long-does-it-take-to-build-a-house-boise': '/blog/how-long-do-common-home-repairs-take',
  '/blog/how-to-budget-a-new-home-boise': '/blog/how-to-budget-home-repairs-boise',
  '/blog/how-to-buy-a-buildable-lot-boise': '/blog/home-repairs-before-selling-boise',
  '/blog/how-to-compare-builder-bids': '/blog/how-to-compare-handyman-quotes',
  '/blog/impact-fees-and-utility-connections': '/blog/questions-to-ask-a-handyman',
  '/blog/lot-evaluation-checklist': '/blog/seasonal-home-maintenance-checklist-boise',
  '/blog/custom-home-floor-plan-ideas-boise': '/blog/small-home-upgrade-ideas-boise',
  '/blog/what-drives-home-building-costs-boise': '/blog/what-small-home-repairs-cost-boise',
  '/blog/why-home-building-bids-vary': '/blog/why-handyman-quotes-vary',
  '/blog/questions-to-ask-a-home-builder': '/blog/questions-to-ask-a-handyman',
  '/blog/new-home-walkthrough-and-warranty': '/blog/new-home-punch-list-handyman',
  '/blog/luxury-home-building-cost-boise': '/blog/tv-mounting-and-anchoring-guide',
  '/blog/multigenerational-home-design': '/blog/common-toilet-problems-and-fixes',
  '/blog/production-vs-custom-home-builder': '/blog/replacing-faucets-and-fixtures',
  '/blog/shop-homes-and-barndominiums-idaho': '/blog/fence-repair-treasure-valley',
  '/blog/single-story-vs-two-story-home': '/blog/how-to-patch-drywall',
  '/blog/stages-of-building-a-house': '/blog/interior-paint-touch-up-guide',
  '/blog/well-and-septic-cost-idaho': '/blog/gutter-cleaning-schedule-boise',
};

/** @type {Record<string, string>} old guide slug -> new path */
const GUIDE_REDIRECTS = {
  '/guides/boise-remodeling-cost-guide': '/guides/boise-home-repair-cost-guide',
  '/guides/choose-remodeling-contractor-boise': '/guides/hire-a-handyman-treasure-valley',
  '/guides/boise-remodeling-process-guide': '/guides/boise-home-maintenance-guide',
  '/guides/treasure-valley-remodeling-guide': '/guides/hire-a-handyman-treasure-valley',
  '/guides/boise-remodeling-guide': '/guides/boise-handyman-guide',
  '/guides/meridian-remodeling-guide': '/guides/meridian-handyman-guide',
  '/guides/eagle-remodeling-guide': '/guides/eagle-handyman-guide',
  '/guides/kuna-remodeling-guide': '/guides/kuna-handyman-guide',
  '/guides/star-remodeling-guide': '/guides/star-handyman-guide',
  '/guides/middleton-remodeling-guide': '/guides/middleton-handyman-guide',
  '/guides/nampa-remodeling-guide': '/guides/nampa-handyman-guide',
  '/guides/caldwell-remodeling-guide': '/guides/caldwell-handyman-guide',
  '/guides/eagle-foothills-remodeling-guide': '/guides/eagle-foothills-handyman-guide',
  '/guides/hidden-springs-remodeling-guide': '/guides/hidden-springs-handyman-guide',
  '/guides/harris-ranch-remodeling-guide': '/guides/harris-ranch-handyman-guide',

  // Neighbourhood guides for inner Boise. These describe established housing
  // stock on built-out lots, where the work is remodeling, not new
  // construction. There is no honest construction version, so they resolve to
  // the city guide rather than being rewritten into something we do not do.
  '/guides/north-end-remodeling-guide': '/guides/boise-handyman-guide',
  '/guides/boise-bench-remodeling-guide': '/guides/boise-handyman-guide',
  '/guides/east-boise-remodeling-guide': '/guides/boise-handyman-guide',

  // Pillars whose whole subject is remodeling.
  '/guides/boise-kitchen-remodeling-guide': '/guides/small-home-upgrades-that-pay-off',
  '/guides/boise-bathroom-remodeling-guide': '/guides/small-home-upgrades-that-pay-off',
  '/guides/boise-home-addition-guide': '/guides/small-home-upgrades-that-pay-off',
  '/guides/whole-home-remodeling-guide': '/guides/boise-home-repair-cost-guide',
  '/guides/best-remodeling-roi-boise': '/blog/diy-vs-hiring-a-handyman',
  '/guides/outdoor-living-remodeling-guide': '/blog/deck-maintenance-boise',
  '/guides/boise-adu-guide': '/blog/category/costs-and-hiring',

  // 2026-08 construction-to-handyman renames.
  '/guides/boise-home-building-cost-guide': '/guides/boise-home-repair-cost-guide',
  '/guides/choose-home-builder-boise': '/guides/hire-a-handyman-treasure-valley',
  '/guides/boise-home-building-process-guide': '/guides/boise-home-maintenance-guide',
  '/guides/treasure-valley-home-building-guide': '/guides/hire-a-handyman-treasure-valley',
  '/guides/custom-home-design-guide': '/guides/small-home-upgrades-that-pay-off',
  '/guides/buying-land-to-build-boise': '/guides/first-time-homeowner-repair-handbook',
  '/guides/boise-home-building-guide': '/guides/boise-handyman-guide',
  '/guides/meridian-home-building-guide': '/guides/meridian-handyman-guide',
  '/guides/eagle-home-building-guide': '/guides/eagle-handyman-guide',
  '/guides/kuna-home-building-guide': '/guides/kuna-handyman-guide',
  '/guides/star-home-building-guide': '/guides/star-handyman-guide',
  '/guides/middleton-home-building-guide': '/guides/middleton-handyman-guide',
  '/guides/nampa-home-building-guide': '/guides/nampa-handyman-guide',
  '/guides/caldwell-home-building-guide': '/guides/caldwell-handyman-guide',
  '/guides/eagle-foothills-home-building-guide': '/guides/eagle-foothills-handyman-guide',
  '/guides/hidden-springs-home-building-guide': '/guides/hidden-springs-handyman-guide',
  '/guides/harris-ranch-home-building-guide': '/guides/harris-ranch-handyman-guide',
};

/** @type {Record<string, string>} retired category hubs -> surviving hub */
const HUB_REDIRECTS = {
  '/blog/category/remodeling-costs': '/blog/category/costs-and-hiring',
  '/blog/category/contractor-selection': '/blog/category/costs-and-hiring',
  '/blog/category/remodeling-process': '/blog/category/home-maintenance',
  '/blog/category/kitchen-remodeling': '/blog/category/installs-and-upgrades',
  '/blog/category/bathroom-remodeling': '/blog/category/installs-and-upgrades',
  '/blog/category/home-additions': '/blog/category/installs-and-upgrades',
  '/blog/category/whole-home-remodeling': '/blog/category/costs-and-hiring',
  '/blog/category/remodeling-roi': '/blog/category/costs-and-hiring',
  '/blog/category/outdoor-living': '/blog/category/installs-and-upgrades',

  // 2026-08 construction-to-handyman hub renames.
  '/blog/category/home-building-costs': '/blog/category/costs-and-hiring',
  '/blog/category/choosing-a-builder': '/blog/category/costs-and-hiring',
  '/blog/category/home-building-process': '/blog/category/home-maintenance',
  '/blog/category/home-design-and-plans': '/blog/category/installs-and-upgrades',
  '/blog/category/land-and-lots': '/blog/category/repairs-and-fixes',
  '/blog/category/treasure-valley-locations': '/guides',
};

/**
 * Retired service slugs with an honest handyman equivalent. Each old service
 * points at the handyman service that best answers the same intent, and the
 * city is preserved across the redirect by next.config.js.
 */
const SERVICE_SLUG_REDIRECTS = {
  // Remodel-era slugs whose intent a handyman can partly serve.
  'aging-in-place': 'mounting-assembly',
  'aging-in-place-remodeling': 'mounting-assembly',
  'outdoor-living': 'fence-deck-gutter-repair',
  'outdoor-living-spaces': 'fence-deck-gutter-repair',
  'decks-patios': 'fence-deck-gutter-repair',
  'basement-finishing': 'drywall-repair',
  'basement-remodel': 'drywall-repair',
  'basement-remodeling': 'drywall-repair',
};

/**
 * Retired service slugs with NO honest handyman equivalent: full remodels,
 * additions, and the previous brand's home-building services. Sending these to
 * a specific handyman service would misrepresent scope, so the base URL
 * resolves to the services index (which states what we do and do not do) and
 * the /:city children resolve to the matching area page to keep local intent.
 */
const SERVICE_INDEX_REDIRECTS = [
  // Remodeling-era slugs.
  'kitchen-remodel',
  'bathroom-remodel',
  'whole-home-remodel',
  'room-addition',
  'adu',
  'kitchen-remodeling',
  'bathroom-remodeling',
  'whole-home-remodeling',
  'home-remodeling',
  'home-additions',
  'home-addition',
  'room-additions',
  'adu-builder',
  'adu-guest-house',
  // Construction-era slugs (2026-08 handyman repositioning).
  'custom-home-builder',
  'semi-custom-homes',
  'build-on-your-lot',
  'design-build',
  'home-plans-design',
  'lot-evaluation',
  'shop-homes-barndominiums',
  'energy-efficient-homes',
];

module.exports = {
  BLOG_REDIRECTS,
  GUIDE_REDIRECTS,
  HUB_REDIRECTS,
  SERVICE_SLUG_REDIRECTS,
  SERVICE_INDEX_REDIRECTS,
};
