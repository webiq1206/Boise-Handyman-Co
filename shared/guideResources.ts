/** Downloadable PDFs and visual resources linked from guides and blog posts. */

export type GuideResourceKind = 'pdf' | 'visual';

export interface GuideResource {
  id: string;
  title: string;
  description: string;
  kind: GuideResourceKind;
  /** Public path for PDF, or site path for visual page */
  href: string;
  fileLabel?: string;
}

/**
 * Rebuilt for the handyman repositioning. The old construction-planning PDFs
 * (new-home budget worksheet, lot evaluation checklist, new-home permit guide)
 * are replaced by handyman-relevant documents with new filenames, because the
 * content changed subject, not just wording. The retired /downloads/*.pdf
 * paths must 301 to their successors - see contentRedirects.js notes in the
 * conversion report. Regenerate the files with `npm run resources:generate`
 * (scripts/generate-resource-pdfs.ts) after editing resourcePdfContent.ts.
 */
export const GUIDE_RESOURCES: Record<string, GuideResource> = {
  'maintenance-checklist': {
    id: 'maintenance-checklist',
    title: 'Home Maintenance Checklist',
    description:
      'Printable season-by-season checklist for Treasure Valley homes: fall freeze prep, spring damage audit, and the monthly five-minute water check.',
    kind: 'pdf',
    href: '/downloads/home-maintenance-checklist.pdf',
    fileLabel: 'PDF · 2 pages',
  },
  'repair-priority-worksheet': {
    id: 'repair-priority-worksheet',
    title: 'Home Repair Priority Worksheet',
    description:
      'Walk your house and triage the list: what is urgent, what can wait, what to DIY, and what to hand to a pro, with typical cost ranges for each.',
    kind: 'pdf',
    href: '/downloads/home-repair-priority-worksheet.pdf',
    fileLabel: 'PDF · 2 pages',
  },
  'repair-permit-pdf': {
    id: 'repair-permit-pdf',
    title: 'Home Repair Permit Guide',
    description:
      'One-page reference: which home repairs need a permit in Ada and Canyon County, which do not, and who to call to check before work starts.',
    kind: 'pdf',
    href: '/downloads/home-repair-permit-guide.pdf',
    fileLabel: 'PDF · 1 page',
  },
  'ada-canyon-permit-flow': {
    id: 'ada-canyon-permit-flow',
    title: 'Repair Permit Flow Infographic',
    description:
      'Visual walkthrough: when a home repair needs a permit in Ada vs Canyon County, and the path from application to final inspection.',
    kind: 'visual',
    href: '/resources/ada-canyon-permit-flow',
    fileLabel: 'Interactive page',
  },
};

/** Resource IDs shown on each guide slug */
export const RESOURCES_BY_GUIDE_SLUG: Record<string, string[]> = {
  'boise-home-maintenance-guide': ['maintenance-checklist', 'repair-priority-worksheet'],
  'first-time-homeowner-repair-handbook': [
    'repair-priority-worksheet',
    'maintenance-checklist',
    'repair-permit-pdf',
  ],
  'boise-home-repair-cost-guide': ['repair-priority-worksheet', 'repair-permit-pdf'],
  'hire-a-handyman-treasure-valley': ['repair-permit-pdf', 'ada-canyon-permit-flow'],
  'treasure-valley-exterior-home-care-guide': ['maintenance-checklist'],
  'small-home-upgrades-that-pay-off': ['repair-permit-pdf'],
  'boise-handyman-guide': ['maintenance-checklist', 'repair-priority-worksheet'],
};

/**
 * Blog slugs here must exist in shared/content/wave2. The wave2 library is
 * being rewritten in parallel; only slugs confirmed stable are mapped, extend
 * this table as the new posts land.
 */
export const RESOURCES_BY_BLOG_SLUG: Record<string, string[]> = {
  'ada-vs-canyon-county-permit-timelines': [
    'repair-permit-pdf',
    'ada-canyon-permit-flow',
  ],
  'what-small-home-repairs-cost-boise': ['repair-priority-worksheet'],
  'handyman-red-flags': ['repair-priority-worksheet'],
};

export function getResourcesForGuide(slug: string): GuideResource[] {
  const ids = RESOURCES_BY_GUIDE_SLUG[slug] ?? [];
  return ids.map((id) => GUIDE_RESOURCES[id]).filter(Boolean);
}

export function getResourcesForBlog(slug: string): GuideResource[] {
  const ids = RESOURCES_BY_BLOG_SLUG[slug] ?? [];
  return ids.map((id) => GUIDE_RESOURCES[id]).filter(Boolean);
}

export const ALL_RESOURCES_LIST = Object.values(GUIDE_RESOURCES);
