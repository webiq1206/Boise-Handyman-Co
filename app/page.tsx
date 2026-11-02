import { ApprovedCtaStrip, ApprovedFounder, ApprovedHowItWorks, ApprovedServiceArea } from "@/components/approved/ApprovedHome";
import { ApprovedFamilyFrame, ApprovedHomeHero } from "@/components/approved/ApprovedHomeHero";
import { HandymanServicesAnswer } from "@/components/seo/HandymanServicesAnswer";
import { LazyConsultationForm as ConsultationForm } from "@/components/LazyConsultationForm";
import { QuoteFormAnchor } from "@/components/QuoteFormAnchor";
import { FAQSection } from "@/components/FAQSection";
import { Reveal } from "@/components/Reveal";
import { HandymanPlanningRange } from "@/components/sections/HandymanPlanningRange";
import { HowP5Works } from "@/components/sections/HowP5Works";
import { ProjectGallerySection } from "@/components/sections/ProjectGallerySection";
import { HomePageSchema } from "@/components/seo/HomePageSchema";
import { withBrandPageMetadata } from '@/lib/brand-page-metadata';
import { buildCanonical } from "@/lib/page-metadata";
import { SITE_CONFIG } from "@/shared/siteConfig";
import { CONSULT_BULLETS } from "@/shared/siteContent";
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
        <ApprovedFounder />
        <ApprovedCtaStrip />
        <ApprovedServiceArea />
        <FAQSection />
      </ApprovedFamilyFrame>
      <div id="contact" className="scroll-mt-24" aria-hidden="true" />
      {/* The ask. A bone band with the form as the one bright object on the screen:
          white card, accent top rule, deep shadow. Every "#consult" link lands on the
          form heading and its first field (QuoteFormAnchor). Phones: the form leads
          and the reassurance follows it. */}
      <ApprovedFamilyFrame>
        <section className="fr-request" aria-label="Send your list">
          <div className="f-section f-container">
            <div className="fr-request-grid">
              <div id="consult" data-quote-anchor="" className="order-1 lg:order-2 lg:col-start-2 lg:row-start-1">
                <QuoteFormAnchor />
                <div className="fr-request-card">
                  <ConsultationForm />
                </div>
              </div>
              <div className="fr-request-copy order-2 lg:order-1 lg:col-start-1 lg:row-start-1">
                <Reveal>
                  <p className="f-eyebrow">BEGIN A CONVERSATION</p>
                  <h2>Tell us what<br /><em style={{ color: "var(--f-accent)" }}>needs fixing.</em></h2>
                  <p>Send your repair list and optional photos. We review the scope, prepare a written quote and confirm availability before scheduling.</p>
                  <p>Include each task and where it is in the home, photos and any product details, and the timing you are working toward.</p>
                  <ul className="fr-request-list">
                    {CONSULT_BULLETS.map((item) => (
                      <li key={item}>
                        <Check className="h-4 w-4" aria-hidden="true" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                  <ul className="fr-request-list" style={{ borderTop: 0, paddingTop: 0 }}>
                    <li><a href={SITE_CONFIG.phoneHref} className="f-link">Call {SITE_CONFIG.phone} <ArrowUpRight size={16} aria-hidden="true" /></a></li>
                    <li><a href={SITE_CONFIG.phoneSmsHref} className="f-link">Send a text <ArrowUpRight size={16} aria-hidden="true" /></a></li>
                  </ul>
                </Reveal>
              </div>
            </div>
          </div>
        </section>
      </ApprovedFamilyFrame>
    </div>
  );
}

