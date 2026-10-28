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

test('current site and estimate select the approved terracotta palette', () => {
  assert.equal(approvedBrand.accent, '#C56B4A');
  assert.equal(ESTIMATOR_BRAND.accent, '#C56B4A');
  assert.match(readFileSync('components/approved/ApprovedBrand.tsx','utf8'), /approved-lockup-/);
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
