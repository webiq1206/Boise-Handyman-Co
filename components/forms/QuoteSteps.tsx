import { Check } from "lucide-react";

/**
 * The two steps, always in view above the request form: step 1 is the request
 * itself (the only part anyone has to complete), step 2 is optional photos and
 * details. Once the request is saved, step 1 reads "Request sent" with a tick,
 * so nobody is left wondering whether the extra questions are still part of
 * sending it. Styled by the "hm-form-steps" rules in app/family-adoption.css.
 */
export function QuoteSteps({ sent }: { sent: boolean }) {
  return (
    <ol className="hm-form-steps" data-quote-steps="" data-quote-sent={sent ? "true" : "false"}>
      <li className="is-current-or-done" aria-current={sent ? undefined : "step"}>
        <span className="hm-form-step-badge is-filled" aria-hidden="true">
          {sent ? <Check size={14} /> : "1"}
        </span>
        <span>
          <span className="sr-only">Step 1: </span>
          {sent ? "Request sent" : "Your request"}
        </span>
      </li>
      <li className={sent ? "is-current-or-done" : undefined} aria-current={sent ? "step" : undefined}>
        <span className="hm-form-step-badge" aria-hidden="true">
          2
        </span>
        <span>
          <span className="sr-only">Step 2: </span>
          Photos and details (optional)
        </span>
      </li>
    </ol>
  );
}
