import { ArrowRight } from "lucide-react";
import { Section } from "./Section";
import { CTA_PRIMARY } from "@/shared/ctaCopy";
import { SITE_CONFIG } from "@/shared/siteConfig";
import { EstimateCTA } from "@/components/modals/EstimateCTA";
import { BusinessPhoneLink } from "@/components/BusinessPhoneContact";

/**
 * The closing ask on every article, guide and area page.
 *
 * WAS a dark card centred in a 896px column - a box at the end of a page. NOW
 * the same gradient statement band every other page closes on. It is a full-
 * width band, so callers render it bare - not inside a page container. A first
 * cut pulled it out of the container with a negative margin instead; measured,
 * that overflowed the viewport by 24px on the areas page at every width.
 */
export function BlogEndCta() {
  return (
    <Section surface="gradient" spacing="xl" edge>
      <div className="ed-shell">
        <div className="ed-split ed-split-center">
          <div>
            <p className="ed-eyebrow ed-eyebrow-accent">Start your project</p>
      <h2 className="ed-h2 ed-statement">
        Ready to get it fixed?
      </h2>
      </div>
      <div>
      <p className="ed-body">
        Send the list and photos, get a written quote, then book a handyman visit
        when you&apos;re ready. No obligation, no pressure.
      </p>
      {/* C5: one primary, and the phone as a text link. The band used to carry
          four actions (send, book, call, text) that all led to the same intake. */}
      <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:gap-6 [&>a:first-child]:w-full sm:[&>a:first-child]:w-auto">
        <EstimateCTA variant="brand" size="lg" data-testid="link-bottom-cta-estimate">
          {CTA_PRIMARY}
          <ArrowRight className="ml-2 h-5 w-5" />
        </EstimateCTA>
        <BusinessPhoneLink
          data-testid="link-bottom-cta-call"
          showIcon
          className="min-h-11 text-base text-inverse-foreground underline underline-offset-4 transition-colors hover:text-inverse-foreground/80"
        >
          Prefer to talk? Call {SITE_CONFIG.phone}
        </BusinessPhoneLink>
      </div>
    </div>
        </div>
      </div>
    </Section>
  );
}
