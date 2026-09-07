import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/server/db";
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
import { forwardToLeadDashboard } from "@/server/services/leadDashboardForward";
import {
  calculateHandymanEstimate,
  formatHandymanCurrency,
  formatHours,
  JOB_CATEGORY_LABELS,
  URGENCY_LEVELS,
  type HandymanEstimate,
  type HandymanEstimateInput,
} from "@/shared/estimateEngine";
import { isServiceAreaCity } from "@/shared/contentData";
import { handymanEstimateSchema } from "@/shared/estimatePayload";
import {
  buildHandymanAdminEmailHtml,
  buildHandymanAdminSubject,
  buildHandymanCustomerEmailHtml,
  buildHandymanCustomerSubject,
  describeSelections,
  formatLeadReplyTo,
  type HandymanLeadDetails,
} from "./email";

const bodySchema = z.object({
  name: z.string().min(2).max(120),
  email: z.string().email(),
  /* Optional: the estimate is delivered by email, so email is the required
     channel. A phone that IS sent must still look like one. */
  phone: z
    .string()
    .optional()
    .default("")
    .refine((v) => v === "" || v.replace(/\D/g, "").length >= 10, {
      message: "Phone must be a valid 10-digit number when provided",
    }),
  city: z.string().min(1).max(80).refine(isServiceAreaCity, {
    message: "Choose a city in our service area",
  }),
  notes: z.string().max(1000).optional(),
  inquiryId: z.string().uuid(),
  website: z.string().max(0).optional(),
  attribution: z.record(z.string().max(100)).optional(),
  estimate: handymanEstimateSchema,
});

/**
 * The client's numbers are a cross-check, never the quote. The range in the
 * emails and the CRM comes from the same calculateHandymanEstimate the page
 * ran, re-executed here, so the page and the email can never disagree unless
 * the client was tampered with, and then the server's number wins.
 */
function verifyEstimate(payload: z.infer<typeof bodySchema>["estimate"]): {
  input: HandymanEstimateInput;
  estimate: HandymanEstimate;
} | null {
  const input: HandymanEstimateInput = {
    category: payload.category,
    tasks: payload.tasks,
    otherJob: payload.otherJob ?? null,
    materials: payload.materials,
    urgency: payload.urgency,
  };
  const estimate = calculateHandymanEstimate(input);
  if (!estimate) return null;

  if (estimate.priceLow !== payload.priceLow || estimate.priceHigh !== payload.priceHigh) {
    console.warn(
      `[estimate-lead] Estimate mismatch (client ${payload.priceLow}-${payload.priceHigh}, server ${estimate.priceLow}-${estimate.priceHigh}); using server values`,
    );
  }
  return { input, estimate };
}

export async function POST(request: NextRequest) {
  try {
    const raw = await request.json();
    const parsed = bodySchema.safeParse(raw);

    if (!parsed.success) {
      return NextResponse.json(
        { message: "Invalid request", errors: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const data = parsed.data;
    if (classifyLeadSpam({ honeypot: data.website, name: data.name, notes: data.notes }).spam)
      return NextResponse.json({ success: true, accepted: false, duplicate: true });
    const limit = rateLimit(clientKeyFrom(request.headers, "estimate-lead"), 8, 10 * 60 * 1000);
    if (!limit.ok) return NextResponse.json({ message: "Please wait a few minutes before trying again." }, { status: 429 });
    const verified = verifyEstimate(data.estimate);
    if (!verified) {
      return NextResponse.json(
        { message: "Pick at least one task before requesting an estimate." },
        { status: 400 },
      );
    }
    const { input, estimate } = verified;

    const categoryLabel = JOB_CATEGORY_LABELS[input.category].label;
    const urgencyLabel = URGENCY_LEVELS[input.urgency].label;
    const rangeText = `${formatHandymanCurrency(estimate.priceLow)} to ${formatHandymanCurrency(estimate.priceHigh)}`;
    const workLines = describeSelections(input);

    const accepted = await saveAcceptedLead(db, {
      inquiryId: data.inquiryId,
      route: "estimate-lead",
      contact: { email: data.email, phone: data.phone },
      scope: `${input.category}|${data.city}`,
      metadata: { hasAttribution: Boolean(data.attribution) },
      saveLead: async (tx) => {
        await tx.insert(consultationRequests).values({
          name: data.name,
          phone: data.phone,
          email: data.email,
          zip: "",
          address: null,
          city: data.city,
          projectType: categoryLabel,
          message: [
            "Submitted via instant estimator",
            `Work: ${workLines.join("; ") || categoryLabel}`,
            `Materials: ${input.materials === "we-pick-up" ? "we pick up" : "customer supplies"}`,
            `Timing: ${urgencyLabel}`,
            data.notes ? `Notes: ${data.notes}` : null,
          ]
            .filter(Boolean)
            .join(" | "),
          estimateProject: input.category,
          estimateFinish: null,
          estimateLow: estimate.priceLow.toString(),
          estimateHigh: estimate.priceHigh.toString(),
          estimateSqft: null,
          estimateConfidence: `${urgencyLabel} scheduling, ${formatHours(estimate.totalHours)} est.`,
        });
      },
    });
    if (!accepted.accepted) {
      if (accepted.duplicate) return NextResponse.json({ success: true, accepted: false, duplicate: true });
      return NextResponse.json({ message: "We could not save your request. Please try again." }, { status: 503 });
    }

    forwardToLeadDashboard({
      fullName: data.name,
      email: data.email,
      phone: data.phone,
      city: data.city,
      projectTypes: [categoryLabel],
      projectScope: `${categoryLabel} - ${rangeText} (${urgencyLabel})`,
      finalNotes: data.notes || undefined,
      estimateSummary: [
        `Requested work: ${workLines.join("; ") || categoryLabel}`,
        `Estimated hours: ${formatHours(estimate.totalHours)}`,
        `Materials: ${input.materials === "we-pick-up" ? "pick-up run added, billed at cost" : "customer supplies, billed at cost"}`,
        `Scheduling: ${urgencyLabel}`,
        ...estimate.lines.map((line) => `${line.label}: ${formatHandymanCurrency(line.amount)}`),
        `Range shown: ${rangeText}`,
      ].join("\n"),
      estimateLow: estimate.priceLow,
      estimateHigh: estimate.priceHigh,
      estimateRange: rangeText,
      source: "boisehandyman.co",
    });

    try {
      const { client, fromEmail } = await getUncachableEmailClient();
      const from = formatFromAddress(fromEmail);

      const lead: HandymanLeadDetails = {
        name: data.name,
        email: data.email,
        phone: data.phone,
        city: data.city,
        notes: data.notes,
      };

      const adminHtml = buildHandymanAdminEmailHtml(lead, input, estimate);
      /* SITE_CONFIG.email, never a hardcoded address: hello@boisehandyman.co
         comes from shared/siteConfig.ts and nowhere else. */
      const adminEmails = await getAdminRecipientEmails(SITE_CONFIG.email);
      for (const adminEmail of adminEmails) {
        const adminResult = await client.emails.send({
          from,
          replyTo: formatLeadReplyTo(data.name, data.email),
          to: adminEmail,
          subject: buildHandymanAdminSubject(lead, input, estimate),
          html: adminHtml,
          text: htmlToPlainText(adminHtml),
        });
        if (adminResult?.error) {
          console.error(
            `[estimate-lead] Admin email to ${adminEmail} failed:`,
            JSON.stringify(adminResult.error),
          );
        }
      }

      const customerHtml = buildHandymanCustomerEmailHtml(lead, input, estimate);
      const customerResult = await client.emails.send({
        from,
        replyTo: getReplyToAddress(),
        to: data.email,
        subject: buildHandymanCustomerSubject(estimate),
        html: customerHtml,
        text: htmlToPlainText(customerHtml),
      });
      if (customerResult?.error) {
        console.error(
          `[estimate-lead] Customer email to ${data.email} failed:`,
          JSON.stringify(customerResult.error),
        );
      }
    } catch (emailErr) {
      console.error("[estimate-lead] Email send failed:", emailErr);
    }

    return NextResponse.json({ success: true, accepted: true, duplicate: false });
  } catch (err) {
    console.error("[estimate-lead] Error:", err);
    return NextResponse.json({ message: "Server error" }, { status: 500 });
  }
}
