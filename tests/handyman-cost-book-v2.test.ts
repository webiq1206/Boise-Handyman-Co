import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import {priceBookRates, sharedBookRate, TIER_LABEL} from '../lib/p5/priceBook.ts';
import {
  calculateHandymanEstimate,
  UNPRICED_CALCULATOR_ITEMS,
  type HandymanEstimateInput,
} from '../shared/estimateEngine.ts';
import {handymanBookRates} from '../shared/handymanBookRates.ts';

const rates = handymanBookRates();
const catalog = priceBookRates({service: 'handyman'});

function book(code: string) {
  const shared = sharedBookRate(code, 'mid', false);
  const listed = catalog.find((rate) => rate.code === `PB-${code}`);
  assert.ok(shared, `${code} is a unit price in the cost book`);
  assert.ok(listed, `${code} is on the estimator catalog`);
  assert.equal(listed!.amount, shared!.amount, `${code} estimator catalog matches sharedBookRate`);
  assert.equal(rates[code], shared!.amount, `${code} calculator map matches sharedBookRate`);
  return shared!.amount;
}

function price(input: HandymanEstimateInput) {
  const estimate = calculateHandymanEstimate(input, rates);
  assert.ok(estimate, 'scenario prices');
  return estimate!;
}

test('price book file is the approved v2 book', () => {
  const bytes = readFileSync(new URL('../lib/p5/priceBookData.ts', import.meta.url), 'utf8').replace(/\r\n/g, '\n');
  assert.equal(createHash('sha256').update(bytes).digest('hex'), 'eff86d0f6a162622964a303acb03c001ce335bfe81137d74c3aa808b0ed7ded4');
  assert.equal(TIER_LABEL.mid, 'Signature');
});

test('homepage calculator and estimator catalog return the same v2 totals', () => {
  const smallPatch = book('09-01-07');
  const faucet = book('22-42-02');
  const toilet = book('22-01-04');
  const trip = book('01-01-08');
  const tv = book('27-01-02');
  const assembly = book('12-01-03');
  const fan = book('26-01-03');
  const gutter = book('07-01-03');

  const patch = price({
    category: 'drywall-repair',
    tasks: [{taskId: 'drywall-small-patch', quantity: 1}],
    materials: 'customer',
    urgency: 'standard',
  });
  assert.equal(patch.total, smallPatch);
  assert.equal(patch.total, 85);

  const plumbing = price({
    category: 'plumbing-repairs',
    tasks: [
      {taskId: 'plumbing-faucet-swap', quantity: 1},
      {taskId: 'plumbing-toilet-repair', quantity: 1},
    ],
    materials: 'we-pick-up',
    urgency: 'standard',
  });
  assert.equal(plumbing.total, faucet + toilet + trip);
  assert.equal(plumbing.total, 345);

  const mounting = price({
    category: 'mounting-assembly',
    tasks: [
      {taskId: 'mount-tv', quantity: 1},
      {taskId: 'assemble-furniture', quantity: 2},
    ],
    materials: 'customer',
    urgency: 'standard',
  });
  assert.equal(mounting.total, tv + assembly * 2);
  assert.equal(mounting.total, 327);

  const electrical = price({
    category: 'electrical-repairs',
    tasks: [{taskId: 'electrical-ceiling-fan', quantity: 1}],
    materials: 'customer',
    urgency: 'emergency',
  });
  assert.equal(electrical.total, fan);
  assert.equal(electrical.total, 175);

  const outdoor = price({
    category: 'fence-deck-gutter-repair',
    tasks: [{taskId: 'gutter-clean', quantity: 1}],
    materials: 'we-pick-up',
    urgency: 'priority',
  });
  assert.equal(outdoor.total, gutter + trip);
  assert.equal(outdoor.total, 165);
  assert.equal(outdoor.unpriced.length, 0);
});

test('calculator lines without a single cost book code are not priced', () => {
  const touchUp = calculateHandymanEstimate({
    category: 'painting-touch-ups',
    tasks: [{taskId: 'paint-room-touch-up', quantity: 1}],
    materials: 'customer',
    urgency: 'standard',
  }, rates);
  assert.equal(touchUp, null);
  assert.ok(UNPRICED_CALCULATOR_ITEMS.some((item) => item.id === 'paint-room-touch-up'));
  assert.equal(sharedBookRate('01-01-15', 'mid', false), null);
  assert.equal(sharedBookRate('01-01-09', 'mid', false), null);
});
