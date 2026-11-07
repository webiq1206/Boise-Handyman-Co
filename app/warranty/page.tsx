import { InteriorHero, InteriorPage } from "@/components/approved/InteriorLayout";
import { ContractorCredential } from "@/components/ContractorCredential";
import { Section } from "@/components/marketing/Section";
import { ConsultCTA } from "@/components/modals/ConsultCTA";
import { JsonLd } from "@/components/seo/JsonLd";
import { withBrandPageMetadata } from "@/lib/brand-page-metadata";
import { buildCanonical, fitDescription } from "@/lib/page-metadata";
import {
  generateBreadcrumbSchema,
  generateOrganizationSchema,
  generateWebPageSchema,
} from "@/lib/schema";
import { CTA_PRIMARY } from "@/shared/ctaCopy";
import { SITE_CONFIG } from "@/shared/siteConfig";
import { SITE_IMAGES } from "@/shared/siteImages";
import type { Metadata } from "next";
import Link from "next/link";
import { FamilyButton } from '@/components/family/Button';

const WARRANTY_COPY =
  "Our work carries a written workmanship warranty, and parts we supply keep their manufacturer warranty. Call or text us with warranty questions.";

const TITLE = "Written Workmanship Warranty";
const DESCRIPTION = fitDescription(
  "Our repairs and installs come with a written workmanship warranty, and parts we supply keep their manufacturer warranty. Call or text us with questions.",
);

export const metadata: Metadata = withBrandPageMetadata(
  {
    title: { absolute: `${TITLE} | ${SITE_CONFIG.name}` },
    description: DESCRIPTION,
    alternates: { canonical: buildCanonical("/warranty") },
    openGraph: {
      title: TITLE,
      description: DESCRIPTION,
      url: buildCanonical("/warranty"),
      type: "website",
      images: [{ url: "/images/og-default.png", width: 1200, height: 630, alt: SITE_CONFIG.name }],
    },
  },
  "/warranty",
);

export default function WarrantyPage() {
  const schemas = [
    generateOrganizationSchema(),
    generateWebPageSchema({
      title: TITLE,
      description: DESCRIPTION,
      url: "/warranty",
    }),
    generateBreadcrumbSchema([
      { name: "Home", url: "/" },
      { name: "Warranty", url: "/warranty" },
    ]),
  ];

  return (
    <InteriorPage kind="warranty">
      <>
        <JsonLd data={schemas} />
        <InteriorHero
          layout="editorial"
          imageSrc={SITE_IMAGES.process}
          imageAlt="Handyman reviewing finished repair work with a homeowner"
        >
          <p className="ed-eyebrow" style={{ color: "rgb(255 255 255 / 0.72)" }}>
            Our promise
          </p>
          <h1 className="ed-display ed-statement-display text-inverse-foreground mb-6">
            Written <span className="mobile-keep">workmanship <em className="brc-accent">warranty</em></span>
          </h1>
          <p className="text-base md:text-lg text-inverse-foreground/85 max-w-2xl leading-relaxed mb-8">
            {WARRANTY_COPY}
          </p>
          <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap [&>*]:w-full sm:[&>*]:w-auto mb-6">
            <ConsultCTA variant="brand" data-hero-cta="primary">{CTA_PRIMARY}</ConsultCTA>
            <FamilyButton href="/about" variant="secondary">About our team</FamilyButton>
          </div>
          <p className="text-sm text-inverse-foreground/70">
            <ContractorCredential />. Insured; certificate on request.
          </p>
        </InteriorHero>

        <Section variant="greige" divider>
          <div className="container px-4 max-w-3xl">
            <p className="text-base leading-relaxed text-muted-foreground">{WARRANTY_COPY}</p>
          </div>
          <p className="container px-4 max-w-5xl mt-10 text-sm text-muted-foreground">
            {SITE_CONFIG.name} is a DBA of P5 Home Co LLC. Full company story on the{" "}
            <Link href="/about" className="underline underline-offset-2">
              About page
            </Link>
            .
          </p>
        </Section>
      </>
    </InteriorPage>
  );
}
