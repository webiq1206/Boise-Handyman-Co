/**
 * Every handyman price this site publishes comes from the P5 instant
 * estimator (owner instruction, 20 November 2026): the same estimator the
 * "Get an instant estimate" button opens, so a page never shows a number the
 * estimator would not.
 *
 * This script runs that estimator for each task the site publishes a figure
 * for and writes shared/content/p5PublishedFigures.json. The site never
 * imports p5-home-co: the JSON is committed, and tests/p5-published-figures.test.ts
 * pins the copy to it.
 *
 * Run (from this repository, with p5-home-co checked out beside it):
 *
 *   node --experimental-strip-types scripts/pricing/p5-published-figures.mts
 *
 * P5_HOME_CO_DIR points at another checkout. Pass --check to compare the
 * estimator's answers with the committed JSON without writing it.
 *
 * Inputs, stated so anyone can re-run them:
 *   - brand "handyman", project "handyman" (the task list), tier "mid"
 *     (the handyman flow has no finish question, so the tier is fixed)
 *   - one task at a time, quantity 1, unless a list says otherwise
 *   - the seed cost book in p5-home-co (no database), labor billed at $120 an
 *     hour (owner, 20 November 2026: the live estimator's rate; the code
 *     default is $125), every other scope setting at its default
 *   - a Boise address and no property record (handyman pricing reads neither)
 *   - the customer range is customerEstimate().range, exactly what a visitor
 *     is shown on screen
 */

import { execSync } from "node:child_process";
import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const repo = path.resolve(here, "..", "..");
const p5Dir = path.resolve(process.env.P5_HOME_CO_DIR ?? path.join(repo, "..", "p5-home-co"));
const outFile = path.join(repo, "shared", "content", "p5PublishedFigures.json");

const LABOR_RATE = 120;
const NOW = new Date("2026-11-20T12:00:00Z");
const ADDRESS = "100 Example Ave, Boise, ID 83702";

const load = (rel: string) => import(pathToFileURL(path.join(p5Dir, rel)).href);
const price = await load("app/lib/estimator/price.ts");
const flows = await load("app/lib/estimator/flows.ts");
const scopeTypes = await load("app/lib/scopes/types.ts");

const settings = { ...scopeTypes.DEFAULT_SCOPE_SETTINGS, laborRate: LABOR_RATE };

const flow = flows.flowById("handyman");
const question = flow.questions[0];
const options: Array<{ id: string; label: string; hint?: string }> = question.options;

/** A stated list of tasks, priced together as one estimate. */
const LISTS: Array<{ id: string; label: string; tasks: Record<string, number> }> = [
  {
    id: "mixed-list",
    label: "A mixed list: replace a faucet, swap two light fixtures, replace three outlets or switches, two small drywall patches, adjust a sticking door",
    tasks: { faucet: 1, light: 2, outlet: 3, "patch-small": 2, "door-adjust": 1 },
  },
  {
    id: "outlets-2",
    label: "Replace two outlets or switches on one visit",
    tasks: { outlet: 2 },
  },
  {
    id: "doors-3",
    label: "Adjust three sticking doors on one visit",
    tasks: { "door-adjust": 3 },
  },
];

function run(tasks: Record<string, number>) {
  const estimate = price.priceEstimate(
    { brand: "handyman", project: "handyman", tier: "mid", answers: { tasks }, address: ADDRESS, property: null },
    { now: NOW, settings },
  );
  if (price.priceWithheld(estimate)) throw new Error(`The estimator withholds a price for ${JSON.stringify(tasks)}.`);
  const view = price.customerEstimate(estimate, { token: "t".repeat(40), address: null, createdAt: NOW, officialCopy: "after-review" });
  const low = view.range?.low;
  const high = view.range?.high;
  if (typeof low !== "number" || typeof high !== "number") throw new Error(`No customer range for ${JSON.stringify(tasks)}.`);
  return { low, high };
}

const tasks: Record<string, unknown> = {};
for (const o of options) {
  const inputs = { tasks: { [o.id]: 1 } };
  tasks[o.id] = { label: o.label, ...(o.hint ? { hint: o.hint } : {}), quantity: 1, inputs, ...run(inputs.tasks) };
}

const lists: Record<string, unknown> = {};
for (const l of LISTS) lists[l.id] = { label: l.label, inputs: { tasks: l.tasks }, ...run(l.tasks) };

const singles = Object.entries(tasks) as Array<[string, { low: number; high: number }]>;
const lowest = singles.reduce((a, b) => (b[1].low < a[1].low ? b : a));
const highest = singles.reduce((a, b) => (b[1].high > a[1].high ? b : a));

let p5Commit = "unknown";
try {
  p5Commit = execSync("git rev-parse --short HEAD", { cwd: p5Dir }).toString().trim();
} catch {}

const figures = {
  about:
    "Preliminary customer ranges from the P5 instant estimator (the tool behind \"Get an instant estimate\"), one estimate per entry. Written by scripts/pricing/p5-published-figures.mts; do not edit by hand.",
  asOf: "November 2026",
  generatedOn: NOW.toISOString().slice(0, 10),
  p5Commit,
  inputs: {
    brand: "handyman",
    project: "handyman",
    tier: "mid",
    laborRatePerHour: LABOR_RATE,
    handymanTripCharge: settings.handymanTripCharge,
    costBook: "p5-home-co seed cost book, no database overrides",
    address: ADDRESS,
    property: null,
  },
  tasks,
  lists,
  singleTaskSpan: { low: lowest[1].low, lowTask: lowest[0], high: highest[1].high, highTask: highest[0] },
};

const text = `${JSON.stringify(figures, null, 2)}\n`;
if (process.argv.includes("--check")) {
  const committed = JSON.parse(readFileSync(outFile, "utf8"));
  const strip = (f: Record<string, unknown>) => JSON.stringify({ ...f, p5Commit: undefined });
  if (strip(committed) !== strip(figures)) {
    console.error("The estimator's answers differ from shared/content/p5PublishedFigures.json. Re-run without --check and update the copy.");
    process.exit(1);
  }
  console.log("p5PublishedFigures.json matches the estimator.");
} else {
  writeFileSync(outFile, text);
  for (const [id, t] of singles) console.log(`${id}\t${t.low}\t${t.high}`);
  for (const [id, l] of Object.entries(lists) as Array<[string, { low: number; high: number }]>) console.log(`${id}\t${l.low}\t${l.high}`);
}
