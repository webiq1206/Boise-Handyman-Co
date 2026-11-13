"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { AnchorHTMLAttributes, ReactNode } from "react";
import { familyButtonClass } from "@/components/family/Button";
import { trackEvent } from "@/lib/analytics";
import { QUOTE_FORM_HREF } from "@/shared/ctaCopy";

interface EstimateCTAProps extends Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "href" | "onClick"> {
  onExtraClick?: () => void;
  /** Optional context for the cta_click event (e.g. "hero", "footer", "faq"). */
  trackingLocation?: string;
  children: ReactNode;
  /** Old variant names map onto the family set: any outline variant is the
      secondary (outline) button, everything else the primary. */
  variant?: string;
  /** "lg" is the 48px button (bands, heroes); everything else is the 44px default. */
  size?: "lg" | "md" | "sm" | "default" | "icon" | null;
  /** "dark" on charcoal grounds: the paper-filled primary with the accent bar. */
  tone?: "light" | "dark";
}

/**
 * Sitewide "Send your list and photos" in page content, drawn as the family
 * button (components/family/Button: charcoal fill, paper label, accent bar;
 * paper fill on dark grounds). It lands on a request form: the contact page's
 * own (#consult), or the homepage form (/#consult) from anywhere else. Tracked once here
 * with the same cta_click event the call sites always sent.
 *
 * Since 13 November 2026 the header's call to action is the estimator
 * (components/estimator/InstantEstimateCTA.tsx), so this button names the form
 * itself instead of following the header: it is the written-quote path, used
 * where the words around it are about sending a list and photos.
 */
export function EstimateCTA({ onExtraClick, children, trackingLocation, variant, size, tone = "light", className, ...props }: EstimateCTAProps) {
  const pathname = usePathname();
  // Owner, 1 November 2026: every "Send your list and photos" lands ON a form.
  // The contact page has its own (#consult); everywhere else it is the
  // homepage form.
  const href = pathname === "/contact" ? "/contact#consult" : QUOTE_FORM_HREF;
  const secondary = /outline/i.test(variant ?? "");

  return (
    <Link
      {...props}
      href={href}
      className={familyButtonClass({
        variant: secondary ? "secondary" : tone === "dark" ? "hero" : "primary",
        tone,
        size: size === "lg" ? "lg" : "md",
        className,
      })}
      onClick={() => {
        trackEvent("cta_click", { cta: "primary", location: trackingLocation ?? pathname });
        onExtraClick?.();
      }}
    >
      {children}
    </Link>
  );
}
