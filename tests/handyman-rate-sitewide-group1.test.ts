import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

test('Group 1 customer copy does not state the hourly rate or the one-hour minimum', () => {
  const files = [
    'shared/content/areaCopy.ts',
    'shared/seoContent.ts',
    'shared/siteContent.ts',
    'public/llms-full.txt',
    'shared/content/wave2/interior-paint-touch-up-guide.ts',
    'components/approved/family-content.ts',
  ];
  for (const file of files) {
    const text = readFileSync(file, 'utf8');
    assert.equal(text.includes('$120'), false, file);
    assert.equal(text.includes('one-hour minimum'), false, file);
  }
  const hourly = readFileSync('shared/content/wave2/hourly-rate-vs-flat-rate-handyman.ts', 'utf8');
  assert.equal(hourly.includes('one-hour minimum'), false);
  assert.equal(hourly.includes('Ours: labor is billed at $120 an hour'), false);
  const lines = hourly.split('\n');
  const rateLines = lines.flatMap((line, index) => (line.includes('$120') ? [index + 1] : []));
  assert.deepEqual(rateLines, [29, 47]);
});

test('the visit-priced FAQ states one written price', () => {
  const text = readFileSync('components/approved/family-content.ts', 'utf8');
  assert.match(
    text,
    /How is the visit priced\?','Every job gets one written price before work starts\. Parts and materials are listed separately, and your written quote confirms the details\.'/,
  );
});
