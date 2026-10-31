import {withBrandPageMetadata} from '@/lib/brand-page-metadata';
import type { Metadata } from "next";
import { ContractorCredential } from "@/components/ContractorCredential";
import { EstimateCalculator } from "@/components/EstimateCalculator";
import { JsonLd } from "@/components/seo/JsonLd";
import { buildCanonical } from "@/lib/page-metadata";
import {
  generateBreadcrumbSchema,
  generateWebPageSchema,
} from "@/lib/schema";
import { SITE_CONFIG } from "@/shared/siteConfig";
import { fitDescription } from '@/lib/page-metadata';

const TITLE = "Send your list and photos";
const DESCRIPTION =
  fitDescription("Send your Treasure Valley repair list and photos. Boise Handyman Co confirms the scope and replies with a written quote before work starts.");

export const metadata: Metadata = withBrandPageMetadata(({
  title: { absolute: `${TITLE} | ${SITE_CONFIG.name}` },
  description: DESCRIPTION,
  alternates: { canonical: buildCanonical("/estimate") },
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    url: buildCanonical("/estimate"),
    type: "website",
    images: [{ url: "/images/og-default.png", width: 1200, height: 630, alt: SITE_CONFIG.name }],
  },
  twitter: {
    card: "summary_large_image",
    title: TITLE,
    description: DESCRIPTION,
    images: ["/images/og-default.png"],
  },
}), "/estimate");

export default function EstimatePage() {
  const schemas = [
    generateWebPageSchema({
      title: TITLE,
      description: DESCRIPTION,
      url: "/estimate",
    }),
    generateBreadcrumbSchema([
      { name: "Home", url: "/" },
      { name: "Send your list and photos", url: "/estimate" },
    ]),
  ];

  return (
    <>
      <JsonLd data={schemas} />
      <h1 className="sr-only">Send your Boise Handyman Co repair list and photos</h1>
      <EstimateCalculator fitViewport headingAs="h2" />
      <p className="px-4 py-3 text-center text-xs text-muted-foreground">
        Intake only: no on-screen price. You get a written quote before work starts.{" "}
        <ContractorCredential showVerifyLink={false} />
      </p>
    </>
  );
}
