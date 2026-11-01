/**
 * Choices on the request form, shared by the form and the server so a label
 * the visitor tapped is the label the team reads.
 */

/** Step 2 "Type of work". Values are the slugs the p5 intake bridge already maps. */
export const JOB_CHOICES = [
  { value: "drywall-repair", label: "Drywall repair" },
  { value: "painting-touch-ups", label: "Painting" },
  { value: "plumbing-repairs", label: "Plumbing" },
  { value: "electrical-repairs", label: "Electrical" },
  { value: "mounting-assembly", label: "Mounting and assembly" },
  { value: "carpentry-trim-repair", label: "Carpentry, doors and trim" },
  { value: "fence-deck-gutter-repair", label: "Fence, deck and gutter" },
  { value: "home-maintenance", label: "Caulking and maintenance" },
  { value: "task-list", label: "A list of different jobs" },
] as const;

export function jobLabel(value: string): string {
  return JOB_CHOICES.find((choice) => choice.value === value)?.label ?? value;
}

/** Step 2 "When would you like this done?" */
export const TIMING_OPTIONS = ["Soon", "1 to 3 months", "3 to 6 months", "Just planning"] as const;
