import test from 'node:test';
import assert from 'node:assert/strict';
import {getHandymanPlanningData} from '../shared/handymanPlanning.server.ts';
import {calculateHandymanEstimate, TASK_CATALOG, type JobCategoryId} from '../shared/estimateEngine.ts';
import {handymanPriceContext} from '../shared/handymanCustomerPrice.ts';
import {formatPlanningCurrency} from '../shared/formatPlanningCurrency.ts';
import {formatPlanningCurrency as legacyFormatPlanningCurrency} from '../shared/legacy/constructionEstimateEngine.ts';

// This is the existing homepage's complete selectable inventory at c76c09a.
// Keeping the expected IDs independent catches a silently shortened projection.
const EXPECTED: Record<string, readonly string[]> = {
  'drywall-repair': ['drywall-small-patch', 'drywall-large-patch', 'drywall-ceiling-patch', 'drywall-texture-match'],
  'painting-touch-ups': ['paint-room-touch-up', 'paint-accent-wall', 'paint-door-trim', 'paint-exterior-spot'],
  'plumbing-repairs': ['plumbing-faucet-swap', 'plumbing-toilet-repair', 'plumbing-toilet-replace', 'plumbing-disposal-swap'],
  'electrical-repairs': ['electrical-outlet-switch', 'electrical-light-fixture', 'electrical-ceiling-fan', 'electrical-smoke-detector'],
  'mounting-assembly': ['mount-tv', 'mount-shelves', 'assemble-furniture', 'mount-curtain-rods'],
  'carpentry-trim-repair': ['carpentry-door-adjust', 'carpentry-trim-repair', 'carpentry-cabinet-repair', 'carpentry-window-repair'],
};
const NOW = new Date('2026-11-13T12:00:00Z');

test('the public projection retains all 24 homepage choices and exact server-priced ranges', () => {
  const data = getHandymanPlanningData(NOW);
  const context = handymanPriceContext(NOW);
  assert.equal(data.version, 1);
  assert.deepEqual(data.categories.map(category => category.id), Object.keys(EXPECTED));
  let priced = 0, unpriced = 0;
  for (const category of data.categories) {
    assert.deepEqual(category.tasks.map(task => task.id), EXPECTED[category.id], category.id);
    for (const task of category.tasks) {
      // The established server calculator is the oracle. The projection must
      // not replace minimum-balance or division rounding with a new shortcut.
      const expected = calculateHandymanEstimate({
        category: category.id as JobCategoryId,
        tasks: [{taskId: task.id, quantity: 1}],
        materials: 'customer',
        urgency: 'standard',
      }, context);
      if (expected === null) {
        unpriced++;
        assert.equal(task.range, null, task.id);
      } else {
        priced++;
        assert.deepEqual(task.range, {low: expected.priceLow, high: expected.priceHigh}, task.id);
        assert.ok(Number.isFinite(task.range!.low) && task.range!.low > 0, task.id);
        assert.ok(task.range!.high >= task.range!.low, task.id);
        assert.equal(task.range!.low % 10, 0, `${task.id} low uses existing outward rounding`);
        assert.equal(task.range!.high % 10, 0, `${task.id} high uses existing outward rounding`);
      }
    }
  }
  assert.equal(priced, 16);
  assert.equal(unpriced, 8);
  assert.deepEqual(data.categories[0].tasks[0].range, {low: 190, high: 240}, 'the worked drywall example is unchanged');
});

function onlyKeys(value: object, allowed: readonly string[], required: readonly string[], label: string) {
  const keys = Object.keys(value);
  assert.ok(keys.every(key => allowed.includes(key)), `${label}: only public display fields`);
  assert.ok(required.every(key => keys.includes(key)), `${label}: required public fields`);
}

test('serialized browser data contains only display identity, copy and customer ranges', () => {
  const data = getHandymanPlanningData(NOW);
  const serialized = JSON.stringify(data);
  assert.deepEqual(JSON.parse(serialized), data, 'the boundary uses JSON-safe plain values');
  onlyKeys(data, ['version', 'categories'], ['version', 'categories'], 'root');
  for (const category of data.categories) {
    onlyKeys(category, ['id', 'label', 'description', 'tasks'], ['id', 'label', 'tasks'], category.id);
    assert.ok(category.label.trim());
    for (const task of category.tasks) {
      onlyKeys(task, ['id', 'label', 'description', 'range'], ['id', 'label', 'range'], task.id);
      assert.ok(task.label.trim());
      if (task.range !== null) {
        onlyKeys(task.range, ['low', 'high'], ['low', 'high'], task.id + ' range');
      }
    }
  }
  assert.doesNotMatch(serialized, /(?:DEFAULT_FINANCE|SERVICE_MATRIX|annualOverhead|annualRevenue|bookCode|directCost|minimumDirect|contingency|overhead|profit|rangeWidth|division|reserve)/i);
  assert.doesNotMatch(serialized, /\b(?:PB-)?\d{2}-\d{2}-\d{2}\b/, 'internal cost-book codes are not public display data');
});

test('building or changing a public result cannot mutate the source task catalog or another request', () => {
  const before = JSON.stringify(TASK_CATALOG);
  const first = getHandymanPlanningData(NOW);
  const originalRange = {...first.categories[0].tasks[0].range!};
  (first.categories[0].tasks[0].range as {low: number}).low = -1;
  assert.equal(JSON.stringify(TASK_CATALOG), before);
  const second = getHandymanPlanningData(NOW);
  assert.deepEqual(second.categories[0].tasks[0].range, originalRange);
});

test('the browser-safe consultation formatter preserves legacy display around its unit thresholds', () => {
  for (const amount of [0, .49, .5, 190, 240, 999, 999.49, 999.99, 1000, 1499, 1500, 999499, 999500, 999999.99, 1000000, 1049999, 1050000, 10000000]) {
    assert.equal(formatPlanningCurrency(amount), legacyFormatPlanningCurrency(amount), String(amount));
  }
});
