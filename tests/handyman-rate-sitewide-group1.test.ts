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
  assert.equal(hourly.includes('$120'), false);
  assert.equal(hourly.includes('one-hour minimum'), false);
  assert.match(hourly, /We price each job after reviewing the scope, with a written price before work starts\. Common jobs are priced as flat lines\./);
  assert.match(hourly, /We do not publish a market average\. Common jobs are priced as flat lines: one outlet or switch on its own comes to a preliminary \$200 to \$240\./);

  const small = readFileSync('shared/content/wave2/what-small-home-repairs-cost-boise.ts', 'utf8');
  assert.match(small, /Common jobs are priced as flat lines: one outlet or switch on its own comes to a preliminary \$200 to \$240, one faucet you supply \$290 to \$330, and one small drywall patch \$240 to \$280\. Flat pricing for defined jobs like these is increasingly common\./);
  assert.equal(small.includes('$120'), false);
  assert.equal(small.includes('one-hour minimum'), false);

  const prices = readFileSync('shared/content/wave2/handyman-prices-boise.ts', 'utf8');
  assert.match(prices, /and a list of nine common jobs at \$1,780 to \$2,000\. Boise Handyman Co then prices each job case by case after reviewing the scope, with a written price before work starts\./);
  assert.match(prices, /<p>Those are preliminary ranges, not quotes\. Our own model is case-by-case pricing after we review the scope, with a written price before work starts,/);

  const vary = readFileSync('shared/content/wave2/why-handyman-quotes-vary.ts', 'utf8');
  assert.match(vary, /That is why one small job on its own, such as replacing one outlet or switch, comes to a preliminary \$200 to \$240 in our instant estimate \(November 2026\)\./);
  assert.equal(vary.includes('Ours is the reason'), false);

  const gbp = readFileSync('shared/gbpProfile.ts', 'utf8');
  assert.match(gbp, /Every job gets a written quote from your list and photos before work starts\. Materials are billed at cost, and there is no trip fee in Ada and Canyon County\./);
  assert.match(gbp, /There is no trip fee in Ada and Canyon County\. Each job is priced case by case after we review the scope, with a written price before any work starts\./);
  assert.equal(gbp.includes('$120'), false);
  assert.equal(gbp.includes('one-hour minimum'), false);
});

test('the Boise prices post keeps its title and uses the written-quote description', async () => {
  const { handymanPricesBoise } = await import('../shared/content/wave2/handyman-prices-boise.ts');
  assert.equal(handymanPricesBoise.slug, 'handyman-prices-boise');
  assert.equal(handymanPricesBoise.title, 'Handyman prices in Boise: hourly rates and job prices (2026)');
  assert.equal(handymanPricesBoise.seoTitle, 'Handyman Prices in Boise | Hourly Rates');
  assert.equal(handymanPricesBoise.primaryKeyword, 'handyman prices boise');
  assert.deepEqual(handymanPricesBoise.secondaryKeywords, [
    'handyman hourly rate boise',
    'how much does a handyman charge in idaho',
    'handyman prices treasure valley',
  ]);
  const description = 'Handyman prices in Boise for 2026: how hourly and flat pricing work, what common jobs cost, and why a written quote before any work starts protects you.';
  assert.equal(handymanPricesBoise.metaDescription, description);
  assert.equal(description.length, 152);
});

test('the visit-priced FAQ states one written price', () => {
  const text = readFileSync('components/approved/family-content.ts', 'utf8');
  assert.match(
    text,
    /How is the visit priced\?','Every job gets one written price before work starts\. Parts and materials are listed separately, and your written quote confirms the details\.'/,
  );
});
