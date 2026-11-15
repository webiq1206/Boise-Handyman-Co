import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";

const page = readFileSync("app/privacy-policy/page.tsx", "utf8");
const section = page.slice(page.indexOf('id="cookies-analytics-advertising"'), page.indexOf('id="document-section-5"'));

test("the privacy page discloses Google Analytics 4, Google Ads, and the Meta pixel", () => {
  assert.match(section, /Google Analytics 4 \(GA4\)/);
  assert.match(section, /Google Ads to measure which of our ads lead to quote requests, calls and texts/);
  assert.match(section, /send Google your name, your own phone number/);
  assert.match(section, /If your call goes through a Google forwarding number/);
  assert.match(section, /calling number and call length/);
  assert.match(section, /Microsoft Clarity/);
  assert.match(section, /Meta Pixel and Meta's Conversions API/);
  assert.match(section, /hashed form/);
  assert.match(section, /href="https:\/\/www\.facebook\.com\/privacy\/policy"/);
  assert.match(page, /We do not sell your personal information/);
  assert.match(page, /Last updated: January 2024/);
});
