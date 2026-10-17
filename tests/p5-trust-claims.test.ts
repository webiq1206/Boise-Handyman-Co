import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { generateMetaDescription } from "../lib/seo.ts";
import { generateLocalBusinessSchema, generateOrganizationSchema } from "../lib/schema.ts";
import { GBP_QA_SEED } from "../shared/gbpProfile.ts";
import { HOMEPAGE_FAQS } from "../shared/homepageFaqs.ts";
import {
  CONTRACTOR_REGISTRATION,
  OVERHEAD_NOTE,
  publishedTrustCopy,
  REGISTERED_CONTRACTOR_QUESTION,
  RETIRED_LICENSE_QUESTION,
  RETIRED_OVERHEAD_NOTE,
  SHOW_TRUST_CLAIMS,
  UNPROVEN_TRUST_COPY,
} from "../shared/trustClaims.ts";

test("unproven trust phrases stay in source and do not render", () => {
  assert.equal(SHOW_TRUST_CLAIMS, false);
  for (const phrase of UNPROVEN_TRUST_COPY) {
    assert.equal(publishedTrustCopy(phrase), "");
    assert.equal(publishedTrustCopy(`Call today. ${phrase}.`), "Call today.");
  }

  const meta = generateMetaDescription({
    serviceName: "Caulking",
    serviceSlug: "home-maintenance",
    city: "Garden City",
  });
  assert.equal(/satisfaction guaranteed/i.test(meta), false);
  assert.equal(/top-?rated/i.test(meta), false);

  const rendered = JSON.stringify({
    faqs: HOMEPAGE_FAQS,
    gbp: GBP_QA_SEED,
    localBusiness: generateLocalBusinessSchema(),
    organization: generateOrganizationSchema(),
    llms: readFileSync("public/llms.txt", "utf8"),
    llmsFull: readFileSync("public/llms-full.txt", "utf8"),
    alts: readFileSync("shared/imageAlts.ts", "utf8"),
  });
  for (const phrase of ["top-rated", "top rated", "satisfaction guaranteed", "satisfaction guarantee"]) {
    assert.equal(rendered.toLowerCase().includes(phrase), false, phrase);
  }

  const claims = readFileSync("shared/trustClaims.ts", "utf8");
  assert.ok(claims.includes(RETIRED_LICENSE_QUESTION));
  assert.ok(claims.includes(RETIRED_OVERHEAD_NOTE));
  assert.equal(HOMEPAGE_FAQS.some((faq) => faq.q === REGISTERED_CONTRACTOR_QUESTION), true);
  assert.equal(HOMEPAGE_FAQS.some((faq) => faq.q === RETIRED_LICENSE_QUESTION), false);
  assert.equal(GBP_QA_SEED.some((entry) => entry.question === REGISTERED_CONTRACTOR_QUESTION), true);
  assert.ok(HOMEPAGE_FAQS.some((faq) => faq.a.includes(CONTRACTOR_REGISTRATION)));
  assert.equal(readFileSync("shared/costCatalog.ts", "utf8").includes(OVERHEAD_NOTE), true);
  assert.equal(readFileSync("lib/seo.ts", "utf8").includes("Satisfaction guaranteed"), true);
});
