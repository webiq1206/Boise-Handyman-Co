import { InteriorHero, InteriorPage } from '@/components/approved/InteriorLayout';
import { Breadcrumbs } from '@/components/Breadcrumbs';
import { FamilyButton } from '@/components/family/Button';
import Image from '@/components/VersionedImage';
import { Section } from '@/components/marketing/Section';
import { VisitProofRow } from '@/components/marketing/VisitProofRow';
import { JsonLd } from '@/components/seo/JsonLd';
import { withBrandPageMetadata } from '@/lib/brand-page-metadata';
import { buildCanonical, FEED_ALTERNATES } from '@/lib/page-metadata';
import { areaPath } from '@/lib/seo-routes';
import {
  generateBreadcrumbSchema,
  generateFAQSchema,
  generateOrganizationSchema,
  generateWebPageSchema,
} from '@/lib/schema';
import { CITY_HERO_IMAGES } from '@/shared/cityServiceImages';
import { SERVICE_AREA_CITIES } from '@/shared/contentData';
import { altForImage } from '@/shared/imageAlts';
import { localAlt, subjectForService } from '@/shared/localAlt';
import { getServiceBackground } from '@/shared/serviceBackgrounds';
import { SITE_CONFIG } from '@/shared/siteConfig';
import {
  LARGER_WORK,
  SERVICES_HUB_ANSWER,
  SERVICES_HUB_CARDS,
  SERVICES_HUB_DESCRIPTION,
  SERVICES_HUB_DOCUMENT_TITLE,
  SERVICES_HUB_FAQS,
  SERVICES_HUB_FIX_INTRO,
  SERVICES_HUB_LARGER,
  SERVICES_HUB_OG_DESCRIPTION,
  SERVICES_HUB_OG_TITLE,
  SERVICES_HUB_PRICING,
  SERVICES_HUB_PRICING_ID,
  SERVICES_HUB_WHERE,
  VISIT_STEPS,
} from '@/shared/servicesHub';
import type { Metadata } from 'next';
import Link from 'next/link';

const branded = withBrandPageMetadata(
  {
    alternates: { canonical: buildCanonical('/services'), types: FEED_ALTERNATES },
    openGraph: {
      url: buildCanonical('/services'),
      type: 'website',
    },
  },
  '/services',
);

export const metadata: Metadata = {
  ...branded,
  openGraph: {
    ...branded.openGraph,
    title: SERVICES_HUB_OG_TITLE,
    description: SERVICES_HUB_OG_DESCRIPTION,
  },
};

export default function ServicesIndexPage() {
  const breadcrumbSchema = generateBreadcrumbSchema([
    { name: 'Home', url: '/' },
    { name: 'Services', url: '/services' },
  ]);
  const webPageSchema = generateWebPageSchema({
    title: SERVICES_HUB_DOCUMENT_TITLE,
    description: SERVICES_HUB_DESCRIPTION,
    url: '/services',
    speakable: true,
  });
  const faqSchema = generateFAQSchema([...SERVICES_HUB_FAQS]);

  return (
    <InteriorPage kind="services">
      <>
        <JsonLd data={[webPageSchema, breadcrumbSchema, faqSchema, generateOrganizationSchema()]} />

        <InteriorHero layout="editorial">
          <Breadcrumbs items={[{ name: 'Home', href: '/' }, { name: 'Services' }]} />
          <h1 className="ed-display">
            Handyman services in Boise{' '}
            <em className="not-italic" style={{ color: 'var(--ed-accent)' }}>
              and the Treasure Valley
            </em>
          </h1>
          <p className="ed-lede mt-8 max-w-[62ch]" data-speakable="summary">
            {SERVICES_HUB_ANSWER}
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:gap-x-6 sm:gap-y-3">
            <FamilyButton className="w-full sm:w-auto" href={SITE_CONFIG.phoneHref} variant="primary" size="lg">
              Call {SITE_CONFIG.phone}
            </FamilyButton>
            <FamilyButton className="w-full sm:w-auto" href={SITE_CONFIG.phoneSmsHref} variant="secondary" size="lg">
              Text us your list
            </FamilyButton>
            <FamilyButton href="/instant-estimate" variant="tertiary" size="lg">
              Get an instant estimate
            </FamilyButton>
          </div>
        </InteriorHero>

        <div className="services-hub">
          <Section surface="bone" spacing="lg" edge>
            <div className="ed-shell">
              <h2 className="ed-h2-sm">What we fix</h2>
              <p className="ed-body mt-6">{SERVICES_HUB_FIX_INTRO}</p>
              <ul className="services-hub-cards">
                {SERVICES_HUB_CARDS.map((card) => {
                  const slug = card.href.startsWith('/services/') ? card.href.slice('/services/'.length) : undefined;
                  const src = slug ? getServiceBackground(slug) : undefined;
                  const alt = src ? (altForImage(src, { subject: subjectForService(slug) }) ?? localAlt(card.title)) : '';
                  return (
                    <li key={card.href}>
                      {src ? (
                        <Image
                          src={src}
                          alt={alt}
                          width={900}
                          height={675}
                          sizes="(max-width: 700px) 112px, (max-width: 1023px) 50vw, 400px"
                          className="h-auto w-full object-cover"
                        />
                      ) : null}
                      <h3 className="ed-h3">{card.title}</h3>
                      <p className="ed-body">{card.benefit}</p>
                      <Link href={card.href}>{card.link}</Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          </Section>

          <Section surface="dark" spacing="lg" edge>
            <div className="ed-shell">
              <div className="lx-prose-split">
                <h2 id={SERVICES_HUB_PRICING_ID} className="ed-h2-sm scroll-mt-28">
                  How a handyman visit is priced
                </h2>
                <p className="ed-body mt-6 lg:mt-0">{SERVICES_HUB_PRICING}</p>
              </div>
            </div>
          </Section>

          <Section surface="bone" spacing="lg" edge>
            <div className="ed-shell">
              <h2 className="ed-h2-sm">How it works</h2>
              <ol className="services-hub-steps">
                {VISIT_STEPS.map((step, index) => (
                  <li key={step.title}>
                    <span className="services-hub-step-n" aria-hidden="true">
                      {String(index + 1).padStart(2, '0')}
                    </span>
                    <h3 className="ed-h3">{step.title}</h3>
                    <p className="ed-body">{step.body}</p>
                  </li>
                ))}
              </ol>
            </div>
          </Section>

          <Section surface="dark" spacing="lg" edge>
            <div className="ed-shell">
              <h2 className="ed-h2-sm">Why Boise homeowners call us</h2>
              <div className="mt-8">
                <VisitProofRow as="div" />
              </div>
            </div>
          </Section>

          <Section surface="bone" spacing="lg" edge>
            <div className="ed-shell">
              <div className="lx-prose-split">
                <h2 className="ed-h2-sm">Where we work</h2>
                <div className="mt-6 lg:mt-0">
                  <p className="ed-body">{SERVICES_HUB_WHERE}</p>
                  <nav className="services-hub-cities" aria-label="Cities we serve">
                    {SERVICE_AREA_CITIES.map((city) => {
                      const src = CITY_HERO_IMAGES[city.slug];
                      return (
                        <Link key={city.slug} href={areaPath(city.slug)}>
                          <Image
                            src={src}
                            alt={altForImage(src) ?? ''}
                            width={900}
                            height={675}
                            sizes="(max-width: 700px) 112px, (max-width: 1023px) 34vw, 400px"
                            className="h-auto w-full object-cover"
                          />
                          {city.name}
                        </Link>
                      );
                    })}
                  </nav>
                </div>
              </div>
            </div>
          </Section>

          <Section surface="dark" spacing="lg" edge>
            <div className="ed-shell">
              <div className="lx-prose-split">
                <h2 className="ed-h2-sm">Bigger than a handyman job?</h2>
                <div className="mt-6 lg:mt-0">
                  <p className="ed-body">{SERVICES_HUB_LARGER}</p>
                  <ul className="services-hub-family">
                    {LARGER_WORK.map((item) => (
                      <li key={item.href}>
                        {item.lead}:{' '}
                        <a href={item.href} rel="noopener noreferrer">
                          {item.name}
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </Section>

          <Section surface="bone" spacing="lg" edge>
            <div className="ed-shell">
              <div className="ed-split ed-split-narrow">
                <div className="lg:sticky lg:top-28 lg:self-start">
                  <h2 className="ed-h2-sm">Handyman services FAQ</h2>
                </div>
                <div className="lx-faq w-full border-t" style={{ borderColor: 'var(--ed-line)' }}>
                  {SERVICES_HUB_FAQS.map((faq, index) => (
                    <details
                      key={faq.question}
                      name="services-hub-faq"
                      open={index === 0}
                      className="border-b"
                      style={{ borderColor: 'var(--ed-line)' }}
                    >
                      <summary>
                        <h3 className="ed-h4 text-left">{faq.question}</h3>
                      </summary>
                      <p className="ed-body">{faq.answer}</p>
                    </details>
                  ))}
                </div>
              </div>
            </div>
          </Section>
        </div>
      </>
    </InteriorPage>
  );
}
