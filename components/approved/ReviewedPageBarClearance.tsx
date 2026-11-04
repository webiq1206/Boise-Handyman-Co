'use client';

import { useEffect } from 'react';

/** Mounted only by the three reviewed pages. The shared bar remains owned by
 * family chrome; this tracks its actual height when enlarged labels wrap. */
export function ReviewedPageBarClearance() {
  useEffect(() => {
    const bar = document.querySelector<HTMLElement>('[data-family-bar]');
    const spacer = document.querySelector<HTMLElement>('.fam-bar-spacer');
    if (!bar || !spacer || typeof ResizeObserver === 'undefined') return;
    const originalHeight = spacer.style.height;
    const root = document.documentElement;
    const originalClearance = root.style.getPropertyValue('--handyman-reviewed-bar-clearance');
    const update = () => {
      const height = `${bar.getBoundingClientRect().height}px`;
      spacer.style.height = height;
      root.style.setProperty('--handyman-reviewed-bar-clearance', height);
    };
    const observer = new ResizeObserver(update);
    observer.observe(bar);
    update();
    return () => {
      observer.disconnect();
      spacer.style.height = originalHeight;
      if (originalClearance) root.style.setProperty('--handyman-reviewed-bar-clearance', originalClearance);
      else root.style.removeProperty('--handyman-reviewed-bar-clearance');
    };
  }, []);
  return null;
}
