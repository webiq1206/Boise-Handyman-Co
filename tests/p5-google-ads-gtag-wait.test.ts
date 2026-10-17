import { test } from 'node:test';
import assert from 'node:assert/strict';
import { trackEvent, trackAcceptedLeadConversion } from '../lib/analytics.ts';
import {
  GTAG_READY_ATTEMPTS,
  GTAG_READY_WAIT_MS,
  GOOGLE_ADS_LEAD_LABEL,
  trackGoogleAdsLeadConversion,
} from '../lib/googleAdsConversion.ts';

type Harness = {
  timers: Array<() => void>;
  calls: unknown[][];
  setGtag: () => void;
  clearGtag: () => void;
};

function installWindow(): Harness {
  const store = new Map<string, string>();
  const timers: Array<() => void> = [];
  const calls: unknown[][] = [];
  const win: {
    sessionStorage: { getItem: (key: string) => string | null; setItem: (key: string, value: string) => void };
    location: { pathname: string };
    setTimeout: (fn: () => void, delay: number) => number;
    gtag?: (...args: unknown[]) => void;
  } = {
    sessionStorage: {
      getItem: (key) => store.get(key) ?? null,
      setItem: (key, value) => { store.set(key, value); },
    },
    location: { pathname: '/' },
    setTimeout: (fn, delay) => {
      assert.equal(delay, GTAG_READY_WAIT_MS);
      timers.push(fn);
      return timers.length;
    },
  };
  Object.assign(globalThis, { window: win });
  return {
    timers,
    calls,
    setGtag: () => { win.gtag = (...args) => { calls.push(args); }; },
    clearGtag: () => { delete win.gtag; },
  };
}

test('a late gtag still records one accepted-lead conversion', () => {
  const previous = (globalThis as { window?: unknown }).window;
  const harness = installWindow();
  try {
    assert.equal(GTAG_READY_ATTEMPTS * GTAG_READY_WAIT_MS, 5000);
    trackAcceptedLeadConversion({ projectType: 'drywall' });
    assert.equal(harness.calls.length, 0);
    assert.equal(harness.timers.length, 1);
    harness.timers.shift()?.();
    assert.equal(harness.calls.length, 0);
    harness.setGtag();
    harness.timers.shift()?.();
    assert.equal(harness.calls.length, 1);
    assert.equal(harness.timers.length, 0);
    assert.deepEqual(harness.calls[0], ['event', 'conversion', {
      send_to: GOOGLE_ADS_LEAD_LABEL,
      value: 50,
      currency: 'USD',
    }]);
  } finally {
    Object.assign(globalThis, { window: previous });
  }
});

test('the accepted-lead wait stops after about five seconds', () => {
  const previous = (globalThis as { window?: unknown }).window;
  const harness = installWindow();
  try {
    trackEvent('form_start', { form: 'consultation' });
    assert.equal(harness.calls.length, 0);
    assert.equal(harness.timers.length, 0);
    trackAcceptedLeadConversion({ projectType: 'drywall' });
    for (let i = 0; i < GTAG_READY_ATTEMPTS; i++) harness.timers.shift()?.();
    assert.equal(harness.timers.length, 0);
    assert.equal(harness.calls.length, 0);
    harness.setGtag();
    trackEvent('generate_lead', { form: 'consultation' });
    assert.equal(harness.calls.length, 1);
    assert.deepEqual(harness.calls[0]?.[1], 'generate_lead');
    assert.equal(harness.timers.length, 0);
  } finally {
    Object.assign(globalThis, { window: previous });
  }
});

test('an estimator conversion waits once and does not fire twice', () => {
  const previous = (globalThis as { window?: unknown }).window;
  const harness = installWindow();
  try {
    assert.equal(trackGoogleAdsLeadConversion({ service: 'drywall-repair' }, 'estimator:one'), false);
    assert.equal(trackGoogleAdsLeadConversion({ service: 'drywall-repair' }, 'estimator:one'), false);
    assert.equal(harness.timers.length, 1);
    harness.setGtag();
    harness.timers.shift()?.();
    assert.equal(trackGoogleAdsLeadConversion({ service: 'drywall-repair' }, 'estimator:one'), false);
    assert.equal(harness.calls.length, 1);
    assert.equal(harness.calls[0]?.[1], 'conversion');
    assert.equal((harness.calls[0]?.[2] as { transaction_id?: string }).transaction_id, 'estimator:one');
    assert.equal(harness.timers.length, 0);
  } finally {
    Object.assign(globalThis, { window: previous });
  }
});
