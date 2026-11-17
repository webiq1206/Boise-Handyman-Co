/**
 * Team notes for the p5 intake (`team_notes`, owner decision 17 November 2026).
 *
 * When p5 confirms its own team email, this site's team email is not sent to
 * the shared inbox, so what only this site knows travels in the p5 email
 * instead, under "From the website": the in-house planning range and how it
 * splits by trade, the selections behind it, the county parcel record, and
 * where this site keeps the request.
 *
 * Every line is `Label: value` on one line. Nothing the bridge already sends
 * is repeated (name, phone, email, address, project type, message, timing,
 * files, attribution).
 *
 * Our cost, contingency, gross profit and margin are deliberately NOT here.
 * p5's "New lead" email is copied into HubSpot by its inbox sync, and costs
 * and margins stay out of HubSpot. This site's own team email (the fallback)
 * still carries them, and they can be rebuilt from the selections sent here.
 */
import { PROJECT_LABELS, isNewConstructionProject } from "@/shared/estimateEngine";
import { resolveInternalEstimate } from "@/shared/costs/resolve";
import {
  LEADS_DASHBOARD_URL,
  buildPropertyRows,
  buildSelectionRows,
  formatUsd,
  type PropertyEnrichment,
  type VerifiedEstimate,
} from "@/server/services/consultationEmail";
import { MAX_TEAM_NOTE_LENGTH, teamNoteLines } from "@/server/services/p5IntakeBridge";

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
    lines.push("Cost and margin: left out on purpose, because this email is copied into HubSpot");
    // The notes themselves can name a margin, so only their count travels.
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
