/**
 * One team email per request (owner decision, 17 November 2026).
 *
 * p5homeco.com sends the team's "New lead" and "Details added" emails. This
 * site's own team email is the fallback: the shared family inbox gets it only
 * when p5 did not confirm that its email went. A lead must never end with no
 * team email, so every answer except an exact "sent" sends it to everyone.
 *
 * No test here calls p5: the bridge is given a fake fetch.
 */
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  EMPTY_REFINEMENTS,
  PROJECT_LABELS,
  calculateEstimate,
  getProjectSizeConfig,
  type FinishLevel,
  type ProjectType,
} from "../shared/estimateEngine";
import { resolveInternalEstimate, resolveQuotedRange } from "../shared/costs/resolve";
import {
  MAX_ESTIMATE_LINES,
  MAX_TEAM_INTERNAL_NOTES,
  MAX_TEAM_NOTES,
  MAX_TEAM_NOTE_LENGTH,
  P5_BRIDGE_TIMEOUT_MS,
  buildP5IntakeBody,
  forwardConsultationToP5Intake,
  readP5TeamAlert,
  teamNoteLines,
  type P5BridgeResult,
  type P5IntakeEstimate,
} from "../server/services/p5IntakeBridge";
import {
  SHARED_FAMILY_INBOX_DOMAINS,
  isSharedFamilyInbox,
  scheduleTeamEmail,
  sendTeamEmailAfterBridge,
  teamEmailRecipients,
} from "../server/services/teamEmailGate";
import {
  buildDetailsTeamNotes,
  buildRequestEstimate,
  buildRequestInternalNotes,
  buildRequestTeamNotes,
} from "../server/services/consultationTeamNotes";
import { buildAdminEmailHtml, formatUsd, type VerifiedEstimate } from "../server/services/consultationEmail";
import { escapeHtml } from "../server/services/emailLayout";

const SHARED = "hello@boisehandyman.co";
const OTHER = "owner@example.com";
const CONTACT = { name: "Jordan Example", phone: "(208) 555-0199", email: "jordan@example.com", inquiryId: "4b82598a-24f7-48d3-a9b6-ab5a64c44438" };

type Fetch = (url: string, init: RequestInit) => Promise<Response>;
const answering = (body: unknown, status = 200): Fetch => async () =>
  new Response(typeof body === "string" ? body : JSON.stringify(body), { status });

/**
 * A p5 that never answers; it gives up only when the bridge's own timer aborts
 * it. AbortSignal.timeout does not hold the process open by itself, so the fake
 * holds it (as an open socket would) until the abort arrives.
 */
const hanging: Fetch = (_url, init) =>
  new Promise((_resolve, reject) => {
    const open = setTimeout(() => reject(new Error("the bridge never aborted the request")), 10_000);
    init.signal?.addEventListener("abort", () => {
      clearTimeout(open);
      reject(init.signal?.reason ?? new Error("aborted"));
    });
  });

/** A planning range as the route verifies it: recomputed here, never typed in. */
function estimateFor(project: ProjectType, finish: FinishLevel, sqft: number): VerifiedEstimate {
  const guide = calculateEstimate({ project, finish, sqft, refinements: EMPTY_REFINEMENTS }, 0);
  const range = resolveQuotedRange(project, finish, sqft, EMPTY_REFINEMENTS, 0);
  return {
    project,
    finish,
    sqft,
    priceLow: (range ?? guide).priceLow,
    priceHigh: (range ?? guide).priceHigh,
    roi: guide.roi,
    confidence: guide.confidenceLabel,
    refinements: EMPTY_REFINEMENTS,
    included: guide.included,
    statedBudget: 40_000,
  };
}

function kitchenEstimate(): VerifiedEstimate {
  return estimateFor("kitchen", "mid-range", 160);
}

/** Every project at every finish level, at its smallest, typical and largest size. */
function everyEstimate(): VerifiedEstimate[] {
  const all: VerifiedEstimate[] = [];
  for (const project of Object.keys(PROJECT_LABELS) as ProjectType[]) {
    const size = getProjectSizeConfig(project);
    for (const finish of ["refresh", "mid-range", "high-end", "luxury"] as FinishLevel[]) {
      for (const sqft of [size.min, size.baselineSqft, size.max]) all.push(estimateFor(project, finish, sqft));
    }
  }
  return all;
}

/** The pattern p5 withholds a team_notes line on (INTERNAL_FIGURE in its intakeContract.ts). */
const P5_INTERNAL_FIGURE = /\b(?:costs?|margins?|mark-?ups?|profits?|contingenc(?:y|ies)|overheads?)\b/i;

/** Runs the team email against a bridge answer and reports who was emailed. */
async function deliver(bridge: Promise<P5BridgeResult> | null, recipients = [SHARED, OTHER], maxWaitMs?: number) {
  const sent: string[] = [];
  const outcome = await sendTeamEmailAfterBridge({
    label: "test",
    bridge,
    recipients: () => recipients,
    send: async (to) => {
      sent.push(to);
    },
    maxWaitMs,
  });
  return { sent, outcome };
}

/* ───────────── the bridge: what it sends */

test("the bridge asks p5 to confirm its team email, on the request and on the details", () => {
  for (const submissionKind of ["initial", "details"] as const) {
    const body = buildP5IntakeBody({ ...CONTACT, submissionKind });
    assert.equal(body.team_alert, "confirm", submissionKind);
    assert.equal(body.team_notes, undefined, "no notes, no empty list");
  }
});

test("team_notes are well formed: single `Label: value` lines, at most 40 of at most 300 characters", () => {
  const notes = buildRequestTeamNotes({
    estimate: kitchenEstimate(),
    requestId: "8d6c1f5e-2b1a-4c3d-9e8f-0a1b2c3d4e5f",
    profile: {
      county: "ada",
      parcelId: "R1234567890",
      lotSizeSqFt: 8276,
      lotSizeAcres: 0.19,
      zoning: "R-1C",
      zoningCategory: "Single family residential",
      permittingAuthority: "City of Boise",
    },
  });
  const body = buildP5IntakeBody({ ...CONTACT, teamNotes: notes });
  const sent = body.team_notes as string[];
  assert.ok(Array.isArray(sent) && sent.length > 0);
  assert.deepEqual(sent, notes, "the bridge sends the lines as built");
  assert.ok(sent.length <= MAX_TEAM_NOTES);
  for (const line of sent) {
    assert.equal(typeof line, "string");
    assert.ok(line.length <= MAX_TEAM_NOTE_LENGTH, line);
    assert.doesNotMatch(line, /[\r\n\t]/, "one line");
    assert.equal(line, line.trim());
    assert.match(line, /^[^:]{1,40}: \S/, `Label: value, got ${line}`);
    assert.doesNotMatch(line, /^(?:name|email|phone):/i, "the bridge already sends the contact");
    // No em dash, here or anywhere on the site.
    assert.equal(line.includes(String.fromCharCode(0x2014)), false);
  }
  // What this site's team email carried and the p5 body does not.
  assert.ok(sent.includes("Lead dashboard: https://leads.boisehandyman.co"));
  assert.ok(sent.some((line) => /^Site request id: 8d6c1f5e-/.test(line)));
  assert.ok(sent.some((line) => /^Planning range: \$[\d,]+ to \$[\d,]+ \(Kitchen/.test(line)));
  assert.ok(sent.some((line) => /^Stated budget: \$40,000$/.test(line)));
  assert.ok(sent.some((line) => /^Selections: .*Approx\. size: 160 sq ft/.test(line)));
  assert.ok(sent.some((line) => /^Trade price: [^:]+: \$[\d,]+/.test(line)), "the internal split by trade");
  assert.ok(sent.includes("Parcel: R1234567890"));
  assert.ok(sent.includes("Lot: 0.19 acres (8,276 sq ft)"));
  assert.ok(sent.includes("Permits: City of Boise"));
  // p5's "New lead" email is copied into HubSpot, and costs and margins stay
  // out of HubSpot: prices travel, our cost and margin do not.
  assert.doesNotMatch(sent.join("\n"), /our cost|internal cost|direct cost|contingency|gross profit|margin|markup/i);
  assert.ok(JSON.stringify(body).length < 32 * 1024, "inside the p5 intake body limit");
});

test("team notes: a request with nothing extra still says where this site keeps it, and Step 2 says only that", () => {
  assert.deepEqual(buildRequestTeamNotes({}), ["Lead dashboard: https://leads.boisehandyman.co"]);
  assert.deepEqual(buildDetailsTeamNotes({ requestId: "8d6c1f5e-2b1a-4c3d-9e8f-0a1b2c3d4e5f" }), [
    "Lead dashboard: https://leads.boisehandyman.co",
    "Site request id: 8d6c1f5e-2b1a-4c3d-9e8f-0a1b2c3d4e5f (boisehandyman.co consultation_requests)",
  ]);
  // A planning range that cannot be read never stops the request being forwarded.
  const broken = buildRequestTeamNotes({ estimate: { project: "not-a-project" } as never, requestId: "r1" });
  assert.deepEqual(broken.slice(0, 2), ["Lead dashboard: https://leads.boisehandyman.co", "Site request id: r1 (boisehandyman.co consultation_requests)"]);
});

test("teamNoteLines drops what p5 could not print as a labelled line and caps the rest", () => {
  assert.deepEqual(
    teamNoteLines([
      "  Planning range:   $18,000 to\n$24,000 ",
      "no label here",
      "Empty: ",
      "Name: Jordan Example",
      "EMAIL: jordan@example.com",
      "Phone: 2085550199",
      42,
      null,
      `Long: ${"x".repeat(400)}`,
    ] as unknown[]),
    ["Planning range: $18,000 to $24,000", `Long: ${"x".repeat(MAX_TEAM_NOTE_LENGTH - 9)}...`],
  );
  const many = teamNoteLines(Array.from({ length: 55 }, (_, i) => `Line ${i + 1}: value ${i + 1}`));
  assert.equal(many.length, MAX_TEAM_NOTES);
  assert.equal(many[38], "Line 39: value 39");
  assert.equal(many[39], "More: 16 further lines are on this site's lead record");
  assert.deepEqual(teamNoteLines(undefined), []);
  assert.deepEqual(teamNoteLines("Parcel: R1" as never), []);
});

/* ───────────── internal pricing: team_internal_notes */

test("internal pricing travels in team_internal_notes and never in team_notes", () => {
  const estimate = kitchenEstimate();
  const body = buildP5IntakeBody({
    ...CONTACT,
    teamNotes: buildRequestTeamNotes({ estimate, requestId: "r1" }),
    teamInternalNotes: buildRequestInternalNotes({ estimate }),
  });
  const notes = body.team_notes as string[];
  const internal = body.team_internal_notes as string[];
  assert.ok(Array.isArray(internal) && internal.length > 0);
  assert.deepEqual(internal, buildRequestInternalNotes({ estimate }), "the bridge sends the lines as built");

  // The totals lead, so the 60 line cap can only ever trim the tail.
  assert.deepEqual(
    internal.slice(0, 6).map((line) => line.slice(0, line.indexOf(": "))),
    ["Total internal cost", "Gross profit", "Margin", "Quoted range", "Direct cost", "Contingency"],
  );
  assert.match(internal[2], /^Margin: [\d.]+% gross margin \([\d.]+% markup\)/);
  assert.ok(internal.some((line) => /^Trade: [^:]+: our cost \$[\d,]+, customer \$[\d,]+/.test(line)), "our cost per trade");
  assert.ok(internal.some((line) => line.startsWith("Assumption: ")));

  // No internal line, and no word p5 would withhold, is in team_notes. The old
  // "left out on purpose" placeholder is gone: the figures now arrive.
  for (const line of notes) {
    assert.doesNotMatch(line, P5_INTERNAL_FIGURE, line);
    assert.equal(internal.includes(line), false, line);
  }
  assert.equal(notes.some((line) => /left out/i.test(line)), false);
  // The price split by trade stays where it was, without our cost beside it.
  assert.ok(notes.some((line) => /^Trade price: [^:]+: \$[\d,]+/.test(line)));
  assert.ok(JSON.stringify(body).length < 32 * 1024, "inside the p5 intake body limit");
});

test("the internal totals equal what this site's own team email shows, for every project, finish and size", () => {
  const lead = { ...CONTACT, address: "", projectType: "kitchen" };
  let checks = 0;
  let withWarnings = 0;
  for (const estimate of everyEstimate()) {
    const name = `${estimate.project} ${estimate.finish} ${estimate.sqft}`;
    const internal = buildRequestInternalNotes({ estimate });
    const resolved = resolveInternalEstimate(estimate.project, estimate.finish, estimate.sqft, estimate.refinements);
    if (!resolved) {
      assert.deepEqual(internal, [], `${name}: no rule set, no internal lines`);
      continue;
    }
    const html = buildAdminEmailHtml(lead, estimate, null);
    assert.match(html, /Internal breakdown \(not shown to the lead\)/, name);
    const value = (label: string) => {
      const line = internal.find((item) => item.startsWith(`${label}: `));
      assert.ok(line, `${name}: ${label}`);
      return line.slice(label.length + 2);
    };
    // Each total, read from the email's own table row.
    for (const label of ["Direct cost", "Contingency", "Total internal cost", "Gross profit"]) {
      const row = html.match(new RegExp(`>${label}</td><td[^>]*>(\\$[\\d,]+)</td>`));
      assert.ok(row, `${name}: the email has a ${label} row`);
      assert.equal(value(label), row[1], `${name}: ${label}`);
    }
    assert.ok(html.includes(escapeHtml(value("Margin"))), `${name}: the margin line`);
    assert.ok(html.includes(`Quoted range ${escapeHtml(value("Quoted range"))}`), `${name}: the quoted range`);

    // Each trade: our cost and the customer amount, from the same email row.
    const trades = internal.filter((line) => line.startsWith("Trade: "));
    assert.equal(trades.length, resolved.admin.trades.length, `${name}: every trade is sent`);
    for (const trade of resolved.admin.trades) {
      const row = new RegExp(
        `>${escapeHtml(trade.division).replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}<br>.*?</td><td[^>]*>(\\$[\\d,]+)</td><td[^>]*>(\\$[\\d,]+)</td></tr>`,
      ).exec(html);
      assert.ok(row, `${name}: the email has a ${trade.division} row`);
      assert.ok(
        trades.some((line) => line.startsWith(`Trade: ${trade.division}: our cost ${row[1]}, customer ${row[2]}`)),
        `${name}: ${trade.division} matches the email`,
      );
      assert.equal(row[1], formatUsd(trade.internalCost));
    }

    // Pricing checks travel word for word, as the email prints them.
    const warnings = internal.filter((line) => line.startsWith("Needs review: "));
    assert.equal(warnings.length, resolved.admin.warnings.length, name);
    for (const warning of resolved.admin.warnings) {
      assert.ok(warnings.includes(`Needs review: ${warning.message}`), `${name}: the pricing check wording`);
      assert.ok(html.includes(escapeHtml(warning.message)), name);
      withWarnings++;
    }

    // Caps hold, and the lines are well formed.
    assert.ok(internal.length <= MAX_TEAM_INTERNAL_NOTES, name);
    for (const line of internal) {
      assert.ok(line.length <= MAX_TEAM_NOTE_LENGTH, line);
      assert.match(line, /^[^:]{1,40}: \S/, line);
      assert.doesNotMatch(line, /[\r\n\t]/);
      assert.equal(line.includes(String.fromCharCode(0x2014)), false);
    }
    // And for the same request, team_notes still names no cost or margin.
    const teamNotes = buildRequestTeamNotes({ estimate, requestId: "r1" });
    for (const line of teamNotes) assert.doesNotMatch(line, P5_INTERNAL_FIGURE, `${name}: ${line}`);
    // Both lists and the longest message the form allows still fit the p5 intake body limit.
    const body = buildP5IntakeBody({ ...CONTACT, message: "x".repeat(5_000), teamNotes, teamInternalNotes: internal });
    assert.ok(JSON.stringify(body).length < 32 * 1024, `${name}: inside the p5 intake body limit`);
    checks++;
  }
  assert.ok(checks >= 20, "the sweep priced real projects");
  assert.ok(withWarnings > 0, "the sweep met at least one pricing check");
});

test("no planning range, no team_internal_notes: a plain request, a callback and Step 2 send none", () => {
  assert.deepEqual(buildRequestInternalNotes({}), []);
  assert.deepEqual(buildRequestInternalNotes({ estimate: null }), []);
  // A range that cannot be read sends nothing rather than a guess, and never throws.
  assert.deepEqual(buildRequestInternalNotes({ estimate: { project: "not-a-project" } as never }), []);

  for (const input of [
    { ...CONTACT, teamNotes: buildRequestTeamNotes({ requestId: "r1" }), teamInternalNotes: buildRequestInternalNotes({}) },
    { ...CONTACT, requestKind: "callback" as const, teamInternalNotes: [] },
    { ...CONTACT, submissionKind: "details" as const, teamNotes: buildDetailsTeamNotes({ requestId: "r1" }) },
  ]) {
    const body = buildP5IntakeBody(input);
    assert.equal("team_internal_notes" in body, false, "the key is absent, not an empty list");
  }

  // Step 1 builds them from the verified range only; Step 2 never sends any.
  const request = readFileSync(new URL("../app/api/consultation/route.ts", import.meta.url), "utf8");
  assert.match(request, /teamInternalNotes: buildRequestInternalNotes\(\{ estimate \}\),/);
  const details = readFileSync(new URL("../app/api/consultation/details/route.ts", import.meta.url), "utf8");
  assert.doesNotMatch(details, /teamInternalNotes|buildRequestInternalNotes|team_internal_notes/);
});

test("team_internal_notes are cleaned like team_notes, keep their cost words, and stop at 60 lines", () => {
  const body = buildP5IntakeBody({
    ...CONTACT,
    teamInternalNotes: [
      "  Total internal cost:   $13,300\n",
      "Margin: 30% gross margin (42.9% markup)",
      "no label here",
      "Empty: ",
      "Phone: 2085550199",
      `Needs review: ${"x".repeat(400)}`,
    ],
  });
  assert.deepEqual(body.team_internal_notes, [
    "Total internal cost: $13,300",
    "Margin: 30% gross margin (42.9% markup)",
    `Needs review: ${"x".repeat(MAX_TEAM_NOTE_LENGTH - 17)}...`,
  ]);

  assert.equal(MAX_TEAM_INTERNAL_NOTES, 60);
  const many = Array.from({ length: 75 }, (_, i) => `Trade: line ${i + 1}: our cost $${i + 1}`);
  const capped = buildP5IntakeBody({ ...CONTACT, teamInternalNotes: many }).team_internal_notes as string[];
  assert.equal(capped.length, MAX_TEAM_INTERNAL_NOTES);
  assert.equal(capped[58], "Trade: line 59: our cost $59");
  assert.equal(capped[59], "More: 16 further lines are on this site's lead record");
  // The two caps are separate: the same list as team_notes still stops at 40.
  assert.equal((buildP5IntakeBody({ ...CONTACT, teamNotes: many }).team_notes as string[]).length, MAX_TEAM_NOTES);
});

/* ───────────── the planning range as figures: estimate */

const cents = (value: number) => Math.round(value * 100);

test("a request with a planning range carries a well-formed estimate: the range shown, verified, one customer line per trade", () => {
  const range = kitchenEstimate();
  const body = buildP5IntakeBody({ ...CONTACT, estimate: buildRequestEstimate({ estimate: range }) });
  const estimate = body.estimate as P5IntakeEstimate;
  assert.ok(estimate, "the body carries the estimate");
  assert.deepEqual(estimate, buildRequestEstimate({ estimate: range }), "the bridge sends it as built");

  assert.equal(estimate.kind, "planning-range");
  assert.equal(estimate.low, range.priceLow, "the range the customer was shown");
  assert.equal(estimate.high, range.priceHigh);
  assert.equal(estimate.verified, true, "this site's server recomputed the range");
  assert.equal(estimate.label, "Kitchen, Mid-Range finish, 160 sq ft");
  assert.equal("base" in estimate, false, "with lines, p5 uses their sum");

  const resolved = resolveInternalEstimate(range.project, range.finish, range.sqft, range.refinements);
  assert.ok(resolved);
  const lines = estimate.lines ?? [];
  assert.deepEqual(lines.map((line) => line.title), resolved.admin.trades.map((trade) => trade.division), "one line per trade, in the email's order");
  for (const line of lines) {
    assert.equal(line.division, line.title);
    assert.ok(line.amount > 0);
    for (const key of Object.keys(line)) assert.ok(["title", "description", "quantity", "unit", "amount", "division"].includes(key), key);
  }
  // A single clear quantity travels; two measures in one summary do not.
  const cabinetry = lines.find((line) => line.title === "COUNTERTOPS + CABINETRY");
  assert.ok(cabinetry);
  assert.equal("description" in cabinetry, false, "the measure is not said twice");
  assert.equal(cabinetry.quantity, 18);
  assert.equal(cabinetry.unit, "LF");
  const administration = lines.find((line) => line.title === "ADMINISTRATION");
  assert.ok(administration);
  assert.equal(administration.description, "1 MO, 0 EA");
  assert.equal("quantity" in administration, false);
  assert.equal("unit" in administration, false);
});

test("the estimate's lines add up to the customer price the team email shows, to the cent, for every project, finish and size", () => {
  const lead = { ...CONTACT, address: "", projectType: "kitchen" };
  let checks = 0;
  for (const range of everyEstimate()) {
    const name = `${range.project} ${range.finish} ${range.sqft}`;
    const estimate = buildRequestEstimate({ estimate: range });
    assert.ok(estimate, `${name}: an estimate is sent`);
    const resolved = resolveInternalEstimate(range.project, range.finish, range.sqft, range.refinements);
    if (!resolved) {
      assert.equal(estimate.lines, undefined, `${name}: no rule set, the range alone`);
      continue;
    }
    const { admin } = resolved;
    const lines = estimate.lines ?? [];
    assert.ok(lines.length > 0 && lines.length <= MAX_ESTIMATE_LINES, name);

    // The sum is the customer price, exactly, and it is the figure the email prints.
    const total = lines.reduce((sum, line) => sum + cents(line.amount), 0);
    assert.equal(total, cents(admin.customerPrice), `${name}: the lines sum to the customer price to the cent`);
    const html = buildAdminEmailHtml(lead, range, null);
    assert.ok(html.includes(`of ${formatUsd(total / 100)}`), `${name}: the customer price in the team email`);

    // Each line is that trade's CUSTOMER amount, within the cents moved by rounding.
    assert.equal(lines.length, admin.trades.length, name);
    for (const [index, trade] of admin.trades.entries()) {
      const line = lines[index];
      assert.equal(line.title, trade.division, name);
      assert.ok(Math.abs(line.amount - trade.customerAmount) <= (lines.length + 1) / 100, `${name}: ${trade.division} is the customer amount`);
      assert.equal(cents(line.amount) / 100, line.amount, `${name}: whole cents`);
      assert.ok(line.amount > 0);
      if (line.quantity !== undefined) assert.ok(line.quantity > 0 && typeof line.unit === "string" && line.unit.length > 0, name);
    }

    // The range is the one shown, and the total belongs to it (p5 refuses under half of low or over twice high).
    assert.equal(estimate.low, range.priceLow, name);
    assert.equal(estimate.high, range.priceHigh, name);
    assert.ok(total >= cents(estimate.low) && total <= cents(estimate.high), `${name}: the customer price is inside the range shown`);
    assert.equal(estimate.verified, true, name);
    assert.ok(total <= cents(5_000_000), `${name}: under the p5 ceiling`);

    // Customer amounts only. By word: nothing in the estimate names an internal figure.
    assert.doesNotMatch(JSON.stringify(estimate), P5_INTERNAL_FIGURE, name);
    assert.equal(JSON.stringify(estimate).includes(String.fromCharCode(0x2014)), false);
    // By value: every line is above our cost for that trade (it is the customer
    // column, not the cost column), and neither the total nor the range is one
    // of this range's internal totals. A customer amount may happen to equal
    // ANOTHER trade's cost (kitchen, high-end, 600 sq ft does), so lines are
    // compared with their own trade only.
    for (const [index, trade] of admin.trades.entries()) {
      assert.ok(lines[index].amount > trade.internalCost, `${name}: ${trade.division} is not our cost`);
    }
    const internalTotals = new Set([admin.directCost, admin.contingency, admin.totalInternalCost, admin.grossProfit].map(cents));
    for (const amount of [estimate.low, estimate.high, total / 100, ...(estimate.base === undefined ? [] : [estimate.base])]) {
      assert.equal(internalTotals.has(cents(amount)), false, `${name}: ${amount} is an internal total`);
    }

    // With both note lists and the longest message, the body still fits the p5 intake.
    const body = buildP5IntakeBody({
      ...CONTACT,
      message: "x".repeat(5_000),
      teamNotes: buildRequestTeamNotes({ estimate: range, requestId: "r1" }),
      teamInternalNotes: buildRequestInternalNotes({ estimate: range }),
      estimate,
    });
    assert.ok(JSON.stringify(body).length < 32 * 1024, `${name}: inside the p5 intake body limit`);
    checks++;
  }
  assert.ok(checks >= 20, "the sweep priced real projects");
});

test("no planning range, no estimate: a plain request, a callback and Step 2 send none, and a bad range sends none", () => {
  assert.equal(buildRequestEstimate({}), null);
  assert.equal(buildRequestEstimate({ estimate: null }), null);
  // Never throws, never guesses: an unreadable or impossible range means no field.
  const range = kitchenEstimate();
  for (const bad of [
    { project: "not-a-project" },
    { ...range, priceLow: 0 },
    { ...range, priceLow: Number.NaN },
    { ...range, priceHigh: Number.POSITIVE_INFINITY },
    { ...range, priceLow: range.priceHigh + 1 },
    { ...range, priceLow: "19000" },
    // A range nowhere near this site's own customer price is not that estimate.
    { ...range, priceLow: 1, priceHigh: 2 },
    { ...range, priceLow: 900_000, priceHigh: 950_000 },
  ]) {
    assert.equal(buildRequestEstimate({ estimate: bad as never }), null, JSON.stringify(bad).slice(0, 80));
  }

  const built = buildRequestEstimate({ estimate: range });
  assert.ok(built);
  assert.equal("estimate" in buildP5IntakeBody({ ...CONTACT }), false, "a plain request");
  assert.equal("estimate" in buildP5IntakeBody({ ...CONTACT, estimate: null }), false);
  assert.equal("estimate" in buildP5IntakeBody({ ...CONTACT, requestKind: "callback", estimate: built }), false, "a callback");
  assert.equal("estimate" in buildP5IntakeBody({ ...CONTACT, submissionKind: "details", estimate: built }), false, "Step 2");
  assert.equal("estimate" in buildP5IntakeBody({ ...CONTACT, requestKind: "quote", submissionKind: "initial", estimate: built }), true);

  // Step 1 builds it from the server-verified range only; Step 2 never sends one.
  const request = readFileSync(new URL("../app/api/consultation/route.ts", import.meta.url), "utf8");
  assert.match(request, /estimate: buildRequestEstimate\(\{ estimate \}\),/);
  assert.match(request, /const estimate = data\.estimate \? verifyEstimate\(data\.estimate\) : null;/, "the range sent as verified is the one the server recomputed");
  const details = readFileSync(new URL("../app/api/consultation/details/route.ts", import.meta.url), "utf8");
  assert.doesNotMatch(details, /buildRequestEstimate|\bestimate:/);
});

/* ───────────── the bridge: what it reports */

test("the bridge reports p5's answer: sent, failed and none are read exactly, anything else is unknown", async () => {
  for (const alert of ["sent", "failed", "none"] as const) {
    assert.deepEqual(await forwardConsultationToP5Intake(CONTACT, answering({ ok: true, alert }, 201)), { forwarded: true, alert });
  }
  for (const answer of [{ ok: true }, { alert: "SENT" }, { alert: " sent" }, { alert: true }, { alert: null }, { alert: ["sent"] }, { result: { alert: "sent" } }, ["sent"], "sent", null, 7]) {
    assert.equal(readP5TeamAlert(answer), "unknown", JSON.stringify(answer));
  }
  // An older p5 (no alert), an answer that is not JSON, and an empty answer.
  assert.deepEqual(await forwardConsultationToP5Intake(CONTACT, answering({ ok: true, accepted: true })), { forwarded: true, alert: "unknown" });
  assert.deepEqual(await forwardConsultationToP5Intake(CONTACT, answering("<html>ok</html>")), { forwarded: true, alert: "unknown" });
  assert.deepEqual(await forwardConsultationToP5Intake(CONTACT, answering("")), { forwarded: true, alert: "unknown" });
  // An HTTP error is never a confirmation, whatever its body claims.
  assert.deepEqual(await forwardConsultationToP5Intake(CONTACT, answering({ alert: "sent" }, 500)), { forwarded: false, alert: "unknown" });
  assert.deepEqual(await forwardConsultationToP5Intake(CONTACT, answering({ alert: "sent" }, 422)), { forwarded: false, alert: "unknown" });
});

test("the bridge never throws: a thrown fetch and a timeout both report unknown", async () => {
  const thrown = await forwardConsultationToP5Intake(CONTACT, async () => {
    throw new Error("network down");
  });
  assert.deepEqual(thrown, { forwarded: false, alert: "unknown" });

  const started = Date.now();
  const timedOut = await forwardConsultationToP5Intake(CONTACT, hanging, 30);
  assert.deepEqual(timedOut, { forwarded: false, alert: "unknown" });
  assert.ok(Date.now() - started < 5_000, "the bridge gives up on its own timer");

  // p5 can take about 25 seconds in confirm mode, so the bridge waits 30.
  assert.equal(P5_BRIDGE_TIMEOUT_MS, 30_000);
  let signal: AbortSignal | null | undefined;
  await forwardConsultationToP5Intake(CONTACT, async (_url, init) => {
    signal = init.signal;
    return new Response("{}", { status: 200 });
  });
  assert.ok(signal instanceof AbortSignal, "every post carries the timeout");
});

/* ───────────── the shared inbox */

test("the shared family inbox is hello@ at every family domain, whatever the case", () => {
  assert.deepEqual([...SHARED_FAMILY_INBOX_DOMAINS], [
    "p5homeco.com",
    "boisecabinet.co",
    "boiseconstruction.co",
    "boiseremodeling.co",
    "boisehandyman.co",
    "boiseadu.co",
  ]);
  for (const domain of SHARED_FAMILY_INBOX_DOMAINS) {
    assert.equal(isSharedFamilyInbox(`hello@${domain}`), true, domain);
    assert.equal(isSharedFamilyInbox(`  Hello@${domain.toUpperCase()} `), true, domain);
    assert.equal(isSharedFamilyInbox(`Boise Handyman Co <HELLO@${domain}>`), true, domain);
  }
  for (const other of ["owner@boisehandyman.co", "hello@example.com", "hello@boisehandyman.co.example.com", "hello@mail.boisehandyman.co", "nothello@p5homeco.com", "hello+leads@p5homeco.com", "", null, undefined]) {
    assert.equal(isSharedFamilyInbox(other), false, String(other));
  }
  assert.deepEqual(teamEmailRecipients([SHARED, OTHER, "Hello@P5HomeCo.com", OTHER], "sent"), [OTHER]);
  for (const alert of ["failed", "none", "unknown"] as const) {
    assert.deepEqual(teamEmailRecipients([SHARED, OTHER], alert), [SHARED, OTHER], alert);
  }
});

/* ───────────── the decision */

test("sent: the shared inbox is skipped and any other admin recipient is still emailed", async () => {
  const { sent, outcome } = await deliver(forwardConsultationToP5Intake(CONTACT, answering({ ok: true, alert: "sent" }, 201)));
  assert.deepEqual(sent, [OTHER]);
  assert.deepEqual(outcome, { alert: "sent", sentTo: [OTHER], skipped: [SHARED] });

  // With only the shared inbox on the list (this site's default), p5's email is the one email.
  const only = await deliver(forwardConsultationToP5Intake(CONTACT, answering({ alert: "sent" })), [SHARED]);
  assert.deepEqual(only.sent, []);
  assert.deepEqual(only.outcome.skipped, [SHARED]);
});

test("failed, none, unknown, an HTTP error, a thrown fetch and a timeout each email everyone", async () => {
  const cases: Array<[string, Promise<P5BridgeResult>]> = [
    ["failed", forwardConsultationToP5Intake(CONTACT, answering({ ok: true, alert: "failed" }))],
    ["none", forwardConsultationToP5Intake(CONTACT, answering({ ok: true, duplicate: true, alert: "none" }))],
    ["unknown (an older p5, no alert)", forwardConsultationToP5Intake(CONTACT, answering({ ok: true }))],
    ["unknown (an alert this site does not know)", forwardConsultationToP5Intake(CONTACT, answering({ alert: "queued" }))],
    ["HTTP error", forwardConsultationToP5Intake(CONTACT, answering({ alert: "sent" }, 503))],
    ["thrown fetch", forwardConsultationToP5Intake(CONTACT, async () => { throw new Error("network down"); })],
    ["timeout", forwardConsultationToP5Intake(CONTACT, hanging, 30)],
  ];
  for (const [name, bridge] of cases) {
    const { sent, outcome } = await deliver(bridge);
    assert.deepEqual(sent, [SHARED, OTHER], name);
    assert.deepEqual(outcome.skipped, [], name);
    assert.notEqual(outcome.alert, "sent", name);
  }
});

test("nothing forwarded, a bridge that rejects, and a bridge that never settles each email everyone", async () => {
  assert.deepEqual((await deliver(null)).sent, [SHARED, OTHER], "the bridge was not called at all");
  assert.deepEqual((await deliver(Promise.reject(new Error("bridge threw")))).sent, [SHARED, OTHER]);
  assert.deepEqual((await deliver(Promise.resolve({ forwarded: true, alert: "delivered" } as never))).sent, [SHARED, OTHER]);
  assert.deepEqual((await deliver(Promise.resolve(undefined as never))).sent, [SHARED, OTHER]);
  const never = await deliver(new Promise<P5BridgeResult>(() => {}), [SHARED, OTHER], 20);
  assert.deepEqual(never.sent, [SHARED, OTHER]);
  assert.equal(never.outcome.alert, "unknown");
});

test("one recipient failing does not stop the next, and the send never throws", async () => {
  const sent: string[] = [];
  const outcome = await sendTeamEmailAfterBridge({
    label: "test",
    bridge: null,
    recipients: () => [SHARED, OTHER],
    send: async (to) => {
      if (to === SHARED) throw new Error("mail server refused");
      sent.push(to);
    },
  });
  assert.deepEqual(sent, [OTHER]);
  assert.deepEqual(outcome.sentTo, [OTHER]);
  await assert.doesNotReject(() =>
    sendTeamEmailAfterBridge({
      label: "test",
      bridge: null,
      recipients: () => {
        throw new Error("no recipients");
      },
      send: async () => undefined,
    }),
  );
});

/* ───────────── the visitor never waits */

test("the visitor response is not delayed: the team email waits for the bridge inside after(), and nothing is sent before it answers", async () => {
  let answer!: (result: P5BridgeResult) => void;
  const bridge = new Promise<P5BridgeResult>((resolve) => {
    answer = resolve;
  });
  const tasks: Array<() => Promise<unknown>> = [];
  const sent: string[] = [];
  const now = scheduleTeamEmail((task) => void tasks.push(task), {
    label: "test",
    bridge,
    recipients: () => [SHARED, OTHER],
    send: async (to) => {
      sent.push(to);
    },
  });
  // Scheduling returns at once with nothing for the route to await, while p5
  // has not answered: the response goes out here.
  assert.equal(now, null);
  assert.equal(tasks.length, 1);
  assert.deepEqual(sent, []);

  // after() runs the task once the response is out. It still waits for p5.
  const running = tasks[0]();
  await new Promise((resolve) => setTimeout(resolve, 20));
  assert.deepEqual(sent, [], "no team email before the bridge answers");
  answer({ forwarded: true, alert: "sent" });
  await running;
  assert.deepEqual(sent, [OTHER]);
});

test("after() unavailable: the team email goes to everyone at once, as it did before this rule", async () => {
  const sent: string[] = [];
  const now = scheduleTeamEmail(
    () => {
      throw new Error("after() was called outside a request scope");
    },
    {
      label: "test",
      // Even a bridge that would confirm is not waited on here.
      bridge: new Promise<P5BridgeResult>(() => {}),
      recipients: () => [SHARED, OTHER],
      send: async (to) => {
        sent.push(to);
      },
    },
  );
  assert.ok(now instanceof Promise);
  await now;
  assert.deepEqual(sent, [SHARED, OTHER]);
});
