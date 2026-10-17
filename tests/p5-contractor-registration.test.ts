import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

test('the footer calls the Idaho contractor credential a registration', () => {
  const footer = readFileSync('components/Footer.tsx', 'utf8');
  const about = readFileSync('app/about/page.tsx', 'utf8').replace(/\s+/g, ' ');

  assert.ok(
    footer.includes('Idaho contractor registration information is available upon request'),
  );
  assert.equal(footer.includes('License details available upon request'), false);
  assert.ok(about.includes('Business registration and insurance details are available on request'));
  assert.equal(about.includes('License details'), false);
});
