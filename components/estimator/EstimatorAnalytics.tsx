"use client";

/**
 * Sends the framed estimator's events to this site's own analytics.
 *
 * EstimatorFrame.tsx repeats each estimator event on this page as a
 * "p5-estimator-event" window event. This component listens and forwards them
 * through lib/analytics.ts, the same helpers the request form uses, so the
 * estimator shows up in this site's GA4, Google Ads and Meta reporting.
 *
 * A lead is counted on "estimator_completed" only (the estimator has accepted
 * the contact details and shown the range), once per page view. No other event
 * fires a lead conversion. Nothing here carries a name, email, phone or price.
 */

import { useEffect, useRef } from "react";
import { trackAcceptedLeadConversion, trackEvent, trackMetaEvent } from "@/lib/analytics";
import type { EstimatorEventDetail } from "./EstimatorFrame";

const EVENT_NAME = /^estimator_[a-z_]{1,40}$/;
const LEAD_EVENT = "estimator_completed";
/** The form/source label this site's reports use for estimator leads. */
const LEAD_SOURCE = "instant_estimator";

export default function EstimatorAnalytics() {
  const leadSent = useRef(false);

  useEffect(() => {
    const onEvent = (event: Event) => {
      const detail = (event as CustomEvent<EstimatorEventDetail>).detail;
      if (!detail || typeof detail.name !== "string" || !EVENT_NAME.test(detail.name)) return;
      const brand = typeof detail.brand === "string" ? detail.brand : "";
      const project = typeof detail.project === "string" ? detail.project : "";
      trackEvent(detail.name, { estimator_brand: brand, estimator_project: project });

      if (detail.name !== LEAD_EVENT || leadSent.current) return;
      leadSent.current = true;
      // The same three calls components/ConsultationForm.tsx makes once the
      // API accepts a lead: the Google Ads conversion, GA4 generate_lead and
      // the Meta Lead event (Pixel and Conversions API, deduplicated).
      trackAcceptedLeadConversion({ projectType: project || LEAD_SOURCE });
      trackEvent("generate_lead", {
        form: LEAD_SOURCE,
        project_type: project || LEAD_SOURCE,
        estimator_brand: brand,
        estimator_project: project,
      });
      trackMetaEvent("Lead", { content_name: project || LEAD_SOURCE, content_category: LEAD_SOURCE });
    };
    window.addEventListener("p5-estimator-event", onEvent);
    return () => window.removeEventListener("p5-estimator-event", onEvent);
  }, []);

  return null;
}
