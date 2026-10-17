import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { CONTRACTOR_REGISTRATION, CONTRACTOR_REGISTRATION_SEARCH_URL, RETIRED_REGISTRATION_DETAILS, RETIRED_REGISTRATION_ON_REQUEST } from '../shared/trustClaims.ts';

test('the footer shows the proven Idaho contractor registration', () => {
  const footer = readFileSync('components/Footer.tsx', 'utf8');
  const about = readFileSync('app/about/page.tsx', 'utf8').replace(/\s+/g, ' ');
  const claims = readFileSync('shared/trustClaims.ts', 'utf8');

  assert.ok(footer.includes(CONTRACTOR_REGISTRATION));
  assert.equal(footer.includes(RETIRED_REGISTRATION_ON_REQUEST), false);
  assert.equal(footer.includes('License details available upon request'), false);
  assert.ok(about.includes(CONTRACTOR_REGISTRATION));
  assert.equal(about.includes(RETIRED_REGISTRATION_DETAILS), false);
  assert.equal(about.includes('License details'), false);
  assert.ok(claims.includes(RETIRED_REGISTRATION_ON_REQUEST));
  assert.ok(claims.includes(RETIRED_REGISTRATION_DETAILS));
  assert.equal(claims.includes(CONTRACTOR_REGISTRATION_SEARCH_URL), true);

  const faq = readFileSync('components/FAQSection.tsx', 'utf8');
  for (const source of [footer, about, faq]) {
    assert.equal(source.includes('CONTRACTOR_REGISTRATION_SEARCH_URL'), true);
    assert.equal(source.includes('rel="noopener"'), true);
    assert.equal(/Idaho Registered Contractor #8381215\s*\(/.test(source), false);
  }

  const schemaSources = [
    readFileSync('shared/homepageFaqs.ts', 'utf8'),
    readFileSync('lib/seo.ts', 'utf8'),
    readFileSync('components/seo/HomePageSchema.tsx', 'utf8'),
    readFileSync('shared/gbpProfile.ts', 'utf8'),
  ];
  for (const source of schemaSources) {
    assert.equal(source.includes(CONTRACTOR_REGISTRATION_SEARCH_URL), false);
    assert.equal(source.includes('<a '), false);
  }
});
