import { NextRequest, NextResponse } from "next/server";
import { randomBytes } from "crypto";
import { z } from "zod";
import { clientKeyFrom, rateLimit } from "@/lib/rateLimit";
import { SITE_CONFIG } from "@/shared/siteConfig";
import {
  MAX_REQUEST_FILES,
  requestFileExtension,
  requestFileMimeType,
  requestFileProblem,
  requestFileSafeName,
} from "@/shared/requestFiles";
import { detailsSecret, requestFilePrefix, verifyDetailsToken } from "@/server/services/consultationDetails";

/**
 * One file for a request that is already saved: a photo, a PDF or a drawing.
 *
 * Multipart with requestId, inquiryId, token (all from the /api/consultation
 * response) and one "file". The token proves this browser sent that request;
 * without it nothing is stored. Files go where this site already keeps lead
 * documents (stored_files in Postgres, via lib/storage/blob), under a key made
 * of the saved request's id and a random part, so every link is unguessable.
 * The links reach the destinations through /api/consultation/details.
 */

export const dynamic = "force-dynamic";

const fieldsSchema = z.object({
  requestId: z.string().uuid(),
  inquiryId: z.string().uuid(),
  token: z.string().max(200),
});

function absoluteStoredUrl(url: string): string {
  if (url.startsWith("http://") || url.startsWith("https://")) return url;
  return `${SITE_CONFIG.siteUrl.replace(/\/$/, "")}${url.startsWith("/") ? url : `/${url}`}`;
}

async function storedCount(prefix: string): Promise<number> {
  try {
    const { db } = await import("@/lib/db");
    if (!db) return 0;
    const { storedFiles } = await import("@/shared/schema");
    const { like, sql } = await import("drizzle-orm");
    const [row] = await db
      .select({ count: sql<number>`count(*)` })
      .from(storedFiles)
      .where(like(storedFiles.key, `${prefix}%`));
    return Number(row?.count ?? 0);
  } catch {
    return 0;
  }
}

export async function POST(request: NextRequest) {
  const limit = rateLimit(clientKeyFrom(request.headers, "consultation-files"), 30, 10 * 60 * 1000);
  if (!limit.ok) {
    return NextResponse.json({ ok: false, message: "Please wait a few minutes before adding more files." }, { status: 429 });
  }

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return NextResponse.json({ ok: false, message: "We could not read that file." }, { status: 400 });
  }
  if (String(form.get("website") ?? "")) {
    return NextResponse.json({ ok: false, message: "We could not accept that file." }, { status: 400 });
  }
  const fields = fieldsSchema.safeParse({
    requestId: form.get("requestId"),
    inquiryId: form.get("inquiryId"),
    token: form.get("token"),
  });
  if (!fields.success) return NextResponse.json({ ok: false, message: "Invalid request" }, { status: 400 });

  const check = verifyDetailsToken(fields.data, detailsSecret());
  if (check !== "ok") {
    return NextResponse.json(
      {
        ok: false,
        message:
          check === "expired"
            ? "This page has been open too long to add files. Text them to us instead."
            : "We could not match that file to your request.",
      },
      { status: check === "expired" ? 410 : 403 },
    );
  }

  const file = form.get("file");
  if (!(file instanceof File)) return NextResponse.json({ ok: false, message: "No file was sent." }, { status: 400 });
  const problem = requestFileProblem(file);
  if (problem) return NextResponse.json({ ok: false, message: problem }, { status: 400 });

  const prefix = requestFilePrefix(fields.data.requestId);
  if ((await storedCount(prefix)) >= MAX_REQUEST_FILES) {
    return NextResponse.json({ ok: false, message: `You can add up to ${MAX_REQUEST_FILES} files.` }, { status: 400 });
  }

  const ext = requestFileExtension(file) ?? "bin";
  const contentType = requestFileMimeType(file, ext);
  const key = `${prefix}${randomBytes(8).toString("hex")}-${requestFileSafeName(file.name, ext)}`;
  try {
    const { uploadFile } = await import("@/lib/storage/blob");
    const stored = await uploadFile(key, Buffer.from(await file.arrayBuffer()), contentType);
    return NextResponse.json({
      ok: true,
      file: { key, name: file.name.slice(0, 120), url: absoluteStoredUrl(stored), contentType, size: file.size },
    });
  } catch (error) {
    console.error("[consultation-files] Store failed:", error instanceof Error ? error.message : error);
    return NextResponse.json({ ok: false, message: "We could not save that file." }, { status: 503 });
  }
}
