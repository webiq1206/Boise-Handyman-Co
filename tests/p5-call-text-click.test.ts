import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { bindContactClicks, handleContactClick } from "../lib/contactClicks.ts";
import {
  GOOGLE_ADS_CALL_CLICK_LABEL,
  GOOGLE_ADS_TEXT_CLICK_LABEL,
  trackGoogleAdsContactClick,
} from "../lib/googleAdsConversion.ts";
import { SITE_CONFIG } from "../shared/siteConfig.ts";

const CALL = "AW-18354188204/ng9fCPiOhaAdEKzf-q9E";
const TEXT = "AW-18354188204/lTxsCOqahaAdEKzf-q9E";

type ClickFn = (event: { target: unknown }) => void;

function browser(options: { disabled?: boolean; webdriver?: boolean } = {}) {
  const calls: unknown[][] = [];
  const storage = new Map<string, string>();
  if (options.disabled) storage.set("p5_analytics_disabled", "1");
  const previousWindow = globalThis.window;
  const previousNavigator = Object.getOwnPropertyDescriptor(globalThis, "navigator");
  Object.assign(globalThis, {
    window: {
      gtag: (...args: unknown[]) => calls.push(args),
      location: { pathname: "/contact" },
      sessionStorage: { getItem: (key: string) => storage.get(key) ?? null, setItem: (key: string, value: string) => storage.set(key, value) },
    },
  });
  if (options.webdriver) {
    Object.defineProperty(globalThis, "navigator", { configurable: true, value: { webdriver: true } });
  }
  return {
    calls,
    restore() {
      if (previousWindow === undefined) delete (globalThis as { window?: unknown }).window;
      else Object.assign(globalThis, { window: previousWindow });
      if (previousNavigator) Object.defineProperty(globalThis, "navigator", previousNavigator);
    },
  };
}

function anchor(href: string) {
  return { getAttribute: (name: string) => (name === "href" ? href : null), closest: () => null };
}

function click(href: string) {
  const link = anchor(href);
  handleContactClick({ target: { closest: (selector: string) => (selector === "a[href]" ? link : null) } });
}

function target() {
  const listeners: ClickFn[] = [];
  return {
    listeners,
    addEventListener(_type: string, listener: EventListenerOrEventListenerObject) {
      listeners.push(listener as ClickFn);
    },
    removeEventListener(_type: string, listener: EventListenerOrEventListenerObject) {
      const index = listeners.indexOf(listener as ClickFn);
      if (index >= 0) listeners.splice(index, 1);
    },
    dispatch(href: string) {
      const link = anchor(href);
      for (const listener of [...listeners]) listener({ target: { closest: () => link } });
    },
  };
}

test("one click fires one call or text conversion, and the next click fires again", () => {
  const page = browser();
  try {
    click(SITE_CONFIG.phoneHref);
    click(SITE_CONFIG.phoneHref);
    click(SITE_CONFIG.phoneSmsHref);
    assert.equal(GOOGLE_ADS_CALL_CLICK_LABEL, CALL);
    assert.equal(GOOGLE_ADS_TEXT_CLICK_LABEL, TEXT);
    const conversions = page.calls.filter((call) => call[1] === "conversion");
    assert.deepEqual(conversions, [
      ["event", "conversion", { send_to: CALL }],
      ["event", "conversion", { send_to: CALL }],
      ["event", "conversion", { send_to: TEXT }],
    ]);
    assert.equal(page.calls.some((call) => call[0] === "set" || call[1] === "user_data"), false);
    for (const call of conversions) {
      assert.deepEqual(Object.keys(call[2] as object), ["send_to"]);
      const payload = JSON.stringify(call);
      assert.equal(payload.includes("email"), false);
      assert.equal(payload.includes("phone"), false);
      assert.equal(payload.includes("name"), false);
      assert.equal(payload.includes("@"), false);
    }
    assert.deepEqual(page.calls.filter((call) => call[1] === "contact_click").map((call) => (call[2] as { method: string }).method), ["phone", "phone", "sms"]);
  } finally {
    page.restore();
  }
});

test("analytics off, a webdriver, a missing tag, and other links send no click conversion", () => {
  const disabled = browser({ disabled: true });
  try {
    assert.equal(trackGoogleAdsContactClick(SITE_CONFIG.phoneHref), false);
    assert.equal(trackGoogleAdsContactClick(SITE_CONFIG.phoneSmsHref), false);
    click("mailto:hello@boisehandyman.co");
    assert.equal(disabled.calls.some((call) => call[1] === "conversion"), false);
    assert.equal((disabled.calls.find((call) => call[1] === "contact_click")?.[2] as { method?: string } | undefined)?.method, "email");
  } finally {
    disabled.restore();
  }
  const automated = browser({ webdriver: true });
  try {
    click(SITE_CONFIG.phoneHref);
    assert.equal(automated.calls.some((call) => call[1] === "conversion"), false);
    assert.equal(automated.calls.some((call) => call[1] === "contact_click"), true);
  } finally {
    automated.restore();
  }
  const untagged = browser();
  (globalThis.window as { gtag?: unknown }).gtag = undefined;
  try {
    assert.equal(trackGoogleAdsContactClick(SITE_CONFIG.phoneSmsHref), false);
  } finally {
    untagged.restore();
  }
});

test("a second install shares the one listener, so one click fires once", () => {
  const page = browser();
  const doc = target();
  const first = bindContactClicks(doc);
  const second = bindContactClicks(doc);
  try {
    assert.equal(doc.listeners.length, 1);
    doc.dispatch(SITE_CONFIG.phoneHref);
    assert.equal(page.calls.filter((call) => call[1] === "conversion").length, 1);
    first();
    assert.equal(doc.listeners.length, 1);
    doc.dispatch(SITE_CONFIG.phoneSmsHref);
    assert.equal(page.calls.filter((call) => call[1] === "conversion").length, 2);
    second();
    assert.equal(doc.listeners.length, 0);
    doc.dispatch(SITE_CONFIG.phoneHref);
    assert.equal(page.calls.filter((call) => call[1] === "conversion").length, 2);
  } finally {
    page.restore();
  }
});

test("the site listener is the only ads click binding and the shared estimator is untouched", () => {
  const component = readFileSync(new URL("../components/ConversionTracking.tsx", import.meta.url), "utf8");
  const layout = readFileSync(new URL("../app/layout.tsx", import.meta.url), "utf8");
  const estimator = readFileSync(new URL("../components/P5Estimator.tsx", import.meta.url), "utf8");
  const re10 = readFileSync(new URL("../components/re10/Re10ContactTracking.tsx", import.meta.url), "utf8");
  assert.equal((component.match(/bindContactClicks\(document\)/g) ?? []).length, 1);
  assert.equal(component.includes("addEventListener"), false);
  assert.equal((layout.match(/<ConversionTracking \/>/g) ?? []).length, 1);
  assert.equal(estimator.includes("ng9fCPiOhaAdEKzf-q9E"), false);
  assert.equal(estimator.includes("trackGoogleAdsContactClick"), false);
  assert.equal(re10.includes("trackGoogleAdsContactClick"), false);
  const privacy = readFileSync(new URL("../app/privacy-policy/page.tsx", import.meta.url), "utf8");
  assert.equal(privacy.includes("ng9fCPiOhaAdEKzf-q9E"), false);
  assert.equal(
    privacy.includes(
      "When you tap Call or Text on our site, Google Ads is told that the tap happened and on which page, so we can count calls and texts that come from our ads. The tap itself doesn't include your name, phone number or the content of your call or message.",
    ),
    true,
  );
});
