import { ArrowRight } from "lucide-react";
import { JsonLd } from "@/components/seo/JsonLd";
import { Section } from "@/components/marketing/Section";
import { SectionHeader } from "@/components/marketing/SectionHeader";
import { AreaCard } from "@/components/marketing/AreaCard";
import { BlogEndCta } from "@/components/marketing/BlogEndCta";
import { EstimatePromptBand } from "@/components/marketing/EstimatePromptBand";
import { PageHeroBand } from "@/components/sections/PageHeroBand";
import { CITY_HERO_IMAGES } from "@/shared/cityServiceImages";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { Reveal } from "@/components/Reveal";
import { buildPageMetadata } from "@/lib/page-metadata";
import {
  generateBreadcrumbSchema,
  generateWebPageSchema,
} from "@/lib/schema";
import { CITIES, TREASURE_VALLEY_CITIES } from "@/shared/contentData";
import { CTA_PRIMARY, CTA_SECONDARY } from "@/shared/ctaCopy";
import { Button } from "@/components/ui/button";
import { ConsultCTA } from "@/components/modals/ConsultCTA";
import { SITE_IMAGES } from "@/shared/siteImages";

export const metadata = buildPageMetadata({
  kind: "about",
  path: "/areas",
  titleOverride: "Treasure Valley Service Areas",
  descriptionOverride:
    "Handyman service across the Treasure Valley: Boise, Meridian, Eagle, Nampa, Kuna, Star, Middleton, Garden City, and Caldwell, Idaho. Upfront quotes and the same fair pricing everywhere.",
});

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
  ];

  return (
    <>
      <JsonLd data={schemas} />
      <div className="flex flex-col pb-20 md:pb-0">
        <PageHeroBand
          imageSrc={SITE_IMAGES.hero}
          imageAlt="Well-kept Treasure Valley home interior"
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
              title={<>Eight cities, one local handyman team</>}
              description="Repairs, installs, and maintenance across Ada and Canyon County, quoted upfront."
              align="left"
            />
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {CITIES.map((city, i) => (
                <Reveal key={city.slug} delay={i * 40}>
                  <AreaCard city={city} imageSrc={CITY_HERO_IMAGES[city.slug]} />
                </Reveal>
              ))}
            </div>
          </div>
        </Section>

        <EstimatePromptBand
          title={
            <>
              Got a fix waiting in your{' '}
              <em className="brc-accent">city</em>?
            </>
          }
          description="The same upfront quotes and fair pricing apply across Ada and Canyon County. Get an instant estimate for your job, then book a handyman visit when you're ready."
          variant="tint"
        />

        <BlogEndCta />
      </div>
    </>
  );
}
