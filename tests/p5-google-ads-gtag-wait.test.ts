import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { trackEvent, trackAcceptedLeadConversion } from '../lib/analytics.ts';
import {
  GTAG_READY_ATTEMPTS,
  GTAG_READY_WAIT_MS,
  GOOGLE_ADS_ESTIMATOR_LABEL,
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

test('an estimator key fires both labels once and a repeat fires nothing', () => {
  const previous = (globalThis as { window?: unknown }).window;
  const harness = installWindow();
  try {
    harness.setGtag();
    trackGoogleAdsLeadConversion({ service: 'drywall-repair' }, 'estimator:one');
    assert.deepEqual(harness.calls, [
      ['event', 'conversion', { send_to: GOOGLE_ADS_ESTIMATOR_LABEL, transaction_id: 'estimator:one' }],
      ['event', 'conversion', {
        send_to: GOOGLE_ADS_LEAD_LABEL,
        value: 50,
        currency: 'USD',
        transaction_id: 'estimator:one',
      }],
    ]);
    trackGoogleAdsLeadConversion({ service: 'drywall-repair' }, 'estimator:one');
    assert.equal(harness.calls.length, 2);
    assert.equal(harness.timers.length, 0);
  } finally {
    Object.assign(globalThis, { window: previous });
  }
});

test('an intake key fires both labels once', () => {
  const previous = (globalThis as { window?: unknown }).window;
  const harness = installWindow();
  try {
    harness.setGtag();
    trackGoogleAdsLeadConversion({ service: 'drywall-repair' }, 'intake:project-1');
    trackGoogleAdsLeadConversion({ service: 'drywall-repair' }, 'intake:project-1');
    assert.deepEqual(harness.calls.map((call) => (call[2] as { send_to: string; transaction_id?: string }).send_to), [
      GOOGLE_ADS_ESTIMATOR_LABEL,
      GOOGLE_ADS_LEAD_LABEL,
    ]);
    assert.equal((harness.calls[0]?.[2] as { transaction_id?: string }).transaction_id, 'intake:project-1');
    assert.equal((harness.calls[1]?.[2] as { transaction_id?: string }).transaction_id, 'intake:project-1');
    assert.equal(harness.calls.length, 2);
  } finally {
    Object.assign(globalThis, { window: previous });
  }
});

test('a stored estimator key fires nothing', () => {
  const previous = (globalThis as { window?: unknown }).window;
  const harness = installWindow();
  try {
    harness.setGtag();
    const win = (globalThis as { window: { sessionStorage: { setItem: (key: string, value: string) => void } } }).window;
    win.sessionStorage.setItem('google_ads_estimator:estimator:stored', 'sent');
    win.sessionStorage.setItem('google_ads_lead:estimator:stored', 'sent');
    trackGoogleAdsLeadConversion({ service: 'drywall-repair' }, 'estimator:stored');
    assert.equal(harness.calls.length, 0);
  } finally {
    Object.assign(globalThis, { window: previous });
  }
});

test('estimator labels wait once for gtag and still fire once', () => {
  const previous = (globalThis as { window?: unknown }).window;
  const harness = installWindow();
  try {
    trackGoogleAdsLeadConversion({ service: 'drywall-repair' }, 'estimator:wait');
    trackGoogleAdsLeadConversion({ service: 'drywall-repair' }, 'estimator:wait');
    assert.equal(harness.calls.length, 0);
    assert.equal(harness.timers.length, 2);
    harness.setGtag();
    harness.timers.shift()?.();
    harness.timers.shift()?.();
    assert.deepEqual(harness.calls.map((call) => (call[2] as { send_to: string }).send_to), [
      GOOGLE_ADS_ESTIMATOR_LABEL,
      GOOGLE_ADS_LEAD_LABEL,
    ]);
    trackGoogleAdsLeadConversion({ service: 'drywall-repair' }, 'estimator:wait');
    assert.equal(harness.calls.length, 2);
    assert.equal(harness.timers.length, 0);
  } finally {
    Object.assign(globalThis, { window: previous });
  }
});

test('a form key fires the form label only', () => {
  const previous = (globalThis as { window?: unknown }).window;
  const harness = installWindow();
  try {
    harness.setGtag();
    trackGoogleAdsLeadConversion({ projectType: 'drywall' }, 'consultation:one');
    trackGoogleAdsLeadConversion({ projectType: 'drywall' }, 'consultation:one');
    assert.deepEqual(harness.calls, [['event', 'conversion', {
      send_to: GOOGLE_ADS_LEAD_LABEL,
      value: 50,
      currency: 'USD',
      transaction_id: 'consultation:one',
    }]]);
  } finally {
    Object.assign(globalThis, { window: previous });
  }
});

test('a gtag failure does not escape the conversion call', () => {
  const previous = (globalThis as { window?: unknown }).window;
  const harness = installWindow();
  try {
    const win = (globalThis as { window: { gtag?: () => void } }).window;
    win.gtag = () => { throw new Error('gtag down'); };
    assert.doesNotThrow(() => trackGoogleAdsLeadConversion({ service: 'drywall-repair' }, 'estimator:throws'));
    assert.equal(harness.calls.length, 0);
    win.gtag = (...args: unknown[]) => { harness.calls.push(args); };
    trackGoogleAdsLeadConversion({ service: 'drywall-repair' }, 'estimator:throws');
    assert.equal(harness.calls.length, 0);
  } finally {
    Object.assign(globalThis, { window: previous });
  }
});

test('the consultation form fires only the form label', () => {
  const estimator = readFileSync(new URL('../components/P5Estimator.tsx', import.meta.url), 'utf8');
  const form = readFileSync(new URL('../components/ConsultationForm.tsx', import.meta.url), 'utf8');
  assert.match(estimator, /trackGoogleAdsLeadConversion\(\{service:latest\.answers\.service\},`intake:\$\{receipt\.projectId\}`\)/);
  assert.match(estimator, /trackGoogleAdsLeadConversion\(\{service:d\.answers\.service\},`estimator:\$\{d\.id\}`\)/);
  assert.equal(estimator.includes('cEzmCPOagKAdEKzf-q9E'), false);
  assert.equal(estimator.includes('LE2vCPXstO8cEKzf-q9E'), false);
  assert.match(form, /trackAcceptedLeadConversion\(\{ projectType: variables\.projectType \}, inquiryId\("primary"\)\)/);
  assert.equal(form.includes('cEzmCPOagKAdEKzf-q9E'), false);
});
