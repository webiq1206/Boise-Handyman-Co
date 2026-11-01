import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { ApprovedHomeHero } from '../components/approved/ApprovedHomeHero.tsx';
import { CONTRACTOR_REGISTRATION, DOPL_LOOKUP_HREF } from '../components/ContractorCredential.tsx';
import { Footer } from '../components/Footer.tsx';
import { matchesRoute, isActiveHref } from '../lib/family/types.ts';
import { FAMILY_BRAND } from '../lib/familyBrand.ts';
import { BUSINESS_VCARD_PATH } from '../lib/vcard.ts';
import { CITIES, SERVICES } from '../shared/contentData.ts';
import { CTA_QUOTE } from '../shared/ctaCopy.ts';
import { P5_SOCIAL } from '../shared/gbpProfile.ts';
import { GUIDE_PAGES } from '../shared/guideContent.ts';
import { PUBLIC_NAP_LINE, SITE_CONFIG } from '../shared/siteConfig.ts';
import { SITE_TAGLINE } from '../shared/siteContent.ts';

(globalThis as typeof globalThis & { React: typeof React }).React = React;

// Phase 2 family chrome: the shared components read every Handyman fact from
// lib/familyBrand.ts. These pin that the config says what the site says.
test('the brand config carries this site’s facts, one CTA and one destination', () => {
  assert.equal(FAMILY_BRAND.cta.label, 'Send your list and photos');
  assert.equal(FAMILY_BRAND.cta.label, CTA_QUOTE);
  assert.equal(FAMILY_BRAND.cta.href, '/#consult');
  assert.equal(FAMILY_BRAND.phone.telHref, SITE_CONFIG.phoneHref);
  assert.equal(FAMILY_BRAND.phone.smsHref, SITE_CONFIG.phoneSmsHref);
  assert.equal(FAMILY_BRAND.phone.display, '(208) 477-1169');
  assert.equal(FAMILY_BRAND.saveContactHref, BUSINESS_VCARD_PATH);
  assert.equal(FAMILY_BRAND.parentFacebook.href, P5_SOCIAL.facebook);
  assert.equal(FAMILY_BRAND.tagline, `${SITE_TAGLINE}.`);
  assert.equal(`${FAMILY_BRAND.nap.line}.`, PUBLIC_NAP_LINE);
  assert.match(FAMILY_BRAND.nap.line, /4031 W Wapoot St, Meridian, ID 83646/);
  assert.equal(FAMILY_BRAND.registration.text, CONTRACTOR_REGISTRATION);
  assert.equal(FAMILY_BRAND.registration.href, DOPL_LOOKUP_HREF);
  assert.equal(FAMILY_BRAND.accent, '#c56b4a');
  // Owner commit 74ff0c4 and scripts/verify-p5-mobile-seo.mjs: no bar over the homepage hero.
  assert.equal(FAMILY_BRAND.bar.showOverHero, false);
  assert.equal(FAMILY_BRAND.header.desktopFrom, 1180);
  assert.deepEqual(FAMILY_BRAND.header.phoneActions, ['call']);
  assert.equal(matchesRoute('/estimate', FAMILY_BRAND.bar.hiddenOn), true);
  assert.equal(matchesRoute('/estimate/scope', FAMILY_BRAND.bar.hiddenOn), true);
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
  assert.equal(FAMILY_BRAND.footer.areas.links.length, CITIES.length);
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
  assert.match(html, /Public representative: Nick Perkins/);
  assert.match(html, /not a staffed storefront\. <a href="tel:/);
  assert.match(html, /Mon to Fri 9 AM to 6 PM, Sat 9 AM to 4 PM Mountain\. Closed Sunday\./);
  assert.match(html, /mailto:hello@boisehandyman\.co/);
  assert.match(html, /href="\/contact\.vcf"/);
  assert.match(html, /is a DBA of <a href="https:\/\/p5homeco\.com" rel="noopener">P5 Home Co LLC<\/a>/);
  assert.match(html, /<a href="\/subcontractor" rel="nofollow">Subcontractor login<\/a>/);
  assert.match(html, />P5 Home Co on Facebook<\/a>/);
  assert.match(html, /<a href="https:\/\/www\.google\.com\/search\?kgmid=\/g\/11ntl1t7dc" rel="noopener" target="_blank" data-testid="link-footer-google">P5 Home Co on Google<\/a>/);
  assert.equal((html.match(/data-testid="link-footer-google"/g) ?? []).length, 1);
  assert.equal((html.match(/data-testid="link-footer-facebook"/g) ?? []).length, 1);
  // The registration number stays outside the DOPL link, once.
  assert.equal((html.match(/Idaho Registered Contractor #8381215/g) ?? []).length, 1);
  assert.equal(/>Idaho Registered Contractor #8381215<\/a>/.test(html), false);
  assert.match(html, /aria-label="Verify with Idaho DOPL: look up registration 8381215, opens in a new tab"/);
});

test('the homepage hero is the family template with sourced proof', () => {
  const html = renderToStaticMarkup(React.createElement(ApprovedHomeHero));
  assert.equal((html.match(/<h1\b/g) ?? []).length, 1);
  assert.match(html, /<h1 class="fam-hero-title" id="family-hero-title">Boise handyman\. <span class="fam-hero-accent">Your list, handled\.<\/span><\/h1>/);
  const cta = html.match(/<a [^>]*data-hero-cta="primary"[^>]*>([^<]+)<\/a>/);
  assert.ok(cta, 'hero primary CTA');
  assert.match(cta[0], /href="\/#consult"/);
  assert.match(cta[0], /fam-btn--hero fam-btn--lg/);
  assert.equal(cta[1], 'Send your list and photos');
  assert.match(html, /<a href="tel:\+12084771169" class="fam-hero-link">Call \(208\) 477-1169<\/a>/);
  assert.match(html, /<img [^>]*fetchPriority="high"[^>]*class="fam-hero-img"/);
  const support = html.match(/<p class="fam-hero-support">([^<]+)<\/p>/)?.[1] ?? '';
  assert.ok(support.split(/\s+/).length <= 14, support);
  // Proof: the three facts this hero already published, nothing new.
  assert.match(html, /Written quote before work starts/);
  assert.match(html, /No trip fee in Ada and Canyon County/);
  assert.match(html, /Idaho Registered Contractor #8381215/);
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
