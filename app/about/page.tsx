import { InteriorHero,InteriorPage } from '@/components/approved/InteriorLayout';
import { ContractorCredential } from '@/components/ContractorCredential';
import { DisplayNum, formatStepNumber } from '@/components/marketing/DisplayNum';
import { Section } from '@/components/marketing/Section';
import { AreaCard } from '@/components/marketing/AreaCard';
import { Hairline } from '@/components/marketing/Hairline';
import { SectionHeader } from '@/components/marketing/SectionHeader';
import Image from '@/components/MarketingImage';
import { ConsultCTA } from '@/components/modals/ConsultCTA';
import { Reveal } from '@/components/Reveal';
import { StatementBandSection } from '@/components/sections/StatementBandSection';
import { WhyChooseUsSection } from '@/components/sections/WhyChooseUsSection';
import { JsonLd } from '@/components/seo/JsonLd';
import { withBrandPageMetadata } from '@/lib/brand-page-metadata';
import { GRAIN_URL } from '@/lib/grain';
import { buildPageMetadata } from '@/lib/page-metadata';
import {
generateBreadcrumbSchema,
generateOrganizationSchema,
generateWebPageSchema,
} from '@/lib/schema';
import { CITY_HERO_IMAGES } from '@/shared/cityServiceImages';
import { CITIES,TREASURE_VALLEY_CITIES } from '@/shared/contentData';
import { CTA_PRIMARY,CTA_SECONDARY } from '@/shared/ctaCopy';
import { SITE_CONFIG } from '@/shared/siteConfig';
import { visibleTrustItems } from '@/shared/foundingClaims';
import { HERO_STATS,HOW_P5_WORKS,HOW_P5_WORKS_TITLE,PRINCIPLES,TRUST_ITEMS } from '@/shared/siteContent';
import { SITE_IMAGES } from '@/shared/siteImages';
import { Check,ChevronRight } from 'lucide-react';
import Link from 'next/link';
import { FamilyButton } from '@/components/family/Button';
import { toSentenceCase } from '@/shared/sentenceCase';

const SPEAKABLE_SUMMARY =
  'Boise Handyman Co is a design-minded repair and maintenance company in Meridian, Idaho, and one of the companies of P5 Home Co. Founder Nick Perkins leads the work with one written price before work starts, including RE-10 inspection repair lists.';

const HANDYMAN_FIVE = [
  'Written quote before work starts',
  'Materials listed separately',
  'Agreed arrival time',
  'Small repairs and installs with a written quote',
  'Cleanup and haul-away',
] as const;

function HeroBreadcrumbs() {
  const items = [
    { name: 'Home', href: '/' },
    { name: 'About' },
  ];

  return (
    <nav aria-label="Breadcrumb">
      <ol className="flex flex-wrap items-center gap-1.5 text-sm text-inverse-foreground/80">
        {items.map((item, index) => {
          const isLast = index === items.length - 1;
          return (
            <li key={item.name} className="flex items-center gap-1.5">
              {item.href && !isLast ? (
                <Link
                  href={item.href}
                  className="hover:text-inverse-foreground transition-colors"
                >
                  {item.name}
                </Link>
              ) : (
                <span className={isLast ? 'text-inverse-foreground font-normal' : ''}>
                  {item.name}
                </span>
              )}
              {!isLast && (
                <ChevronRight className="h-3.5 w-3.5 flex-shrink-0 opacity-40" />
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

export const metadata = withBrandPageMetadata((buildPageMetadata({
  kind: 'about',
  path: '/about',
})), "/about");

export default function AboutPage() {
  const schemas = [
    generateOrganizationSchema(),
    generateWebPageSchema({
      title: `About ${SITE_CONFIG.name}`,
      description:
        'Locally owned Treasure Valley handyman service committed to upfront quotes, one-trip fixes, and clear communication.',
      url: '/about',
      speakable: true,
    }),
    generateBreadcrumbSchema([
      { name: 'Home', url: '/' },
      { name: 'About', url: '/about' },
    ]),
  ];

  return (
    <InteriorPage kind="about"><>
      <JsonLd data={schemas} />
      <div className="flex flex-col ">
        {/* Approved editorial hero */}
        <InteriorHero
          layout="editorial"
          imageSrc={SITE_IMAGES.leadership}
          imageAlt="A handyman and a homeowner reviewing a clipboard at a front door"
          imageFit="contain"
        >
            <HeroBreadcrumbs />
            <p data-speakable="summary" className="sr-only">
              {SPEAKABLE_SUMMARY}
            </p>
            <p className="ed-eyebrow" style={{ color: "rgb(255 255 255 / 0.72)" }}>Real people. A higher standard.</p>
            <h1 className="ed-display ed-statement-display text-inverse-foreground mb-8">
              About Boise{' '}
              <span className="mobile-keep">Handyman <em className="brc-accent">Co</em></span>
            </h1>
            {/* One support line keeps the primary in the first screen at 360x640;
                the rest of the introduction sits with the family photo below. */}
            <p className="text-base md:text-lg text-inverse-foreground/85 max-w-2xl leading-relaxed mb-8">
              Boise Handyman Co is a repair, install and maintenance company in Meridian, Idaho, and one of the four companies of P5 Home Co.
            </p>
            <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap [&>*]:w-full sm:[&>*]:w-auto mb-8">
              <ConsultCTA variant="brand" data-hero-cta="primary">{CTA_PRIMARY}</ConsultCTA>
              <FamilyButton href="/#consult" variant="secondary">{CTA_SECONDARY}</FamilyButton>
            </div>
            <dl className="ed-hero-facts">
              {HERO_STATS.map((stat) => (
                <div key={stat.label}>
                  <dt>{stat.label}</dt>
                  <dd>{stat.num}</dd>
                </div>
              ))}
            </dl>
          </InteriorHero>

        {/* Who runs it: the lede beside the full family photograph (owner hard rule:
            the whole family, never side-cropped or cover-cropped on any breakpoint). */}
        <Section divider>
          <div className="ed-shell">
            <div id="team" className="ed-split ed-split-narrow ed-split-center scroll-mt-24">
              <Reveal>
                <p className="ed-eyebrow">The Perkins family</p>
                <p className="ed-lede">
                  Boise Handyman Co is run by Nick Perkins, a construction project manager with a bachelor&apos;s degree in Construction with an emphasis in Project Management, and more than a decade of work from small renovations to multimillion-dollar custom homes.
                </p>
                <p className="ed-body mt-6">
                  He founded P5 in Colorado in 2020 and moved the family and company to the Treasure Valley in 2025. Read the full story on{' '}
                  <a href="https://p5homeco.com/about" className="underline underline-offset-2">p5homeco.com/about</a>.
                </p>
              </Reveal>
              <Image
                src="/images/about/perkins-family-meridian-idaho-1x1.webp"
                alt="Nick Perkins with his wife and five children at a pumpkin patch in Meridian, Idaho"
                width={2048}
                height={2048}
                sizes="(max-width: 1024px) 100vw, 640px"
                className="h-auto w-full"
                style={{ objectFit: "contain", maxWidth: "100%", height: "auto" }}
                priority
              />
            </div>
          </div>
        </Section>

        {/* Credentials: heading column beside the facts. */}
        <Section variant="greige" divider>
          <div className="ed-shell">
            <div className="ed-split ed-split-narrow">
              <div className="lg:sticky lg:top-28 lg:self-start">
                <p className="ed-eyebrow">Credentials</p>
                <h2 className="ed-h2 ed-statement">Locally <em className="brc-accent">owned. Registered.</em></h2>
              </div>
              <Reveal>
                <p className="ed-lede">
                  P5 Home Co LLC, Idaho Registered Contractor #8381215. Insured; certificate on request. Written workmanship warranty on repairs and installs.
                </p>
                <p className="ed-body mt-6">
                  Plumbing, electrical and HVAC work on your list is done by the licensed trade
                  partners we schedule and stand behind, inside the same written quote and the same
                  visit plan. Drywall, doors, mounting, fences, decks, caulk, assembly and hardware
                  are our crew&apos;s own work. <ContractorCredential />.
                </p>
                <ul className="mt-8 grid gap-3 border-t pt-6 sm:grid-cols-2" style={{ borderColor: 'var(--ed-line)' }}>
                  {visibleTrustItems(TRUST_ITEMS).map((item) => (
                    <li key={item} className="ed-body flex items-start gap-3 text-[0.9375rem]">
                      <Check className="h-4 w-4 flex-shrink-0 mt-1" style={{ color: 'var(--ed-accent)' }} aria-hidden="true" />
                      <span>{toSentenceCase(item)}</span>
                    </li>
                  ))}
                </ul>
                <h3 className="ed-h4 mt-10 mb-4">{HOW_P5_WORKS_TITLE}</h3>
                <ul className="grid gap-3 sm:grid-cols-2">
                  {HOW_P5_WORKS.map((item) => (
                    <li key={item} className="ed-body flex items-start gap-3 text-[0.9375rem]">
                      <Check className="h-4 w-4 flex-shrink-0 mt-1" style={{ color: 'var(--ed-accent)' }} aria-hidden="true" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </Reveal>
            </div>
          </div>
        </Section>

        {/* Five promises from this trade, as a hairline matrix (three then two). */}
        <Section divider>
          <div className="ed-shell">
            <p className="ed-eyebrow">On every visit</p>
            <h2 className="ed-h2 ed-statement">What you can count on from this trade.</h2>
            <ul className="ed-matrix mt-10 list-none p-0" style={{ '--ed-cell-h': '150px' } as React.CSSProperties}>
              {HANDYMAN_FIVE.map((item, i) => (
                <li key={item} className="flex flex-col gap-4">
                  <span className="ed-step-n" aria-hidden="true">{formatStepNumber(i)}</span>
                  <span className="ed-h4">{item}</span>
                </li>
              ))}
            </ul>
            <div className="ed-split ed-split-even mt-12">
              <div className="ed-inset">
                <p className="ed-eyebrow">Warranty</p>
                <h3 className="ed-h3">Written workmanship warranty</h3>
                <p className="ed-body mt-3">
                  Our work carries a written workmanship warranty. Call or text us with warranty questions.
                </p>
              </div>
              <div className="ed-inset">
                <p className="ed-eyebrow">Where your money goes</p>
                <h3 className="ed-h3">Don&apos;t pay for our overhead</h3>
                <p className="ed-body mt-3">
                  No showroom, no sales team, no fleet of wrapped trucks. You get one written quote before work starts. Parts and materials appear on your quote as their own line.
                </p>
              </div>
            </div>
          </div>
        </Section>
        <WhyChooseUsSection />

        {/* The Kuna front elevation is also the Kuna card in the service-area
            grid below; this band uses a different Kuna photograph so the page
            shows each image once. */}
        <section className="relative h-[clamp(220px,32vw,400px)] overflow-hidden" aria-label="Kuna single-storey home exterior">
          <Image
            src="/images/houses/kuna/kuna-gutter-cleaning.webp"
            alt="White gutter with autumn leaves at the eave of a beige Kuna single-storey home"
            fill
            sizes="100vw"
            className="object-cover img-brand-grade"
          />
          <div
            className="absolute inset-0 pointer-events-none"
            style={{ backgroundImage: GRAIN_URL, backgroundRepeat: 'repeat', opacity: 0.03 }}
          />
        </section>

        <StatementBandSection />

        {/* ─── Principles ─── */}
        <Section variant="inverse" divider>
          <div className="container px-4 max-w-5xl">
            {/* Brand icon (terracotta field) - bright badge on the dark band */}
            <img
              src="/brand/svg/icon/boise-handyman-co-icon-accent.svg"
              alt="Boise Handyman Co"
              width={72}
              height={72}
              className="h-16 w-16 md:h-[72px] md:w-[72px] mb-8"
            />
            <SectionHeader
              eyebrow="Our standards"
              inverse
              size="display"
              title={
                <>
                  Six principles we never{' '}
                  <em className="brc-accent">compromise on</em>
                </>
              }
              className="mb-0 max-w-3xl"
            />
            <Hairline inverse className="mt-8 mb-12" />
            <div className="ed-cards-3 gap-6">
              {PRINCIPLES.map(({ title, desc }, i) => (
                <Reveal key={title} delay={Math.min(i, 5) * 60}>
                  <div className="h-full">
                    <DisplayNum className="text-2xl text-inverse-foreground/50 leading-none mb-4 block">
                      {formatStepNumber(i)}
                    </DisplayNum>
                    <h3 className="ed-h4">
                      {title}
                    </h3>
                    <p className="text-sm text-inverse-muted leading-relaxed">{desc}</p>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </Section>

        {/* ─── Service areas ─── */}
        <Section divider>
          <div className="container px-4 max-w-5xl">
            <SectionHeader
              eyebrow="Treasure Valley"
              size="display"
              title={
                <>
                  Service <em className="brc-accent">areas</em>
                </>
              }
              description={`We handle repairs, installs, and maintenance for homeowners in ${TREASURE_VALLEY_CITIES}, and surrounding communities. Where you live never inflates the quote.`}
              className="max-w-3xl"
            />
            <div className="grid sm:grid-cols-3 gap-4">
              {CITIES.map((city, i) => (
                <Reveal key={city.slug} delay={Math.min(i, 7) * 50}>
                  <AreaCard city={city} imageSrc={CITY_HERO_IMAGES[city.slug]} />
                </Reveal>
              ))}
            </div>
          </div>
        </Section>

        {/* ─── Closing CTA ─── */}
        <Section surface="gradient" spacing="xl" edge>
          <div className="ed-shell">
            <div className="ed-split ed-split-center">
              <h2 className="ed-h2-sm ed-statement-wide">
                Ready to clear that to-do list?
              </h2>
              <div>
              <p className="ed-body">
                Send your tasks with photos for review and a written quote. No
                pressure, no obligation.
              </p>
              <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap [&>*]:w-full sm:[&>*]:w-auto sm:justify-center">
                <ConsultCTA variant="brand" tone="dark">{CTA_PRIMARY}</ConsultCTA>
                <FamilyButton href="/contact#consult" variant="secondary" tone="dark">{CTA_SECONDARY}</FamilyButton>
              </div>

              </div></div>
          </div>
        </Section>
      </div>
    </></InteriorPage>
  );
}
