import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import path from 'node:path';
import { SERVICE_AREA_CITY_NAMES, SERVICE_AREA_CITIES } from '../shared/contentData.ts';
import { getCityLocalSection } from '../shared/cityPageFacts.ts';

const NINE = [...SERVICE_AREA_CITY_NAMES];
const ROOTS = ['app', 'shared', 'public', 'components'];
const SKIP = new Set(['node_modules', '.next', 'backlink-engine']);

function filesUnder(dir: string, acc: string[] = []): string[] {
  for (const name of readdirSync(dir)) {
    if (SKIP.has(name)) continue;
    const full = path.join(dir, name);
    const info = statSync(full);
    if (info.isDirectory()) filesUnder(full, acc);
    else if (/\.(tsx?|txt|mdx)$/.test(name)) acc.push(full);
  }
  return acc;
}

function sentences(text: string): string[] {
  return text
    .replace(/<[^>]+>/g, ' ')
    .split(/(?<=[.!?])\s+/);
}

test('the shared service-area list is the nine cities', () => {
  assert.deepEqual(NINE, [
    'Boise',
    'Meridian',
    'Nampa',
    'Eagle',
    'Kuna',
    'Caldwell',
    'Star',
    'Middleton',
    'Garden City',
  ]);
});

test('a we-serve roster that names cities names all nine', () => {
  const roster = /\bwe serve\b|\bwe work across\b|\bwe work in\b/i;
  const misses: string[] = [];
  for (const root of ROOTS) {
    for (const file of filesUnder(root)) {
      const text = readFileSync(file, 'utf8');
      for (const sentence of sentences(text)) {
        if (!roster.test(sentence)) continue;
        if (/\bnearby\b/i.test(sentence)) continue;
        const found = NINE.filter((city) => sentence.includes(city));
        if (found.length >= 6 && found.length < 9) {
          misses.push(`${file}: ${found.join(', ')}`);
        }
      }
    }
  }
  assert.deepEqual(misses, []);
});

test('an Ada County city list that names the other Ada cities includes Garden City', () => {
  const misses: string[] = [];
  for (const root of ROOTS) {
    for (const file of filesUnder(root)) {
      const text = readFileSync(file, 'utf8');
      for (const sentence of sentences(text)) {
        const adaList = /Boise, Meridian, Eagle, Kuna,(?: and)? Star/.test(sentence);
        if (!adaList) continue;
        if (sentence.includes('Garden City')) continue;
        if (!/Ada/.test(sentence) && !/city limits/.test(sentence)) continue;
        misses.push(`${file}: ${sentence.slice(0, 180)}`);
      }
    }
  }
  assert.deepEqual(misses, []);
});

test('area pages, the areas hub, and the homepage city list link Garden City', () => {
  const areas = readFileSync('app/areas/page.tsx', 'utf8');
  const home = readFileSync('components/approved/ApprovedHome.tsx', 'utf8');
  assert.match(areas, /SERVICE_AREA_CITIES\.map/);
  assert.match(home, /function ApprovedServiceArea/);
  assert.match(home, /SERVICE_AREA_CITY_NAMES\.map/);
  assert.match(home, /href=\{`\/areas\/\$\{city\.toLowerCase\(\)/);
  assert.equal('Garden City'.toLowerCase().replaceAll(' ', '-'), 'garden-city');
  assert.ok(SERVICE_AREA_CITIES.some((city) => city.slug === 'garden-city'));
  for (const city of SERVICE_AREA_CITIES) {
    if (city.slug === 'garden-city') continue;
    const section = getCityLocalSection(city);
    assert.ok(
      section.links.some((link) => link.href === '/areas/garden-city'),
      `${city.slug} nearby links include Garden City`,
    );
  }
  const garden = getCityLocalSection(SERVICE_AREA_CITIES.find((city) => city.slug === 'garden-city')!);
  assert.equal(garden.links.some((link) => link.href === '/areas/garden-city'), false);
});
