import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {FAMILY_BRAND} from '../lib/familyBrand.ts';

// R02: one-year workmanship coverage from documented Final Completion.
// R13: the warranty page leads existing customers to help, not to a sales quote.
const page = readFileSync('app/warranty/page.tsx', 'utf8');

test('warranty duration and start follow the verified policy', () => {
  assert.match(page, /one year of documented Final Completion/);
  assert.doesNotMatch(page, /of the completed visit|two[- ]year|2[- ]year|lifetime/i);
  const faqs = readFileSync('shared/homepageFaqs.ts', 'utf8');
  assert.match(faqs, /One year on our own team's workmanship, from documented Final Completion/);
});

// D1 (owner, 8 November 2026): our coverage is our own team's work. Subcontractor
// work carries the subcontractor's own warranty, and every project ends with a
// complete subcontractor list with contact information.
test('subcontractor work is stated plainly as covered by the subcontractor warranty', () => {
  const faqs = readFileSync('shared/homepageFaqs.ts', 'utf8');
  const terms = readFileSync('app/terms-of-service/page.tsx', 'utf8');
  for (const [label, text] of [['warranty page', page], ['homepage FAQ', faqs], ['terms', terms]] as const) {
    assert.match(text, /performed by our own team|our own team's workmanship|Work performed by our own team/i, label);
    assert.match(text, /covered by that subcontractor's own warranty|covered by that subcontractor&apos;s own warranty/, label);
    assert.match(text, /complete list of the subcontractors who worked on it, with their contact information/, label);
  }
  assert.match(page, /Work by subcontractors/);
  assert.match(page, /we can point you to the right subcontractor from the list/);
  assert.match(page, /Manufacturer and product warranties are separate/);
  // The release 1 trade-partner exclusion is replaced by the statement above.
  assert.doesNotMatch(page, /Trade-partner warranties|we schedule and stand behind the visit/);
});

test('no copy says our coverage includes subcontractors or that we stand behind their work', () => {
  const files = ['app/warranty/page.tsx', 'app/about/page.tsx', 'app/terms-of-service/page.tsx', 'shared/homepageFaqs.ts', 'shared/gbpProfile.ts', 'shared/seoContent.ts', 'shared/content/re10Content.ts'];
  const forbidden = /covering our people and the subcontractors|covers our crews? and subcontractors|our crew and the subcontractors we hire|trade partners (?:we schedule and )?(?:we )?stand behind|we schedule and stand behind/i;
  for (const file of files) assert.doesNotMatch(readFileSync(file, 'utf8'), forbidden, file);
});

test('terms drop the 48-hour satisfaction window and keep the D9 payment and cancellation policy', () => {
  const terms = readFileSync('app/terms-of-service/page.tsx', 'utf8');
  assert.match(terms, /Last updated November 8, 2026/);
  assert.match(terms, /P5 Home Co LLC/);
  assert.match(terms, /signed agreement governs/);
  assert.doesNotMatch(terms, /48 hours|Satisfaction Guarantee|automatic billing|Recurring service/i);
  assert.match(terms, /We do not ask for payment in advance. We invoice after the work is complete/);
  assert.match(terms, /Cancellation of scheduled services requires 24-hour advance notice/);
  assert.match(terms, /agreed with you in writing before the affected work/);
});

test('warranty page primary next step is getting help with a completed project', () => {
  assert.match(page, /href="#get-help" variant="hero" data-hero-cta="primary">Get help with a completed project</);
  assert.doesNotMatch(page, /ConsultCTA|CTA_PRIMARY/);
  assert.match(page, /id="get-help"/);
  for (const item of ['Your name', 'The project address', 'The affected item and where it is in the home', 'When it started', 'Photos, if you have them']) {
    assert.ok(page.includes(item), item);
  }
  assert.match(page, /mailto:\$\{SITE_CONFIG\.email\}/);
  assert.match(page, /SITE_CONFIG\.phoneHref/);
  assert.match(page, /signed agreement sets the notice method/);
  assert.match(page, /contact emergency services or your utility first/);
  assert.match(page, /not an emergency service/);
  // No invented portal, ticket number or repair deadline.
  assert.doesNotMatch(page, /portal|ticket|within \d+ (?:hours|days)/i);
});

test('footer offers existing customers a help link', () => {
  const company = FAMILY_BRAND.footer.groups.find((group) => group.title === 'Company');
  assert.ok(company?.links.some((link) => link.label === 'Existing customer? Get help' && link.href === '/warranty#get-help'));
});
