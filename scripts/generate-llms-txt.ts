/**
 * Generates public/llms.txt and public/llms-full.txt from the content layer.
 *
 * These were hand-maintained and went stale: robots.ts explicitly welcomes
 * eleven AI crawlers, and both files were still describing a remodeling company
 * and linking to service and guide slugs that had been retired. A crawler that
 * trusts llms.txt over the live pages would have gotten the wrong business.
 *
 * Deriving them from SERVICES / GUIDE_PAGES / CONTENT_HUBS means the page list
 * can no longer disagree with the sitemap. Prose that is genuinely editorial
 * still lives here as literals; it just sits next to the data it describes.
 *
 * Run: npm run generate:llms   (verified in prebuild via verify:llms)
 */
import fs from 'fs';
import path from 'path';
import { SITE_CONFIG } from '../shared/siteConfig';
import { SERVICES, CITIES } from '../shared/contentData';
import { GUIDE_PAGES } from '../shared/guideContent';
import { CONTENT_HUBS } from '../shared/contentHubs';
import { BLOG_POSTS } from '../shared/blogContent';

const BASE = SITE_CONFIG.siteUrl.replace(/\/$/, '');
const url = (p: string) => `${BASE}${p}`;
const today = new Date().toISOString().slice(0, 10);

const adaCities = CITIES.filter((c) => c.county === 'ada').map((c) => c.name);
const canyonCities = CITIES.filter((c) => c.county === 'canyon').map((c) => c.name);

const pillarGuides = GUIDE_PAGES.filter((g) => g.guideType === 'hub-pillar' || g.guideType === 'master');
const cityGuides = GUIDE_PAGES.filter((g) => g.guideType === 'location');
const neighborhoodGuides = GUIDE_PAGES.filter((g) => g.guideType === 'neighborhood');

const SUMMARY =
  `Handyman service for Boise, Idaho and the Treasure Valley: small home repairs, installs, ` +
  `and maintenance. Drywall repair, interior and exterior painting, minor plumbing and ` +
  `electrical, carpentry and trim, mounting and assembly, fence, deck and gutter repair, ` +
  `caulking and punch-list work. Serving ${CITIES.map((c) => c.name).join(', ')}. ` +
  `Phone ${SITE_CONFIG.phone}.`;

const POSITIONING =
  `Every job is quoted upfront as one written price before any work starts, priced by the ` +
  `time it takes with a one-hour minimum, and most jobs are finished in a single visit. A ` +
  `single small repair starts around $145, materials are billed at cost as their own line, ` +
  `and bundling several tasks into one visit is the best value (prices are being finalized; ` +
  `every job gets a written quote first). Work that needs a general contractor or a licensed ` +
  `trade, such as full remodels, additions, repipes, or panel work, is out of scope and ` +
  `referred out honestly.`;

function buildShort(): string {
  const lines: string[] = [];
  lines.push(`# ${SITE_CONFIG.name}`, '');
  lines.push(`> ${SUMMARY}`, '');
  lines.push(POSITIONING, '');

  lines.push('## Services', '');
  for (const s of SERVICES) {
    lines.push(`- [${s.name}](${url(`/services/${s.slug}`)}): ${s.shortDescription}`);
  }
  lines.push(
    `- [RE-10 / Inspection Repairs](${url('/re-10-repairs-boise')}): repairs from an Idaho RE-10 inspection response, completed and documented before closing, for real estate agents, buyers and sellers.`,
  );
  lines.push(
    `- [All Services](${url('/services')}): plus city pages at /services/{service}/{city} and [Service Areas](${url('/areas')}).`,
    '',
  );

  lines.push('## Authoritative guides', '');
  for (const g of pillarGuides) lines.push(`- [${g.title}](${url(`/guides/${g.slug}`)})`);
  lines.push('');

  lines.push('## Local permit and location resources', '');
  lines.push(`- [Ada County vs Canyon County permit flow](${url('/resources/ada-canyon-permit-flow')})`);
  if (cityGuides.length) {
    lines.push(
      `- City guides: ${cityGuides.map((g) => `[${g.title}](${url(`/guides/${g.slug}`)})`).join(', ')}`,
    );
  }
  if (neighborhoodGuides.length) {
    lines.push(
      `- Neighborhood guides: ${neighborhoodGuides.map((g) => `[${g.title}](${url(`/guides/${g.slug}`)})`).join(', ')}`,
    );
  }
  lines.push('');

  lines.push('## Blog category hubs', '');
  for (const h of CONTENT_HUBS) lines.push(`- [${h.title}](${url(`/blog/category/${h.hubSlug}`)})`);
  lines.push('');

  lines.push('## About and contact', '');
  lines.push(
    `- [About ${SITE_CONFIG.name}](${url('/about')}): locally owned handyman service for the Treasure Valley.`,
  );
  lines.push(`- [Contact](${url('/contact')})`);
  lines.push(`- [Instant handyman estimate](${url('/estimate')})`);
  lines.push(`- [Homeowner resources and checklists](${url('/resources')})`, '');

  lines.push('## Optional', '');
  lines.push(`- [Blog](${url('/blog')})`, '');

  lines.push('## Machine-readable endpoints', '');
  lines.push(`- [Sitemap](${url('/sitemap.xml')}): every indexable page.`);
  lines.push(`- [Image sitemap](${url('/sitemap-images.xml')}): guide and article imagery with titles and captions.`);
  lines.push(`- [RSS feed](${url('/feed.xml')}): guides and articles, newest first, with publication and revision dates.`);
  lines.push(`- [Full text for LLMs](${url('/llms-full.txt')}): expanded reference copy of the core facts.`, '');

  lines.push(`Last updated: ${today}.`);
  return lines.join('\n') + '\n';
}

function buildFull(): string {
  const lines: string[] = [];
  lines.push(`# ${SITE_CONFIG.name} - Full Reference`, '');
  lines.push(`> ${SUMMARY}`, '');

  lines.push('## About', '');
  lines.push(
    `${SITE_CONFIG.name} is a locally owned handyman service for the Treasure Valley. We handle ` +
      `the small jobs that keep a home working: drywall repair and patching, interior and ` +
      `exterior painting touch-ups, minor plumbing and electrical repairs, carpentry and trim ` +
      `repair, door and window adjustment, TV, shelf and furniture mounting and assembly, ` +
      `fence, deck and gutter repair, caulking and weatherproofing, and general punch-list ` +
      `work. Every job gets a written quote before work starts, and most jobs are finished in ` +
      `one visit. Full remodels, additions, and anything that requires a general contractor or ` +
      `a licensed trade are out of scope and referred out.`,
    '',
  );
  lines.push('- Business type: Handyman service (home repairs, installs, and maintenance)');
  lines.push('- Service model: Upfront written quotes, one clear price per visit, one-trip fixes');
  lines.push(`- Contact: ${url('/contact')}`);
  lines.push(`- Instant estimator: ${url('/estimate')}`, '');

  lines.push('## Service area', '');
  lines.push('We serve the following Treasure Valley cities across Ada and Canyon County:', '');
  if (adaCities.length) lines.push(`- Ada County: ${adaCities.join(', ')}`);
  if (canyonCities.length) lines.push(`- Canyon County: ${canyonCities.join(', ')}`);
  lines.push(
    '',
    'Most handyman-scope repairs do not require a permit in Ada or Canyon County, and we flag ' +
      'the exceptions (structural, gas, major electrical or plumbing alterations) before work ' +
      'begins so the right licensed trade handles them.',
    '',
  );

  lines.push('## Services', '');
  for (const s of SERVICES) {
    lines.push(`- ${s.name}: /services/${s.slug} - ${s.shortDescription}`);
  }
  lines.push(
    '',
    `Each service has a dedicated page per city at /services/{service-slug}/{city-slug} for ` +
      `${CITIES.map((c) => c.slug).join(', ')}. City service-area hubs live at /areas/{city-slug}.`,
    '',
  );

  lines.push(`## Authoritative guides (${url('/guides')})`, '');
  lines.push('Pillar guides (own the head terms):', '');
  for (const g of pillarGuides) lines.push(`- ${g.title}: /guides/${g.slug}`);
  if (cityGuides.length) {
    lines.push('', 'City guides:', '');
    for (const g of cityGuides) lines.push(`- /guides/${g.slug}`);
  }
  if (neighborhoodGuides.length) {
    lines.push('', 'Neighborhood guides:', '');
    for (const g of neighborhoodGuides) lines.push(`- /guides/${g.slug}`);
  }
  lines.push('');

  lines.push('## Blog category hubs (long-tail questions support the pillars)', '');
  for (const h of CONTENT_HUBS) lines.push(`- ${h.title}: /blog/category/${h.hubSlug}`);
  lines.push('', `${BLOG_POSTS.length} articles across these hubs. Index: /blog`, '');

  lines.push('## Planning resources', '');
  lines.push('- Homeowner resources (free PDFs and visual guides): /resources');
  lines.push('- Home maintenance checklist: /downloads/home-maintenance-checklist.pdf');
  lines.push('- Home repair priority worksheet: /downloads/home-repair-priority-worksheet.pdf');
  lines.push('- Ada vs Canyon County permit flow (visual guide): /resources/ada-canyon-permit-flow', '');

  lines.push('## Common questions', '');
  lines.push(
    '- What does a handyman visit cost in Boise? Market rates in the Treasure Valley typically ' +
      'run $60 to $120 per hour. Every job with us is quoted upfront as one written price before ' +
      'work starts, with a single small repair starting around $145 and materials billed at cost ' +
      'as their own line.',
  );
  lines.push(
    '- How fast can a repair be scheduled? Standard visits book at the next available slot, ' +
      'usually within the week; priority scheduling within two business days is available for ' +
      'an added fee. Most small repairs are finished in a single one-to-three-hour visit.',
  );
  lines.push(
    '- Who supplies the materials? Either works. You can have parts on the counter when we ' +
      'arrive, or we pick them up and bill materials at cost with a supply-run line on the quote.',
  );
  lines.push(
    '- What is out of scope? Full remodels, additions, structural work, repipes, panel or ' +
      'service upgrades, gas lines, and re-roofs. Those need a general contractor or a licensed ' +
      'trade, and we say so and refer out rather than take the job.',
  );
  lines.push(
    '- Do small repairs need a permit? Most handyman-scope work in Ada and Canyon County does ' +
      'not. Structural changes and major electrical, plumbing, or mechanical alterations do, ' +
      'and we flag those before any work begins.',
    '',
  );

  lines.push('## Key pages', '');
  lines.push(`- Home: ${url('/')}`);
  lines.push(`- About: ${url('/about')}`);
  lines.push(`- Services: ${url('/services')}`);
  lines.push(`- Service areas: ${url('/areas')}`);
  lines.push(`- Instant estimator: ${url('/estimate')}`);
  lines.push(`- Blog: ${url('/blog')}`);
  lines.push(`- Guides: ${url('/guides')}`);
  lines.push(`- Resources: ${url('/resources')}`);
  lines.push(`- Contact: ${url('/contact')}`, '');

  lines.push('## RE-10 / Inspection Repairs', '');
  lines.push(
    `${SITE_CONFIG.name} also completes RE-10 and home inspection repairs for real estate agents, ` +
      `buyers and sellers across Boise and the Treasure Valley. An RE-10 is the Idaho inspection ` +
      `response form: after a home inspection the buyer requests specific repairs before closing. ` +
      `We review the RE-10 and inspection report, provide a written scope and pricing, coordinate ` +
      `access, complete the approved work across multiple trades, and supply photo documentation, ` +
      `invoices and receipts for the transaction file. Structural, foundation, mold and asbestos ` +
      `abatement, main electrical service, sewer and septic, HVAC replacement, gas lines and full ` +
      `roof replacement are coordinated to licensed specialists rather than performed in house. ` +
      `Inspection repair lists are exactly the small, defined jobs a handyman does every day, ` +
      `and we sequence them against a closing date that will not move. ` +
      `Details: ${url('/re-10-repairs-boise')}`,
    '',
  );

  lines.push(`Last updated: ${today}. Full sitemap: ${url('/sitemap.xml')}`);
  return lines.join('\n') + '\n';
}

const targets: Array<[string, string]> = [
  ['llms.txt', buildShort()],
  ['llms-full.txt', buildFull()],
];

const check = process.argv.includes('--check');
let drift = false;

for (const [name, content] of targets) {
  const file = path.join(__dirname, '..', 'public', name);
  const existing = fs.existsSync(file) ? fs.readFileSync(file, 'utf8') : '';
  // The date line changes daily; ignore it so the check is about content drift.
  const norm = (s: string) => s.replace(/Last updated: \d{4}-\d{2}-\d{2}/g, 'Last updated: DATE');
  if (check) {
    if (norm(existing) !== norm(content)) {
      console.error(`verify:llms FAILED - public/${name} is out of date. Run: npm run generate:llms`);
      drift = true;
    }
  } else {
    fs.writeFileSync(file, content, 'utf8');
    console.log(`Wrote public/${name} (${content.split('\n').length} lines)`);
  }
}

if (check) {
  if (drift) process.exit(1);
  console.log('verify:llms OK (llms.txt and llms-full.txt match the content layer)');
}
