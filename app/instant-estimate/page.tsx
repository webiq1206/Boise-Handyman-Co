import { InteriorPage } from "@/components/approved/InteriorLayout";
import EstimatorAnalytics from "@/components/estimator/EstimatorAnalytics";
import EstimatorFrame from "@/components/estimator/EstimatorFrame";
import { Section } from "@/components/marketing/Section";
import { FamilyButton } from "@/components/family/Button";
import { JsonLd } from "@/components/seo/JsonLd";
import { withBrandPageMetadata } from "@/lib/brand-page-metadata";
import { buildCanonical } from "@/lib/page-metadata";
import { generateBreadcrumbSchema, generateWebPageSchema } from "@/lib/schema";
import { CTA_QUOTE, ESTIMATE_HREF } from "@/shared/ctaCopy";
import { SITE_CONFIG } from "@/shared/siteConfig";
import type { Metadata } from "next";
import styles from "./instant-estimate.module.css";

/**
 * /instant-estimate: the P5 family's central estimator, framed into this site.
 *
 * Owner decision, 13 November 2026: this is the site's primary pricing call to
 * action. The estimator itself (questions, pricing, property lookup, lead
 * delivery) lives on p5homeco.com; this page only frames it and explains it.
 * It gives an on-screen preliminary range. It is never a quote or a final
 * price, and nothing here promises how fast a person replies.
 */

const TITLE = "Instant Handyman Estimate in Boise";
const DESCRIPTION =
  "Pick the jobs on your list, answer a few questions and see a preliminary price range on screen. Free, any time, with no appointment needed.";

export const metadata: Metadata = withBrandPageMetadata(
  {
    title: { absolute: `${TITLE} | ${SITE_CONFIG.name}` },
    description: DESCRIPTION,
    alternates: { canonical: buildCanonical(ESTIMATE_HREF) },
    openGraph: {
      title: TITLE,
      description: DESCRIPTION,
      url: buildCanonical(ESTIMATE_HREF),
      type: "website",
      images: [{ url: "/images/og-default.png", width: 1200, height: 630, alt: SITE_CONFIG.name }],
    },
  },
  ESTIMATE_HREF,
);

/**
 * The sticky family header: --header-height in styles/family-tokens.css is
 * 64px on phones and 76px from the desktop breakpoint. The larger value keeps
 * each estimator question clear of the header at every width.
 */
const HEADER_OFFSET = 76;

const STEPS = [
  {
    title: "Pick your jobs and answer a few questions",
    text: "Choose the repairs, installs or touch-ups on your to-do list and tell the estimator a little about each one.",
  },
  {
    title: "We add your home's public record",
    text: "Where the county publishes it, details about your home are filled in from the public record, so there is less to type.",
  },
  {
    title: "See your preliminary range on screen",
    text: "Add your name, email and phone, and your preliminary price range appears on screen with a breakdown of what makes it up.",
  },
];

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export default async function InstantEstimatePage({ searchParams }: { searchParams: SearchParams }) {
  const raw = (await searchParams).project;
  const requested = Array.isArray(raw) ? raw[0] : raw;
  const project = requested && /^[a-z0-9-]{1,40}$/.test(requested) ? requested : null;

  const schemas = [
    generateWebPageSchema({ title: TITLE, description: DESCRIPTION, url: ESTIMATE_HREF }),
    generateBreadcrumbSchema([
      { name: "Home", url: "/" },
      { name: "Instant estimate", url: ESTIMATE_HREF },
    ]),
  ];

  return (
    <InteriorPage kind="instant-estimate">
      <>
        <JsonLd data={schemas} />

        {/* Kept short on purpose: on a phone the first estimator question has
            to be on the first screen. */}
        <section className={styles.intro} aria-labelledby="instant-estimate-title">
          <div className={styles.shell}>
            <h1 id="instant-estimate-title" className={styles.title}>
              Get an instant estimate for your to-do list
            </h1>
            <p className={styles.support}>
              Answer a few questions and see a preliminary price range on screen. Free, any time, with no
              appointment and no waiting for a callback.
            </p>
          </div>
        </section>

        <section className={styles.frame} aria-label="Instant estimate">
          <div className={styles.shell}>
            <EstimatorAnalytics />
            <EstimatorFrame
              brand="handyman"
              project={project}
              title={`${SITE_CONFIG.name} instant estimate`}
              headerOffset={HEADER_OFFSET}
            />
          </div>
        </section>

        <Section surface="bone" spacing="lg" edge reveal={false}>
          <div className="ed-shell">
            <p className="ed-eyebrow">Three steps</p>
            <h2 className="ed-h2-sm">How it works</h2>
            <ol className={styles.steps}>
              {STEPS.map((step, index) => (
                <li key={step.title}>
                  <span className={styles.stepNumber} aria-hidden="true">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <h3 className="ed-h4">{step.title}</h3>
                  <p className="ed-body">{step.text}</p>
                </li>
              ))}
            </ol>
          </div>
        </Section>

        <Section surface="bone" spacing="lg" edge reveal={false}>
          <div className="ed-shell">
            <div className={styles.pair}>
              <div>
                <p className="ed-eyebrow">What the number means</p>
                <h2 className="ed-h2-sm">A preliminary range now, a firm proposal after we see the work</h2>
                <p className="ed-body mt-6">
                  The instant estimate is a preliminary price range for budgeting, based on what you tell the
                  estimator. A firm written proposal follows a site visit, measurements and your selections.
                  Nothing is scheduled until you approve it.
                </p>
              </div>
              <div className={styles.talk}>
                <p className="ed-eyebrow">Talk it through</p>
                <h2 className="ed-h2-sm">Prefer to talk to us?</h2>
                <p className="ed-body mt-6">
                  Call{" "}
                  <a href={SITE_CONFIG.phoneHref} className="underline underline-offset-4" data-testid="link-instant-estimate-phone">
                    {SITE_CONFIG.phone}
                  </a>
                  , or send your list and photos and we will prepare a written quote before any work starts.
                </p>
                <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:gap-4 [&>*]:w-full sm:[&>*]:w-auto">
                  <FamilyButton href="/contact#consult" variant="primary" data-testid="link-instant-estimate-form">
                    {CTA_QUOTE}
                  </FamilyButton>
                  <FamilyButton href={SITE_CONFIG.phoneHref} variant="secondary">
                    Call {SITE_CONFIG.phone}
                  </FamilyButton>
                </div>
              </div>
            </div>
          </div>
        </Section>
      </>
    </InteriorPage>
  );
}
