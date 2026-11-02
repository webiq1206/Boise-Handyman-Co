"use client";

import { useMemo, useState } from "react";
import { ArrowRight } from "lucide-react";
import { Reveal } from "@/components/Reveal";
import { Section } from "@/components/marketing/Section";
import { Button } from "@/components/ui/button";
import { SelectableCard } from "@/components/estimate/wizard/SelectableCard";
import { CTA_PRIMARY } from "@/shared/ctaCopy";
import Link from "next/link";
import { toSentenceCase } from "@/shared/sentenceCase";
import {
  JOB_CATEGORY_LABELS,
  TASK_CATALOG,
  calculateHandymanEstimate,
  formatHandymanCurrency,
  HANDYMAN_RATE_DISCLAIMER,
  type JobCategoryId,
} from "@/shared/estimateEngine";

/** Six featured categories - D2 choice-card budget, light homepage density (C14). */
const PROOF_CATEGORIES = [
  "drywall-repair",
  "painting-touch-ups",
  "plumbing-repairs",
  "electrical-repairs",
  "mounting-assembly",
  "carpentry-trim-repair",
] as const satisfies readonly Exclude<JobCategoryId, "something-else">[];

/**
 * Homepage interactive proof (C14): pick a common job, see a planning range
 * immediately, no email gate. Rates come from shared/estimateEngine (reviewed
 * market defaults). Written quote still happens after contact.
 */
export function HandymanPlanningRange() {
  // Drywall and its first task are selected on arrival, so the panel opens on a
  // worked example instead of an empty box; one click changes it.
  const [category, setCategory] = useState<(typeof PROOF_CATEGORIES)[number] | null>(PROOF_CATEGORIES[0]);
  const [taskId, setTaskId] = useState<string | null>(TASK_CATALOG[PROOF_CATEGORIES[0]][0]?.id ?? null);

  const tasks = category ? TASK_CATALOG[category].slice(0, 4) : [];

  const estimate = useMemo(() => {
    if (!category || !taskId) return null;
    return calculateHandymanEstimate({
      category,
      tasks: [{ taskId, quantity: 1 }],
      materials: "customer",
      urgency: "standard",
    });
  }, [category, taskId]);

  function selectCategory(next: (typeof PROOF_CATEGORIES)[number]) {
    setCategory(next);
    setTaskId(null);
  }

  return (
    <Section
      id="planning-range"
      surface="dark"
      spacing="xl"
      edge
      className="handyman-planning-range fr-band"
      data-testid="handyman-planning-range"
    >
      <div className="ed-shell relative z-10">
        <div className="ed-split ed-split-end">
          <Reveal>
            <p className="ed-eyebrow">Planning range</p>
            <h2 className="ed-h2 ed-statement-wide">
              See a ballpark before you{" "}
              <em className="not-italic" style={{ color: "var(--ed-accent)" }}>
                send the list
              </em>
              .
            </h2>
          </Reveal>
          <Reveal delay={60}>
            <p className="ed-body">
              Pick a common job. You get a planning range right away, then a written
              price before any work starts.
            </p>
          </Reveal>
        </div>

        <Reveal delay={80}>
          <div className="mt-[clamp(32px,4vw,56px)] grid gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-start">
            <div className="space-y-6">
              <div>
                <p className="ed-small mb-3" style={{ color: "var(--ed-muted-ink)" }}>
                  1. What kind of job?
                </p>
                <div
                  role="radiogroup"
                  aria-label="Job category"
                  className="grid grid-cols-1 gap-2 sm:grid-cols-2"
                >
                  {PROOF_CATEGORIES.map((id) => (
                    <SelectableCard
                      key={id}
                      dense
                      control="radio"
                      selected={category === id}
                      onSelect={() => selectCategory(id)}
                      title={toSentenceCase(JOB_CATEGORY_LABELS[id].label)}
                      description={JOB_CATEGORY_LABELS[id].sub}
                      data-testid={`proof-category-${id}`}
                    />
                  ))}
                </div>
              </div>

              {category && (
                <div>
                  <p className="ed-small mb-3" style={{ color: "var(--ed-muted-ink)" }}>
                    2. Which task?
                  </p>
                  <div
                    role="radiogroup"
                    aria-label="Task"
                    className="grid grid-cols-1 gap-2 sm:grid-cols-2"
                  >
                    {tasks.map((task) => (
                      <SelectableCard
                        key={task.id}
                        dense
                        control="radio"
                        selected={taskId === task.id}
                        onSelect={() => setTaskId(task.id)}
                        title={toSentenceCase(task.label)}
                        description={task.sub}
                        data-testid={`proof-task-${task.id}`}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>

            <aside
              className="fr-range-result hm-range-result"
              aria-live="polite"
              data-testid="proof-result"
            >
              <p className="fr-range-result-label">Your planning range</p>
              {estimate ? (
                <>
                  <p
                    className="fr-range-result-figure"
                    data-testid="proof-range-value"
                  >
                    {formatHandymanCurrency(estimate.priceLow)}
                    <span className="mx-2 text-[0.55em] opacity-50">to</span>
                    {formatHandymanCurrency(estimate.priceHigh)}
                  </p>
                  <p className="ed-body mt-3 text-[0.875rem]">
                    Before materials · about {estimate.totalHours} hrs on site
                  </p>
                  <p className="ed-small mt-4" style={{ color: "var(--ed-muted-ink)" }}>
                    {HANDYMAN_RATE_DISCLAIMER}
                  </p>
                  <Button
                    asChild
                    variant="brand"
                    className="mt-6 min-h-12 whitespace-normal px-5"
                    data-testid="proof-cta-contact"
                  >
                    {/* The request form is on this page (#consult): land on it. */}
                    <Link href="/#consult">
                      {CTA_PRIMARY}
                      <ArrowRight className="h-4 w-4" aria-hidden="true" />
                    </Link>
                  </Button>
                </>
              ) : (
                <p className="ed-body mt-4 text-[0.9375rem]" style={{ color: "var(--ed-muted-ink)" }}>
                  Choose a job and task to see a planning range. No email required.
                </p>
              )}
            </aside>
          </div>
        </Reveal>
      </div>
    </Section>
  );
}
