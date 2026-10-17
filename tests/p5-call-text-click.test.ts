import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import {
  GOOGLE_ADS_CALL_CLICK_LABEL,
  GOOGLE_ADS_TEXT_CLICK_LABEL,
  googleAdsContactClickLabel,
  trackGoogleAdsContactClick,
} from "../lib/googleAdsConversion.ts";
import { SITE_CONFIG } from "../shared/siteConfig.ts";

const CALL = "AW-18354188204/ng9fCPiOhaAdEKzf-q9E";
const TEXT = "AW-18354188204/lTxsCOqahaAdEKzf-q9E";

test("call and text click labels are the P5 actions", () => {
  assert.equal(GOOGLE_ADS_CALL_CLICK_LABEL, CALL);
  assert.equal(GOOGLE_ADS_TEXT_CLICK_LABEL, TEXT);
  assert.equal(googleAdsContactClickLabel(SITE_CONFIG.phoneHref), CALL);
  assert.equal(googleAdsContactClickLabel(SITE_CONFIG.phoneSmsHref), TEXT);
  assert.equal(googleAdsContactClickLabel("tel:+12084771169"), CALL);
  assert.equal(googleAdsContactClickLabel("tel:" + "2084771169"), CALL);
  assert.equal(googleAdsContactClickLabel("sms:" + "2084771169"), TEXT);
});

test("other numbers, mailto, and empty hrefs are not call or text conversions", () => {
  assert.equal(googleAdsContactClickLabel("tel:+12085551212"), null);
  assert.equal(googleAdsContactClickLabel("sms:2085551212"), null);
  assert.equal(googleAdsContactClickLabel("mailto:hello@boisehandyman.co"), null);
  assert.equal(googleAdsContactClickLabel(""), null);
  assert.equal(googleAdsContactClickLabel("#consult"), null);
});

test("each click fires one conversion and the next click fires again", () => {
  const calls: unknown[][] = [];
  const previous = globalThis.window;
  Object.assign(globalThis, {
    window: { gtag: (...args: unknown[]) => calls.push(args) },
  });
  try {
    assert.equal(trackGoogleAdsContactClick("tel:+12084771169"), true);
    assert.equal(trackGoogleAdsContactClick("tel:+12084771169"), true);
    assert.equal(trackGoogleAdsContactClick("sms:" + "2084771169"), true);
    assert.equal(trackGoogleAdsContactClick("mailto:hello@boisehandyman.co"), false);
    assert.equal(trackGoogleAdsContactClick("tel:+12085551212"), false);
  } finally {
    if (previous === undefined) delete (globalThis as { window?: unknown }).window;
    else Object.assign(globalThis, { window: previous });
  }
  assert.deepEqual(calls, [
    ["event", "conversion", { send_to: CALL }],
    ["event", "conversion", { send_to: CALL }],
    ["event", "conversion", { send_to: TEXT }],
  ]);
});

test("a missing gtag does not throw and does not record a conversion", () => {
  const previous = globalThis.window;
  Object.assign(globalThis, { window: {} });
  try {
    assert.equal(trackGoogleAdsContactClick(SITE_CONFIG.phoneHref), false);
    assert.equal(trackGoogleAdsContactClick(SITE_CONFIG.phoneSmsHref), false);
  } finally {
    if (previous === undefined) delete (globalThis as { window?: unknown }).window;
    else Object.assign(globalThis, { window: previous });
  }
});

test("the existing delegated listener fires the click conversion once per tel or sms click", () => {
  const source = readFileSync(new URL("../components/ConversionTracking.tsx", import.meta.url), "utf8");
  assert.equal((source.match(/addEventListener\('click'/g) ?? []).length, 1);
  assert.equal((source.match(/trackGoogleAdsContactClick\(href\)/g) ?? []).length, 2);
  const phoneBranch = source.slice(source.indexOf("href.startsWith('tel:')"), source.indexOf("href.startsWith('sms:')"));
  const smsBranch = source.slice(source.indexOf("href.startsWith('sms:')"), source.indexOf("href.startsWith('mailto:')"));
  assert.match(phoneBranch, /trackGoogleAdsContactClick\(href\)/);
  assert.match(smsBranch, /trackGoogleAdsContactClick\(href\)/);
  const mailBranch = source.slice(source.indexOf("href.startsWith('mailto:')"));
  assert.doesNotMatch(mailBranch, /trackGoogleAdsContactClick/);
});

test("mobile header and the estimator bar publish the site tel and sms hrefs", () => {
  const nav = readFileSync(new URL("../components/Navigation.tsx", import.meta.url), "utf8");
  const estimate = readFileSync(new URL("../app/estimate/layout.tsx", import.meta.url), "utf8");
  assert.match(nav, /data-testid="link-phone-mobile-header"/);
  assert.match(nav, /data-testid="link-text-mobile-header"/);
  assert.ok(nav.indexOf("data-mobile-contact") < nav.indexOf("<Dialog.Root"));
  assert.match(nav, /href=\{SITE_CONFIG\.phoneHref\}/);
  assert.match(nav, /href=\{SITE_CONFIG\.phoneSmsHref\}/);
  assert.match(estimate, /href=\{SITE_CONFIG\.phoneHref\}/);
  assert.match(estimate, /href=\{SITE_CONFIG\.phoneSmsHref\}/);
  assert.match(estimate, /data-site-header/);
});
