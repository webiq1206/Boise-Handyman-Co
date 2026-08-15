"use client";

import { useEffect, useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { AnimatedPrice } from "@/components/estimate/EstimateResultPanel";
import { requestHideMobileNavBar } from "@/lib/mobileNavBar";
import type { HandymanEstimate } from "@/shared/estimateEngine";
import { formatHandymanCurrency, HANDYMAN_RATE_DISCLAIMER } from "@/shared/estimateEngine";

export interface StickyEstimateBarProps {
  /**
   * inline: fixed to the bottom of the viewport (replaces the global mobile
   * nav bar while active). modal: sticky to the bottom of the dialog scroll
   * area so it never floats mid-page.
   */
  mode: "inline" | "modal";
  /** Inline only: whether the estimator section is currently on screen. */
  visible?: boolean;
  estimate: HandymanEstimate | null;
  /** Short selections summary, or a hint when nothing is selected yet. */
  summary: string;
  ctaLabel: string;
  ctaDisabled?: boolean;
  onCta: () => void;
}

/**
 * Bottom-anchored estimate bar for mobile. Always pinned to the bottom of the
 * viewport (inline) or dialog (modal), safe-area aware, with a tap-to-expand
 * breakdown sheet once a range exists.
 */
export function StickyEstimateBar({
  mode,
  visible = true,
  estimate,
  summary,
  ctaLabel,
  ctaDisabled = false,
  onCta,
}: StickyEstimateBarProps) {
  const [expanded, setExpanded] = useState(false);
  const isInline = mode === "inline";

  // While the inline bar owns the bottom edge, hide the global Call/Text bar
  // instead of stacking two bars (modal visibility is handled by ModalProvider).
  // Ref-counted so overlapping requests release cleanly.
  useEffect(() => {
    if (!isInline || !visible) return;
    return requestHideMobileNavBar();
  }, [isInline, visible]);

  // Collapse the sheet when the range goes away (e.g. user changed the job).
  useEffect(() => {
    if (!estimate) setExpanded(false);
  }, [estimate]);

  if (isInline && !visible) return null;

  const sheetId = `estimate-bar-sheet-${mode}`;

  return (
    <div
      className={cn(
        isInline
          ? "fixed left-0 right-0 pb-safe border-t bottom-0 z-[120] lg:hidden bg-background/97 backdrop-blur-md border-border"
          : "sticky bottom-0 z-20 -mx-6 -mb-6 mt-4 border-t border-border bg-background/97 backdrop-blur-md pb-safe md:hidden"
      )}
      data-testid="mobile-estimate-bar"
    >
      {expanded && estimate && (
        <div
          id={sheetId}
          className="px-4 pt-4 pb-2 border-b border-border"
          data-testid="estimate-bar-sheet"
        >
          <p className="text-[11px] uppercase tracking-wide text-muted-foreground mb-2">
            {summary}
          </p>
          <div className="flex items-baseline justify-between gap-3 text-xs leading-snug text-muted-foreground mb-2">
            <span>Estimated visit total</span>
            <span className="tabular-nums">{formatHandymanCurrency(estimate.total)}</span>
          </div>
          <p className="text-[10px] leading-snug text-muted-foreground">
            {HANDYMAN_RATE_DISCLAIMER}
          </p>
        </div>
      )}

      <div className="flex items-center justify-between gap-3 px-4 py-2.5 max-w-6xl mx-auto">
        <button
          type="button"
          onClick={() => estimate && setExpanded((prev) => !prev)}
          disabled={!estimate}
          aria-expanded={estimate ? expanded : undefined}
          aria-controls={estimate ? sheetId : undefined}
          className="min-w-0 flex-1 text-left min-h-11 flex items-center gap-2"
          data-testid="estimate-bar-toggle"
        >
          <span className="min-w-0">
            <span className="block text-[10px] uppercase tracking-wide truncate text-muted-foreground">
              {estimate ? summary : "Your estimated range"}
            </span>
            {estimate ? (
              <span
                className="block text-lg leading-tight brc-display-num tabular-nums text-foreground"
                data-testid="mobile-estimate-range"
                aria-live="polite"
                aria-atomic="true"
              >
                <AnimatedPrice value={estimate.priceLow} />
                <span aria-hidden="true"> to </span>
                <AnimatedPrice value={estimate.priceHigh} />
              </span>
            ) : (
              <span
                className="block text-sm leading-tight text-foreground"
                data-testid="mobile-estimate-placeholder"
              >
                Make your selections to see it
              </span>
            )}
          </span>
          {estimate &&
            (expanded ? (
              <ChevronDown className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
            ) : (
              <ChevronUp className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
            ))}
        </button>

        <Button
          variant="brand"
          onClick={onCta}
          disabled={ctaDisabled}
          className="flex-shrink-0 px-5 py-2.5 text-xs"
          data-testid="mobile-button-get-estimate"
        >
          {ctaLabel}
        </Button>
      </div>
    </div>
  );
}
