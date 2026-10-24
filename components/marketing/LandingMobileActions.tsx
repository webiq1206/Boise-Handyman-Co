"use client";
import { usePathname } from "next/navigation";
import { useP5MobileActions } from "@/components/P5MobileActions";
import { SITE_CONFIG } from "@/shared/siteConfig";

/** One contact bar, hidden while editing or while the hero contacts remain visible. */
export function LandingMobileActions(){
  const visible=useP5MobileActions(usePathname());
  if(!visible)return null;
  return <nav aria-label="Call or text" className="fixed inset-x-0 bottom-0 z-[100] grid grid-cols-2 border-t border-border bg-background pb-safe md:hidden">
    <a href={SITE_CONFIG.phoneHref} className="flex min-h-14 items-center justify-center border-r border-border font-medium focus-visible:ring-2 focus-visible:ring-ring">Call Us</a>
    <a href={SITE_CONFIG.phoneSmsHref} className="flex min-h-14 items-center justify-center font-medium focus-visible:ring-2 focus-visible:ring-ring">Text Us</a>
  </nav>;
}
