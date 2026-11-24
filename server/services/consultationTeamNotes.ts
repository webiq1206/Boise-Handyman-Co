/**
 * Team notes for the p5 intake (owner decisions, 17 November 2026).
 *
 * When p5 confirms its own team email, this site's team email is not sent to
 * the shared inbox, so what only this site knows travels in the p5 email
 * instead, in two fields that must never be mixed up:
 *
 * `team_notes` ("From the website"): the in-house planning range and how its
 * price splits by trade, the selections behind it, the county parcel record,
 * and where this site keeps the request. p5 copies a "New lead" email into
 * HubSpot, and costs and margins stay out of HubSpot, so NO cost, margin,
 * markup, profit, contingency or overhead line belongs here (p5 withholds any
 * line that names one).
 *
 * `team_internal_notes` ("Internal pricing"): what this site's own team email
 * shows under "Internal breakdown" for a request with a planning range: our
 * cost by trade, direct cost, contingency, total internal cost, gross profit,
 * the margin, and the wording of pricing checks. When any are sent, p5 sends
 * the email as "Lead and pricing: ...", which is never copied into HubSpot.
 *
 * Every line is `Label: value` on one line. Nothing the bridge already sends
 * is repeated (name, phone, email, address, project type, message, timing,
 * files, attribution).
 *
 * `estimate` (buildRequestEstimate): the same planning range as figures, so
 * p5 can create the QuickBooks customer and an unsent estimate. The customer
 * price split by trade and nothing else: never a cost or a margin.
 */
import { PROJECT_LABELS, getFinishLabel, isNewConstructionProject } from "@/shared/estimateEngine";
import { resolveInternalEstimate } from "@/shared/costs/resolve";
import {
  LEADS_DASHBOARD_URL,
  buildPropertyRows,
  buildSelectionRows,
  formatUsd,
  type PropertyEnrichment,
  type VerifiedEstimate,
} from "@/server/services/consultationEmail";
import {
  MAX_ESTIMATE_LINES,
  MAX_TEAM_INTERNAL_NOTES,
  MAX_TEAM_NOTE_LENGTH,
  teamNoteLines,
  type P5IntakeEstimate,
  type P5IntakeEstimateLine,
} from "@/server/services/p5IntakeBridge";

/** Packs `a: b` pairs into as few `Label: a: b; c: d` lines as fit. */
function packed(label: string, items: string[]): string[] {
  const lines: string[] = [];
  let current = "";
  for (const item of items) {
    const next = current ? `${current}; ${item}` : item;
    if (current && `${label}: ${next}`.length > MAX_TEAM_NOTE_LENGTH) {
      lines.push(`${label}: ${current}`);
      current = item;
    } else {
      current = next;
    }
  }
  if (current) lines.push(`${label}: ${current}`);
  return lines;
}

/** Where this site keeps the request: the dashboard the team works from, and the saved row. */
function recordNotes(requestId: string | null | undefined): string[] {
  return [
    `Lead dashboard: ${LEADS_DASHBOARD_URL}`,
    ...(requestId ? [`Site request id: ${requestId} (boisehandyman.co consultation_requests)`] : []),
  ];
}

function estimateNotes(est: VerifiedEstimate): string[] {
  const lines = [
    `Planning range: ${formatUsd(est.priceLow)} to ${formatUsd(est.priceHigh)} (${PROJECT_LABELS[est.project].label}, this site's own planning range, shown to the customer)`,
    `Detail level: ${est.confidence}`,
  ];
  if (est.roi && !isNewConstructionProject(est.project)) {
    lines.push(`Typical resale ROI: about ${Math.round(est.roi)}%`);
  }
  if (est.statedBudget && est.statedBudget > 0) {
    lines.push(`Stated budget: ${formatUsd(est.statedBudget)}`);
  }
  lines.push(
    ...packed(
      "Selections",
      buildSelectionRows(est.project, est.finish, est.sqft, est.refinements, est.layoutLabel, est.upgradeLabels).map(
        (row) => `${row.label}: ${row.value}`,
      ),
    ),
  );

  const resolved = resolveInternalEstimate(est.project, est.finish, est.sqft, est.refinements);
  if (resolved) {
    const { admin } = resolved;
    // The notes themselves can name a margin, so only their count travels
    // here. Their wording is in the internal notes.
    if (admin.warnings.length) {
      lines.push(
        `Needs review: ${admin.warnings.length} pricing ${admin.warnings.length === 1 ? "note" : "notes"} on this range (duplicate scope lines or a trimmed price)`,
      );
    }
    // Last, so a long trade list is what the 40 line cap trims.
    if (admin.trades.length) {
      lines.push("Trade prices: this site's internal split of the range midpoint, not shown to the customer");
    }
    for (const trade of admin.trades) {
      lines.push(
        `Trade price: ${trade.division}: ${formatUsd(trade.customerAmount)}${trade.scopeSummary ? ` (${trade.scopeSummary})` : ""}`,
      );
    }
  }
  return lines;
}

/** How many of the engine's assumptions this site's own team email prints. */
const INTERNAL_ASSUMPTIONS_SHOWN = 8;

/**
 * Step 1 with a planning range: the lines for `team_internal_notes`. The same
 * figures, from the same resolver, as "Internal breakdown (not shown to the
 * lead)" in this site's own team email (renderTradeRollupHtml). The totals
 * come first so the 60 line cap can only ever trim the tail.
 *
 * Nothing for a request without a range, and nothing for Step 2. Never
 * throws: if the breakdown cannot be built, the request is still forwarded.
 */
export function buildRequestInternalNotes(input: { estimate?: VerifiedEstimate | null }): string[] {
  const est = input.estimate;
  if (!est) return [];
  try {
    const resolved = resolveInternalEstimate(est.project, est.finish, est.sqft, est.refinements);
    if (!resolved) return [];
    const { admin } = resolved;
    const lines = [
      `Total internal cost: ${formatUsd(admin.totalInternalCost)}`,
      `Gross profit: ${formatUsd(admin.grossProfit)}`,
      `Margin: ${admin.marginLabel}`,
      `Quoted range: ${admin.rangeLabel}`,
      `Direct cost: ${formatUsd(admin.directCost)}`,
      `Contingency: ${formatUsd(admin.contingency)}`,
      ...admin.warnings.map((warning) => `Needs review: ${warning.message}`),
      ...admin.trades.map(
        (trade) =>
          `Trade: ${trade.division}: our cost ${formatUsd(trade.internalCost)}, customer ${formatUsd(trade.customerAmount)}${trade.scopeSummary ? ` (${trade.scopeSummary})` : ""}`,
      ),
      ...admin.assumptions.slice(0, INTERNAL_ASSUMPTIONS_SHOWN).map((assumption) => `Assumption: ${assumption}`),
    ];
    return teamNoteLines(lines, MAX_TEAM_INTERNAL_NOTES);
  } catch (err) {
    console.error("[p5-intake] Could not build the internal pricing notes:", err);
    return [];
  }
}

/** Words p5 treats as internal figures. Nothing in `estimate` may name one. */
const INTERNAL_FIGURE = /\b(?:costs?|margins?|mark-?ups?|profits?|contingenc(?:y|ies)|overheads?)\b/i;

const toCents = (value: number) => Math.round(value * 100);
const usable = (value: unknown): value is number => typeof value === "number" && Number.isFinite(value) && value > 0;

/** "18 LF" is one clear quantity; "1 MO, 0 EA" is not. */
function singleQuantity(scopeSummary: string): { quantity: number; unit: string } | null {
  const match = /^(\d[\d,]*(?:\.\d+)?) ([A-Za-z]+)$/.exec(scopeSummary.trim());
  if (!match) return null;
  const quantity = Number(match[1].replace(/,/g, ""));
  return usable(quantity) ? { quantity, unit: match[2] } : null;
}

/**
 * Step 1 with a planning range: the `estimate` p5 turns into a QuickBooks
 * customer and an UNSENT estimate (owner decisions, 13 and 17 November 2026).
 *
 * `low` and `high` are the range the customer was shown, which this site's
 * server recomputed (verifyEstimate in the route), hence `verified: true`.
 * The lines are the CUSTOMER amount of each trade, from the same
 * resolveInternalEstimate() view as the team email and the internal notes;
 * they add up, to the cent, to the customer price that email shows (the centre
 * of the range), and that sum is the QuickBooks total.
 *
 * Customer amounts only: no cost, margin, markup, profit, contingency or
 * overhead, in any field. Never throws. On any problem it returns null and
 * the request is forwarded without the field.
 */
export function buildRequestEstimate(input: { estimate?: VerifiedEstimate | null }): P5IntakeEstimate | null {
  const est = input.estimate;
  if (!est) return null;
  try {
    if (!usable(est.priceLow) || !usable(est.priceHigh) || est.priceLow > est.priceHigh) return null;
    const estimate: P5IntakeEstimate = { kind: "planning-range", low: est.priceLow, high: est.priceHigh, verified: true };
    const label = `${PROJECT_LABELS[est.project].label}, ${getFinishLabel(est.project, est.finish).label} finish, ${est.sqft.toLocaleString("en-US")} sq ft`;
    if (!INTERNAL_FIGURE.test(label)) estimate.label = label;

    // No rule set for this project: the range alone, and p5 uses its midpoint.
    const resolved = resolveInternalEstimate(est.project, est.finish, est.sqft, est.refinements);
    if (!resolved) return estimate;
    const { admin } = resolved;
    const total = toCents(admin.customerPrice);
    // A customer price nowhere near the range shown is not that estimate.
    if (!usable(admin.customerPrice) || total < toCents(est.priceLow) / 2 || total > toCents(est.priceHigh) * 2) return null;

    const priced = admin.trades
      .map((trade) => ({ trade, cents: toCents(trade.customerAmount) }))
      .filter(({ cents }) => Number.isFinite(cents) && cents > 0);
    // Each line is rounded to the cent, so the last cents of the customer
    // price go on the largest line and the sum is exact.
    const remainder = total - priced.reduce((sum, { cents }) => sum + cents, 0);
    const largest = priced.reduce<(typeof priced)[number] | null>((top, row) => (!top || row.cents > top.cents ? row : top), null);
    const named = priced.some(({ trade }) => INTERNAL_FIGURE.test(`${trade.division} ${trade.scopeSummary}`));
    if (!largest || Math.abs(remainder) > priced.length || priced.length > MAX_ESTIMATE_LINES || named) {
      // The split cannot be sent as it stands. The one customer price still can.
      return { ...estimate, base: total / 100 };
    }
    largest.cents += remainder;

    estimate.lines = priced.map(({ trade, cents }) => {
      const line: P5IntakeEstimateLine = { title: trade.division, division: trade.division, amount: cents / 100 };
      if("sku" in trade&&"qboItemId" in trade){
        line.sku=String(trade.sku);line.qboItemId=String(trade.qboItemId);
        line.description=`${line.sku}; requested QBO item ${line.qboItemId}; final client rate $120/hour`;
      }
      // One clear measure travels as quantity and unit (p5 prints it beside
      // the title, so repeating it as the description would say it twice).
      // Anything else ("1 MO, 0 EA") travels as words.
      const measure = singleQuantity(trade.scopeSummary ?? "");
      if (measure) {
        line.quantity = measure.quantity;
        line.unit = measure.unit;
      } else if (trade.scopeSummary) {
        line.description = trade.scopeSummary;
      }
      return line;
    });
    return estimate;
  } catch (err) {
    console.error("[p5-intake] Could not build the estimate for p5:", err);
    return null;
  }
}

export type RequestTeamNotesInput = {
  estimate?: VerifiedEstimate | null;
  profile?: PropertyEnrichment | null;
  /** The saved consultation_requests row. */
  requestId?: string | null;
};

/**
 * Step 1 (request, callback, request with a planning range). Never throws: a
 * note that cannot be built is left out, the request is still forwarded.
 */
export function buildRequestTeamNotes(input: RequestTeamNotesInput): string[] {
  const lines = recordNotes(input.requestId);
  try {
    if (input.profile) {
      lines.push(...buildPropertyRows(input.profile).map(([label, value]) => `${label}: ${value}`));
    }
  } catch (err) {
    console.error("[p5-intake] Could not build the parcel notes:", err);
  }
  try {
    if (input.estimate) lines.push(...estimateNotes(input.estimate));
  } catch (err) {
    console.error("[p5-intake] Could not build the planning range notes:", err);
  }
  return teamNoteLines(lines);
}

/**
 * Step 2 ("Details added"). What was added already travels in the post itself
 * (the DETAILS ADDED block, the timing and every file link), so the notes only
 * say where this site keeps the request.
 */
export function buildDetailsTeamNotes(input: { requestId?: string | null }): string[] {
  return teamNoteLines(recordNotes(input.requestId));
}
