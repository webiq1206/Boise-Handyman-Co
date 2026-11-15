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
 * Goldens re-recorded 2026-11-09 ON PURPOSE: the owner removed the $49 visit
 * fee (no trip fee in Ada and Canyon County), so every scenario dropped by
 * the fee, about $45 low / $60 high after the band and $5 rounding. Rates:
 * Re-recorded again 2026-11-09 ON PURPOSE: the owner raised the hourly rate
 * from $95 to $125, so every scenario rose by about 32%. Rates now:
 * $125/hr, 1 hr minimum, 0.75 hr supply run, +15%/+30% urgency, no visit fee.
 * Re-recorded again 2026-11-09 ON PURPOSE: the band's low end is now clamped
 * to the one-hour minimum charge at the scenario's urgency, rounded up to $5
 * (minimumVisitCharge). Only the two minimum-visit scenarios moved: one
 * outlet $115 -> $125 low, emergency smoke detector $145 -> $165 low.
 * Previously recorded 2026-08-13 with the $49 fee.
 * [NEEDS: real pricing confirmation] Re-record when real rates land.
 */
import {
  calculateHandymanEstimate,
  type HandymanEstimateInput,
} from "../shared/estimateEngine";
import { handymanPriceContext } from "../shared/handymanCustomerPrice";

const context = handymanPriceContext();

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
  golden: { total: number; low: number; high: number };
};

const SCENARIOS: Scenario[] = [
  {
    /* Quantity math: two small patches at the book each. */
    id: "drywall-two-small-patches-standard",
    input: {
      category: "drywall-repair",
      tasks: [{ taskId: "drywall-small-patch", quantity: 2 }],
      otherJob: null,
      materials: "customer",
      urgency: "standard",
    },
    golden: { total: 275, low: 250, high: 300 },
  },
  {
    /* Accent wall at Signature. Priority does not add a surcharge. */
    id: "painting-accent-wall-priority",
    input: {
      category: "painting-touch-ups",
      tasks: [{ taskId: "paint-accent-wall", quantity: 1 }],
      otherJob: null,
      materials: "customer",
      urgency: "priority",
    },
    golden: { total: 707.72, low: 660, high: 770 },
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
    golden: { total: 477.2, low: 440, high: 510 },
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
    golden: { total: 219.11, low: 200, high: 240 },
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
    golden: { total: 382.74, low: 350, high: 420 },
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
    golden: { total: 485.28, low: 450, high: 520 },
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
    golden: { total: 528.96, low: 490, high: 570 },
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
    golden: { total: 273.48, low: 250, high: 300 },
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
    golden: { total: 452.94, low: 420, high: 490 },
  },
  {
    /* The free-text path: a medium job is the book's half day. */
    id: "something-else-medium-standard",
    input: {
      category: "something-else",
      tasks: [],
      otherJob: { description: "Back door drags and the porch light hangs loose", size: "medium" },
      materials: "customer",
      urgency: "standard",
    },
    golden: { total: 307.35, low: 280, high: 330 },
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
    golden: { total: 1075.74, low: 1010, high: 1150 },
  },
];

if (record) {
  console.log("id | laborHours | low | high | total");
  for (const s of SCENARIOS) {
    const est = calculateHandymanEstimate(s.input, context);
    if (!est) {
      console.log(`${s.id} | DID NOT PRICE`);
      continue;
    }
    console.log(`${s.id} | ${est.total}`);
  }
  process.exit(0);
}

for (const s of SCENARIOS) {
  const est = calculateHandymanEstimate(s.input, context);
  checks++;
  if (!est) {
    failed++;
    console.error(`FAIL ${s.id}: did not price`);
    continue;
  }
  assertEqual(`${s.id}.total`, est.total, s.golden.total);
  assertEqual(`${s.id}.priceLow`, est.priceLow, s.golden.low);
  assertEqual(`${s.id}.priceHigh`, est.priceHigh, s.golden.high);
}

if (failed > 0) {
  console.error(`\nverify-golden-estimates: ${failed} of ${checks} checks FAILED`);
  process.exit(1);
}
console.log(`verify-golden-estimates: all ${checks} checks passed (${SCENARIOS.length} scenarios)`);
