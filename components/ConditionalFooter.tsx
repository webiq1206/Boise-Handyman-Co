"use client";

import type { ReactNode } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { isAdFunnelPath } from "@/lib/adLandingPaths";
import { isEstimatorPath } from "@/lib/p5/estimatorRoutes";

/** Ad funnel footer: the legal links only, clear of the fixed Call/Text bar. */
function FunnelFooter() {
  return (
    <footer className="border-t border-border bg-background px-6 py-8 pb-24 text-sm text-muted-foreground md:pb-8">
      <p className="mx-auto flex max-w-3xl gap-4">
        <Link href="/privacy-policy" className="underline underline-offset-2 hover:text-foreground">
          Privacy
        </Link>
        <Link href="/terms-of-service" className="underline underline-offset-2 hover:text-foreground">
          Terms
        </Link>
      </p>
    </footer>
  );
}

export function ConditionalFooter({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  if (isAdFunnelPath(pathname)) return <FunnelFooter />;
  const hideFooter =
    pathname?.startsWith("/admin") ||
    pathname?.startsWith("/subcontractor/portal") ||
    pathname?.startsWith("/subcontractor/leads") ||
    pathname?.startsWith("/subcontractor/compliance") ||
    pathname?.startsWith("/subcontractor/projects") ||
    pathname?.startsWith("/subcontractor/contracts") ||
    pathname === "/subcontractor" ||
    pathname?.startsWith("/subcontractor/purchases");

  // The estimator owns the whole screen as a one-page app; a footer below it
  // would be the one thing on the page that forces a scroll.
  if (hideFooter || isEstimatorPath(pathname)) return null;
  return children;
}
