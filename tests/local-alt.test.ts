import assert from 'node:assert/strict';
import test from 'node:test';
import { getBlogImageAlt } from '../shared/blogImages.ts';
import { BLOG_IMAGE_REGISTRY } from '../shared/blogImageRegistry.ts';
import { CITIES, SERVICES } from '../shared/contentData.ts';
import { CITY_HERO_IMAGES, CITY_SERVICE_IMAGES } from '../shared/cityServiceImages.ts';
import { altForImage } from '../shared/imageAlts.ts';
import { cityForSlug, localAlt, subjectForService } from '../shared/localAlt.ts';

// Owner, 19 November 2026: every image names the work and the place, with no
// qualifier such as "idea", "concept" or "representative" in the description.
const QUALIFIER = /\b(idea|ideas|concept|representative|inspiration|rendering|render)\b/i;

test('a local alt names the work, the city and Idaho, then the picture', () => {
  assert.equal(
    localAlt('Hands spreading joint compound over a drywall patch', { subject: 'drywall repair', city: 'Meridian' }),
    'Drywall repair in Meridian, Idaho: hands spreading joint compound over a drywall patch',
  );
  assert.equal(localAlt('A tool bag on a front step'), 'Handyman services in Boise, Idaho: a tool bag on a front step');
  // Already local: left exactly as written.
  assert.equal(localAlt('Nick Perkins in Meridian, Idaho'), 'Nick Perkins in Meridian, Idaho');
});

test('every service-in-city photograph has a description and a local alt for its own service and city', () => {
  for (const [key, src] of Object.entries(CITY_SERVICE_IMAGES)) {
    const [serviceSlug, citySlug] = key.split('/');
    const city = cityForSlug(citySlug);
    assert.ok(city && SERVICES.some((s) => s.slug === serviceSlug), key);
    const alt = altForImage(src, { subject: subjectForService(serviceSlug), city });
    assert.ok(alt, `${key}: ${src} has no description in shared/imageAlts.ts`);
    assert.match(alt, new RegExp(` in ${city}, Idaho: `), `${key}: ${alt}`);
    assert.ok(!QUALIFIER.test(alt), `${key}: ${alt}`);
  }
});

test('every area photograph has a local alt', () => {
  for (const city of CITIES) {
    const src = CITY_HERO_IMAGES[city.slug];
    if (!src) continue;
    const alt = altForImage(src, { city: city.name });
    assert.ok(alt, `${city.slug}: ${src} has no description`);
    assert.match(alt, new RegExp(` in ${city.name}, Idaho: `), `${city.slug}: ${alt}`);
  }
});

test('every blog and guide photograph has a local alt', () => {
  for (const slug of Object.keys(BLOG_IMAGE_REGISTRY)) {
    const alt = getBlogImageAlt(slug);
    assert.match(alt, /, Idaho/, `${slug}: ${alt}`);
    assert.ok(!QUALIFIER.test(alt.split(': ')[0]), `${slug}: ${alt}`);
  }
});
