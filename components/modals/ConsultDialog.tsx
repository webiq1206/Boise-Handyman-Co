"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ConsultationForm } from "@/components/ConsultationForm";

/**
 * The "Book a handyman visit" dialog, loaded by ModalProvider the first time it opens.
 * The dialog keeps its accessible title and description, visually hidden: the form's
 * own heading is the one heading on screen, with nothing else around the form.
 */
export function ConsultDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-lg w-[95vw] max-h-[90vh] overflow-y-auto">
        <DialogHeader className="sr-only">
          <DialogTitle>Book a handyman visit</DialogTitle>
          <DialogDescription>Tell us what needs doing and we will reply with a written quote. No obligation.</DialogDescription>
        </DialogHeader>
        <ConsultationForm headingLevel="h2" />
      </DialogContent>
    </Dialog>
  );
}
