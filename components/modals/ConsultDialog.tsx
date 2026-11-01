"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ConsultationForm } from "@/components/ConsultationForm";

/** The "Book a handyman visit" dialog, loaded by ModalProvider the first time it opens. */
export function ConsultDialog({
  open,
  onClose,
  onRevise,
}: {
  open: boolean;
  onClose: () => void;
  onRevise: () => void;
}) {
  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-lg w-[95vw] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-sans font-light text-xl text-foreground">
            Book a handyman visit
          </DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground">
            No obligation - tell us what needs doing and we&apos;ll reply with an upfront quote.
          </DialogDescription>
        </DialogHeader>
        <ConsultationForm onRevise={onRevise} showTrust />
      </DialogContent>
    </Dialog>
  );
}
