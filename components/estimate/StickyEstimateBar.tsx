"use client";

import { useEffect, useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { cn } from "@/lib/utils";
import { AnimatedPrice } from "@/components/estimate/EstimateResultPanel";
import type { HandymanEstimate } from "@/shared/estimateEngine";
import { formatHandymanCurrency, HANDYMAN_RATE_DISCLAIMER } from "@/shared/estimateEngine";

export interface StickyEstimateBarProps {
  estimate: HandymanEstimate | null;
  /** Short selections summary, or a hint when nothing is selected yet. */
  summary: string;
  /** "inverse" when rendered on the dark estimator band. */
  tone?: "inverse" | "default";
  /** When false, dollar amounts are blurred until the customer submits contact info. */
  revealRange?: boolean;
}

/**
 * The live estimate readout for phones, rendered INSIDE the wizard's sticky
 * action bar (via WizardActionBar's topAccessory slot) rather than as its own
 * fixed bar. One bottom cluster - range on top, Back/Continue beneath - is the
 * app pattern; the previous design stacked a second fixed bar over the action
 * bar and buried the Continue button behind it on phones.
 *
 * Tapping the range expands the same line-item breakdown the desktop rail
 * shows, so no information is lost on mobile.
 */
export function StickyEstimateBar({
  estimate,
  summary,
  tone = "inverse",
  revealRange = true,
}: StickyEstimateBarProps) {
  const [expanded, setExpanded] = useState(false);
  const inverse = tone === "inverse";

  // Collapse the sheet when the range goes away (e.g. user changed the job).
  useEffect(() => {
    if (!estimate) setExpanded(false);
  }, [estimate]);

  const mutedText = inverse ? "text-inverse-muted" : "text-muted-foreground";
  const strongText = inverse ? "text-inverse-foreground" : "text-foreground";
  const hairline = inverse ? "border-inverse-foreground/15" : "border-border";

  const sheetId = "estimate-bar-sheet";

  return (
    <div data-testid="mobile-estimate-bar" className={`border-b ${hairline} mb-3`}>
      {expanded && estimate && (
        <div id={sheetId} className={`border-b ${hairline} pb-3 pt-1`} data-testid="estimate-bar-sheet">
          <ul className="space-y-1.5 mb-2">
            {estimate.customerLines.map((line) => (
              <li
                key={line.id}
                className={`flex items-baseline justify-between gap-3 text-xs leading-snug ${mutedText}`}
              >
                <span>{line.label}</span>
                <span
                  className={cn("tabular-nums", !revealRange && "blur-sm select-none")}
                  aria-hidden={!revealRange}
                >
                  {formatHandymanCurrency(line.amount)}
                </span>
              </li>
            ))}
            <li
              className={`flex items-baseline justify-between gap-3 border-t ${hairline} pt-1.5 text-xs leading-snug ${strongText}`}
            >
              <span>Estimated visit total</span>
              <span
                className={cn("tabular-nums", !revealRange && "blur-sm select-none")}
                aria-hidden={!revealRange}
              >
                {formatHandymanCurrency(estimate.total)}
              </span>
            </li>
          </ul>
          <p className={`text-caption leading-snug ${mutedText}`}>
            {HANDYMAN_RATE_DISCLAIMER}
          </p>
        </div>
      )}

      <button
        type="button"
        onClick={() => estimate && setExpanded((prev) => !prev)}
        disabled={!estimate}
        aria-expanded={estimate ? expanded : undefined}
        aria-controls={estimate ? sheetId : undefined}
        className="flex min-h-11 w-full items-center justify-between gap-3 py-1.5 text-left"
        data-testid="estimate-bar-toggle"
      >
        <span className={`text-caption uppercase tracking-wide ${mutedText}`}>
          {estimate ? "Estimated range" : "Your estimated range"}
        </span>
        <span className="flex items-center gap-2">
          {estimate ? (
            <span
              className={cn(
                `brc-display-num text-lg leading-tight tabular-nums ${strongText}`,
                !revealRange && "blur-sm select-none",
              )}
              data-testid="mobile-estimate-range"
              aria-live="polite"
              aria-atomic="true"
              aria-hidden={!revealRange}
            >
              <AnimatedPrice value={estimate.priceLow} />
              <span aria-hidden="true"> to </span>
              <AnimatedPrice value={estimate.priceHigh} />
            </span>
          ) : (
            <span
              className={`text-sm leading-tight ${strongText}`}
              data-testid="mobile-estimate-placeholder"
            >
              Make your selections to see it
            </span>
          )}
          {estimate &&
            (expanded ? (
              <ChevronDown className={`h-4 w-4 flex-shrink-0 ${mutedText}`} aria-hidden="true" />
            ) : (
              <ChevronUp className={`h-4 w-4 flex-shrink-0 ${mutedText}`} aria-hidden="true" />
            ))}
        </span>
      </button>
    </div>
  );
}
