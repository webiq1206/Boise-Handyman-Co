/**
 * Branded Open Graph share cards per blog post and guide.
 *
 * GENERATED FILE - do not edit by hand.
 * Run `npm run images:og` to regenerate from the content layer.
 *
 * Each card is the post hero photo under a dark overlay with the title and the
 * brand eyebrow, 1200x630 JPEG at public/images/blog/{slug}-og.jpg. Blog and
 * guide metadata fall back to the plain hero image when a slug is absent here.
 */
export const BLOG_OG_IMAGES: Record<string, string> = {
  // Blog posts
  'ada-vs-canyon-county-permit-timelines': '/images/blog/ada-vs-canyon-county-permit-timelines-og.jpg',
  'aging-in-place-home-design': '/images/blog/aging-in-place-home-design-og.jpg',
  'boise-building-permit-guide': '/images/blog/boise-building-permit-guide-og.jpg',
  'caulking-guide-boise-homes': '/images/blog/caulking-guide-boise-homes-og.jpg',
  'common-toilet-problems-and-fixes': '/images/blog/common-toilet-problems-and-fixes-og.jpg',
  'deck-maintenance-boise': '/images/blog/deck-maintenance-boise-og.jpg',
  'diy-vs-hiring-a-handyman': '/images/blog/diy-vs-hiring-a-handyman-og.jpg',
  'drywall-repair-cost-boise': '/images/blog/drywall-repair-cost-boise-og.jpg',
  'energy-saving-home-fixes-boise': '/images/blog/energy-saving-home-fixes-boise-og.jpg',
  'fence-repair-treasure-valley': '/images/blog/fence-repair-treasure-valley-og.jpg',
  'fixing-squeaky-floors-and-sticking-doors': '/images/blog/fixing-squeaky-floors-and-sticking-doors-og.jpg',
  'gutter-cleaning-schedule-boise': '/images/blog/gutter-cleaning-schedule-boise-og.jpg',
  'handyman-prices-boise': '/images/blog/handyman-prices-boise-og.jpg',
  'handyman-red-flags': '/images/blog/handyman-red-flags-og.jpg',
  'handyman-vs-contractor': '/images/blog/handyman-vs-contractor-og.jpg',
  'home-maintenance-budget-idaho': '/images/blog/home-maintenance-budget-idaho-og.jpg',
  'home-repairs-before-selling-boise': '/images/blog/home-repairs-before-selling-boise-og.jpg',
  'hourly-rate-vs-flat-rate-handyman': '/images/blog/hourly-rate-vs-flat-rate-handyman-og.jpg',
  'how-long-do-common-home-repairs-take': '/images/blog/how-long-do-common-home-repairs-take-og.jpg',
  'how-to-budget-home-repairs-boise': '/images/blog/how-to-budget-home-repairs-boise-og.jpg',
  'how-to-compare-handyman-quotes': '/images/blog/how-to-compare-handyman-quotes-og.jpg',
  'how-to-patch-drywall': '/images/blog/how-to-patch-drywall-og.jpg',
  'interior-paint-touch-up-guide': '/images/blog/interior-paint-touch-up-guide-og.jpg',
  'new-home-punch-list-handyman': '/images/blog/new-home-punch-list-handyman-og.jpg',
  'preparing-your-boise-home-for-winter': '/images/blog/preparing-your-boise-home-for-winter-og.jpg',
  'questions-to-ask-a-handyman': '/images/blog/questions-to-ask-a-handyman-og.jpg',
  'replacing-faucets-and-fixtures': '/images/blog/replacing-faucets-and-fixtures-og.jpg',
  'seasonal-home-maintenance-checklist-boise': '/images/blog/seasonal-home-maintenance-checklist-boise-og.jpg',
  'small-home-upgrade-ideas-boise': '/images/blog/small-home-upgrade-ideas-boise-og.jpg',
  'tv-mounting-and-anchoring-guide': '/images/blog/tv-mounting-and-anchoring-guide-og.jpg',
  'what-small-home-repairs-cost-boise': '/images/blog/what-small-home-repairs-cost-boise-og.jpg',
  'what-to-expect-first-handyman-visit': '/images/blog/what-to-expect-first-handyman-visit-og.jpg',
  'who-supplies-materials-handyman-jobs': '/images/blog/who-supplies-materials-handyman-jobs-og.jpg',
  'why-handyman-quotes-vary': '/images/blog/why-handyman-quotes-vary-og.jpg',
  // Guides
  'boise-home-maintenance-guide': '/images/blog/boise-home-maintenance-guide-og.jpg',
  'boise-home-repair-cost-guide': '/images/blog/boise-home-repair-cost-guide-og.jpg',
  'first-time-homeowner-repair-handbook': '/images/blog/first-time-homeowner-repair-handbook-og.jpg',
  'hire-a-handyman-treasure-valley': '/images/blog/hire-a-handyman-treasure-valley-og.jpg',
  'small-home-upgrades-that-pay-off': '/images/blog/small-home-upgrades-that-pay-off-og.jpg',
  'treasure-valley-exterior-home-care-guide': '/images/blog/treasure-valley-exterior-home-care-guide-og.jpg',
  'boise-handyman-guide': '/images/blog/boise-handyman-guide-og.jpg',
  'meridian-handyman-guide': '/images/blog/meridian-handyman-guide-og.jpg',
  'eagle-handyman-guide': '/images/blog/eagle-handyman-guide-og.jpg',
  'kuna-handyman-guide': '/images/blog/kuna-handyman-guide-og.jpg',
  'star-handyman-guide': '/images/blog/star-handyman-guide-og.jpg',
  'middleton-handyman-guide': '/images/blog/middleton-handyman-guide-og.jpg',
  'nampa-handyman-guide': '/images/blog/nampa-handyman-guide-og.jpg',
  'caldwell-handyman-guide': '/images/blog/caldwell-handyman-guide-og.jpg',
  'eagle-foothills-handyman-guide': '/images/blog/eagle-foothills-handyman-guide-og.jpg',
  'hidden-springs-handyman-guide': '/images/blog/hidden-springs-handyman-guide-og.jpg',
  'harris-ranch-handyman-guide': '/images/blog/harris-ranch-handyman-guide-og.jpg',
};

export function getBlogOgImage(slug: string): string | undefined {
  return BLOG_OG_IMAGES[slug];
}
