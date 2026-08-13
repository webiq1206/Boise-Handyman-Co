/**
 * Wire-schema suite for the handyman estimate payload
 * (shared/estimatePayload.ts, consumed by /api/estimate-lead).
 *
 * Proves that:
 * - every category, size, materials plan and urgency the engine defines is
 *   accepted over the wire (the compile-time checks in estimatePayload.ts
 *   guard the type level; this guards the runtime zod enums)
 * - a payload built from real engine output round-trips the schema
 * - malformed payloads (bad enums, zero/negative quantities, oversized
 *   arrays and strings) are rejected instead of silently accepted
 * - the server-side recompute agrees with the submitted numbers for an
 *   honestly built payload, so verifyEstimate never logs false mismatches
 *
 *   npx tsx scripts/verify-lead-payload.ts
 */
import {
  handymanEstimateSchema,
  jobCategorySchema,
  materialsPlanSchema,
  otherJobSizeSchema,
  urgencyLevelSchema,
} from "../shared/estimatePayload";
import {
  calculateHandymanEstimate,
  JOB_CATEGORY_IDS,
  MATERIALS_PLAN_VALUES,
  MAX_TASK_QUANTITY,
  OTHER_JOB_SIZE_VALUES,
  TASK_CATALOG,
  URGENCY_LEVEL_VALUES,
  type HandymanEstimateInput,
} from "../shared/estimateEngine";

let checks = 0;
let failures = 0;

function assert(condition: boolean, message: string) {
  checks++;
  if (!condition) {
    failures++;
    console.error(`FAIL: ${message}`);
  }
}

/* ─────────────────────────── every engine value is accepted on the wire */

for (const v of JOB_CATEGORY_IDS) {
  assert(jobCategorySchema.safeParse(v).success, `category ${v} accepted`);
}
for (const v of OTHER_JOB_SIZE_VALUES) {
  assert(otherJobSizeSchema.safeParse(v).success, `size ${v} accepted`);
}
for (const v of MATERIALS_PLAN_VALUES) {
  assert(materialsPlanSchema.safeParse(v).success, `materials ${v} accepted`);
}
for (const v of URGENCY_LEVEL_VALUES) {
  assert(urgencyLevelSchema.safeParse(v).success, `urgency ${v} accepted`);
}

/* ─────────────────────── an honest payload round-trips and re-verifies */

function buildPayload(input: HandymanEstimateInput) {
  const estimate = calculateHandymanEstimate(input);
  if (!estimate) throw new Error("scenario did not price");
  return {
    category: input.category,
    tasks: input.tasks,
    otherJob: input.otherJob ?? null,
    materials: input.materials,
    urgency: input.urgency,
    priceLow: estimate.priceLow,
    priceHigh: estimate.priceHigh,
    laborHours: estimate.laborHours,
  };
}

/* One representative task per category, plus the free-text path. */
for (const [category, tasks] of Object.entries(TASK_CATALOG)) {
  const input: HandymanEstimateInput = {
    category: category as HandymanEstimateInput["category"],
    tasks: [{ taskId: tasks[0].id, quantity: 2 }],
    otherJob: null,
    materials: "we-pick-up",
    urgency: "priority",
  };
  const payload = buildPayload(input);
  const parsed = handymanEstimateSchema.safeParse(payload);
  assert(parsed.success, `${category}: engine-built payload parses`);
  if (!parsed.success) continue;

  /* The recompute the route performs must agree with the submitted numbers. */
  const recomputed = calculateHandymanEstimate({
    category: parsed.data.category,
    tasks: parsed.data.tasks,
    otherJob: parsed.data.otherJob ?? null,
    materials: parsed.data.materials,
    urgency: parsed.data.urgency,
  });
  assert(
    recomputed !== null &&
      recomputed.priceLow === payload.priceLow &&
      recomputed.priceHigh === payload.priceHigh,
    `${category}: server recompute matches the submitted range`,
  );
}

const otherPayload = buildPayload({
  category: "something-else",
  tasks: [],
  otherJob: { description: "Handful of small fixes around the house", size: "small" },
  materials: "customer",
  urgency: "standard",
});
assert(
  handymanEstimateSchema.safeParse(otherPayload).success,
  "free-text other-job payload parses",
);

/* ───────────────────────────────────────────── malformed payloads fail */

const valid = buildPayload({
  category: "plumbing-repairs",
  tasks: [{ taskId: "plumbing-faucet-swap", quantity: 1 }],
  otherJob: null,
  materials: "customer",
  urgency: "standard",
});

function rejects(name: string, mutate: (p: Record<string, unknown>) => void) {
  const copy: Record<string, unknown> = JSON.parse(JSON.stringify(valid));
  mutate(copy);
  assert(!handymanEstimateSchema.safeParse(copy).success, `rejects ${name}`);
}

rejects("an unknown category", (p) => {
  p.category = "kitchen-remodel";
});
rejects("a construction-era project type", (p) => {
  p.category = "custom-home";
});
rejects("an unknown urgency", (p) => {
  p.urgency = "yesterday";
});
rejects("an unknown materials plan", (p) => {
  p.materials = "contractor-account";
});
rejects("a zero quantity", (p) => {
  (p.tasks as { quantity: number }[])[0].quantity = 0;
});
rejects("a negative quantity", (p) => {
  (p.tasks as { quantity: number }[])[0].quantity = -2;
});
rejects(`a quantity above ${MAX_TASK_QUANTITY}`, (p) => {
  (p.tasks as { quantity: number }[])[0].quantity = MAX_TASK_QUANTITY + 1;
});
rejects("a fractional quantity", (p) => {
  (p.tasks as { quantity: number }[])[0].quantity = 1.5;
});
rejects("more than 30 task rows", (p) => {
  p.tasks = Array.from({ length: 31 }, () => ({
    taskId: "plumbing-faucet-swap",
    quantity: 1,
  }));
});
rejects("an oversized other-job description", (p) => {
  p.otherJob = { description: "x".repeat(601), size: "small" };
});
rejects("a negative price", (p) => {
  p.priceLow = -10;
});
rejects("an absurd price", (p) => {
  p.priceHigh = 2_000_000;
});
rejects("missing tasks entirely", (p) => {
  delete p.tasks;
});

/* Unknown task ids parse (stale clients must not 400) but never price. */
const staleClient = {
  ...valid,
  tasks: [{ taskId: "task-renamed-since-this-client-cached", quantity: 1 }],
};
const staleParsed = handymanEstimateSchema.safeParse(staleClient);
assert(staleParsed.success, "unknown task ids still parse (stale client)");
if (staleParsed.success) {
  const recomputed = calculateHandymanEstimate({
    category: staleParsed.data.category,
    tasks: staleParsed.data.tasks,
    otherJob: null,
    materials: staleParsed.data.materials,
    urgency: staleParsed.data.urgency,
  });
  assert(
    recomputed === null,
    "a payload with only unknown tasks re-verifies to null (route 400s it)",
  );
}

if (failures > 0) {
  console.error(`\nverify-lead-payload: ${failures} of ${checks} checks FAILED`);
  process.exit(1);
}
console.log(`verify-lead-payload: all ${checks} checks passed`);
