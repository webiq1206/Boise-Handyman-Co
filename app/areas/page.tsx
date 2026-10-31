import { InteriorPage } from '@/components/approved/InteriorLayout';
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { AreaCard } from "@/components/marketing/AreaCard";
import { BlogEndCta } from "@/components/marketing/BlogEndCta";
import { Section } from "@/components/marketing/Section";
import { SectionHeader } from "@/components/marketing/SectionHeader";
import { ConsultCTA } from "@/components/modals/ConsultCTA";
import { Reveal } from "@/components/Reveal";
import { PageHeroBand } from "@/components/sections/PageHeroBand";
import { JsonLd } from "@/components/seo/JsonLd";
import { Button } from "@/components/ui/button";
import { withBrandPageMetadata } from '@/lib/brand-page-metadata';
import { landingFAQSchema } from "@/lib/landing-schema";
import { buildPageMetadata } from "@/lib/page-metadata";
import {
generateBreadcrumbSchema,
generateWebPageSchema,
} from "@/lib/schema";
import { AREA_PAGE_FAQS } from "@/shared/seoContent";
import { CITY_HERO_IMAGES } from "@/shared/cityServiceImages";
import { CITIES,TREASURE_VALLEY_CITIES } from "@/shared/contentData";
import { CTA_PRIMARY,CTA_SECONDARY } from "@/shared/ctaCopy";
import { SITE_IMAGES } from "@/shared/siteImages";
import { ArrowRight } from "lucide-react";

export const metadata = withBrandPageMetadata((buildPageMetadata({
  kind: "about",
  path: "/areas",
  titleOverride: "Treasure Valley Service Areas",
  descriptionOverride:
    "Handyman service across Boise, Meridian, Eagle, Nampa, Kuna, Star, Middleton, Garden City, and Caldwell, Idaho. Upfront quotes, same fair pricing.",
})), "/areas");

export default function AreasHubPage() {
  const schemas = [
    generateWebPageSchema({
      title: "Treasure Valley Service Areas",
      description: `Handyman repairs, installs, and maintenance serving ${TREASURE_VALLEY_CITIES}.`,
      url: "/areas",
    }),
    generateBreadcrumbSchema([
      { name: "Home", url: "/" },
      { name: "Service Areas", url: "/areas" },
    ]),
    landingFAQSchema(AREA_PAGE_FAQS),
  ];

  return (
    <InteriorPage kind="areas"><>
      <JsonLd data={schemas} />
      <div className="flex flex-col ">
        <PageHeroBand
          imageSrc={SITE_IMAGES.hero}
          imageAlt="A worker adjusting an interior door hinge with a screwdriver"
        >
          <Breadcrumbs items={[{ name: "Home", href: "/" }, { name: "Service Areas" }]} />
          <p className="ed-eyebrow mt-8" style={{ color: "rgb(255 255 255 / 0.72)" }}>Treasure Valley</p>
          <h1 className="ed-display ed-statement-display text-inverse-foreground">
            Treasure Valley service{" "}
            <em className="brc-accent">areas</em>
          </h1>
          <p className="ed-lede mt-8 max-w-[44ch] text-inverse-foreground/85">
            We handle small repairs, installs, and home maintenance across {TREASURE_VALLEY_CITIES},
            and the surrounding communities, with upfront quotes and the same fair pricing
            everywhere we work.
          </p>
          <p className="sr-only" data-speakable="summary">
            Treasure Valley handyman service areas across Ada and Canyon County.
          </p>
          <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap [&>*]:w-full sm:[&>*]:w-auto">
            <ConsultCTA variant="brand">
              {CTA_PRIMARY} <ArrowRight className="h-4 w-4" />
            </ConsultCTA>
            <Button variant="heroOutline" asChild>
              <a href="/#consult">{CTA_SECONDARY}</a>
            </Button>
          </div>
        </PageHeroBand>

        <Section surface="bone" spacing="xl">
          <div className="ed-shell">
            <SectionHeader
              eyebrow="Treasure Valley"
              title={<>Nine cities, one local handyman team</>}
              description="Repairs, installs, and maintenance across Ada and Canyon County, quoted upfront."
              align="left"
            />
            <div className="grid gap-5 sm:grid-cols-3">
              {CITIES.map((city, i) => (
                <Reveal key={city.slug} delay={i * 40}>
                  <AreaCard city={city} imageSrc={CITY_HERO_IMAGES[city.slug]} />
                </Reveal>
              ))}
            </div>
          </div>
        </Section>

        <Section surface="bone" spacing="xl">
          <div className="ed-shell max-w-3xl">
            <p className="ed-eyebrow">Common questions</p>
            <h2 className="ed-h2 ed-statement">Questions about Treasure Valley handyman service</h2>
            <dl className="mt-8 border-t" style={{ borderColor: "var(--ed-line)" }}>
              {AREA_PAGE_FAQS.map((faq) => (
                <div key={faq.question} className="border-b py-6" style={{ borderColor: "var(--ed-line)" }}>
                  <dt className="ed-h4">{faq.question}</dt>
                  <dd className="ed-body mt-3">{faq.answer}</dd>
                </div>
              ))}
            </dl>
          </div>
        </Section>

        {/* One closing ask: the "Got a fix waiting in your city?" band used to
            sit directly on top of this one, the same ask twice. */}
        <BlogEndCta />
      </div>
    </></InteriorPage>
  );
}
