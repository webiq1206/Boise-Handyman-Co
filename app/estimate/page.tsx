import type { Metadata } from "next";
import dynamic from "next/dynamic";
import Link from "next/link";
import { ArrowRight, Check } from "lucide-react";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { Section } from "@/components/marketing/Section";
import { MarketingCard } from "@/components/marketing/MarketingCard";
import { PageHeroBand } from "@/components/sections/PageHeroBand";
import { JsonLd } from "@/components/seo/JsonLd";
import { buildCanonical } from "@/lib/page-metadata";
import {
  generateBreadcrumbSchema,
  generateFAQSchema,
  generateWebPageSchema,
} from "@/lib/schema";
import { CONSTRUCTION_IMAGES } from "@/shared/siteImages";
import { SITE_CONFIG } from "@/shared/siteConfig";
import { Button } from "@/components/ui/button";
import { HANDYMAN_RATE_DISCLAIMER } from "@/shared/estimateEngine";

const EstimateCalculator = dynamic(
  () =>
    import("@/components/EstimateCalculator").then((mod) => mod.EstimateCalculator),
  {
    loading: () => (
      <div className="container px-4 py-16 text-center text-sm text-muted-foreground">
        Loading the estimator...
      </div>
    ),
  },
);

// 25 chars; the branded title lands at 45 with the 20-char suffix.
const TITLE = "Instant Handyman Estimate";
const DESCRIPTION =
  "See a real price range for your repair in about a minute. Pick your tasks and get an instant estimate for Boise and the Treasure Valley, then book your visit.";

/*
 * The rates below render the pricing model on-page. They come straight from
 * shared/estimateEngine.ts, which is flagged [NEEDS: real pricing confirmation]
 * at every constant; the visible disclaimer keeps the page honest meanwhile.
 */
const FAQS = [
  {
    question: "How does handyman pricing work here?",
    answer: `Every job is priced the same way: time on the job with a one-hour minimum. Priority scheduling adds 15% and same-week emergency adds 30%. Materials are billed at cost with the receipt. ${HANDYMAN_RATE_DISCLAIMER}`,
  },
  {
    question: "Is the online number a quote?",
    answer:
      "No, it is a starting range based on typical hours for the tasks you pick. Every job gets a firm written quote before any work begins, and the final price never changes without your OK first.",
  },
  {
    question: "What if my job is not on the list?",
    answer:
      "Choose \"Something else\" and describe it in a sentence or two, then guess whether it is a small, medium, or large job. We confirm the real scope by phone or at the door before work starts.",
  },
  {
    question: "Do you charge for the estimate itself?",
    answer:
      "No. The online estimate is free and takes about a minute, and the written quote that follows is free too. You only ever pay for work you have approved.",
  },
  {
    question: "What areas do you cover?",
    answer:
      "Boise, Meridian, Eagle, Nampa, Kuna, Star, Middleton, and Caldwell. If you are elsewhere in the Treasure Valley, send the estimate through anyway and we will tell you straight away whether we can get to you.",
  },
];

export const metadata: Metadata = {
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
};

export default function EstimatePage() {
  const schemas = [
    generateWebPageSchema({
      title: "Instant Handyman Estimate",
      description: DESCRIPTION,
      url: "/estimate",
    }),
    generateBreadcrumbSchema([
      { name: "Home", url: "/" },
      { name: "Instant Estimate", url: "/estimate" },
    ]),
    generateFAQSchema(FAQS),
  ];

  return (
    <>
      <JsonLd data={schemas} />

      <PageHeroBand
        imageSrc={CONSTRUCTION_IMAGES.plans}
        imageAlt="Written handyman estimate on a clipboard with a calculator and tape measure"
        scrim={0.85}
      >
        <Breadcrumbs items={[{ name: "Home", href: "/" }, { name: "Instant Estimate" }]} />
        <p className="ed-eyebrow mt-8" style={{ color: "rgb(255 255 255 / 0.72)" }}>Free, no obligation</p>
        <h1 className="ed-display ed-statement-display text-inverse-foreground">
          Instant handyman <em className="brc-accent">estimate</em>
        </h1>
        {/* Direct answer block: what this is, where, and how pricing works. */}
        <p className="ed-lede mt-8 max-w-[44ch] text-inverse-foreground/85">
          Boise Handyman Co prices small repairs across Boise and the Treasure
          Valley the same way every time. Pick your tasks below and see your
          range in about a minute.
        </p>
        <p className="mt-3 text-sm text-inverse-muted max-w-2xl">
          {HANDYMAN_RATE_DISCLAIMER}
        </p>
      </PageHeroBand>

      <EstimateCalculator />

      <Section variant="greige" divider>
        <div className="container px-4 max-w-5xl mx-auto grid md:grid-cols-2 gap-10 items-start">
          <div>
            <div className="brc-label mb-4">What happens next</div>
            <h2 className="font-serif text-2xl md:text-3xl tracking-tight text-foreground mb-4">
              Your range is a starting point, your quote is in writing
            </h2>
            <p className="text-sm md:text-base text-muted-foreground leading-relaxed mb-6">
              The estimator prices the tasks you pick at our standard rates. A
              real person reviews every request, confirms the scope with you,
              and sends a firm written quote before anything goes on the
              calendar. Most small jobs are done in a single trip.
            </p>
            <Button variant="brandOutline" asChild>
              <Link href="/contact#consult">
                Ask a question first <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
          <MarketingCard padding="lg">
            <p className="text-sm font-normal text-foreground mb-4">Every visit includes</p>
            <ul className="space-y-3">
              {[
                "A firm written quote before any work begins",
                "One visit, no matter how many small tasks we knock out",
                "Materials billed at cost, receipt included",
                "A tidy work area and a walkthrough when we finish",
              ].map((bullet) => (
                <li key={bullet} className="flex items-start gap-3 text-sm text-muted-foreground">
                  <Check className="h-4 w-4 text-accent-legible flex-shrink-0 mt-0.5" />
                  {bullet}
                </li>
              ))}
            </ul>
          </MarketingCard>
        </div>
      </Section>

      <Section variant="canvas" divider>
        <div className="container px-4 max-w-3xl mx-auto">
          <div className="brc-label mb-4">Estimate questions</div>
          <h2 className="font-serif text-2xl md:text-3xl tracking-tight text-foreground mb-8">
            How the estimate works
          </h2>
          <div className="space-y-8">
            {FAQS.map((faq) => (
              <div key={faq.question}>
                <h3 className="text-base font-normal text-foreground mb-2">{faq.question}</h3>
                <p className="text-sm md:text-base text-muted-foreground leading-relaxed">
                  {faq.answer}
                </p>
              </div>
            ))}
          </div>
        </div>
      </Section>
    </>
  );
}
