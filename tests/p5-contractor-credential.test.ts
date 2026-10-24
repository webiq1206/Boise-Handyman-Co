import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { generateLocalBusinessSchema } from '../lib/schema.ts';

const credential = {
  '@type': ['EducationalOccupationalCredential', 'GovernmentPermit'],
  credentialCategory: 'license',
  name: 'Idaho contractor registration',
  identifier: '8381215',
  issuedBy: {
    '@type': 'GovernmentOrganization',
    name: 'Idaho Division of Occupational and Professional Licenses',
  },
};

test('the business JSON-LD on every page carries the contractor credential', () => {
  const business = generateLocalBusinessSchema();
  assert.deepEqual(business.hasCredential, credential);
  assert.deepEqual(generateLocalBusinessSchema('Caldwell').hasCredential, credential);
  const layout = readFileSync(new URL('../app/layout.tsx', import.meta.url), 'utf8');
  assert.match(layout, /<SiteBusinessSchema \/>/);
  const site = readFileSync(new URL('../components/seo/SiteBusinessSchema.tsx', import.meta.url), 'utf8');
  assert.match(site, /generateLocalBusinessSchema\(\)/);
  assert.equal(JSON.stringify(business).includes('dopl.idaho.gov'), false);
  assert.equal(JSON.stringify(business).includes('edopl.idaho.gov'), false);
});

test('estimate scope and preview pages have no DOPL link', () => {
  for (const file of ['app/estimate/scope/page.tsx', 'app/estimate/p5-preview/page.tsx']) {
    const source = readFileSync(new URL('../' + file, import.meta.url), 'utf8');
    assert.equal(source.includes('dopl.idaho.gov'), false, file);
    assert.equal(source.includes('edopl.idaho.gov'), false, file);
    assert.equal(source.includes('Verify with Idaho DOPL'), false, file);
  }
});
