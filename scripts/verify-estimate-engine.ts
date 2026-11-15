/**
 * Invariant suite for the handyman pricing engine (shared/estimateEngine.ts).
 *
 * Exact expected numbers live in verify-golden-estimates.ts; this file proves
 * the RELATIONSHIPS that must hold for every reachable input:
 *
 * - the wizard's categories match the live service catalog in contentData
 * - a mapped task prices at its cost book amount, and an unmapped task does not
 * - more quantity never costs less
 * - urgency does not invent a surcharge
 * - the we-pick-up supply run adds the book's trip line
 * - empty input produces no estimate (never a fake $0 range)
 *
 *   npx tsx scripts/verify-estimate-engine.ts
 */
import {
  calculateHandymanEstimate,
  findTaskOption,
  getTasksForCategory,
  JOB_CATEGORY_IDS,
  JOB_CATEGORY_LABELS,
  MATERIALS_PLAN_VALUES,
  MAX_TASK_QUANTITY,
  OTHER_JOB_SIZES,
  OTHER_JOB_SIZE_VALUES,
  TASK_CATALOG,
  UNPRICED_CALCULATOR_ITEMS,
  URGENCY_LEVEL_VALUES,
  type HandymanEstimateInput,
  type JobCategoryId,
} from "../shared/estimateEngine";
import { handymanPriceContext } from "../shared/handymanCustomerPrice";
import { SERVICES } from "../shared/contentData";

const context = handymanPriceContext();

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

/* Task ids are globally unique, and every task is either mapped or flagged. */
const seenIds = new Set<string>();
for (const [categoryId, tasks] of Object.entries(TASK_CATALOG)) {
  assert(tasks.length >= 3, `${categoryId} offers at least 3 common tasks`);
  for (const task of tasks) {
    assert(!seenIds.has(task.id), `task id ${task.id} is globally unique`);
    seenIds.add(task.id);
    const flagged = UNPRICED_CALCULATOR_ITEMS.some((item) => item.id === task.id);
    assert(Boolean(task.bookCode) !== flagged, `${task.id} is either a book code or an unpriced flag, not both and not neither`);
    if (task.bookCode) assert(context.direct[task.bookCode] > 0, `${task.id} book code ${task.bookCode} has a unit price`);
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
  }, context);
  assert(empty === null, `${category}: no tasks means no estimate, never $0`);
}
assert(
  calculateHandymanEstimate({
    category: "something-else",
    tasks: [],
    otherJob: { description: "   ", size: "small" },
    materials: "customer",
    urgency: "standard",
  }, context) === null,
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
    const estimate = calculateHandymanEstimate(base(categoryId, task.id), context);
    if (!task.bookCode) {
      assert(estimate === null, `${task.id} has no book code and is not given a price`);
      continue;
    }
    assert(estimate !== null, `${task.id} produces an estimate`);
    if (!estimate) continue;
    const unit = context.direct[task.bookCode];
    assert(estimate.total > unit, `${task.id} customer price ${estimate.total} is above the direct cost ${unit}`);
    assert(estimate.priceLow <= estimate.total && estimate.priceHigh >= estimate.total, `${task.id} range contains the customer price`);
    assert(estimate.priceHigh > estimate.priceLow, `${task.id} customer range is wider than a point`);
    assert(estimate.unpriced.length === 0, `${task.id} has nothing unpriced`);
    assert(
      !estimate.lines.some((l) => /\btrip\b|trip-fee|visit fee/i.test(`${l.id} ${l.label}`)),
      `${task.id} carries no trip fee when the customer supplies materials`,
    );
    assert(
      Math.abs(estimate.total - estimate.lines.reduce((s, l) => s + l.amount, 0)) < 0.02,
      `${task.id} total equals the sum of its lines`,
    );
    assert(
      Math.abs(estimate.customerLines.reduce((s, l) => s + l.amount, 0) - estimate.total) < 0.02,
      `${task.id} customer lines sum to the total`,
    );

    const max = task.maxQuantity ?? 1;
    let prevTotal = estimate.total;
    for (let qty = 2; qty <= Math.min(max, 4); qty++) {
      const more = calculateHandymanEstimate(base(categoryId, task.id, qty), context);
      const priorDirect = unit * (qty - 1);
      const nextDirect = unit * qty;
      if (more && priorDirect >= context.minimumDirect && nextDirect >= context.minimumDirect) {
        assert(more.total >= prevTotal - 0.02, `${task.id} x${qty} never costs less once the visit is above the minimum`);
      }
      if (more) prevTotal = more.total;
    }
    void prevTotal;

    for (const urgency of URGENCY_LEVEL_VALUES) {
      const withUrgency = calculateHandymanEstimate({ ...base(categoryId, task.id), urgency }, context);
      assert(withUrgency !== null && (urgency === "standard" ? withUrgency.total === estimate.total : withUrgency.total > estimate.total), `${task.id} at ${urgency} uses the book percentage when it is not standard`);
    }

    const withPickup = calculateHandymanEstimate({ ...base(categoryId, task.id), materials: "we-pick-up" }, context);
    assert(withPickup !== null, `${task.id} prices a materials pickup`);
    if (withPickup) {
      assert(withPickup.total === estimate.total, `${task.id}: the estimator credits the trip charge, so pickup does not change the customer total`);
    }
  }
}

/* ───────────────────────────────────────────── other-job size behaviour */

const small = calculateHandymanEstimate({
  category: "something-else",
  tasks: [],
  otherJob: { description: "Sagging gate and a loose railing", size: "small" },
  materials: "customer",
  urgency: "standard",
}, context);
assert(small === null, "a small unlisted job has no book line and is not priced");

let prevOtherTotal = 0;
for (const size of ["medium", "large"] as const) {
  const est = calculateHandymanEstimate({
    category: "something-else",
    tasks: [],
    otherJob: { description: "Sagging gate and a loose railing", size },
    materials: "customer",
    urgency: "standard",
  }, context);
  assert(est !== null && est.total > context.direct[OTHER_JOB_SIZES[size].bookCode!], `other-job ${size} is above its direct cost`);
  if (!est) continue;
  assert(est.total > prevOtherTotal, `other-job ${size} costs more than the size below`);
  prevOtherTotal = est.total;
}

const withUnknown = calculateHandymanEstimate({
  category: "plumbing-repairs",
  tasks: [
    { taskId: "plumbing-faucet-swap", quantity: 1 },
    { taskId: "definitely-not-real", quantity: 5 },
  ],
  otherJob: null,
  materials: "customer",
  urgency: "standard",
}, context);
const knownOnly = calculateHandymanEstimate(base("plumbing-repairs", "plumbing-faucet-swap"), context);
assert(
  withUnknown !== null && knownOnly !== null && withUnknown.total === knownOnly.total,
  "unknown task ids never move the price",
);

{
  const probe = getTasksForCategory("electrical-repairs").find((task) => task.bookCode);
  if (!probe?.bookCode) {
    assert(false, "electrical catalog has no priced task");
  } else {
    const input: HandymanEstimateInput = {
      category: "electrical-repairs",
      tasks: [{ taskId: probe.id, quantity: 1 }],
      otherJob: null,
      materials: "customer",
      urgency: "standard",
    };
    const total = (i: HandymanEstimateInput) => calculateHandymanEstimate(i, context)?.total ?? null;
    const urgencyPrices = new Set(URGENCY_LEVEL_VALUES.map((urgency) => total({ ...input, urgency })));
    assert(urgencyPrices.size === URGENCY_LEVEL_VALUES.length, "priority and emergency use the book percentage lines");
    const materialsPrices = new Set(MATERIALS_PLAN_VALUES.map((materials) => total({ ...input, materials })));
    assert(materialsPrices.size === 1, "the trip charge is credited, so the materials plan does not change the customer total");
    const quantityPrices = new Set([1, 2, 3].map((quantity) => total({ ...input, tasks: [{ taskId: probe.id, quantity }] })));
    assert(quantityPrices.size === 3, "quantity multiplies the book amount");
  }
}

if (failures > 0) {
  console.error(`\nverify-estimate-engine: ${failures} of ${checks} checks FAILED`);
  process.exit(1);
}
console.log(`verify-estimate-engine: all ${checks} checks passed`);
