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

  // Phase 4: generated descriptions no longer carry a city "trusted/local"
  // lead or a CTA variant at all; they open with the searched term. The
  // keyword-first, length, phone and "!" rules live in
  // tests/generated-descriptions.test.ts.
  for (const city of ["Meridian", "Caldwell", "Garden City"]) {
    const description = generateCityServiceDescription("Drywall Repair & Patching", city);
    assert.equal(description.startsWith(`Drywall repair in ${city}, Idaho`), true, description);
    assert.equal(FORBIDDEN.test(description), false, description);
  }

  const terms = readFileSync(new URL("../app/terms-of-service/page.tsx", import.meta.url), "utf8");
  assert.match(terms, /<h2 id="document-section-9">Satisfaction Guarantee<\/h2>/);
  const termsBody = terms.replace(/<h2 id="document-section-9">Satisfaction Guarantee<\/h2>/, "");
  assert.equal(FORBIDDEN.test(termsBody), false);

});
