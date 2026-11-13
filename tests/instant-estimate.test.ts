/**
 * The instant estimator on this site (owner decision, 13 November 2026).
 *
 * There is ONE estimator, on p5homeco.com. This site frames it at
 * /instant-estimate and points its primary calls to action there. These tests
 * pin that: the page renders the frame with this site's brand id, the central
 * CTA opens it, the frame file carries no pricing code, a lead is counted only
 * when the estimator reports completion, and the page never calls the
 * preliminary range a quote or a final price.
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import Module from 'node:module';
import { test } from 'node:test';

const extensions = (Module as unknown as { _extensions: Record<string, (m: { exports: unknown }) => void> })._extensions;
const classNames = new Proxy({}, { get: (_, key) => String(key) });
extensions['.css'] = (m) => { m.exports = { __esModule: true, default: classNames }; };

const read = (file: string) => readFileSync(file, 'utf8');
const PAGE = 'app/instant-estimate/page.tsx';
const FRAME = 'components/estimator/EstimatorFrame.tsx';
const ANALYTICS = 'components/estimator/EstimatorAnalytics.tsx';

type Page = (props: { searchParams: Promise<Record<string, string | string[] | undefined>> }) => Promise<unknown>;
async function renderPage(searchParams: Record<string, string | string[] | undefined> = {}): Promise<string> {
  // tsconfig keeps JSX for Next, so tsx compiles it to React.createElement.
  (globalThis as { React?: unknown }).React = (await import('react')).default;
  const { renderToStaticMarkup } = await import('react-dom/server');
  const mod = (await import('../app/instant-estimate/page.tsx')) as { default: Page };
  return renderToStaticMarkup((await mod.default({ searchParams: Promise.resolve(searchParams) })) as never);
}
const visibleText = (html: string) => html.replace(/<script\b[\s\S]*?<\/script>/g, ' ').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ');

test('/instant-estimate frames the central estimator with this site\'s brand id', async () => {
  const source = read(PAGE);
  assert.match(source, /<EstimatorFrame\b[\s\S]*?brand="handyman"/);
  assert.match(source, /<EstimatorAnalytics \/>/);
  assert.match(source, /headerOffset=\{HEADER_OFFSET\}/);
  assert.match(source, /\/\^\[a-z0-9-\]\{1,40\}\$\//, 'the project parameter is validated');
  assert.doesNotMatch(source, /['"]use client['"]/, 'the page is a server component');

  const html = await renderPage({ project: 'handyman' });
  assert.match(html, /data-estimator-frame="handyman"/);
  assert.equal((html.match(/<h1\b/g) ?? []).length, 1);
  // The introduction, then the frame, then the explanation.
  const order = ['<h1', 'data-estimator-frame', 'How it works', 'A preliminary range now', 'Prefer to talk to us?'].map((part) => html.indexOf(part));
  assert.ok(order.every((at) => at >= 0), `every part renders: ${order}`);
  assert.deepEqual(order, [...order].sort((a, b) => a - b), 'parts keep their order');
  // The path to a person: the phone and the existing request form.
  assert.match(html, /href="tel:\+12084771169"/);
  assert.match(html, /href="\/contact#consult"[^>]*>Send your list and photos</);
  // An unusable project value still renders the page (the visitor chooses in the estimator).
  assert.match(await renderPage({ project: '../Not Valid' }), /data-estimator-frame="handyman"/);
});

test('/instant-estimate describes a preliminary range, never a quote or a final price', async () => {
  const text = visibleText(await renderPage());
  assert.match(text, /preliminary price range/);
  assert.match(text, /firm written proposal follows a site visit, measurements and your selections/);
  assert.doesNotMatch(text, /instant (?:quote|bid)|guaranteed|final price|no contact information|without (?:your )?contact/i);
  assert.doesNotMatch(text, /\b\d+ ?(?:seconds?|secs?|minutes?|mins?)\b/i, 'no number of minutes or seconds');
  // Built from its code point so this file passes the dash guard it is checking for.
  assert.equal((text + read(PAGE)).includes(String.fromCharCode(0x2014)), false, 'no long dash');
  assert.doesNotMatch(text + read(PAGE), /near me/i);
  // It says plainly that the estimator asks for contact details before the range.
  assert.match(text, /Add your name, email and phone/);
});

test('the central call to action and the service pages open the estimator', async () => {
  const { FAMILY_BRAND } = await import('../lib/familyBrand.ts');
  const { CTA_ESTIMATE, ESTIMATE_HREF, estimatorProjectForService, instantEstimateHref } = await import('../shared/ctaCopy.ts');
  const { SERVICES } = await import('../shared/contentData.ts');
  const { getAllSiteUrls } = await import('../lib/siteUrls.ts');
  assert.equal(FAMILY_BRAND.cta.href, '/instant-estimate');
  assert.equal(ESTIMATE_HREF, '/instant-estimate');
  assert.equal(CTA_ESTIMATE, 'Get an instant estimate');
  assert.equal(FAMILY_BRAND.id, 'handyman');
  // Every service is priced by the estimator's handyman project; an unknown one is never sent there.
  for (const service of SERVICES) assert.equal(estimatorProjectForService(service.slug), 'handyman', service.slug);
  assert.equal(estimatorProjectForService('pool-installation'), null);
  assert.equal(estimatorProjectForService(undefined), null);
  assert.equal(instantEstimateHref('handyman'), '/instant-estimate?project=handyman');
  assert.equal(instantEstimateHref(null), '/instant-estimate');
  assert.equal(instantEstimateHref('Not Valid'), '/instant-estimate');
  assert.ok(getAllSiteUrls().some((entry) => entry.path === '/instant-estimate'), 'the page is in the sitemap');
  // The existing tools stay: the request form and the in-house intake are still routes and still linked.
  assert.ok(getAllSiteUrls().some((entry) => entry.path === '/estimate'));
  assert.match(read('app/page.tsx'), /id="consult"[\s\S]*<ConsultationForm\s*\/>/);
});

type RoutePage = (props: { params: Promise<Record<string, string>> }) => Promise<unknown>;
async function renderRoute(file: string, params: Record<string, string>): Promise<string> {
  (globalThis as { React?: unknown }).React = (await import('react')).default;
  // Next ships a React build with resource hints; plain react-dom may lack preload (a <link> hint only).
  const reactDom = (await import('react-dom')) as unknown as { default?: Record<string, unknown> } & Record<string, unknown>;
  for (const target of [reactDom, reactDom.default]) if (target && typeof target.preload !== 'function') try { target.preload = () => {}; } catch {}
  const { renderToStaticMarkup } = await import('react-dom/server');
  const mod = (await import(file)) as { default: RoutePage };
  const element = await mod.default({ params: Promise.resolve(params) });
  // The inline request form on the paid pages reads React Query, as in the app shell.
  const load = Module.createRequire(process.cwd() + '/');
  const { QueryClient, QueryClientProvider } = load('@tanstack/react-query');
  const React = load('react');
  return renderToStaticMarkup(React.createElement(QueryClientProvider, { client: new QueryClient() }, element as never));
}
const anchors = (html: string) => [...html.matchAll(/<a\b([^>]*)>([\s\S]*?)<\/a>/g)].map((match) => ({ attrs: match[1], text: match[2].replace(/<[^>]+>/g, '').trim() }));
const SERVICE_ESTIMATE = 'href="/instant-estimate?project=handyman"';

test('service, city and area pages lead with the estimator and keep the request form', async () => {
  for (const [file, params, href] of [
    ['../app/services/[slug]/page.tsx', { slug: 'plumbing-repairs' }, SERVICE_ESTIMATE],
    ['../app/services/[slug]/[city]/page.tsx', { slug: 'drywall-repair', city: 'boise' }, SERVICE_ESTIMATE],
    ['../app/services/[slug]/[city]/page.tsx', { slug: 'mounting-assembly', city: 'meridian' }, SERVICE_ESTIMATE],
    ['../app/areas/[city]/page.tsx', { city: 'kuna' }, 'href="/instant-estimate"'],
  ] as const) {
    const label = `${file} ${JSON.stringify(params)}`;
    const links = anchors(await renderRoute(file, { ...params }));
    const hero = links.find((link) => link.attrs.includes('data-testid="button-primary-service-hero"'));
    assert.ok(hero, `${label}: hero primary`);
    assert.equal(hero.text, 'Get an instant estimate', label);
    assert.ok(hero.attrs.includes(href), `${label}: ${hero.attrs}`);
    assert.ok(hero.attrs.includes('data-hero-cta="primary"'), label);
    // The path to a person stays: the phone, and the request form under its own label.
    assert.ok(links.some((link) => link.attrs.includes('href="tel:')), `${label}: phone`);
    assert.ok(links.some((link) => link.text === 'Send your list and photos' && link.attrs.includes('href="/#consult"')), `${label}: request form`);
  }
});

test('the paid call-first service pages keep their hero and gain the estimator below it', async () => {
  for (const slug of ['drywall-repair', 'home-maintenance', 'carpentry-trim-repair']) {
    const html = await renderRoute('../app/services/[slug]/page.tsx', { slug });
    const links = anchors(html);
    assert.equal(links.some((link) => link.attrs.includes('data-testid="button-primary-service-hero"')), false, `${slug}: no site-primary hero button on an ad page`);
    const call = html.search(/>Call Us<|data-testid="button-call-service-hero"/);
    const estimate = html.indexOf(SERVICE_ESTIMATE);
    assert.ok(call >= 0, `${slug}: call action`);
    assert.ok(estimate > call, `${slug}: the estimator comes after the call action`);
    assert.ok(links.some((link) => link.text === 'Send your list and photos' && link.attrs.includes('href="/#consult"')), `${slug}: request form`);
  }
});

test('EstimatorFrame only frames p5homeco.com and carries no pricing code', () => {
  const source = read(FRAME);
  assert.match(source, /const ESTIMATOR_ORIGIN = "https:\/\/p5homeco\.com";/);
  assert.match(source, /\/estimator\/embed\?/);
  const imports = [...source.matchAll(/^import\s[^;]*?from\s+["']([^"']+)["'];?$/gm)].map((match) => match[1]);
  assert.deepEqual(imports, ['react'], 'the frame imports nothing from this repository');
  // Comments may name pricing and QuickBooks (they say where those live); code may not.
  const code = source.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');
  assert.doesNotMatch(code, /estimateEngine|priceBook|costBook|priceScope|calculate\w*Estimate|quickbooks|margin|\$\s?\d/i);
  assert.doesNotMatch(source, /trackEvent|gtag|fbq/, 'analytics are sent by EstimatorAnalytics, not the frame');
});

test('a lead is counted only when the estimator reports completion, once per page view', () => {
  const source = read(ANALYTICS);
  assert.match(source, /addEventListener\("p5-estimator-event"/);
  assert.match(source, /trackEvent\(detail\.name, \{ estimator_brand: brand, estimator_project: project \}\)/);
  assert.match(source, /const LEAD_EVENT = "estimator_completed";/);
  assert.match(source, /const LEAD_SOURCE = "instant_estimator";/);
  const guard = source.indexOf('if (detail.name !== LEAD_EVENT || leadSent.current) return;');
  assert.ok(guard > 0, 'completion and once-only guard');
  for (const call of ['trackAcceptedLeadConversion(', 'trackEvent("generate_lead"', 'trackMetaEvent("Lead"']) {
    assert.equal(source.split(call).length - 1, 1, `${call} appears once`);
    assert.ok(source.indexOf(call) > guard, `${call} sits behind the completion guard`);
  }
  assert.match(source, /leadSent\.current = true;/);
});
