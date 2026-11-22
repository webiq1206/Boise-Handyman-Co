/**
 * The homepage price slider is retired (owner, 21 November 2026: one source
 * of prices). HandymanPlanningRange ran this site's own engine and showed
 * figures that differed from the P5 instant estimator, so the homepage now
 * shows a short instant estimate block in its place: no figure, one link per
 * project the estimator prices for this brand, and the path to a person
 * beside it. HandymanPlanningRange.tsx stays in the repository, unmounted.
 *
 * These tests render the real homepage and check the block, and check that no
 * page on the site still links to the slider's anchor.
 */
import assert from 'node:assert/strict';
import Module from 'node:module';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { CTA_QUOTE, HOME_ESTIMATOR_PROJECTS, QUOTE_FORM_HREF, instantEstimateHref } from '../shared/ctaCopy.ts';
import { SITE_CONFIG } from '../shared/siteConfig.ts';

// CSS modules have no meaning in node: each class name reads as its own key.
(Module as unknown as { _extensions: Record<string, (module: { exports: unknown }) => void> })._extensions['.css'] = (module) => {
  module.exports = new Proxy({}, { get: (_, key) => (key === '__esModule' ? undefined : String(key)) });
};

let html = '';
let block = '';

test.before(async () => {
  // tsconfig keeps JSX for Next, so tsx compiles it to React.createElement.
  (globalThis as { React?: unknown }).React = (await import('react')).default;
  const reactDom = (await import('react-dom')) as unknown as { default?: Record<string, unknown> } & Record<string, unknown>;
  for (const target of [reactDom, reactDom.default]) if (target && typeof target.preload !== 'function') try { target.preload = () => {}; } catch {}
  const { renderToStaticMarkup } = await import('react-dom/server');
  const { default: HomePage } = (await import('../app/page.tsx')) as { default: () => unknown };
  // The request form reads React Query, as in the app shell.
  const load = Module.createRequire(process.cwd() + '/');
  const { QueryClient, QueryClientProvider } = load('@tanstack/react-query');
  const React = load('react');
  html = renderToStaticMarkup(React.createElement(QueryClientProvider, { client: new QueryClient() }, HomePage() as never));
  const start = html.indexOf('id="estimate-by-project"');
  block = html.slice(start, html.indexOf('</section>', start));
});

test('the homepage renders no price slider', () => {
  const page = readFileSync('app/page.tsx', 'utf8');
  assert.doesNotMatch(page, /<HandymanPlanningRange\b|import \{ HandymanPlanningRange \}/);
  assert.doesNotMatch(html, /data-testid="handyman-planning-range"|data-testid="proof-range-value"|Your planning range/);
  // The component itself is kept, unmounted, as the owner asked.
  assert.match(readFileSync('components/sections/HandymanPlanningRange.tsx', 'utf8'), /export function HandymanPlanningRange/);
});

test('the block links the instant estimate for every project, with the path to a person', () => {
  assert.ok(block.length > 0, 'the block is on the homepage');
  assert.ok(html.indexOf('id="estimate-by-project"') > html.indexOf('id="the-finish"'), 'same place as the slider: after the gallery');
  assert.deepEqual(HOME_ESTIMATOR_PROJECTS.map((p) => p.id), ['handyman', 'interior-paint', 'flooring'], "the handyman brand's projects in p5-home-co brands.ts");
  for (const project of HOME_ESTIMATOR_PROJECTS) {
    assert.equal(instantEstimateHref(project.id), `/instant-estimate?project=${project.id}`);
    assert.ok(block.includes(`href="${instantEstimateHref(project.id)}"`), project.id);
    assert.ok(block.includes(`>${project.label}<`), project.label);
  }
  assert.ok(block.includes(`href="${QUOTE_FORM_HREF}"`) && block.includes(`>${CTA_QUOTE}<`), 'the request form beside it');
  assert.ok(block.includes(`href="${SITE_CONFIG.phoneHref}"`), 'and the phone');
  assert.match(block, /fam-btn fam-btn--secondary fam-btn--lg fam-btn--on-dark/, 'family button styles');
  assert.ok(block.includes('id="planning-range"'), 'old outside links still land on the block');
});

test('the block shows no figure and follows the wording rules', () => {
  const text = block.replace(/<[^>]+>/g, ' ');
  assert.doesNotMatch(text, /\$\s?\d|\d{1,3},\d{3}/, 'no price');
  assert.doesNotMatch(text, /instant\s+(?:quote|bid)|final price|firm price|guaranteed/i);
  assert.doesNotMatch(text, /\b\d+\s+(?:minutes?|seconds?)\b/i);
  assert.equal(text.includes(String.fromCharCode(0x2014)), false, 'no em dash');
  assert.doesNotMatch(text, /near me/i);
});

test('no page on the site links to the retired slider anchor', () => {
  const offenders: string[] = [];
  const walk = (dir: string) => {
    for (const name of readdirSync(dir)) {
      const file = path.join(dir, name);
      if (statSync(file).isDirectory()) walk(file);
      else if (/\.(tsx?|mjs|txt|json)$/.test(name) && /(?:["'(]\/?|\}\/|\.co\/)#planning-range\b/.test(readFileSync(file, 'utf8'))) offenders.push(file);
    }
  };
  for (const dir of ['app', 'components', 'shared', 'lib', 'public']) walk(dir);
  assert.deepEqual(offenders, []);
});

test('every mention of the minimum says the rate and the minimum the same way', () => {
  // Owner, 21 November 2026: a job under an hour is billed as one hour at the
  // hourly rate, $120 an hour. The neighborhood guides carry no dollar figure
  // at all (scripts/verify-shared-claims.mjs), so the Boise guide speaks of the
  // fixed cost of a visit without naming the minimum.
  const files = ['shared/gbpProfile.ts', 'app/terms-of-service/page.tsx'];
  assert.doesNotMatch(readFileSync('shared/content/locationGuides.ts', 'utf8'), /one-hour minimum/);
  for (const file of files) {
    const text = readFileSync(file, 'utf8');
    const mentions = text.match(/[^.'"`]*one-hour minimum[^.'"`]*/gi) ?? [];
    assert.ok(mentions.length > 0, `${file} states the minimum`);
    for (const mention of mentions) assert.match(mention, /[Ll]abor is billed at \$120 an hour, with a one-hour minimum per visit/, `${file}: ${mention.trim()}`);
  }
});

test('the homepage pricing and trip-fee answers state one written price', () => {
  const faqs = readFileSync('shared/homepageFaqs.ts', 'utf8');
  assert.match(faqs, /You get one written price before any work starts, after we review your list and photos\. Materials sit on their own line at cost, and there is no trip fee in Ada and Canyon County\. Bundling several tasks into one visit is usually the best value\. If a job needs a general contractor or a licensed trade, we tell you plainly and point you to the right team\./);
  assert.match(faqs, /No\. There is no trip fee in Ada and Canyon County\. You get one written price for the whole list before work starts, with materials at cost on their own line\./);
  assert.equal(faqs.includes('$120'), false);
  assert.equal(faqs.includes('one-hour minimum'), false);
});

test('about item 02 states one written price', () => {
  const about = readFileSync('app/about/page.tsx', 'utf8');
  assert.match(about, /'One written price, materials at cost'/);
  assert.equal(about.includes('Labor at $120 an hour, one-hour minimum, materials at cost'), false);
});
