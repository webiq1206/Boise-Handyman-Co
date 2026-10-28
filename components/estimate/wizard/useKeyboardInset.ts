"use client";

import { useEffect, useState } from "react";

/**
 * How many pixels the on-screen keyboard (or other viewport chrome) currently
 * hides at the bottom of the layout viewport.
 *
 * A fixed bottom action bar disappears behind the software keyboard on mobile
 * because the keyboard shrinks the *visual* viewport without moving the
 * *layout* viewport that `position: fixed` is measured against. We read the gap
 * from `visualViewport` and let the caller raise the bar by that amount so Back
 * and Continue stay reachable while a field is focused (C10 / D2).
 *
 * Returns 0 on the server, on browsers without `visualViewport`, and whenever
 * the keyboard is closed - so the bar rests on the safe-area padding as normal.
 *
 * Re-binds if `visualViewport` is replaced (test mocks) and also listens to
 * window resize / focusin so a late mock or OS keyboard still updates the inset.
 */
export function useKeyboardInset(): number {
  const [inset, setInset] = useState(0);

  useEffect(() => {
    const readGap = () => {
      const vv = window.visualViewport;
      if (!vv) {
        setInset(0);
        return;
      }
      // Distance from the bottom of the visual viewport to the bottom of the
      // layout viewport. Positive only while the keyboard (or a browser toolbar
      // overlay) is covering the page.
      const gap = window.innerHeight - (vv.height + vv.offsetTop);
      setInset(gap > 40 ? Math.round(gap) : 0);
    };

    readGap();

    const vv = window.visualViewport;
    vv?.addEventListener("resize", readGap);
    vv?.addEventListener("scroll", readGap);
    window.addEventListener("resize", readGap);
    // focusin: re-read after a field focuses — covers mocks installed after mount
    // and OS keyboards that update visualViewport slightly after focus.
    document.addEventListener("focusin", readGap);
    const interval = window.setInterval(readGap, 500);

    return () => {
      vv?.removeEventListener("resize", readGap);
      vv?.removeEventListener("scroll", readGap);
      window.removeEventListener("resize", readGap);
      document.removeEventListener("focusin", readGap);
      window.clearInterval(interval);
    };
  }, []);

  return inset;
}
