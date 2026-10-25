"use client";

import { useState } from "react";
import { MessageSquare, Phone } from "lucide-react";
import { trackAcceptedLeadConversion, trackEvent, trackMetaEvent } from "@/lib/analytics";
import { inquiryId } from "@/lib/leadInquiry";
import { markEstimatorCompleted } from "@/lib/estimatorSession";
import { SITE_CONFIG } from "@/shared/siteConfig";
import styles from "./QuickRequest.module.css";

type ReadyFile = {
  id: string;
  name: string;
  type: "image/jpeg" | "application/pdf";
  data: string;
};

const MAX_FILES = 3;
const MAX_IMAGE_BYTES = 700_000;
const MAX_PDF_BYTES = 1_500_000;
const MAX_TOTAL_BASE64 = 3_800_000;

function safeName(name: string): string {
  const base = name.split(/[/\\]/).pop() || "attachment";
  const cleaned = base.replace(/[^\w.\- ()]+/g, "").slice(0, 80);
  return cleaned || "attachment";
}

function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = String(reader.result || "");
      const comma = result.indexOf(",");
      resolve(comma >= 0 ? result.slice(comma + 1) : result);
    };
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(blob);
  });
}

async function resizeToJpeg(file: File): Promise<Blob> {
  const bitmap = await createImageBitmap(file);
  try {
    const maxEdge = 1400;
    const scale = Math.min(1, maxEdge / Math.max(bitmap.width, bitmap.height));
    const width = Math.max(1, Math.round(bitmap.width * scale));
    const height = Math.max(1, Math.round(bitmap.height * scale));
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("resize");
    ctx.drawImage(bitmap, 0, 0, width, height);
    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/jpeg", 0.72));
    if (!blob) throw new Error("resize");
    return blob;
  } finally {
    bitmap.close();
  }
}

async function prepareFile(file: File): Promise<ReadyFile | { error: string }> {
  const lower = file.name.toLowerCase();
  const pdf = file.type === "application/pdf" || lower.endsWith(".pdf");
  const image = /^image\/(jpeg|png|webp)$/.test(file.type) || /\.(jpe?g|png|webp)$/.test(lower);
  if (!pdf && !image) return { error: `${file.name} needs to be a photo, a plan, or a PDF.` };
  if (pdf) {
    if (file.size > MAX_PDF_BYTES) {
      return { error: `${file.name} is too large to attach. You can still send the request and share it on the call.` };
    }
    const data = await blobToBase64(file);
    return { id: crypto.randomUUID(), name: safeName(file.name), type: "application/pdf", data };
  }
  const blob = await resizeToJpeg(file);
  if (blob.size > MAX_IMAGE_BYTES) {
    return { error: `${file.name} is still too large after resizing. Try a smaller photo, or send the request without it.` };
  }
  const data = await blobToBase64(blob);
  const stem = safeName(file.name).replace(/\.\w+$/, "") || "photo";
  return { id: crypto.randomUUID(), name: `${stem}.jpg`, type: "image/jpeg", data };
}

export function QuickRequest({
  id = "quick-request",
  heading,
  lede,
  frame = "card",
  callTestId = "link-quick-call",
}: {
  id?: string;
  heading?: string;
  lede?: string;
  frame?: "card" | "page";
  callTestId?: string;
}) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [project, setProject] = useState("");
  const [website, setWebsite] = useState("");
  const [files, setFiles] = useState<ReadyFile[]>([]);
  const [fileNote, setFileNote] = useState("");
  const [error, setError] = useState("");
  const [sending, setSending] = useState(false);
  const [done, setDone] = useState(false);

  async function onFiles(list: FileList | null) {
    if (!list || list.length === 0) return;
    const next = [...files];
    const notes: string[] = [];
    for (const file of Array.from(list)) {
      if (next.length >= MAX_FILES) {
        notes.push("You can attach up to 3 files. Anything past that was left off.");
        break;
      }
      try {
        const prepared = await prepareFile(file);
        if ("error" in prepared) {
          notes.push(prepared.error);
          continue;
        }
        const total = next.reduce((sum, item) => sum + item.data.length, prepared.data.length);
        if (total > MAX_TOTAL_BASE64) {
          notes.push(`${file.name} was left off so the request stays easy to send.`);
          continue;
        }
        next.push(prepared);
      } catch {
        notes.push(`${file.name} could not be attached. You can still send the request.`);
      }
    }
    setFiles(next);
    setFileNote(notes[0] ?? "");
  }

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (sending) return;
    const trimmedName = name.trim();
    const digits = phone.replace(/\D/g, "");
    const trimmedEmail = email.trim();
    const trimmedProject = project.trim();
    if (trimmedName.length < 2) {
      setError("Please enter your name.");
      return;
    }
    if (digits.length < 10) {
      setError("Please enter a phone number we can call.");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      setError("Please enter a valid email address.");
      return;
    }
    if (trimmedProject.length < 8) {
      setError("Tell us a little about what needs doing.");
      return;
    }
    setError("");
    setSending(true);
    try {
      const res = await fetch("/api/consultation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: trimmedName,
          preferredContact: "phone",
          phone: phone.trim(),
          email: trimmedEmail,
          quick: true,
          address: "",
          projectType: "task-list",
          message: trimmedProject,
          inquiryId: inquiryId("quick"),
          website,
          photos: files.length
            ? files.map((file) => ({ name: file.name, type: file.type, data: file.data }))
            : undefined,
        }),
      });
      const body = (await res.json().catch(() => null)) as { accepted?: boolean; message?: string } | null;
      if (!res.ok) throw new Error(body?.message || "Something went wrong. Please call us.");
      if (body?.accepted) {
        markEstimatorCompleted("consultation");
        trackAcceptedLeadConversion({ projectType: "task-list" });
        trackEvent("generate_lead", { form: "quick_request", project_type: "task-list" });
        trackMetaEvent("Lead", { content_name: "task-list", content_category: "quick_request" });
      }
      setDone(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong. Please call us.");
    } finally {
      setSending(false);
    }
  }

  const card = (
    <div className={`${styles.card} qr-root`} id={frame === "card" ? id : undefined}>
      {done ? (
        <div data-testid="quick-request-success">
          <p className={styles.success}>Request received. We will call you shortly.</p>
          <a className={styles.call} href={SITE_CONFIG.phoneHref}>
            <Phone size={18} aria-hidden="true" />
            Call {SITE_CONFIG.phone}
          </a>
        </div>
      ) : (
        <form onSubmit={onSubmit} data-testid="form-quick-request" noValidate>
          <div className={styles.actions}>
            <a className={styles.call} href={SITE_CONFIG.phoneHref} data-testid={callTestId}>
              <Phone size={18} aria-hidden="true" />
              Call
            </a>
            <button
              type="button"
              className={styles.chat}
              data-testid="button-quick-chat"
              onClick={() => window.dispatchEvent(new Event("p5:assistant-open"))}
            >
              <MessageSquare size={18} aria-hidden="true" />
              Chat
            </button>
          </div>
          <p className={styles.hours}>Mon to Fri 9 AM to 6 PM, Sat 9 AM to 4 PM</p>
          <div className={styles.row}>
            <label className={styles.field}>
              Name
              <input
                className={styles.input}
                name="name"
                autoComplete="name"
                value={name}
                onChange={(event) => setName(event.target.value)}
                required
                minLength={2}
                data-testid="input-quick-name"
              />
            </label>
            <label className={styles.field}>
              Phone
              <input
                className={styles.input}
                name="phone"
                type="tel"
                inputMode="tel"
                autoComplete="tel"
                value={phone}
                onChange={(event) => setPhone(event.target.value)}
                required
                data-testid="input-quick-phone"
              />
            </label>
          </div>
          <label className={styles.field}>
            Email
            <input
              className={styles.input}
              name="email"
              type="email"
              autoComplete="email"
              inputMode="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
              data-testid="input-quick-email"
            />
          </label>
          <label className={styles.field}>
            What needs doing?
            <textarea
              className={styles.textarea}
              name="project"
              rows={2}
              value={project}
              onChange={(event) => setProject(event.target.value)}
              required
              minLength={8}
              data-testid="input-quick-project"
            />
          </label>
          <label className={styles.file}>
            Attach photos, plans, or an inspection report (optional)
            <input
              className={styles.fileInput}
              type="file"
              name="attachments"
              accept="image/jpeg,image/png,image/webp,application/pdf,.jpg,.jpeg,.png,.webp,.pdf"
              multiple
              onChange={(event) => {
                void onFiles(event.target.files);
                event.target.value = "";
              }}
              data-testid="input-quick-files"
            />
          </label>
          {files.length > 0 && (
            <ul className={styles.files}>
              {files.map((file) => (
                <li key={file.id}>
                  <span>{file.name}</span>
                  <button
                    type="button"
                    onClick={() => setFiles((current) => current.filter((item) => item.id !== file.id))}
                  >
                    Remove
                  </button>
                </li>
              ))}
            </ul>
          )}
          {fileNote && <p className={styles.note}>{fileNote}</p>}
          <input
            className={styles.hp}
            tabIndex={-1}
            autoComplete="off"
            aria-hidden="true"
            value={website}
            onChange={(event) => setWebsite(event.target.value)}
            name="website"
          />
          {error && <p className={styles.error}>{error}</p>}
          <button type="submit" className={styles.submit} disabled={sending} data-testid="button-quick-submit">
            {sending ? "Sending" : "Send my request"}
          </button>
          <p className={styles.help}>We call you back to confirm the work. Files are optional.</p>
          <a className={styles.secondary} href="/estimate?review=1">
            Prefer a longer project review?
          </a>
        </form>
      )}
    </div>
  );

  if (frame === "page") {
    return (
      <section className={styles.page} id={id}>
        <div>
          <h1>{heading || "Send a request"}</h1>
          <p className={styles.lede}>
            {lede || "Tell us what needs doing, plus your email and phone. Photos, plans, and inspection reports are optional."}
          </p>
          {card}
        </div>
        <figure>
          <img
            src="/images/handyman/consult-doorstep-branded.webp"
            alt="A handyman and a homeowner reviewing a clipboard at a front door"
            width={1000}
            height={750}
          />
        </figure>
      </section>
    );
  }

  return card;
}
