import { ApprovedHome } from "@/components/approved/ApprovedHome";
import { ApprovedFamilyFrame, ApprovedHomeHero } from "@/components/approved/ApprovedHomeHero";
import { HandymanServicesAnswer } from "@/components/seo/HandymanServicesAnswer";
import { ConsultationForm } from "@/components/ConsultationForm";
import { MarketingCard } from "@/components/marketing/MarketingCard";
import { Section } from "@/components/marketing/Section";
import Image from "@/components/MarketingImage";
import { Reveal } from "@/components/Reveal";
import { BudgetInclusionsSection } from "@/components/sections/BudgetInclusionsSection";
import { HandymanPhotoBand } from "@/components/sections/HandymanPhotoBand";
import { HandymanPlanningRange } from "@/components/sections/HandymanPlanningRange";
import { HowP5Works } from "@/components/sections/HowP5Works";
import { WhoYouAreHiring } from "@/components/sections/WhoYouAreHiring";
import { ProjectGallerySection } from "@/components/sections/ProjectGallerySection";
import { HomePageSchema } from "@/components/seo/HomePageSchema";
import { withBrandPageMetadata } from '@/lib/brand-page-metadata';
import { buildCanonical,fitDescription } from "@/lib/page-metadata";
import { SITE_CONFIG } from "@/shared/siteConfig";
import { CONSULT_BULLETS,SITE_TAGLINE } from "@/shared/siteContent";
import { SITE_IMAGES } from "@/shared/siteImages";
import { ArrowUpRight, Check } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  ...withBrandPageMetadata(({
  // 49 chars. Leads with the primary term ("handyman in Boise") rather than
  // the brand, which the suffix carries anyway.
  title: { absolute: `Handyman in Boise, ID | ${SITE_CONFIG.name}` },
  description:
    fitDescription("Handyman services in Boise for small repairs, installations and maintenance. Send your task list and photos to Boise Handyman Co for a scope review."),
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
}), "/"),
  // Homepage description is intentionally applied after the shared brand defaults.
  description: "Handyman services in Boise for small repairs, installations and maintenance. Send your task list and photos to Boise Handyman Co for a scope review.",
};

export default function HomePage() {
  return (
    <div className="flex flex-col bg-background">
      {/* PAGE ORDER IS THE SALES CONVERSATION, IN THE ORDER A HOMEOWNER HAS IT.

          1. Hero + services answer
          2. Approved home bands (services, why, how, areas, FAQ)
          3. Planning-range interactive proof (C14) - ballpark before contact
          4. Budget / inclusions
          5. Gallery
          6. Process + who you are hiring
          7. Consult wizard (D2 / C10)

          The planning range sits before budget so visitors see a useful
          pre-email result, then what a written quote covers, then the ask. */}
      <HomePageSchema />
      <ApprovedFamilyFrame>
        <ApprovedHomeHero />
        <HandymanServicesAnswer />
        <ApprovedHome />
      </ApprovedFamilyFrame>
      <HandymanPhotoBand
        src={SITE_IMAGES.valueCraft}
        alt="Finish carpentry and trim work on a Treasure Valley home"
        title="Clean lines. Careful hands."
        eyebrow="Carpentry and trim"
      />
      <HandymanPlanningRange />
      <BudgetInclusionsSection />
      <HandymanPhotoBand
        src={SITE_IMAGES.statementBand}
        alt="Fresh interior paint with crisp cut-in lines on trim"
        title="Small jobs, finished well."
        eyebrow="Painting and touch-ups"
      />
      <ProjectGallerySection limit={6} showViewAll />
      <HowP5Works />
      <WhoYouAreHiring />
      <HandymanPhotoBand
        src={SITE_IMAGES.process}
        alt="Written quote materials ready for a handyman visit"
        title="One written price before work."
        eyebrow="How we quote"
      />
      <div id="contact" className="scroll-mt-24" aria-hidden="true" />
      <Section id="consult" divider className="relative overflow-hidden scroll-mt-16 pb-24 md:pb-28">
        <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
          <Image
            src={SITE_IMAGES.consultBg}
            alt="A freshly painted sage-green front door with white trim and black hardware"
            fill
            loading="lazy"
            sizes="100vw"
            className="object-cover opacity-[0.45] img-brand-grade"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-background via-background/[0.78] to-background/[0.4]" />
          <div className="absolute inset-0 bg-gradient-to-b from-background/90 via-transparent to-background" />
        </div>
        <div className="ed-shell relative z-10">
          <div className="grid gap-[var(--ed-gutter)] lg:grid-cols-[0.85fr_1.15fr] lg:items-start">
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
                  Send your repair list and optional photos. We review the scope, prepare
                  a written quote and confirm availability before scheduling.
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
                <div className="mt-6 grid border-t" style={{ borderColor: "var(--ed-line)" }}>
                  <a href={SITE_CONFIG.phoneHref} className="flex min-h-12 items-center justify-between gap-4 border-b text-[0.9375rem] font-medium transition-colors hover:[color:var(--ed-accent)]" style={{ borderColor: "var(--ed-line)" }}>
                    Call {SITE_CONFIG.phone}
                    <ArrowUpRight className="h-4 w-4 shrink-0" style={{ color: "var(--ed-accent)" }} aria-hidden="true" />
                  </a>
                  <a href={SITE_CONFIG.phoneSmsHref} className="flex min-h-12 items-center justify-between gap-4 border-b text-[0.9375rem] font-medium transition-colors hover:[color:var(--ed-accent)]" style={{ borderColor: "var(--ed-line)" }}>
                    Send a text
                    <ArrowUpRight className="h-4 w-4 shrink-0" style={{ color: "var(--ed-accent)" }} aria-hidden="true" />
                  </a>
                </div>
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

