import { after, NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { consultationRequests } from "@/shared/schema";
import { clientKeyFrom, rateLimit } from "@/lib/rateLimit";
import { SITE_CONFIG } from "@/shared/siteConfig";
import { jobLabel } from "@/shared/consultationChoices";
import { CALLBACK_MARKER } from "@/server/services/consultationRequest";
import {
  detailsBodySchema,
  detailsSecret,
  mergeDetails,
  requestFilePrefix,
  verifyDetailsToken,
  type DetailFile,
  type StoredLead,
} from "@/server/services/consultationDetails";
import { buildDetailsAddedEmailHtml, buildDetailsAddedSubject } from "@/server/services/consultationDetailsEmail";
import { forwardConsultationToP5Intake } from "@/server/services/p5IntakeBridge";
import { forwardToLeadDashboard } from "@/server/services/leadDashboardForward";
import { getUncachableEmailClient } from "@/server/services/emailTransport";
import { formatFromAddress, getAdminRecipientEmails, htmlToPlainText } from "@/server/services/emailLayout";
import { formatLeadReplyTo } from "@/server/services/consultationEmail";

/**
 * Step 2 of the request form, and the hand-off for files uploaded after it.
 *
 * Body: { requestId, inquiryId, token, details, files } where token is the one
 * /api/consultation issued with the saved request. The details merge into the
 * SAME row (never blanking an answer), a "DETAILS ADDED" block is appended to
 * its notes, and the same destinations the request went to hear about it: a
 * short "Details added" internal email, the lead dashboard, and the p5 intake
 * as a submission_kind "details" post (p5 merges it into the deal and its
 * HubSpot record). The same post twice is saved once and forwarded once.
 */

export const dynamic = "force-dynamic";

function absoluteStoredUrl(key: string): string {
  return `${SITE_CONFIG.siteUrl.replace(/\/$/, "")}/api/documents/local/${encodeURIComponent(key)}`;
}

async function loadFiles(requestId: string, keys: string[]): Promise<DetailFile[] | null> {
  const prefix = requestFilePrefix(requestId);
  const wanted = [...new Set(keys)];
  if (wanted.some((key) => !key.startsWith(prefix) || key.includes(".."))) return null;
  if (wanted.length === 0 || !db) return [];
  const { storedFiles } = await import("@/shared/schema");
  const { inArray } = await import("drizzle-orm");
  const rows = await db
    .select({ key: storedFiles.key, fileName: storedFiles.fileName, mimeType: storedFiles.mimeType, fileSize: storedFiles.fileSize })
    .from(storedFiles)
    .where(inArray(storedFiles.key, wanted));
  if (rows.length !== wanted.length) return null;
  // Keep the visitor's order, and show the name without the random key part.
  return wanted.map((key) => {
    const row = rows.find((item) => item.key === key)!;
    return {
      key,
      name: row.fileName.replace(/^[0-9a-f]{16}-/, ""),
      url: absoluteStoredUrl(key),
      contentType: row.mimeType,
      size: row.fileSize,
    };
  });
}

export async function POST(request: NextRequest) {
  const limit = rateLimit(clientKeyFrom(request.headers, "consultation-details"), 12, 10 * 60 * 1000);
  if (!limit.ok) {
    return NextResponse.json({ ok: false, message: "Please wait a few minutes before trying again." }, { status: 429 });
  }
  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    return NextResponse.json({ ok: false, message: "Invalid request" }, { status: 400 });
  }
  const parsed = detailsBodySchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json({ ok: false, message: "Check the details and try again.", errors: parsed.error.flatten() }, { status: 400 });
  }
  const body = parsed.data;
  if (body.website) return NextResponse.json({ ok: false, message: "We could not accept that." }, { status: 400 });

  const check = verifyDetailsToken(body, detailsSecret());
  if (check !== "ok") {
    return NextResponse.json(
      {
        ok: false,
        message:
          check === "expired"
            ? "This page has been open too long to add details. Call or text us and we will add them."
            : "We could not match these details to your request.",
      },
      { status: check === "expired" ? 410 : 403 },
    );
  }
  if (!db) return NextResponse.json({ ok: false, message: "We could not save that just now." }, { status: 503 });

  try {
    const { eq } = await import("drizzle-orm");
    const [row] = await db
      .select({
        id: consultationRequests.id,
        name: consultationRequests.name,
        phone: consultationRequests.phone,
        email: consultationRequests.email,
        zip: consultationRequests.zip,
        address: consultationRequests.address,
        city: consultationRequests.city,
        projectType: consultationRequests.projectType,
        message: consultationRequests.message,
      })
      .from(consultationRequests)
      .where(eq(consultationRequests.id, body.requestId))
      .limit(1);
    if (!row) return NextResponse.json({ ok: false, message: "We could not find that request." }, { status: 404 });

    const files = await loadFiles(body.requestId, body.files);
    if (!files) return NextResponse.json({ ok: false, message: "We could not match those files to your request." }, { status: 400 });
    if (Object.keys(body.details).every((key) => !body.details[key as keyof typeof body.details]) && files.length === 0) {
      return NextResponse.json({ ok: false, message: "There is nothing to save yet." }, { status: 400 });
    }

    const merged = mergeDetails(row as StoredLead, body.details, files, { projectLabel: jobLabel });
    if (merged.duplicate) return NextResponse.json({ ok: true, saved: true, duplicate: true });

    await db.update(consultationRequests).set(merged.update).where(eq(consultationRequests.id, row.id));

    const lead = {
      ...row,
      email: merged.update.email ?? row.email,
      address: merged.update.address ?? row.address,
      zip: merged.update.zip ?? row.zip,
      projectType: merged.update.projectType ?? row.projectType,
    };
    const isCallback = (row.message ?? "").startsWith(CALLBACK_MARKER);

    // p5 intake (HubSpot): kept alive after the response, never awaited.
    try {
      const bridge = forwardConsultationToP5Intake({
        name: lead.name,
        email: lead.email,
        phone: lead.phone,
        address: lead.address,
        city: lead.city,
        zip: lead.zip,
        projectType: lead.projectType,
        message: merged.block,
        inquiryId: body.inquiryId,
        requestKind: isCallback ? "callback" : "quote",
        bestTime: body.details.bestTimeToCall,
        timeline: body.details.timing,
        files: files.map(({ name, url, contentType, size }) => ({ name, url, contentType, size })),
        submissionKind: "details",
      });
      after(() => bridge);
    } catch (bridgeErr) {
      console.error("[p5-intake] Could not schedule the details bridge:", bridgeErr);
    }

    // Lead dashboard: it has no update call, so the details arrive as a note
    // on the same contact, marked as an addition to the earlier request.
    after(() =>
      forwardToLeadDashboard({
        fullName: lead.name,
        email: lead.email,
        phone: lead.phone,
        propertyAddress: lead.address || undefined,
        city: lead.city || undefined,
        zip: lead.zip || undefined,
        projectTypes: lead.projectType ? [lead.projectType] : [],
        finalNotes: `Added to the request sent earlier.\n\n${merged.block}`,
        estimateSummary: lead.message ? `${lead.message}\n\n${merged.block}` : merged.block,
        source: "boisehandyman.co",
      }).then(() => undefined),
    );

    // Short internal follow-up, after the response so the visitor never waits on mail.
    after(async () => {
      try {
        const { client } = await getUncachableEmailClient();
        const html = buildDetailsAddedEmailHtml(lead, merged.added);
        for (const to of await getAdminRecipientEmails(SITE_CONFIG.email)) {
          const result = await client.emails.send({
            from: formatFromAddress(),
            replyTo: lead.email ? formatLeadReplyTo(lead.name, lead.email) : undefined,
            to,
            subject: buildDetailsAddedSubject(lead),
            html,
            text: htmlToPlainText(html),
          });
          if (result?.error) console.error(`[consultation-details] Email to ${to} failed:`, JSON.stringify(result.error));
        }
      } catch (emailErr) {
        console.error("[consultation-details] Email send failed:", emailErr);
      }
    });

    return NextResponse.json({ ok: true, saved: true, duplicate: false });
  } catch (err) {
    console.error("[consultation-details] Error:", err);
    return NextResponse.json({ ok: false, message: "We could not save that just now." }, { status: 500 });
  }
}
