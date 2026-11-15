import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {priceFromRiskAdjustedCost} from '../lib/p5/pricing.ts';
import {calculateHandymanEstimate, type HandymanEstimateInput} from '../shared/estimateEngine.ts';
import {handymanPriceContext} from '../shared/handymanCustomerPrice.ts';

const context = handymanPriceContext(new Date('2026-11-13T12:00:00Z'));

function price(input: HandymanEstimateInput) {
  const estimate = calculateHandymanEstimate(input, context);
  assert.ok(estimate, 'scenario prices');
  return estimate!;
}

test('customer prices use the shared pricing engine, not a hardcoded markup', () => {
  const source = readFileSync(new URL('../shared/estimateEngine.ts', import.meta.url), 'utf8');
  assert.equal(source.includes('1.6176'), false);
  assert.match(source, /priceFromRiskAdjustedCost/);
  const marked = Math.round(priceFromRiskAdjustedCost(85 * (1 + context.contingency), context.overhead, context.profit) * 100) / 100;
  assert.equal(marked, 137.5);
  assert.equal(context.overhead, 0.2);
  assert.equal(context.profit, 0.12);
  assert.equal(context.contingency, 0.1);
  assert.equal(context.minimumDirect, 135);
  assert.equal(context.rushRate, 0.25);
  assert.equal(context.emergencyRate, 0.75);
});

test('homepage visits match the estimator customer contract and range', () => {
  const patch = price({
    category: 'drywall-repair',
    tasks: [{taskId: 'drywall-small-patch', quantity: 1}],
    materials: 'customer',
    urgency: 'standard',
  });
  assert.equal(patch.total, 220.48);
  assert.deepEqual({low: patch.priceLow, high: patch.priceHigh}, {low: 190, high: 240});

  const plumbing = price({
    category: 'plumbing-repairs',
    tasks: [
      {taskId: 'plumbing-faucet-swap', quantity: 1},
      {taskId: 'plumbing-toilet-repair', quantity: 1},
    ],
    materials: 'we-pick-up',
    urgency: 'standard',
  });
  assert.equal(plumbing.total, 477.2);
  assert.deepEqual({low: plumbing.priceLow, high: plumbing.priceHigh}, {low: 440, high: 510});

  const mounting = price({
    category: 'mounting-assembly',
    tasks: [
      {taskId: 'mount-tv', quantity: 1},
      {taskId: 'assemble-furniture', quantity: 2},
    ],
    materials: 'customer',
    urgency: 'standard',
  });
  assert.equal(mounting.total, 528.96);
  assert.deepEqual({low: mounting.priceLow, high: mounting.priceHigh}, {low: 490, high: 570});

  const fan = price({
    category: 'electrical-repairs',
    tasks: [{taskId: 'electrical-ceiling-fan', quantity: 1}],
    materials: 'customer',
    urgency: 'emergency',
  });
  assert.equal(fan.total, 495.41);
  assert.deepEqual({low: fan.priceLow, high: fan.priceHigh}, {low: 450, high: 540});

  const gutter = price({
    category: 'fence-deck-gutter-repair',
    tasks: [{taskId: 'gutter-clean', quantity: 1}],
    materials: 'we-pick-up',
    urgency: 'priority',
  });
  assert.equal(gutter.total, 273.48);
  assert.deepEqual({low: gutter.priceLow, high: gutter.priceHigh}, {low: 250, high: 300});
});

test('cards without a shipped cost book code are still not priced', () => {
  const touchUp = calculateHandymanEstimate({
    category: 'painting-touch-ups',
    tasks: [{taskId: 'paint-room-touch-up', quantity: 1}],
    materials: 'customer',
    urgency: 'standard',
  }, context);
  assert.equal(touchUp, null);
});
