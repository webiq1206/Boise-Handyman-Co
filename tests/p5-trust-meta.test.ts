import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { buildPageMetadata } from "../lib/page-metadata.ts";
import {
  generateCityServiceDescription,
  generateMetaDescription,
  SHOW_TRUST_CLAIMS,
} from "../lib/seo.ts";
import { CITIES, SERVICES } from "../shared/contentData.ts";

const FORBIDDEN = /\btrusted\b|top-rated|satisfaction guaranteed/i;

function metaHtml(title: unknown, description: unknown): string {
  return `<!doctype html><html><head><title>${String(title ?? "")}</title><meta name="description" content="${String(description ?? "")}"></head><body></body></html>`;
}

test("built HTML has no trust claims outside the terms page when the flag is off", () => {
  assert.equal(SHOW_TRUST_CLAIMS, false);
  const html: string[] = [];

  for (const service of SERVICES) {
    for (const city of CITIES) {
      const meta = buildPageMetadata({
        kind: "city-service",
        serviceName: service.name,
        serviceSlug: service.slug,
        cityName: city.name,
        citySlug: city.slug,
        path: `/services/${service.slug}/${city.slug}`,
      });
      const description = String(meta.description ?? "");
      assert.ok(
        description.length <= 160,
        `${service.slug}/${city.slug} is ${description.length} characters: ${description}`,
      );
      html.push(metaHtml(meta.title, description));
    }
  }

  for (const city of CITIES) {
    const description = generateMetaDescription({
      serviceName: "Plumbing Repairs",
      serviceSlug: "plumbing-repairs",
      city: city.name,
    });
    assert.ok(description.length <= 160, `${city.name} fallback is ${description.length}: ${description}`);
    html.push(metaHtml(`Plumbing Repairs in ${city.name}`, description));
  }

  const built = html.join("\n");
  assert.deepEqual(built.match(/\btrusted\b|top-rated|satisfaction guaranteed/gi) ?? [], []);

  const garden = generateCityServiceDescription("Drywall Repair", "Garden City");
  const caldwell = generateCityServiceDescription("Drywall Repair", "Caldwell");
  assert.equal(FORBIDDEN.test(garden), false, garden);
  assert.equal(FORBIDDEN.test(caldwell), false, caldwell);
  assert.equal(garden.includes("Garden City"), true);
  assert.equal(caldwell.includes("Caldwell"), true);

  const terms = readFileSync(new URL("../app/terms-of-service/page.tsx", import.meta.url), "utf8");
  assert.match(terms, /<h2 id="document-section-9">Satisfaction Guarantee<\/h2>/);
  const termsBody = terms.replace(/<h2 id="document-section-9">Satisfaction Guarantee<\/h2>/, "");
  assert.equal(FORBIDDEN.test(termsBody), false);

  const seo = readFileSync(new URL("../lib/seo.ts", import.meta.url), "utf8");
  assert.equal(seo.includes("Kuna's trusted local"), true);
  assert.equal(seo.includes("Meridian's trusted"), true);
  assert.equal(seo.includes("Nampa's trusted"), true);
  assert.equal(seo.includes("Caldwell's trusted"), true);
  assert.equal(seo.includes("${city}'s trusted"), true);
  assert.equal(seo.includes("Satisfaction guaranteed"), true);
});
