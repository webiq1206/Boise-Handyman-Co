import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { generateLocalBusinessSchema, generateOrganizationSchema } from "../lib/schema.ts";
import { BUSINESS_INFO } from "../lib/seo.ts";
import {
  omitHiddenFoundingClaims,
  publicFoundingClaims,
  SHOW_FOUNDING_YEAR,
  UNPROVEN_FOUNDING_YEAR,
  visibleTrustItems,
  yearsInBusiness,
} from "../shared/foundingClaims.ts";
import { GBP_NAP } from "../shared/gbpProfile.ts";
import { PROOF_STATS, TRUST_ITEMS } from "../shared/siteContent.ts";

const HIDDEN = ["since 2020", "founded in 2020", "EST 2020", "Est. 2020", "years in business", "foundingDate"];

test("the unproven 2020 founding year stays in source and does not render", () => {
  assert.equal(UNPROVEN_FOUNDING_YEAR, "2020");
  assert.equal(SHOW_FOUNDING_YEAR, false);
  assert.equal(yearsInBusiness(), null);
  assert.deepEqual(publicFoundingClaims(), []);
  assert.equal(PROOF_STATS.established, "");
  assert.equal(BUSINESS_INFO.founded, "");
  assert.equal(GBP_NAP.founded, "");

  const rendered = JSON.stringify({
    trust: visibleTrustItems(TRUST_ITEMS),
    localBusiness: generateLocalBusinessSchema(),
    organization: generateOrganizationSchema(),
  });
  for (const phrase of HIDDEN) {
    assert.equal(rendered.includes(phrase), false, phrase);
  }

  const hero = readFileSync(new URL("../components/sections/HeroSection.tsx", import.meta.url), "utf8");
  const about = readFileSync(new URL("../app/about/page.tsx", import.meta.url), "utf8");
  const prompt = readFileSync(new URL("../scripts/marketing-image-prompts.json", import.meta.url), "utf8");
  const imageScript = readFileSync(new URL("../scripts/generate-marketing-images.mjs", import.meta.url), "utf8");
  assert.match(hero, /visibleTrustItems\(TRUST_ITEMS\)/);
  assert.match(about, /visibleTrustItems\(TRUST_ITEMS\)/);
  assert.match(imageScript, /omitHiddenFoundingClaims/);
  assert.equal(prompt.includes("EST 2020"), false);
  assert.match(prompt, /No people, no shirts, no text, no logos/);
  assert.deepEqual(visibleTrustItems(TRUST_ITEMS), TRUST_ITEMS);
  const claims = readFileSync(new URL("../shared/foundingClaims.ts", import.meta.url), "utf8");
  assert.match(claims, /`Est\. \$\{year\}`/);
  for (const phrase of ["since 2020", "founded in 2020", "EST 2020", "Est. 2020"]) {
    assert.equal(hero.includes(phrase), false, phrase);
    assert.equal(about.includes(phrase), false, phrase);
    assert.equal(omitHiddenFoundingClaims(prompt).includes(phrase), false, phrase);
  }
});
