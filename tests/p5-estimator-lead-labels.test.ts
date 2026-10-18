import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { trackAcceptedLeadConversion } from "../lib/analytics.ts";
import {
  GOOGLE_ADS_ESTIMATOR_LABEL,
  GOOGLE_ADS_LEAD_LABEL,
  trackGoogleAdsLeadConversion,
} from "../lib/googleAdsConversion.ts";

const ESTIMATOR = "AW-18354188204/cEzmCPOagKAdEKzf-q9E";
const FORM = "AW-18354188204/LE2vCPXstO8cEKzf-q9E";

function browser() {
  const calls: unknown[][] = [];
  const storage = new Map<string, string>();
  Object.assign(globalThis, {
    window: {
      gtag: (...args: unknown[]) => calls.push(args),
      location: { pathname: "/quote" },
      sessionStorage: {
        getItem: (key: string) => storage.get(key) ?? null,
        setItem: (key: string, value: string) => storage.set(key, value),
      },
    },
  });
  return { calls };
}

function conversions(calls: unknown[][]) {
  return calls
    .filter((call) => call[0] === "event" && call[1] === "conversion")
    .map((call) => call[2] as { send_to: string; transaction_id?: string; value: number; currency: string });
}

test("intake and estimator keys fire both labels once", () => {
  const page = browser();
  assert.equal(GOOGLE_ADS_ESTIMATOR_LABEL, ESTIMATOR);
  assert.equal(GOOGLE_ADS_LEAD_LABEL, FORM);
  assert.equal(trackGoogleAdsLeadConversion({ service: "drywall" }, "intake:project-1"), true);
  assert.equal(trackGoogleAdsLeadConversion({ service: "paint" }, "estimator:draft-1"), true);
  const sent = conversions(page.calls);
  assert.deepEqual(
    sent.map((params) => [params.send_to, params.transaction_id]),
    [
      [ESTIMATOR, "intake:project-1"],
      [FORM, "intake:project-1"],
      [ESTIMATOR, "estimator:draft-1"],
      [FORM, "estimator:draft-1"],
    ],
  );
  for (const params of sent) {
    assert.equal(params.currency, "USD");
    assert.equal(params.value, 50);
    assert.equal("email" in params, false);
    assert.equal("phone" in params, false);
  }
  const estimator = readFileSync(new URL("../components/P5Estimator.tsx", import.meta.url), "utf8");
  assert.equal(estimator.includes(ESTIMATOR), false);
  assert.equal(estimator.includes("cEzmCPOagKAdEKzf-q9E"), false);
});

test("a repeat of an estimator key fires nothing", () => {
  const page = browser();
  assert.equal(trackGoogleAdsLeadConversion({ service: "drywall" }, "intake:project-repeat"), true);
  page.calls.length = 0;
  assert.equal(trackGoogleAdsLeadConversion({ service: "drywall" }, "intake:project-repeat"), false);
  assert.equal(trackGoogleAdsLeadConversion({ service: "paint" }, "estimator:draft-repeat"), true);
  page.calls.length = 0;
  assert.equal(trackGoogleAdsLeadConversion({ service: "paint" }, "estimator:draft-repeat"), false);
  assert.deepEqual(conversions(page.calls), []);
});

test("acceptedLead false fires the estimator label only", () => {
  const page = browser();
  assert.equal(trackGoogleAdsLeadConversion({ service: "drywall", acceptedLead: false }, "intake:project-declined"), true);
  assert.equal(trackGoogleAdsLeadConversion({ acceptedLead: false }, "estimator:draft-declined"), true);
  assert.deepEqual(
    conversions(page.calls).map((params) => [params.send_to, params.transaction_id]),
    [
      [ESTIMATOR, "intake:project-declined"],
      [ESTIMATOR, "estimator:draft-declined"],
    ],
  );
});

test("conv_ and contact keys fire the form label only", () => {
  const page = browser();
  assert.equal(trackGoogleAdsLeadConversion({ projectType: "paint" }, "conv_primary"), true);
  assert.equal(trackGoogleAdsLeadConversion({ projectType: "paint" }, "contact:primary"), true);
  assert.deepEqual(
    conversions(page.calls).map((params) => [params.send_to, params.transaction_id]),
    [
      [FORM, "conv_primary"],
      [FORM, "contact:primary"],
    ],
  );
});

test("the consultation conversion uses the submission key and does not claim the Meta Lead has email or phone", () => {
  const page = browser();
  const leadKey = "11111111-1111-4111-8111-111111111111";
  trackAcceptedLeadConversion({ projectType: "paint" }, leadKey);
  assert.deepEqual(conversions(page.calls), [
    { send_to: FORM, value: 50, currency: "USD", transaction_id: leadKey },
  ]);
  const consult = readFileSync(new URL("../components/ConsultationForm.tsx", import.meta.url), "utf8");
  assert.match(consult, /inquiryId: leadKey/);
  assert.match(consult, /trackAcceptedLeadConversion\(\{ projectType: variables\.projectType \}, response\.leadKey\)/);
  assert.equal(consult.includes("The Meta Lead carries the visitor's email + phone"), false);
  assert.equal(consult.includes("not include the visitor's email or phone"), true);
});
