"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { useModals } from "./modalsContext";
import { CTA_PRIMARY, CTA_SECONDARY } from "@/shared/ctaCopy";
import { trackEvent } from "@/lib/analytics";

const cls =
  "text-sm text-inverse-muted hover:text-inverse-foreground transition-colors text-left";

export function FooterCTAs() {
  const { openConsult } = useModals();
  const isHome = usePathname() === "/";

  return (
    <>
      <li>
        {isHome ? (
          <Link href="/#consult" className={cls}>
            {CTA_PRIMARY}
          </Link>
        ) : (
          <Link href="/contact" className={cls}>
            {CTA_PRIMARY}
          </Link>
        )}
      </li>
      <li>
        {/* The anchor variant is tracked by ConversionTracking's delegated
            #consult branch; the modal button never navigates, so it reports
            its own secondary-CTA click. */}
        {isHome ? (
          <Link href="/#consult" className={cls}>
            {CTA_SECONDARY}
          </Link>
        ) : (
          <button
            onClick={() => {
              trackEvent("cta_click", { cta: "secondary", location: "footer_modal" });
              openConsult();
            }}
            className={cls}
          >
            {CTA_SECONDARY}
          </button>
        )}
      </li>
    </>
  );
}
