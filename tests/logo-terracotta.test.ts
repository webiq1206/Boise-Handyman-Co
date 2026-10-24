import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {approvedBrand} from '../components/approved/brand';
import {ESTIMATOR_BRAND} from '../lib/p5/brand';
import {buildLogoImage} from '../server/services/emailLayout';

const ACCENT = '#CB633B';
const BONE = '#F7F5F3';
const CHARCOAL = '#2C302F';

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

test('site, email and estimate use the surface-correct accent wordmarks', () => {
  assert.equal(approvedBrand.wordmarkLight, '/brand/p5-wordmark-light.svg');
  assert.equal(approvedBrand.wordmarkDark, '/brand/p5-wordmark-dark.svg');
  const component = readFileSync('components/approved/ApprovedBrand.tsx', 'utf8');
  assert.match(component, /\/brand\/p5-family-\$\{dark\?'light':'dark'\}\.svg/);
  assert.ok(!component.includes('cb633b'));
  assert.equal(
    ESTIMATOR_BRAND.logo,
    '/brand/png/wordmark/light/boise-handyman-co-wordmark-charcoal-accent-1200w.png',
  );
  assert.ok(readFileSync(`public${ESTIMATOR_BRAND.logo}`).length > 0);
  const emailLogo = buildLogoImage();
  assert.ok(emailLogo.includes('/brand/png/wordmark/dark/boise-handyman-co-wordmark-bone-accent-1200w.png'));
  assert.ok(!emailLogo.includes('cb633b'));
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
});
