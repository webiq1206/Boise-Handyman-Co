import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import test from 'node:test';
import assert from 'node:assert/strict';
import { buildBusinessVCard } from '../lib/vcard.ts';
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
  assert.match(note, /Treasure Valley · Ada and Canyon County/);
  assert.match(note, /Hours: Monday 9:00 AM - 6:00 PM\\; Tuesday 9:00 AM - 6:00 PM\\; Wednesday 9:00 AM - 6:00 PM\\; Thursday 9:00 AM - 6:00 PM\\; Friday 9:00 AM - 6:00 PM\\; Saturday 9:00 AM - 4:00 PM\\; Sunday Closed/);
});

test('the vCard display label includes the street from the ADR field', () => {
  const card = buildBusinessVCard();
  const { street, city, state, postalCode } = SITE_CONFIG.address;
  const label = `${street}\\, ${city}\\, ${state} ${postalCode}`;
  assert.match(card, new RegExp(`ADR;TYPE=WORK:;;${street};${city};${state};${postalCode};US`));
  assert.match(card, new RegExp(`LABEL;TYPE=WORK:${label.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`));
});
