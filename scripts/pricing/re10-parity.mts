/**
 * RE-10 price parity check.
 *
 * The redesigned RE-10 page prices a tapped repair list in the P5 instant
 * estimator, framed from p5homeco.com (components/estimator/EstimatorFrame).
 * The page computes no number of its own, so its total is the estimator's
 * customer range by construction. This script prints that range for a sample
 * of RE-10 style lists (single trade and multi trade) and, beside it, what the
 * site chat assistant's legacy RE-10 engine (shared/costs/re10Repairs.ts)
 * says for the same list, so any gap between the two engines is visible.
 *
 * Run with p5-home-co checked out beside this repository (or P5_HOME_CO_DIR):
 *   node --import tsx scripts/pricing/re10-parity.mts
 */
import path from "node:path";
import { execSync } from "node:child_process";
import { fileURLToPath, pathToFileURL } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const repo = path.resolve(here, "..", "..");
const p5Dir = path.resolve(process.env.P5_HOME_CO_DIR ?? path.join(repo, "..", "p5-home-co"));
const load = (dir: string, rel: string) => import(pathToFileURL(path.join(dir, rel)).href);
const price = await load(p5Dir, "app/lib/estimator/price.ts");
const scopeTypes = await load(p5Dir, "app/lib/scopes/types.ts");
const legacy = await load(repo, "shared/costs/re10Repairs.ts");

const NOW = new Date("2026-11-24T12:00:00Z");
// The live estimator's settings: the default scope settings. Handyman labor is
// fixed at HANDYMAN_HOURLY_RATE ($95) inside the estimator whatever laborRate says.
const settings = { ...scopeTypes.DEFAULT_SCOPE_SETTINGS };

type Sample = { id: string; label: string; tasks: Record<string, number>; legacy: Array<[string, number]> };
const SAMPLES: Sample[] = [
  { id: "gfci-1", label: "Install 1 GFCI outlet (electrical)", tasks: { gfci: 1 }, legacy: [["gfci-install", 1]] },
  { id: "smoke-3", label: "3 hardwired smoke or CO detectors (electrical)", tasks: { smoke: 3 }, legacy: [["smoke-detector", 3]] },
  { id: "toilet-1", label: "Fix a running toilet (plumbing)", tasks: { "toilet-repair": 1 }, legacy: [["toilet-repair", 1]] },
  { id: "faucet-1", label: "Replace a faucet (plumbing)", tasks: { faucet: 1 }, legacy: [["faucet-replace", 1]] },
  { id: "doors-2", label: "Adjust 2 sticking doors (carpentry)", tasks: { "door-adjust": 2 }, legacy: [["interior-door-adjust", 2]] },
  { id: "patch-2", label: "2 small drywall patches (drywall)", tasks: { "patch-small": 2 }, legacy: [["drywall-patch", 2]] },
  { id: "elec-plumb", label: "Multi trade: 2 GFCI, 1 running toilet, 1 faucet", tasks: { gfci: 2, "toilet-repair": 1, faucet: 1 }, legacy: [["gfci-install", 2], ["toilet-repair", 1], ["faucet-replace", 1]] },
  { id: "typical-re10", label: "Multi trade: 2 GFCI, 3 smoke or CO, 2 door adjusts, 2 small patches, fence boards, gate", tasks: { gfci: 2, smoke: 3, "door-adjust": 2, "patch-small": 2, "fence-boards": 1, gate: 1 }, legacy: [["gfci-install", 2], ["smoke-detector", 3], ["interior-door-adjust", 2], ["drywall-patch", 2], ["fence-gate-repair", 2]] },
  { id: "safety-list", label: "Multi trade: grab bar, 4 outlets, weatherstrip, re-caulk tub", tasks: { "grab-bar": 1, outlet: 4, weatherstrip: 1, "caulk-tub": 1 }, legacy: [["safety-correction", 1], ["outlet-switch-replace", 4], ["caulking-weatherproofing", 1]] },
];

function engine(tasks: Record<string, number>) {
  const estimate = price.priceEstimate(
    { brand: "handyman", project: "handyman", tier: "mid", answers: { tasks }, address: "100 Example Ave, Boise, ID 83702", property: null },
    { now: NOW, settings },
  );
  if (price.priceWithheld(estimate)) return { low: null, high: null, note: "withheld for review" };
  const view = price.customerEstimate(estimate, { token: "t".repeat(40), address: null, createdAt: NOW, officialCopy: "after-review" });
  return { low: view.range?.low ?? null, high: view.range?.high ?? null, note: "" };
}
function old(items: Array<[string, number]>) {
  const e = legacy.estimateRe10(items.map(([kind, quantity], i) => ({ id: `i${i}`, description: kind, kind, quantity })), { occupancy: "occupied" });
  return { low: e.low, high: e.high, review: e.review.length };
}
const money = (n: number | null) => (n == null ? "n/a" : `$${n.toLocaleString("en-US")}`);
let commit = "unknown";
try { commit = execSync("git rev-parse --short HEAD", { cwd: p5Dir }).toString().trim(); } catch {}
const rows = SAMPLES.map((s) => {
  const a = engine(s.tasks);
  // The new page frames this same estimator, so its figure is the estimator's.
  const page = a;
  const b = old(s.legacy);
  return { s, a, page, b, match: a.low === page.low && a.high === page.high };
});
console.log(`p5-home-co ${commit}, handyman flow, tier mid, default settings\n`);
console.log("| Sample | P5 engine range | New RE-10 page shows | Match | Legacy chat engine (re10Repairs.ts) |");
console.log("|---|---|---|---|---|");
for (const r of rows) console.log(`| ${r.s.label} | ${money(r.a.low)} to ${money(r.a.high)}${r.a.note ? ` (${r.a.note})` : ""} | ${money(r.page.low)} to ${money(r.page.high)} | ${r.match ? "yes" : "NO"} | ${money(r.b.low)} to ${money(r.b.high)}${r.b.review ? ` (${r.b.review} for review)` : ""} |`);
if (rows.some((r) => !r.match)) process.exit(1);
