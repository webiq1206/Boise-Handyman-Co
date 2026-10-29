"use client";

import { EstimatorRecovery } from "@/components/estimate/recovery/EstimatorRecovery";
import { markEstimatorCompleted } from "@/lib/estimatorSession";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { cn } from "@/lib/utils";
import { Check, Plus, X, ChevronDown, Loader2 } from "lucide-react";
import type { StoredEstimate } from "@/shared/estimateEngine";
import { formatPlanningCurrency } from "@/shared/estimateEngine";
import { DisplayNum } from "@/components/marketing";
import { AddressAutocomplete } from "@/components/AddressAutocomplete";
import { CTA_FORM_SEND } from "@/shared/ctaCopy";
import { CONSULT_BULLETS } from "@/shared/siteContent";
import { BusinessPhoneContact } from "@/components/BusinessPhoneContact";
import { trackEvent, trackMetaEvent, trackAcceptedLeadConversion } from "@/lib/analytics";
import { requireConsultationReceipt } from "@/lib/consultationReceipt";
import { inquiryId } from "@/lib/leadInquiry";
import { readStoredPrefill, PREFILL_UPDATED_EVENT, hasPassedGate } from "@/lib/leadPrefill";
import type { PropertyProfile } from "@/shared/propertyProfile";
import {
  isLocatableSite,
  SITE_LOCATION_ERROR_MESSAGE,
  buildCleanAddress,
  extractZip,
} from "@/shared/addressValidation";
import { SelectableCard } from "@/components/estimate/wizard";

/**
 * Legacy sentinel from the home-builder era ("still looking for land"). No
 * handyman project option uses this value any more, so the address field is
 * effectively always required.
 */
const LAND_SEARCH_PROJECT_TYPE = "looking-for-land";

const CONTACT_METHODS = [
  { value: "email", label: "Email" },
  { value: "phone", label: "Phone call" },
  { value: "text", label: "Text" },
] as const;

const DRAFT_KEY = "handyman_consult_wizard_v1";

const formSchema = z
  .object({
    name: z.string().min(2, "Please enter your full name"),
    preferredContact: z.enum(["email", "phone", "text"]),
    phone: z.string(),
    email: z.string(),
    address: z.string(),
    projectType: z.string().min(1, "Please select a project type"),
    message: z.string().optional(),
    website: z.string().max(0).optional(),
  })
  .superRefine((data, ctx) => {
    if (data.preferredContact === "email") {
      if (!z.string().email().safeParse(data.email).success) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["email"],
          message: "Please enter a valid email address",
        });
      }
    } else if (data.phone.replace(/\D/g, "").length < 10) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["phone"],
        message:
          data.preferredContact === "text"
            ? "Please enter a valid mobile number"
            : "Please enter a valid phone number",
      });
    }

    if (data.projectType === LAND_SEARCH_PROJECT_TYPE) return;
    const address = data.address.trim();
    if (address.length < 5) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["address"],
        message: "Please enter your service address",
      });
      return;
    }
    if (!isLocatableSite(address)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["address"],
        message: SITE_LOCATION_ERROR_MESSAGE,
      });
    }
  });

type FormData = z.infer<typeof formSchema>;

/**
 * At most six choice cards. Remaining job types route through
 * "A list or something else" so the first decision stays clear.
 */
const JOB_CHOICES = [
  { value: "drywall-repair", label: "Drywall repair", sub: "Holes, cracks, texture" },
  { value: "painting-touch-ups", label: "Painting", sub: "Touch-ups and small jobs" },
  { value: "plumbing-repairs", label: "Plumbing", sub: "Faucets, toilets, disposals" },
  { value: "electrical-repairs", label: "Electrical", sub: "Outlets, switches, fixtures" },
  { value: "mounting-assembly", label: "Mounting & assembly", sub: "TVs, shelves, furniture" },
  { value: "task-list", label: "A list or something else", sub: "Several jobs or not sure yet" },
] as const;

const PROJECT_LABEL_LOOKUP: Record<string, string> = {
  ...Object.fromEntries(JOB_CHOICES.map((o) => [o.value, o.label])),
  "carpentry-trim-repair": "Carpentry, doors & trim",
  "fence-deck-gutter-repair": "Fence, deck & gutter",
  "home-maintenance": "Caulking & maintenance",
  other: "Other / not sure yet",
};

const labelClass = "text-xs tracking-wide font-normal uppercase text-muted-foreground";

function RequiredMark() {
  return (
    <span className="text-destructive" aria-hidden="true">
      {" "}
      *
    </span>
  );
}

interface ConsultationFormProps {
  onRevise?: () => void;
  /** Compact trust bullets above the form (used in the modal variant). */
  showTrust?: boolean;
  initialProjectType?: "drywall-repair" | "home-maintenance";
}

function readDraft(): Partial<FormData> {
  try {
    const raw = sessionStorage.getItem(DRAFT_KEY);
    if (!raw) return {};
    return JSON.parse(raw) as Partial<FormData>;
  } catch {
    return {};
  }
}

function writeDraft(data: Partial<FormData>) {
  try {
    sessionStorage.setItem(DRAFT_KEY, JSON.stringify({ ...data, step: "form" }));
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

/**
 * Premium single-page send-list form.
 *
 * Replaces the empty one-field wizard steps and the viewport-fixed CONTINUE
 * dock that leaked onto marketing pages. Same CRM payload, draft persistence,
 * and planning-range attachment as before.
 */
export function ConsultationForm({
  onRevise,
  showTrust = false,
  initialProjectType,
}: ConsultationFormProps = {}) {
  const [estimate, setEstimate] = useState<StoredEstimate | null>(null);
  const [estimateChecked, setEstimateChecked] = useState(false);
  const [attached, setAttached] = useState(true);
  const [success, setSuccess] = useState(false);
  const [submitted, setSubmitted] = useState<FormData | null>(null);
  const [propertyProfile, setPropertyProfile] = useState<PropertyProfile | null>(null);
  const [addressInput, setAddressInput] = useState("");
  const [showNote, setShowNote] = useState(false);
  const [showAddrInfo, setShowAddrInfo] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const lastKeyRef = useRef<string | null>(null);
  const successHeadingRef = useRef<HTMLHeadingElement>(null);
  const draftHydrated = useRef(false);

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    mode: "onTouched",
    defaultValues: {
      name: "",
      preferredContact: "email",
      phone: "",
      email: "",
      address: "",
      projectType: initialProjectType ?? "",
      message: "",
    },
  });

  const preferredContact = form.watch("preferredContact");
  const searchingForLand = form.watch("projectType") === LAND_SEARCH_PROJECT_TYPE;
  const watched = form.watch();

  useEffect(() => {
    if (draftHydrated.current) return;
    draftHydrated.current = true;
    const draft = readDraft();
    if (draft.projectType && !initialProjectType) {
      form.setValue("projectType", draft.projectType, { shouldValidate: false });
    }
    if (draft.name) form.setValue("name", draft.name, { shouldValidate: false });
    if (draft.preferredContact) {
      form.setValue("preferredContact", draft.preferredContact, { shouldValidate: false });
    }
    if (draft.phone) form.setValue("phone", draft.phone, { shouldValidate: false });
    if (draft.email) form.setValue("email", draft.email, { shouldValidate: false });
    if (draft.address) {
      setAddressInput(draft.address);
      form.setValue("address", draft.address, { shouldValidate: false });
    }
    if (draft.message) {
      form.setValue("message", draft.message, { shouldValidate: false });
      setShowNote(true);
    }
  }, [form, initialProjectType]);

  useEffect(() => {
    if (success) return;
    writeDraft({
      projectType: watched.projectType,
      name: watched.name,
      preferredContact: watched.preferredContact,
      phone: watched.phone,
      email: watched.email,
      address: watched.address,
      message: watched.message,
    });
  }, [watched, success]);

  function handleProfileResolved(profile: PropertyProfile | null) {
    setPropertyProfile(profile);
    if (profile) {
      const clean = buildCleanAddress(profile);
      if (clean) {
        setAddressInput(clean);
        form.setValue("address", clean, { shouldValidate: true });
      }
    }
  }

  const deriveZip = (addr: string) =>
    propertyProfile?.zip?.slice(0, 5) || extractZip(addr) || "";

  useEffect(() => {
    function applyPrefill() {
      const pf = readStoredPrefill();
      const fillIfEmpty = (field: "name" | "phone" | "email", value?: string) => {
        if (value && !form.getValues(field)) {
          form.setValue(field, value, { shouldValidate: false });
        }
      };
      fillIfEmpty("name", pf.name);
      fillIfEmpty("phone", pf.phone);
      fillIfEmpty("email", pf.email);
      if (pf.address && !form.getValues("address")) {
        setAddressInput(pf.address);
        form.setValue("address", pf.address, { shouldValidate: false });
      }
    }
    applyPrefill();
    window.addEventListener(PREFILL_UPDATED_EVENT, applyPrefill);
    return () => window.removeEventListener(PREFILL_UPDATED_EVENT, applyPrefill);
  }, [form]);

  useEffect(() => {
    function loadEstimate() {
      setEstimateChecked(true);
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
        form.setValue("projectType", parsed.project, { shouldValidate: false });
      } catch {}
    }
    loadEstimate();
    window.addEventListener("brc_estimate_updated", loadEstimate);
    return () => window.removeEventListener("brc_estimate_updated", loadEstimate);
  }, [form, initialProjectType]);

  useEffect(() => {
    if (!success) return;
    const el = successHeadingRef.current;
    if (el && el.offsetParent !== null) {
      let ancestor: HTMLElement | null = el.parentElement;
      let scrolledContainer = false;
      while (ancestor && ancestor !== document.body && ancestor !== document.documentElement) {
        const overflowY = getComputedStyle(ancestor).overflowY;
        if (
          (overflowY === "auto" || overflowY === "scroll") &&
          ancestor.scrollHeight > ancestor.clientHeight
        ) {
          ancestor.scrollTo({ top: 0, behavior: "auto" });
          scrolledContainer = true;
          break;
        }
        ancestor = ancestor.parentElement;
      }
      if (!scrolledContainer) {
        const top = el.getBoundingClientRect().top + window.scrollY - 80;
        window.scrollTo({ top: Math.max(0, top), behavior: "auto" });
      }
    }
    el?.focus({ preventScroll: true });
  }, [success]);

  function handleRevise() {
    if (onRevise) {
      onRevise();
    } else {
      document.getElementById("planning-range")?.scrollIntoView({ behavior: "smooth" });
    }
  }

  const mutation = useMutation({
    mutationFn: async (data: FormData) => {
      const payload = {
        ...data,
        zip: deriveZip(data.address),
        propertyProfile,
        skipEmail: hasPassedGate() ? true : undefined,
        inquiryId: inquiryId("primary"),
        website: data.website,
        estimate:
          estimate && attached
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
        throw new Error(err.message || "Something went wrong");
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

  const formStartedRef = useRef(false);
  function trackFormStart() {
    if (formStartedRef.current) return;
    formStartedRef.current = true;
    trackEvent("form_start", { form: "consultation" });
  }

  function onSubmit(data: FormData) {
    setFormError(null);
    setSubmitted(data);
    mutation.mutate(data);
  }

  if (success) {
    const submittedProject = submitted
      ? PROJECT_LABEL_LOOKUP[submitted.projectType] ?? submitted.projectType
      : null;

    return (
      <div
        className="flex flex-col items-start space-y-4 py-2"
        data-testid="consultation-success"
        data-clarity-mask="True"
      >
        <img
          src="/brand/svg/icon/boise-handyman-co-icon-accent.svg"
          alt="Boise Handyman Co"
          width={48}
          height={48}
          className="h-12 w-12"
        />
        <div>
          <h3
            ref={successHeadingRef}
            tabIndex={-1}
            data-clarity-mask="True"
            className="font-serif text-2xl text-foreground outline-none"
          >
            Request received{submitted ? `, ${submitted.name.split(" ")[0]}` : ""}.
          </h3>
          {submittedProject && (
            <p className="mt-1 text-sm text-muted-foreground" data-clarity-mask="True">
              {submittedProject}
              {submitted?.address ? ` · ${submitted.address}` : ""}
            </p>
          )}
        </div>

        <ol className="space-y-2.5 text-sm text-muted-foreground">
          <li className="flex gap-3">
            <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full border border-border text-caption font-normal text-foreground">
              1
            </span>
            <span className="pt-0.5">We review your request and any planning range you attached.</span>
          </li>
          <li className="flex gap-3">
            <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full border border-border text-caption font-normal text-foreground">
              2
            </span>
            <span className="pt-0.5">Our team reviews the scope with you before preparing a quote.</span>
          </li>
          <li className="flex gap-3">
            <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full border border-border text-caption font-normal text-foreground">
              3
            </span>
            <span className="pt-0.5">
              Scheduling is confirmed after the scope and quote are agreed. This request does not book
              a visit.
            </span>
          </li>
        </ol>

        <div className="flex flex-col gap-1">
          <p className="text-sm text-muted-foreground">
            Need us sooner?{" "}
            <BusinessPhoneContact
              inline
              showPhoneIcon
              phoneClassName="inline-flex items-center gap-1.5 font-normal text-foreground underline-offset-2 hover:underline"
              saveClassName="text-sm text-muted-foreground hover:text-foreground transition-colors"
              phoneTestId="link-consult-success-phone"
            />
          </p>
          {submitted?.email && (
            <p className="text-xs text-muted-foreground">
              Your request is saved. Email delivery is not confirmed on this page.
            </p>
          )}
        </div>
      </div>
    );
  }

  const projectLabel = estimate?.project ?? null;
  const finishLabel = estimate?.finish ?? null;

  return (
    <Form {...form}>
      <EstimatorRecovery
        flow="consultation"
        currentStep="form"
        currentStepIndex={0}
        totalSteps={1}
        selections={{ project_type: String(form.watch("projectType") ?? "") || null }}
        validationErrors={Object.keys(form.formState.errors)}
        engaged={form.formState.isDirty}
        submitted={success}
      />
      <form
        onSubmit={form.handleSubmit(onSubmit, (errors) => {
          trackEvent("form_error", {
            form: "consultation",
            fields: Object.keys(errors).sort().join(","),
          });
          setFormError("Please fix the highlighted fields.");
        })}
        onFocusCapture={trackFormStart}
        className="space-y-5"
        data-testid="consultation-wizard"
        data-step="form"
        data-consult-layout="single-page"
      >
        <input
          {...form.register("website")}
          tabIndex={-1}
          autoComplete="off"
          aria-hidden="true"
          className="hidden"
        />

        <div>
          <p className="ed-eyebrow !mb-2">Send your list</p>
          <h3 className="font-serif text-[clamp(1.5rem,2.4vw,1.875rem)] font-light leading-tight tracking-[-0.02em] text-foreground">
            What needs fixing?
          </h3>
          <p className="mt-1.5 text-sm text-muted-foreground">
            Choose a starting point, then add your details. We reply with a written quote.
          </p>
        </div>

        {showTrust && (
          <ul
            className="grid grid-cols-1 gap-x-4 gap-y-1.5 sm:grid-cols-2"
            data-testid="consult-trust-bullets"
          >
            {CONSULT_BULLETS.map((item) => (
              <li key={item} className="flex items-center gap-2 text-xs text-muted-foreground">
                <Check className="h-3.5 w-3.5 flex-shrink-0 text-foreground/60" />
                {item}
              </li>
            ))}
          </ul>
        )}

        {estimateChecked && !estimate && (
          <p className="text-xs text-muted-foreground" data-testid="estimate-cta-card">
            Want a ballpark first?{" "}
            <button
              type="button"
              onClick={handleRevise}
              className="font-normal text-foreground underline underline-offset-2"
              data-testid="button-start-estimate"
            >
              See planning range
            </button>
          </p>
        )}

        {estimate && attached && (
          <div className="flex items-center justify-between gap-2 text-xs" data-testid="text-estimate-summary">
            <span className="text-muted-foreground">
              Range attached:{" "}
              <span className="text-foreground" data-testid="text-estimate-range">
                <DisplayNum>
                  {formatPlanningCurrency(estimate.priceLow)} to{" "}
                  {formatPlanningCurrency(estimate.priceHigh)}
                </DisplayNum>
              </span>
              {projectLabel ? ` · ${projectLabel}` : ""}
              {finishLabel ? ` · ${finishLabel}` : ""}
            </span>
            <button
              type="button"
              onClick={() => setAttached(false)}
              className="inline-flex flex-shrink-0 items-center gap-1 text-muted-foreground hover:text-foreground"
              data-testid="button-drop-estimate"
            >
              <X className="h-3.5 w-3.5" />
              Remove
            </button>
          </div>
        )}

        {(mutation.isError || formError) && (
          <div
            role="alert"
            className="rounded-sm border border-destructive/20 bg-destructive/5 p-3 text-sm text-destructive"
          >
            {formError ||
              (mutation.error as Error)?.message ||
              "Something went wrong. Please try again."}
          </div>
        )}

        <div data-testid="consult-step-job">
          <div role="radiogroup" aria-label="Job type" className="grid grid-cols-2 gap-2">
            {JOB_CHOICES.map((opt) => (
              <SelectableCard
                key={opt.value}
                dense
                control="radio"
                selected={form.watch("projectType") === opt.value}
                onSelect={() => {
                  form.setValue("projectType", opt.value, { shouldValidate: true, shouldDirty: true });
                  setFormError(null);
                }}
                title={opt.label}
                description={opt.sub}
                data-testid={`consult-job-${opt.value}`}
              />
            ))}
          </div>
          <FormField
            control={form.control}
            name="projectType"
            render={() => (
              <FormItem className="mt-1">
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem className="sm:col-span-2">
                <FormLabel className={labelClass}>
                  Full name
                  <RequiredMark />
                </FormLabel>
                <FormControl>
                  <Input
                    placeholder="Jane Smith"
                    autoComplete="name"
                    aria-required="true"
                    data-testid="input-name"
                    className="min-h-12"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="preferredContact"
            render={({ field }) => (
              <FormItem className="sm:col-span-2">
                <FormLabel className={labelClass}>
                  Preferred contact
                  <RequiredMark />
                </FormLabel>
                <FormControl>
                  <div
                    role="radiogroup"
                    aria-label="Preferred contact method"
                    className="grid grid-cols-3 gap-2"
                  >
                    {CONTACT_METHODS.map((method) => {
                      const selected = field.value === method.value;
                      return (
                        <button
                          key={method.value}
                          type="button"
                          role="radio"
                          aria-checked={selected}
                          onClick={() => field.onChange(method.value)}
                          className={cn(
                            "min-h-11 rounded-sm border px-3 py-2.5 text-sm font-normal transition-colors hover-elevate active-elevate-2",
                            selected
                              ? "border-foreground bg-foreground text-background"
                              : "border-border bg-transparent text-foreground",
                          )}
                          data-testid={`button-preferred-contact-${method.value}`}
                        >
                          {method.label}
                        </button>
                      );
                    })}
                  </div>
                </FormControl>
              </FormItem>
            )}
          />

          {preferredContact === "email" ? (
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className={labelClass}>
                    Email
                    <RequiredMark />
                  </FormLabel>
                  <FormControl>
                    <Input
                      type="email"
                      placeholder="jane@example.com"
                      autoComplete="email"
                      aria-required="true"
                      data-testid="input-email"
                      className="min-h-12"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          ) : (
            <FormField
              control={form.control}
              name="phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className={labelClass}>
                    Phone
                    <RequiredMark />
                  </FormLabel>
                  <FormControl>
                    <Input
                      type="tel"
                      placeholder="(208) 555-0000"
                      autoComplete="tel"
                      aria-required="true"
                      data-testid="input-phone"
                      className="min-h-12"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}

          {preferredContact === "email" ? (
            <FormField
              control={form.control}
              name="phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className={labelClass}>
                    Phone <span className="normal-case text-muted-foreground">(optional)</span>
                  </FormLabel>
                  <FormControl>
                    <Input
                      type="tel"
                      placeholder="(208) 555-0000"
                      autoComplete="tel"
                      data-testid="input-phone"
                      className="min-h-12"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          ) : (
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className={labelClass}>
                    Email <span className="normal-case text-muted-foreground">(optional)</span>
                  </FormLabel>
                  <FormControl>
                    <Input
                      type="email"
                      placeholder="jane@example.com"
                      autoComplete="email"
                      data-testid="input-email"
                      className="min-h-12"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}

          <FormField
            control={form.control}
            name="address"
            render={({ field }) => (
              <FormItem className="sm:col-span-2">
                <FormLabel className={labelClass}>
                  {searchingForLand ? "Where are you looking?" : "Service address"}
                  {!searchingForLand && <RequiredMark />}
                </FormLabel>
                <FormControl>
                  <div className="[&_[data-testid=property-profile-summary]]:p-2 [&_[data-testid=property-profile-summary]_ul]:hidden [&_[data-testid=button-use-typed-address]]:min-h-10">
                    <AddressAutocomplete
                      value={addressInput || field.value}
                      onChange={(v) => {
                        setAddressInput(v);
                        field.onChange(v);
                      }}
                      onProfileResolved={handleProfileResolved}
                      data-testid="input-address"
                    />
                  </div>
                </FormControl>
                <button
                  type="button"
                  onClick={() => setShowAddrInfo((v) => !v)}
                  aria-expanded={showAddrInfo}
                  aria-controls="address-info"
                  className="mt-1 inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
                  data-testid="button-address-info"
                >
                  Why we ask
                  <ChevronDown
                    className={cn("h-3 w-3 transition-transform", showAddrInfo && "rotate-180")}
                  />
                </button>
                {showAddrInfo && (
                  <FormDescription id="address-info" className="mt-1 text-xs text-muted-foreground">
                    Confirms the service area and helps plan the visit. Never shared or sold.{" "}
                    <Link
                      href="/privacy-policy"
                      className="underline underline-offset-2 hover:text-foreground"
                    >
                      Privacy policy
                    </Link>
                    .
                  </FormDescription>
                )}
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {showNote ? (
          <FormField
            control={form.control}
            name="message"
            render={({ field }) => (
              <FormItem>
                <FormLabel className={labelClass}>
                  Anything else we should know?{" "}
                  <span className="normal-case text-muted-foreground">(optional)</span>
                </FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="The task list, the symptoms, or your timing..."
                    rows={3}
                    data-testid="textarea-message"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        ) : (
          <button
            type="button"
            onClick={() => setShowNote(true)}
            className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground"
            data-testid="button-add-note"
          >
            <Plus className="h-3.5 w-3.5" />
            Add a note <span className="text-muted-foreground">(optional)</span>
          </button>
        )}

        <p className="text-xs text-muted-foreground">
          No spam. We review your request and confirm next steps. Written price before work starts.
        </p>

        <Button
          type="submit"
          variant="brand"
          disabled={mutation.isPending}
          aria-busy={mutation.isPending}
          className="min-h-12 w-full border-transparent bg-[#C56B4A] text-base text-[#fbfaf6] hover:bg-[#92472C]"
          data-testid="consult-wizard-actions"
        >
          {mutation.isPending ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
              Sending…
            </>
          ) : (
            CTA_FORM_SEND
          )}
        </Button>
      </form>
    </Form>
  );
}
