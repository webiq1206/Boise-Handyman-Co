import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { Section } from '@/components/marketing/Section';
import { SectionHeader } from '@/components/marketing/SectionHeader';
import { MarketingCard } from '@/components/marketing/MarketingCard';
import { Breadcrumbs } from '@/components/Breadcrumbs';
import { Reveal } from '@/components/Reveal';
import { JsonLd } from '@/components/seo/JsonLd';
import { Button } from '@/components/ui/button';
import { ConsultCTA } from '@/components/modals/ConsultCTA';
import { EstimatePromptBand } from '@/components/marketing/EstimatePromptBand';
import { PageHeroBand } from '@/components/sections/PageHeroBand';
import { AreaCard } from '@/components/marketing/AreaCard';
import { SERVICES, CITIES } from '@/shared/contentData';
import { servicePath } from '@/lib/seo-routes';
import { getServiceBackground } from '@/shared/serviceBackgrounds';
import { CITY_HERO_IMAGES } from '@/shared/cityServiceImages';
import { SITE_IMAGES } from '@/shared/siteImages';
import { buildCanonical, FEED_ALTERNATES } from '@/lib/page-metadata';
import { getBaseUrl } from '@/lib/seo';
import { generateBreadcrumbSchema } from '@/lib/schema';
import { CTA_PRIMARY, CTA_SECONDARY } from '@/shared/ctaCopy';
import { SITE_CONFIG } from '@/shared/siteConfig';

const TITLE = 'Handyman Services | Treasure Valley';
const DESCRIPTION =
  'Handyman services in Boise, Meridian, Eagle, Nampa and the Treasure Valley: drywall repair, painting, minor plumbing and electrical, carpentry, mounting, and maintenance. Upfront quotes - book a visit.';

export const metadata: Metadata = {
  title: { absolute: `${TITLE} | ${SITE_CONFIG.name}` },
  description: DESCRIPTION,
  alternates: { canonical: buildCanonical('/services'), types: FEED_ALTERNATES },
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    url: buildCanonical('/services'),
    type: 'website',
    images: [{ url: '/images/og-default.png', width: 1200, height: 630, alt: SITE_CONFIG.name }],
  },
  twitter: {
    card: 'summary_large_image',
    title: TITLE,
    description: DESCRIPTION,
    images: ['/images/og-default.png'],
  },
};

export default function ServicesIndexPage() {
  const base = getBaseUrl().replace(/\/$/, '');

  const breadcrumbSchema = generateBreadcrumbSchema([
    { name: 'Home', url: '/' },
    { name: 'Services', url: '/services' },
  ]);

  const itemListSchema = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: 'Handyman Services',
    itemListElement: SERVICES.map((service, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: service.name,
      url: `${base}${servicePath(service.slug)}`,
    })),
  };

  return (
    <>
      <JsonLd data={[breadcrumbSchema, itemListSchema]} />

      <PageHeroBand
        imageSrc={SITE_IMAGES.statementBand}
        imageAlt="Well-maintained Treasure Valley home interior after a handyman visit"
      >
        <Breadcrumbs items={[{ name: 'Home', href: '/' }, { name: 'Services' }]} />
        <div className="brc-label text-inverse-muted mt-6 mb-4">Our services</div>
        <h1 className="font-sans font-light text-display tracking-tight text-inverse-foreground max-w-3xl mb-4">
          Everything we fix, install, and{' '}
          <em className="brc-accent">maintain</em>
        </h1>
        <p className="text-base md:text-lg text-inverse-foreground/85 max-w-2xl leading-relaxed">
          Small repairs, installs, and maintenance for Treasure Valley homes, quoted upfront with a
          simple hourly rate plus one flat trip fee. Most jobs run one to eight hours and are
          finished in a single visit; anything bigger gets an honest referral to a specialty
          contractor.
        </p>
      </PageHeroBand>

      <Section spacing="default" divider className="pt-10 md:pt-14">
        <div className="container px-4">
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
            {SERVICES.map((service, i) => (
              <Reveal key={service.slug} delay={Math.min(i, 5) * 40}>
                <Link href={servicePath(service.slug)} className="group block h-full">
                  <article className="h-full flex flex-col rounded-sm border border-card-border bg-card overflow-hidden transition-colors group-hover:border-foreground/20">
                    <div className="relative aspect-[4/3] overflow-hidden">
                      <Image
                        src={getServiceBackground(service.slug)}
                        alt={`${service.name} handyman service by ${SITE_CONFIG.name}`}
                        fill
                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                        quality={70}
                        className="object-cover img-brand-grade transition-transform duration-300 ease-out group-hover:scale-[1.02]"
                      />
                    </div>
                    <div className="flex flex-col flex-1 p-5 md:p-6">
                      <h2 className="font-sans font-normal text-base mb-2 text-foreground">
                        {service.name}
                      </h2>
                      <p className="text-sm leading-relaxed mb-4 text-muted-foreground flex-1">
                        {service.shortDescription}
                      </p>
                      <div className="mt-auto pt-4 border-t border-border/60 flex items-center justify-between gap-3">
                        <div>
                          <div className="text-caption uppercase tracking-[0.14em] text-muted-foreground">
                            Planning from
                          </div>
                          <div className="brc-display-num text-foreground text-lg leading-none mt-0.5">
                            {service.planningFrom}
                          </div>
                        </div>
                        <span className="brc-text-link">
                          Learn more <ArrowRight className="h-4 w-4" />
                        </span>
                      </div>
                    </div>
                  </article>
                </Link>
              </Reveal>
            ))}

            <Reveal delay={SERVICES.length * 40}>
              <div className="h-full min-h-[220px] rounded-sm border border-card-border bg-card p-6 md:p-8 flex flex-col justify-center">
                <div className="brc-label mb-3">Not sure where your job fits</div>
                <h2 className="font-sans font-light text-xl md:text-2xl tracking-tight mb-2 text-foreground">
                  Tell us about your <em className="brc-accent">list</em>
                </h2>
                <p className="text-sm leading-relaxed mb-5 text-muted-foreground">
                  Every job starts with an upfront quote from your photos, with no obligation. One trip fee covers the whole visit.
                </p>
                <ConsultCTA variant="brand" className="self-start">
                  {CTA_PRIMARY}
                </ConsultCTA>
              </div>
            </Reveal>
          </div>
        </div>
      </Section>

      <EstimatePromptBand
        title={
          <>
            Know your range before you{' '}
            <em className="brc-accent">book</em>
          </>
        }
        description="Use our Treasure Valley estimator to see a realistic range for your repair, install, or maintenance job - then book a handyman visit when you're ready."
      />

      <Section divider>
        <div className="container px-4 max-w-5xl">
          <SectionHeader
            eyebrow="Treasure Valley"
            size="display"
            className="max-w-3xl"
            title={
              <>
                Serving communities across the{' '}
                <em className="brc-accent">valley</em>
              </>
            }
            description="We serve every Ada and Canyon County community below with the same flat trip fee. Choose your city for local details and scheduling."
          />
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-8">
            {CITIES.map((city, i) => (
              <Reveal key={city.slug} delay={Math.min(i, 7) * 40}>
                <AreaCard city={city} imageSrc={CITY_HERO_IMAGES[city.slug]} />
              </Reveal>
            ))}
          </div>
        </div>
      </Section>

      <Section divider spacing="sm">
        <div className="container px-4 max-w-2xl mx-auto">
          <MarketingCard className="cta-card-dark p-10 md:p-12 text-center">
            <h2 className="font-sans font-light text-section-title mb-4 text-inverse-foreground">
              Ready to get it <em className="brc-accent">fixed</em>?
            </h2>
            <p className="text-inverse-muted mb-8 max-w-md mx-auto">
              Get an instant estimate online, or book a handyman visit with an upfront quote.
            </p>
            <div className="flex flex-wrap gap-3 justify-center">
              <ConsultCTA variant="brand">{CTA_PRIMARY}</ConsultCTA>
              <Button variant="heroGhost" asChild><a href="/#consult">{CTA_SECONDARY}</a></Button>
            </div>
          </MarketingCard>
        </div>
      </Section>
    </>
  );
}
