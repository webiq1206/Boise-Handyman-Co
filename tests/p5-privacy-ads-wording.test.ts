import { readFileSync } from 'node:fs';
import test from 'node:test';
import assert from 'node:assert/strict';

const policy = readFileSync(new URL('../app/privacy-policy/page.tsx', import.meta.url), 'utf8');

test('the privacy policy states the Google and Meta advertising facts', () => {
  assert.match(policy, /We do not currently send your name, email, phone number or project details to Google\./);
  assert.match(policy, /Google's tag also adds visitors to remarketing lists, and Google may use this data to show you relevant ads on other websites \(remarketing\)\./);
  assert.equal(policy.includes('personalise ads'), false);
  assert.match(policy, /href="https:\/\/adssettings\.google\.com"/);
  assert.match(policy, /href="https:\/\/optout\.networkadvertising\.org\/"/);
  assert.match(policy, /We also use the Meta Pixel and Meta's Conversions API to measure visits and inquiries from our Facebook and Instagram ads\./);
  assert.match(policy, /the Lead event name and time, a matching event id, the page address, the project type, the consultation category, your IP address, your browser user agent, and the Meta browser cookies _fbp and _fbc/);
  assert.match(policy, /href="https:\/\/www\.facebook\.com\/privacy\/policy"/);
  assert.equal(policy.includes('hashed email'), false);
  assert.equal(policy.includes('phone number to Meta'), false);
});
