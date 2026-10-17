import { readFileSync } from 'node:fs';
import test from 'node:test';
import assert from 'node:assert/strict';
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
  assert.equal(trackGoogleAdsLeadConversion({ service: 'handyman' }, `estimator:${id}`), true);
  assert.equal(trackGoogleAdsLeadConversion({ service: 'handyman' }, `intake:handyman:${id}`), true);
  assert.equal(live.calls.length, 4);
  assert.deepEqual(live.calls[0], ['set', 'user_data', {
    email: 'ada@example.com',
    phone_number: '+12085550100',
    address: { first_name: 'Ada', last_name: 'Lovelace', country: 'US' },
  }]);
  assert.equal(JSON.stringify(live.calls[0]).includes('123 Main St'), false);
  assert.equal(JSON.stringify(live.calls[0]).includes('faucet'), false);
  const conversion = live.calls[1] as [string, string, { transaction_id?: string }];
  assert.equal(conversion[0], 'event');
  assert.equal(conversion[1], 'conversion');
  assert.equal(conversion[2].transaction_id, `estimator:${id}`);
  assert.equal((live.calls[3] as [string, string, { transaction_id?: string }])[2].transaction_id, `intake:handyman:${id}`);

  assert.equal(trackGoogleAdsLeadConversion({ service: 'handyman', email: 'other@example.com' }, `estimator:${id}`), false);
  assert.equal(live.calls.length, 4);
  live.restore();
});

test('consultation sends enhanced fields only after the server accepts the lead', () => {
  const source = readFileSync(new URL('../components/ConsultationForm.tsx', import.meta.url), 'utf8');
  const accepted = source.indexOf('if (response.accepted)');
  const call = source.indexOf('trackAcceptedLeadConversion({');
  const error = source.indexOf('onError:');
  assert.ok(accepted > 0 && call > accepted && call < error);
  const block = source.slice(call, call + 280);
  assert.match(block, /email: variables\.email/);
  assert.match(block, /phone: variables\.phone/);
  assert.match(block, /name: variables\.name/);
  assert.match(block, /postalCode: deriveZip\(variables\.address\)/);
  assert.equal(block.includes('message:'), false);
  assert.equal(block.includes('address: variables.address'), false);
  assert.equal(source.slice(error, error + 220).includes('trackAcceptedLeadConversion'), false);

  const estimator = readFileSync(new URL('../components/P5Estimator.tsx', import.meta.url), 'utf8');
  assert.match(estimator, /trackGoogleAdsLeadConversion\(\{service:latest\.answers\.service\},`intake:\$\{receipt\.projectId\}`\)/);
  assert.match(estimator, /trackGoogleAdsLeadConversion\(\{service:d\.answers\.service\},`estimator:\$\{d\.id\}`\)/);
  assert.equal(estimator.includes('user_data'), false);
});
