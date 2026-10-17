import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { generateLocalBusinessSchema, generateOrganizationSchema } from "../lib/schema.ts";
import { BUSINESS_INFO } from "../lib/seo.ts";
import {
  publicFoundingClaims,
  SHOW_FOUNDING_YEAR,
  UNPROVEN_FOUNDING_YEAR,
  yearsInBusiness,
} from "../shared/foundingClaims.ts";
import { GBP_NAP } from "../shared/gbpProfile.ts";
import { PROOF_STATS, visibleTrustItems } from "../shared/siteContent.ts";

const HIDDEN = ["Est. 2020", "founded in 2020", "since 2020", "years in business", "foundingDate"];
const GUARD_PHRASES = [
  "Est. ${year}",
  "founded in ${year}",
  "since ${year}",
  "${years} years in business",
];

test("the unproven 2020 founding year stays in source and does not render", () => {
  assert.equal(UNPROVEN_FOUNDING_YEAR, "2020");
  assert.equal(SHOW_FOUNDING_YEAR, false);
  assert.equal(yearsInBusiness(), null);
  assert.deepEqual(publicFoundingClaims(), []);
  assert.equal(PROOF_STATS.established, "");
  assert.equal(BUSINESS_INFO.founded, "");
  assert.equal(GBP_NAP.founded, "");

  const rendered = JSON.stringify({
    trust: visibleTrustItems(),
    localBusiness: generateLocalBusinessSchema(),
    organization: generateOrganizationSchema(),
  });
  for (const phrase of HIDDEN) {
    assert.equal(rendered.includes(phrase), false, phrase);
  }

  const claims = readFileSync(new URL("../shared/foundingClaims.ts", import.meta.url), "utf8");
  for (const phrase of GUARD_PHRASES) {
    assert.equal(claims.includes(phrase), true, phrase);
  }
  const strip = readFileSync(new URL("../shared/siteContent.ts", import.meta.url), "utf8");
  const trustFn = strip.slice(strip.indexOf("export function visibleTrustItems"));
  assert.match(trustFn, /`Est\. \$\{year\}`/);
  assert.equal(trustFn.includes("publicFoundingClaims"), false);
  assert.equal(visibleTrustItems().length, 6);

  const hero = readFileSync(new URL("../components/sections/HeroSection.tsx", import.meta.url), "utf8");
  const about = readFileSync(new URL("../app/about/page.tsx", import.meta.url), "utf8");
  assert.match(hero, /visibleTrustItems\(\)/);
  assert.match(about, /visibleTrustItems\(\)/);
  for (const source of [hero, about]) {
    for (const phrase of ["Est. 2020", "founded in 2020", "since 2020"]) {
      assert.equal(source.includes(phrase), false, phrase);
    }
  }
});
