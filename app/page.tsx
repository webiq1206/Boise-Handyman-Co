import type { Metadata } from "next";
import Image from "next/image";
import dynamic from "next/dynamic";
import { FAQSection } from "@/components/FAQSection";
import { ConsultationForm } from "@/components/ConsultationForm";
import { Reveal } from "@/components/Reveal";
import { HeroSection } from "@/components/sections/HeroSection";
import { ValueOverheadSection } from "@/components/sections/ValueOverheadSection";
import { WhyChooseUsSection } from "@/components/sections/WhyChooseUsSection";
import { ServicesGrid } from "@/components/sections/ServicesGrid";
import { ProcessSection } from "@/components/sections/ProcessSection";
import { BudgetInclusionsSection } from "@/components/sections/BudgetInclusionsSection";
import { ProjectGallerySection } from "@/components/sections/ProjectGallerySection";
import { BrandStatementBand } from "@/components/sections/BrandStatementBand";
import { EstimatePromptBand } from "@/components/marketing/EstimatePromptBand";
import { Section } from "@/components/marketing/Section";
import { MarketingCard } from "@/components/marketing/MarketingCard";
import { Check } from "lucide-react";
import { CONSULT_BULLETS, SITE_TAGLINE } from "@/shared/siteContent";
import { CTA_PRIMARY } from "@/shared/ctaCopy";
import { HomePageSchema } from "@/components/seo/HomePageSchema";
import { buildCanonical } from "@/lib/page-metadata";
import { SITE_IMAGES } from "@/shared/siteImages";
import { SITE_CONFIG } from "@/shared/siteConfig";

const EstimateCalculator = dynamic(
  () =>
    import("@/components/EstimateCalculator").then((mod) => mod.EstimateCalculator),
  {
    loading: () => (
      <div
        id="calculator"
        className="container scroll-mt-20 px-4 py-16 text-center text-sm text-muted-foreground"
      >
        Loading estimate calculator...
      </div>
    ),
  },
);

export const metadata: Metadata = {
  // 49 chars. Leads with the primary term ("handyman in Boise") rather than
  // the brand, which the suffix carries anyway.
  title: { absolute: `Handyman in Boise, ID | ${SITE_CONFIG.name}` },
  description:
    "Handyman service for Boise, Meridian, Eagle, Nampa & the Treasure Valley. Small repairs, installs & maintenance with one upfront written quote before work starts. Book a visit today.",
  alternates: {
    canonical: buildCanonical("/"),
    // Setting `alternates` replaces the root declaration, so the feed link has
    // to be repeated here or the homepage loses feed discovery entirely.
    types: {
      "application/rss+xml": [
        { url: "/feed.xml", title: `${SITE_CONFIG.name} | Home Repair Guides and Insights` },
      ],
    },
  },
  openGraph: {
    title: `${SITE_CONFIG.name} | Treasure Valley Handyman`,
    description:
      `${SITE_TAGLINE}. Small repairs, installs, and home maintenance across the Treasure Valley.`,
    type: "website",
    url: buildCanonical("/"),
    siteName: SITE_CONFIG.name,
    images: [{ url: "/images/og-default.png", width: 1200, height: 630, alt: SITE_CONFIG.name }],
  },
};

export default function HomePage() {
  return (
    <div className="flex flex-col pb-20 md:pb-0 bg-background">
      {/* PAGE ORDER IS THE SALES CONVERSATION, IN THE ORDER A HOMEOWNER HAS IT.

          1. Hero            who we are, where, how pricing works (answer block)
          2. Where the money goes   frames price before we quote one
          3. Estimator       the number - the question every visitor arrives with
          4. What's included what a quote actually covers
          5. Services        what we fix, install, and maintain
          6. Our work        proof (renders nothing until real job photos exist)
          7. Why us          why this company rather than another
          8. Process         what happens after they say yes
          9. Brand band      the emotional close
          10. FAQ            the last objections
          11. Booking        the ask

          The estimator sits third on purpose. It is the site's primary lead
          generator and the hero's own call to action points at it, so burying
          it below services and process meant the highest-intent visitors
          scrolled past five sections to reach the thing they came for.
          Everything above it now exists only to make the number land well;
          everything below it answers what the number raised. */}
      <HomePageSchema />
      <HeroSection />
      <ValueOverheadSection />
      <EstimateCalculator />
      <BudgetInclusionsSection />
      <ServicesGrid />
      {/* Renders nothing while GALLERY_PROJECTS is empty; returns automatically
          once real, photographed handyman jobs are added. No fabricated proof
          ships in the meantime - the services grid above and the process
          section below carry the page instead. */}
      <ProjectGallerySection limit={6} showViewAll={true} />

      <EstimatePromptBand
        eyebrow="Still comparing handymen"
        title={
          <>
            Find out what your fix will{' '}
            <em className="brc-accent">cost</em>
          </>
        }
        description="Missed the estimator higher up the page? It stays open whenever you are ready - or send your task list with photos and we will reply with a firm upfront quote within one business day."
        variant="tint"
        bullets={[
          "A ballpark range built from current Treasure Valley job costs",
          "A firm upfront quote when you send photos",
          "No strings - a copy of whatever the estimator returns lands in your inbox",
        ]}
      />

      <WhyChooseUsSection limit={5} />
      <ProcessSection />
      <BrandStatementBand />
      <FAQSection />
      <Section id="consult" divider className="relative overflow-hidden scroll-mt-16 pb-28 md:pb-28">
        {/* Warm, dimmed lifestyle photo grounds the closing section. Directional
            scrims keep the left-column copy legible and fade the edges into the
            page ground; the form card floats above on its own shadow. */}
        <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
          <Image
            src={SITE_IMAGES.consultBg}
            alt=""
            fill
            loading="lazy"
            sizes="100vw"
            className="object-cover opacity-[0.42] img-brand-grade"
          />
          {/* Directional scrims: solid behind the left-column copy, opening up
              toward the right where the form card carries its own surface. */}
          <div className="absolute inset-0 bg-gradient-to-r from-background via-background/75 to-background/40" />
          <div className="absolute inset-0 bg-gradient-to-b from-background/90 via-transparent to-background" />
        </div>
        {/* The ask. Full measure, heading at h2 scale, the form kept in its
            card because a form needs a defined field to sit in - this is one of
            the places a card is actually the right answer. */}
        <div className="ed-shell relative z-10">
          <div className="grid gap-[var(--ed-gutter)] lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
            <div className="lg:sticky lg:top-28">
              <Reveal>
                <p className="ed-eyebrow">Begin a conversation</p>
                <h2 className="ed-h2 ed-statement">
                  Tell us what needs{" "}
                  <em className="not-italic" style={{ color: "var(--ed-accent)" }}>
                    fixing
                  </em>
                  .
                </h2>
                <p className="ed-lede mt-8 max-w-[40ch]">
                  Send a few details - photos help - and we will reply within one
                  business day with an upfront quote and a time that works.
                </p>
                <p className="ed-body mt-4">
                  No pressure, and no expectation to go any further.
                </p>
                <ul
                  className="mt-8 grid list-none gap-3 border-t p-0 pt-6"
                  style={{ borderColor: "var(--ed-line)" }}
                >
                  {CONSULT_BULLETS.map((item) => (
                    <li key={item} className="ed-body flex items-center gap-3 text-[0.875rem]">
                      <Check
                        className="h-4 w-4 flex-shrink-0"
                        style={{ color: "var(--ed-accent)" }}
                        aria-hidden="true"
                      />
                      {item}
                    </li>
                  ))}
                </ul>
              </Reveal>
            </div>
            <MarketingCard className="shadow-2xl" padding="lg">
              <ConsultationForm />
            </MarketingCard>
          </div>
        </div>
      </Section>
    </div>
  );
}
