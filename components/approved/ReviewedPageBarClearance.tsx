'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';

/** Mounted only by the three reviewed pages. The shared bar remains owned by
 * family chrome; this tracks actual header/bar clearance and returns oversized
 * ordinary sticky headings to normal flow when enlarged text needs room. */
export function ReviewedPageBarClearance() {
  const pathname = usePathname();
  useEffect(() => {
    const bar = document.querySelector<HTMLElement>('[data-family-bar]');
    const spacer = document.querySelector<HTMLElement>('.fam-bar-spacer');
    const header = document.querySelector<HTMLElement>('[data-family-header]');
    if (!bar || !spacer || typeof ResizeObserver === 'undefined') return;
    const originalHeight = spacer.style.height;
    const root = document.documentElement;
    const originalClearance = root.style.getPropertyValue('--handyman-reviewed-bar-clearance');
    const originalHeaderClearance = root.style.getPropertyValue('--handyman-reviewed-header-clearance');
    const sticky = [...document.querySelectorAll<HTMLElement>('.ed-split > [class~="lg:sticky"], .approved-interior .interior-project-aside, #how-we-build > .f-sticky')];
    const originalSticky = new Map<HTMLElement, string | null>(sticky.map(node => [node, node.getAttribute('data-reviewed-static-sticky')] as const));
    const update = () => {
      const barHeight = bar.getBoundingClientRect().height;
      const headerHeight = header?.getBoundingClientRect().height ?? 0;
      const height = `${barHeight}px`;
      spacer.style.height = height;
      root.style.setProperty('--handyman-reviewed-bar-clearance', height);
      if (header) root.style.setProperty('--handyman-reviewed-header-clearance', `${headerHeight}px`);
      const gap = parseFloat(getComputedStyle(root).getPropertyValue('--space-5')) || 20;
      const available = window.innerHeight - headerHeight - barHeight - gap;
      for (const node of sticky) {
        if (window.innerWidth < 1024 || node.getBoundingClientRect().height > available) node.setAttribute('data-reviewed-static-sticky', '');
        else node.removeAttribute('data-reviewed-static-sticky');
      }
    };
    const observer = new ResizeObserver(update);
    observer.observe(bar);
    if (header) observer.observe(header);
    for (const node of sticky) observer.observe(node);
    window.addEventListener('resize', update);
    update();
    return () => {
      observer.disconnect();
      window.removeEventListener('resize', update);
      spacer.style.height = originalHeight;
      if (originalClearance) root.style.setProperty('--handyman-reviewed-bar-clearance', originalClearance);
      else root.style.removeProperty('--handyman-reviewed-bar-clearance');
      if (originalHeaderClearance) root.style.setProperty('--handyman-reviewed-header-clearance', originalHeaderClearance);
      else root.style.removeProperty('--handyman-reviewed-header-clearance');
      for (const [node, value] of originalSticky) {
        if (value === null) node.removeAttribute('data-reviewed-static-sticky');
        else node.setAttribute('data-reviewed-static-sticky', value);
      }
    };
  }, [pathname]);
  return null;
}
