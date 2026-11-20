import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import test from 'node:test';
import assert from 'node:assert/strict';
import { buildBusinessVCard } from '../lib/vcard.ts';
import { generateLocalBusinessSchema, generateOrganizationSchema, publicPostalAddress } from '../lib/schema.ts';
import { BUSINESS_INFO } from '../lib/seo.ts';
import { SITE_CONFIG } from '../shared/siteConfig.ts';
import { getAreaCityCopy } from '../shared/content/areaCopy.ts';
import { landingFAQSchema } from '../lib/landing-schema.ts';

const SKIP_DIRS = new Set(['node_modules', '.git', '.next', 'coverage', 'dist']);
const PHRASE = 'being ' + 'finalized';
const OLD_TEL = 'tel:' + '2084771169';

function walk(dir: string, hits: string[], needle: string) {
  for (const name of readdirSync(dir)) {
    if (SKIP_DIRS.has(name)) continue;
    const path = join(dir, name);
    const info = statSync(path);
    if (info.isDirectory()) {
      walk(path, hits, needle);
      continue;
    }
    if (!info.isFile() || info.size > 2_000_000) continue;
    const bytes = readFileSync(path);
    if (bytes.includes(0)) continue;
    if (bytes.toString('utf8').includes(needle)) hits.push(path);
  }
}

test('the repo has no prices-being-finalized wording', () => {
  const hits: string[] = [];
  walk('.', hits, PHRASE);
  assert.deepEqual(hits, []);
});

test('Boise pricing FAQ and its FAQPage schema drop the finalized clause', () => {
  const faqs = getAreaCityCopy('boise')?.faqs ?? [];
  const pricing = faqs.find((faq) => faq.question === 'How does pricing work?');
  assert.ok(pricing);
  assert.match(pricing.answer, /\(every job gets a written quote first\)\./);
  assert.equal(pricing.answer.includes(PHRASE), false);
  const schema = JSON.stringify(landingFAQSchema(faqs));
  assert.match(schema, /\(every job gets a written quote first\)/);
  assert.equal(schema.includes(PHRASE), false);
});

test('business tel links use +1 and the visible number stays the same', () => {
  assert.equal(SITE_CONFIG.phone, '(208) 477-1169');
  assert.equal(SITE_CONFIG.phoneHref, 'tel:+12084771169');
  const hits: string[] = [];
  walk('.', hits, OLD_TEL);
  assert.deepEqual(hits, []);
});

test('every vCard line is at most 75 octets and lines use CRLF', () => {
  const card = buildBusinessVCard();
  assert.equal(card.endsWith('\r\n'), true);
  assert.equal(card.replace(/\r\n/g, '').includes('\n'), false);
  const physical = card.slice(0, -2).split('\r\n');
  const logical: string[] = [];
  for (const line of physical) {
    assert.ok(Buffer.byteLength(line) <= 75, `${Buffer.byteLength(line)} octets: ${line}`);
    if (line.startsWith(' ')) {
      assert.ok(logical.length > 0);
      logical[logical.length - 1] += line.slice(1);
    } else {
      logical.push(line);
    }
  }
  const note = logical.find((line) => line.startsWith('NOTE:'));
  assert.ok(note);
  assert.match(note, /Boise\\, Meridian\\, Nampa\\, Eagle\\, Kuna\\, Caldwell\\, Star\\, Middleton\\, and Garden City\\, plus Ada County and Canyon County/);
  assert.match(note, /Hours: Monday 9:00 AM - 6:00 PM\\; Tuesday 9:00 AM - 6:00 PM\\; Wednesday 9:00 AM - 6:00 PM\\; Thursday 9:00 AM - 6:00 PM\\; Friday 9:00 AM - 6:00 PM\\; Saturday 9:00 AM - 4:00 PM\\; Sunday Closed/);
});

test('the service-area vCard preserves locality without publishing a street-address label', () => {
  const card = buildBusinessVCard();
  const unfolded = card.replace(/\r\n[ \t]/g, '');
  const { city, state, postalCode } = SITE_CONFIG.address;
  assert.deepEqual(
    card.split('\r\n').filter((line) => line.startsWith('ADR;TYPE=WORK:')),
    [`ADR;TYPE=WORK:;;;${city};${state};${postalCode};USA`],
  );
  assert.match(unfolded, /ADR;TYPE=WORK:;;;Meridian;ID;83646;USA/);
  assert.match(unfolded, /ORG:Boise Handyman Co\r\n/);
  assert.match(unfolded, /FN:Nick Perkins\r\n/);
  assert.match(unfolded, /TEL;TYPE=WORK,VOICE:\+12084771169/);
  assert.equal(unfolded.includes('P5 Home Co LLC'), false);
  assert.equal(unfolded.includes('P5 Home Co.'), false);
  assert.equal(Object.hasOwn(SITE_CONFIG.address, 'street'), false);
  assert.equal(Object.hasOwn(SITE_CONFIG.address, 'streetAddress'), false);
  assert.equal(postalCode, '83646');
  assert.equal(card.includes('LABEL;TYPE=WORK:'), false);
  assert.equal(card.includes('streetAddress'), false);
});

test('visible phone, schema telephone, and schema email match the brand', () => {
  assert.equal(SITE_CONFIG.phone, '(208) 477-1169');
  assert.equal(BUSINESS_INFO.phone, '(208) 477-1169');
  const local = generateLocalBusinessSchema();
  const organization = generateOrganizationSchema();
  assert.equal(local.telephone, '+1-208-477-1169');
  assert.equal(organization.telephone, '+1-208-477-1169');
  const domain = new URL(SITE_CONFIG.siteUrl).hostname.replace(/^www\./, '');
  assert.equal(local.email, `hello@${domain}`);
  assert.equal(organization.email, `hello@${domain}`);
  assert.equal(local.email, 'hello@boisehandyman.co');
  const address = publicPostalAddress();
  assert.deepEqual(address, {
    '@type': 'PostalAddress',
    addressLocality: 'Meridian',
    addressRegion: 'ID',
    postalCode: '83646',
    addressCountry: 'US',
  });
  assert.equal(Object.hasOwn(address, 'streetAddress'), false);
  for (const node of [local, organization]) {
    assert.equal(node.legalName, 'P5 Home Co LLC');
    const parent = node.parentOrganization as { name: string };
    assert.equal(parent.name, 'P5 Home Co');
    assert.equal(JSON.stringify(node).includes('streetAddress'), false);
  }
});

/** "P5 Home Co." with the period inside the name, not a sentence that ends on the name. */
const NAME_WITH_PERIOD = /P5 Home Co\.(?=\s+[a-z])/;

test('site copy does not use P5 Home Co LLC or P5 Home Co. as a name', () => {
  const files = ['app', 'public', 'lib/vcard.ts'].flatMap((entry) => {
    const info = statSync(entry);
    if (info.isFile()) return [entry];
    const found: string[] = [];
    const walkDir = (dir: string) => {
      for (const name of readdirSync(dir)) {
        if (name === 'node_modules' || name === '.next') continue;
        const path = join(dir, name);
        const child = statSync(path);
        if (child.isDirectory()) walkDir(path);
        else if (/\.(tsx|ts|txt|mdx)$/.test(name)) found.push(path);
      }
    };
    walkDir(entry);
    return found;
  });
  const llc: string[] = [];
  const dotted: string[] = [];
  for (const file of files) {
    const text = readFileSync(file, 'utf8');
    if (text.includes('P5 Home Co LLC')) llc.push(file);
    if (NAME_WITH_PERIOD.test(text)) dotted.push(file);
  }
  assert.deepEqual(llc, []);
  assert.deepEqual(dotted, []);
});
