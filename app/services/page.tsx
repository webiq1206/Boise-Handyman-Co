import { InteriorHero,InteriorPage } from '@/components/approved/InteriorLayout';
import { Breadcrumbs } from '@/components/Breadcrumbs';
import { AreaCard } from '@/components/marketing/AreaCard';
import { EstimatePromptBand } from '@/components/marketing/EstimatePromptBand';
import { Section } from '@/components/marketing/Section';
import { ConsultCTA } from '@/components/modals/ConsultCTA';
import { Reveal } from '@/components/Reveal';
import { JsonLd } from '@/components/seo/JsonLd';
import { Button } from '@/components/ui/button';
import { withBrandPageMetadata } from '@/lib/brand-page-metadata';
import { buildCanonical,FEED_ALTERNATES,fitDescription } from '@/lib/page-metadata';
import { generateBreadcrumbSchema } from '@/lib/schema';
import { getBaseUrl } from '@/lib/seo';
import { servicePath } from '@/lib/seo-routes';
import { CITY_HERO_IMAGES } from '@/shared/cityServiceImages';
import { CITIES,SERVICES } from '@/shared/contentData';
import { CTA_PRIMARY,CTA_SECONDARY } from '@/shared/ctaCopy';
import { getServiceBackground } from '@/shared/serviceBackgrounds';
import { SITE_CONFIG } from '@/shared/siteConfig';
import { ArrowRight } from 'lucide-react';
import type { Metadata } from 'next';
import Link from 'next/link';

const TITLE = 'Handyman Services | Treasure Valley';
const DESCRIPTION =
  fitDescription('Handyman services in Boise, Meridian, Eagle, Nampa and the Treasure Valley: drywall repair, painting, minor plumbing and electrical, carpentry, mounting, and home maintenance, quoted upfront.');

export const metadata: Metadata = withBrandPageMetadata(({
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
}), "/services");

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
    <InteriorPage kind="services"><>
      <JsonLd data={[breadcrumbSchema, itemListSchema]} />

      <InteriorHero layout="editorial">
        <Breadcrumbs items={[{ name: 'Home', href: '/' }, { name: 'Services' }]} />
        <p className="ed-eyebrow mt-8" style={{ color: 'rgb(255 255 255 / 0.72)' }}>Our services</p>
        <h1 className="ed-display ed-statement-display text-inverse-foreground">
          Everything we fix, install and{' '}
            <em className="not-italic" style={{ color: 'var(--ed-accent)' }}>maintain</em>
        </h1>
        <p className="ed-lede mt-8 max-w-[44ch] text-inverse-foreground/85">
          Small repairs, installs and maintenance for Treasure Valley homes, quoted upfront as one
            written price. Most jobs run one to eight hours and are finished in a single visit.
        </p>
      </InteriorHero>

      {/* Approved photo-led service directory. */}
      <section className="interior-service-grid" aria-label="All services">{SERVICES.map(service=><Link className="interior-service-card" href={servicePath(service.slug)} key={service.slug}><img src={getServiceBackground(service.slug)} alt={service.name} width={900} height={675} loading="lazy"/><div><h2>{service.name}</h2><ArrowRight size={18} aria-hidden="true"/></div><p>{service.shortDescription}</p><p className="interior-price">Planning from {service.planningFrom}</p></Link>)}</section>

      <EstimatePromptBand
        title={
          <>
            Know your range before you{' '}
              <em className="not-italic" style={{ color: 'var(--ed-accent)' }}>book</em>
          </>
        }
        description="Use our Treasure Valley estimator to see a realistic range for your repair, install or maintenance job - then book a handyman visit when you're ready."
      />

      <Section surface="bone" spacing="xl" edge>
        <div className="ed-shell">
          <div className="ed-split ed-split-end">
            <Reveal>
              <p className="ed-eyebrow">Treasure Valley</p>
              <h2 className="ed-h2 ed-statement-wide">
                Serving communities across the{' '}
                <em className="not-italic" style={{ color: 'var(--ed-accent)' }}>valley</em>
              </h2>
            </Reveal>
            <Reveal delay={60}>
              <p className="ed-body">
                We serve every Ada and Canyon County community below with the same fair pricing.
                  Choose your city for local details and scheduling.
              </p>
            </Reveal>
          </div>
          <div className="mt-[clamp(40px,5vw,72px)] grid gap-4 sm:grid-cols-3">
            {CITIES.map((city, i) => (
              <Reveal key={city.slug} delay={Math.min(i, 7) * 40}>
                <AreaCard city={city} imageSrc={CITY_HERO_IMAGES[city.slug]} />
              </Reveal>
            ))}
          </div>
        </div>
      </Section>

      <Section surface="gradient" spacing="lg" edge>
        <div className="ed-shell">
          <div className="ed-split ed-split-center">
            <h2 className="ed-h2 ed-statement">
              Ready to get it{' '}
                <em className="not-italic" style={{ color: 'var(--ed-accent)' }}>fixed</em>?
            </h2>
            <div>
              <p className="ed-body">
                Get a preliminary estimate online, or book a handyman visit with an upfront quote.
              </p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:gap-4 [&>*]:w-full sm:[&>*]:w-auto">
                <ConsultCTA variant="brand">{CTA_PRIMARY}</ConsultCTA>
                <Button variant="brandOutline" asChild><a href="/#consult">{CTA_SECONDARY}</a></Button>
              </div>
            </div>
          </div>
        </div>
      </Section>
    </></InteriorPage>
  );
}
