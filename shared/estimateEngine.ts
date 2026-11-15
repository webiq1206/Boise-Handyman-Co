/**
 * Handyman planning calculator for Boise Handyman Co.
 *
 * Task cards name a cost book code. The dollars are the customer price from
 * the shared pricing engine (lib/p5/pricing.ts): direct cost, the project
 * reserve, overhead and profit, then the estimator's quote-class range.
 * The factors arrive in HandymanPriceContext from shared/handymanCustomerPrice.ts.
 * This file does not store a markup factor.
 *
 * A task with no single cost-book line is listed in UNPRICED_CALCULATOR_ITEMS
 * and is not given a number here.
 */
// This Node-only dependency rejects accidental browser bundling without changing legacy Node fixture imports.
import "node:crypto";
if (typeof window !== "undefined") throw new Error("Private planning calculations are server-only.");
import { priceFromRiskAdjustedCost } from "../lib/p5/pricing.ts";

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
   * Cost book code priced by sharedBookRate. Absent when the old line has no
   * single book line (see UNPRICED_CALCULATOR_ITEMS).
   */
  bookCode?: string;
  /** What "quantity" counts, when more than one makes sense. */
  unitLabel?: string;
  /** Highest quantity the picker offers (defaults to 1: no quantity control). */
  maxQuantity?: number;
}

/**
 * Common fixed-scope tasks per category. Each mapped task is one cost-book
 * line. Anything without a clean code stays on the card and is not priced.
 */
export const TASK_CATALOG: Record<Exclude<JobCategoryId, "something-else">, TaskOption[]> = {
  "drywall-repair": [
    { id: "drywall-small-patch", label: "Small hole patch", sub: "Doorknob or fist-size, under 6 in", bookCode: "09-01-07", unitLabel: "patches", maxQuantity: 10 },
    { id: "drywall-large-patch", label: "Large hole or crack repair", sub: "6 in to about 2 ft", unitLabel: "areas", maxQuantity: 6 },
    { id: "drywall-ceiling-patch", label: "Ceiling patch", sub: "Includes texture blend", unitLabel: "areas", maxQuantity: 4 },
    { id: "drywall-texture-match", label: "Texture matching", sub: "Blend a patched area into the wall", bookCode: "09-01-10", unitLabel: "areas", maxQuantity: 6 },
  ],
  "painting-touch-ups": [
    { id: "paint-room-touch-up", label: "Touch-up painting, one room", sub: "Scuffs, patches, small areas", unitLabel: "rooms", maxQuantity: 6 },
    { id: "paint-accent-wall", label: "Paint a single wall", sub: "Accent wall or repaired wall", bookCode: "09-91-08", unitLabel: "walls", maxQuantity: 8 },
    { id: "paint-door-trim", label: "Paint a door or trim run", sub: "One door or one room of trim", unitLabel: "items", maxQuantity: 8 },
    { id: "paint-exterior-spot", label: "Exterior touch-up", sub: "Siding or trim spot repair", unitLabel: "areas", maxQuantity: 6 },
  ],
  "plumbing-repairs": [
    { id: "plumbing-faucet-swap", label: "Faucet replacement", sub: "Kitchen or bath, like for like", bookCode: "22-42-02", unitLabel: "faucets", maxQuantity: 6 },
    { id: "plumbing-toilet-repair", label: "Toilet repair", sub: "Fill valve, flapper, seal, handle", bookCode: "22-01-04", unitLabel: "toilets", maxQuantity: 6 },
    { id: "plumbing-toilet-replace", label: "Toilet replacement", sub: "Swap in a new unit", bookCode: "22-42-01", unitLabel: "toilets", maxQuantity: 4 },
    { id: "plumbing-disposal-swap", label: "Garbage disposal swap", sub: "Replace an existing unit", bookCode: "22-42-04", unitLabel: "units", maxQuantity: 3 },
    { id: "plumbing-drain-clear", label: "Slow drain clearing", sub: "Sink or tub, snake and clean", bookCode: "22-01-05", unitLabel: "drains", maxQuantity: 6 },
  ],
  "electrical-repairs": [
    { id: "electrical-outlet-switch", label: "Outlet or switch replacement", sub: "Like-for-like device swap", bookCode: "26-01-04", unitLabel: "devices", maxQuantity: 12 },
    { id: "electrical-light-fixture", label: "Light fixture replacement", sub: "Existing box and wiring", bookCode: "26-50-02", unitLabel: "fixtures", maxQuantity: 8 },
    { id: "electrical-ceiling-fan", label: "Ceiling fan install or swap", sub: "Fan-rated box in place", bookCode: "26-01-03", unitLabel: "fans", maxQuantity: 4 },
    { id: "electrical-smoke-detector", label: "Smoke detector replacement", sub: "Battery or existing wired base", bookCode: "28-01-02", unitLabel: "detectors", maxQuantity: 10 },
  ],
  "carpentry-trim-repair": [
    { id: "carpentry-door-adjust", label: "Door repair or adjustment", sub: "Sticking, sagging, hardware", bookCode: "08-01-05", unitLabel: "doors", maxQuantity: 8 },
    { id: "carpentry-trim-repair", label: "Baseboard or trim repair", sub: "One room or one damaged run", unitLabel: "rooms", maxQuantity: 6 },
    { id: "carpentry-cabinet-repair", label: "Cabinet door or hinge repair", sub: "Realign, rehang, replace hardware", bookCode: "12-01-06", unitLabel: "doors", maxQuantity: 10 },
    { id: "carpentry-window-repair", label: "Window hardware or screen repair", sub: "Latches, balances, screens", unitLabel: "windows", maxQuantity: 8 },
  ],
  "mounting-assembly": [
    { id: "mount-tv", label: "TV wall mount", sub: "Bracket supplied or picked up", bookCode: "27-01-02", unitLabel: "TVs", maxQuantity: 4 },
    { id: "mount-shelves", label: "Shelves or picture hanging", sub: "One wall or one set", unitLabel: "sets", maxQuantity: 8 },
    { id: "assemble-furniture", label: "Furniture assembly", sub: "Flat-pack, per item", bookCode: "12-01-03", unitLabel: "items", maxQuantity: 10 },
    { id: "mount-curtain-rods", label: "Curtain rods or blinds", sub: "Per window", bookCode: "12-01-02", unitLabel: "windows", maxQuantity: 10 },
  ],
  "fence-deck-gutter-repair": [
    { id: "fence-section-repair", label: "Fence picket or rail repair", sub: "Per damaged section", bookCode: "32-01-02", unitLabel: "sections", maxQuantity: 6 },
    { id: "fence-gate-repair", label: "Gate repair or realignment", sub: "Sagging or dragging gate", bookCode: "32-01-04", unitLabel: "gates", maxQuantity: 4 },
    { id: "deck-board-replace", label: "Deck board replacement", sub: "A handful of damaged boards", unitLabel: "areas", maxQuantity: 4 },
    { id: "gutter-clean", label: "Gutter cleaning", sub: "Single-story home", bookCode: "07-01-03", unitLabel: "homes", maxQuantity: 1 },
    { id: "gutter-reattach", label: "Gutter reattach or reseal", sub: "Sagging run or leaking seam", bookCode: "07-01-09", unitLabel: "runs", maxQuantity: 6 },
  ],
  "home-maintenance": [
    { id: "caulk-tub-shower", label: "Re-caulk tub or shower", sub: "Strip and recaulk one surround", bookCode: "22-01-07", unitLabel: "surrounds", maxQuantity: 4 },
    { id: "caulk-exterior", label: "Exterior caulking touch-up", sub: "Windows, doors, trim gaps", unitLabel: "areas", maxQuantity: 6 },
    { id: "weatherstrip-door", label: "Door weatherstripping", sub: "Seal a drafty exterior door", bookCode: "08-01-06", unitLabel: "doors", maxQuantity: 6 },
    { id: "grout-touch-up", label: "Tile grout touch-up", sub: "Small regrout or repair area", unitLabel: "areas", maxQuantity: 4 },
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

/**
 * Old calculator lines that do not match one cost-book unit. They stay
 * selectable and are omitted from the total. Do not invent a price for them.
 */
export const UNPRICED_CALCULATOR_ITEMS: { id: string; label: string; reason: string }[] = [
  { id: "drywall-large-patch", label: "Large hole or crack repair", reason: "The book splits this size: 09-01-08 is 1-2 SF and 09-01-06 is a per-SF large area. The old line covers 6 in to about 2 ft, so neither code is the line." },
  { id: "drywall-ceiling-patch", label: "Ceiling patch", reason: "No ceiling drywall patch line. 09-01-20 is a ceiling water stain and paint, not a patch." },
  { id: "paint-room-touch-up", label: "Touch-up painting, one room", reason: "No touch-up line. 09-91-07 paints a whole 12x12 room." },
  { id: "paint-door-trim", label: "Paint a door or trim run", reason: "A door (09-91-05) and trim (09-91-04, per LF) are different lines. The old card is either one." },
  { id: "paint-exterior-spot", label: "Exterior touch-up", reason: "Exterior paint is per SF (09-91-06). There is no spot-repair each." },
  { id: "carpentry-trim-repair", label: "Baseboard or trim repair", reason: "06-01-03 and 06-01-06 are per LF. The old card is one room or one run, with no length." },
  { id: "carpentry-window-repair", label: "Window hardware or screen repair", reason: "08-01-22 is the lock and 08-01-07 is the screen. The old card is either one." },
  { id: "mount-shelves", label: "Shelves or picture hanging", reason: "10-01-02 is a shelf and 10-01-01 is a picture. The old card is either one." },
  { id: "deck-board-replace", label: "Deck board replacement", reason: "06-01-04 is per SF. A handful of boards is not a book quantity. 06-01-05 is a different small deck repair." },
  { id: "caulk-exterior", label: "Exterior caulking touch-up", reason: "07-92-02 is one window or door. 07-92-01 is the whole house. The old card is a touch-up area." },
  { id: "grout-touch-up", label: "Tile grout touch-up", reason: "22-01-08 regrouts a shower per SF. There is no small-area each." },
  { id: "other-small", label: "Something else, small", reason: "No two-hour package. 01-01-02 is an hourly rate and the old card does not say one hour or two." },
];

/* ─────────────────────────────────────────────── "something else" sizing */

export type OtherJobSize = "small" | "medium" | "large";

export const OTHER_JOB_SIZE_VALUES = ["small", "medium", "large"] as const satisfies readonly OtherJobSize[];

/** Unlisted work. Medium and large match the book's half-day and full-day lines. Small does not. */
export const OTHER_JOB_SIZES: Record<OtherJobSize, { label: string; sub: string; bookCode?: string }> = {
  small: { label: "Small", sub: "An hour or two" },
  medium: { label: "Medium", sub: "Half a day", bookCode: "01-01-04" },
  large: { label: "Large", sub: "Most of a day", bookCode: "01-01-05" },
};

/* ───────────────────────────────────────────────── materials and urgency */

export type MaterialsPlan = "customer" | "we-pick-up";

export const MATERIALS_PLAN_VALUES = ["customer", "we-pick-up"] as const satisfies readonly MaterialsPlan[];

export const MATERIALS_PLANS: Record<MaterialsPlan, { label: string; sub: string }> = {
  customer: { label: "I will have materials ready", sub: "You buy the parts, we bring the tools" },
  "we-pick-up": { label: "Pick materials up for me", sub: "The estimator credits the trip charge when you move forward" },
};

/** Cost book trip line. The estimator shows it and credits it, so it does not change the customer total. */
export const SUPPLY_RUN_CODE = "01-01-08";

export type UrgencyLevel = "standard" | "priority" | "emergency";

export const URGENCY_LEVEL_VALUES = ["standard", "priority", "emergency"] as const satisfies readonly UrgencyLevel[];

/**
 * Priority uses cost book line 01-01-15 (rush, a percentage of cost).
 * Same-week emergency uses 01-01-09 (after-hours, a percentage of cost).
 * The rates are read from the book in HandymanPriceContext.
 */
export const URGENCY_LEVELS: Record<UrgencyLevel, { label: string; sub: string }> = {
  standard: { label: "Standard", sub: "Next available opening" },
  priority: { label: "Priority", sub: "Within 2 business days" },
  emergency: { label: "Same-week emergency", sub: "We shuffle the schedule" },
};

/** Highest quantity a picker may send. Not a price. */
export const MAX_TASK_QUANTITY = 20;

/* ─────────────────────────────────────────────────────────────── pricing */

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
  id: "labor" | "supply-run" | "urgency";
  label: string;
  amount: number;
}

export interface CustomerTaskLine {
  id: string;
  label: string;
  amount: number;
}

export interface UnpricedCalculatorLine {
  id: string;
  label: string;
}

export interface HandymanEstimate {
  /** Kept for older lead records. The cost book prices units, not hours. */
  laborHours: number;
  /** Kept for older lead records. The cost book prices units, not hours. */
  totalHours: number;
  urgency: UrgencyLevel;
  materials: MaterialsPlan;
  lines: HandymanLine[];
  customerLines: CustomerTaskLine[];
  /** Selected lines that have no cost-book price. They are not in the total. */
  unpriced: UnpricedCalculatorLine[];
  /** Customer contract price, before the quote-class range is widened. */
  total: number;
  /** Customer range, rounded outward to $10 by division the way the estimator does. */
  priceLow: number;
  priceHigh: number;
  /** Number of catalog tasks priced (a priced other-job counts as one). */
  taskCount: number;
  oversized: boolean;
}

/**
 * Factors and book amounts for one pricing pass. Built on the server by
 * shared/handymanCustomerPrice.ts from lib/p5/pricing.ts and the cost book.
 */
export type HandymanPriceContext = {
  overhead: number;
  profit: number;
  contingency: number;
  /** Quote-class width. This calculator has no address, so the jurisdiction risk is included. */
  rangeWidth: number;
  minimumCode: string;
  minimumDirect: number;
  rushCode: string;
  rushRate: number;
  emergencyCode: string;
  emergencyRate: number;
  /** Signature direct amount by cost book code. */
  direct: Readonly<Record<string, number>>;
  division: Readonly<Record<string, string>>;
};

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

function clampQuantity(quantity: number, task: TaskOption): number {
  const max = Math.min(task.maxQuantity ?? 1, MAX_TASK_QUANTITY);
  if (!Number.isFinite(quantity)) return 1;
  return Math.min(Math.max(Math.round(quantity), 1), max);
}

/** Customer unit price: the shared engine's direct cost x (1 + reserve) / (1 - overhead - profit), rounded to the cent. */
function sell(direct: number, context: HandymanPriceContext): number {
  return round2(priceFromRiskAdjustedCost(direct * (1 + context.contingency), context.overhead, context.profit));
}

type PricedPiece = { id: string; label: string; division: string; direct: number; amount: number };

/**
 * Customer price for one visit, using the estimator's handyman rules:
 * the minimum service charge balance, then a book percentage for priority
 * or same-week emergency, then the quote-class range rounded outward by division.
 *
 * A materials pickup does not change the total. The estimator shows the trip
 * charge and an equal credit, so the two net to zero.
 *
 * Returns null until at least one selected line has a book price.
 */
export function calculateHandymanEstimate(
  input: HandymanEstimateInput,
  context?: HandymanPriceContext,
): HandymanEstimate | null {
  if (!context) return null;
  const pieces: PricedPiece[] = [];
  const unpriced: UnpricedCalculatorLine[] = [];
  let taskCount = 0;

  const addUnit = (id: string, label: string, code: string | undefined, quantity: number) => {
    if (!code || context.direct[code] === undefined) {
      unpriced.push({ id, label });
      return;
    }
    const unitDirect = context.direct[code];
    const direct = round2(unitDirect * quantity);
    pieces.push({
      id,
      label,
      division: context.division[code] ?? code.slice(0, 2),
      direct,
      amount: round2(sell(unitDirect, context) * quantity),
    });
    taskCount += 1;
  };

  for (const selection of input.tasks) {
    const task = findTaskOption(selection.taskId);
    if (!task) continue;
    const qty = clampQuantity(selection.quantity, task);
    const label = qty > 1 ? `${task.label} x${qty}` : task.label;
    addUnit(task.id, label, task.bookCode, qty);
  }

  if (input.otherJob && input.otherJob.description.trim().length > 0) {
    const size = OTHER_JOB_SIZES[input.otherJob.size];
    const desc = input.otherJob.description.trim();
    addUnit("other-job", desc.length > 0 ? desc : size.label, size.bookCode, 1);
  }

  if (pieces.length === 0) return null;

  const taskDirect = round2(pieces.reduce((sum, piece) => sum + piece.direct, 0));
  if (taskDirect < context.minimumDirect) {
    const quantity = Math.ceil(((context.minimumDirect - taskDirect) / context.minimumDirect) * 100) / 100;
    const direct = round2(context.minimumDirect * quantity);
    pieces.push({
      id: "minimum",
      label: "Minimum service charge, balance",
      division: "01",
      direct,
      amount: round2(sell(context.minimumDirect, context) * quantity),
    });
  }

  if (input.urgency === "priority" || input.urgency === "emergency") {
    const rate = input.urgency === "priority" ? context.rushRate : context.emergencyRate;
    const directBase = round2(pieces.reduce((sum, piece) => sum + piece.direct, 0));
    const direct = round2(directBase * rate);
    pieces.push({
      id: "urgency",
      label: input.urgency === "priority" ? "Rush premium" : "Emergency, after hours",
      division: "01",
      direct,
      amount: sell(direct, context),
    });
  }

  const customerLines: CustomerTaskLine[] = pieces.map((piece) => ({ id: piece.id, label: piece.label, amount: piece.amount }));
  const total = round2(customerLines.reduce((sum, line) => sum + line.amount, 0));
  const byDivision = new Map<string, number>();
  for (const piece of pieces) byDivision.set(piece.division, round2((byDivision.get(piece.division) ?? 0) + piece.amount));
  let priceLow = 0;
  let priceHigh = 0;
  for (const amount of byDivision.values()) {
    priceLow += Math.max(0, Math.floor((amount * (1 - context.rangeWidth)) / 10) * 10);
    priceHigh += Math.ceil((amount * (1 + context.rangeWidth)) / 10) * 10;
  }

  const urgencyAmount = pieces.find((piece) => piece.id === "urgency")?.amount ?? 0;
  const lines: HandymanLine[] = [{ id: "labor", label: "Selected work", amount: round2(total - urgencyAmount) }];
  if (urgencyAmount > 0) lines.push({ id: "urgency", label: input.urgency === "priority" ? "Rush premium" : "Emergency, after hours", amount: urgencyAmount });

  return {
    laborHours: 0,
    totalHours: 0,
    urgency: input.urgency,
    materials: input.materials,
    lines,
    customerLines,
    unpriced,
    total,
    priceLow,
    priceHigh,
    taskCount,
    oversized: false,
  };
}

/* ─────────────────────────────────────────────────────────── formatting */

export {formatHandymanCurrency, formatHours, formatHandymanRange, HANDYMAN_RATE_DISCLAIMER, MATERIALS_COST_NOTE, OVERSIZED_JOB_NOTE} from "./handymanDisplay.ts";

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

// Display-only qualifications are re-exported above; client code imports their safe module directly.

/* ────────────────────────────────────────────── legacy construction engine */

/*
 * Everything below re-exports the retired Boise Construction Co engine so
 * modules owned by other packages (server/services, admin routes,
 * ConsultationForm, shared/costs) keep compiling. The handyman calculator
 * does not use any of it.
 */
export * from "./legacy/constructionEstimateEngine";
