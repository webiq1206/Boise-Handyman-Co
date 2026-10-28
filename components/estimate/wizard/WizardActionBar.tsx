"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowLeft, ArrowRight, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { requestHideMobileNavBar } from "@/lib/mobileNavBar";
import { useKeyboardInset } from "./useKeyboardInset";

export interface WizardActionBarProps {
  /** Back handler. Omit (or pass undefined) to hide the Back control. */
  onBack?: () => void;
  backLabel?: string;
  /** Primary/Continue handler. */
  onPrimary: () => void;
  primaryLabel: string;
  primaryDisabled?: boolean;
  /** When true, the primary button shows a spinner and is not clickable. */
  busy?: boolean;
  busyLabel?: string;
  /** Optional trailing icon on the primary button (default: arrow). */
  primaryIcon?: "arrow" | "none";
  /** Optional secondary control rendered between Back and Primary (e.g. Exit). */
  children?: React.ReactNode;
  /**
   * Optional strip rendered inside the sticky container, above the buttons -
   * e.g. the estimator's live price readout. Keeping it in the same sticky
   * element means one bottom cluster on a phone instead of stacked bars.
   */
  topAccessory?: React.ReactNode;
  tone?: "inverse" | "default";
  /** Hide the global mobile Call/Text bar while this bar owns the bottom edge. */
  ownsBottomEdge?: boolean;
  /**
   * Inside the one-screen AppFrame the frame's own footer is the bottom edge,
   * so the bar renders in flow: no fixed positioning, no keyboard inset (the
   * frame is fixed and the keyboard shrinks it instead).
   * When true (default), the bar docks to the visual viewport while the wizard
   * is on screen and rides `useKeyboardInset` so Back/Next stay above the
   * software keyboard (C10 / D2).
   */
  pinned?: boolean;
  className?: string;
  "data-testid"?: string;
}

/**
 * The one navigation pattern for every wizard step: a compact, always-reachable
 * bar pinned to the bottom of the flow. Back sits left and reads as secondary;
 * Continue sits right, fills the remaining width, and is unmistakably primary.
 *
 * Standalone flows (ConsultationForm) dock with `position: fixed` while the
 * wizard is in view so Back/Next stick to the visual viewport and clear the
 * software keyboard via the keyboard inset (C10 / D2). A matching spacer
 * reserves layout height so the last fields are never hidden under the dock.
 * Safe-area padding keeps the bar off the iPhone home indicator.
 */
export function WizardActionBar({
  onBack,
  backLabel = "Back",
  onPrimary,
  primaryLabel,
  primaryDisabled = false,
  busy = false,
  busyLabel,
  primaryIcon = "arrow",
  children,
  topAccessory,
  tone = "default",
  ownsBottomEdge = true,
  pinned = true,
  className,
  "data-testid": testId = "wizard-action-bar",
}: WizardActionBarProps) {
  const keyboardInset = useKeyboardInset();
  const barRef = useRef<HTMLDivElement | null>(null);
  const spacerRef = useRef<HTMLDivElement | null>(null);
  const [barHeight, setBarHeight] = useState(112);
  const [wizardInView, setWizardInView] = useState(true);

  // Dock only while the wizard cluster is on screen (or the keyboard is open).
  // Avoids a floating Continue over the home hero when #consult is below the fold.
  useEffect(() => {
    if (!pinned) return;
    const node = spacerRef.current;
    if (!node || typeof IntersectionObserver === "undefined") return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        setWizardInView(entry.isIntersecting);
      },
      { root: null, threshold: 0, rootMargin: "80px 0px 80px 0px" },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [pinned]);

  const docked = pinned && (wizardInView || keyboardInset > 0);

  // While the docked bar owns the bottom edge, the global Call/Text bar and the
  // assistant launcher step aside rather than stacking under or over Back/Continue.
  useEffect(() => {
    if (!ownsBottomEdge || !docked) return;
    return requestHideMobileNavBar();
  }, [ownsBottomEdge, docked]);

  useEffect(() => {
    if (!pinned) return;
    const node = barRef.current;
    if (!node || typeof ResizeObserver === "undefined") return;
    const measure = () => setBarHeight(Math.ceil(node.getBoundingClientRect().height));
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(node);
    return () => ro.disconnect();
  }, [pinned, docked, onBack, primaryLabel, topAccessory, busy]);

  const inverse = tone === "inverse";

  return (
    <>
      {pinned ? (
        <div
          ref={spacerRef}
          aria-hidden="true"
          data-wizard-action-bar-spacer=""
          style={{ height: docked ? barHeight : 0 }}
          className="pointer-events-none shrink-0"
        />
      ) : null}
      <div
        ref={barRef}
        data-wizard-action-bar=""
        data-wizard-action-bar-pinned={pinned ? "true" : "false"}
        data-wizard-action-bar-docked={docked ? "true" : "false"}
        data-testid={testId}
        style={
          docked
            ? {
                bottom: keyboardInset > 0 ? keyboardInset : 0,
              }
            : undefined
        }
        className={cn(
          docked
            ? "fixed inset-x-0 z-40 border-t px-4 pb-safe pt-3 backdrop-blur-md transition-[bottom] duration-150"
            : pinned
              ? "relative z-30 -mx-4 mt-6 border-t px-4 pb-safe pt-3 backdrop-blur-md"
              : "pt-1",
          (docked || pinned) &&
            (inverse
              ? "border-inverse-foreground/15 bg-inverse"
              : "border-border bg-background"),
          className,
        )}
      >
        {topAccessory && <div className="mx-auto max-w-3xl">{topAccessory}</div>}
        {/* Phones stack the controls - full-width Continue on top, Back beneath -
            because a long primary label ("Email me my estimate") next to Back
            overflows a 375px viewport. sm and up returns to the single row. */}
        <div
          className={cn(
            "mx-auto flex max-w-3xl flex-col-reverse gap-2.5 sm:flex-row sm:items-center sm:gap-3",
            docked || pinned ? "pb-3" : "pb-2",
          )}
        >
          {onBack ? (
            <Button
              type="button"
              variant={inverse ? "heroGhost" : "brandOutline"}
              onClick={onBack}
              disabled={busy}
              className="min-h-12 w-full flex-shrink-0 px-4 sm:w-auto"
              data-testid="wizard-back"
            >
              <ArrowLeft className="mr-1.5 h-4 w-4" aria-hidden="true" />
              {backLabel}
            </Button>
          ) : null}

          {children}

          <Button
            type="button"
            variant="brand"
            onClick={onPrimary}
            disabled={primaryDisabled || busy}
            aria-busy={busy}
            className="min-h-12 w-full text-base sm:w-auto sm:flex-1"
            data-testid="wizard-continue"
          >
            {busy ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
                {busyLabel ?? primaryLabel}
              </>
            ) : (
              <>
                {primaryLabel}
                {primaryIcon === "arrow" && (
                  <ArrowRight className="ml-2 h-4 w-4" aria-hidden="true" />
                )}
              </>
            )}
          </Button>
        </div>
      </div>
    </>
  );
}
