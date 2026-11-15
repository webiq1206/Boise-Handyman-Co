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
  SUPPLY_RUN_CODE,
  TASK_CATALOG,
  UNPRICED_CALCULATOR_ITEMS,
  URGENCY_LEVEL_VALUES,
  type HandymanEstimateInput,
  type JobCategoryId,
} from "../shared/estimateEngine";
import { handymanBookRates } from "../shared/handymanBookRates";
import { SERVICES } from "../shared/contentData";

const rates = handymanBookRates();

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
    if (task.bookCode) assert(rates[task.bookCode] > 0, `${task.id} book code ${task.bookCode} has a unit price`);
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
  }, rates);
  assert(empty === null, `${category}: no tasks means no estimate, never $0`);
}
assert(
  calculateHandymanEstimate({
    category: "something-else",
    tasks: [],
    otherJob: { description: "   ", size: "small" },
    materials: "customer",
    urgency: "standard",
  }, rates) === null,
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
    const estimate = calculateHandymanEstimate(base(categoryId, task.id), rates);
    if (!task.bookCode) {
      assert(estimate === null, `${task.id} has no book code and is not given a price`);
      continue;
    }
    assert(estimate !== null, `${task.id} produces an estimate`);
    if (!estimate) continue;
    const unit = rates[task.bookCode];
    assert(estimate.total === unit, `${task.id} total is the book amount ${unit}`);
    assert(estimate.priceLow === estimate.total && estimate.priceHigh === estimate.total, `${task.id} shows the book amount, not a made-up band`);
    assert(estimate.unpriced.length === 0, `${task.id} has nothing unpriced`);
    assert(
      !estimate.lines.some((l) => /\btrip\b|trip-fee|visit fee/i.test(`${l.id} ${l.label}`)),
      `${task.id} carries no trip fee when the customer supplies materials`,
    );
    assert(
      estimate.total === estimate.lines.reduce((s, l) => s + l.amount, 0),
      `${task.id} total equals the sum of its lines`,
    );
    assert(
      estimate.customerLines.reduce((s, l) => s + l.amount, 0) === estimate.total,
      `${task.id} customer lines sum to the total`,
    );

    const max = task.maxQuantity ?? 1;
    let prevTotal = estimate.total;
    for (let qty = 2; qty <= Math.min(max, 4); qty++) {
      const more = calculateHandymanEstimate(base(categoryId, task.id, qty), rates);
      assert(more !== null && more.total === unit * qty, `${task.id} x${qty} is the book amount times quantity`);
      if (more) prevTotal = more.total;
    }
    void prevTotal;

    for (const urgency of URGENCY_LEVEL_VALUES) {
      const withUrgency = calculateHandymanEstimate({ ...base(categoryId, task.id), urgency }, rates);
      assert(withUrgency !== null && withUrgency.total === estimate.total, `${task.id} at ${urgency} keeps the book amount`);
    }

    const withPickup = calculateHandymanEstimate({ ...base(categoryId, task.id), materials: "we-pick-up" }, rates);
    assert(withPickup !== null, `${task.id} prices a materials pickup`);
    if (withPickup) {
      assert(Math.abs(withPickup.total - (estimate.total + rates[SUPPLY_RUN_CODE])) < 0.01, `${task.id}: pickup adds the book trip line`);
      assert(withPickup.lines.some((l) => l.id === "supply-run"), `${task.id}: pickup shows a supply-run line`);
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
}, rates);
assert(small === null, "a small unlisted job has no book line and is not priced");

let prevOtherTotal = 0;
for (const size of ["medium", "large"] as const) {
  const est = calculateHandymanEstimate({
    category: "something-else",
    tasks: [],
    otherJob: { description: "Sagging gate and a loose railing", size },
    materials: "customer",
    urgency: "standard",
  }, rates);
  assert(est !== null && est.total === rates[OTHER_JOB_SIZES[size].bookCode!], `other-job ${size} uses its book line`);
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
}, rates);
const knownOnly = calculateHandymanEstimate(base("plumbing-repairs", "plumbing-faucet-swap"), rates);
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
    const total = (i: HandymanEstimateInput) => calculateHandymanEstimate(i, rates)?.total ?? null;
    const urgencyPrices = new Set(URGENCY_LEVEL_VALUES.map((urgency) => total({ ...input, urgency })));
    assert(urgencyPrices.size === 1, "urgency is recorded and does not invent a second price");
    const materialsPrices = new Set(MATERIALS_PLAN_VALUES.map((materials) => total({ ...input, materials })));
    assert(materialsPrices.size === MATERIALS_PLAN_VALUES.length, "the materials plan changes the total by the book trip line");
    const quantityPrices = new Set([1, 2, 3].map((quantity) => total({ ...input, tasks: [{ taskId: probe.id, quantity }] })));
    assert(quantityPrices.size === 3, "quantity multiplies the book amount");
  }
}

if (failures > 0) {
  console.error(`\nverify-estimate-engine: ${failures} of ${checks} checks FAILED`);
  process.exit(1);
}
console.log(`verify-estimate-engine: all ${checks} checks passed`);
