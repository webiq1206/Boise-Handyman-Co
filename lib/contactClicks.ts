import { trackEvent } from "@/lib/analytics";
import { trackGoogleAdsContactClick } from "@/lib/googleAdsConversion";

type ClickTarget = EventTarget & object;

const installs = new WeakMap<ClickTarget, { count: number; onClick: (event: Event) => void }>();

/** The existing delegated handler. GA4 contact and CTA events stay as they were. */
export function handleContactClick(event: { target: EventTarget | null }): void {
  const target = event.target as (EventTarget & { closest?: (selector: string) => { getAttribute(name: string): string | null } | null }) | null;
  const link = target?.closest?.("a[href]");
  if (!link) return;
  const href = link.getAttribute("href") || "";
  if (href.startsWith("tel:")) {
    trackEvent("contact_click", { method: "phone", link_url: href });
    trackGoogleAdsContactClick(href);
  } else if (href.startsWith("sms:")) {
    trackEvent("contact_click", { method: "sms", link_url: href });
    trackGoogleAdsContactClick(href);
  } else if (href.startsWith("mailto:")) {
    trackEvent("contact_click", { method: "email", link_url: href });
  } else if (href === "#consult" || href.endsWith("/#consult")) {
    trackEvent("cta_click", { cta: "secondary", location: window.location.pathname });
  }
}

function release(target: ClickTarget): void {
  const existing = installs.get(target);
  if (!existing) return;
  existing.count -= 1;
  if (existing.count > 0) return;
  target.removeEventListener("click", existing.onClick, true);
  installs.delete(target);
}

/**
 * One capture-phase click listener per target. A second install shares it,
 * so a repeated effect does not fire two conversions for one click.
 */
export function bindContactClicks(target: ClickTarget): () => void {
  const existing = installs.get(target);
  if (existing) {
    existing.count += 1;
    return () => release(target);
  }
  const onClick = (event: Event) => handleContactClick(event as { target: EventTarget | null });
  target.addEventListener("click", onClick, true);
  installs.set(target, { count: 1, onClick });
  return () => release(target);
}
