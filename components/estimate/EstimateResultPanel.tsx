"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronDown, Circle, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import type { HandymanEstimate } from "@/shared/estimateEngine";
import {
  formatHandymanCurrency,
  HANDYMAN_RATE_DISCLAIMER,
  MATERIALS_COST_NOTE,
  OVERSIZED_JOB_NOTE,
} from "@/shared/estimateEngine";

const ANIM_DURATION = 320;
const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);

/**
 * Counts up to `value` from whatever is currently shown. The animation depends
 * ONLY on the target value, so unrelated re-renders never interrupt or freeze
 * it. An interrupting value change picks up smoothly from the live displayed
 * number, and the tween always settles exactly on the target.
 */
export function AnimatedPrice({ value }: { value: number }) {
  const [display, setDisplay] = useState(value);
  const displayRef = useRef(value);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    const from = displayRef.current;
    const to = value;
    if (from === to) return;

    const prefersReducedMotion =
      typeof window !== "undefined" &&
      typeof window.matchMedia === "function" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (prefersReducedMotion) {
      displayRef.current = to;
      setDisplay(to);
      return;
    }

    const start =
      typeof performance !== "undefined" ? performance.now() : Date.now();

    const tick = (now: number) => {
      const elapsed = now - start;
      const t = Math.min(1, elapsed / ANIM_DURATION);
      if (t >= 1) {
        displayRef.current = to;
        setDisplay(to);
        rafRef.current = null;
        return;
      }
      const next = Math.round(from + (to - from) * easeOutCubic(t));
      displayRef.current = next;
      setDisplay(next);
      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);
    // rAF is paused while the tab is hidden (backgrounded phone, app switch),
    // which would leave a stale price on screen until the next repaint. This
    // timer guarantees the displayed number settles on the real target even
    // when no frame ever fires; it is a no-op when the tween finished.
    const settle = window.setTimeout(() => {
      if (displayRef.current !== to) {
        displayRef.current = to;
        setDisplay(to);
      }
    }, ANIM_DURATION + 100);
    return () => {
      window.clearTimeout(settle);
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
    };
  }, [value]);

  return (
    <span className="brc-display-num tabular-nums">{formatHandymanCurrency(display)}</span>
  );
}

export interface EstimateProgress {
  job: boolean;
  tasks: boolean;
  details: boolean;
}

function ProgressChecklist({ progress }: { progress: EstimateProgress }) {
  const items: { label: string; done: boolean }[] = [
    { label: "Pick the type of job", done: progress.job },
    { label: "Choose what needs doing", done: progress.tasks },
    { label: "Materials and timing", done: progress.details },
  ];

  return (
    <div className="space-y-2.5 mb-5" data-testid="estimate-progress-checklist">
      {items.map((item) => (
        <div
          key={item.label}
          className={cn(
            "flex items-center gap-2.5 text-sm",
            item.done ? "text-inverse-foreground" : "text-inverse-muted/70"
          )}
        >
          {item.done ? (
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-accent/30 flex-shrink-0">
              <Check className="h-3 w-3 text-inverse-foreground" />
            </span>
          ) : (
            <Circle className="h-5 w-5 flex-shrink-0 text-inverse-muted/40" strokeWidth={1.25} />
          )}
          {item.label}
        </div>
      ))}
    </div>
  );
}

export interface EstimateResultPanelProps {
  /** Null until the visitor has picked at least one task. */
  estimate: HandymanEstimate | null;
  /** One-line summary of what was selected. */
  summary: string;
  progress: EstimateProgress;
  /**
   * When false the dollar range and line-item amounts are blurred so the
   * customer must submit their details before seeing the actual numbers.
   * Defaults to true (fully visible).
   */
  revealRange?: boolean;
  /** One-screen contact step: tighter padding and a smaller range figure. */
  compact?: boolean;
  className?: string;
}

/**
 * The estimate surface: range, then the line breakdown that produced it (trip
 * fee, labor hours, supply run, urgency), then the honesty notes. Rendered on
 * the dark band, matching the wizard's inverse tone.
 */
export function EstimateResultPanel({
  estimate,
  summary,
  progress,
  revealRange = true,
  compact = false,
  className,
}: EstimateResultPanelProps) {
  const [notesOpen, setNotesOpen] = useState(false);
  const rangeAnnouncement = estimate
    ? `${formatHandymanCurrency(estimate.priceLow)} to ${formatHandymanCurrency(estimate.priceHigh)} estimated range`
    : "Make your selections to see your estimated range";
  // Placeholder shown wherever a dollar figure would appear before the visitor
  // has given us their contact details. It is a mask, not the real number under
  // a CSS blur: a blur is one devtools click from readable and the figure is
  // still in the DOM text, so the price was never actually gated. Dashes keep
  // the teased "there is a number here" look with nothing recoverable.
  const MASKED_AMOUNT = "$–––";

  return (
    <div
      className={cn(
        "rounded-sm bg-inverse text-inverse-foreground shadow-xl border border-inverse-foreground/10",
        compact ? "p-3.5" : "p-6 sm:p-7",
        className
      )}
      data-testid="estimate-result-panel"
    >
      <div className={cn("flex items-center justify-between", compact ? "mb-1.5" : "mb-3")}>
        <div className="brc-label text-inverse-muted">Estimated range</div>
        {estimate && (
          <div className="text-caption tracking-wide uppercase px-2 py-1 rounded-sm bg-inverse-foreground/15 text-inverse-foreground/90">
            Before materials
          </div>
        )}
      </div>

      {estimate ? (
        <>
          <p className="text-xs mb-2 text-inverse-muted">{summary}</p>

          <div
            className={cn("leading-none text-inverse-foreground", compact ? "text-[1.5rem] mb-1.5" : "text-[clamp(28px,3.4vw,42px)] mb-3")}
            data-testid="estimate-range"
            aria-live="polite"
            aria-atomic="true"
          >
            {revealRange ? (
              <>
                <span className="sr-only">{rangeAnnouncement}</span>
                <AnimatedPrice value={estimate.priceLow} />
                <span aria-hidden="true"> to </span>
                <AnimatedPrice value={estimate.priceHigh} />
              </>
            ) : (
              <span className="brc-display-num select-none blur-sm" aria-hidden="true">
                {MASKED_AMOUNT} to {MASKED_AMOUNT}
              </span>
            )}
          </div>

          {revealRange ? (
            <p className="text-caption text-inverse-muted mb-4" data-testid="rate-disclaimer">
              {HANDYMAN_RATE_DISCLAIMER}
            </p>
          ) : (
            <p className={cn("text-caption text-inverse-muted", compact ? "mb-2" : "mb-4")} data-testid="range-gate-note">
              Submit your details below to see your range.
            </p>
          )}

          <div
            className={cn("border-y border-inverse-foreground/10", compact ? "py-2 mb-2 space-y-1" : "py-3 mb-4 space-y-2")}
            data-testid="estimate-breakdown"
          >
            {estimate.customerLines.map((line) => (
              <div
                key={line.id}
                className="flex items-baseline justify-between gap-3 text-xs text-inverse-muted"
                data-testid={`estimate-line-${line.id}`}
              >
                <span>{line.label}</span>
                <span
                  className={cn(
                    "brc-display-num tabular-nums text-inverse-foreground/90",
                    !revealRange && "blur-sm select-none",
                  )}
                  aria-hidden={!revealRange}
                >
                  {revealRange ? formatHandymanCurrency(line.amount) : MASKED_AMOUNT}
                </span>
              </div>
            ))}
            <div className="flex items-baseline justify-between gap-3 pt-1 text-xs text-inverse-foreground border-t border-inverse-foreground/10">
              <span>Estimated visit total</span>
              <span
                className={cn(
                  "brc-display-num tabular-nums",
                  !revealRange && "blur-sm select-none",
                )}
                aria-hidden={!revealRange}
              >
                {revealRange ? formatHandymanCurrency(estimate.total) : MASKED_AMOUNT}
              </span>
            </div>
          </div>

          {estimate.oversized && (
            <p
              className="text-caption leading-relaxed text-inverse-muted mb-3"
              data-testid="oversized-note"
            >
              {OVERSIZED_JOB_NOTE}
            </p>
          )}

          <button
            type="button"
            onClick={() => setNotesOpen((prev) => !prev)}
            aria-expanded={notesOpen}
            aria-controls="estimate-materials-note"
            className="flex w-full items-center justify-center gap-1 text-caption text-inverse-muted hover:text-inverse-muted"
          >
            What about materials?
            <ChevronDown className={cn("h-3 w-3 transition-transform", notesOpen && "rotate-180")} />
          </button>
          {notesOpen && (
            <p
              id="estimate-materials-note"
              className="text-caption leading-relaxed text-inverse-muted mt-2"
              data-testid="materials-note"
            >
              {MATERIALS_COST_NOTE}
            </p>
          )}
        </>
      ) : (
        <>
          <div
            className="leading-none text-inverse-muted/50 text-[clamp(28px,3.4vw,42px)] mb-4"
            data-testid="estimate-range-placeholder"
            aria-live="polite"
            aria-atomic="true"
          >
            <span className="sr-only">{rangeAnnouncement}</span>
            <span aria-hidden="true" className="brc-display-num">
              $ - to -
            </span>
          </div>

          <p className="text-sm leading-relaxed text-inverse-muted mb-5">
            Nothing is pre-selected. Your estimated range appears as soon as you
            pick what needs doing, and it reflects only what you tell us.
          </p>

          <ProgressChecklist progress={progress} />

          <p className="text-caption leading-relaxed text-inverse-muted border-t border-inverse-foreground/10 pt-4">
            Takes about a minute. {HANDYMAN_RATE_DISCLAIMER}
          </p>
        </>
      )}
    </div>
  );
}
