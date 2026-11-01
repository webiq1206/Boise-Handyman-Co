/**
 * Boise Handyman Co configuration for the shared family chrome.
 *
 * BRAND-OWNED: this is the one file where this site differs from its siblings.
 * The components in components/family/ and the styles in styles/family-*.css are
 * synced byte-identical across the P5 Home Co family (lib/family/manifest.json);
 * they read everything brand-specific from FAMILY_BRAND below.
 *
 * Kept free of heavy imports on purpose: the header and bottom bar are client
 * components, so whatever this module imports ships to every page. (The guide
 * content barrel is deliberately not imported; tests/family-chrome.test.ts
 * checks every footer guide link against the published guides instead.)
 */
import type { FamilyBrand } from '@/lib/family/types';
import {
  CONTRACTOR_REGISTRATION,
  DOPL_LOOKUP_HREF,
  DOPL_LOOKUP_LABEL,
  DOPL_LOOKUP_TITLE,
} from '@/components/ContractorCredential';
import { CONTENT_HUBS, guidePath } from '@/shared/contentHubs';
import { CITIES, SERVICES, serviceHeading } from '@/shared/contentData';
import { CTA_QUOTE } from '@/shared/ctaCopy';
import { P5_SOCIAL } from '@/shared/gbpProfile';
import { PUBLIC_NAP_LINE, SITE_CONFIG } from '@/shared/siteConfig';
import { areaPath, servicePath } from '@/lib/seo-routes';

/** Intrinsic size of public/brand/approved-lockup-{light,dark}.svg. */
const LOCKUP = { width: 377, height: 50 };

/** The first three pillar guides, as the footer has always listed them. */
const PILLAR_GUIDES = CONTENT_HUBS.filter((hub) => hub.priorityTier <= 2)
  .slice(0, 3)
  .map((hub) => ({ label: hub.title, href: guidePath(hub.pillarSlug) }));

export const FAMILY_BRAND: FamilyBrand = {
  id: 'handyman',
  name: SITE_CONFIG.name,
  domain: SITE_CONFIG.siteUrl.replace(/\/$/, ''),
  lockupLabel: `${SITE_CONFIG.name}, a P5 Home Company`,
  lockup: {
    onDark: { src: '/brand/approved-lockup-light.svg', ...LOCKUP },
    onLight: { src: '/brand/approved-lockup-dark.svg', ...LOCKUP },
  },
  // Terracotta, the approved Handyman accent, and its AA-safe ink on paper.
  accent: '#c56b4a',
  accentInk: '#92472c',
  header: {
    // The homepage opens on the full-bleed technician photograph; interior pages open on paper.
    darkOn: ['/'],
    // Six navigation items, the lockup and "Send your list and photos" do not fit at 1024px;
    // 1180 is where this site's navigation and bottom bar have always switched.
    desktopFrom: 1180,
    // As today: Call with its label beside the menu. Text and Chat are tiles in the menu.
    phoneActions: ['call'],
  },
  nav: [
    { label: 'Services', href: '/services' },
    { label: 'Areas', href: '/areas' },
    { label: 'About', href: '/about' },
    { label: 'Guides', href: '/guides' },
    { label: 'Blog', href: '/blog' },
    { label: 'Contact', href: '/contact' },
  ],
  // One label, one destination: the contact page with the repair-list wizard, where the
  // homepage hero and every interior page already sent "Send your list and photos".
  cta: { label: CTA_QUOTE, href: '/contact' },
  phone: { display: SITE_CONFIG.phone, telHref: SITE_CONFIG.phoneHref, smsHref: SITE_CONFIG.phoneSmsHref },
  // The assistant opens from the menu tile and its own launcher (desktop).
  chat: { enabled: true, label: 'Chat', openEvent: 'p5:assistant-open' },
  bar: {
    // Owner commit 74ff0c4 and scripts/verify-p5-mobile-seo.mjs: the bar stays hidden over the
    // homepage hero and appears once the hero's own CTA has left the screen.
    showOverHero: false,
    callLabel: 'Call',
    // The estimator owns the whole screen (Navigation renders no chrome there either).
    hiddenOn: ['/estimate/*'],
    yieldToBodyFlags: ['assistantOpen', 'hideMobileNavBar', 'p5EstimatorActive'],
  },
  // Same GA4 event the old header, menu and bar CTAs sent.
  analytics: { ctaEvent: 'cta_click', barCtaEvent: 'cta_click' },
  // Same path as BUSINESS_VCARD_PATH in lib/vcard.ts.
  saveContactHref: '/contact.vcf',
  email: SITE_CONFIG.email,
  // SITE_TAGLINE in shared/siteContent.ts, not imported because that module pulls icon
  // components into every page; tests/family-chrome.test.ts pins the two together.
  tagline: 'Treasure Valley handyman service, built on upfront quotes and tidy work.',
  parentLine: 'A P5 Home Co company',
  footer: {
    groups: [
      {
        title: 'Services',
        links: [
          // Sentence case with the same words (owner call C), as the old footer printed them.
          ...SERVICES.map((service) => ({ label: serviceHeading(service.name), href: servicePath(service.slug) })),
          { label: 'All services', href: '/services' },
        ],
      },
      {
        title: 'Company',
        links: [
          { label: 'About', href: '/about' },
          { label: 'Why choose us', href: '/#why-choose-us' },
          { label: 'How we work', href: '/#how-we-build' },
          { label: 'RE-10 repairs', href: '/re-10-repairs-boise' },
          { label: 'Contact', href: '/contact' },
        ],
      },
      {
        title: 'Resources',
        links: [
          { label: 'Home repair guides', href: '/guides' },
          { label: 'Planning downloads', href: '/resources' },
          { label: 'Blog', href: '/blog' },
          ...PILLAR_GUIDES,
        ],
      },
    ],
    areas: {
      label: 'Service areas',
      href: '/areas',
      links: CITIES.map((city) => ({ label: `${city.name}, Idaho`, href: areaPath(city.slug) })),
    },
    legal: [
      { label: 'Site map', href: '/sitemap' },
      { label: 'Privacy policy', href: '/privacy-policy' },
      { label: 'Terms of service', href: '/terms-of-service' },
      { label: 'Subcontractor login', href: '/subcontractor', rel: 'nofollow' },
    ],
    // Required parent-company disclosure: this brand is a DBA of P5 Home Co LLC.
    disclosure: { before: `${SITE_CONFIG.name} is a DBA of `, linkLabel: SITE_CONFIG.legalName, href: 'https://p5homeco.com', after: '' },
    copyrightName: SITE_CONFIG.name,
  },
  // Boise ADU Co is left out until its own site exists; its projects run through Boise Construction Co.
  family: {
    label: 'The P5 Home Co family',
    companies: [
      { name: 'P5 Home Co', href: 'https://p5homeco.com' },
      { name: 'Boise Construction Co', href: 'https://boiseconstruction.co' },
      { name: 'Boise Remodeling Co', href: 'https://boiseremodeling.co' },
      { name: 'Boise Handyman Co', href: 'https://boisehandyman.co' },
      { name: 'Boise Cabinet Co', href: 'https://boisecabinet.co' },
    ],
  },
  // The footer adds its own full stop after the line, so the published line drops its own.
  nap: { line: PUBLIC_NAP_LINE.replace(/\.$/, '') },
  // As the paid landing pages and the business profile state them (America/Boise).
  hours: 'Mon to Fri 9 AM to 6 PM, Sat 9 AM to 4 PM Mountain. Closed Sunday.',
  // The footer renders components/ContractorCredential (number outside the DOPL link) in place
  // of the shared one-link line, so these mirror its constants exactly.
  registration: {
    text: CONTRACTOR_REGISTRATION,
    href: DOPL_LOOKUP_HREF,
    title: DOPL_LOOKUP_TITLE,
    ariaLabel: DOPL_LOOKUP_LABEL,
    rel: 'noopener noreferrer',
  },
  // P5 Home Co's Facebook page (shared/gbpProfile P5_SOCIAL): the owner's profile, labelled for
  // the parent and never this brand's own.
  parentFacebook: { href: P5_SOCIAL.facebook, label: 'P5 Home Co on Facebook' },
};
