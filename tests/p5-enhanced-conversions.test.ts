import { readFileSync } from 'node:fs';
import test from 'node:test';
import assert from 'node:assert/strict';
import { trackAcceptedLeadConversion, trackEvent } from '../lib/analytics.ts';
import { googleTagBootstrap } from '../lib/analyticsBootstrap.ts';
import { enhancedConversionUserData, trackGoogleAdsLeadConversion } from '../lib/googleAdsConversion.ts';

type Call = unknown[];

function install(options: { disabled?: boolean; webdriver?: boolean; gtag?: boolean } = {}) {
  const calls: Call[] = [];
  const session = new Map<string, string>();
  const local = new Map<string, string>();
  if (options.disabled) session.set('p5_analytics_disabled', '1');
  const previousWindow = globalThis.window;
  const previousNavigator = globalThis.navigator;
  globalThis.window = {
    location: { hostname: 'boisehandyman.co', pathname: '/estimate' },
    sessionStorage: {
      getItem: (key: string) => session.get(key) ?? null,
      setItem: (key: string, value: string) => { session.set(key, value); },
    },
    localStorage: {
      get length() { return local.size; },
      key: (index: number) => [...local.keys()][index] ?? null,
      getItem: (key: string) => local.get(key) ?? null,
      setItem: (key: string, value: string) => { local.set(key, value); },
    },
    gtag: options.gtag === false ? undefined : (...args: unknown[]) => { calls.push(args); },
  } as unknown as Window & typeof globalThis;
  Object.defineProperty(globalThis, 'navigator', { configurable: true, value: { webdriver: options.webdriver === true } });
  return {
    calls,
    local,
    restore() {
      globalThis.window = previousWindow;
      Object.defineProperty(globalThis, 'navigator', { configurable: true, value: previousNavigator });
    },
  };
}

test('email and phone are normalized and street address or description is never sent', () => {
  const data = enhancedConversionUserData({
    email: '  Ada@Example.COM ',
    phone: '1 (208) 555-0199',
    name: '  Ada   Lovelace ',
    postalCode: '83702-1234',
  });
  assert.deepEqual(data, {
    email: 'ada@example.com',
    phone_number: '+12085550199',
    address: { first_name: 'Ada', last_name: 'Lovelace', postal_code: '83702', country: 'US' },
  });
  assert.equal(enhancedConversionUserData({ phone: '555-0199' })?.phone_number, undefined);
  assert.equal(enhancedConversionUserData({ phone: '(208) 555-0100' })?.phone_number, '+12085550100');
  assert.equal(JSON.stringify(data).includes('Main St'), false);
  assert.equal(JSON.stringify(data).includes('faucet'), false);
  assert.equal(Object.hasOwn(data ?? {}, 'street'), false);
  assert.equal(Object.hasOwn(data?.address ?? {}, 'street'), false);
});

test('user_data is set only when the tag is allowed, and the conversion follows it', () => {
  const blocked = install({ disabled: true });
  assert.equal(trackGoogleAdsLeadConversion({ email: 'ada@example.com', name: 'Ada Lovelace' }, 'estimator:blocked'), false);
  assert.deepEqual(blocked.calls, []);
  blocked.restore();

  const hidden = install({ webdriver: true });
  assert.equal(trackGoogleAdsLeadConversion({ email: 'ada@example.com' }, 'estimator:webdriver'), false);
  assert.deepEqual(hidden.calls, []);
  hidden.restore();

  const offline = install({ gtag: false });
  assert.equal(trackGoogleAdsLeadConversion({ email: 'ada@example.com' }, 'estimator:offline'), false);
  assert.deepEqual(offline.calls, []);
  offline.restore();

  const live = install();
  const id = '11111111-1111-4111-8111-111111111111';
  live.local.set('p5-project-draft-v2', JSON.stringify({
    id,
    text: 'Replace the kitchen faucet and describe the leak',
    answers: { address: '123 Main St, Boise, ID 83702' },
    contact: { name: 'Ada Lovelace', email: ' Ada@Example.COM ', phone: '(208) 555-0100' },
  }));
  assert.equal(trackGoogleAdsLeadConversion({ service: 'handyman', acceptedLead: true }, `estimator:${id}`), true);
  assert.equal(trackGoogleAdsLeadConversion({ service: 'handyman', acceptedLead: true }, `intake:handyman:${id}`), true);
  assert.equal(live.calls.length, 4);
  assert.equal(live.calls.some((call) => call[0] === 'set'), false);
  const expectedUserData = {
    email: 'ada@example.com',
    phone_number: '+12085550100',
    address: { first_name: 'Ada', last_name: 'Lovelace', country: 'US' },
  };
  const conversion = live.calls[0] as [string, string, { send_to?: string; transaction_id?: string; user_data?: unknown }];
  assert.equal(conversion[0], 'event');
  assert.equal(conversion[1], 'conversion');
  assert.equal(conversion[2].send_to, 'AW-18354188204/cEzmCPOagKAdEKzf-q9E');
  assert.equal(conversion[2].transaction_id, `estimator:${id}`);
  assert.deepEqual(conversion[2].user_data, expectedUserData);
  const estimatorLead = live.calls[1] as [string, string, { send_to?: string; transaction_id?: string; user_data?: unknown }];
  assert.equal(estimatorLead[2].send_to, 'AW-18354188204/LE2vCPXstO8cEKzf-q9E');
  assert.equal(estimatorLead[2].transaction_id, `estimator:${id}`);
  assert.deepEqual(estimatorLead[2].user_data, expectedUserData);
  assert.equal(JSON.stringify(estimatorLead).includes('123 Main St'), false);
  assert.equal(JSON.stringify(estimatorLead).includes('faucet'), false);
  const intake = live.calls[2] as [string, string, { send_to?: string; transaction_id?: string; user_data?: unknown }];
  assert.equal(intake[2].send_to, 'AW-18354188204/cEzmCPOagKAdEKzf-q9E');
  assert.equal(intake[2].transaction_id, `intake:handyman:${id}`);
  assert.deepEqual(intake[2].user_data, expectedUserData);

  assert.equal(trackGoogleAdsLeadConversion({ service: 'handyman', email: 'other@example.com' }, `estimator:${id}`), false);
  assert.equal(live.calls.length, 4);
  live.restore();
});

test('the form LE2v conversion carries the inquiry id as transaction_id', () => {
  const live = install();
  trackAcceptedLeadConversion({ projectType: 'drywall', email: 'ada@example.com', name: 'Ada Lovelace' }, 'inquiry-primary-1');
  const conversion = live.calls.find((call) => call[1] === 'conversion') as [string, string, { send_to?: string; transaction_id?: string; value?: number; currency?: string }];
  assert.deepEqual(conversion, ['event', 'conversion', {
    send_to: 'AW-18354188204/LE2vCPXstO8cEKzf-q9E',
    value: 50,
    currency: 'USD',
    transaction_id: 'inquiry-primary-1',
    user_data: {
      email: 'ada@example.com',
      address: { first_name: 'Ada', last_name: 'Lovelace', country: 'US' },
    },
  }]);
  assert.equal(live.calls.some((call) => call[0] === 'set'), false);
  live.restore();
});

test('user_data stays on the Ads event and never reaches the GA4 tag', () => {
  const helper = readFileSync(new URL('../lib/googleAdsConversion.ts', import.meta.url), 'utf8');
  const bootstrap = readFileSync(new URL('../lib/analyticsBootstrap.ts', import.meta.url), 'utf8');
  assert.equal(helper.includes('gtag("set", "user_data"'), false);
  assert.equal(helper.includes("gtag('set', 'user_data'"), false);
  assert.equal(bootstrap.includes('user_data'), false);
  assert.equal(bootstrap.includes('allow_enhanced_conversions'), false);
  assert.match(bootstrap, /window\.gtag\('config', config\.measurementId\);/);
  const script = googleTagBootstrap({
    hostname: 'boisehandyman.co',
    measurementId: 'G-4WQQ639LR1',
    adsId: 'AW-18354188204',
  });
  assert.match(script, /gtag\('config', config\.measurementId\);/);
  assert.equal(/user_data|allow_enhanced_conversions|email|phone_number|first_name|last_name|postal_code/.test(script), false);

  const live = install();
  trackEvent('generate_lead', { form: 'consultation', project_type: 'drywall' });
  assert.deepEqual(live.calls, [['event', 'generate_lead', { form: 'consultation', project_type: 'drywall' }]]);
  const encoded = JSON.stringify(live.calls[0]);
  for (const key of ['user_data', 'email', 'phone', 'phone_number', 'first_name', 'last_name', 'postal_code', 'name']) {
    assert.equal(encoded.includes(key), false, key);
  }
  assert.equal(String(live.calls[0][2] && (live.calls[0][2] as { send_to?: string }).send_to || '').startsWith('G-'), false);
  live.restore();
});

test('an accepted estimator finish fires both labels once', () => {
  const live = install();
  const key = 'estimator:accepted-finish';
  assert.equal(trackGoogleAdsLeadConversion({ service: 'handyman', email: 'ada@example.com', acceptedLead: true }, key), true);
  const events = live.calls.filter((call) => call[1] === 'conversion');
  assert.equal(events.length, 2);
  assert.equal((events[0][2] as { send_to?: string; user_data?: { email?: string } }).send_to, 'AW-18354188204/cEzmCPOagKAdEKzf-q9E');
  assert.equal((events[1][2] as { send_to?: string; user_data?: { email?: string } }).send_to, 'AW-18354188204/LE2vCPXstO8cEKzf-q9E');
  assert.equal((events[0][2] as { user_data?: { email?: string } }).user_data?.email, 'ada@example.com');
  assert.equal((events[1][2] as { user_data?: { email?: string } }).user_data?.email, 'ada@example.com');
  assert.equal(live.calls.some((call) => call[0] === 'set'), false);
  live.restore();
});

test('a finish without a lead fires the estimator label only', () => {
  const live = install();
  const key = 'intake:handyman:no-lead';
  assert.equal(trackGoogleAdsLeadConversion({ service: 'handyman', email: 'ada@example.com', acceptedLead: false }, key), true);
  assert.deepEqual(live.calls, [
    ['event', 'conversion', { send_to: 'AW-18354188204/cEzmCPOagKAdEKzf-q9E', transaction_id: key }],
  ]);
  live.restore();
});

test('the engine two-argument call fires the estimator label only', () => {
  const live = install();
  const key = 'estimator:engine-omitted';
  assert.equal(trackGoogleAdsLeadConversion({ service: 'handyman', email: 'ada@example.com' }, key), true);
  assert.deepEqual(live.calls, [
    ['event', 'conversion', { send_to: 'AW-18354188204/cEzmCPOagKAdEKzf-q9E', transaction_id: key }],
  ]);
  live.restore();
});

test('a second finish does not send either label again', () => {
  const live = install();
  const key = 'estimator:refire-guard';
  assert.equal(trackGoogleAdsLeadConversion({ service: 'handyman', acceptedLead: true }, key), true);
  assert.equal(trackGoogleAdsLeadConversion({ service: 'handyman', acceptedLead: true }, key), false);
  const labels = live.calls.filter((call) => call[1] === 'conversion').map((call) => (call[2] as { send_to?: string }).send_to);
  assert.deepEqual(labels, ['AW-18354188204/cEzmCPOagKAdEKzf-q9E', 'AW-18354188204/LE2vCPXstO8cEKzf-q9E']);
  live.restore();
});

test('a missing gtag waits up to ten seconds and then fires both labels once', () => {
  const live = install({ gtag: false });
  const timers: Array<() => void> = [];
  (globalThis.window as unknown as { setTimeout: (fn: () => void, delay: number) => number }).setTimeout = (fn, delay) => {
    assert.equal(delay, 500);
    timers.push(fn);
    return timers.length;
  };
  const key = 'estimator:wait-for-gtag';
  assert.equal(trackGoogleAdsLeadConversion({ service: 'handyman', acceptedLead: true }, key), false);
  assert.equal(timers.length, 1);
  timers.shift()?.();
  (globalThis.window as unknown as { gtag: (...args: unknown[]) => void }).gtag = (...args) => { live.calls.push(args); };
  timers.shift()?.();
  const labels = live.calls.filter((call) => call[1] === 'conversion').map((call) => (call[2] as { send_to?: string }).send_to);
  assert.deepEqual(labels, ['AW-18354188204/cEzmCPOagKAdEKzf-q9E', 'AW-18354188204/LE2vCPXstO8cEKzf-q9E']);
  assert.equal(trackGoogleAdsLeadConversion({ service: 'handyman', acceptedLead: true }, key), false);
  assert.equal(live.calls.filter((call) => call[1] === 'conversion').length, 2);
  live.restore();
});

test('a missing gtag waits and then fires only the estimator label when accepted is omitted', () => {
  const live = install({ gtag: false });
  const timers: Array<() => void> = [];
  (globalThis.window as unknown as { setTimeout: (fn: () => void, delay: number) => number }).setTimeout = (fn, delay) => {
    assert.equal(delay, 500);
    timers.push(fn);
    return timers.length;
  };
  const key = 'estimator:wait-omitted';
  assert.equal(trackGoogleAdsLeadConversion({ service: 'handyman', email: 'ada@example.com' }, key), false);
  timers.shift()?.();
  (globalThis.window as unknown as { gtag: (...args: unknown[]) => void }).gtag = (...args) => { live.calls.push(args); };
  timers.shift()?.();
  assert.deepEqual(live.calls, [
    ['event', 'conversion', { send_to: 'AW-18354188204/cEzmCPOagKAdEKzf-q9E', transaction_id: key }],
  ]);
  live.restore();
});

test('consultation sends enhanced fields only after the server accepts the lead', () => {
  const source = readFileSync(new URL('../components/ConsultationForm.tsx', import.meta.url), 'utf8');
  const accepted = source.indexOf('if (response.accepted)');
  const call = source.indexOf('trackAcceptedLeadConversion({');
  const error = source.indexOf('onError:');
  assert.ok(accepted > 0 && call > accepted && call < error);
  const block = source.slice(call, call + 420);
  assert.match(block, /email: variables\.email/);
  assert.match(block, /phone: variables\.phone/);
  assert.match(block, /name: variables\.name/);
  assert.match(block, /postalCode: deriveZip\(variables\.address\)/);
  assert.match(block, /allowEnhancedConversions: response\.allowEnhancedConversions/);
  assert.equal(block.includes('message:'), false);
  assert.equal(block.includes('address: variables.address'), false);
  assert.match(source, /trackAcceptedLeadConversion\(\{[\s\S]*?\}, inquiryId\("primary"\)\)/);
  assert.equal(source.includes("Meta Lead carries the visitor's email"), false);
  assert.equal(source.slice(error, error + 220).includes('trackAcceptedLeadConversion'), false);

  const estimator = readFileSync(new URL('../components/P5Estimator.tsx', import.meta.url), 'utf8');
  assert.match(estimator, /trackGoogleAdsLeadConversion\(\{service:latest\.answers\.service\},`intake:\$\{receipt\.projectId\}`\)/);
  assert.match(estimator, /trackGoogleAdsLeadConversion\(\{service:d\.answers\.service\},`estimator:\$\{d\.id\}`\)/);
  assert.equal(estimator.includes('user_data'), false);
});
