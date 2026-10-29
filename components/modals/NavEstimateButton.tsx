"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import type { ButtonProps } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { trackEvent } from "@/lib/analytics";

interface NavEstimateButtonProps extends Omit<ButtonProps, "onClick" | "asChild"> {
  /** Plain anchor styling for mobile sticky bar text links. */
  asLink?: boolean;
  className?: string;
  children: React.ReactNode;
  onExtraClick?: () => void;
  /** cta_click event location - "nav_desktop" | "nav_mobile_menu" | "mobile_sticky_bar". */
  trackingLocation?: string;
}

/**
 * Header and mobile-bar primary CTA: homepage scrolls to the request form;
 * every other page goes to /contact.
 */
export function NavEstimateButton({
  asLink = false,
  className,
  children,
  onExtraClick,
  trackingLocation,
  ...props
}: NavEstimateButtonProps) {
  const pathname = usePathname();
  const onHome = pathname === "/";
  const href = onHome ? "/#consult" : "/contact";
  const { variant: _v, size: _s, ...linkAttrs } = props as Record<string, unknown>;

  const handleClick = () => {
    trackEvent("cta_click", { cta: "primary", location: trackingLocation ?? "nav" });
    onExtraClick?.();
  };

  if (asLink) {
    return (
      <Link
        href={href}
        className={className}
        onClick={handleClick}
        {...(linkAttrs as React.AnchorHTMLAttributes<HTMLAnchorElement>)}
      >
        {children}
      </Link>
    );
  }

  return (
    <Button {...props} className={cn(className)} asChild>
      <Link href={href} onClick={handleClick}>
        {children}
      </Link>
    </Button>
  );
}
