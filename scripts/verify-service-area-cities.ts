import assert from "node:assert/strict";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import {
  CITIES,
  SERVICE_AREA_CITY_NAMES,
  SERVICE_AREA_COUNTIES,
  SERVICE_AREA_LINE,
  isServiceAreaCity,
} from "../shared/contentData";
import { RE10_SERVICE_AREAS } from "../shared/content/re10Content";
import { BUSINESS_INFO } from "../lib/seo";
import {
  generateLocalBusinessSchema,
  generateOrganizationSchema,
  generateServiceSchema,
} from "../lib/schema";
import { getAllSiteUrls } from "../lib/siteUrls";
import { PUBLIC_NAP_LINE, SITE_CONFIG } from "../shared/siteConfig";

const cities = [...SERVICE_AREA_CITY_NAMES];
const counties = [...SERVICE_AREA_COUNTIES];

assert.deepEqual(
  cities,
  ["Boise", "Meridian", "Nampa", "Eagle", "Kuna", "Caldwell", "Star", "Middleton", "Garden City"],
  "the nine official service-area cities (owner, 20 November 2026): the seven in their order, then Middleton and Garden City",
);
assert.deepEqual(counties, ["Ada County", "Canyon County"]);
assert.equal(
  SERVICE_AREA_LINE,
  "Boise, Meridian, Nampa, Eagle, Kuna, Caldwell, Star, Middleton, and Garden City, plus Ada County and Canyon County",
);
assert.equal(SITE_CONFIG.address.serviceArea, SERVICE_AREA_LINE);
assert.equal(PUBLIC_NAP_LINE, `Serving ${SERVICE_AREA_LINE}.`);
assert.deepEqual(RE10_SERVICE_AREAS, cities, "RE-10 service areas match the service-area cities");
assert.deepEqual([...BUSINESS_INFO.serviceArea], cities, "BUSINESS_INFO.serviceArea is the service-area cities");
assert.equal(CITIES.length, 9, "published town pages stay, including Middleton and Garden City");
assert.deepEqual(
  [...CITIES.map((city) => city.name)].sort(),
  [...cities].sort(),
  "every published town page is a service-area city, and every service-area city has a page",
);
assert.equal(CITIES.some((city) => city.slug === "middleton"), true);
assert.equal(CITIES.some((city) => city.slug === "garden-city"), true);

for (const city of cities) {
  assert.equal(isServiceAreaCity(city), true, `${city} is in the service area`);
}
assert.equal(isServiceAreaCity("Middleton"), true, "Middleton has a published page and is served");
assert.equal(isServiceAreaCity("Garden City"), true, "Garden City is in the official service area");
assert.equal(isServiceAreaCity("Emmett"), false, "towns outside the profile are not service-area cities");

const expectedNodes = [
  ...cities.map((name) => `City:${name}`),
  ...counties.map((name) => `AdministrativeArea:${name}`),
];

function areaLabels(value: unknown): string[] {
  const areas = value as Array<{ "@type": string; name: string }>;
  return areas.map((area) => `${area["@type"]}:${area.name}`);
}

const local = generateLocalBusinessSchema();
const organization = generateOrganizationSchema();
assert.deepEqual(areaLabels(local.areaServed), expectedNodes, "LocalBusiness areaServed");
assert.deepEqual(areaLabels(organization.areaServed), expectedNodes, "Organization areaServed");
assert.deepEqual(
  areaLabels(generateServiceSchema("Drywall repair", "Patch a wall").areaServed),
  expectedNodes,
  "default Service areaServed",
);
const middleton = generateServiceSchema("Drywall repair", "Patch a wall", "Middleton").areaServed as {
  "@type": string;
  name: string;
};
assert.equal(middleton["@type"], "City");
assert.equal(middleton.name, "Middleton");

const localJson = JSON.stringify(local);
assert.equal(localJson.includes("streetAddress"), false);
assert.match(localJson, /"postalCode":"83646"/);
assert.equal((local.address as { postalCode?: string; streetAddress?: string }).streetAddress, undefined);
assert.match(localJson, /8381215/);
assert.equal(localJson.includes(String(BUSINESS_INFO.email)), true);
assert.equal(organization.email, BUSINESS_INFO.email);
assert.equal(organization.telephone, local.telephone);

const paths = new Set(getAllSiteUrls().map((entry) => entry.path));
for (const slug of ["middleton", "garden-city", "boise", "star"]) {
  assert.equal(paths.has(`/areas/${slug}`), true, `${slug} stays in the sitemap`);
}

// A sentence that names the seven profile cities in order must go on to
// Middleton and Garden City. Thirteen copies of the old seven-city sentence
// (homepage FAQ, articles, RE-10, the subcontractor page) sat untouched by the
// 20 November 2026 change until a live read found them on 21 November 2026.
{
  const roots = ["shared", "app", "components", "lib", "public"];
  const sevenThenStop = /Boise, Meridian, Nampa, Eagle, Kuna, Caldwell,? (?:and|or) Star\b/;
  const offenders: string[] = [];
  const walk = (dir: string) => {
    for (const name of readdirSync(dir)) {
      const path = join(dir, name);
      if (name === "node_modules" || name.startsWith(".")) continue;
      if (statSync(path).isDirectory()) walk(path);
      else if (/\.(tsx?|mjs|json|txt|md|html)$/.test(name) && sevenThenStop.test(readFileSync(path, "utf8"))) offenders.push(path);
    }
  };
  for (const root of roots) walk(root);
  assert.deepEqual(offenders, [], "a city list stops at Star; name all nine (SERVICE_AREA_LINE)");
}

console.log("verify-service-area-cities: nine cities, two counties, one per published town page");
