import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { consultationRequests } from "@/shared/schema";
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
  city: z.string().min(1).max(80),
  notes: z.string().max(1000).optional(),
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
    let leadSaved = false;
    let adminEmailAccepted = false;
    let customerEmailAccepted = false;

    if (db) {
      try {
        await db.insert(consultationRequests).values({
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
        leadSaved = true;
      } catch (dbErr) {
        console.error("[estimate-lead] DB insert failed:", dbErr);
      }
    }

    const dashboardDelivery = forwardToLeadDashboard({
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
      // A development no-op client does not deliver or retain a lead.
      if (client.__noop) throw new Error("Email delivery is not configured.");
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
        try {
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
          } else if (adminResult?.data?.id) {
            adminEmailAccepted = true;
          }
        } catch (error) {
          // One failed recipient must not prevent the remaining deliveries.
          console.error("[estimate-lead] Admin email request failed:", error);
        }
      }

      // Do not email a quote that the business has no record of receiving.
      const dashboardAccepted = await dashboardDelivery;
      if (leadSaved || adminEmailAccepted || dashboardAccepted) {
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
        } else if (customerResult?.data?.id) {
          customerEmailAccepted = true;
        }
      }
    } catch (emailErr) {
      console.error("[estimate-lead] Email send failed:", emailErr);
    }

    const dashboardAccepted = await dashboardDelivery;
    if (!leadSaved && !adminEmailAccepted && !dashboardAccepted) {
      return NextResponse.json(
        { message: "We could not save or send your request. Your selections are still here. Please try again, or call or text us." },
        { status: 503 },
      );
    }

    return NextResponse.json({ success: true, customerEmailAccepted });
  } catch (err) {
    console.error("[estimate-lead] Error:", err);
    return NextResponse.json({ message: "Server error" }, { status: 500 });
  }
}
