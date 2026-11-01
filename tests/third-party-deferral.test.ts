/**
 * Phase 5 performance rules, executed rather than grepped:
 *
 * - Meta Pixel and Microsoft Clarity request their network script only on the
 *   first pointerdown, keydown, scroll or touchstart, or 5 seconds after load.
 *   Their stubs exist at once, so PageView, Lead and Clarity calls queue and
 *   reach the vendor script when it loads.
 * - Hero images get priority from the <img> the page renders, not a react-dom
 *   preload(), which travels in prefetched RSC payloads to every linking page.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { THIRD_PARTY_INTERACTION_EVENTS, THIRD_PARTY_TIMEOUT_MS } from '../lib/deferredThirdParty.ts';

type Props = { children?: string; dangerouslySetInnerHTML?: { __html: string }; strategy?: string };
const tags = (async () => {
  process.env.NODE_ENV = 'production';
  (globalThis as { React?: unknown }).React = (await import('react')).default;
  const { MetaPixel } = await import('../components/MetaPixel.tsx');
  const { MicrosoftClarity } = await import('../components/MicrosoftClarity.tsx');
  const metaProps = (MetaPixel() as unknown as { props: Props }).props;
  const clarityProps = (MicrosoftClarity() as unknown as { props: Props }).props;
  return { metaProps, clarityProps, metaCode: metaProps.children as string, clarityCode: clarityProps.dangerouslySetInnerHTML!.__html };
})();

function sandbox(readyState: 'loading' | 'interactive' | 'complete') {
  const listeners = new Map<string, Set<() => void>>();
  const inserted: { src: string }[] = [];
  const timers: { fn: () => void; ms: number }[] = [];
  const anchor = { parentNode: { insertBefore: (el: { src: string }) => inserted.push(el) } };
  const document = {
    readyState,
    createElement: () => ({ src: '', async: false }),
    getElementsByTagName: () => [anchor],
  };
  const ctx: Record<string, unknown> = {
    document,
    addEventListener: (type: string, fn: () => void) => {
      if (!listeners.has(type)) listeners.set(type, new Set());
      listeners.get(type)!.add(fn);
    },
    removeEventListener: (type: string, fn: () => void) => listeners.get(type)?.delete(fn),
    setTimeout: (fn: () => void, ms: number) => timers.push({ fn, ms }),
    clearTimeout: () => {},
  };
  ctx.window = ctx;
  vm.createContext(ctx);
  const fire = (type: string) => [...(listeners.get(type) ?? [])].forEach((fn) => fn());
  return { ctx, inserted, timers, fire, listeners };
}

test('both tags load after interaction and keep their stubs at hydration', async () => {
  const { metaProps, clarityProps } = await tags;
  assert.equal(metaProps.strategy, 'afterInteractive');
  assert.equal(clarityProps.strategy, 'afterInteractive');
  assert.ok(THIRD_PARTY_TIMEOUT_MS >= 5000);
  assert.deepEqual([...THIRD_PARTY_INTERACTION_EVENTS], ['pointerdown', 'keydown', 'scroll', 'touchstart']);
});

for (const event of THIRD_PARTY_INTERACTION_EVENTS) {
  test(`Meta: nothing requested before ${event}, fbevents.js after it, queue intact`, async () => {
    const { metaCode } = await tags;
    const s = sandbox('complete');
    vm.runInContext(metaCode, s.ctx);
    assert.equal(s.inserted.length, 0, 'no network script before interaction');
    const fbq = s.ctx.fbq as ((...a: unknown[]) => void) & { queue: unknown[][] };
    assert.equal(typeof fbq, 'function');
    const queued = Array.from(fbq.queue, (args) => Array.from(args).slice(0, 2).join(":"));
    assert.deepEqual(queued, ['set:autoConfig', 'init:2461987544292871', 'track:PageView']);
    fbq('track', 'Lead', { content_category: 'consultation_request' });
    assert.equal(fbq.queue.length, 4, 'Lead queues before the script loads');
    s.fire(event);
    assert.equal(s.inserted.length, 1);
    assert.equal(s.inserted[0].src, 'https://connect.facebook.net/en_US/fbevents.js');
    s.fire('pointerdown');
    s.fire('scroll');
    s.timers.forEach((t) => t.fn());
    assert.equal(s.inserted.length, 1, 'loads once');
    for (const type of THIRD_PARTY_INTERACTION_EVENTS) assert.equal(s.listeners.get(type)?.size ?? 0, 0, `${type} listener removed`);
  });
}

test('Clarity: nothing requested before interaction, tag after keydown, calls queue', async () => {
  const { clarityCode } = await tags;
  const s = sandbox('complete');
  vm.runInContext(clarityCode, s.ctx);
  assert.equal(s.inserted.length, 0);
  const clarity = s.ctx.clarity as ((...a: unknown[]) => void) & { q?: unknown[] };
  assert.equal(typeof clarity, 'function');
  clarity('set', 'page', 'test');
  assert.equal(clarity.q?.length, 1);
  s.fire('keydown');
  assert.equal(s.inserted.length, 1);
  assert.equal(s.inserted[0].src, 'https://www.clarity.ms/tag/y2aeap6n0p?ref=bwt');
});

test('with no interaction, both load on a timer armed at window load, not before', async () => {
  const { metaCode, clarityCode } = await tags;
  for (const code of [metaCode, clarityCode]) {
    const s = sandbox('interactive');
    vm.runInContext(code, s.ctx);
    assert.equal(s.timers.length, 0, 'timer waits for the load event');
    s.fire('load');
    assert.equal(s.timers.length, 1);
    assert.ok(s.timers[0].ms >= 5000);
    assert.equal(s.inserted.length, 0);
    s.timers[0].fn();
    assert.equal(s.inserted.length, 1);
  }
});

test('the Clarity form mask still installs before the Clarity tag', () => {
  const layout = readFileSync('app/layout.tsx', 'utf8');
  const maskAt = layout.indexOf('id="clarity-form-mask"');
  assert.ok(maskAt > 0 && layout.indexOf('<MicrosoftClarity />') > maskAt);
});

function sources(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) return sources(path);
    return /\.(tsx?|jsx?)$/.test(name) ? [path] : [];
  });
}

test('no page or component preloads an image through react-dom', () => {
  const offenders = [...sources('app'), ...sources('components')].filter((file) =>
    /\bpreload\s*\(/.test(readFileSync(file, 'utf8').replace(/\/\/.*$|\/\*[\s\S]*?\*\//gm, '')),
  );
  assert.deepEqual(offenders, []);
  assert.match(readFileSync('components/approved/ApprovedHomeHero.tsx', 'utf8'), /fetchPriority="high"/);
  assert.match(readFileSync('components/approved/InteriorLayout.tsx', 'utf8'), /fetchPriority="high"/);
});
