import { readFileSync } from 'node:fs';
import test from 'node:test';
import assert from 'node:assert/strict';

const policy = readFileSync(new URL('../app/privacy-policy/page.tsx', import.meta.url), 'utf8');

test('the privacy policy discloses cookies, analytics and advertising', () => {
  assert.match(policy, /Last updated: October 17, 2026/);
  assert.match(policy, /Cookies, analytics and advertising\. We use Google Analytics 4 \(GA4\) to understand how visitors use this site, such as pages viewed, referring site, approximate location, browser and device type\./);
  assert.match(policy, /Google may use cookies to show our ads to people who have visited this site \(remarketing\)\./);
  assert.match(policy, /We do not send your name, email, phone number or project details to Google\./);
  assert.match(policy, /href="https:\/\/policies\.google\.com\/privacy"/);
  assert.match(policy, /href="https:\/\/adssettings\.google\.com"/);
  assert.match(policy, /href="https:\/\/tools\.google\.com\/dlpage\/gaoptout"/);
  assert.match(policy, /We also use the Meta Pixel to measure visits and inquiries that come from our Facebook and Instagram ads\./);
  assert.equal(policy.includes('personalise ads'), false);
  assert.equal(policy.includes('optout.networkadvertising.org'), false);
  assert.equal(policy.includes('hashed email'), false);
  assert.equal(policy.includes('We do not currently send'), false);
});
