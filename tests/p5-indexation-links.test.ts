import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { generateLocalBusinessSchema, generateOrganizationSchema, generateServiceSchema, P5_PARENT_ORGANIZATION } from '../lib/schema.ts';
import { getAllSiteUrls } from '../lib/siteUrls.ts';
import { isCityServiceNoindex } from '../lib/page-metadata.ts';
import { CITIES, SERVICES } from '../shared/contentData.ts';
import robots from '../app/robots.ts';

test('HomeAndConstructionBusiness parentOrganization uses the P5 business @id', () => {
  const business = generateLocalBusinessSchema();
  const parent = business.parentOrganization as {
    '@type': string;
    '@id': string;
    name: string;
    url: string;
    sameAs: readonly string[];
  };
  assert.equal(business['@type'], 'HomeAndConstructionBusiness');
  assert.equal(parent['@type'], 'Organization');
  assert.equal(parent['@id'], 'https://p5homeco.com/#business');
  assert.equal(parent.name, P5_PARENT_ORGANIZATION.name);
  assert.equal(parent.url, P5_PARENT_ORGANIZATION.url);
  assert.deepEqual([...parent.sameAs], [...P5_PARENT_ORGANIZATION.sameAs]);

  const provider = generateServiceSchema('Drywall repair', 'Patch a wall', 'Boise').provider as {
    '@type': string;
    parentOrganization: { '@id': string; name: string; url: string };
  };
  assert.equal(provider['@type'], 'HomeAndConstructionBusiness');
  assert.equal(provider.parentOrganization['@id'], 'https://p5homeco.com/#business');
  assert.equal(provider.parentOrganization.name, 'P5 Home Co');
  assert.equal(provider.parentOrganization.url, 'https://p5homeco.com');

  const organization = generateOrganizationSchema().parentOrganization as { '@id': string };
  assert.equal(organization['@id'], 'https://p5homeco.com/#organization');
});

test('sitemap lists every indexable service, area, and RE-10 URL with lastmod', () => {
  const urls = getAllSiteUrls();
  const paths = new Set(urls.map((entry) => entry.path));
  for (const entry of urls) {
    assert.ok(entry.lastModified instanceof Date && !Number.isNaN(entry.lastModified.getTime()), entry.path);
  }
  for (const service of SERVICES) assert.equal(paths.has(`/services/${service.slug}`), true, service.slug);
  for (const city of CITIES) assert.equal(paths.has(`/areas/${city.slug}`), true, city.slug);
  assert.equal(paths.has('/re-10-repairs-boise'), true);
  assert.equal(paths.has('/services/home-repairs'), true);
  assert.equal(paths.has('/'), true);
  for (const service of SERVICES) {
    for (const city of CITIES) {
      const path = `/services/${service.slug}/${city.slug}`;
      assert.equal(paths.has(path), !isCityServiceNoindex(service.slug, city.slug), path);
    }
  }
  const rules = robots();
  const star = Array.isArray(rules.rules) ? rules.rules.find((rule) => rule.userAgent === '*') : undefined;
  assert.equal(star?.allow, '/');
  assert.ok(Array.isArray(rules.sitemap) && rules.sitemap.some((url) => url.endsWith('/sitemap.xml')));
});

test('home, the services hub, and service pages use Boise service anchors', () => {
  const home = readFileSync('components/seo/HandymanServicesAnswer.tsx', 'utf8');
  const hub = readFileSync('app/services/page.tsx', 'utf8');
  const related = readFileSync('components/seo/RelatedLinks.tsx', 'utf8');
  const cities = readFileSync('components/approved/family-content.ts', 'utf8');
  assert.match(home, /serviceCityAnchor\(service\.slug, service\.name, 'Boise'\)/);
  assert.match(home, /\/services\/home-repairs/);
  assert.match(home, /\/areas\/\$\{city\.slug\}/);
  assert.match(hub, /serviceCityAnchor\(service\.slug, service\.name, 'Boise'\)/);
  assert.match(hub, /home repairs in Boise/);
  assert.match(hub, /RE-10 inspection repairs in Boise/);
  assert.match(related, /Related services/);
  assert.match(related, /serviceCityAnchor\(service\.slug, service\.name, 'Boise'\)/);
  assert.match(cities, /'Garden City'/);
});
