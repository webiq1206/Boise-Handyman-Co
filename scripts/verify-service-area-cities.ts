import assert from "node:assert/strict";
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
  ["Boise", "Meridian", "Nampa", "Eagle", "Kuna", "Caldwell", "Star"],
  "service area cities stay in Google Business Profile order",
);
assert.deepEqual(counties, ["Ada County", "Canyon County"]);
assert.equal(
  SERVICE_AREA_LINE,
  "Boise, Meridian, Nampa, Eagle, Kuna, Caldwell, and Star, plus Ada County and Canyon County",
);
assert.equal(SITE_CONFIG.address.serviceArea, SERVICE_AREA_LINE);
assert.equal(PUBLIC_NAP_LINE, `Serving ${SERVICE_AREA_LINE}.`);
assert.deepEqual(RE10_SERVICE_AREAS, cities, "RE-10 service areas match the seven cities");
assert.deepEqual([...BUSINESS_INFO.serviceArea], cities, "BUSINESS_INFO.serviceArea is the seven cities");
assert.equal(CITIES.length, 9, "published town pages stay, including Middleton and Garden City");
assert.equal(CITIES.some((city) => city.slug === "middleton"), true);
assert.equal(CITIES.some((city) => city.slug === "garden-city"), true);

for (const city of cities) {
  assert.equal(isServiceAreaCity(city), true, `${city} is in the service area`);
}
assert.equal(isServiceAreaCity("Middleton"), false, "Middleton stays a page, not a service-area city");
assert.equal(isServiceAreaCity("Garden City"), false, "Garden City stays a page, not a service-area city");
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

console.log("verify-service-area-cities: seven cities, two counties, published town pages kept");
