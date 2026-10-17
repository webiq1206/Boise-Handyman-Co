import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { trackEvent, trackAcceptedLeadConversion } from '../lib/analytics.ts';
import {
  GTAG_READY_ATTEMPTS,
  GTAG_READY_WAIT_MS,
  GOOGLE_ADS_ESTIMATOR_LABEL,
  GOOGLE_ADS_LEAD_LABEL,
  trackEstimatorEndpointResult,
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

function sendTo(call: unknown[]): string | undefined {
  return (call[2] as { send_to?: string } | undefined)?.send_to;
}

test('a late gtag still records one accepted-lead conversion', () => {
  const previous = (globalThis as { window?: unknown }).window;
  const harness = installWindow();
  try {
    assert.equal(GTAG_READY_ATTEMPTS, 20);
    assert.equal(GTAG_READY_WAIT_MS, 500);
    assert.equal(GTAG_READY_ATTEMPTS * GTAG_READY_WAIT_MS, 10000);
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

test('the accepted-lead wait stops after ten seconds', () => {
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

test('an accepted estimator finish fires both labels once for the raw key', () => {
  const previous = (globalThis as { window?: unknown }).window;
  const harness = installWindow();
  try {
    harness.setGtag();
    const key = 'estimator:draft-1';
    trackEstimatorEndpointResult({ service: 'drywall-repair' }, key, {
      status: 200,
      accepted: true,
      duplicate: false,
    });
    trackEstimatorEndpointResult({ service: 'drywall-repair' }, key, {
      status: 200,
      accepted: true,
      duplicate: false,
    });
    assert.deepEqual(harness.calls, [
      ['event', 'conversion', { send_to: GOOGLE_ADS_ESTIMATOR_LABEL, transaction_id: key }],
      ['event', 'conversion', {
        send_to: GOOGLE_ADS_LEAD_LABEL,
        value: 50,
        currency: 'USD',
        transaction_id: key,
      }],
    ]);
  } finally {
    Object.assign(globalThis, { window: previous });
  }
});

test('an accepted intake finish fires both labels once for the raw key', () => {
  const previous = (globalThis as { window?: unknown }).window;
  const harness = installWindow();
  try {
    harness.setGtag();
    const key = 'intake:handyman:project-1';
    trackGoogleAdsLeadConversion({ service: 'drywall-repair' }, key, { accepted: true });
    trackGoogleAdsLeadConversion({ service: 'drywall-repair' }, key, { accepted: true });
    assert.deepEqual(harness.calls.map(sendTo), [
      GOOGLE_ADS_ESTIMATOR_LABEL,
      GOOGLE_ADS_LEAD_LABEL,
    ]);
    assert.equal((harness.calls[0]?.[2] as { transaction_id?: string }).transaction_id, key);
    assert.equal((harness.calls[1]?.[2] as { transaction_id?: string }).transaction_id, key);
  } finally {
    Object.assign(globalThis, { window: previous });
  }
});

test('intake and estimate finishes each fire the form label once for their own key', () => {
  const previous = (globalThis as { window?: unknown }).window;
  const harness = installWindow();
  const draftId = '11111111-1111-4111-8111-111111111111';
  const intakeKey = `intake:handyman:${draftId}`;
  const estimatorKey = `estimator:${draftId}`;
  try {
    harness.setGtag();
    trackEstimatorEndpointResult({ service: 'drywall-repair' }, intakeKey, { accepted: true, duplicate: false });
    trackEstimatorEndpointResult({ service: 'drywall-repair' }, estimatorKey, { accepted: true, duplicate: false });
    const formIds = harness.calls
      .filter((call) => sendTo(call) === GOOGLE_ADS_LEAD_LABEL)
      .map((call) => (call[2] as { transaction_id?: string }).transaction_id);
    const estimatorIds = harness.calls
      .filter((call) => sendTo(call) === GOOGLE_ADS_ESTIMATOR_LABEL)
      .map((call) => (call[2] as { transaction_id?: string }).transaction_id);
    assert.deepEqual(formIds, [intakeKey, estimatorKey]);
    assert.deepEqual(estimatorIds, [intakeKey, estimatorKey]);
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
    trackGoogleAdsLeadConversion({ service: 'drywall-repair' }, 'estimator:stored', { accepted: true });
    assert.equal(harness.calls.length, 0);
  } finally {
    Object.assign(globalThis, { window: previous });
  }
});

test('accepted estimator labels wait once for gtag and still fire once', () => {
  const previous = (globalThis as { window?: unknown }).window;
  const harness = installWindow();
  try {
    trackGoogleAdsLeadConversion({ service: 'drywall-repair' }, 'estimator:wait', { accepted: true });
    trackGoogleAdsLeadConversion({ service: 'drywall-repair' }, 'estimator:wait', { accepted: true });
    assert.equal(harness.calls.length, 0);
    assert.equal(harness.timers.length, 2);
    harness.setGtag();
    harness.timers.shift()?.();
    harness.timers.shift()?.();
    assert.deepEqual(harness.calls.map(sendTo), [
      GOOGLE_ADS_ESTIMATOR_LABEL,
      GOOGLE_ADS_LEAD_LABEL,
    ]);
    assert.equal((harness.calls[1]?.[2] as { transaction_id?: string }).transaction_id, 'estimator:wait');
    trackGoogleAdsLeadConversion({ service: 'drywall-repair' }, 'estimator:wait', { accepted: true });
    assert.equal(harness.calls.length, 2);
    assert.equal(harness.timers.length, 0);
  } finally {
    Object.assign(globalThis, { window: previous });
  }
});

test('a submit replay fires only the estimator label', () => {
  const previous = (globalThis as { window?: unknown }).window;
  const harness = installWindow();
  try {
    harness.setGtag();
    const key = 'estimator:duplicate-draft';
    trackEstimatorEndpointResult({ service: 'drywall-repair' }, key, {
      status: 200,
      accepted: false,
      duplicate: true,
    });
    assert.deepEqual(harness.calls, [[
      'event',
      'conversion',
      { send_to: GOOGLE_ADS_ESTIMATOR_LABEL, transaction_id: key },
    ]]);
    trackEstimatorEndpointResult({ service: 'drywall-repair' }, 'intake:handyman:duplicate-draft', {
      accepted: false,
      duplicate: true,
    });
    assert.equal(harness.calls.filter((call) => sendTo(call) === GOOGLE_ADS_LEAD_LABEL).length, 0);
    assert.equal(harness.calls.length, 2);
  } finally {
    Object.assign(globalThis, { window: previous });
  }
});

test('an intake 409 fires nothing', () => {
  const previous = (globalThis as { window?: unknown }).window;
  const harness = installWindow();
  try {
    harness.setGtag();
    const fired = trackEstimatorEndpointResult({ service: 'drywall-repair' }, 'intake:handyman:conflict', {
      status: 409,
      accepted: false,
    });
    assert.equal(fired, false);
    assert.equal(harness.calls.length, 0);
    assert.equal(harness.timers.length, 0);
    trackGoogleAdsLeadConversion({ service: 'drywall-repair' }, 'intake:handyman:conflict', {
      status: 409,
      accepted: true,
    });
    assert.equal(harness.calls.length, 0);
  } finally {
    Object.assign(globalThis, { window: previous });
  }
});

test('the engine call omits accepted, so it fires only the estimator label', () => {
  const previous = (globalThis as { window?: unknown }).window;
  const harness = installWindow();
  try {
    harness.setGtag();
    trackGoogleAdsLeadConversion({ service: 'drywall-repair' }, 'estimator:engine-draft');
    trackGoogleAdsLeadConversion({ service: 'drywall-repair' }, 'intake:handyman:engine-project');
    assert.deepEqual(harness.calls.map(sendTo), [
      GOOGLE_ADS_ESTIMATOR_LABEL,
      GOOGLE_ADS_ESTIMATOR_LABEL,
    ]);
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
    assert.doesNotThrow(() => trackGoogleAdsLeadConversion(
      { service: 'drywall-repair' },
      'estimator:throws',
      { accepted: true },
    ));
    assert.equal(harness.calls.length, 0);
    win.gtag = (...args: unknown[]) => { harness.calls.push(args); };
    trackGoogleAdsLeadConversion({ service: 'drywall-repair' }, 'estimator:throws', { accepted: true });
    assert.equal(harness.calls.length, 0);
  } finally {
    Object.assign(globalThis, { window: previous });
  }
});

test('the consultation form fires only the form label and the engine file is unchanged', () => {
  const estimator = readFileSync(new URL('../components/P5Estimator.tsx', import.meta.url), 'utf8');
  const form = readFileSync(new URL('../components/ConsultationForm.tsx', import.meta.url), 'utf8');
  const helper = readFileSync(new URL('../lib/googleAdsConversion.ts', import.meta.url), 'utf8');
  assert.match(estimator, /trackGoogleAdsLeadConversion\(\{service:latest\.answers\.service\},`intake:\$\{receipt\.projectId\}`\)/);
  assert.match(estimator, /trackGoogleAdsLeadConversion\(\{service:d\.answers\.service\},`estimator:\$\{d\.id\}`\)/);
  assert.equal(estimator.includes('accepted:'), false);
  assert.equal(estimator.includes('cEzmCPOagKAdEKzf-q9E'), false);
  assert.equal(estimator.includes('LE2vCPXstO8cEKzf-q9E'), false);
  assert.match(form, /trackAcceptedLeadConversion\(\{ projectType: variables\.projectType \}, inquiryId\("primary"\)\)/);
  assert.equal(form.includes('cEzmCPOagKAdEKzf-q9E'), false);
  assert.match(helper, /try \{/);
  assert.match(helper, /GTAG_READY_ATTEMPTS = 20/);
});
