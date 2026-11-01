"use client";

import { useCallback, useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { requestHideMobileNavBar } from "@/lib/mobileNavBar";
import { ModalsContext, type ModalType } from "./modalsContext";

// The consult dialog and the estimator only render once a modal opens, so they
// load on demand. Imported statically, this provider (mounted in the root
// layout) put both, with the dialog primitives, react-hook-form, zod and the
// estimate engines, into the JavaScript every page downloads and evaluates
// before it is interactive.
const ConsultDialog = dynamic(() => import("./ConsultDialog").then((m) => m.ConsultDialog));
const EstimateCalculator = dynamic(() => import("@/components/EstimateCalculator").then((m) => m.EstimateCalculator));

export function ModalProvider({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState<ModalType>(null);
  // Once opened, the dialog stays mounted (closed) exactly as before, so its
  // close animation and focus return behave as they always did.
  const [consultMounted, setConsultMounted] = useState(false);
  useEffect(() => {
    if (open === "consult") setConsultMounted(true);
  }, [open]);

  const openConsult = useCallback(() => setOpen("consult"), []);
  const openEstimate = useCallback(() => setOpen("estimate"), []);
  const close = useCallback(() => setOpen(null), []);

  // The global mobile Call/Text bar sits above the dialog overlay; hide it
  // while a conversion modal is open so it never covers the dialog. Ref-counted
  // so it can't fight the inline estimate bar over the same flag.
  useEffect(() => {
    if (open === null) return;
    return requestHideMobileNavBar();
  }, [open]);

  return (
    <ModalsContext.Provider value={{ openConsult, openEstimate, close }}>
      {children}

      {(consultMounted || open === "consult") && (
        <ConsultDialog open={open === "consult"} onClose={close} onRevise={() => setOpen("estimate")} />
      )}

      {/* The estimator is its own full-screen experience beneath the site
          header (not a dialog inside a dialog): it owns the screen with its
          own scroll area and bottom-anchored input, and Exit returns here. */}
      {open === "estimate" && (
        <EstimateCalculator inModal sectionId="estimate-modal" onExit={close} onBookVisit={() => setOpen("consult")} />
      )}
    </ModalsContext.Provider>
  );
}
