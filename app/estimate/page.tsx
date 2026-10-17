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



const TITLE = "Request a Handyman Estimate";
const DESCRIPTION =
  fitDescription("Need repairs in Boise or the Treasure Valley? Send your task list, photos or plans. Our team will review the details before preparing your estimate.");

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
      title: "Request a Handyman Estimate",
      description: DESCRIPTION,
      url: "/estimate",
    }),
    generateBreadcrumbSchema([
      { name: "Home", url: "/" },
      { name: "Online Estimate", url: "/estimate" },
    ]),
  ];

  return (
    <>
      <JsonLd data={schemas} />

      {/* Static page-shell heading. The estimator is a client component, so its
          own heading is not in the server HTML. headingAs stays h2 so the tool
          does not emit a second h1. Estimator logic is unchanged. */}
      <h1 className="sr-only">Boise Handyman Co instant estimate</h1>
      <EstimateCalculator fitViewport headingAs="h2" />
      <p className="px-4 py-3 text-center text-xs text-muted-foreground">
        <ContractorCredential showVerifyLink={false} />
      </p>
    </>
  );
}
