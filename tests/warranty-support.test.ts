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
  assert.match(faqs, /One year on our workmanship, from documented Final Completion/);
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
