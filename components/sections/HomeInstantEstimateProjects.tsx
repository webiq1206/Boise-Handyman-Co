"use client";

import Link from "next/link";
import { ArrowUpRight, Phone } from "lucide-react";
import { Reveal } from "@/components/Reveal";
import { Section } from "@/components/marketing/Section";
import { familyButtonClass } from "@/components/family/Button";
import { trackEvent } from "@/lib/analytics";
import { CTA_QUOTE, HOME_ESTIMATOR_PROJECTS, QUOTE_FORM_HREF, instantEstimateHref } from "@/shared/ctaCopy";
import { SITE_CONFIG } from "@/shared/siteConfig";

/**
 * The homepage block where the planning range slider used to be (owner,
 * 21 November 2026: one source of prices). HandymanPlanningRange ran this
 * site's own engine and showed figures that differed from the P5 instant
 * estimator, so it was retired; the component stays in the repository,
 * unmounted. This block shows no figure: it opens the central estimator on
 * each project it prices for this brand, with the path to a person beside it.
 *
 * `#planning-range` is kept as an anchor at the top of the block so old links
 * from outside the site still land here. Every link inside the site goes to
 * /instant-estimate.
 */
export function HomeInstantEstimateProjects() {
  return (
    <Section
      id="estimate-by-project"
      surface="dark"
      spacing="xl"
      edge
      className="fr-band relative"
      data-testid="home-instant-estimate-projects"
      aria-labelledby="estimate-by-project-title"
    >
      <span id="planning-range" className="absolute left-0 top-0 h-px w-px" aria-hidden="true" />
      <div className="ed-shell relative z-10">
        <div className="ed-split ed-split-end">
          <Reveal>
            <p className="ed-eyebrow">Instant estimate</p>
            <h2 id="estimate-by-project-title" className="ed-h2 ed-statement-wide">
              Start with the job.
              <br />
              <em className="not-italic" style={{ color: "var(--ed-accent)" }}>
                See a preliminary range.
              </em>
            </h2>
          </Reveal>
          <Reveal delay={60}>
            <p className="ed-body">Pick your project and see a preliminary price range from our instant estimate.</p>
          </Reveal>
        </div>

        <Reveal delay={80}>
          <ul className="hm-estimate-projects" aria-label="Projects our instant estimate prices">
            {HOME_ESTIMATOR_PROJECTS.map((project) => (
              <li key={project.id}>
                <Link
                  className={familyButtonClass({ variant: "secondary", size: "lg", tone: "dark", block: true, className: "hm-estimate-project" })}
                  href={instantEstimateHref(project.id)}
                  data-estimator-project={project.id}
                  onClick={() => trackEvent("cta_click", { cta: "instant_estimate", location: `home_projects_${project.id}` })}
                >
                  <span>{project.label}</span>
                  <ArrowUpRight className="h-[18px] w-[18px] flex-none" aria-hidden="true" />
                </Link>
              </li>
            ))}
          </ul>
          <div className="hm-estimate-person">
            <p>Prefer a written quote from a person?</p>
            <div className="hm-estimate-person-actions">
              <Link className={familyButtonClass({ variant: "tertiary", tone: "dark" })} href={QUOTE_FORM_HREF}>
                {CTA_QUOTE}
              </Link>
              <a className={familyButtonClass({ variant: "tertiary", tone: "dark" })} href={SITE_CONFIG.phoneHref} data-testid="link-phone-estimate-block">
                <Phone className="h-[18px] w-[18px]" strokeWidth={1.5} aria-hidden="true" />
                Call {SITE_CONFIG.phone}
              </a>
            </div>
          </div>
        </Reveal>
      </div>
    </Section>
  );
}
