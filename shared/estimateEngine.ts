/**
 * Handyman job pricing engine for Boise Handyman Co.
 *
 * Small on purpose: a handyman estimate is trip fee + labor hours at an hourly
 * rate, adjusted for scheduling urgency, presented as a range. Every function
 * here is pure so the verify scripts (verify:estimate, verify:golden,
 * verify:lead-payload) can exercise the exact arithmetic the UI and the lead
 * routes use.
 *
 * WHERE THE NUMBERS COME FROM (reviewed 2026-09-03)
 *
 * These were previously flagged as plausible placeholders. They are now set to
 * Boise-market rates for an insured company operating under a design-build
 * parent, and the task hours to realistic billed times for that work:
 *
 *   - Hourly rate 95. Independent operators in the Treasure Valley run 60-85;
 *     established insured companies 85-125. 95 sits where this brand sits.
 *   - Trip fee 49, inside the local 39-99 band and competitive at the low end.
 *   - Minimum one billed hour, so the floor for any visit is 144 before
 *     materials - deliberately below the two-hour minimum many competitors
 *     carry, because small jobs are the funnel into larger P5 work.
 *   - Supply run 0.75 h, a realistic round trip to a Meridian supplier.
 *   - Urgency +15% priority / +30% same-week. Conservative: emergency work
 *     commonly carries +50% or more.
 *
 * Task hours were raised on the eleven jobs where real-world friction, not the
 * task itself, sets the duration: seized angle stops on a faucet swap, texture
 * matching, overhead ceiling work, stripping old caulk. The prior figures
 * under-quoted those, and under-quoting is the dangerous direction - it sets an
 * expectation the invoice cannot meet.
 *
 * These are market-derived defaults, NOT confirmed P5 costs. The owner should
 * still sanity-check the rate, the trip fee, and the five tasks Handyman quotes
 * most often; any of them can be changed here and verify:golden will show the
 * effect on real quoted scenarios.
 */

/* ────────────────────────────────────────────────────────────── categories */

/**
 * The wizard's job categories: the eight live service slugs from
 * shared/contentData.ts (verify-estimate-engine asserts they stay in sync)
 * plus a catch-all for jobs that do not fit a named service.
 */
export const JOB_CATEGORY_IDS = [
  "drywall-repair",
  "painting-touch-ups",
  "plumbing-repairs",
  "electrical-repairs",
  "carpentry-trim-repair",
  "mounting-assembly",
  "fence-deck-gutter-repair",
  "home-maintenance",
  "something-else",
] as const;

export type JobCategoryId = (typeof JOB_CATEGORY_IDS)[number];

export const JOB_CATEGORY_LABELS: Record<JobCategoryId, { label: string; sub: string }> = {
  "drywall-repair": { label: "Drywall Repair & Patching", sub: "Holes, cracks, texture" },
  "painting-touch-ups": { label: "Interior & Exterior Painting", sub: "Touch-ups and small paint jobs" },
  "plumbing-repairs": { label: "Minor Plumbing Repairs", sub: "Faucets, toilets, disposals" },
  "electrical-repairs": { label: "Minor Electrical Repairs", sub: "Outlets, switches, fixtures" },
  "carpentry-trim-repair": { label: "Carpentry & Trim Repair", sub: "Doors, trim, cabinets" },
  "mounting-assembly": { label: "Mounting & Assembly", sub: "TVs, shelves, furniture" },
  "fence-deck-gutter-repair": { label: "Fence, Deck & Gutter Repair", sub: "Outdoor fixes" },
  "home-maintenance": { label: "Caulking & Home Maintenance", sub: "Caulk, seals, small upkeep" },
  "something-else": { label: "Something else", sub: "General punch list or odd job" },
};

/* ─────────────────────────────────────────────────────────── task catalog */

export interface TaskOption {
  /** Globally unique id (stable; used on the wire and in golden tests). */
  id: string;
  label: string;
  /** One-line clarifier under the card label. */
  sub?: string;
  /**
   * Estimated on-site hours for one unit of this task.
   * Figures below are Boise-market defaults reviewed 2026-09-03; see the
   * provenance note at the top of this file.
   */
  hours: number;
  /** What "quantity" counts, when more than one makes sense. */
  unitLabel?: string;
  /** Highest quantity the picker offers (defaults to 1: no quantity control). */
  maxQuantity?: number;
}

/**
 * Common fixed-scope tasks per category. Deliberately short lists: these are
 * the jobs we can scope from a description alone. Anything else goes through
 * the "something not listed" path with a small/medium/large duration.
 */
export const TASK_CATALOG: Record<Exclude<JobCategoryId, "something-else">, TaskOption[]> = {
  "drywall-repair": [
    { id: "drywall-small-patch", label: "Small hole patch", sub: "Doorknob or fist-size, under 6 in", hours: 2, unitLabel: "patches", maxQuantity: 10 },
    { id: "drywall-large-patch", label: "Large hole or crack repair", sub: "6 in to about 2 ft", hours: 3, unitLabel: "areas", maxQuantity: 6 },
    { id: "drywall-ceiling-patch", label: "Ceiling patch", sub: "Includes texture blend", hours: 3, unitLabel: "areas", maxQuantity: 4 },
    { id: "drywall-texture-match", label: "Texture matching", sub: "Blend a patched area into the wall", hours: 2, unitLabel: "areas", maxQuantity: 6 },
  ],
  "painting-touch-ups": [
    { id: "paint-room-touch-up", label: "Touch-up painting, one room", sub: "Scuffs, patches, small areas", hours: 2.5, unitLabel: "rooms", maxQuantity: 6 },
    { id: "paint-accent-wall", label: "Paint a single wall", sub: "Accent wall or repaired wall", hours: 2, unitLabel: "walls", maxQuantity: 8 },
    { id: "paint-door-trim", label: "Paint a door or trim run", sub: "One door or one room of trim", hours: 2, unitLabel: "items", maxQuantity: 8 },
    { id: "paint-exterior-spot", label: "Exterior touch-up", sub: "Siding or trim spot repair", hours: 2.5, unitLabel: "areas", maxQuantity: 6 },
  ],
  "plumbing-repairs": [
    { id: "plumbing-faucet-swap", label: "Faucet replacement", sub: "Kitchen or bath, like for like", hours: 2, unitLabel: "faucets", maxQuantity: 6 },
    { id: "plumbing-toilet-repair", label: "Toilet repair", sub: "Fill valve, flapper, seal, handle", hours: 1, unitLabel: "toilets", maxQuantity: 6 },
    { id: "plumbing-toilet-replace", label: "Toilet replacement", sub: "Swap in a new unit", hours: 2.5, unitLabel: "toilets", maxQuantity: 4 },
    { id: "plumbing-disposal-swap", label: "Garbage disposal swap", sub: "Replace an existing unit", hours: 1.5, unitLabel: "units", maxQuantity: 3 },
    { id: "plumbing-drain-clear", label: "Slow drain clearing", sub: "Sink or tub, snake and clean", hours: 1, unitLabel: "drains", maxQuantity: 6 },
  ],
  "electrical-repairs": [
    { id: "electrical-outlet-switch", label: "Outlet or switch replacement", sub: "Like-for-like device swap", hours: 0.75, unitLabel: "devices", maxQuantity: 12 },
    { id: "electrical-light-fixture", label: "Light fixture replacement", sub: "Existing box and wiring", hours: 1, unitLabel: "fixtures", maxQuantity: 8 },
    { id: "electrical-ceiling-fan", label: "Ceiling fan install or swap", sub: "Fan-rated box in place", hours: 2.5, unitLabel: "fans", maxQuantity: 4 },
    { id: "electrical-smoke-detector", label: "Smoke detector replacement", sub: "Battery or existing wired base", hours: 0.5, unitLabel: "detectors", maxQuantity: 10 },
  ],
  "carpentry-trim-repair": [
    { id: "carpentry-door-adjust", label: "Door repair or adjustment", sub: "Sticking, sagging, hardware", hours: 1.5, unitLabel: "doors", maxQuantity: 8 },
    { id: "carpentry-trim-repair", label: "Baseboard or trim repair", sub: "One room or one damaged run", hours: 2, unitLabel: "rooms", maxQuantity: 6 },
    { id: "carpentry-cabinet-repair", label: "Cabinet door or hinge repair", sub: "Realign, rehang, replace hardware", hours: 1, unitLabel: "doors", maxQuantity: 10 },
    { id: "carpentry-window-repair", label: "Window hardware or screen repair", sub: "Latches, balances, screens", hours: 1.5, unitLabel: "windows", maxQuantity: 8 },
  ],
  "mounting-assembly": [
    { id: "mount-tv", label: "TV wall mount", sub: "Bracket supplied or picked up", hours: 2, unitLabel: "TVs", maxQuantity: 4 },
    { id: "mount-shelves", label: "Shelves or picture hanging", sub: "One wall or one set", hours: 1, unitLabel: "sets", maxQuantity: 8 },
    { id: "assemble-furniture", label: "Furniture assembly", sub: "Flat-pack, per item", hours: 2, unitLabel: "items", maxQuantity: 10 },
    { id: "mount-curtain-rods", label: "Curtain rods or blinds", sub: "Per window", hours: 1, unitLabel: "windows", maxQuantity: 10 },
  ],
  "fence-deck-gutter-repair": [
    { id: "fence-section-repair", label: "Fence picket or rail repair", sub: "Per damaged section", hours: 2, unitLabel: "sections", maxQuantity: 6 },
    { id: "fence-gate-repair", label: "Gate repair or realignment", sub: "Sagging or dragging gate", hours: 1.5, unitLabel: "gates", maxQuantity: 4 },
    { id: "deck-board-replace", label: "Deck board replacement", sub: "A handful of damaged boards", hours: 2.5, unitLabel: "areas", maxQuantity: 4 },
    { id: "gutter-clean", label: "Gutter cleaning", sub: "Single-story home", hours: 2.5, unitLabel: "homes", maxQuantity: 1 },
    { id: "gutter-reattach", label: "Gutter reattach or reseal", sub: "Sagging run or leaking seam", hours: 1.5, unitLabel: "runs", maxQuantity: 6 },
  ],
  "home-maintenance": [
    { id: "caulk-tub-shower", label: "Re-caulk tub or shower", sub: "Strip and recaulk one surround", hours: 2, unitLabel: "surrounds", maxQuantity: 4 },
    { id: "caulk-exterior", label: "Exterior caulking touch-up", sub: "Windows, doors, trim gaps", hours: 1.5, unitLabel: "areas", maxQuantity: 6 },
    { id: "weatherstrip-door", label: "Door weatherstripping", sub: "Seal a drafty exterior door", hours: 1, unitLabel: "doors", maxQuantity: 6 },
    { id: "grout-touch-up", label: "Tile grout touch-up", sub: "Small regrout or repair area", hours: 2, unitLabel: "areas", maxQuantity: 4 },
  ],
};

/** Look a task up by id across every category. */
export function findTaskOption(taskId: string): TaskOption | null {
  for (const tasks of Object.values(TASK_CATALOG)) {
    const found = tasks.find((t) => t.id === taskId);
    if (found) return found;
  }
  return null;
}

export function getTasksForCategory(category: JobCategoryId): TaskOption[] {
  if (category === "something-else") return [];
  return TASK_CATALOG[category];
}

/* ─────────────────────────────────────────────── "something else" sizing */

export type OtherJobSize = "small" | "medium" | "large";

export const OTHER_JOB_SIZE_VALUES = ["small", "medium", "large"] as const satisfies readonly OtherJobSize[];

/** Assumed hours per bucket for the unlisted-job path. Boise-market defaults. */
export const OTHER_JOB_SIZES: Record<OtherJobSize, { label: string; sub: string; hours: number }> = {
  small: { label: "Small", sub: "An hour or two", hours: 2 },
  medium: { label: "Medium", sub: "Half a day", hours: 4 },
  large: { label: "Large", sub: "Most of a day", hours: 8 },
};

/* ───────────────────────────────────────────────── materials and urgency */

export type MaterialsPlan = "customer" | "we-pick-up";

export const MATERIALS_PLAN_VALUES = ["customer", "we-pick-up"] as const satisfies readonly MaterialsPlan[];

export const MATERIALS_PLANS: Record<MaterialsPlan, { label: string; sub: string }> = {
  customer: { label: "I will have materials ready", sub: "You buy the parts, we bring the tools" },
  "we-pick-up": { label: "Pick materials up for me", sub: "Adds a supply-run line; materials billed at cost" },
};

export type UrgencyLevel = "standard" | "priority" | "emergency";

export const URGENCY_LEVEL_VALUES = ["standard", "priority", "emergency"] as const satisfies readonly UrgencyLevel[];

/** Scheduling surcharges. Conservative: emergency work often carries +50% or more. */
export const URGENCY_LEVELS: Record<
  UrgencyLevel,
  { label: string; sub: string; multiplier: number; surchargeLabel: string | null }
> = {
  standard: { label: "Standard", sub: "Next available opening", multiplier: 1, surchargeLabel: null },
  priority: { label: "Priority", sub: "Within 2 business days", multiplier: 1.15, surchargeLabel: "+15%" },
  emergency: { label: "Same-week emergency", sub: "We shuffle the schedule", multiplier: 1.3, surchargeLabel: "+30%" },
};

/* ─────────────────────────────────────────────────────────────── pricing */

/** Customer-facing hourly labor rate. Boise market for an insured company. */
export const HOURLY_RATE_USD = 95;
/** Trip fee, applied once per visit. Inside the local 39-99 band. */
export const TRIP_FEE_USD = 49;
/** Every visit bills at least one labor hour: a 144 floor before materials. */
export const MINIMUM_LABOR_HOURS = 1;
/** Hours added for a materials supply run: a realistic supplier round trip. */
export const SUPPLY_RUN_HOURS = 0.75;
/** The quoted band around the computed total: -10% to +20%. */
export const RANGE_LOW_FACTOR = 0.9;
export const RANGE_HIGH_FACTOR = 1.2;
/** Dollar rounding step for the displayed range. */
export const RANGE_ROUNDING_USD = 5;
/** Sanity cap: a handyman visit is 1 to 8 hours; past this we refer out. */
export const MAX_REASONABLE_HOURS = 16;
export const MAX_TASK_QUANTITY = 20;

export interface HandymanTaskSelection {
  taskId: string;
  quantity: number;
}

export interface HandymanEstimateInput {
  category: JobCategoryId;
  tasks: HandymanTaskSelection[];
  /** Free-text job with a visitor-estimated size bucket. */
  otherJob?: { description: string; size: OtherJobSize } | null;
  materials: MaterialsPlan;
  urgency: UrgencyLevel;
}

export interface HandymanLine {
  id: "trip-fee" | "labor" | "supply-run" | "urgency";
  label: string;
  amount: number;
}

/**
 * A customer-facing line item. The visit fee and hourly rate are absorbed
 * silently; each entry shows a task name (or urgency/supply-run) with a
 * pre-computed price.
 */
export interface CustomerTaskLine {
  id: string;
  label: string;
  amount: number;
}

export interface HandymanEstimate {
  /** Task hours after the one-hour minimum, before the supply run. */
  laborHours: number;
  /** Labor plus supply-run hours: what the visit is expected to take. */
  totalHours: number;
  urgency: UrgencyLevel;
  materials: MaterialsPlan;
  lines: HandymanLine[];
  /**
   * Customer-facing breakdown: one line per selected task (visit fee and hourly
   * rate folded in), plus optional urgency and supply-run lines.
   */
  customerLines: CustomerTaskLine[];
  /** Trip fee + labor at the urgency-adjusted rate, unrounded midpoint. */
  total: number;
  /** The quoted band shown to the visitor. */
  priceLow: number;
  priceHigh: number;
  /** Number of catalog tasks priced (other-job counts as one when present). */
  taskCount: number;
  /** True when the visit exceeds MAX_REASONABLE_HOURS and we should talk first. */
  oversized: boolean;
}

function roundToStep(value: number, step: number): number {
  return Math.round(value / step) * step;
}

function roundQuarterHours(hours: number): number {
  return Math.round(hours * 4) / 4;
}

function clampQuantity(quantity: number, task: TaskOption): number {
  const max = Math.min(task.maxQuantity ?? 1, MAX_TASK_QUANTITY);
  if (!Number.isFinite(quantity)) return 1;
  return Math.min(Math.max(Math.round(quantity), 1), max);
}

/** Raw task hours for a selection list, before minimums. Unknown ids are ignored. */
export function sumTaskHours(tasks: HandymanTaskSelection[]): number {
  let hours = 0;
  for (const selection of tasks) {
    const task = findTaskOption(selection.taskId);
    if (!task) continue;
    hours += task.hours * clampQuantity(selection.quantity, task);
  }
  return roundQuarterHours(hours);
}

/**
 * The whole pricing model:
 *
 *   total = TRIP_FEE + billableHours * HOURLY_RATE * urgencyMultiplier
 *   range = [total * 0.9, total * 1.2], rounded to $5
 *
 * Returns null until the input contains at least one priceable task (or a
 * described other-job), so the UI can render a "make your selections" state
 * instead of a fake $0 estimate.
 */
export function calculateHandymanEstimate(input: HandymanEstimateInput): HandymanEstimate | null {
  const taskHours = sumTaskHours(input.tasks);
  const otherHours =
    input.otherJob && input.otherJob.description.trim().length > 0
      ? OTHER_JOB_SIZES[input.otherJob.size].hours
      : 0;

  const rawHours = roundQuarterHours(taskHours + otherHours);
  if (rawHours <= 0) return null;

  const laborHours = Math.max(rawHours, MINIMUM_LABOR_HOURS);
  const supplyRunHours = input.materials === "we-pick-up" ? SUPPLY_RUN_HOURS : 0;
  const totalHours = roundQuarterHours(laborHours + supplyRunHours);

  const multiplier = URGENCY_LEVELS[input.urgency].multiplier;
  const baseLabor = laborHours * HOURLY_RATE_USD;
  const baseSupplyRun = supplyRunHours * HOURLY_RATE_USD;
  const urgencyUpcharge = (baseLabor + baseSupplyRun) * (multiplier - 1);

  const lines: HandymanLine[] = [
    { id: "trip-fee", label: "Visit fee", amount: TRIP_FEE_USD },
    {
      id: "labor",
      label: `Labor, ${formatHours(laborHours)}`,
      amount: round2(baseLabor),
    },
  ];
  if (supplyRunHours > 0) {
    lines.push({
      id: "supply-run",
      label: `Materials pick-up run, ${formatHours(supplyRunHours)}`,
      amount: round2(baseSupplyRun),
    });
  }
  if (multiplier > 1) {
    const surcharge = URGENCY_LEVELS[input.urgency].surchargeLabel ?? "";
    lines.push({
      id: "urgency",
      label: `${URGENCY_LEVELS[input.urgency].label} scheduling ${surcharge}`.trim(),
      amount: round2(urgencyUpcharge),
    });
  }

  const total = round2(lines.reduce((sum, line) => sum + line.amount, 0));

  const taskCount =
    input.tasks.filter((t) => findTaskOption(t.taskId) !== null).length + (otherHours > 0 ? 1 : 0);

  // ── Customer-facing lines: task names with prices baked in ──────────────
  // All amounts are whole dollars so the sum of displayed line amounts always
  // equals the displayed total (formatHandymanCurrency rounds to whole dollars).
  // We use the largest-remainder method to distribute each pool exactly.
  const displayTotal = Math.round(total);
  const urgencyDollars = multiplier > 1 ? Math.round(urgencyUpcharge) : 0;
  const supplyRunDollars = supplyRunHours > 0 ? Math.round(baseSupplyRun) : 0;
  // The task pool is whatever remains after urgency and supply-run are claimed.
  const taskPoolDollars = displayTotal - urgencyDollars - supplyRunDollars;

  // Collect per-task entries with their raw unrounded hours for proportional split.
  const perTaskEntries: { id: string; label: string; rawHrs: number }[] = [];
  for (const sel of input.tasks) {
    const task = findTaskOption(sel.taskId);
    if (!task) continue;
    const qty = clampQuantity(sel.quantity, task);
    const label = qty > 1 ? `${task.label} \u00d7${qty}` : task.label;
    perTaskEntries.push({ id: task.id, label, rawHrs: task.hours * qty });
  }
  if (otherHours > 0 && input.otherJob) {
    const desc = input.otherJob.description.trim();
    perTaskEntries.push({
      id: "other-job",
      label: desc.length > 0 ? desc : OTHER_JOB_SIZES[input.otherJob.size].label,
      rawHrs: otherHours,
    });
  }

  // Distribute taskPoolDollars across task entries proportionally, using the
  // largest-remainder method so integer amounts sum exactly to taskPoolDollars.
  const totalRawHrs = perTaskEntries.reduce((s, e) => s + e.rawHrs, 0);
  const exactShares = perTaskEntries.map((e) =>
    totalRawHrs > 0 ? taskPoolDollars * (e.rawHrs / totalRawHrs) : taskPoolDollars / perTaskEntries.length
  );
  const floorShares = exactShares.map(Math.floor);
  const remainder = taskPoolDollars - floorShares.reduce((s, v) => s + v, 0);
  const fractionals = exactShares
    .map((v, i) => ({ i, frac: v - Math.floor(v) }))
    .sort((a, b) => b.frac - a.frac);
  for (let k = 0; k < remainder; k++) floorShares[fractionals[k].i]++;

  const customerLines: CustomerTaskLine[] = perTaskEntries.map((entry, i) => ({
    id: entry.id,
    label: entry.label,
    amount: floorShares[i],
  }));
  if (supplyRunHours > 0) {
    customerLines.push({ id: "supply-run", label: "Materials pickup", amount: supplyRunDollars });
  }
  if (multiplier > 1) {
    const surcharge = URGENCY_LEVELS[input.urgency].surchargeLabel ?? "";
    customerLines.push({
      id: "urgency",
      label: `${URGENCY_LEVELS[input.urgency].label} scheduling${surcharge ? ` (${surcharge})` : ""}`,
      amount: urgencyDollars,
    });
  }

  return {
    laborHours,
    totalHours,
    urgency: input.urgency,
    materials: input.materials,
    lines,
    customerLines,
    total,
    priceLow: roundToStep(total * RANGE_LOW_FACTOR, RANGE_ROUNDING_USD),
    priceHigh: roundToStep(total * RANGE_HIGH_FACTOR, RANGE_ROUNDING_USD),
    taskCount,
    oversized: totalHours > MAX_REASONABLE_HOURS,
  };
}

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

/* ─────────────────────────────────────────────────────────── formatting */

export function formatHandymanCurrency(value: number): string {
  return `$${Math.round(value).toLocaleString("en-US")}`;
}

export function formatHours(hours: number): string {
  const rounded = roundQuarterHours(hours);
  return rounded === 1 ? "1 hr" : `${rounded} hrs`;
}

/** One-line summary of the selections, for sticky bars and lead records. */
export function buildHandymanSummary(input: HandymanEstimateInput): string {
  const category = JOB_CATEGORY_LABELS[input.category]?.label ?? "Handyman work";
  const named = input.tasks
    .map((t) => {
      const task = findTaskOption(t.taskId);
      if (!task) return null;
      const qty = clampQuantity(t.quantity, task);
      return qty > 1 ? `${task.label} x${qty}` : task.label;
    })
    .filter((v): v is string => v !== null);
  if (input.otherJob && input.otherJob.description.trim().length > 0) {
    named.push(`Other: ${OTHER_JOB_SIZES[input.otherJob.size].label.toLowerCase()} job`);
  }
  return named.length > 0 ? `${category}: ${named.join(", ")}` : category;
}

/* ─────────────────────────────────────────────────────────── disclaimers */

/** Shown wherever a range is rendered. */
export const HANDYMAN_RATE_DISCLAIMER =
  "Typical starting rates. Your written quote comes before any work begins.";

/** Shown with every estimate: the range is labor only. */
export const MATERIALS_COST_NOTE =
  "This estimate covers your selected tasks only. Materials are billed at cost with your receipt, whether you supply them or we pick them up.";

/** Shown when totalHours exceeds MAX_REASONABLE_HOURS. */
export const OVERSIZED_JOB_NOTE =
  "That is a bigger visit than we usually book online. Send it through anyway and we will call to scope it properly, or split it across visits.";

/* ────────────────────────────────────────────── legacy construction engine */

/*
 * Everything below re-exports the retired Boise Construction Co engine so
 * modules owned by other packages (server/services, admin routes,
 * ConsultationForm, shared/costs) keep compiling. The handyman estimator does
 * not use any of it. Remove once those consumers are converted.
 */
export * from "./legacy/constructionEstimateEngine";
