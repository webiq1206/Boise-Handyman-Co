/**
 * /services hub and homepage proof copy (Priya, 21 November 2026).
 * Visible FAQ text and FAQPage JSON-LD come from one list. Service cards
 * link to parent pages only. No AggregateRating, no street, no hourly rate.
 */
import assert from 'node:assert/strict';
import Module from 'node:module';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { PARENT_REVIEW } from '../components/approved/ApprovedHome.tsx';
import { withBrandPageMetadata } from '../lib/brand-page-metadata.ts';
import { generateFAQSchema, generateLocalBusinessSchema, publicPostalAddress } from '../lib/schema.ts';
import { SERVICE_AREA_CITY_NAMES } from '../shared/contentData.ts';
import {
  BBB_PROFILE_HREF,
  HOME_META_DESCRIPTION,
  SERVICES_HUB_ANSWER,
  SERVICES_HUB_CARDS,
  SERVICES_HUB_DESCRIPTION,
  SERVICES_HUB_DOCUMENT_TITLE,
  SERVICES_HUB_FAQS,
  SERVICES_HUB_H1,
  SERVICES_HUB_OG_DESCRIPTION,
  SERVICES_HUB_OG_TITLE,
  SERVICES_HUB_TITLE,
  VISIT_PROOF,
} from '../shared/servicesHub.ts';

(Module as unknown as { _extensions: Record<string, (module: { exports: unknown }) => void> })._extensions['.css'] = (module) => {
  module.exports = new Proxy({}, { get: (_, key) => (key === '__esModule' ? undefined : String(key)) });
};

const PACK_FAQS: { question: string; answer: string }[] = [
  {
    question: 'What does a handyman do in Boise?',
    answer:
      'A handyman takes care of small home repairs, installs and upkeep: drywall patches, paint touch-ups, sticking doors, loose trim, TV mounting, fixture swaps, fence and gutter fixes, and the punch list in between. Boise Handyman Co handles these across Boise and the Treasure Valley with one written quote per list.',
  },
  {
    question: 'How do I get a quote?',
    answer:
      'Call, text or send your list with a few photos. We review the tasks and reply with one written quote that lists labor and materials separately. You approve the number before anything is scheduled, and the quote is yours to keep.',
  },
  {
    question: 'Is there a trip fee?',
    answer:
      'No. There is no trip fee anywhere in Ada and Canyon County, and the same pricing applies in every city we serve.',
  },
  {
    question: 'Can you do several small jobs in one visit?',
    answer:
      'Yes, and it is usually the best value. Put everything on one list and we plan the visit around it, so you get more done with one arrival.',
  },
  {
    question: 'Do you take on remodels or additions?',
    answer:
      'No. Remodels, additions and work that needs a general contractor are outside our scope on purpose. We will tell you plainly and point you to Boise Remodeling Co or Boise Construction Co, our sister companies in the P5 Home Co family.',
  },
  {
    question: 'What areas do you serve?',
    answer:
      'We serve Boise, Meridian, Nampa, Eagle, Kuna, Caldwell, Star, Middleton and Garden City in Ada and Canyon County.',
  },
  {
    question: 'Is your work guaranteed?',
    answer:
      "Yes. Our own team's work comes with a written workmanship warranty. If something we repaired or installed fails because of how we did it, we come back and make it right.",
  },
];

const REVIEW =
  "We had P5 remodel our bathroom and kitchen, and we couldn't be happier with the work! They do a little bit of everything. No job seems too big or too small. If you're looking for someone reliable who can handle a variety of projects, I highly recommend giving P5 a call. Definitely recommend!";

function read(file: string) {
  return readFileSync(file, 'utf8');
}

test('hub metadata, proof lines and FAQ text match the copy pack', () => {
  assert.equal(SERVICES_HUB_DOCUMENT_TITLE.length, 60);
  assert.equal(SERVICES_HUB_DESCRIPTION.length, 152);
  assert.equal(HOME_META_DESCRIPTION.length, 154);
  assert.equal(SERVICES_HUB_ANSWER.split(/\s+/).length, 54);
  assert.equal(SERVICES_HUB_H1, 'Handyman services in Boise and the Treasure Valley');
  assert.deepEqual([...SERVICES_HUB_FAQS], PACK_FAQS);
  assert.deepEqual(
    VISIT_PROOF.map((item) => [item.label, item.line]),
    [
      ['Written quote first', 'One price for your whole list before any work starts.'],
      ['No trip fee', 'Anywhere in Ada and Canyon County.'],
      ['Registered', 'Idaho Registered Contractor #8381215.'],
      ['Insured', 'Our crew is insured.'],
    ],
  );
  const home = withBrandPageMetadata({ alternates: { canonical: 'https://boisehandyman.co/' } }, '/');
  assert.equal(home.description, HOME_META_DESCRIPTION);
  assert.deepEqual(home.title, { absolute: 'Boise Handyman Services | Upfront Quotes | Boise Handyman Co' });
  const services = withBrandPageMetadata({ alternates: { canonical: 'https://boisehandyman.co/services' } }, '/services');
  assert.equal(services.description, SERVICES_HUB_DESCRIPTION);
  assert.deepEqual(services.title, { absolute: SERVICES_HUB_DOCUMENT_TITLE });
  assert.equal(SERVICES_HUB_TITLE, 'Boise Handyman Services and Home Repairs');
  assert.equal(SERVICES_HUB_OG_TITLE, 'Handyman services in Boise and the Treasure Valley');
  assert.equal(SERVICES_HUB_OG_DESCRIPTION, 'Send your list and photos, get one written quote, and pay when the work is done.');
});

test('FAQPage JSON-LD repeats the visible FAQ and the catalog lists nine parent URLs', () => {
  const schema = generateFAQSchema([...SERVICES_HUB_FAQS]);
  const entities = schema.mainEntity as { name: string; acceptedAnswer: { text: string } }[];
  assert.deepEqual(
    entities.map((entity) => ({ question: entity.name, answer: entity.acceptedAnswer.text })),
    PACK_FAQS,
  );
  const business = generateLocalBusinessSchema();
  assert.equal(business.aggregateRating, undefined);
  const offers = (business.hasOfferCatalog as { itemListElement: { url: string; itemOffered: { name: string } }[] }).itemListElement;
  assert.deepEqual(
    offers.map((offer) => offer.url.replace(/^https:\/\/boisehandyman\.co/, '')),
    SERVICES_HUB_CARDS.map((card) => card.href),
  );
  assert.deepEqual(
    offers.map((offer) => offer.itemOffered.name),
    SERVICES_HUB_CARDS.map((card) => card.title),
  );
  for (const card of SERVICES_HUB_CARDS) {
    assert.equal(/\/services\/[^/]+\/[^/]+/.test(card.href), false, card.href);
  }
  const address = publicPostalAddress();
  assert.equal(address.addressLocality, 'Meridian');
  assert.equal(address.postalCode, '83646');
  assert.equal('streetAddress' in address, false);
});

test('the services page renders the hub copy, nine cities and no rating markup', async () => {
  (globalThis as { React?: unknown }).React = (await import('react')).default;
  const reactDom = (await import('react-dom')) as unknown as { default?: Record<string, unknown> } & Record<string, unknown>;
  for (const target of [reactDom, reactDom.default]) if (target && typeof target.preload !== 'function') try { target.preload = () => {}; } catch { /* server build */ }
  const { renderToStaticMarkup } = await import('react-dom/server');
  const { default: ServicesIndexPage } = (await import('../app/services/page.tsx')) as { default: () => unknown };
  const React = (await import('react')).default;
  const html = renderToStaticMarkup(React.createElement(ServicesIndexPage as never));
  assert.match(html, /Handyman services in Boise/);
  assert.match(html, /and the Treasure Valley/);
  assert.match(html, new RegExp(SERVICES_HUB_ANSWER.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
  assert.match(html, /Call \(208\) 477-1169/);
  assert.match(html, /Text us your list/);
  assert.match(html, /href="\/instant-estimate"/);
  for (const card of SERVICES_HUB_CARDS) {
    assert.match(html, new RegExp(`href="${card.href}"`));
    assert.match(html, new RegExp(`>${card.link}<`));
  }
  assert.equal(/href="\/services\/[^"]+\/[^"]+"/.test(html), false);
  for (const city of SERVICE_AREA_CITY_NAMES) {
    const slug = city.toLowerCase().replaceAll(' ', '-');
    assert.match(html, new RegExp(`href="/areas/${slug}"`));
    assert.match(html, new RegExp(`>${city}<`));
  }
  assert.equal((html.match(/<h2\b/g) ?? []).length, 7);
  assert.equal((html.match(/<h1\b/g) ?? []).length, 1);
  const scripts = [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)].map((match) => JSON.parse(match[1]));
  const faq = scripts.find((node) => node['@type'] === 'FAQPage');
  assert.ok(faq, 'FAQPage JSON-LD');
  assert.deepEqual(
    faq.mainEntity.map((entity: { name: string; acceptedAnswer: { text: string } }) => ({
      question: entity.name,
      answer: entity.acceptedAnswer.text,
    })),
    PACK_FAQS,
  );
  for (const faqItem of PACK_FAQS) {
    assert.ok(html.includes(faqItem.question), faqItem.question);
    assert.ok(html.includes(faqItem.answer), faqItem.question);
  }
  assert.equal(html.includes('AggregateRating'), false);
  assert.equal(html.includes('4031'), false);
  assert.equal(/Wapoot/i.test(html), false);
  assert.equal(html.includes('boiseadu.co'), false);
  assert.equal(/\$120|one-hour minimum|licensed/i.test(html), false);
  const emDash = String.fromCharCode(0x2014);
  const enDash = String.fromCharCode(0x2013);
  assert.equal(html.includes(emDash) || html.includes(enDash), false);
  assert.match(html, /Idaho Registered Contractor #8381215\./);
  assert.match(html, />Verify</);
});

test('homepage proof keeps the parent review and does not rewrite the founder block', () => {
  assert.equal(PARENT_REVIEW.author, 'beverly van zandt');
  assert.equal(PARENT_REVIEW.text, REVIEW);
  const founder = read('components/approved/ApprovedHome.tsx');
  assert.match(founder, /<h2 id="who-hiring-heading">Nick Perkins, founder\.<\/h2>/);
  assert.match(founder, /Google review of P5 Home Co, our parent company/);
  assert.match(founder, /href=\{P5_SOCIAL\.maps\}/);
  assert.doesNotMatch(founder, /@type['"]?\s*:\s*['"]AggregateRating/);
  const trust = read('components/marketing/HomeTrustLinks.tsx');
  assert.equal(BBB_PROFILE_HREF, 'https://www.bbb.org/us/id/meridian/profile/general-contractor/p5-home-co-llc-1296-1000203624');
  assert.match(trust, /href=\{BBB_PROFILE_HREF\}/);
  assert.match(trust, /Better Business Bureau profile for P5 Home Co/);
  assert.match(trust, /P5 Home Co on Google/);
  assert.doesNotMatch(trust, /\brating\b|\baccredit|\bstars?\b/i);
  const intro = read('components/seo/HandymanServicesAnswer.tsx');
  assert.match(intro, /<Link href="\/services">handyman services in Boise<\/Link>/);
});
