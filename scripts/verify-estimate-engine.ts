/**
 * Invariant suite for the handyman pricing engine (shared/estimateEngine.ts).
 *
 * Exact expected numbers live in verify-golden-estimates.ts; this file proves
 * the RELATIONSHIPS that must hold for every reachable input:
 *
 * - the wizard's categories match the live service catalog in contentData
 * - every task prices to a finite, positive, correctly ordered range
 * - the one-hour minimum and the trip fee always apply, the trip fee once
 * - more quantity never costs less; higher urgency never costs less
 * - the we-pick-up supply run always costs more than customer materials
 * - the range brackets the computed total at -10% / +20%, rounded to $5
 * - empty input produces no estimate (never a fake $0 range)
 *
 *   npx tsx scripts/verify-estimate-engine.ts
 */
import {
  calculateHandymanEstimate,
  findTaskOption,
  getTasksForCategory,
  HOURLY_RATE_USD,
  JOB_CATEGORY_IDS,
  JOB_CATEGORY_LABELS,
  MATERIALS_PLAN_VALUES,
  MAX_TASK_QUANTITY,
  MINIMUM_LABOR_HOURS,
  OTHER_JOB_SIZES,
  OTHER_JOB_SIZE_VALUES,
  RANGE_HIGH_FACTOR,
  RANGE_LOW_FACTOR,
  RANGE_ROUNDING_USD,
  SUPPLY_RUN_HOURS,
  TASK_CATALOG,
  TRIP_FEE_USD,
  URGENCY_LEVELS,
  URGENCY_LEVEL_VALUES,
  type HandymanEstimateInput,
  type JobCategoryId,
} from "../shared/estimateEngine";
import { SERVICES } from "../shared/contentData";

let checks = 0;
let failures = 0;

function assert(condition: boolean, message: string) {
  checks++;
  if (!condition) {
    failures++;
    console.error(`FAIL: ${message}`);
  }
}

/* ─────────────────────────────── catalog stays in sync with the services */

const serviceSlugs = SERVICES.map((s) => s.slug);
for (const slug of serviceSlugs) {
  assert(
    (JOB_CATEGORY_IDS as readonly string[]).includes(slug),
    `service ${slug} from contentData is offered as a wizard category`,
  );
}
assert(
  JOB_CATEGORY_IDS.length === serviceSlugs.length + 1,
  "wizard offers exactly the live services plus the something-else catch-all",
);
assert(
  (JOB_CATEGORY_IDS as readonly string[]).includes("something-else"),
  "the something-else catch-all exists",
);

for (const id of JOB_CATEGORY_IDS) {
  assert(Boolean(JOB_CATEGORY_LABELS[id]?.label), `category ${id} has a label`);
  const service = SERVICES.find((s) => s.slug === id);
  if (service) {
    assert(
      JOB_CATEGORY_LABELS[id].label === service.name ||
        id === "mounting-assembly" /* short label allowed, name matches */,
      `category label for ${id} matches the service name (${service.name})`,
    );
  }
}

/* Task ids are globally unique, hours sane, quantities bounded. */
const seenIds = new Set<string>();
for (const [categoryId, tasks] of Object.entries(TASK_CATALOG)) {
  assert(tasks.length >= 3, `${categoryId} offers at least 3 common tasks`);
  for (const task of tasks) {
    assert(!seenIds.has(task.id), `task id ${task.id} is globally unique`);
    seenIds.add(task.id);
    assert(task.hours > 0 && task.hours <= 8, `${task.id} hours are in (0, 8]`);
    assert(
      (task.maxQuantity ?? 1) >= 1 && (task.maxQuantity ?? 1) <= MAX_TASK_QUANTITY,
      `${task.id} maxQuantity within bounds`,
    );
    assert(findTaskOption(task.id) === task, `${task.id} resolves via findTaskOption`);
  }
}
assert(findTaskOption("not-a-real-task") === null, "unknown task ids resolve to null");
assert(getTasksForCategory("something-else").length === 0, "something-else has no fixed tasks");

/* ────────────────────────────────────────────── empty input never prices */

for (const category of JOB_CATEGORY_IDS) {
  const empty = calculateHandymanEstimate({
    category,
    tasks: [],
    otherJob: null,
    materials: "customer",
    urgency: "standard",
  });
  assert(empty === null, `${category}: no tasks means no estimate, never $0`);
}
assert(
  calculateHandymanEstimate({
    category: "something-else",
    tasks: [],
    otherJob: { description: "   ", size: "small" },
    materials: "customer",
    urgency: "standard",
  }) === null,
  "whitespace-only other-job description does not price",
);

/* ──────────────────────────────── every task, every urgency, every plan */

function base(category: JobCategoryId, taskId: string, quantity = 1): HandymanEstimateInput {
  return {
    category,
    tasks: [{ taskId, quantity }],
    otherJob: null,
    materials: "customer",
    urgency: "standard",
  };
}

for (const [categoryId, tasks] of Object.entries(TASK_CATALOG) as [
  Exclude<JobCategoryId, "something-else">,
  (typeof TASK_CATALOG)[keyof typeof TASK_CATALOG],
][]) {
  for (const task of tasks) {
    const estimate = calculateHandymanEstimate(base(categoryId, task.id));
    assert(estimate !== null, `${task.id} produces an estimate`);
    if (!estimate) continue;

    assert(Number.isFinite(estimate.priceLow) && Number.isFinite(estimate.priceHigh), `${task.id} range is finite`);
    assert(estimate.priceLow > 0, `${task.id} low bound is positive`);
    assert(estimate.priceLow < estimate.priceHigh, `${task.id} range is ordered and never collapses`);
    assert(
      estimate.laborHours >= MINIMUM_LABOR_HOURS,
      `${task.id} bills at least the ${MINIMUM_LABOR_HOURS}-hour minimum`,
    );
    assert(
      estimate.lines.filter((l) => l.id === "trip-fee").length === 1 &&
        estimate.lines[0].amount === TRIP_FEE_USD,
      `${task.id} carries exactly one trip fee of $${TRIP_FEE_USD}`,
    );
    assert(
      estimate.total === estimate.lines.reduce((s, l) => s + l.amount, 0),
      `${task.id} total equals the sum of its lines`,
    );
    assert(
      estimate.priceLow === Math.round((estimate.total * RANGE_LOW_FACTOR) / RANGE_ROUNDING_USD) * RANGE_ROUNDING_USD,
      `${task.id} low bound is total * ${RANGE_LOW_FACTOR} rounded to $${RANGE_ROUNDING_USD}`,
    );
    assert(
      estimate.priceHigh === Math.round((estimate.total * RANGE_HIGH_FACTOR) / RANGE_ROUNDING_USD) * RANGE_ROUNDING_USD,
      `${task.id} high bound is total * ${RANGE_HIGH_FACTOR} rounded to $${RANGE_ROUNDING_USD}`,
    );

    /* Monotonic in quantity. */
    const max = task.maxQuantity ?? 1;
    let prevTotal = estimate.total;
    for (let qty = 2; qty <= Math.min(max, 4); qty++) {
      const more = calculateHandymanEstimate(base(categoryId, task.id, qty));
      assert(more !== null && more.total >= prevTotal, `${task.id} x${qty} never costs less than x${qty - 1}`);
      if (more) prevTotal = more.total;
    }

    /* Monotonic in urgency, and exact multiplier arithmetic. */
    let prevUrgencyTotal = 0;
    for (const urgency of URGENCY_LEVEL_VALUES) {
      const withUrgency = calculateHandymanEstimate({ ...base(categoryId, task.id), urgency });
      assert(withUrgency !== null, `${task.id} prices at ${urgency}`);
      if (!withUrgency) continue;
      assert(
        withUrgency.total >= prevUrgencyTotal,
        `${task.id}: ${urgency} never costs less than the tier below`,
      );
      prevUrgencyTotal = withUrgency.total;
      const expected =
        TRIP_FEE_USD +
        withUrgency.laborHours * HOURLY_RATE_USD * URGENCY_LEVELS[urgency].multiplier;
      assert(
        Math.abs(withUrgency.total - expected) < 0.01,
        `${task.id} at ${urgency}: total = tripFee + hours * rate * multiplier`,
      );
    }

    /* Supply run costs exactly SUPPLY_RUN_HOURS of labor more (standard urgency). */
    for (const materials of MATERIALS_PLAN_VALUES) {
      const withMaterials = calculateHandymanEstimate({ ...base(categoryId, task.id), materials });
      assert(withMaterials !== null, `${task.id} prices with materials=${materials}`);
      if (materials === "we-pick-up" && withMaterials) {
        assert(
          Math.abs(withMaterials.total - (estimate.total + SUPPLY_RUN_HOURS * HOURLY_RATE_USD)) < 0.01,
          `${task.id}: pick-up adds exactly the supply run`,
        );
        assert(
          withMaterials.lines.some((l) => l.id === "supply-run"),
          `${task.id}: pick-up shows a supply-run line`,
        );
      }
    }
  }
}

/* ───────────────────────────────────────────── other-job size behaviour */

let prevOtherTotal = 0;
for (const size of OTHER_JOB_SIZE_VALUES) {
  const est = calculateHandymanEstimate({
    category: "something-else",
    tasks: [],
    otherJob: { description: "Sagging gate and a loose railing", size },
    materials: "customer",
    urgency: "standard",
  });
  assert(est !== null, `other-job ${size} prices`);
  if (!est) continue;
  assert(est.total > prevOtherTotal, `other-job ${size} costs more than the size below`);
  prevOtherTotal = est.total;
  assert(
    est.laborHours === Math.max(OTHER_JOB_SIZES[size].hours, MINIMUM_LABOR_HOURS),
    `other-job ${size} bills its bucket hours`,
  );
}

/* Unknown task ids are ignored, not priced and not fatal. */
const withUnknown = calculateHandymanEstimate({
  category: "plumbing-repairs",
  tasks: [
    { taskId: "plumbing-faucet-swap", quantity: 1 },
    { taskId: "definitely-not-real", quantity: 5 },
  ],
  otherJob: null,
  materials: "customer",
  urgency: "standard",
});
const knownOnly = calculateHandymanEstimate(base("plumbing-repairs", "plumbing-faucet-swap"));
assert(
  withUnknown !== null && knownOnly !== null && withUnknown.total === knownOnly.total,
  "unknown task ids never move the price",
);

/* Range factors themselves stay sane. */
assert(RANGE_LOW_FACTOR < 1 && RANGE_HIGH_FACTOR > 1, "range brackets the total");
assert(TRIP_FEE_USD > 0 && HOURLY_RATE_USD > 0, "rates are positive");

if (failures > 0) {
  console.error(`\nverify-estimate-engine: ${failures} of ${checks} checks FAILED`);
  process.exit(1);
}
console.log(`verify-estimate-engine: all ${checks} checks passed`);
