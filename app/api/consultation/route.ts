import { after, NextRequest, NextResponse } from "next/server";
import { createHash } from "crypto";
import { z } from "zod";
import { db } from "@/lib/db";
import { consultationRequests } from "@/shared/schema";
import { saveAcceptedLead } from "@/server/services/acceptedLead";
import { clientKeyFrom, rateLimit } from "@/lib/rateLimit";
import { classifyLeadSpam } from "@/server/services/leadSpam";
import { getUncachableEmailClient } from "@/server/services/emailTransport";
import { SITE_CONFIG } from "@/shared/siteConfig";
import {
  htmlToPlainText,
  getAdminRecipientEmails,
  formatFromAddress,
  getReplyToAddress,
} from "@/server/services/emailLayout";
import {
  buildAdminEmailHtml,
  buildCustomerEmailHtml,
  buildAdminSubject,
  buildCustomerSubject,
  formatLeadReplyTo,
  type VerifiedEstimate,
  type PropertyEnrichment,
  formatUsd,
} from "@/server/services/consultationEmail";
import type { PropertyProfile } from "@/shared/propertyProfile";
import {
  EMPTY_REFINEMENTS,
  calculateEstimate,
  countVisibleUserRefinements,
  getMaxRefinementFields,
  getProjectSizeConfig,
  getSetRefinementKeys,
  PROJECT_LABELS,
  type EstimateRefinements,
} from "@/shared/estimateEngine";
import {
  consultationBodySchema,
  optionalEstimateSchema,
  withPreferredContact,
} from "@/server/services/consultationRequest";
import { detailsSecret, issueDetailsToken } from "@/server/services/consultationDetails";
import { resolveQuotedRange } from "@/shared/costs/resolve";
import { forwardToLeadDashboard } from "@/server/services/leadDashboardForward";
import { forwardConsultationToP5Intake } from "@/server/services/p5IntakeBridge";
import { readUnitCostOverrides } from "@/server/services/unitCostOverrides";
import {
  buildCrmIntakeFields,
  buildLeadPropertyRecord,
  buildLeadEstimateRecord,
  buildLeadNotes,
  resolveBudgetRange,
  buildProjectGoals,
} from "@/server/services/leadRecord";

// The body schema lives in server/services/consultationRequest.ts so the full
// request and the "Have us call you" callback shape are tested without a
// database (tests/consultation-request.test.ts).
const bodySchema = consultationBodySchema;

/** Short stable hash of the visitor's own words, so a second, different list is its own request. */
function listFingerprint(message: string | undefined): string {
  const words = (message ?? "").toLowerCase().replace(/\s+/g, " ").trim();
  return words ? createHash("sha256").update(words).digest("hex").slice(0, 16) : "";
}

/**
 * Recomputes the planning range server-side from the submitted inputs so a
 * stored lead never carries client-tampered or stale numbers. Returns null
 * (estimate rejected) if the inputs themselves are out of bounds.
 */
function verifyEstimate(
  estimate: NonNullable<z.infer<typeof optionalEstimateSchema>>
): VerifiedEstimate | null {
  const sizeConfig = getProjectSizeConfig(estimate.project);
  if (estimate.sqft < sizeConfig.min || estimate.sqft > sizeConfig.max) {
    return null;
  }

  const refinements: EstimateRefinements = {
    ...EMPTY_REFINEMENTS,
    ...(estimate.refinements ?? {}),
  } as EstimateRefinements;

  const detailCount = countVisibleUserRefinements(estimate.project, getSetRefinementKeys(refinements));
  const guide = calculateEstimate(
    {
      project: estimate.project,
      finish: estimate.finish,
      sqft: estimate.sqft,
      refinements,
    },
    detailCount
  );
  // The quoted range comes from the line-item cost engine, via the same shared
  // resolver the calculator uses, so the page and the email can never disagree.
  const maxFields = getMaxRefinementFields(estimate.project);
  const lineItemRange = resolveQuotedRange(
    estimate.project,
    estimate.finish,
    estimate.sqft,
    refinements,
    maxFields > 0 ? detailCount / maxFields : 0,
  );
  const recomputed = { ...guide, ...(lineItemRange ?? {}) };

  if (
    estimate.priceLow !== recomputed.priceLow ||
    estimate.priceHigh !== recomputed.priceHigh
  ) {
    console.warn(
      `[consultation] Estimate mismatch (client ${estimate.priceLow}-${estimate.priceHigh}, server ${recomputed.priceLow}-${recomputed.priceHigh}); using server values`
    );
  }

  return {
    project: estimate.project,
    finish: estimate.finish,
    sqft: estimate.sqft,
    priceLow: recomputed.priceLow,
    priceHigh: recomputed.priceHigh,
    roi: recomputed.roi,
    confidence: estimate.confidence || recomputed.confidenceLabel,
    statedBudget: estimate.statedBudget ?? null,
    refinements,
    included: recomputed.included,
    layoutLabel: estimate.layoutLabel,
    upgradeLabels: estimate.upgradeLabels,
  };
}

export async function POST(request: NextRequest) {
  try {
    // JSON only. Files follow the saved request one upload each
    // (/api/consultation/files), so an upload can never delay or lose the lead.
    const raw: unknown = await request.json();
    const parsed = bodySchema.safeParse(raw);

    if (!parsed.success) {
      return NextResponse.json(
        { message: "Invalid request", errors: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const data = parsed.data;
    if (classifyLeadSpam({ honeypot: data.website, name: data.name, message: data.message }).spam)
      return NextResponse.json({ success: true, accepted: false, duplicate: true });
    const limit = rateLimit(clientKeyFrom(request.headers, "consultation"), 8, 10 * 60 * 1000);
    if (!limit.ok) return NextResponse.json({ message: "Please wait a few minutes before trying again." }, { status: 429 });

    // The pending-files line is added by the schema; the duplicate scope reads
    // the visitor's own words only.
    const listScope = listFingerprint(parsed.data.message?.split("\n\nFiles: ")[0]);

    // Server-side verification: never trust client-supplied dollar amounts.
    const estimate = data.estimate ? verifyEstimate(data.estimate) : null;

    const savedRow: { id: string | null } = { id: null };
    const accepted = await saveAcceptedLead(db, {
      inquiryId: data.inquiryId,
      route: "consultation",
      contact: { email: data.email, phone: data.phone },
      // A callback is its own request: asking for a call after sending a list
      // (or the other way round) must not read as a duplicate of the first.
      // The one-screen form sends no address or job type by default, so the
      // list itself (normalised, hashed) keeps a second, different list from
      // the same person this month from reading as a duplicate of the first.
      // The same list sent twice still is one.
      scope: `${data.requestKind === "callback" ? "callback|" : ""}${data.projectType}|${data.address || data.zip || (data.propertyProfile as { city?: string } | null)?.city || ""}|${listScope}`,
      metadata: {
        hasAttribution: Boolean(data.attribution),
        preferredContact: data.preferredContact,
        requestKind: data.requestKind,
        files: data.filesPending ?? 0,
      },
      saveLead: async (tx) => {
        const profile = data.propertyProfile as Record<string, unknown> | null | undefined;
        const [saved] = await tx.insert(consultationRequests).values({
          name: data.name,
          phone: data.phone,
          email: data.email,
          zip: data.zip || "",
          address: data.address,
          city: (profile?.city as string) || null,
          propertyProfile: (data.propertyProfile as PropertyProfile | null) ?? null,
          projectType: data.projectType,
          message: data.message || null,
          estimateProject: estimate?.project || null,
          estimateFinish: estimate?.finish || null,
          estimateLow: estimate?.priceLow?.toString() || null,
          estimateHigh: estimate?.priceHigh?.toString() || null,
          estimateSqft: estimate?.sqft ?? null,
          estimateConfidence: estimate?.confidence || null,
        }).returning({ id: consultationRequests.id });
        savedRow.id = saved?.id ?? null;
      },
    });
    if (!accepted.accepted) {
      if (accepted.duplicate) return NextResponse.json({ success: true, accepted: false, duplicate: true });
      return NextResponse.json({ message: "We could not save your request. Please try again." }, { status: 503 });
    }

    // HubSpot contact + mapped deal + lead_created mail live on p5 intake.
    // Started as soon as the lead is durable so it overlaps Resend, and kept
    // alive with after() so the visitor response does not wait on it.
    // Failures stay inside the bridge and cannot change this status.
    const location = (data.propertyProfile as PropertyProfile | null) ?? null;
    try {
      const bridge = forwardConsultationToP5Intake({
        attribution: data.attribution,
        name: data.name,
        email: data.email,
        phone: data.phone,
        address: data.address,
        city: location?.city,
        zip: data.zip || location?.zip,
        projectType: data.projectType,
        // The p5 intake has no contact-preference field, so the visitor's
        // choice (Call me, Text me, Email me) rides at the end of the summary.
        message: withPreferredContact(data.message, data.requestKind, data.preferredContact),
        inquiryId: data.inquiryId,
        requestKind: data.requestKind,
        preferredContact: data.preferredContact,
        bestTime: data.requestKind === "callback" ? data.bestTimeToCall : undefined,
        submissionKind: "initial",
      });
      after(() => bridge);
    } catch (bridgeErr) {
      console.error("[p5-intake] Could not schedule HubSpot bridge:", bridgeErr);
    }

    // Same complete record as the estimate-gate path, so a lead looks identical
    // in the CRM regardless of which form produced it. Address may be empty when
    // the enquiry is from someone still shopping for a lot.
    const crmLead = {
      name: data.name,
      phone: data.phone,
      email: data.email,
      address: data.address,
      zip: data.zip,
      projectType: data.projectType,
      message: data.message,
      preferredContact: data.preferredContact,
      requestKind: data.requestKind,
    };
    // Real unit costs entered in the admin pricing panel, applied to every
    // breakdown this request renders so the panel, emails and CRM agree.
    const unitCostOverrides = await readUnitCostOverrides();

    const crmProfile = (data.propertyProfile as PropertyEnrichment | null) ?? null;

    forwardToLeadDashboard({
      fullName: data.name,
      email: data.email,
      phone: data.phone,
      // Field names must match the dashboard's externalLeadSchema exactly; it
      // strips anything it does not recognise rather than erroring.
      propertyAddress: data.address || undefined,
      city: (data.propertyProfile as { city?: string; state?: string; zip?: string } | null)?.city || undefined,
      state: (data.propertyProfile as { city?: string; state?: string; zip?: string } | null)?.state || undefined,
      zip: data.zip || (data.propertyProfile as { city?: string; state?: string; zip?: string } | null)?.zip || undefined,
      projectTypes: data.projectType ? [data.projectType] : [],
      budgetRange: resolveBudgetRange(undefined, estimate),
      projectScope: estimate
        ? `${PROJECT_LABELS[estimate.project].label} - ${formatUsd(estimate.priceLow)} to ${formatUsd(estimate.priceHigh)} (${estimate.confidence})`
        : undefined,
      projectGoals: buildProjectGoals(estimate),
      // The homeowner's own words stay in finalNotes; the estimate record goes
      // to estimateSummary, which the dashboard sizes for it (20k vs 2k).
      finalNotes: data.message || undefined,
      estimate: estimate ? buildLeadEstimateRecord(estimate, unitCostOverrides) : undefined,
      // Zoning, lot size, assessed value, owner and occupancy as structured
      // fields, alongside the same rows the admin email renders.
      property: buildLeadPropertyRecord(crmProfile),
      // Structured intake fields the estimator can answer. See
      // buildCrmIntakeFields for why the rest stay deliberately empty.
      ...buildCrmIntakeFields(estimate),
      estimateSummary: buildLeadNotes(crmLead, estimate, crmProfile, unitCostOverrides),
      estimateLow: estimate?.priceLow,
      estimateHigh: estimate?.priceHigh,
      estimateRange: estimate
        ? `${formatUsd(estimate.priceLow)} to ${formatUsd(estimate.priceHigh)}`
        : undefined,
      source: "boisehandyman.co",
    });

    if (!data.skipEmail) {
      try {
        const { client, fromEmail } = await getUncachableEmailClient();
        const from = formatFromAddress(fromEmail);

        const lead = {
          name: data.name,
          phone: data.phone,
          email: data.email,
          address: data.address,
          zip: data.zip,
          projectType: data.projectType,
          message: data.message,
          preferredContact: data.preferredContact,
          requestKind: data.requestKind,
        };
        const enrichment = (data.propertyProfile as PropertyEnrichment | null) ?? null;

        // ---- Admin / internal-team email ------------------------------------
        // Reply-To is the LEAD, so hitting Reply in any mail client goes straight
        // to the customer.
        const adminHtml = buildAdminEmailHtml(lead, estimate, enrichment, unitCostOverrides);
        const adminEmails = await getAdminRecipientEmails(SITE_CONFIG.email);
        for (const adminEmail of adminEmails) {
          const adminResult = await client.emails.send({
            from,
            // No reply-to-the-lead shortcut when they didn't leave an email -
            // the admin email body still shows their preferred contact method.
            replyTo: data.email ? formatLeadReplyTo(data.name, data.email) : undefined,
            to: adminEmail,
            subject: buildAdminSubject(lead, estimate),
            html: adminHtml,
            text: htmlToPlainText(adminHtml),
          });
          if (adminResult?.error) {
            console.error(
              `[consultation] Admin email to ${adminEmail} failed:`,
              JSON.stringify(adminResult.error)
            );
          }
        }

        // ---- Customer / lead email ------------------------------------------
        // Includes the full estimate + every selection so the lead has it in
        // writing without ever logging in. Skipped entirely when the visitor
        // chose to be reached by phone/text and never gave an email address.
        if (data.email) {
          const customerHtml = buildCustomerEmailHtml(lead, estimate, unitCostOverrides);
          const customerResult = await client.emails.send({
            from,
            replyTo: getReplyToAddress(),
            to: data.email,
            subject: buildCustomerSubject(lead, estimate),
            html: customerHtml,
            text: htmlToPlainText(customerHtml),
          });
          if (customerResult?.error) {
            console.error(
              `[consultation] Customer email to ${data.email} failed:`,
              JSON.stringify(customerResult.error)
            );
          }
        }
      } catch (emailErr) {
        console.error("[consultation] Email send failed:", emailErr);
      }
    }

    // Step 2 ("Help us prepare") and the file uploads add to this same request.
    // The token is signed with a server secret and lives two hours; without a
    // secret the form says to text the files instead.
    const secret = detailsSecret();
    const requestId = savedRow.id;
    const followUp =
      requestId && secret ? { requestId, ...issueDetailsToken({ requestId, inquiryId: data.inquiryId }, secret) } : {};
    return NextResponse.json({ success: true, accepted: true, duplicate: false, ...followUp });
  } catch (err) {
    console.error("[consultation] Error:", err);
    return NextResponse.json({ message: "Server error" }, { status: 500 });
  }
}
