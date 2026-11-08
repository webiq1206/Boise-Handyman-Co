import { InteriorHero, InteriorPage } from "@/components/approved/InteriorLayout";
import { ContractorCredential } from "@/components/ContractorCredential";
import { Section } from "@/components/marketing/Section";
import { SectionHeader } from "@/components/marketing/SectionHeader";
import { JsonLd } from "@/components/seo/JsonLd";
import { withBrandPageMetadata } from "@/lib/brand-page-metadata";
import { buildCanonical, fitDescription } from "@/lib/page-metadata";
import {
  generateBreadcrumbSchema,
  generateOrganizationSchema,
  generateWebPageSchema,
} from "@/lib/schema";
import { SITE_CONFIG } from "@/shared/siteConfig";
import { SITE_IMAGES } from "@/shared/siteImages";
import { Check } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { FamilyButton } from '@/components/family/Button';

const COVERED = [
  "Workmanship on repairs and installs performed by our own team",
  "A return visit within one year of documented Final Completion when our own team's work fails under normal use",
  "Manufacturer warranties passed through on parts we supply; their terms are separate from ours",
];

const CONDITIONS = [
  "Coverage applies to the original homeowner at the service address",
  "Normal use and care of the repaired or installed item",
  "Claims reported within one year of documented Final Completion: the agreed work is complete and recorded as finished at the walkthrough",
  "We return to make the workmanship right; parts follow their manufacturer terms",
];

const EXCLUDED = [
  "Normal wear, misuse, or pre-existing conditions",
  "Work performed by others after our visit",
  "Customer-supplied parts that fail for reasons unrelated to our install",
];

/** D1 (Nov 2026): subcontractor work carries the subcontractor's own warranty. */
const SUBCONTRACTOR_TERMS = [
  "Work performed by subcontractors, for example licensed plumbing, electrical or HVAC work, is covered by that subcontractor's own warranty",
  "At the end of every project we provide a complete list of the subcontractors who worked on it, with their contact information",
  "Manufacturer and product warranties are separate and follow their own terms",
];

/** What to include when asking for help with a completed project (R13). */
const HELP_DETAILS = [
  "Your name",
  "The project address",
  "The affected item and where it is in the home",
  "When it started",
  "A short description of what you are seeing",
  "Photos, if you have them",
];

const HELP_SUBJECT = "Help with a completed project";
const HELP_BODY = [
  "Name:",
  "Project address:",
  "Affected item and location:",
  "When it started:",
  "Description:",
  "Photos attached (if available):",
].join("\n");
const HELP_MAILTO = `mailto:${SITE_CONFIG.email}?subject=${encodeURIComponent(HELP_SUBJECT)}&body=${encodeURIComponent(HELP_BODY)}`;

const TITLE = "1-Year Workmanship Warranty";
const DESCRIPTION = fitDescription(
  "One year of workmanship coverage on work by our own team. Subcontractor work carries the subcontractor's own warranty. Manufacturer terms are separate.",
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
            One-year <span className="mobile-keep">workmanship <em className="brc-accent">warranty</em></span>
          </h1>
          <p className="text-base md:text-lg text-inverse-foreground/85 max-w-2xl leading-relaxed mb-8">
            If work our own team performed fails because of our workmanship within one year of documented
            Final Completion, we come back and make it right. Subcontractor work carries the
            subcontractor&apos;s own warranty.
          </p>
          <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap [&>*]:w-full sm:[&>*]:w-auto mb-6">
            <FamilyButton href="#get-help" variant="hero" data-hero-cta="primary">Get help with a completed project</FamilyButton>
            <FamilyButton href={SITE_CONFIG.phoneHref} variant="secondary">Call {SITE_CONFIG.phone}</FamilyButton>
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
          <div className="container px-4 max-w-5xl mt-12">
            <SectionHeader eyebrow="Subcontractors" title={<>Work by subcontractors</>} className="mb-4" />
            <ul className="space-y-2">
              {SUBCONTRACTOR_TERMS.map((item) => (
                <li key={item} className="flex items-start gap-2 text-sm text-muted-foreground">
                  <Check className="h-4 w-4 mt-0.5 flex-shrink-0 text-accent" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
          <div id="get-help" className="container px-4 max-w-5xl mt-12 scroll-mt-28">
            <SectionHeader eyebrow="Existing customers" title={<>Get help with a completed project</>} className="mb-4" />
            <p className="text-sm text-muted-foreground leading-relaxed max-w-2xl">
              Email{" "}
              <a href={HELP_MAILTO} className="underline underline-offset-2" data-testid="link-warranty-help-email">
                {SITE_CONFIG.email}
              </a>{" "}
              or call{" "}
              <a href={SITE_CONFIG.phoneHref} className="underline underline-offset-2" data-testid="link-warranty-help-phone">
                {SITE_CONFIG.phone}
              </a>
              . We answer your questions, review what you send, and agree the next step with you. For
              subcontractor work, we can point you to the right subcontractor from the list. Please include:
            </p>
            <ul className="mt-4 space-y-2">
              {HELP_DETAILS.map((item) => (
                <li key={item} className="flex items-start gap-2 text-sm text-muted-foreground">
                  <Check className="h-4 w-4 mt-0.5 flex-shrink-0 text-accent" />
                  {item}
                </li>
              ))}
            </ul>
            <p className="mt-4 text-sm text-muted-foreground leading-relaxed max-w-2xl">
              Your signed agreement sets the notice method for a formal warranty claim, so follow the
              method it names as well. If there is immediate danger, such as a gas smell, water you cannot
              stop, or sparking or burning electrical, contact emergency services or your utility first. We
              are not an emergency service.
            </p>
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
