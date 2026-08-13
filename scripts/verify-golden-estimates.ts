/**
 * Golden-scenario regression suite for the handyman pricing engine.
 *
 * verify-estimate-engine proves RELATIONSHIPS (minimums, monotonicity, band
 * arithmetic). Nothing there pins EXACT numbers, so a rate constant that
 * drifts would pass every invariant and silently change every quote. This
 * file closes that gap: known scenarios with known expected outputs, asserted
 * to the dollar, covering every job category, every urgency tier, quantity
 * math, the one-hour minimum, and the supply-run line.
 *
 * A failure here means pricing CHANGED, which is either a bug (fix it) or an
 * intentional repricing (rerun with GOLDEN_RECORD=1, eyeball the new table,
 * and commit the updated goldens in the same change that moved the rates).
 *
 *   npx tsx scripts/verify-golden-estimates.ts                  # verify
 *   GOLDEN_RECORD=1 npx tsx scripts/verify-golden-estimates.ts  # print table
 *
 * Goldens recorded 2026-08-13 against the placeholder rates ($49 trip fee,
 * $95/hr, 1 hr minimum, 0.75 hr supply run, +15%/+30% urgency).
 * [NEEDS: real pricing confirmation] Re-record when real rates land.
 */
import {
  calculateHandymanEstimate,
  type HandymanEstimateInput,
} from "../shared/estimateEngine";

let checks = 0;
let failed = 0;
const record = process.env.GOLDEN_RECORD === "1";

function assertEqual(name: string, got: number, want: number) {
  checks++;
  if (got !== want) {
    failed++;
    console.error(`FAIL ${name}: got ${got}, golden ${want}`);
  }
}

type Scenario = {
  id: string;
  input: HandymanEstimateInput;
  golden: { low: number; high: number; laborHours: number };
};

const SCENARIOS: Scenario[] = [
  {
    /* Quantity math: two patches at 1.5 hrs each. */
    id: "drywall-two-small-patches-standard",
    input: {
      category: "drywall-repair",
      tasks: [{ taskId: "drywall-small-patch", quantity: 2 }],
      otherJob: null,
      materials: "customer",
      urgency: "standard",
    },
    golden: { low: 300, high: 400, laborHours: 3 },
  },
  {
    /* Priority tier: +15% on labor. */
    id: "painting-room-touch-up-priority",
    input: {
      category: "painting-touch-ups",
      tasks: [{ taskId: "paint-room-touch-up", quantity: 1 }],
      otherJob: null,
      materials: "customer",
      urgency: "priority",
    },
    golden: { low: 290, high: 385, laborHours: 2.5 },
  },
  {
    /* Two different tasks plus the supply run. */
    id: "plumbing-faucet-and-toilet-with-pickup",
    input: {
      category: "plumbing-repairs",
      tasks: [
        { taskId: "plumbing-faucet-swap", quantity: 1 },
        { taskId: "plumbing-toilet-repair", quantity: 1 },
      ],
      otherJob: null,
      materials: "we-pick-up",
      urgency: "standard",
    },
    golden: { low: 320, high: 430, laborHours: 2.5 },
  },
  {
    /* One-hour minimum: a 0.75 hr task bills a full hour. */
    id: "electrical-single-outlet-minimum",
    input: {
      category: "electrical-repairs",
      tasks: [{ taskId: "electrical-outlet-switch", quantity: 1 }],
      otherJob: null,
      materials: "customer",
      urgency: "standard",
    },
    golden: { low: 130, high: 175, laborHours: 1 },
  },
  {
    /* Minimum AND emergency tier together. */
    id: "electrical-smoke-detector-emergency",
    input: {
      category: "electrical-repairs",
      tasks: [{ taskId: "electrical-smoke-detector", quantity: 1 }],
      otherJob: null,
      materials: "customer",
      urgency: "emergency",
    },
    golden: { low: 155, high: 205, laborHours: 1 },
  },
  {
    /* Quantity math on a 1.5 hr task. */
    id: "carpentry-three-doors-standard",
    input: {
      category: "carpentry-trim-repair",
      tasks: [{ taskId: "carpentry-door-adjust", quantity: 3 }],
      otherJob: null,
      materials: "customer",
      urgency: "standard",
    },
    golden: { low: 430, high: 570, laborHours: 4.5 },
  },
  {
    /* Mixed tasks within one category. */
    id: "mounting-tv-plus-two-assemblies",
    input: {
      category: "mounting-assembly",
      tasks: [
        { taskId: "mount-tv", quantity: 1 },
        { taskId: "assemble-furniture", quantity: 2 },
      ],
      otherJob: null,
      materials: "customer",
      urgency: "standard",
    },
    golden: { low: 430, high: 570, laborHours: 4.5 },
  },
  {
    /* Priority + supply run interacting (urgency applies to both). */
    id: "gutter-clean-priority-with-pickup",
    input: {
      category: "fence-deck-gutter-repair",
      tasks: [{ taskId: "gutter-clean", quantity: 1 }],
      otherJob: null,
      materials: "we-pick-up",
      urgency: "priority",
    },
    golden: { low: 315, high: 420, laborHours: 2 },
  },
  {
    /* Emergency tier on a maintenance task. */
    id: "caulk-tub-emergency",
    input: {
      category: "home-maintenance",
      tasks: [{ taskId: "caulk-tub-shower", quantity: 1 }],
      otherJob: null,
      materials: "customer",
      urgency: "emergency",
    },
    golden: { low: 210, high: 280, laborHours: 1.5 },
  },
  {
    /* The free-text path: a medium job is 4 assumed hours. */
    id: "something-else-medium-standard",
    input: {
      category: "something-else",
      tasks: [],
      otherJob: { description: "Back door drags and the porch light hangs loose", size: "medium" },
      materials: "customer",
      urgency: "standard",
    },
    golden: { low: 385, high: 515, laborHours: 4 },
  },
  {
    /* Everything at once: large other-job, pickup, emergency. */
    id: "something-else-large-pickup-emergency",
    input: {
      category: "something-else",
      tasks: [],
      otherJob: { description: "Full pre-listing punch list", size: "large" },
      materials: "we-pick-up",
      urgency: "emergency",
    },
    golden: { low: 1015, high: 1355, laborHours: 8 },
  },
];

if (record) {
  console.log("id | laborHours | low | high | total");
  for (const s of SCENARIOS) {
    const est = calculateHandymanEstimate(s.input);
    if (!est) {
      console.log(`${s.id} | DID NOT PRICE`);
      continue;
    }
    console.log(`${s.id} | ${est.laborHours} | ${est.priceLow} | ${est.priceHigh} | ${est.total}`);
  }
  process.exit(0);
}

for (const s of SCENARIOS) {
  const est = calculateHandymanEstimate(s.input);
  checks++;
  if (!est) {
    failed++;
    console.error(`FAIL ${s.id}: did not price`);
    continue;
  }
  assertEqual(`${s.id}.laborHours`, est.laborHours, s.golden.laborHours);
  assertEqual(`${s.id}.priceLow`, est.priceLow, s.golden.low);
  assertEqual(`${s.id}.priceHigh`, est.priceHigh, s.golden.high);
}

if (failed > 0) {
  console.error(`\nverify-golden-estimates: ${failed} of ${checks} checks FAILED`);
  process.exit(1);
}
console.log(`verify-golden-estimates: all ${checks} checks passed (${SCENARIOS.length} scenarios)`);
