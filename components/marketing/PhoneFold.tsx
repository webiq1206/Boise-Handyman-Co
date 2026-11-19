'use client';

/**
 * A group that is tap-to-open on phones and always open from tablet up. The
 * heading is the summary of a native <details>, so the body stays in the HTML
 * for search and assistive technology. From 701px the summary is plain text:
 * it cannot be toggled and shows no open or close mark.
 */
import { useEffect, useRef, type MouseEvent, type ReactNode } from 'react';

const WIDE = '(min-width: 701px)';

export function PhoneFold({
  summary,
  children,
  className = '',
  open = false,
}: {
  summary: ReactNode;
  children: ReactNode;
  className?: string;
  /** Open on phones too when the page first loads. */
  open?: boolean;
}) {
  const ref = useRef<HTMLDetailsElement>(null);

  useEffect(() => {
    const details = ref.current;
    if (!details || typeof window.matchMedia !== 'function') return;
    const query = window.matchMedia(WIDE);
    const sync = () => {
      if (query.matches) details.open = true;
    };
    sync();
    query.addEventListener('change', sync);
    return () => query.removeEventListener('change', sync);
  }, []);

  const keepOpenWhenWide = (event: MouseEvent<HTMLElement>) => {
    if (typeof window.matchMedia === 'function' && window.matchMedia(WIDE).matches) event.preventDefault();
  };

  return (
    <details ref={ref} className={`lx-fold ${className}`.trim()} open={open}>
      <summary onClick={keepOpenWhenWide}>{summary}</summary>
      <div className="lx-fold-body">{children}</div>
    </details>
  );
}
