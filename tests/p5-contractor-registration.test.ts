import assert from 'node:assert/strict';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import test from 'node:test';
import { generateLocalBusinessSchema, generateReviewSchema, generateServiceSchema } from '../lib/schema.ts';
import { HOW_P5_WORKS } from '../shared/siteContent.ts';

const credential = readFileSync('components/ContractorCredential.tsx', 'utf8');
const footer = readFileSync('components/Footer.tsx', 'utf8');
const about = readFileSync('app/about/page.tsx', 'utf8');

test('the registration number stays outside the DOPL link', () => {
  const numberAt = credential.indexOf('Idaho Registered Contractor #8381215');
  const gateAt = credential.indexOf('showVerifyLink ?');
  assert.ok(numberAt >= 0 && gateAt > numberAt);
  assert.match(credential, /DOPL_LOOKUP_TITLE = "Look up registration 8381215 on Idaho DOPL"/);
  assert.match(credential, /DOPL_LOOKUP_LABEL = "Verify with Idaho DOPL: look up registration 8381215, opens in a new tab"/);
  assert.match(credential, /DOPL_LOOKUP_HREF = "https:\/\/edopl\.idaho\.gov\/OnlineServices\/\?link=PubSearch"/);
  assert.match(credential, /title=\{DOPL_LOOKUP_TITLE\}/);
  assert.match(credential, /aria-label=\{DOPL_LOOKUP_LABEL\}/);
  assert.match(credential, /href=\{DOPL_LOOKUP_HREF\}/);
  assert.equal(footer.includes('License details available upon request'), false);
  assert.equal(footer.includes('showVerifyLink={false}'), false);
  assert.match(footer, /<ContractorCredential /);
  assert.match(about, /refer\s+licensed trade work to specialists we trust/);
  assert.match(about, /<ContractorCredential \/>/);
  assert.match(about, /Insurance\s+details are available on request/);
  assert.equal(about.includes('Business registration and insurance details are available on request'), false);
  assert.equal(about.includes('License details'), false);
});

function sourceFiles(dir: string): string[] {
  const files: string[] = [];
  for (const name of readdirSync(dir)) {
    if (name === 'node_modules' || name === '.next') continue;
    const path = join(dir, name);
    if (statSync(path).isDirectory()) files.push(...sourceFiles(path));
    else if (name.endsWith('.tsx') || name.endsWith('.ts') || name.endsWith('.md')) files.push(path);
  }
  return files;
}

test('the estimate funnel shows the number and hides the DOPL link', () => {
  const hidden = [
    'app/estimate/page.tsx',
    'app/estimate/scope/page.tsx',
    'app/estimate/p5-preview/page.tsx',
  ];
  const found: string[] = [];
  for (const file of [...sourceFiles('app'), ...sourceFiles('components')]) {
    if (!readFileSync(file, 'utf8').includes('showVerifyLink={false}')) continue;
    found.push(file.replace(/\\/g, '/'));
  }
  assert.deepEqual(found.sort(), hidden.sort());
  for (const file of hidden) {
    const source = readFileSync(file, 'utf8');
    assert.equal(source.includes('edopl.idaho.gov'), false, file);
    assert.equal(source.includes('dopl.idaho.gov'), false, file);
  }
});

test('How P5 works is six selling points plus Nick', () => {
  assert.deepEqual([...HOW_P5_WORKS], [
    'Own install crew',
    'Bonded & insured',
    'Manufacturer warranties passed through on parts we supply',
    'Arrival time agreed and confirmed before we head out',
    'Upfront quote before work starts',
    'Free quotes from photos, no pressure',
    'Public representative: Nick Perkins',
  ]);
  assert.equal(HOW_P5_WORKS.some((line) => line.includes('Workmanship made right')), false);
  assert.equal(HOW_P5_WORKS.some((line) => line === 'Manufacturer warranties passed through'), false);
  const home = readFileSync('app/page.tsx', 'utf8');
  assert.match(home, /<HowP5Works \/>/);
  assert.ok(home.indexOf('<HowP5Works />') < home.indexOf('id="consult"'));
  assert.match(about, /HOW_P5_WORKS\.map/);
});

const contractorCredential = {
  '@type': 'EducationalOccupationalCredential',
  credentialCategory: 'registration',
  name: 'Idaho Registered Contractor',
  identifier: '8381215',
  recognizedBy: {
    '@type': 'GovernmentOrganization',
    name: 'Idaho Division of Occupational and Professional Licenses',
    url: 'https://dopl.idaho.gov/con/',
  },
};

test('every business JSON-LD node carries the registration credential', () => {
  assert.deepEqual(generateLocalBusinessSchema().hasCredential, contractorCredential);
  assert.deepEqual(generateLocalBusinessSchema('Caldwell').hasCredential, contractorCredential);
  const provider = generateServiceSchema('Drywall repair', 'Patch a wall', 'Meridian').provider as { hasCredential?: unknown };
  assert.deepEqual(provider.hasCredential, contractorCredential);
  assert.deepEqual(generateReviewSchema([]).hasCredential, contractorCredential);
  const layout = readFileSync('app/layout.tsx', 'utf8');
  assert.match(layout, /<SiteBusinessSchema \/>/);
});

test('Handyman copy does not say Workmanship made right', () => {
  const hits: string[] = [];
  for (const root of ['app', 'components', 'shared', 'server', 'lib', '.agents', 'public']) {
    for (const file of sourceFiles(root)) {
      if (file.startsWith('tests/')) continue;
      const text = readFileSync(file, 'utf8');
      if (/workmanship made right/i.test(text)) hits.push(file);
    }
  }
  assert.deepEqual(hits, []);
});
