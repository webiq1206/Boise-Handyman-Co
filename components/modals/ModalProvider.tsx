"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ConsultationForm } from "@/components/ConsultationForm";
import { EstimateCalculator } from "@/components/EstimateCalculator";
import { requestHideMobileNavBar } from "@/lib/mobileNavBar";
import { ModalsContext, type ModalType } from "./modalsContext";

export function ModalProvider({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState<ModalType>(null);

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

      <Dialog open={open === "consult"} onOpenChange={(v) => !v && close()}>
        <DialogContent className="max-w-lg w-[95vw] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-sans font-light text-xl text-foreground">
              Book a handyman visit
            </DialogTitle>
            <DialogDescription className="text-sm text-muted-foreground">
              No obligation - tell us what needs doing and we&apos;ll reply with an upfront quote.
            </DialogDescription>
          </DialogHeader>
          <ConsultationForm onRevise={() => setOpen("estimate")} showTrust />
        </DialogContent>
      </Dialog>

      <Dialog open={open === "estimate"} onOpenChange={(v) => !v && close()}>
        <DialogContent className="max-w-4xl w-[95vw] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-sans font-light text-xl text-foreground">
              Get your instant estimate
            </DialogTitle>
            <DialogDescription className="text-sm text-muted-foreground">
              A few quick choices, an instant range. Nothing is pre-selected or submitted
              until you say so.
            </DialogDescription>
          </DialogHeader>
          <EstimateCalculator inModal onBookVisit={() => setOpen("consult")} />
        </DialogContent>
      </Dialog>
    </ModalsContext.Provider>
  );
}
