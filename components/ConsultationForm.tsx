"use client";

import { EstimatorRecovery } from "@/components/estimate/recovery/EstimatorRecovery";
import { markEstimatorCompleted } from "@/lib/estimatorSession";

import { useEffect, useId, useRef, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { MessageSquare, Phone, X } from "lucide-react";
import type { StoredEstimate } from "@/shared/estimateEngine";
import { formatPlanningCurrency } from "@/shared/estimateEngine";
import { DisplayNum } from "@/components/marketing/DisplayNum";
import { AttachmentTile, type AttachmentStatus, type PickedFile } from "@/components/forms/AttachmentTile";
import { CTA_FORM_CALLBACK, CTA_FORM_SEND } from "@/shared/ctaCopy";
import { CONSULT_BULLETS } from "@/shared/siteContent";
import { SITE_CONFIG } from "@/shared/siteConfig";
import { JOB_CHOICES, TIMING_OPTIONS, jobLabel } from "@/shared/consultationChoices";
import { partitionRequestFiles } from "@/shared/requestFiles";
import { trackEvent, trackMetaEvent, trackAcceptedLeadConversion } from "@/lib/analytics";
import { requireConsultationReceipt } from "@/lib/consultationReceipt";
import { inquiryId } from "@/lib/leadInquiry";
import { readStoredPrefill, PREFILL_UPDATED_EVENT, hasPassedGate } from "@/lib/leadPrefill";

/**
 * The request form every "Send your list and photos" lands on (homepage and
 * contact #consult, the paid landing pages, the /handyman funnel and the
 * consult dialog).
 *
 * Two steps (owner, 1 November 2026: the easiest form there is, and the more
 * information the better). Step 1 is one short screen that captures the
 * request: the list first, an optional attachment tile, name, phone, optional
 * email, how to reach you, one send. "Have us call you" reduces it to name,
 * phone and an optional best time. Step 2 sits on the success screen: an
 * optional "Help us prepare" panel whose answers and files are added to the
 * SAME request (POST /api/consultation/details with the signed token the
 * request returned), never a second lead.
 *
 * Files never ride with the request: it is sent first, so an upload can never
 * delay or lose it, then each file uploads on its own and the success screen
 * says which ones did not, with a retry and a text link.
 *
 * Native elements only (input, textarea, select, radio), so nothing here sets
 * state during hydration and every control is announced as itself.
 */

type Mode = "request" | "callback";
type Reach = "phone" | "text" | "email";
type Field = "message" | "files" | "name" | "phone" | "email";
type Errors = Partial<Record<Field, string>>;

/** Values match the server's preferredContact enum (phone = call). */
const REACH_OPTIONS: { value: Reach; label: string }[] = [
  { value: "phone", label: "Call" },
  { value: "text", label: "Text" },
  { value: "email", label: "Email" },
];
/** The site has a text line, so a text reply is the default. */
const DEFAULT_REACH: Reach = "text";
/** Same list as BEST_TIMES_TO_CALL in server/services/consultationRequest.ts. */
const BEST_TIMES = ["Any time", "Morning", "Midday", "Afternoon"] as const;
const FIELD_ORDER: Field[] = ["message", "files", "name", "phone", "email"];
const LIST_PLACEHOLDER = "For example: patch two doorknob holes, fix a leaky kitchen faucet, hang three shelves";

const DRAFT_KEY = "handyman_consult_form_v3";

interface Draft {
  mode?: Mode;
  name?: string;
  phone?: string;
  email?: string;
  message?: string;
  reach?: Reach;
  bestTime?: string;
}

function readDraft(): Draft {
  try {
    const raw = sessionStorage.getItem(DRAFT_KEY);
    return raw ? (JSON.parse(raw) as Draft) : {};
  } catch {
    return {};
  }
}

function writeDraft(draft: Draft) {
  try {
    sessionStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
  } catch {
    /* draft is best-effort */
  }
}

function clearDraft() {
  try {
    sessionStorage.removeItem(DRAFT_KEY);
  } catch {
    /* ignore */
  }
}

function digits(value: string): string {
  return value.replace(/\D/g, "");
}

function validEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

let fileSeq = 0;
function pick(files: File[]): PickedFile[] {
  return files.map((file) => ({ id: `f${(fileSeq += 1)}`, file, status: "ready" as const }));
}

interface ConsultationFormProps {
  onRevise?: () => void;
  /** Compact trust bullets below the form (used in the modal variant). */
  showTrust?: boolean;
  initialProjectType?: "drywall-repair" | "home-maintenance";
  /** The form's own heading. Callback mode always reads "Request a call". */
  heading?: string;
  /** h2 on a page, h3 inside the dialog (which has its own title). */
  headingLevel?: "h2" | "h3";
}

interface Submitted {
  mode: Mode;
  name: string;
  phone: string;
  email: string;
  reach: Reach;
  projectType: string;
  hadList: boolean;
}

/** What /api/consultation returns for a saved request, used by uploads and Step 2. */
interface FollowUp {
  requestId: string;
  inquiryId: string;
  token: string;
}

type Upload = PickedFile & { status: AttachmentStatus; key?: string };

export function ConsultationForm({
  onRevise,
  showTrust = false,
  initialProjectType,
  heading = "Send your list",
  headingLevel = "h2",
}: ConsultationFormProps = {}) {
  const uid = useId();
  const ids = (name: string) => `${uid}-${name}`;
  const [mode, setMode] = useState<Mode>("request");
  const [message, setMessage] = useState("");
  const [files, setFiles] = useState<PickedFile[]>([]);
  const [fileNote, setFileNote] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [reach, setReach] = useState<Reach>(DEFAULT_REACH);
  const [bestTime, setBestTime] = useState<string>(BEST_TIMES[0]);
  const [website, setWebsite] = useState("");
  const [estimate, setEstimate] = useState<StoredEstimate | null>(null);
  const [attached, setAttached] = useState(true);
  const [touched, setTouched] = useState<Partial<Record<Field, boolean>>>({});
  const [submitTried, setSubmitTried] = useState(false);
  const [submitted, setSubmitted] = useState<Submitted | null>(null);
  const [success, setSuccess] = useState(false);
  const [followUp, setFollowUp] = useState<FollowUp | null>(null);
  const [uploads, setUploads] = useState<Upload[]>([]);
  const [forwardError, setForwardError] = useState("");
  const formRef = useRef<HTMLFormElement>(null);
  const successHeadingRef = useRef<HTMLHeadingElement>(null);
  const lastKeyRef = useRef<string | null>(null);
  const draftHydrated = useRef(false);
  /** Uploaded file keys already handed to the request (by the upload run or Step 2). */
  const forwardedRef = useRef<Set<string>>(new Set());
  const uploadsRef = useRef<Upload[]>([]);
  const callback = mode === "callback";
  const Heading = headingLevel;

  // Restore a draft across refresh or browser Back within the visit. Files
  // cannot be restored by a browser, so they are never part of it.
  useEffect(() => {
    if (draftHydrated.current) return;
    draftHydrated.current = true;
    const draft = readDraft();
    if (draft.mode === "callback") setMode("callback");
    if (draft.name) setName(draft.name);
    if (draft.phone) setPhone(draft.phone);
    if (draft.email) setEmail(draft.email);
    if (draft.message) setMessage(draft.message);
    if (draft.reach && REACH_OPTIONS.some((o) => o.value === draft.reach)) setReach(draft.reach);
    if (draft.bestTime) setBestTime(draft.bestTime);
  }, []);

  useEffect(() => {
    if (success || !draftHydrated.current) return;
    writeDraft({ mode, name, phone, email, message, reach, bestTime });
  }, [mode, name, phone, email, message, reach, bestTime, success]);

  // A Meta lead form click or an earlier form on this visit may already know who this is.
  useEffect(() => {
    function applyPrefill() {
      const pf = readStoredPrefill();
      if (pf.name) setName((value) => value || pf.name || "");
      if (pf.phone) setPhone((value) => value || pf.phone || "");
      if (pf.email) setEmail((value) => value || pf.email || "");
    }
    applyPrefill();
    window.addEventListener(PREFILL_UPDATED_EVENT, applyPrefill);
    return () => window.removeEventListener(PREFILL_UPDATED_EVENT, applyPrefill);
  }, []);

  // A planning range from the estimator on this visit rides along with the request.
  useEffect(() => {
    function loadEstimate() {
      if (initialProjectType) return;
      try {
        const raw = sessionStorage.getItem("brc_estimate");
        if (!raw) {
          lastKeyRef.current = null;
          setEstimate(null);
          return;
        }
        const parsed: StoredEstimate = JSON.parse(raw);
        if (!parsed.project || !parsed.finish || !parsed.sqft || !parsed.priceLow) return;
        const key = `${parsed.project}|${parsed.finish}|${parsed.sqft}|${parsed.priceLow}|${parsed.priceHigh}|${parsed.confidenceLabel}`;
        if (key === lastKeyRef.current) return;
        lastKeyRef.current = key;
        setEstimate(parsed);
        setAttached(true);
      } catch {
        /* no stored range */
      }
    }
    loadEstimate();
    window.addEventListener("brc_estimate_updated", loadEstimate);
    return () => window.removeEventListener("brc_estimate_updated", loadEstimate);
  }, [initialProjectType]);

  useEffect(() => {
    if (!success) return;
    const el = successHeadingRef.current;
    if (el && el.offsetParent !== null) {
      // Inside the dialog, scroll its own body back to the top; on a page,
      // bring the success message under the sticky header.
      let ancestor: HTMLElement | null = el.parentElement;
      let scrolledContainer = false;
      while (ancestor && ancestor !== document.body && ancestor !== document.documentElement) {
        const overflowY = getComputedStyle(ancestor).overflowY;
        if ((overflowY === "auto" || overflowY === "scroll") && ancestor.scrollHeight > ancestor.clientHeight) {
          ancestor.scrollTo({ top: 0, behavior: "auto" });
          scrolledContainer = true;
          break;
        }
        ancestor = ancestor.parentElement;
      }
      if (!scrolledContainer) {
        const rect = el.getBoundingClientRect();
        if (rect.top < 80 || rect.bottom > window.innerHeight) {
          window.scrollTo({ top: Math.max(0, rect.top + window.scrollY - 96), behavior: "auto" });
        }
      }
    }
    el?.focus({ preventScroll: true });
  }, [success]);

  function validate(): Errors {
    const errors: Errors = {};
    if (!callback && message.trim().length < 3) errors.message = "Tell us in a few words what needs doing.";
    if (name.trim().length < 2) errors.name = "Enter your name.";
    const phoneDigits = digits(phone).length;
    if (phoneDigits < 10 || phoneDigits > 15) errors.phone = "Enter a phone number with the area code.";
    if (callback) return errors;
    const cleanEmail = email.trim();
    if (cleanEmail && !validEmail(cleanEmail)) errors.email = "Check the email address.";
    else if (!cleanEmail && reach === "email") errors.email = "Add your email so we can email you back.";
    return errors;
  }

  const errors = validate();
  const shown = (field: Field) => ((submitTried || touched[field]) && errors[field]) || "";
  const touch = (field: Field) => () => setTouched((current) => ({ ...current, [field]: true }));
  const engaged = Boolean(name || phone || message || email || files.length);

  const formStartedRef = useRef(false);
  function trackFormStart() {
    if (formStartedRef.current) return;
    formStartedRef.current = true;
    trackEvent("form_start", { form: "consultation" });
  }

  /* ───────────── files after the request is saved */

  async function uploadOne(item: Upload, receipt: FollowUp): Promise<Upload> {
    const body = new FormData();
    body.set("requestId", receipt.requestId);
    body.set("inquiryId", receipt.inquiryId);
    body.set("token", receipt.token);
    body.set("file", item.file);
    try {
      const res = await fetch("/api/consultation/files", { method: "POST", body });
      const json = await res.json().catch(() => ({}));
      if (!res.ok || !json?.ok || typeof json.file?.key !== "string") return { ...item, status: "failed" };
      return { ...item, status: "done", key: json.file.key };
    } catch {
      return { ...item, status: "failed" };
    }
  }

  async function postDetails(
    receipt: FollowUp,
    details: Record<string, string | undefined>,
    keys: string[],
  ): Promise<{ ok: boolean; message?: string }> {
    try {
      const res = await fetch("/api/consultation/details", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...receipt, details, files: keys }),
      });
      const json = await res.json().catch(() => ({}));
      return res.ok && json?.ok ? { ok: true } : { ok: false, message: json?.message };
    } catch {
      return { ok: false };
    }
  }

  /** Uploads what still needs uploading, then hands the new links to the request. */
  async function sendFiles(list: Upload[], receipt: FollowUp) {
    let current = list.map((item) => (item.status === "done" ? item : { ...item, status: "uploading" as const }));
    uploadsRef.current = current;
    setUploads(current);
    for (const item of current) {
      if (item.status !== "uploading") continue;
      const result = await uploadOne(item, receipt);
      current = current.map((entry) => (entry.id === item.id ? result : entry));
      uploadsRef.current = current;
      setUploads(current);
    }
    uploadsRef.current = current;
    const keys = claimPending();
    if (keys.length === 0) return;
    const sent = await postDetails(receipt, {}, keys);
    if (sent.ok) {
      setForwardError("");
    } else {
      releaseKeys(keys);
      setForwardError("Your files are saved, but we could not add them to your request yet.");
    }
  }

  /** Keys uploaded but not yet handed to the request, marked as handed. */
  function claimPending(): string[] {
    const keys = uploadsRef.current
      .filter((item) => item.status === "done" && item.key && !forwardedRef.current.has(item.key))
      .map((item) => item.key as string);
    for (const key of keys) forwardedRef.current.add(key);
    return keys;
  }

  function releaseKeys(keys: string[]) {
    for (const key of keys) forwardedRef.current.delete(key);
  }

  const mutation = useMutation({
    mutationFn: async (data: Submitted) => {
      const isCallback = data.mode === "callback";
      const id = inquiryId(isCallback ? "callback" : "primary");
      const payload = {
        name: data.name,
        phone: data.phone,
        email: isCallback ? "" : data.email,
        preferredContact: isCallback ? "phone" : data.reach,
        address: "",
        zip: "",
        // Blank is filed as "task-list" by the server; Step 2 can refine it.
        projectType: data.projectType,
        message: isCallback ? undefined : message.trim(),
        requestKind: isCallback ? "callback" : "quote",
        bestTimeToCall: isCallback ? bestTime : undefined,
        filesPending: !isCallback && files.length > 0 ? files.length : undefined,
        propertyProfile: null,
        skipEmail: hasPassedGate() ? true : undefined,
        // A callback after a list (or the other way round) is its own inquiry.
        inquiryId: id,
        website,
        estimate:
          !isCallback && estimate && attached
            ? {
                project: estimate.project,
                finish: estimate.finish,
                priceLow: estimate.priceLow,
                priceHigh: estimate.priceHigh,
                roi: estimate.roi,
                confidence: estimate.confidenceLabel,
                sqft: estimate.sqft,
                refinements: estimate.refinements,
                layoutLabel: estimate.layoutLabel,
                upgradeLabels: estimate.upgradeLabels,
              }
            : null,
      };
      const res = await fetch("/api/consultation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || "We could not send that. Try again, or call us.");
      }
      const json = await res.json();
      const receipt = requireConsultationReceipt(json);
      const next: FollowUp | null =
        typeof json.requestId === "string" && typeof json.token === "string"
          ? { requestId: json.requestId, inquiryId: id, token: json.token }
          : null;
      return { ...receipt, followUp: next };
    },
    onSuccess: (response: { accepted?: boolean; followUp: FollowUp | null }, variables) => {
      setSuccess(true);
      setFollowUp(response.followUp);
      clearDraft();
      try {
        sessionStorage.removeItem("brc_estimate");
      } catch {
        /* Optional browser storage must not hide a saved receipt. */
      }
      if (response.accepted) {
        markEstimatorCompleted("consultation");
        trackAcceptedLeadConversion({ projectType: variables.projectType });
        trackEvent("generate_lead", {
          form: "consultation",
          project_type: variables.projectType,
          has_estimate: !!estimate && attached,
        });
        trackMetaEvent("Lead", {
          content_name: variables.projectType,
          content_category: "consultation_request",
        });
      }
      // Files follow the saved request, one upload each.
      if (variables.mode === "request" && files.length > 0) {
        const list: Upload[] = files.map((item) => ({ ...item, status: "ready" }));
        setUploads(list);
        if (response.followUp) void sendFiles(list, response.followUp);
      }
    },
    onError: () => {
      trackEvent("form_error", { form: "consultation", reason: "submit_failed" });
    },
  });

  function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (mutation.isPending) return;
    setSubmitTried(true);
    const found = validate();
    const first = FIELD_ORDER.find((field) => found[field]);
    if (first) {
      trackEvent("form_error", { form: "consultation", fields: Object.keys(found).sort().join(",") });
      formRef.current?.querySelector<HTMLElement>(`[data-field="${first}"]`)?.focus();
      return;
    }
    const data: Submitted = {
      mode,
      name: name.trim(),
      phone: phone.trim(),
      email: callback ? "" : email.trim(),
      reach,
      projectType: initialProjectType || (estimate && attached && !callback ? estimate.project : "") || "task-list",
      hadList: !callback && message.trim().length > 0,
    };
    setSubmitted(data);
    mutation.mutate(data);
  }

  function addFiles(incoming: File[]) {
    const { accepted, problems } = partitionRequestFiles(incoming, files.map((item) => item.file));
    if (accepted.length) setFiles((current) => [...current, ...pick(accepted)]);
    setFileNote(problems.join(" "));
  }

  if (success) {
    const wasCallback = submitted?.mode === "callback";
    const failed = uploads.filter((item) => item.status === "failed");
    const busy = uploads.some((item) => item.status === "uploading");

    return (
      // data-family-bar-yield (here and on the request form): the family mobile bar steps aside
      // while the form, this success screen or its Step 2 is on screen
      // (components/family/MobileActionBar.tsx).
      <div className="hm-form hm-form-done" data-testid="consultation-success" data-clarity-mask="True" data-family-bar-yield="">
        <div role="status" className="hm-form-done-head">
          <Heading ref={successHeadingRef} tabIndex={-1} data-clarity-mask="True" className="hm-form-title">
            Thanks{submitted ? `, ${submitted.name.split(" ")[0]}` : ""}. We have your request.
          </Heading>
          <p className="hm-form-lead">
            {wasCallback
              ? `We call you back at ${submitted?.phone} within one business day.`
              : "We review your list and reply with a written quote. Scheduling is confirmed after the scope and quote are agreed."}
          </p>
          <p className="hm-form-next">
            Need us sooner?{" "}
            <a className="hm-form-inline-link" href={SITE_CONFIG.phoneHref} data-testid="link-consult-success-phone">
              Call {SITE_CONFIG.phone}
            </a>
          </p>
        </div>

        {uploads.length > 0 && (
          <div className="hm-form-uploads" data-testid="consult-upload-status" data-clarity-mask="True" aria-live="polite">
            <p className="hm-form-uploads-title">
              {!followUp
                ? "We could not add your files on this page."
                : busy
                  ? "Adding your files to the request"
                  : failed.length
                    ? `${failed.length === 1 ? "One file" : `${failed.length} files`} did not upload.`
                    : "Your files are with your request."}
            </p>
            <ul className="hm-tile-chips">
              {uploads.map((item) => (
                <li key={item.id} className={`hm-tile-chip is-${followUp ? item.status : "failed"}`} data-testid="upload-row">
                  <span className="hm-tile-chip-text">
                    <span className="hm-tile-chip-name">{item.file.name}</span>
                    <span className="hm-tile-chip-meta">
                      {!followUp
                        ? "Not uploaded"
                        : item.status === "uploading"
                          ? "Uploading"
                          : item.status === "done"
                            ? "Added"
                            : item.status === "failed"
                              ? "Did not upload"
                              : "Waiting"}
                    </span>
                  </span>
                </li>
              ))}
            </ul>
            {forwardError && <p className="hm-form-error-text">{forwardError}</p>}
            {(failed.length > 0 || forwardError || !followUp) && !busy && (
              <div className="hm-form-upload-actions">
                {followUp && (
                  <button
                    type="button"
                    className="hm-form-text"
                    onClick={() => void sendFiles(uploads, followUp)}
                    data-testid="button-retry-uploads"
                  >
                    Try again
                  </button>
                )}
                <a className="hm-form-text" href={SITE_CONFIG.phoneSmsHref} data-testid="link-text-files">
                  Text {failed.length === 1 ? "it" : "them"} to us
                </a>
              </div>
            )}
          </div>
        )}

        {followUp && submitted && (
          <DetailsPanel
            followUp={followUp}
            submitted={submitted}
            headingLevel={headingLevel === "h2" ? "h3" : "h4"}
            initialProjectType={initialProjectType}
            uploadOne={uploadOne}
            postDetails={postDetails}
            claimPending={claimPending}
            releaseKeys={releaseKeys}
          />
        )}
      </div>
    );
  }

  const describedBy = (field: Field, hint?: string) =>
    [hint, shown(field) ? ids(`${field}-error`) : ""].filter(Boolean).join(" ") || undefined;
  const fieldError = (field: Field) => (
    <p id={ids(`${field}-error`)} className="hm-form-error-text" aria-live="polite" data-testid={`error-${field}`}>
      {shown(field)}
    </p>
  );
  const errorCount = Object.keys(errors).length;

  const talk = (
    <div className="hm-form-talk">
      <p className="hm-form-talk-title">Prefer to talk?</p>
      <div className="hm-form-talk-actions">
        <a className="hm-form-call" href={SITE_CONFIG.phoneHref} data-testid="link-consult-form-call">
          <Phone size={18} aria-hidden="true" />
          Call {SITE_CONFIG.phone}
        </a>
        <a className="hm-form-text" href={SITE_CONFIG.phoneSmsHref} data-testid="link-consult-form-text">
          Text us
        </a>
        <button
          type="button"
          className="hm-form-chat"
          onClick={() => window.dispatchEvent(new Event("p5:assistant-open"))}
          data-testid="button-consult-form-chat"
        >
          <MessageSquare size={18} aria-hidden="true" />
          Chat
        </button>
      </div>
    </div>
  );

  return (
    <div className="hm-form" data-family-bar-yield="">
      <EstimatorRecovery
        flow="consultation"
        currentStep={engaged ? "filling" : "form"}
        currentStepIndex={engaged ? 1 : 0}
        totalSteps={2}
        lastCompletedStep={engaged ? "form" : undefined}
        selections={{ project_type: callback ? "Callback request" : initialProjectType || "task-list" }}
        validationErrors={Object.keys(submitTried ? errors : {})}
        engaged={engaged}
        submitted={success}
      />
      <form
        ref={formRef}
        onSubmit={onSubmit}
        onFocusCapture={trackFormStart}
        noValidate
        aria-labelledby={ids("title")}
        className="hm-form-body"
        data-testid="consultation-wizard"
        data-step={mode}
        data-clarity-mask="True"
      >
        <Heading className="hm-form-title" id={ids("title")} tabIndex={-1} data-quote-form-heading="">
          {callback ? "Request a call" : heading}
        </Heading>

        <fieldset className="hm-form-mode">
          <legend className="sr-only">How do you want to start?</legend>
          <label className="hm-form-pill">
            <input
              type="radio"
              name={ids("mode")}
              value="request"
              checked={!callback}
              onChange={() => setMode("request")}
              data-testid="request-mode-request"
            />
            <span>Send a request</span>
          </label>
          <label className="hm-form-pill">
            <input
              type="radio"
              name={ids("mode")}
              value="callback"
              checked={callback}
              onChange={() => setMode("callback")}
              data-testid="request-mode-callback"
            />
            <span>Have us call you</span>
          </label>
        </fieldset>

        {!callback && (
          <>
            <div className="hm-form-field">
              <label htmlFor={ids("message")}>Your list</label>
              <textarea
                id={ids("message")}
                data-field="message"
                data-testid="textarea-message"
                name="message"
                rows={3}
                value={message}
                onChange={(event) => setMessage(event.target.value)}
                onBlur={touch("message")}
                placeholder={LIST_PLACEHOLDER}
                aria-required="true"
                aria-invalid={shown("message") ? true : undefined}
                aria-describedby={describedBy("message")}
                maxLength={2000}
              />
              {fieldError("message")}
            </div>

            <div data-field="files" tabIndex={-1}>
              <AttachmentTile
                id={ids("files")}
                files={files}
                onAdd={addFiles}
                onRemove={(fileId) => {
                  setFiles((current) => current.filter((item) => item.id !== fileId));
                  setFileNote("");
                }}
                message={fileNote}
              />
            </div>
          </>
        )}

        <div className="hm-form-field">
          <label htmlFor={ids("name")}>Name</label>
          <input
            id={ids("name")}
            data-field="name"
            data-testid="input-name"
            name="name"
            autoComplete="name"
            value={name}
            onChange={(event) => setName(event.target.value)}
            onBlur={touch("name")}
            aria-required="true"
            aria-invalid={shown("name") ? true : undefined}
            aria-describedby={describedBy("name")}
            maxLength={100}
          />
          {fieldError("name")}
        </div>

        <div className="hm-form-field">
          <label htmlFor={ids("phone")}>Phone</label>
          <input
            id={ids("phone")}
            data-field="phone"
            data-testid="input-phone"
            name="phone"
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            value={phone}
            onChange={(event) => setPhone(event.target.value)}
            onBlur={touch("phone")}
            aria-required="true"
            aria-invalid={shown("phone") ? true : undefined}
            aria-describedby={describedBy("phone")}
            maxLength={30}
          />
          {fieldError("phone")}
        </div>

        {callback ? (
          <div className="hm-form-field">
            <label htmlFor={ids("best-time")}>Best time to call (optional)</label>
            <select
              id={ids("best-time")}
              name="bestTimeToCall"
              value={bestTime}
              onChange={(event) => setBestTime(event.target.value)}
              aria-describedby={ids("best-time-hint")}
              data-testid="select-best-time"
            >
              {BEST_TIMES.map((time) => (
                <option key={time} value={time}>
                  {time}
                </option>
              ))}
            </select>
            <p className="hm-form-hint" id={ids("best-time-hint")}>
              We call during business hours (Mon to Fri 9 AM to 6 PM, Sat 9 AM to 4 PM).
            </p>
          </div>
        ) : (
          <>
            <div className="hm-form-field">
              <label htmlFor={ids("email")}>{reach === "email" ? "Email" : "Email (optional)"}</label>
              <input
                id={ids("email")}
                data-field="email"
                data-testid="input-email"
                name="email"
                type="email"
                inputMode="email"
                autoComplete="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                onBlur={touch("email")}
                aria-required={reach === "email" ? "true" : undefined}
                aria-invalid={shown("email") ? true : undefined}
                aria-describedby={describedBy("email", ids("email-hint"))}
                maxLength={200}
              />
              <p className="hm-form-hint" id={ids("email-hint")}>
                {reach === "email" ? "We reply with the written quote here." : "For a written copy of your quote."}
              </p>
              {fieldError("email")}
            </div>

            <fieldset className="hm-form-reach">
              <legend>How should we reach you?</legend>
              <div className="hm-form-pills">
                {REACH_OPTIONS.map((option) => (
                  <label className="hm-form-pill" key={option.value}>
                    <input
                      type="radio"
                      name={ids("reach")}
                      value={option.value}
                      checked={reach === option.value}
                      onChange={() => setReach(option.value)}
                      data-testid={`button-preferred-contact-${option.value}`}
                    />
                    <span>{option.label}</span>
                  </label>
                ))}
              </div>
            </fieldset>

            {estimate && attached && (
              <div className="hm-form-estimate" data-testid="text-estimate-summary">
                <span>
                  Range attached:{" "}
                  <span data-testid="text-estimate-range">
                    <DisplayNum>
                      {formatPlanningCurrency(estimate.priceLow)} to {formatPlanningCurrency(estimate.priceHigh)}
                    </DisplayNum>
                  </span>
                </span>
                <button type="button" onClick={() => setAttached(false)} data-testid="button-drop-estimate">
                  <X className="h-3.5 w-3.5" aria-hidden="true" />
                  Remove
                </button>
              </div>
            )}
          </>
        )}

        <input
          className="hm-form-honeypot"
          name="website"
          tabIndex={-1}
          autoComplete="off"
          aria-hidden="true"
          value={website}
          onChange={(event) => setWebsite(event.target.value)}
        />

        {mutation.isError ? (
          <p className="hm-form-error" role="alert">
            {(mutation.error as Error).message || "We could not send that. Try again, or call us."}
          </p>
        ) : submitTried && errorCount > 0 ? (
          <p className="hm-form-error" role="alert">
            Check the {errorCount === 1 ? "field" : "fields"} marked above.
          </p>
        ) : null}

        <div className="hm-form-send" data-testid="consult-wizard-actions">
          {talk}
          <div className="hm-form-send-main">
            <button className="hm-form-submit" type="submit" disabled={mutation.isPending} data-testid="button-consult-submit">
              {mutation.isPending ? "Sending" : callback ? CTA_FORM_CALLBACK : CTA_FORM_SEND}
            </button>
            <p className="hm-form-next">
              {callback
                ? "We call you back within one business day."
                : "We review your list and reply with a written quote. This request does not book a visit."}
            </p>
          </div>
        </div>

        {/* In the dialog, the estimator is one tap away (onRevise opens it). */}
        {onRevise && !callback && !estimate && !initialProjectType && (
          <p className="hm-form-next">
            Want a ballpark first?{" "}
            <button type="button" className="hm-form-inline-link" onClick={() => onRevise?.()} data-testid="button-start-estimate">
              See a planning range
            </button>
          </p>
        )}

        {showTrust && (
          <ul className="hm-form-trust" data-testid="consult-trust-bullets">
            {CONSULT_BULLETS.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        )}
      </form>
    </div>
  );
}

/* ───────────────────────────── Step 2: "Help us prepare (optional)" */

interface DetailsPanelProps {
  followUp: FollowUp;
  submitted: Submitted;
  headingLevel: "h3" | "h4";
  initialProjectType?: string;
  uploadOne: (item: Upload, receipt: FollowUp) => Promise<Upload>;
  postDetails: (
    receipt: FollowUp,
    details: Record<string, string | undefined>,
    keys: string[],
  ) => Promise<{ ok: boolean; message?: string }>;
  claimPending: () => string[];
  releaseKeys: (keys: string[]) => void;
}

/**
 * Optional, on the success screen, and never re-asks what Step 1 already has:
 * the type of work (unless a service page already set it), the address,
 * timing, the best time to call (only when they asked for a call), an email
 * (only if they left none), their list (only after a callback) and more files.
 */
function DetailsPanel({
  followUp,
  submitted,
  headingLevel,
  initialProjectType,
  uploadOne,
  postDetails,
  claimPending,
  releaseKeys,
}: DetailsPanelProps) {
  const uid = useId();
  const ids = (name: string) => `${uid}-${name}`;
  const Heading = headingLevel;
  const wasCallback = submitted.mode === "callback";
  const askJob = !wasCallback && !initialProjectType && submitted.projectType === "task-list";
  const askBestTime = !wasCallback && submitted.reach === "phone";
  const askEmail = !submitted.email;
  const askList = wasCallback;
  const [state, setState] = useState<"open" | "saving" | "saved" | "skipped">("open");
  const [projectType, setProjectType] = useState("");
  const [address, setAddress] = useState("");
  const [timing, setTiming] = useState("");
  const [bestTime, setBestTime] = useState("");
  const [email, setEmail] = useState("");
  const [list, setList] = useState("");
  const [files, setFiles] = useState<Upload[]>([]);
  const [fileNote, setFileNote] = useState("");
  const [error, setError] = useState("");
  const [emailError, setEmailError] = useState("");
  const savedRef = useRef<HTMLParagraphElement>(null);

  useEffect(() => {
    if (state === "saved" || state === "skipped") savedRef.current?.focus({ preventScroll: true });
  }, [state]);

  if (state === "skipped") {
    return (
      <p className="hm-form-next hm-details-done" ref={savedRef} tabIndex={-1} data-testid="consult-details-skipped">
        No problem. We have what we need to start.
      </p>
    );
  }
  if (state === "saved") {
    return (
      <p className="hm-form-lead hm-details-done" ref={savedRef} tabIndex={-1} role="status" data-testid="consult-details-saved">
        Saved. Thank you.
      </p>
    );
  }

  async function onSave(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (state === "saving") return;
    const cleanEmail = email.trim();
    if (cleanEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      setEmailError("Check the email address.");
      document.getElementById(ids("email"))?.focus();
      return;
    }
    setEmailError("");
    const details: Record<string, string | undefined> = {
      projectType: projectType || undefined,
      address: address.trim() || undefined,
      timing: timing || undefined,
      bestTimeToCall: bestTime || undefined,
      email: cleanEmail || undefined,
      message: list.trim() || undefined,
    };
    const filled = Object.values(details).filter(Boolean).length;
    if (filled === 0 && files.length === 0) {
      setError("Add a detail or a file, or skip this step.");
      return;
    }
    setError("");
    setState("saving");
    let current = files.map((item) => (item.status === "done" ? item : { ...item, status: "uploading" as const }));
    setFiles(current);
    for (const item of current) {
      if (item.status !== "uploading") continue;
      const result = await uploadOne(item, followUp);
      current = current.map((entry) => (entry.id === item.id ? result : entry));
      setFiles(current);
    }
    const failed = current.filter((item) => item.status === "failed");
    const own = current.filter((item) => item.status === "done" && item.key).map((item) => item.key as string);
    if (filled === 0 && own.length === 0) {
      setState("open");
      setError("Those files did not upload. Try again, or text them to us.");
      return;
    }
    // Any first-step files that finished uploading ride along, once.
    const earlier = claimPending();
    const keys = [...earlier, ...own];
    const sent = await postDetails(followUp, details, keys);
    if (!sent.ok) {
      releaseKeys(earlier);
      setState("open");
      setError(sent.message || "We could not save that. Try again, or call us.");
      return;
    }
    trackEvent("lead_details_added", {
      form: "consultation",
      fields_added: filled,
      files_added: keys.length,
    });
    if (failed.length > 0) {
      // The details are in; keep only the files that did not make it, with a retry.
      setFiles(failed);
      setState("open");
      setError(`Saved your details. ${failed.length === 1 ? "One file" : `${failed.length} files`} did not upload: try again, or text ${failed.length === 1 ? "it" : "them"} to us.`);
      return;
    }
    setState("saved");
  }

  return (
    <form
      className="hm-details"
      onSubmit={onSave}
      noValidate
      aria-labelledby={ids("title")}
      data-clarity-mask="True"
      data-testid="consult-details"
    >
      <Heading className="hm-details-title" id={ids("title")}>
        Help us prepare (optional)
      </Heading>
      <p className="hm-form-hint">A few details help us give you a closer quote on the first call.</p>

      {askList && (
        <div className="hm-form-field">
          <label htmlFor={ids("list")}>What can we help with?</label>
          <textarea
            id={ids("list")}
            data-testid="details-message"
            rows={3}
            value={list}
            onChange={(event) => setList(event.target.value)}
            placeholder={LIST_PLACEHOLDER}
            maxLength={2000}
          />
        </div>
      )}

      {askJob && (
        <fieldset className="hm-form-reach">
          <legend>Type of work</legend>
          <div className="hm-form-chips">
            {JOB_CHOICES.map((choice) => (
              <label className="hm-form-pill hm-form-chip" key={choice.value}>
                <input
                  type="radio"
                  name={ids("job")}
                  value={choice.value}
                  checked={projectType === choice.value}
                  onChange={() => setProjectType(choice.value)}
                  data-testid={`details-job-${choice.value}`}
                />
                <span>{jobLabel(choice.value)}</span>
              </label>
            ))}
          </div>
        </fieldset>
      )}

      <div className="hm-form-field">
        <label htmlFor={ids("address")}>Address or ZIP code</label>
        <input
          id={ids("address")}
          data-testid="details-address"
          name="address"
          autoComplete="street-address"
          value={address}
          onChange={(event) => setAddress(event.target.value)}
          aria-describedby={ids("address-hint")}
          maxLength={300}
        />
        <p className="hm-form-hint" id={ids("address-hint")}>
          Confirms you are in our service area. Never shared or sold.
        </p>
      </div>

      <fieldset className="hm-form-reach">
        <legend>When would you like this done?</legend>
        <div className="hm-form-chips">
          {TIMING_OPTIONS.map((option) => (
            <label className="hm-form-pill hm-form-chip" key={option}>
              <input
                type="radio"
                name={ids("timing")}
                value={option}
                checked={timing === option}
                onChange={() => setTiming(option)}
                data-testid={`details-timing-${option.toLowerCase().replace(/\s+/g, "-")}`}
              />
              <span>{option}</span>
            </label>
          ))}
        </div>
      </fieldset>

      {askBestTime && (
        <div className="hm-form-field">
          <label htmlFor={ids("best-time")}>Best time to call</label>
          <select
            id={ids("best-time")}
            data-testid="details-best-time"
            value={bestTime}
            onChange={(event) => setBestTime(event.target.value)}
          >
            <option value="">No preference</option>
            {BEST_TIMES.filter((time) => time !== "Any time").map((time) => (
              <option key={time} value={time}>
                {time}
              </option>
            ))}
          </select>
        </div>
      )}

      {askEmail && (
        <div className="hm-form-field">
          <label htmlFor={ids("email")}>Email (optional)</label>
          <input
            id={ids("email")}
            data-testid="details-email"
            type="email"
            inputMode="email"
            autoComplete="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            aria-invalid={emailError ? true : undefined}
            aria-describedby={emailError ? ids("email-error") : undefined}
            maxLength={200}
          />
          <p className="hm-form-error-text" id={ids("email-error")} aria-live="polite">
            {emailError}
          </p>
        </div>
      )}

      <AttachmentTile
        id={ids("files")}
        files={files}
        label={wasCallback ? "Add photos, plans or files" : "Add more photos, plans or files"}
        testId="details-attachment-tile"
        onAdd={(incoming) => {
          const { accepted, problems } = partitionRequestFiles(incoming, files.map((item) => item.file));
          if (accepted.length) setFiles((current) => [...current, ...pick(accepted).map((item) => ({ ...item, status: "ready" as const }))]);
          setFileNote(problems.join(" "));
        }}
        onRemove={(fileId) => {
          setFiles((current) => current.filter((item) => item.id !== fileId));
          setFileNote("");
        }}
        message={fileNote}
      />

      {error && (
        <p className="hm-form-error" role="alert">
          {error}
        </p>
      )}

      <div className="hm-details-actions">
        <button type="submit" className="hm-form-submit" disabled={state === "saving"} data-testid="button-details-save">
          {state === "saving" ? "Saving" : "Save details"}
        </button>
        <button
          type="button"
          className="hm-form-inline-link"
          onClick={() => setState("skipped")}
          disabled={state === "saving"}
          data-testid="button-details-skip"
        >
          Skip
        </button>
      </div>
    </form>
  );
}
