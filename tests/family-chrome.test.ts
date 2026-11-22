import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import test from 'node:test';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { ApprovedHomeHero } from '../components/approved/ApprovedHomeHero.tsx';
import { CONTRACTOR_REGISTRATION, DOPL_LOOKUP_HREF } from '../components/ContractorCredential.tsx';
import { Footer } from '../components/Footer.tsx';
import { matchesRoute, isActiveHref } from '../lib/family/types.ts';
import { FAMILY_BRAND } from '../lib/familyBrand.ts';
import { BUSINESS_VCARD_PATH, buildBusinessVCard } from '../lib/vcard.ts';
import { SERVICE_AREA_CITY_NAMES, SERVICES } from '../shared/contentData.ts';
import { CTA_ESTIMATE, CTA_ESTIMATE_SHORT, CTA_QUOTE, ESTIMATE_HREF } from '../shared/ctaCopy.ts';
import { P5_SOCIAL } from '../shared/gbpProfile.ts';
import { GUIDE_PAGES } from '../shared/guideContent.ts';
import { PUBLIC_NAP_LINE, SITE_CONFIG } from '../shared/siteConfig.ts';
import { SITE_TAGLINE } from '../shared/siteContent.ts';

(globalThis as typeof globalThis & { React: typeof React }).React = React;

// Phase 2 family chrome: the shared components read every Handyman fact from
// lib/familyBrand.ts. These pin that the config says what the site says.
test('the brand config carries this site’s facts, one CTA and one destination', () => {
  // Owner decision, 13 November 2026: the central estimator at /instant-estimate gives an
  // on-screen preliminary range, so instant-estimate wording is accurate and allowed; it must
  // never be called a quote or a final price. It is the header, menu and sticky bar CTA.
  assert.equal(FAMILY_BRAND.cta.label, 'Instant estimate');
  assert.equal(FAMILY_BRAND.cta.label, CTA_ESTIMATE_SHORT);
  assert.equal(FAMILY_BRAND.cta.href, '/instant-estimate');
  assert.equal(FAMILY_BRAND.cta.href, ESTIMATE_HREF);
  assert.doesNotMatch(FAMILY_BRAND.cta.label, /quote|bid|final|firm|guarantee/i);
  // The request form stays as the second path: the footer still links to it by its own label.
  const company = FAMILY_BRAND.footer.groups.find((group) => group.title === 'Company');
  assert.ok(company?.links.some((link) => link.label === CTA_QUOTE && link.href === '/#consult'), 'footer keeps the request form');
  assert.equal(CTA_QUOTE, 'Send your list and photos');
  assert.ok(company?.links.some((link) => link.href === ESTIMATE_HREF), 'footer links the estimator');
  assert.equal(FAMILY_BRAND.phone.telHref, SITE_CONFIG.phoneHref);
  assert.equal(FAMILY_BRAND.phone.smsHref, SITE_CONFIG.phoneSmsHref);
  assert.equal(FAMILY_BRAND.phone.display, '(208) 477-1169');
  assert.equal(FAMILY_BRAND.saveContactHref, BUSINESS_VCARD_PATH);
  assert.equal(FAMILY_BRAND.parentFacebook.href, P5_SOCIAL.facebook);
  assert.equal(FAMILY_BRAND.tagline, `${SITE_TAGLINE}.`);
  assert.equal(`${FAMILY_BRAND.nap.line}.`, PUBLIC_NAP_LINE);
  assert.equal(
    FAMILY_BRAND.nap.line,
    'Serving Boise, Meridian, Nampa, Eagle, Kuna, Caldwell, Star, Middleton, and Garden City, plus Ada County and Canyon County',
  );
  assert.equal(FAMILY_BRAND.registration.text, CONTRACTOR_REGISTRATION);
  assert.equal(FAMILY_BRAND.registration.href, DOPL_LOOKUP_HREF);
  assert.equal(FAMILY_BRAND.accent, '#c56b4a');
  // Owner commit 74ff0c4 and scripts/verify-p5-mobile-seo.mjs: no bar over the homepage hero.
  assert.equal(FAMILY_BRAND.bar.showOverHero, false);
  assert.equal(FAMILY_BRAND.header.desktopFrom, 1180);
  assert.deepEqual(FAMILY_BRAND.header.phoneActions, ['call', 'text', 'chat']);
  assert.ok('hiddenOn' in FAMILY_BRAND.chat);
  assert.deepEqual(FAMILY_BRAND.chat.hiddenOn, ['/estimate*', '/admin*', '/subcontractor*', '/handyman*']);
  assert.equal(matchesRoute('/estimate', FAMILY_BRAND.bar.hiddenOn), true);
  assert.equal(matchesRoute('/estimate/scope', FAMILY_BRAND.bar.hiddenOn), true);
  // The bar would only link to the page it sits on, over the framed estimator's own buttons.
  assert.equal(matchesRoute('/instant-estimate', FAMILY_BRAND.bar.hiddenOn), true);
  assert.equal(matchesRoute('/', FAMILY_BRAND.bar.hiddenOn), false);
  assert.equal(matchesRoute('/re-10-repairs-boise', FAMILY_BRAND.bar.hiddenOn), false);
  // Dark header only over the photo hero.
  assert.equal(matchesRoute('/', FAMILY_BRAND.header.darkOn), true);
  assert.equal(matchesRoute('/services', FAMILY_BRAND.header.darkOn), false);
  // Navigation labels in sentence case.
  for (const link of FAMILY_BRAND.nav) assert.equal(link.label, link.label[0] + link.label.slice(1).toLowerCase(), link.label);
});

test('route matching and active navigation', () => {
  assert.equal(matchesRoute('/services/drywall-repair', ['/services/*']), true);
  assert.equal(matchesRoute('/servicesx', ['/services/*']), false);
  assert.equal(isActiveHref('/services/drywall-repair', '/services'), true);
  assert.equal(isActiveHref('/', '/services'), false);
});

test('every footer link group points at a published page', () => {
  const published = new Set(GUIDE_PAGES.map((guide) => `/guides/${guide.slug}`));
  const resources = FAMILY_BRAND.footer.groups.find((group) => group.title === 'Resources');
  assert.ok(resources);
  const guides = resources.links.filter((item) => item.href.startsWith('/guides/'));
  assert.equal(guides.length, 3);
  for (const link of guides) assert.ok(published.has(link.href), link.href);
  const services = FAMILY_BRAND.footer.groups.find((group) => group.title === 'Services');
  assert.equal(services?.links.length, SERVICES.length + 1);
  assert.deepEqual(
    FAMILY_BRAND.footer.areas.links.map((link) => link.label),
    SERVICE_AREA_CITY_NAMES.map((name) => `${name}, Idaho`),
  );
  // Owner answers, 20 November 2026 (SEO audit HM-T3): the official service
  // area is nine cities, Middleton and Garden City included.
  assert.equal(FAMILY_BRAND.footer.areas.links.some((link) => link.href === '/areas/middleton'), true);
  assert.equal(FAMILY_BRAND.footer.areas.links.some((link) => link.href === '/areas/garden-city'), true);
});

test('the footer renders the family row, NAP, hours and the registration, with no headings', () => {
  const html = renderToStaticMarkup(React.createElement(Footer));
  assert.equal(/<h[1-6]\b/.test(html), false);
  for (const name of ['P5 Home Co', 'Boise Construction Co', 'Boise Remodeling Co', 'Boise Cabinet Co']) {
    assert.match(html, new RegExp(`<a href="https://[^"]+" rel="noopener">${name}</a>`), name);
  }
  assert.match(html, /<span class="fam-footer-current" aria-current="true">Boise Handyman Co<\/span>/);
  assert.equal(/rel="noopener noreferrer">(P5 Home Co|Boise)/.test(html), false);
  assert.equal(html.includes('Boise ADU Co'), false);
  assert.match(html, /Serving Boise, Meridian, Nampa, Eagle, Kuna, Caldwell, Star, Middleton, and Garden City, plus Ada County and Canyon County\. <a href="tel:/);
  assert.doesNotMatch(html, /public representative|staffed storefront|streetAddress/i);
  const vcard = buildBusinessVCard().replace(/\r?\n[ \t]/g, '');
  assert.doesNotMatch(vcard, /public representative|staffed storefront|streetAddress/i);
  assert.match(vcard, /TEL;TYPE=WORK,VOICE:\+12084771169/);
  assert.match(vcard, /Hours:/);
  assert.match(html, /Mon to Fri 9 AM to 6 PM, Sat 9 AM to 4 PM Mountain\. Closed Sunday\./);
  assert.match(html, /mailto:hello@boisehandyman\.co/);
  assert.match(html, /href="\/contact\.vcf"/);
  assert.match(html, /is a DBA of <a href="https:\/\/p5homeco\.com" rel="noopener">P5 Home Co<\/a>/);
  // Owner, 20 November 2026 (SEO audit XS-05): the legal name appears once,
  // in the registration line, the same line on every family footer. The
  // parent is still named P5 Home Co everywhere else.
  assert.equal((html.match(/P5 Home Co LLC/g) ?? []).length, 1);
  assert.match(html, /P5 Home Co LLC, Idaho Registered Contractor #8381215/);
  assert.equal(html.includes('P5 Home Co.'), false);
  assert.match(html, /<a href="\/subcontractor" rel="nofollow">Subcontractor login<\/a>/);
  assert.match(html, />P5 Home Co on Facebook<\/a>/);
  assert.match(html, /<a href="https:\/\/www\.google\.com\/search\?kgmid=\/g\/11ntl1t7dc" rel="noopener" target="_blank" data-testid="link-footer-google">P5 Home Co on Google<\/a>/);
  assert.equal((html.match(/data-testid="link-footer-google"/g) ?? []).length, 1);
  assert.equal((html.match(/data-testid="link-footer-facebook"/g) ?? []).length, 1);
  // The registration number stays outside the DOPL link, once.
  assert.equal((html.match(/Idaho Registered Contractor #8381215/g) ?? []).length, 1);
  assert.equal(/>Idaho Registered Contractor #8381215<\/a>/.test(html), false);
  assert.match(html, /aria-label="Verify registration: Idaho contractor registration 8381215, opens in a new tab"/);
});

test('the homepage video hero preserves first-response content, poster and sourced proof', () => {
  const html = renderToStaticMarkup(React.createElement(ApprovedHomeHero));
  assert.equal((html.match(/<h1\b/g) ?? []).length, 1);
  assert.match(html, /<h1 class="fam-hero-title" id="family-hero-title">Boise handyman\. <span class="fam-hero-accent">Your list, handled\.<\/span><\/h1>/);
  const cta = html.match(/<a [^>]*data-hero-cta="primary"[^>]*>([^<]+)<\/a>/);
  assert.ok(cta, 'hero primary CTA');
  assert.match(cta[0], /href="\/instant-estimate"/);
  assert.match(cta[0], /fam-btn--hero fam-btn--lg/);
  assert.equal(cta[1], 'Get an instant estimate');
  assert.equal(cta[1], CTA_ESTIMATE);
  assert.match(html, /<a href="tel:\+12084771169" class="fam-hero-link">Call \(208\) 477-1169<\/a>/);
  assert.match(html, /<img [^>]*fetchPriority="high"[^>]*class="fam-hero-img"/);
  assert.match(html, /<img [^>]*src="\/media\/handyman\/boise-handyman-co-poster\.jpg"/);
  // No-JavaScript uses the approved poster: WebKit can force native controls
  // onto an SSR video even when its controls attribute is absent.
  assert.doesNotMatch(html, /<video\b|<source\b[^>]*type="video/, 'video is enhanced only when JavaScript is available');
  // SEO audit HM-T6: phones up to 480px get the same poster cut to the part
  // they show, so they do not fetch the 1920px file.
  assert.match(html, /<source media="\(max-width: 480px\)" srcSet="\/media\/handyman\/boise-handyman-co-poster-phone\.webp" type="image\/webp"/);
  assert.doesNotMatch(html, /handyman-hero-video-control|aria-controls="handyman-hero-video"/, 'no page-level video controls');
  assert.doesNotMatch(html, /handyman-hero-door-hinge-branded|front-door-repaint/, 'no superseded image in the final hero');
  const support = html.match(/<p class="fam-hero-support">([^<]+)<\/p>/)?.[1] ?? '';
  assert.ok(support.split(/\s+/).length <= 14, support);
  // Proof row under the hero: four sourced facts, registration outside the Verify link.
  assert.match(html, /Written quote first/);
  assert.match(html, /One price for your whole list before any work starts\./);
  assert.match(html, /No trip fee/);
  assert.match(html, /Anywhere in Ada and Canyon County\./);
  assert.match(html, /Idaho Registered Contractor #8381215\./);
  assert.equal(/>Idaho Registered Contractor #8381215\.?<\/a>/.test(html), false);
  assert.match(html, /href="https:\/\/edopl\.idaho\.gov\/OnlineServices\/\?link=PubSearch"/);
  assert.match(html, />Verify</);
  assert.match(html, /Our crew is insured\./);
  assert.match(html, /href="\/services#how-a-handyman-visit-is-priced"[^>]*>see how a visit is priced</);
});

test('citation packets publish Meridian, ID 83646 and no street', () => {
  const files = [
    "backlink-engine/config/scoring.json",
    "backlink-engine/outreach/queue.json",
    ...readdirSync("backlink-engine/outreach/citations")
      .filter((name) => name.endsWith(".json"))
      .map((name) => join("backlink-engine/outreach/citations", name)),
  ];
  for (const file of files) {
    const text = readFileSync(file, "utf8");
    assert.equal(text.includes('"street"'), false, file);
    assert.doesNotMatch(text, /streetAddress/i, file);
  }
  const nap = JSON.parse(readFileSync("backlink-engine/config/scoring.json", "utf8")).site.nap;
  assert.equal(nap.city, "Meridian");
  assert.equal(nap.state, "ID");
  assert.equal(nap.postalCode, "83646");
  assert.equal(Object.hasOwn(nap, "street"), false);
});

test('the shared chrome matches its manifest and stays brand-agnostic', () => {
  const out = execFileSync(process.execPath, ['scripts/verify-family-chrome.mjs'], { encoding: 'utf8' });
  assert.match(out, /shared files match boise-remodeling-co/);
  const manifest = JSON.parse(readFileSync('lib/family/manifest.json', 'utf8'));
  assert.equal(manifest.source, 'boise-remodeling-co');
  assert.equal('lib/familyBrand.ts' in manifest.files, false);
  const pkg = JSON.parse(readFileSync('package.json', 'utf8'));
  assert.match(pkg.scripts.prebuild, /npm run verify:family-chrome/);
});
