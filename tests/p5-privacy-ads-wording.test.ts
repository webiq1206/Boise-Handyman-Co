import { readFileSync } from 'node:fs';
import test from 'node:test';
import assert from 'node:assert/strict';

const policy = readFileSync(new URL('../app/privacy-policy/page.tsx', import.meta.url), 'utf8');

test('the reconciled privacy policy preserves newer disclosures and adds inquiry deduplication', () => {
  assert.match(policy, /Google Ads receives a random reference number for your inquiry so each lead is counted only once\./);
  assert.match(policy, /When you tap Call or Text on our site/);
  assert.match(policy, /Google Analytics also records the tap, including the number tapped, which is our business number/);
  assert.match(policy, /Google connects the call and can see the calling number and call length, but not what's said/);
  assert.match(policy, /form fields are masked so what you type is not recorded/);
  assert.match(policy, /Depending on Meta's settings, the pixel may also collect contact details you type into a form, in hashed form/);
  assert.match(policy, /our server may send Meta the Lead event/);
  assert.match(policy, /only until you close the tab/);
  assert.match(policy, /id="cookies-analytics-advertising"/);
  assert.equal(policy.includes('We do not send your name, email or phone number to Meta.'), false);
  for (const link of ['https://policies.google.com/privacy', 'https://privacy.microsoft.com/privacystatement', 'https://www.facebook.com/privacy/policy']) assert.ok(policy.includes(link));
});
