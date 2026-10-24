import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {approvedBrand} from '../components/approved/brand';
import {ESTIMATOR_BRAND} from '../lib/p5/brand';
import {buildLogoImage} from '../server/services/emailLayout';

test('live icon and wordmark are entirely the exact terracotta, with unchanged geometry', () => {
  for (const [live, original] of [
    ['boise-handyman-wordmark-cb633b.svg', 'p5-wordmark-light.svg'],
    ['boise-handyman-mark-cb633b.svg', 'p5-family-light.svg'],
  ]) {
    const actual = readFileSync(`public/brand/${live}`, 'utf8');
    const source = readFileSync(`public/brand/${original}`, 'utf8');
    assert.deepEqual([...new Set(actual.match(/#[0-9a-f]{6}/gi))], ['#CB633B']);
    assert.equal(actual, source.replace(/#[0-9a-f]{6}/gi, '#CB633B'));
  }
});

test('site, email and estimate use the new color-specific logo URLs', () => {
  assert.equal(approvedBrand.wordmarkLight, '/brand/boise-handyman-wordmark-cb633b.svg');
  assert.equal(approvedBrand.wordmarkDark, approvedBrand.wordmarkLight);
  assert.equal(ESTIMATOR_BRAND.logo, '/brand/boise-handyman-wordmark-cb633b-1200w.png');
  assert.ok(buildLogoImage().includes(ESTIMATOR_BRAND.logo));
  assert.ok(readFileSync(`public${ESTIMATOR_BRAND.logo}`).length > 0);
  const component = readFileSync('components/approved/ApprovedBrand.tsx', 'utf8');
  assert.ok(component.includes('/brand/boise-handyman-mark-cb633b.svg'));
  assert.ok(!component.includes('/brand/p5-family-'));
  assert.ok(readFileSync('components/approved/family-content.ts', 'utf8').includes(
    "logo:'/brand/boise-handyman-wordmark-cb633b.svg'",
  ));
});
