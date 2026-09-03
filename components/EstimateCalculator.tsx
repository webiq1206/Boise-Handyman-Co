"use client";

/**
 * The Boise Handyman Co instant estimator.
 *
 * Four steps: what kind of job, what needs doing (with quantities), materials
 * and timing, then contact details next to the live estimate. All pricing math
 * lives in shared/estimateEngine.ts (calculateHandymanEstimate); this file is
 * only the guided flow around it.
 *
 * Replaces the construction-era 4,900-line wizard. Same export name and props
 * so app/page.tsx, app/estimate/page.tsx and ModalProvider keep working.
 */

import { useEffect, useMemo, useRef, useState } from "react";
import {
  ClipboardList,
  Droplets,
  Hammer,
  Minus,
  Paintbrush,
  Plus,
  Ruler,
  Trees,
  Tv,
  Wrench,
  Zap,
  Check,
  type LucideIcon,
} from "lucide-react";
import { Section } from "@/components/marketing";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  SelectableCard,
  WizardActionBar,
  WizardField,
  WizardProgress,
  WizardStep,
  WizardTextArea,
  type WizardStepMeta,
} from "@/components/estimate/wizard";
import {
  EstimateResultPanel,
  type EstimateProgress,
} from "@/components/estimate/EstimateResultPanel";
import { StickyEstimateBar } from "@/components/estimate/StickyEstimateBar";
import {
  buildHandymanSummary,
  calculateHandymanEstimate,
  getTasksForCategory,
  JOB_CATEGORY_IDS,
  JOB_CATEGORY_LABELS,
  MATERIALS_PLANS,
  MATERIALS_PLAN_VALUES,
  OTHER_JOB_SIZES,
  OTHER_JOB_SIZE_VALUES,
  URGENCY_LEVELS,
  URGENCY_LEVEL_VALUES,
  HANDYMAN_RATE_DISCLAIMER,
  type HandymanEstimate,
  type HandymanEstimateInput,
  type JobCategoryId,
  type MaterialsPlan,
  type OtherJobSize,
  type UrgencyLevel,
} from "@/shared/estimateEngine";
import { CITIES } from "@/shared/contentData";
import { trackEvent, trackMetaEvent } from "@/lib/analytics";
import { GRAIN_URL } from "@/lib/grain";
import { readStoredPrefill, writeStoredPrefill } from "@/lib/leadPrefill";

/* ────────────────────────────────────────────────────────────── constants */

const CATEGORY_ICONS: Record<JobCategoryId, LucideIcon> = {
  "drywall-repair": Hammer,
  "painting-touch-ups": Paintbrush,
  "plumbing-repairs": Droplets,
  "electrical-repairs": Zap,
  "carpentry-trim-repair": Ruler,
  "mounting-assembly": Tv,
  "fence-deck-gutter-repair": Trees,
  "home-maintenance": Wrench,
  "something-else": ClipboardList,
};

type WizStep = "job" | "tasks" | "details" | "contact";

const STEP_META: WizardStepMeta[] = [
  { id: "job", label: "Job type" },
  { id: "tasks", label: "What needs doing" },
  { id: "details", label: "Materials & timing" },
  { id: "contact", label: "Your estimate" },
];

/* ──────────────────────────────────────────────────────────── component */

export interface EstimateCalculatorProps {
  inModal?: boolean;
  onBookVisit?: () => void;
}

export function EstimateCalculator({
  inModal = false,
  onBookVisit,
}: EstimateCalculatorProps) {
  /* Selections. Nothing is pre-selected. */
  const [category, setCategory] = useState<JobCategoryId | null>(null);
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [otherOpen, setOtherOpen] = useState(false);
  const [otherText, setOtherText] = useState("");
  const [otherSize, setOtherSize] = useState<OtherJobSize | null>(null);
  const [materials, setMaterials] = useState<MaterialsPlan | null>(null);
  const [urgency, setUrgency] = useState<UrgencyLevel | null>(null);

  /* Contact. */
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [city, setCity] = useState("");
  const [notes, setNotes] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const [wizStep, setWizStep] = useState<WizStep>("job");
  const wizIndex = STEP_META.findIndex((s) => s.id === wizStep);
  const topRef = useRef<HTMLDivElement | null>(null);

  /* Prefill returning visitors' contact details. */
  useEffect(() => {
    const prefill = readStoredPrefill();
    if (prefill.name) setName((v) => v || prefill.name || "");
    if (prefill.email) setEmail((v) => v || prefill.email || "");
    if (prefill.phone) setPhone((v) => v || prefill.phone || "");
  }, []);

  /* ───────────────────────────────────────────────── derived estimate */

  const otherJob =
    otherText.trim().length > 0 && otherSize
      ? { description: otherText.trim(), size: otherSize }
      : null;

  const taskSelections = useMemo(
    () =>
      Object.entries(quantities)
        .filter(([, qty]) => qty > 0)
        .map(([taskId, quantity]) => ({ taskId, quantity })),
    [quantities],
  );

  /* The live input. Before materials/timing are picked, the provisional range
     uses the cheapest assumptions (own materials, standard scheduling); the
     range visibly updates when the visitor chooses otherwise. */
  const estimateInput: HandymanEstimateInput | null = category
    ? {
        category,
        tasks: taskSelections,
        otherJob,
        materials: materials ?? "customer",
        urgency: urgency ?? "standard",
      }
    : null;

  const estimate: HandymanEstimate | null = useMemo(
    () => (estimateInput ? calculateHandymanEstimate(estimateInput) : null),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [category, taskSelections, otherText, otherSize, materials, urgency],
  );

  const summary = estimateInput ? buildHandymanSummary(estimateInput) : "Your job";

  /* ─────────────────────────────────────────────────── step handling */

  const hasWork = taskSelections.length > 0 || otherJob !== null;

  const stepDone = (step: WizStep): boolean => {
    switch (step) {
      case "job":
        return category !== null;
      case "tasks":
        return hasWork;
      case "details":
        return materials !== null && urgency !== null;
      case "contact":
        return (
          name.trim().length >= 2 &&
          /.+@.+\..+/.test(email.trim()) &&
          city.trim().length > 0
        );
    }
  };

  const scrollToTop = () => {
    topRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const goTo = (step: WizStep) => {
    setWizStep(step);
    scrollToTop();
  };

  const advance = () => {
    if (wizStep === "contact") {
      void submitLead();
      return;
    }
    const next = STEP_META[wizIndex + 1]?.id as WizStep | undefined;
    if (next) goTo(next);
  };

  const back = () => {
    const prev = STEP_META[wizIndex - 1]?.id as WizStep | undefined;
    if (prev) goTo(prev);
  };

  const pickCategory = (id: JobCategoryId) => {
    if (category !== id) {
      /* A new job type invalidates the picked tasks, not the contact info. */
      setQuantities({});
      setOtherOpen(id === "something-else");
      if (id !== "something-else") {
        setOtherText("");
        setOtherSize(null);
      }
    }
    setCategory(id);
    goTo("tasks");
  };

  const setQty = (taskId: string, qty: number, max: number) => {
    setQuantities((prev) => {
      const next = { ...prev };
      const clamped = Math.min(Math.max(qty, 0), max);
      if (clamped <= 0) delete next[taskId];
      else next[taskId] = clamped;
      return next;
    });
  };

  /* ────────────────────────────────────────────────────── submission */

  async function submitLead() {
    const errors: Record<string, string> = {};
    if (name.trim().length < 2) errors.name = "Please tell us your name.";
    if (!/.+@.+\..+/.test(email.trim()))
      errors.email = "We need a valid email to send your estimate.";
    if (phone.trim() !== "" && phone.replace(/\D/g, "").length < 10)
      errors.phone = "That phone number looks short. 10 digits, please.";
    if (city.trim().length === 0) errors.city = "Pick the city the work is in.";
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0 || !estimate || !estimateInput) return;

    setSubmitting(true);
    setSubmitError(null);
    try {
      const res = await fetch("/api/estimate-lead", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
          phone: phone.trim(),
          city: city.trim(),
          notes: notes.trim() || undefined,
          estimate: {
            category: estimateInput.category,
            tasks: estimateInput.tasks,
            otherJob: estimateInput.otherJob ?? null,
            materials: estimateInput.materials,
            urgency: estimateInput.urgency,
            priceLow: estimate.priceLow,
            priceHigh: estimate.priceHigh,
            laborHours: estimate.laborHours,
          },
        }),
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => null)) as { message?: string } | null;
        throw new Error(data?.message || "Something went wrong sending your estimate.");
      }
      writeStoredPrefill({ name: name.trim(), email: email.trim(), phone: phone.trim() });
      trackEvent("handyman_estimate_submitted", {
        category: estimateInput.category,
        urgency: estimateInput.urgency,
      });
      trackMetaEvent("Lead", { content_name: "handyman-estimate" });
      setSubmitted(true);
      scrollToTop();
    } catch (err) {
      setSubmitError(
        err instanceof Error
          ? err.message
          : "Something went wrong sending your estimate. Please try again.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  /* ──────────────────────────────────────────────────────── step bodies */

  const jobStep = (
    <WizardStep
      tone="inverse"
      eyebrow="Instant estimate"
      heading="What kind of job is it?"
      instructions="Pick the closest match. If it spans a few trades, pick the biggest part; you can describe the rest later."
      data-testid="step-job"
    >
      <div
        className="grid grid-cols-1 gap-2.5 sm:grid-cols-2"
        role="radiogroup"
        aria-label="Type of job"
      >
        {JOB_CATEGORY_IDS.map((id) => {
          const Icon = CATEGORY_ICONS[id];
          return (
            <SelectableCard
              key={id}
              control="radio"
              tone="inverse"
              selected={category === id}
              onSelect={() => pickCategory(id)}
              icon={<Icon />}
              title={JOB_CATEGORY_LABELS[id].label}
              description={JOB_CATEGORY_LABELS[id].sub}
              data-testid={`job-card-${id}`}
            />
          );
        })}
      </div>
    </WizardStep>
  );

  const categoryTasks = category ? getTasksForCategory(category) : [];

  const tasksStep = (
    <WizardStep
      tone="inverse"
      eyebrow={category ? JOB_CATEGORY_LABELS[category].label : undefined}
      heading={
        category === "something-else"
          ? "Tell us about the job"
          : "What needs doing?"
      }
      instructions={
        category === "something-else"
          ? "A sentence or two is plenty. Then take a guess at the size; we confirm the real scope before any work starts."
          : "Pick everything on the list, and set how many. Anything not listed can go under \"something not listed\"."
      }
      data-testid="step-tasks"
    >
      <div className="space-y-2.5">
        {categoryTasks.map((task) => {
          const qty = quantities[task.id] ?? 0;
          const selected = qty > 0;
          const max = task.maxQuantity ?? 1;
          return (
            <div key={task.id}>
              <SelectableCard
                control="checkbox"
                tone="inverse"
                selected={selected}
                onSelect={() => setQty(task.id, selected ? 0 : 1, max)}
                title={task.label}
                description={task.sub}
                data-testid={`task-card-${task.id}`}
              />
              {selected && max > 1 && (
                <div className="mt-1.5 flex items-center justify-between rounded-sm border border-inverse-foreground/15 bg-inverse-foreground/[0.04] px-4 py-2.5">
                  <span className="text-xs text-inverse-muted">
                    How many {task.unitLabel ?? "of these"}?
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setQty(task.id, qty - 1, max)}
                      aria-label={`Fewer ${task.unitLabel ?? "items"}`}
                      className="flex h-11 w-11 items-center justify-center rounded-sm border border-inverse-foreground/25 text-inverse-foreground hover:border-inverse-foreground/50"
                      data-testid={`qty-minus-${task.id}`}
                    >
                      <Minus className="h-4 w-4" aria-hidden="true" />
                    </button>
                    <span
                      className="w-8 text-center text-sm tabular-nums text-inverse-foreground"
                      data-testid={`qty-value-${task.id}`}
                      aria-live="polite"
                    >
                      {qty}
                    </span>
                    <button
                      type="button"
                      onClick={() => setQty(task.id, qty + 1, max)}
                      disabled={qty >= max}
                      aria-label={`More ${task.unitLabel ?? "items"}`}
                      className="flex h-11 w-11 items-center justify-center rounded-sm border border-inverse-foreground/25 text-inverse-foreground hover:border-inverse-foreground/50 disabled:opacity-40"
                      data-testid={`qty-plus-${task.id}`}
                    >
                      <Plus className="h-4 w-4" aria-hidden="true" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}

        {category !== "something-else" && (
          <SelectableCard
            control="checkbox"
            tone="inverse"
            selected={otherOpen}
            onSelect={() => {
              setOtherOpen((prev) => {
                if (prev) {
                  setOtherText("");
                  setOtherSize(null);
                }
                return !prev;
              });
            }}
            title="Something not listed"
            description="Describe it and take a guess at the size"
            data-testid="task-card-other"
          />
        )}

        {(otherOpen || category === "something-else") && (
          <div className="space-y-3 rounded-sm border border-inverse-foreground/15 bg-inverse-foreground/[0.04] p-4">
            <WizardTextArea
              tone="inverse"
              label="What needs doing?"
              rows={3}
              maxLength={600}
              value={otherText}
              onChange={(e) => setOtherText(e.target.value)}
              placeholder="e.g. The back door drags and the porch light hangs loose"
              data-testid="input-other-description"
            />
            <div role="radiogroup" aria-label="About how big is it?">
              <p className="mb-1.5 text-xs text-inverse-muted">
                About how big is it?
              </p>
              <div className="grid grid-cols-3 gap-2">
                {OTHER_JOB_SIZE_VALUES.map((size) => (
                  <SelectableCard
                    key={size}
                    control="radio"
                    tone="inverse"
                    selected={otherSize === size}
                    onSelect={() => setOtherSize(size)}
                    title={OTHER_JOB_SIZES[size].label}
                    description={OTHER_JOB_SIZES[size].sub}
                    data-testid={`other-size-${size}`}
                  />
                ))}
              </div>
              <p className="mt-2 text-xs text-inverse-muted/90">
                Your guess only sets the starting range. We confirm the real
                scope with you before any work begins.
              </p>
            </div>
          </div>
        )}
      </div>
    </WizardStep>
  );

  const detailsStep = (
    <WizardStep
      tone="inverse"
      eyebrow="Almost there"
      heading="Materials and timing"
      instructions="Two quick choices that change the estimate, so you see them now instead of on the invoice."
      data-testid="step-details"
    >
      <div className="space-y-6">
        <div role="radiogroup" aria-label="Who supplies materials?">
          <p className="mb-2 text-xs text-inverse-muted">Who supplies materials?</p>
          <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
            {MATERIALS_PLAN_VALUES.map((plan) => (
              <SelectableCard
                key={plan}
                control="radio"
                tone="inverse"
                selected={materials === plan}
                onSelect={() => setMaterials(plan)}
                title={MATERIALS_PLANS[plan].label}
                description={MATERIALS_PLANS[plan].sub}
                data-testid={`materials-${plan}`}
              />
            ))}
          </div>
          <p className="mt-2 text-xs text-inverse-muted/90">
            Either way, materials are billed at cost with the receipt. The
            estimate itself covers your selected tasks only.
          </p>
        </div>

        <div role="radiogroup" aria-label="How soon do you need it?">
          <p className="mb-2 text-xs text-inverse-muted">How soon do you need it?</p>
          <div className="grid grid-cols-1 gap-2.5">
            {URGENCY_LEVEL_VALUES.map((level) => (
              <SelectableCard
                key={level}
                control="radio"
                tone="inverse"
                selected={urgency === level}
                onSelect={() => setUrgency(level)}
                title={
                  URGENCY_LEVELS[level].surchargeLabel
                    ? `${URGENCY_LEVELS[level].label} (${URGENCY_LEVELS[level].surchargeLabel} labor)`
                    : URGENCY_LEVELS[level].label
                }
                description={URGENCY_LEVELS[level].sub}
                data-testid={`urgency-${level}`}
              />
            ))}
          </div>
        </div>
      </div>
    </WizardStep>
  );

  const cityFieldId = "estimate-city";
  const contactStep = (
    <WizardStep
      tone="inverse"
      eyebrow="Your estimate"
      heading="One last step"
      instructions="Tell us where the work is and how to reach you, and we will email your range and follow up with a firm written quote."
      data-testid="step-contact"
    >
      <div className="space-y-5">
        <EstimateResultPanel
          estimate={estimate}
          summary={summary}
          progress={{ job: true, tasks: true, details: true }}
          revealRange={submitted}
        />

        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            void submitLead();
          }}
          noValidate
        >
          <WizardField
            tone="inverse"
            label="Your name"
            required
            autoComplete="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            error={fieldErrors.name}
            data-testid="input-name"
          />
          <WizardField
            tone="inverse"
            label="Email"
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            error={fieldErrors.email}
            hint="We email your estimate here. No spam, ever."
            data-testid="input-email"
          />
          <WizardField
            tone="inverse"
            label="Phone (optional)"
            type="tel"
            autoComplete="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            error={fieldErrors.phone}
            hint="Fastest way to lock in a time, if you want a call or text."
            data-testid="input-phone"
          />
          <div>
            <label
              htmlFor={cityFieldId}
              className="mb-1.5 block text-xs text-inverse-muted"
            >
              City the work is in <span className="text-accent-legible">*</span>
            </label>
            <select
              id={cityFieldId}
              value={city}
              onChange={(e) => setCity(e.target.value)}
              aria-invalid={fieldErrors.city ? true : undefined}
              className={cn(
                "w-full min-h-12 rounded-sm border px-3.5 text-base transition-colors focus:outline-none focus:ring-2 focus:ring-accent-legible",
                "border-inverse-foreground/25 bg-inverse-foreground/5 text-inverse-foreground",
                fieldErrors.city && "border-red-400 ring-1 ring-red-400/60",
              )}
              data-testid="input-city"
            >
              <option value="" className="text-foreground">
                Choose a city
              </option>
              {CITIES.map((c) => (
                <option key={c.slug} value={c.name} className="text-foreground">
                  {c.name}
                </option>
              ))}
            </select>
            {fieldErrors.city && (
              <p className="mt-1.5 text-xs leading-snug text-red-300">
                {fieldErrors.city}
              </p>
            )}
          </div>
          <WizardTextArea
            tone="inverse"
            label="Anything else we should know? (optional)"
            rows={3}
            maxLength={1000}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Gate codes, pets, parking, photos you want to text us later..."
            data-testid="input-notes"
          />

          {submitError && (
            <div
              role="alert"
              className="rounded-md border border-red-400/40 bg-red-400/10 px-3.5 py-3 text-xs text-red-300"
              data-testid="submit-error"
            >
              {submitError}
            </div>
          )}

          {/* Native form semantics: Enter submits; the visible primary action
              lives in the sticky action bar, consistent with every step. */}
          <button type="submit" className="sr-only" tabIndex={-1} data-testid="button-submit">
            Email me my estimate
          </button>
        </form>
      </div>
    </WizardStep>
  );

  const successSurface = (
    <div ref={topRef} className="scroll-mt-20" data-testid="estimate-success">
      <div className="mb-2 flex items-center justify-between gap-3">
        <p className="brc-label text-inverse-muted">Your estimate</p>
        <span className="inline-flex items-center gap-1.5 text-xs tracking-[0.08em] uppercase text-accent-legible">
          <Check className="h-3.5 w-3.5" aria-hidden="true" />
          On its way
        </span>
      </div>
      <h2 className="font-serif text-2xl md:text-3xl tracking-tight text-inverse-foreground mb-3">
        Estimate sent. Check your inbox.
      </h2>
      <p className="text-sm leading-relaxed text-inverse-foreground/85 mb-5 max-w-xl">
        We emailed your range and the breakdown behind it. A real person reviews
        every request and follows up with a firm written quote before any work
        is scheduled.
      </p>
      {estimate && (
        <div className="mb-6 max-w-md">
          <EstimateResultPanel
            estimate={estimate}
            summary={summary}
            progress={{ job: true, tasks: true, details: true }}
          />
        </div>
      )}
      {onBookVisit && (
        <Button variant="brand" onClick={onBookVisit} data-testid="button-book-visit">
          Book a time now
        </Button>
      )}
    </div>
  );

  /* ──────────────────────────────────────────────────────────── layout */

  const stepBody = (() => {
    switch (wizStep) {
      case "job":
        return jobStep;
      case "tasks":
        return tasksStep;
      case "details":
        return detailsStep;
      case "contact":
        return contactStep;
    }
  })();

  const progress: EstimateProgress = {
    job: stepDone("job"),
    tasks: stepDone("tasks"),
    details: stepDone("details"),
  };

  const wizardSurface = (
    <div ref={topRef} className="scroll-mt-20">
      <WizardProgress steps={STEP_META} currentIndex={wizIndex} tone="inverse" />
      <div key={wizStep} className="min-h-[260px]">
        <div className={cn(!inModal && "lg:grid lg:grid-cols-[1fr_320px] lg:gap-8")}>
          <div className="min-w-0">{stepBody}</div>
          {/* Desktop rail: the live range beside the questions on every step
              except the contact step, which renders the panel inline. */}
          {!inModal && wizStep !== "contact" && (
            <div className="hidden lg:block">
              <div className="sticky top-24">
                <EstimateResultPanel
                  estimate={estimate}
                  summary={summary}
                  progress={progress}
                  revealRange={submitted}
                />
              </div>
            </div>
          )}
        </div>
      </div>
      <WizardActionBar
        tone="inverse"
        onBack={wizIndex > 0 ? back : undefined}
        onPrimary={advance}
        primaryLabel={wizStep === "contact" ? "Email me my estimate" : "Continue"}
        primaryDisabled={!stepDone(wizStep)}
        busy={submitting}
        busyLabel="Sending..."
        topAccessory={
          wizStep !== "contact" ? (
            <div className="lg:hidden">
              <StickyEstimateBar
                estimate={estimate}
                summary={summary}
                tone="inverse"
                revealRange={submitted}
              />
            </div>
          ) : undefined
        }
      />
      <p className="mt-3 text-center text-xs text-inverse-muted/90">
        {HANDYMAN_RATE_DISCLAIMER}
      </p>
    </div>
  );

  const surface = submitted ? successSurface : wizardSurface;

  /* inModal: compact card without full-viewport constraint. */
  if (inModal) {
    return (
      <div className="relative bg-inverse text-inverse-foreground rounded-lg p-5 sm:p-6">
        {surface}
      </div>
    );
  }

  /* Full page: dark section that sizes to its content. */
  return (
    <>
      <Section
        id="calculator"
        variant="inverse"
        divider
        /* overflow-CLIP, not overflow-hidden: hidden turns this section into
           the sticky containing scroller and silently un-sticks the wizard's
           bottom action bar on mobile; clip contains the decorative layers the
           same way without breaking position: sticky. */
        className="scroll-mt-16 relative overflow-clip border-y-2 border-accent-legible/40"
      >
        <div className="absolute inset-x-0 top-0 h-1 bg-accent-legible z-10" aria-hidden />
        <div className="absolute inset-0 pointer-events-none ring-1 ring-inset ring-accent-legible/15" aria-hidden />
        <div
          className="absolute inset-0 pointer-events-none opacity-[0.028]"
          style={{ backgroundImage: GRAIN_URL, backgroundRepeat: "repeat" }}
          aria-hidden
        />
        <div className="container px-4 sm:px-6 py-2 md:py-4 relative z-[1]">
          <div className="mx-auto w-full max-w-4xl">
            <div className="relative rounded-sm border border-accent-legible/45 bg-inverse-foreground/[0.04] shadow-[0_0_0_1px_hsl(var(--accent-legible)/0.1),0_24px_60px_-20px_rgba(0,0,0,0.55)]">
              <div className="absolute inset-y-0 left-0 w-1 bg-accent-legible/80 rounded-l-sm" aria-hidden />
              <div
                className="absolute inset-x-6 sm:inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-accent-legible/50 to-transparent"
                aria-hidden
              />
              <div className="relative px-5 sm:px-7 md:px-9 py-8 md:py-10 lg:py-12">{surface}</div>
            </div>
          </div>
        </div>
      </Section>
    </>
  );
}
