import { localAlt } from '@/shared/localAlt';
import { InteriorPage } from '@/components/approved/InteriorLayout';
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { AreaCard } from "@/components/marketing/AreaCard";
import { BlogEndCta } from "@/components/marketing/BlogEndCta";
import { Section } from "@/components/marketing/Section";
import { SectionHeader } from "@/components/marketing/SectionHeader";
import { InstantEstimateCTA } from "@/components/estimator/InstantEstimateCTA";
import { Reveal } from "@/components/Reveal";
import { PageHeroBand } from "@/components/sections/PageHeroBand";
import { JsonLd } from "@/components/seo/JsonLd";
import { withBrandPageMetadata } from '@/lib/brand-page-metadata';
import { landingFAQSchema } from "@/lib/landing-schema";
import { buildPageMetadata } from "@/lib/page-metadata";
import {
generateBreadcrumbSchema,
generateWebPageSchema,
} from "@/lib/schema";
import { AREA_PAGE_FAQS } from "@/shared/seoContent";
import { CITY_HERO_IMAGES } from "@/shared/cityServiceImages";
import { SERVICE_AREA_CITIES, SERVICE_AREA_LINE } from "@/shared/contentData";
import { CTA_SECONDARY } from "@/shared/ctaCopy";
import { FamilyButton } from '@/components/family/Button';

// The door-hinge technician is the homepage hero. The areas index leads with a
// house exterior instead, one that none of its seven city cards uses.
const AREAS_HERO_IMAGE = "/images/handyman/hero-gutter-cleaning.webp";

export const metadata = withBrandPageMetadata((buildPageMetadata({
  kind: "about",
  path: "/areas",
  titleOverride: "Treasure Valley Service Areas",
  descriptionOverride:
    `Handyman service in ${SERVICE_AREA_LINE}. Written quote before work starts.`,
})), "/areas");

export default function AreasHubPage() {
  const schemas = [
    generateWebPageSchema({
      title: "Treasure Valley Service Areas",
      description: `Handyman repairs, installs, and maintenance serving ${SERVICE_AREA_LINE}.`,
      url: "/areas",
    }),
    generateBreadcrumbSchema([
      { name: "Home", url: "/" },
      { name: "Service areas", url: "/areas" },
    ]),
    landingFAQSchema(AREA_PAGE_FAQS),
  ];

  return (
    <InteriorPage kind="areas"><>
      <JsonLd data={schemas} />
      <div className="flex flex-col ">
        <PageHeroBand
          imageSrc={AREAS_HERO_IMAGE}
          imageAlt={localAlt('An extension ladder set against the gutter of a two-story house, with a bucket on the lawn below')}
        >
          <Breadcrumbs items={[{ name: "Home", href: "/" }, { name: "Service areas" }]} />
          <p className="ed-eyebrow mt-8" style={{ color: "rgb(255 255 255 / 0.72)" }}>Treasure Valley</p>
          <h1 className="ed-display ed-statement-display text-inverse-foreground">
            Treasure Valley{" "}
            <span className="mobile-keep">service <em className="brc-accent">areas</em></span>
          </h1>
          <p className="ed-lede mt-8 max-w-[44ch] text-inverse-foreground/85">
            We handle small repairs, installs, and home maintenance in {SERVICE_AREA_LINE},
            with a written quote before work starts.
          </p>
          <p className="sr-only" data-speakable="summary">
            Treasure Valley handyman service areas across Ada and Canyon County.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap [&>*]:w-full sm:[&>*]:w-auto">
            {/* Owner decision, 13 November 2026: the estimator is the primary; the request form stays beside it. */}
            <InstantEstimateCTA data-hero-cta="primary" trackingLocation="areas_hero" />
            <FamilyButton href="/#consult" variant="secondary">{CTA_SECONDARY}</FamilyButton>
          </div>
        </PageHeroBand>

        <Section surface="bone" spacing="xl">
          <div className="ed-shell">
            <SectionHeader
              eyebrow="Treasure Valley"
              title={<>Seven cities, one local handyman team</>}
              description="Repairs, installs, and maintenance in Ada County and Canyon County, with a written quote before work starts."
              align="left"
            />
            <div className="lx-seven grid gap-5 sm:grid-cols-3">
              {SERVICE_AREA_CITIES.map((city, i) => (
                <Reveal key={city.slug} delay={i * 40}>
                  <AreaCard city={city} imageSrc={CITY_HERO_IMAGES[city.slug]} />
                </Reveal>
              ))}
            </div>
          </div>
        </Section>

        <Section surface="bone" spacing="xl">
          <div className="ed-shell">
            {/* Heading beside the questions so the section fills the container;
                native disclosure keeps every answer in the HTML. */}
            <div className="ed-split ed-split-narrow">
              <div className="lg:sticky lg:top-28 lg:self-start">
                <p className="ed-eyebrow">Common questions</p>
                <h2 className="ed-h2 ed-statement">Questions about Treasure Valley handyman service</h2>
              </div>
              <div className="lx-faq w-full border-t" style={{ borderColor: "var(--ed-line)" }}>
                {AREA_PAGE_FAQS.map((faq) => (
                  <details key={faq.question} name="areas-faq" open={faq === AREA_PAGE_FAQS[0]} className="border-b" style={{ borderColor: "var(--ed-line)" }}>
                    <summary><h3 className="ed-h4 text-left">{faq.question}</h3></summary>
                    <p className="ed-body text-[0.9375rem]">{faq.answer}</p>
                  </details>
                ))}
              </div>
            </div>
          </div>
        </Section>

        {/* One closing ask: the "Got a fix waiting in your city?" band used to
            sit directly on top of this one, the same ask twice. */}
        <BlogEndCta />
      </div>
    </></InteriorPage>
  );
}
