"use client";

import { useEffect } from "react";

const SETTLE_MS = 2_500;

/**
 * Lands every "#consult" link ON the quote form (owner, 1 November: "It should
 * take me directly to the form").
 *
 * The id sits on the form block itself, and app/family-adoption.css gives it a
 * zero scroll-margin so the root scroll-padding (header height plus a small
 * gap) is the only offset: the form heading and the first field sit directly
 * under the sticky header.
 *
 * Two things the browser alone gets wrong, and this fixes:
 * - A same-page "#consult" click must land in one instant jump that nothing
 *   can cancel halfway (any page section can set its own scroll-behavior).
 *   Same-page clicks are handled here with an instant scroll and a real
 *   history entry, so Back still returns to where the visitor was.
 * - On arrival from another page (/#consult, /contact#consult) the browser
 *   scrolls before lazy content above has settled. The landing is re-asserted
 *   for a short window while the page loads, and abandoned the moment the
 *   visitor scrolls, touches or presses a key themselves.
 *
 * Focus moves to the form heading (tabindex=-1, preventScroll) for screen
 * readers. No text field is focused: that would open the phone keyboard over
 * the form.
 */
export function QuoteFormAnchor({ id = "consult" }: { id?: string }) {
  useEffect(() => {
    const hash = `#${id}`;
    let userMoved = false;
    let settleTimer: number | undefined;

    const target = () => document.getElementById(id);
    const land = (focus: boolean) => {
      const el = target();
      if (!el) return;
      el.scrollIntoView({ block: "start", behavior: "instant" as ScrollBehavior });
      if (focus) {
        const heading = el.querySelector<HTMLElement>("[data-quote-form-heading]");
        heading?.focus({ preventScroll: true });
      }
    };

    const markMoved = () => {
      userMoved = true;
    };
    const settle = () => {
      userMoved = false;
      window.clearTimeout(settleTimer);
      const reassert = () => {
        if (!userMoved && window.location.hash === hash) land(false);
      };
      requestAnimationFrame(reassert);
      window.addEventListener("load", reassert, { once: true });
      void document.fonts?.ready.then(reassert);
      const started = Date.now();
      const tick = () => {
        reassert();
        if (!userMoved && Date.now() - started < SETTLE_MS) settleTimer = window.setTimeout(tick, 250);
      };
      settleTimer = window.setTimeout(tick, 250);
    };

    const onClick = (event: MouseEvent) => {
      if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      const link = (event.target as HTMLElement | null)?.closest?.("a[href]") as HTMLAnchorElement | null;
      if (!link || (link.target && link.target !== "_self")) return;
      let url: URL;
      try {
        url = new URL(link.href, window.location.href);
      } catch {
        return;
      }
      if (url.hash !== hash || url.origin !== window.location.origin || url.pathname !== window.location.pathname) return;
      if (!target()) return;
      event.preventDefault();
      if (window.location.hash !== hash) window.history.pushState(window.history.state, "", hash);
      land(true);
      settle();
    };

    const onHash = () => {
      if (window.location.hash !== hash) return;
      land(false);
      settle();
    };

    // Capture phase: runs before a Next <Link> handles the click, so a same-page
    // link (the family buttons are Links) lands here too and the heading takes focus.
    document.addEventListener("click", onClick, true);
    window.addEventListener("hashchange", onHash);
    window.addEventListener("popstate", onHash);
    for (const type of ["wheel", "touchstart", "keydown"] as const) {
      window.addEventListener(type, markMoved, { passive: true });
    }
    if (window.location.hash === hash) {
      land(true);
      settle();
    }
    return () => {
      window.clearTimeout(settleTimer);
      document.removeEventListener("click", onClick, true);
      window.removeEventListener("hashchange", onHash);
      window.removeEventListener("popstate", onHash);
      for (const type of ["wheel", "touchstart", "keydown"] as const) {
        window.removeEventListener(type, markMoved);
      }
    };
  }, [id]);

  return null;
}
