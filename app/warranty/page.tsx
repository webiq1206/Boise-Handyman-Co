import { InteriorHero, InteriorPage } from "@/components/approved/InteriorLayout";
import { ContractorCredential } from "@/components/ContractorCredential";
import { Section } from "@/components/marketing/Section";
import { SectionHeader } from "@/components/marketing/SectionHeader";
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
import { Check } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { FamilyButton } from '@/components/family/Button';

const COVERED = [
  "Workmanship on repairs and installs we completed",
  "Callback within one year when our work fails under normal use",
  "Manufacturer warranties passed through on parts we supply",
];

const CONDITIONS = [
  "Coverage applies to the original homeowner at the service address",
  "Normal use and care of the repaired or installed item",
  "Claims filed within one year of the completed visit",
  "We return to make the workmanship right; parts follow their manufacturer terms",
];

const EXCLUDED = [
  "Normal wear, misuse, or pre-existing conditions",
  "Work performed by others after our visit",
  "Customer-supplied parts that fail for reasons unrelated to our install",
  "Trade-partner warranties for plumbing, electrical and HVAC follow those licensed trades; we schedule and stand behind the visit",
];

const TITLE = "1-Year Workmanship Warranty";
const DESCRIPTION = fitDescription(
  "Boise Handyman Co includes a one-year workmanship warranty on repairs and installs. Materials carry manufacturer warranties. Serving the Treasure Valley.",
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
            One-year workmanship <em className="brc-accent">warranty</em>
          </h1>
          <p className="text-base md:text-lg text-inverse-foreground/85 max-w-2xl leading-relaxed mb-8">
            If something we repaired or installed fails because of our workmanship within one year,
            we come back and make it right. Materials we supply carry their manufacturer warranties.
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
          <div className="container px-4 max-w-5xl grid gap-8 md:grid-cols-3">
            <div>
              <SectionHeader eyebrow="Coverage" title={<>What is covered</>} className="mb-4" />
              <ul className="space-y-2">
                {COVERED.map((item) => (
                  <li key={item} className="flex items-start gap-2 text-sm text-muted-foreground">
                    <Check className="h-4 w-4 mt-0.5 flex-shrink-0 text-accent" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <SectionHeader eyebrow="Conditions" title={<>How it works</>} className="mb-4" />
              <ul className="space-y-2">
                {CONDITIONS.map((item) => (
                  <li key={item} className="text-sm text-muted-foreground leading-relaxed">
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <SectionHeader eyebrow="Limits" title={<>What is not covered</>} className="mb-4" />
              <ul className="space-y-2">
                {EXCLUDED.map((item) => (
                  <li key={item} className="text-sm text-muted-foreground leading-relaxed">
                    {item}
                  </li>
                ))}
              </ul>
            </div>
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
