"use client";
/**
 * Site chrome routing for Boise Handyman Co. The header and the mobile action
 * bar themselves are the shared family components (components/family/), set up
 * by lib/familyBrand.ts; this file only decides where they render.
 *
 * - Estimator routes: no marketing header or bar. The estimator is a one-page
 *   app with its own brand bar, step progress and exit (owner 2026-09-23).
 * - The paid-search funnel (/handyman): brand only, so the page's own Call and
 *   Text stay the only exits; it keeps its own Call/Text bar.
 * - Portal routes: a plain lockup bar.
 */
import { ApprovedBrand } from "@/components/approved/ApprovedBrand";
import { MobileActionBar } from "@/components/family/MobileActionBar";
import { SiteHeader } from "@/components/family/SiteHeader";
import { isAdFunnelPath } from "@/lib/adLandingPaths";
import { isEstimatorPath } from "@/lib/p5/estimatorRoutes";
import { SITE_CONFIG } from "@/shared/siteConfig";
import { Phone } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

/** Admin and subcontractor portal routes: a plain lockup bar, no marketing chrome. */
export function isPortalPath(pathname: string | null | undefined): boolean {
  return Boolean(
    pathname?.startsWith("/admin") ||
      pathname?.startsWith("/subcontractor/portal") ||
      pathname?.startsWith("/subcontractor/leads") ||
      pathname?.startsWith("/subcontractor/compliance") ||
      pathname?.startsWith("/subcontractor/projects") ||
      pathname?.startsWith("/subcontractor/contracts") ||
      pathname === "/subcontractor" ||
      pathname?.startsWith("/subcontractor/purchases"),
  );
}

/** Ad funnel header: brand only, so the page's Call and Text stay the only exits. */
function FunnelHeader() {
  return (
    <header data-approved-navigation className="z-[100] w-full border-b border-border bg-background">
      <nav className="container flex h-16 items-center justify-between gap-4 px-4 md:px-6 md:h-[76px]">
        <ApprovedBrand />
        <a
          href={SITE_CONFIG.phoneHref}
          className="hidden shrink-0 items-center gap-2 whitespace-nowrap text-sm font-medium md:inline-flex"
          data-testid="link-phone-funnel"
        >
          <Phone className="h-4 w-4" aria-hidden="true" />
          {SITE_CONFIG.phone}
        </a>
      </nav>
    </header>
  );
}

export function Navigation() {
  const pathname = usePathname();
  if (isEstimatorPath(pathname)) return null;
  if (isAdFunnelPath(pathname)) return <FunnelHeader />;
  if (isPortalPath(pathname)) {
    return (
      <header className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/90">
        <nav className="container flex h-16 items-center justify-between gap-4 px-6">
          <Link href="/" className="flex items-center" aria-label={`${SITE_CONFIG.name}, home`}>
            <ApprovedBrand />
          </Link>
        </nav>
      </header>
    );
  }
  return <SiteHeader />;
}

/** Rendered after the footer so the bar's clearance spacer sits at the end of the page. */
export function SiteActionBar() {
  const pathname = usePathname();
  if (isEstimatorPath(pathname) || isAdFunnelPath(pathname) || isPortalPath(pathname)) return null;
  return <MobileActionBar />;
}
