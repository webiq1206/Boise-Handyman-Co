import test from 'node:test';
import assert from 'node:assert/strict';
import {existsSync, readFileSync} from 'node:fs';
import {approvedBrand} from '../components/approved/brand';
import {ESTIMATOR_BRAND} from '../lib/p5/brand';
import {buildLogoImage, buildTextLogo} from '../server/services/emailLayout';
import {assertAccentWordmark, assertFamilyFive, BONE, CHARCOAL, HANDYMAN_ACCENT} from '../scripts/brand/wordmark-lock.mjs';

const ACCENT = HANDYMAN_ACCENT;

function colors(rel: string) {
  return [...new Set(readFileSync(rel, 'utf8').match(/#[0-9a-f]{6}/gi) ?? [])]
    .map((color) => color.toUpperCase())
    .sort();
}

test('header lockup is two-tone: ink wordmark, accent only on Co. and the family 5', () => {
  assert.deepEqual(colors('public/brand/p5-wordmark-light.svg'), [ACCENT, BONE].sort());
  assert.deepEqual(colors('public/brand/p5-wordmark-dark.svg'), [ACCENT, CHARCOAL].sort());
  const familyLight = readFileSync('public/brand/p5-family-light.svg', 'utf8');
  const familyDark = readFileSync('public/brand/p5-family-dark.svg', 'utf8');
  assert.equal((familyLight.match(/#CB633B/g) ?? []).length, 1);
  assert.match(familyLight, /stroke="#FBFAF6"/);
  assert.equal((familyDark.match(/#CB633B/g) ?? []).length, 1);
  assert.match(familyDark, /stroke="#2C302F"/);
  assert.deepEqual(
    colors('public/brand/svg/wordmark/dark/boise-handyman-co-wordmark-bone-accent.svg'),
    [ACCENT, BONE].sort(),
  );
  assert.deepEqual(
    colors('public/brand/svg/wordmark/light/boise-handyman-co-wordmark-charcoal-accent.svg'),
    [ACCENT, CHARCOAL].sort(),
  );
});

test('Co. outlines use the same hex as the family 5, and letters do not', () => {
  const lockups: [string, string][] = [
    ['public/brand/p5-wordmark-light.svg', BONE],
    ['public/brand/p5-wordmark-dark.svg', CHARCOAL],
    ['public/brand/svg/wordmark/dark/boise-handyman-co-wordmark-bone-accent.svg', BONE],
    ['public/brand/svg/wordmark/light/boise-handyman-co-wordmark-charcoal-accent.svg', CHARCOAL],
    ['public/brand/svg/wordmark-full/dark/boise-handyman-co-wordmark-full-bone-accent.svg', BONE],
    ['public/brand/svg/wordmark-full/light/boise-handyman-co-wordmark-full-charcoal-accent.svg', CHARCOAL],
    ['public/family/handyman-boise-handyman-co-wordmark-bone-accent.svg', BONE],
  ];
  for (const [file, letters] of lockups) {
    const svg = readFileSync(file, 'utf8');
    const parts = assertAccentWordmark(svg, {letters, accent: ACCENT});
    assert.equal(parts.co, ACCENT, file);
    assert.ok(parts.letters.every((fill) => fill === letters), file);
    assert.ok(!svg.includes('#8FAEC4'), file);
    assert.ok(!svg.includes('#E48F6D'), file);
  }
  assertFamilyFive(readFileSync('public/brand/p5-family-light.svg', 'utf8'), ACCENT);
  assertFamilyFive(readFileSync('public/brand/p5-family-dark.svg', 'utf8'), ACCENT);
  const boneCo = readFileSync('public/brand/p5-wordmark-light.svg', 'utf8').replaceAll(ACCENT, BONE);
  assert.throws(() => assertAccentWordmark(boneCo, {letters: BONE, accent: ACCENT}));
  const solid = readFileSync('public/brand/p5-wordmark-light.svg', 'utf8').replace(/#[0-9A-Fa-f]{6}/g, ACCENT);
  assert.throws(() => assertAccentWordmark(solid, {letters: BONE, accent: ACCENT}));
});

test('site, email and estimate use the surface-correct accent wordmarks', () => {
  assert.equal(approvedBrand.wordmarkLight, '/brand/p5-wordmark-light.svg?v=co-accent');
  assert.equal(approvedBrand.wordmarkDark, '/brand/p5-wordmark-dark.svg?v=co-accent');
  assert.equal(approvedBrand.accent, ACCENT);
  const component = readFileSync('components/approved/ApprovedBrand.tsx', 'utf8');
  assert.match(component, /\/brand\/p5-family-\$\{dark\?'light':'dark'\}\.svg/);
  assert.ok(!component.includes('cb633b'));
  assert.equal(
    ESTIMATOR_BRAND.logo,
    '/brand/png/wordmark/light/boise-handyman-co-wordmark-charcoal-accent-1200w.png',
  );
  assert.ok(readFileSync(`public${ESTIMATOR_BRAND.logo}`).length > 0);
  const emailLogo = buildLogoImage();
  assert.ok(emailLogo.includes('/brand/png/wordmark/dark/boise-handyman-co-wordmark-bone-accent-1200w.png?v=co-accent'));
  assert.ok(!emailLogo.includes('wordmark-cb633b'));
  const textLogo = buildTextLogo();
  assert.match(textLogo, /color:#CB633B;font-style:italic;">Co\./);
  assert.ok(!textLogo.includes('#E48F6D'));
  assert.ok(!textLogo.includes('#8FAEC4'));
  assert.ok(readFileSync('components/approved/family-content.ts', 'utf8').includes(
    "logo:asset('handyman-boise-handyman-co-wordmark-bone-accent.svg')",
  ));
});

test('the solid terracotta wordmark is not wired into the site', () => {
  for (const file of [
    'components/approved/brand.ts',
    'components/approved/ApprovedBrand.tsx',
    'components/approved/family-content.ts',
    'lib/p5/brand.ts',
    'server/services/emailLayout.ts',
    'app/style-guide/page.tsx',
    'scripts/brand/generate-brand-assets.mjs',
  ]) {
    const text = readFileSync(file, 'utf8');
    assert.ok(!text.includes('boise-handyman-wordmark-cb633b'), file);
    assert.ok(!text.includes('boise-handyman-mark-cb633b'), file);
  }
  for (const file of [
    'public/brand/boise-handyman-wordmark-cb633b.svg',
    'public/brand/boise-handyman-mark-cb633b.svg',
    'public/brand/boise-handyman-wordmark-cb633b-1200w.png',
  ]) {
    assert.equal(existsSync(file), false, file);
  }
  const generator = readFileSync('scripts/brand/generate-brand-assets.mjs', 'utf8');
  assert.match(generator, /forceAccentWordmark/);
  assert.match(generator, /prepareHeaderWordmark/);
  assert.ok(!generator.includes('.replace(/#[0-9a-f]{6}/gi, accent)'));
  assert.ok(!generator.includes('boise-handyman-wordmark-cb633b'));
});
