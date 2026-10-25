import { NextRequest, NextResponse } from "next/server";
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
import { estimateSchema } from "@/shared/estimatePayload";
import { resolveQuotedRange } from "@/shared/costs/resolve";
import { forwardToLeadDashboard } from "@/server/services/leadDashboardForward";
import { readUnitCostOverrides } from "@/server/services/unitCostOverrides";
import {
  buildCrmIntakeFields,
  buildLeadPropertyRecord,
  buildLeadEstimateRecord,
  buildLeadNotes,
  resolveBudgetRange,
  buildProjectGoals,
} from "@/server/services/leadRecord";

const propertyProfileSchema = z
  .object({
    formattedAddress: z.string(),
    city: z.string(),
    state: z.string(),
    zip: z.string(),
  })
  .passthrough()
  .optional()
  .nullable();

// The consultation form may arrive with no estimate at all (someone who came
// straight to the contact page), so the shared object is wrapped as optional.
const optionalEstimateSchema = estimateSchema.optional().nullable();

const bodySchema = z
  .object({
    name: z.string().min(2),
    /**
     * Only the visitor's chosen contact method is required (see superRefine
     * below) - matches the same preferred-contact pattern already shipped in
     * the RE-10 wizard. Defaults to "email" so older cached client bundles
     * that never send this field behave exactly as before (email required).
     */
    preferredContact: z.enum(["email", "phone", "text"]).optional().default("email"),
    phone: z.string().optional().default(""),
    email: z.string().optional().default(""),
    /**
     * Optional because a new-build enquiry from someone who has not bought land
     * yet has no site to name. The client requires a locatable site for every
     * other project type; see LAND_SEARCH_PROJECT_TYPE in ConsultationForm.
     */
    address: z.string().max(300).optional().default(""),
    zip: z.string().optional(),
    projectType: z.string().min(1),
    message: z.string().optional(),
    propertyProfile: propertyProfileSchema,
    estimate: optionalEstimateSchema,
    /* Set by the client when the visitor already submitted the estimate gate,
       which already sent admin + customer emails via /api/estimate-lead.
       Prevents duplicate email sends when the same person submits both forms. */
    skipEmail: z.boolean().optional(),
    inquiryId: z.string().uuid(),
    website: z.string().max(0).optional(),
    attribution: z.record(z.string().max(100)).optional(),
    /** Short primary form. Requires a real email in addition to a phone number. */
    quick: z.literal(true).optional(),
    /**
     * Optional photos, plans, or inspection PDFs from the short request form.
     * Missing or unreadable files never reject the lead.
     */
    photos: z
      .array(
        z.object({
          name: z.string().min(1).max(80),
          type: z.enum(["image/jpeg", "image/png", "image/webp", "application/pdf"]),
          data: z.string().min(16).max(2_200_000),
        }),
      )
      .max(3)
      .optional(),
  })
  .superRefine((data, ctx) => {
    if ((data.preferredContact === "email" || data.quick) && !z.string().email().safeParse(data.email).success) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["email"], message: "Valid email required" });
    }
    if (data.preferredContact !== "email" && data.phone.replace(/\D/g, "").length < 10) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["phone"], message: "Valid phone required" });
    }
  });

/**
 * Recomputes the planning range server-side from the submitted inputs so a
 * stored lead never carries client-tampered or stale numbers. Returns null
 * (estimate rejected) if the inputs themselves are out of bounds.
 */
function decodeAttachment(file: {
  name: string;
  type: "image/jpeg" | "image/png" | "image/webp" | "application/pdf";
  data: string;
}): { filename: string; content: Buffer } | null {
  const cleaned = file.data.replace(/\s/g, "");
  if (!/^[A-Za-z0-9+/]+={0,2}$/.test(cleaned)) return null;
  const content = Buffer.from(cleaned, "base64");
  if (content.length < 8 || content.length > 1_600_000) return null;
  const safe = file.name.replace(/[^\w.\- ()]+/g, "").slice(0, 80) || "attachment";
  if (file.type === "application/pdf") {
    if (content.subarray(0, 4).toString("utf8") !== "%PDF") return null;
    return { filename: safe.toLowerCase().endsWith(".pdf") ? safe : `${safe}.pdf`, content };
  }
  if (file.type === "image/jpeg") {
    if (content[0] !== 0xff || content[1] !== 0xd8) return null;
    return { filename: /\.jpe?g$/i.test(safe) ? safe : `${safe}.jpg`, content };
  }
  if (file.type === "image/png") {
    if (content[0] !== 0x89 || content[1] !== 0x50 || content[2] !== 0x4e || content[3] !== 0x47) return null;
    return { filename: safe.toLowerCase().endsWith(".png") ? safe : `${safe}.png`, content };
  }
  if (content.subarray(0, 4).toString("utf8") !== "RIFF" || content.subarray(8, 12).toString("utf8") !== "WEBP") return null;
  return { filename: safe.toLowerCase().endsWith(".webp") ? safe : `${safe}.webp`, content };
}

function acceptedAttachments(photos: z.infer<typeof bodySchema>["photos"]) {
  const attachments: { filename: string; content: Buffer }[] = [];
  let total = 0;
  for (const photo of photos ?? []) {
    const decoded = decodeAttachment(photo);
    if (!decoded) continue;
    if (total + decoded.content.length > 3_200_000) break;
    total += decoded.content.length;
    attachments.push(decoded);
  }
  return attachments;
}

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
    const raw = await request.json();
    const parsed = bodySchema.safeParse(raw);

    if (!parsed.success) {
      return NextResponse.json(
        { message: "Invalid request", errors: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const data = parsed.data;
    const attachments = acceptedAttachments(data.photos);
    const fileNote = attachments.length > 0 ? `Files attached: ${attachments.map((file) => file.filename).join(", ")}` : "";
    const storedMessage = [data.message?.trim(), fileNote].filter(Boolean).join("\n\n");
    if (classifyLeadSpam({ honeypot: data.website, name: data.name, message: data.message }).spam)
      return NextResponse.json({ success: true, accepted: false, duplicate: true });
    const limit = rateLimit(clientKeyFrom(request.headers, "consultation"), 8, 10 * 60 * 1000);
    if (!limit.ok) return NextResponse.json({ message: "Please wait a few minutes before trying again." }, { status: 429 });

    // Server-side verification: never trust client-supplied dollar amounts.
    const estimate = data.estimate ? verifyEstimate(data.estimate) : null;

    const accepted = await saveAcceptedLead(db, {
      inquiryId: data.inquiryId,
      route: "consultation",
      contact: { email: data.email, phone: data.phone },
      scope: `${data.projectType}|${data.address || data.zip || (data.propertyProfile as { city?: string } | null)?.city || ""}`,
      metadata: { hasAttribution: Boolean(data.attribution), preferredContact: data.preferredContact },
      saveLead: async (tx) => {
        const profile = data.propertyProfile as Record<string, unknown> | null | undefined;
        await tx.insert(consultationRequests).values({
          name: data.name,
          phone: data.phone,
          email: data.email,
          zip: data.zip || "",
          address: data.address,
          city: (profile?.city as string) || null,
          propertyProfile: (data.propertyProfile as PropertyProfile | null) ?? null,
          projectType: data.projectType,
          message: storedMessage || null,
          estimateProject: estimate?.project || null,
          estimateFinish: estimate?.finish || null,
          estimateLow: estimate?.priceLow?.toString() || null,
          estimateHigh: estimate?.priceHigh?.toString() || null,
          estimateSqft: estimate?.sqft ?? null,
          estimateConfidence: estimate?.confidence || null,
        });
      },
    });
    if (!accepted.accepted) {
      if (accepted.duplicate) return NextResponse.json({ success: true, accepted: false, duplicate: true });
      return NextResponse.json({ message: "We could not save your request. Please try again." }, { status: 503 });
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
      message: storedMessage,
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
      finalNotes: storedMessage || undefined,
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
          message: storedMessage,
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
            attachments: attachments.length > 0 ? attachments : undefined,
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

    return NextResponse.json({ success: true, accepted: true, duplicate: false });
  } catch (err) {
    console.error("[consultation] Error:", err);
    return NextResponse.json({ message: "Server error" }, { status: 500 });
  }
}
