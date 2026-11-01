import { ApprovedHowItWorks, ApprovedServiceArea } from "@/components/approved/ApprovedHome";
import { ApprovedFamilyFrame, ApprovedHomeHero } from "@/components/approved/ApprovedHomeHero";
import { HandymanServicesAnswer } from "@/components/seo/HandymanServicesAnswer";
import { LazyConsultationForm as ConsultationForm } from "@/components/LazyConsultationForm";
import { FAQSection } from "@/components/FAQSection";
import { MarketingCard } from "@/components/marketing/MarketingCard";
import { Section } from "@/components/marketing/Section";
import Image from "@/components/MarketingImage";
import { Reveal } from "@/components/Reveal";
import { HandymanPlanningRange } from "@/components/sections/HandymanPlanningRange";
import { HowP5Works } from "@/components/sections/HowP5Works";
import { WhoYouAreHiring } from "@/components/sections/WhoYouAreHiring";
import { ProjectGallerySection } from "@/components/sections/ProjectGallerySection";
import { HomePageSchema } from "@/components/seo/HomePageSchema";
import { withBrandPageMetadata } from '@/lib/brand-page-metadata';
import { buildCanonical } from "@/lib/page-metadata";
import { SITE_CONFIG } from "@/shared/siteConfig";
import { CONSULT_BULLETS } from "@/shared/siteContent";
import { SITE_IMAGES } from "@/shared/siteImages";
import { ArrowUpRight, Check } from "lucide-react";
import type { Metadata } from "next";

// Title and description come from one place: the '/' entry in
// lib/brand-page-metadata.ts, which wraps this object. Setting them here too
// shipped two competing sources, and the wrapper silently won.
export const metadata: Metadata = withBrandPageMetadata({
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
    type: "website",
    url: buildCanonical("/"),
    siteName: SITE_CONFIG.name,
  },
}, "/");

export default function HomePage() {
  return (
    <div className="flex flex-col bg-background">
      {/* PAGE ORDER IS THE SALES CONVERSATION, IN THE ORDER A HOMEOWNER HAS IT.
          Phase 3 (template T1): about eight sections, each promise said once.

          1. Hero (family HeroPhoto: one support line, one primary, Call as a
             text link) and its proof strip
          2. Services: the answer-first block and every service link
          3. Planning-range interactive proof (C14): a ballpark before contact
             (the gallery slot after it renders nothing until real work exists)
          4. How it works, with "What you can count on" beside the steps
          5. Founder
          6. Service area
          7. FAQ (FAQPage schema reads the same list, see HomePageSchema)
          8. The request band (#consult)

          Removed as repeats of the proof strip and of each other: the services
          tab explorer, "Pay for the fix", "Good work. A better experience."
          and "What your quote actually covers". */}
      <HomePageSchema />
      {/* The family photo hero renders outside the legacy family frame so the
          frame's heading overrides cannot restyle the shared HeroPhoto. */}
      <ApprovedHomeHero />
      <ApprovedFamilyFrame>
        <HandymanServicesAnswer />
      </ApprovedFamilyFrame>
      <HandymanPlanningRange />
      <ProjectGallerySection limit={6} showViewAll />
      <ApprovedFamilyFrame>
        <ApprovedHowItWorks aside={<HowP5Works />} />
      </ApprovedFamilyFrame>
      <WhoYouAreHiring />
      <ApprovedFamilyFrame>
        <ApprovedServiceArea />
        <FAQSection />
      </ApprovedFamilyFrame>
      <div id="contact" className="scroll-mt-24" aria-hidden="true" />
      <Section id="consult" divider className="relative overflow-hidden scroll-mt-16 pb-28 md:pb-28">
        {/* Warm, dimmed lifestyle photo grounds the closing section. Directional
            scrims keep the left-column copy legible and fade the edges into the
            page ground; the form card floats above on its own shadow. */}
        <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
          <Image
            src={SITE_IMAGES.consultBg}
            alt="A freshly painted sage-green front door with white trim and black hardware"
            fill
            loading="lazy"
            sizes="100vw"
            className="object-cover opacity-[0.52] img-brand-grade"
          />
          {/* Directional scrims: solid behind the left-column copy, opening up
              toward the right where the form card carries its own surface. */}
          <div className="absolute inset-0 bg-gradient-to-r from-background via-background/[0.68] to-background/[0.32]" />
          <div className="absolute inset-0 bg-gradient-to-b from-background/85 via-transparent to-background" />
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
                  Send your repair list and optional photos. We review the scope, prepare
                  a written quote and confirm availability before scheduling.
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

