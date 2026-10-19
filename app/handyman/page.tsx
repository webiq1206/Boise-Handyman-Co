import { ConsultationForm } from "@/components/ConsultationForm";
import { CONTRACTOR_REGISTRATION } from "@/components/ContractorCredential";
import { JsonLd } from "@/components/seo/JsonLd";
import { withBrandPageMetadata } from "@/lib/brand-page-metadata";
import { generateFAQSchema, generateWebPageSchema } from "@/lib/schema";
import { SITE_CONFIG } from "@/shared/siteConfig";
import { CalendarCheck, FileText, ShieldCheck } from "lucide-react";
import type { Metadata } from "next";
import Image from "next/image";

/**
 * Paid-search landing page. Calls are the goal, so Call and Text sit in the
 * first mobile screen and in a fixed bar; the full lead form follows for
 * visitors who would rather write. noindex: it exists for ad traffic only and
 * must not compete with the indexed homepage and service pages.
 */
const PATH = "/handyman";
const TITLE = `Boise Handyman for Repairs, Installs & Upkeep | ${SITE_CONFIG.name}`;
const DESCRIPTION = `Drywall, doors and trim, caulking, minor plumbing and electrical, and mounting across Boise and the Treasure Valley. Call or text ${SITE_CONFIG.phone} for an upfront written quote.`;
const HOURS = "Call or text Mon to Fri 9 AM to 6 PM, Sat 9 AM to 4 PM (Mountain).";

const HERO_IMAGE = "/family/handyman-hero-door-hinge-branded.webp";
const TILES = [
  { src: "/images/handyman/service-drywall-repair.webp", label: "Drywall repair", from: "$149", alt: "Hands spreading joint compound over a drywall patch" },
  { src: "/images/handyman/service-carpentry-trim-branded.webp", label: "Doors, trim & baseboards", from: "$149", alt: "Hands fitting white baseboard trim along a wall" },
  { src: "/images/handyman/service-caulking.webp", label: "Caulking & weatherproofing", from: "$145", alt: "A caulk gun laying a white bead along a bathtub edge" },
  { src: "/images/handyman/service-plumbing.webp", label: "Minor plumbing", from: "$145", alt: "Hands installing a kitchen faucet at a sink" },
  { src: "/images/handyman/service-electrical.webp", label: "Minor electrical", from: "$145", alt: "Hands installing a white electrical outlet" },
  { src: "/images/handyman/service-mounting.webp", label: "TV & shelf mounting", from: "$145", alt: "A worker leveling a TV wall-mount bracket" },
] as const;

const TRUST = [
  { icon: FileText, label: "Upfront written quote" },
  { icon: CalendarCheck, label: "Most jobs done in one visit" },
  { icon: ShieldCheck, label: "Bonded & insured" },
] as const;

const FAQS = [
  {
    question: "How does pricing work?",
    answer:
      "Every job is quoted upfront as one written price before any work starts. Small jobs plan from $145 a visit, materials are billed at cost, and bundling several tasks into one visit is the best value.",
  },
  {
    question: "How soon can you come out?",
    answer:
      "We reply to every new request within one business day, and most jobs are scheduled within the week. Call or text and we will tell you the soonest slot.",
  },
  {
    question: "What areas do you serve?",
    answer:
      "Homes across Ada and Canyon counties, including Boise, Meridian, Eagle, Nampa, Kuna, Star, Middleton, Caldwell and Garden City.",
  },
  {
    question: "What do you not do?",
    answer:
      "Work that needs a licensed trade or a general contractor, such as panel upgrades, repipes, gas, HVAC, roofing or full remodels. We say so upfront and refer you to a licensed specialist.",
  },
  {
    question: "Are you insured?",
    answer: `Yes. We are an ${CONTRACTOR_REGISTRATION}, bonded, and insured.`,
  },
];

export const metadata: Metadata = withBrandPageMetadata(
  {
    title: { absolute: TITLE },
    description: DESCRIPTION,
    alternates: { canonical: PATH },
    robots: {
      index: false,
      follow: false,
      googleBot: { index: false, follow: false, noimageindex: true },
    },
    openGraph: { url: PATH, title: TITLE, description: DESCRIPTION },
  },
  PATH,
);

function CallTextButtons({ onDark = false }: { onDark?: boolean }) {
  const base =
    "inline-flex min-h-14 w-full items-center justify-center rounded-sm px-5 text-base font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 sm:w-auto sm:min-w-[220px]";
  return (
    <div className="flex flex-col gap-3 sm:flex-row">
      <a
        href={SITE_CONFIG.phoneHref}
        className={`${base} ${onDark ? "bg-[#fbfaf6] text-[#2c302f] focus-visible:ring-[#fbfaf6]" : "bg-primary text-primary-foreground focus-visible:ring-ring"}`}
        data-testid="button-call-landing"
      >
        Call {SITE_CONFIG.phone}
      </a>
      <a
        href={SITE_CONFIG.phoneSmsHref}
        className={`${base} border ${onDark ? "border-[#fbfaf6] text-[#fbfaf6] focus-visible:ring-[#fbfaf6]" : "border-foreground/80 text-foreground focus-visible:ring-ring"}`}
        data-testid="button-text-landing"
      >
        Text {SITE_CONFIG.phone}
      </a>
    </div>
  );
}

export default function HandymanLandingPage() {
  return (
    <div className="hl-landing bg-background text-foreground">
      <style>{`
        .approved-shell .hl-hero,
        .approved-shell .hl-hero h1,
        .approved-shell .hl-hero p { color: #fbfaf6; }
        .approved-shell .hl-hero h1 { font-size: clamp(32px, 7.6vw, 60px); line-height: 1.05; }
        @media (max-width: 767px) {
          .approved-shell .hl-hero { min-height: calc(100svh - 140px); }
          .approved-shell .hl-hero h1 { font-size: 32px; }
        }
      `}</style>
      <JsonLd
        data={[
          generateWebPageSchema({ title: TITLE, description: DESCRIPTION, url: PATH }),
          generateFAQSchema(FAQS),
        ]}
      />

      <section className="hl-hero relative flex min-h-[calc(100svh-84px)] items-end overflow-hidden">
        <Image
          src={HERO_IMAGE}
          alt="A Boise Handyman Co technician adjusting an interior door hinge"
          fill
          priority
          sizes="100vw"
          className="object-cover object-[62%_center]"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#1c1f1e]/95 via-[#1c1f1e]/60 to-[#1c1f1e]/20" aria-hidden="true" />
        <div className="relative z-10 mx-auto w-full max-w-5xl px-5 pb-5 pt-6 sm:px-8 sm:pb-16 sm:pt-16">
          <h1 className="max-w-[16ch] font-serif">Boise handyman for the repairs on your list</h1>
          <p className="mt-4 max-w-[36rem] text-base leading-snug sm:text-lg sm:leading-relaxed">
            Drywall, doors and trim, caulking, minor plumbing and electrical, and mounting. One upfront written quote.
          </p>
          <div className="mt-5">
            <CallTextButtons onDark />
          </div>
          <p className="mt-3 text-sm leading-snug">{HOURS}</p>
          <ul className="mt-5 flex flex-wrap gap-2">
            {TRUST.map(({ icon: Icon, label }) => (
              <li
                key={label}
                className="inline-flex items-center gap-1.5 rounded-full border border-[#fbfaf6]/35 bg-[#1c1f1e]/55 px-3 py-1.5 text-[13px] leading-tight text-[#fbfaf6]"
              >
                <Icon className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                <span>{label}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="mx-auto grid max-w-5xl grid-cols-2 gap-4 px-5 py-10 sm:grid-cols-3 sm:px-8" aria-label="What we fix">
        {TILES.map((tile) => (
          <figure key={tile.label} className="overflow-hidden">
            <div className="relative aspect-[4/3]">
              <Image src={tile.src} alt={tile.alt} fill sizes="(min-width: 640px) 33vw, 50vw" className="object-cover" />
            </div>
            <figcaption className="pt-2 text-sm leading-snug">
              <span className="block font-medium text-foreground">{tile.label}</span>
              <span className="text-muted-foreground">Planning from {tile.from}</span>
            </figcaption>
          </figure>
        ))}
      </section>

      <article className="mx-auto max-w-3xl px-6 pb-28 md:pb-16">
        <section className="space-y-4">
          <h2 className="font-serif text-3xl text-foreground">How it works</h2>
          <ol className="list-decimal space-y-4 pl-5 text-base leading-relaxed">
            <li>
              <strong>Call or text.</strong> Tell us what needs fixing. Photos help us quote faster.
            </li>
            <li>
              <strong>Get one written price.</strong> You see the quote before anything is scheduled.
            </li>
            <li>
              <strong>We do the work.</strong> Most jobs are finished in a single visit.
            </li>
          </ol>
        </section>

        <section id="quick-quote" className="mt-14 scroll-mt-28 space-y-5">
          <h2 className="font-serif text-3xl text-foreground">Rather write? Send your list</h2>
          <ConsultationForm />
        </section>

        <section className="mt-14 space-y-6">
          <h2 className="font-serif text-3xl text-foreground">Questions</h2>
          {FAQS.map((faq) => (
            <div key={faq.question} className="space-y-2">
              <h3 className="text-xl font-medium text-foreground">{faq.question}</h3>
              <p className="leading-relaxed text-muted-foreground">{faq.answer}</p>
            </div>
          ))}
        </section>

        <section className="mt-14 space-y-5" data-suppress-sticky-cta="">
          <h2 className="font-serif text-3xl text-foreground">Ready to clear your list?</h2>
          <p className="leading-relaxed text-muted-foreground">{HOURS}</p>
          <CallTextButtons />
        </section>
      </article>

      <nav
        aria-label="Call or text"
        className="fixed inset-x-0 bottom-0 z-[100] grid grid-cols-2 border-t border-border bg-background pb-safe md:hidden"
      >
        <a href={SITE_CONFIG.phoneHref} className="flex min-h-14 items-center justify-center border-r border-border font-medium" data-testid="button-call-landing-bar">
          Call
        </a>
        <a href={SITE_CONFIG.phoneSmsHref} className="flex min-h-14 items-center justify-center font-medium" data-testid="button-text-landing-bar">
          Text
        </a>
      </nav>
    </div>
  );
}
