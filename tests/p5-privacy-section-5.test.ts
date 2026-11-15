import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";

const page = readFileSync("app/privacy-policy/page.tsx", "utf8");
const section = page.slice(page.indexOf('id="cookies-analytics-advertising"'), page.indexOf('id="document-section-5"'));

test("the cookies section names analytics, ads, Clarity, and the Meta pixel", () => {
  assert.ok(section.includes('id="cookies-analytics-advertising"'));
  assert.match(section, /Cookies, analytics and advertising/);
  assert.match(section, /Google Analytics 4 \(GA4\)/);
  assert.match(section, /Google Ads/);
  assert.match(section, /Microsoft Clarity/);
  assert.match(section, /form fields are masked/);
  assert.match(section, /Meta Pixel/);
  assert.match(section, /Conversions API/);
  assert.match(section, /hashed form/);
  assert.match(section, /_fbp and _fbc/);
});

test("the cookies section keeps the Google and Meta privacy links", () => {
  assert.match(section, /href="https:\/\/policies\.google\.com\/privacy"/);
  assert.match(section, /href="https:\/\/privacy\.microsoft\.com\/privacystatement"/);
  assert.match(section, /href="https:\/\/www\.facebook\.com\/privacy\/policy"/);
});

test("the privacy policy date stays with this page", () => {
  assert.match(page, /Last updated: January 2024/);
});
