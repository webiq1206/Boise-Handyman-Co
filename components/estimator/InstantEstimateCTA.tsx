"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { AnchorHTMLAttributes, ReactNode } from "react";
import { familyButtonClass } from "@/components/family/Button";
import { trackEvent } from "@/lib/analytics";
import { CTA_ESTIMATE, instantEstimateHref } from "@/shared/ctaCopy";

interface InstantEstimateCTAProps extends Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "href" | "onClick"> {
  /** Estimator project id this page maps to, for example "handyman". Omit to let the visitor choose. */
  project?: string | null;
  /** Optional context for the cta_click event (for example "landing_hero"). */
  trackingLocation?: string;
  /** "lg" is the 48px button (bands, heroes); the default is 44px. */
  size?: "lg" | "md";
  /** "dark" on charcoal grounds: the paper-filled primary with the accent bar. */
  tone?: "light" | "dark";
  children?: ReactNode;
}

/**
 * "Get an instant estimate" in page content: the site's primary pricing call
 * to action (owner decision, 13 November 2026). It only links to
 * /instant-estimate, where the family's central estimator is framed; there is
 * no estimator logic or pricing in this repository. Drawn as the family
 * primary button and tracked with the same cta_click event as the request
 * form's button.
 */
export function InstantEstimateCTA({ project = null, trackingLocation, size, tone = "light", className, children, ...props }: InstantEstimateCTAProps) {
  const pathname = usePathname();
  return (
    <Link
      {...props}
      href={instantEstimateHref(project)}
      className={familyButtonClass({ variant: tone === "dark" ? "hero" : "primary", tone, size: size === "lg" ? "lg" : "md", className })}
      onClick={() => trackEvent("cta_click", { cta: "instant_estimate", location: trackingLocation ?? pathname ?? "" })}
    >
      {children ?? CTA_ESTIMATE}
    </Link>
  );
}
