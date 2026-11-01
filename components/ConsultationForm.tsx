"use client";

import { EstimatorRecovery } from "@/components/estimate/recovery/EstimatorRecovery";
import { markEstimatorCompleted } from "@/lib/estimatorSession";

import { useEffect, useId, useRef, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { MessageSquare, Phone, X } from "lucide-react";
import type { StoredEstimate } from "@/shared/estimateEngine";
import { formatPlanningCurrency } from "@/shared/estimateEngine";
import { DisplayNum } from "@/components/marketing/DisplayNum";
import { AddressAutocomplete } from "@/components/AddressAutocomplete";
import { CTA_FORM_CALLBACK, CTA_FORM_SEND } from "@/shared/ctaCopy";
import { CONSULT_BULLETS } from "@/shared/siteContent";
import { SITE_CONFIG } from "@/shared/siteConfig";
import { trackEvent, trackMetaEvent, trackAcceptedLeadConversion } from "@/lib/analytics";
import { requireConsultationReceipt } from "@/lib/consultationReceipt";
import { inquiryId } from "@/lib/leadInquiry";
import { readStoredPrefill, PREFILL_UPDATED_EVENT, hasPassedGate } from "@/lib/leadPrefill";
import type { PropertyProfile } from "@/shared/propertyProfile";
import { buildCleanAddress, extractZip } from "@/shared/addressValidation";

/**
 * The request form every "Send your list and photos" lands on (homepage and
 * contact #consult, the paid landing pages, the /handyman funnel and the
 * consult dialog).
 *
 * Owner, 1 November 2026: land directly on the form, the easiest form there
 * is, and always the option to call or to have us call. One short screen:
 * name, phone, the list, optional photos and email, how to reach you, one
 * send. "Have us call you" reduces it to name and phone (plus an optional best
 * time) and posts through the same /api/consultation pipeline as a callback
 * request. Call, text and chat sit beside the send button.
 *
 * Native elements only (input, textarea, select, radio, details), so nothing
 * here sets state during hydration and every control is announced as itself.
 */

type Mode = "request" | "callback";
type Reach = "phone" | "text" | "email";
type Field = "name" | "phone" | "message" | "photos" | "email";
type Errors = Partial<Record<Field, string>>;

/** Values match the server's preferredContact enum (phone = call). */
const REACH_OPTIONS: { value: Reach; label: string }[] = [
  { value: "phone", label: "Call me" },
  { value: "text", label: "Text me" },
  { value: "email", label: "Email me" },
];
/** Same list as BEST_TIMES_TO_CALL in server/services/consultationRequest.ts. */
const BEST_TIMES = ["Any time", "Morning", "Midday", "Afternoon"] as const;
const FIELD_ORDER: Field[] = ["name", "phone", "message", "photos", "email"];
const MAX_PHOTOS = 4;
const MAX_PHOTO_BYTES = 8 * 1024 * 1024;
const PHOTO_ACCEPT = "image/jpeg,image/png,image/webp,image/heic,image/heif,.heic,.heif";

/**
 * Optional job type under "Add more detail". Blank files the request as
 * "task-list" on the server, the value the old wizard sent for "A list or
 * something else".
 */
const JOB_CHOICES = [
  { value: "drywall-repair", label: "Drywall repair" },
  { value: "painting-touch-ups", label: "Painting" },
  { value: "plumbing-repairs", label: "Plumbing" },
  { value: "electrical-repairs", label: "Electrical" },
  { value: "mounting-assembly", label: "Mounting and assembly" },
  { value: "carpentry-trim-repair", label: "Carpentry, doors and trim" },
  { value: "fence-deck-gutter-repair", label: "Fence, deck and gutter" },
  { value: "home-maintenance", label: "Caulking and maintenance" },
  { value: "task-list", label: "A list or something else" },
] as const;

const PROJECT_LABEL_LOOKUP: Record<string, string> = {
  ...Object.fromEntries(JOB_CHOICES.map((o) => [o.value, o.label])),
  other: "Other / not sure yet",
};

const DRAFT_KEY = "handyman_consult_form_v2";

interface Draft {
  mode?: Mode;
  name?: string;
  phone?: string;
  email?: string;
  message?: string;
  reach?: Reach;
  bestTime?: string;
  address?: string;
  projectType?: string;
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
  address: string;
  projectType: string;
}

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
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [reach, setReach] = useState<Reach>("phone");
  const [bestTime, setBestTime] = useState<string>(BEST_TIMES[0]);
  const [address, setAddress] = useState("");
  const [projectType, setProjectType] = useState<string>(initialProjectType ?? "");
  const [photos, setPhotos] = useState<File[]>([]);
  const [website, setWebsite] = useState("");
  const [propertyProfile, setPropertyProfile] = useState<PropertyProfile | null>(null);
  const [estimate, setEstimate] = useState<StoredEstimate | null>(null);
  const [attached, setAttached] = useState(true);
  const [touched, setTouched] = useState<Partial<Record<Field, boolean>>>({});
  const [submitTried, setSubmitTried] = useState(false);
  const [submitted, setSubmitted] = useState<Submitted | null>(null);
  const [success, setSuccess] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);
  const successHeadingRef = useRef<HTMLHeadingElement>(null);
  const lastKeyRef = useRef<string | null>(null);
  const draftHydrated = useRef(false);
  const callback = mode === "callback";
  const Heading = headingLevel;

  // Restore a draft across refresh or browser Back within the visit.
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
    if (draft.address) setAddress(draft.address);
    if (draft.projectType && !initialProjectType) setProjectType(draft.projectType);
  }, [initialProjectType]);

  useEffect(() => {
    if (success || !draftHydrated.current) return;
    writeDraft({ mode, name, phone, email, message, reach, bestTime, address, projectType });
  }, [mode, name, phone, email, message, reach, bestTime, address, projectType, success]);

  // A Meta lead form click or an earlier form on this visit may already know who this is.
  useEffect(() => {
    function applyPrefill() {
      const pf = readStoredPrefill();
      if (pf.name) setName((value) => value || pf.name || "");
      if (pf.phone) setPhone((value) => value || pf.phone || "");
      if (pf.email) setEmail((value) => value || pf.email || "");
      if (pf.address) setAddress((value) => value || pf.address || "");
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
        setProjectType(parsed.project);
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

  function handleProfileResolved(profile: PropertyProfile | null) {
    setPropertyProfile(profile);
    if (profile) {
      const clean = buildCleanAddress(profile);
      if (clean) setAddress(clean);
    }
  }

  function validate(): Errors {
    const errors: Errors = {};
    if (name.trim().length < 2) errors.name = "Enter your name.";
    const phoneDigits = digits(phone).length;
    const phoneNeeded = callback || reach !== "email" || phone.trim().length > 0;
    if (phoneNeeded && (phoneDigits < 10 || phoneDigits > 15)) {
      errors.phone = "Enter a phone number with the area code.";
    }
    if (callback) return errors;
    if (message.trim().length < 3) errors.message = "Tell us in a few words what needs fixing.";
    const cleanEmail = email.trim();
    if (cleanEmail && !validEmail(cleanEmail)) errors.email = "Check the email address.";
    else if (!cleanEmail && reach === "email") errors.email = "Add your email so we can email you back.";
    if (photos.length > MAX_PHOTOS) errors.photos = `You can add up to ${MAX_PHOTOS} photos.`;
    else if (photos.some((file) => file.size > MAX_PHOTO_BYTES)) errors.photos = "Each photo must be 8 MB or smaller.";
    return errors;
  }

  const errors = validate();
  const shown = (field: Field) => ((submitTried || touched[field]) && errors[field]) || "";
  const touch = (field: Field) => () => setTouched((current) => ({ ...current, [field]: true }));
  const engaged = Boolean(name || phone || message || email || photos.length);

  const formStartedRef = useRef(false);
  function trackFormStart() {
    if (formStartedRef.current) return;
    formStartedRef.current = true;
    trackEvent("form_start", { form: "consultation" });
  }

  const mutation = useMutation({
    mutationFn: async (data: Submitted) => {
      const isCallback = data.mode === "callback";
      const zip = propertyProfile?.zip?.slice(0, 5) || extractZip(data.address) || "";
      const payload = {
        name: data.name,
        phone: data.phone,
        email: isCallback ? "" : data.email,
        preferredContact: isCallback ? "phone" : reach,
        address: isCallback ? "" : data.address,
        zip: isCallback ? "" : zip,
        // Blank is filed as "task-list" by the server.
        projectType: data.projectType,
        message: isCallback ? undefined : message.trim(),
        requestKind: isCallback ? "callback" : "quote",
        bestTimeToCall: isCallback ? bestTime : undefined,
        propertyProfile: isCallback ? null : propertyProfile,
        skipEmail: hasPassedGate() ? true : undefined,
        // A callback after a list (or the other way round) is its own inquiry.
        inquiryId: inquiryId(isCallback ? "callback" : "primary"),
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
      let init: RequestInit;
      if (!isCallback && photos.length > 0) {
        // Photos ride as multipart: the same JSON body as "payload", plus the files.
        const body = new FormData();
        body.set("payload", JSON.stringify(payload));
        for (const file of photos) body.append("photos", file);
        init = { method: "POST", body };
      } else {
        init = {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        };
      }
      const res = await fetch("/api/consultation", init);
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || "We could not send that. Try again, or call us.");
      }
      return requireConsultationReceipt(await res.json());
    },
    onSuccess: (response: { accepted?: boolean }, variables) => {
      setSuccess(true);
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
      address: callback ? "" : address.trim(),
      projectType: projectType || "task-list",
    };
    setSubmitted(data);
    mutation.mutate(data);
  }

  function addPhotos(list: FileList | null) {
    if (!list) return;
    const next = [...photos];
    for (const file of Array.from(list)) {
      if (next.some((existing) => existing.name === file.name && existing.size === file.size)) continue;
      next.push(file);
    }
    setPhotos(next);
    setTouched((current) => ({ ...current, photos: true }));
  }

  function handleRevise() {
    onRevise?.();
  }

  if (success) {
    const submittedProject = submitted
      ? PROJECT_LABEL_LOOKUP[submitted.projectType] ?? submitted.projectType
      : null;
    const wasCallback = submitted?.mode === "callback";

    return (
      <div className="hm-form hm-form-done" data-testid="consultation-success" data-clarity-mask="True" role="status">
        <Heading
          ref={successHeadingRef}
          tabIndex={-1}
          data-clarity-mask="True"
          className="hm-form-title"
        >
          Thanks{submitted ? `, ${submitted.name.split(" ")[0]}` : ""}. We have your request.
        </Heading>
        {!wasCallback && submitted && (submitted.projectType !== "task-list" || submitted.address) && (
          <p className="hm-form-next" data-clarity-mask="True">
            {submitted.projectType !== "task-list" ? submittedProject : ""}
            {submitted?.address ? `${submitted.projectType !== "task-list" ? " · " : ""}${submitted.address}` : ""}
          </p>
        )}
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
        {!wasCallback && submitted?.email && (
          <p className="hm-form-next">Your request is saved. Email delivery is not confirmed on this page.</p>
        )}
      </div>
    );
  }

  const describedBy = (field: Field, hint?: string) =>
    [hint, shown(field) ? ids(`${field}-error`) : ""].filter(Boolean).join(" ") || undefined;
  const fieldError = (field: Field) => (
    <p id={ids(`${field}-error`)} className="hm-form-error-text" aria-live="polite">
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
    <div className="hm-form">
      <EstimatorRecovery
        flow="consultation"
        currentStep={engaged ? "filling" : "form"}
        currentStepIndex={engaged ? 1 : 0}
        totalSteps={2}
        lastCompletedStep={engaged ? "form" : undefined}
        selections={{ project_type: callback ? "Callback request" : projectType || "task-list" }}
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
          <label htmlFor={ids("phone")}>
            Phone{!callback && reach === "email" ? " (optional)" : ""}
          </label>
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
            aria-required={callback || reach !== "email" ? "true" : undefined}
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
                placeholder="For example: patch two doorknob holes, fix a leaky kitchen faucet, hang three shelves"
                aria-required="true"
                aria-invalid={shown("message") ? true : undefined}
                aria-describedby={describedBy("message")}
                maxLength={2000}
              />
              {fieldError("message")}
            </div>

            <div className="hm-form-field hm-form-file">
              <label htmlFor={ids("photos")}>Add photos (optional)</label>
              <input
                id={ids("photos")}
                data-field="photos"
                data-testid="input-photos"
                type="file"
                accept={PHOTO_ACCEPT}
                multiple
                aria-describedby={describedBy("photos", ids("photos-hint"))}
                aria-invalid={shown("photos") ? true : undefined}
                onChange={(event) => {
                  addPhotos(event.target.files);
                  event.target.value = "";
                }}
              />
              <p className="hm-form-hint" id={ids("photos-hint")}>
                JPEG, PNG, WebP or HEIC. Up to {MAX_PHOTOS} photos, 8 MB each.
              </p>
              {photos.length > 0 && (
                <ul className="hm-form-files">
                  {photos.map((file) => (
                    <li key={`${file.name}-${file.size}`}>
                      <span>{file.name}</span>
                      <button
                        type="button"
                        onClick={() => setPhotos((current) => current.filter((item) => item !== file))}
                      >
                        Remove<span className="sr-only"> {file.name}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
              {fieldError("photos")}
            </div>

            <div className="hm-form-field">
              <label htmlFor={ids("email")}>Email{reach === "email" ? "" : " (optional)"}</label>
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

            <details className="hm-form-more" data-testid="consult-more-detail">
              <summary>Add more detail (optional)</summary>
              <div className="hm-form-more-body">
                <div className="hm-form-field">
                  <label htmlFor={ids("job")}>Type of job</label>
                  <select
                    id={ids("job")}
                    name="projectType"
                    value={projectType}
                    onChange={(event) => setProjectType(event.target.value)}
                    data-testid="select-project-type"
                  >
                    <option value="">Not sure, or several jobs</option>
                    {JOB_CHOICES.filter((o) => o.value !== "task-list").map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                    {projectType && !(projectType in PROJECT_LABEL_LOOKUP) && (
                      <option value={projectType}>{projectType}</option>
                    )}
                  </select>
                </div>
                <div className="hm-form-field">
                  <label htmlFor={ids("address")}>Service address</label>
                  <AddressAutocomplete
                    id={ids("address")}
                    aria-label="Service address"
                    value={address}
                    onChange={setAddress}
                    onProfileResolved={handleProfileResolved}
                    data-testid="input-address"
                  />
                  <p className="hm-form-hint">Confirms you are in our service area. Never shared or sold.</p>
                </div>
              </div>
            </details>

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
            <button type="button" className="hm-form-inline-link" onClick={handleRevise} data-testid="button-start-estimate">
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
