import { InteriorHero,InteriorPage } from '@/components/approved/InteriorLayout';
import { ContractorCredential } from '@/components/ContractorCredential';
import { DisplayNum,formatStepNumber,Section } from '@/components/marketing';
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

const SPEAKABLE_SUMMARY =
  'Boise Handyman Co is a design-minded repair and maintenance company in Meridian, Idaho, and one of the four companies of P5 Home Co. Founder Nick Perkins leads the work with one written price before work starts, including RE-10 inspection repair lists.';

const HANDYMAN_FIVE = [
  'Written quote before work starts',
  'One-hour minimum and materials at cost',
  'Agreed arrival time',
  'One-trip fixes where the job allows',
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
              About Boise Handyman{' '}
              <em className="brc-accent">Co</em>
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

        {/* Owner hard rule: full family photo stacked full-width - never side-crop or cover-crop people */}
        <Section variant="greige" spacing="none" divider className="p-0">
          <div id="team" className="scroll-mt-24">
            <figure className="m-0 mx-auto w-full max-w-3xl bg-inverse px-0 sm:px-6 md:px-8">
              <Image
                src="/images/about/perkins-family-meridian-idaho-1x1.webp"
                alt="Nick Perkins with his wife and five children at a pumpkin patch in Meridian, Idaho"
                width={2048}
                height={2048}
                sizes="(max-width: 768px) 100vw, 768px"
                className="h-auto w-full"
                style={{ objectFit: "contain", maxWidth: "100%", height: "auto" }}
                priority
              />
              <figcaption className="bg-inverse px-8 py-6 md:px-12 md:py-8">
                <p className="font-sans font-light text-xl md:text-2xl text-inverse-foreground">
                  The Perkins family
                </p>
                <p className="mt-4 text-base md:text-lg text-inverse-foreground/85 leading-relaxed">
                  Boise Handyman Co is run by Nick Perkins, a construction project manager with a bachelor&apos;s degree in Construction with an emphasis in Project Management, and more than a decade of work from small renovations to multimillion-dollar custom homes.
                </p>
                <p className="mt-4 text-base md:text-lg text-inverse-foreground/85 leading-relaxed">
                  He founded P5 in Colorado in 2020 and moved the family and company to the Treasure Valley in 2025. Read the full story on{' '}
                  <a href="https://p5homeco.com/about" className="underline underline-offset-2">p5homeco.com/about</a>.
                </p>
              </figcaption>
            </figure>

            <div className="section-y-sm px-8 md:px-14 lg:px-16 bg-card max-w-5xl mx-auto">
              <Reveal>
                <SectionHeader
                  eyebrow="Credentials"
                  title={
                    <>
                      Locally owned. <em className="brc-accent">Registered.</em>
                    </>
                  }
                  description="P5 Home Co LLC, Idaho Registered Contractor #8381215. Insured; certificate on request. One-year workmanship warranty on repairs and installs."
                  className="mb-8 max-w-none"
                />
                <p className="text-sm text-muted-foreground leading-relaxed mb-8">
                  Plumbing, electrical and HVAC work on your list is done by the licensed trade
                  partners we schedule and stand behind, inside the same written quote and the same
                  visit plan. Drywall, doors, mounting, fences, decks, caulk, assembly and hardware
                  are our crew&apos;s own work. <ContractorCredential />.
                </p>
                <ul className="grid sm:grid-cols-2 gap-3">
                  {visibleTrustItems(TRUST_ITEMS).map((item) => (
                    <li key={item} className="flex items-start gap-3 text-sm text-muted-foreground">
                      <Check className="h-4 w-4 text-accent-legible flex-shrink-0 mt-0.5" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
                <h3 className="ed-h4 mt-8 mb-4">{HOW_P5_WORKS_TITLE}</h3>
                <ul className="grid sm:grid-cols-2 gap-3">
                  {HOW_P5_WORKS.map((item) => (
                    <li key={item} className="text-sm text-muted-foreground">
                      {item}
                    </li>
                  ))}
                </ul>
                <h3 className="ed-h4 mt-8 mb-4">What you can count on from this trade</h3>
                <ul className="grid sm:grid-cols-1 gap-3">
                  {HANDYMAN_FIVE.map((item) => (
                    <li key={item} className="flex items-start gap-3 text-sm text-muted-foreground">
                      <Check className="h-4 w-4 text-accent-legible flex-shrink-0 mt-0.5" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
                <div className="mt-8 pt-8 border-t border-border">
                  <p className="ed-eyebrow">Warranty</p>
                  <h3 className="ed-h4">One year on our workmanship</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    If our work fails within a year, we come back and make it right. Full terms on the{' '}
                    <Link href="/warranty" className="underline underline-offset-2">
                      warranty page
                    </Link>
                    .
                  </p>
                </div>
                <div className="mt-8 pt-8 border-t border-border">
                  <p className="ed-eyebrow">Where your money goes</p>
                  <h3 className="ed-h4">
                    Don&apos;t pay for our overhead
                  </h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    No showroom, no sales team, no fleet of wrapped trucks. What you spend goes into
                    the time and materials your repair actually takes, with materials at cost and no
                    trip fee in Ada and Canyon County.
                  </p>
                </div>
              </Reveal>
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
                  <em className="brc-accent">compromise</em> on
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
