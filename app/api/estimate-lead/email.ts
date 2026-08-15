/**
 * Email rendering for handyman estimate leads.
 *
 * Colocated with the route on purpose: the construction-era builders in
 * server/services/consultationEmail.ts render the old VerifiedEstimate shape
 * and belong to another package. Everything user-supplied is escaped here, so
 * both emails can restate the visitor's selections verbatim without trusting
 * the client.
 */
import {
  formatHandymanCurrency,
  formatHours,
  HANDYMAN_RATE_DISCLAIMER,
  JOB_CATEGORY_LABELS,
  MATERIALS_COST_NOTE,
  URGENCY_LEVELS,
  type HandymanEstimate,
  type HandymanEstimateInput,
} from "@/shared/estimateEngine";
import { findTaskOption, OTHER_JOB_SIZES } from "@/shared/estimateEngine";
import { SITE_CONFIG } from "@/shared/siteConfig";

export interface HandymanLeadDetails {
  name: string;
  email: string;
  phone?: string;
  city: string;
  notes?: string;
}

/** Reply-to header with the lead's name, stripped of header-breaking chars. */
export function formatLeadReplyTo(name: string, email: string): string {
  const clean = name.replace(/[\r\n"\\]/g, "").trim();
  return clean ? `"${clean}" <${email}>` : email;
}

export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export function describeSelections(input: HandymanEstimateInput): string[] {
  const rows: string[] = [];
  for (const selection of input.tasks) {
    const task = findTaskOption(selection.taskId);
    if (!task) continue;
    rows.push(
      selection.quantity > 1
        ? `${task.label} x ${selection.quantity} (${task.unitLabel ?? "items"})`
        : task.label,
    );
  }
  if (input.otherJob && input.otherJob.description.trim().length > 0) {
    rows.push(
      `Other (${OTHER_JOB_SIZES[input.otherJob.size].label.toLowerCase()}): ${input.otherJob.description.trim()}`,
    );
  }
  return rows;
}

function rangeLine(estimate: HandymanEstimate): string {
  return `${formatHandymanCurrency(estimate.priceLow)} to ${formatHandymanCurrency(estimate.priceHigh)}`;
}

function breakdownTable(estimate: HandymanEstimate, hideInternalLines = false): string {
  const lines = hideInternalLines
    ? estimate.lines.filter((l) => l.id !== "trip-fee")
    : estimate.lines;
  const rows = lines
    .map(
      (line) =>
        `<tr><td style="padding:4px 12px 4px 0;color:#444;">${escapeHtml(line.label)}</td>` +
        `<td style="padding:4px 0;text-align:right;color:#111;">${formatHandymanCurrency(line.amount)}</td></tr>`,
    )
    .join("");
  return (
    `<table style="border-collapse:collapse;font-size:14px;width:100%;max-width:420px;">${rows}` +
    `<tr><td style="padding:6px 12px 4px 0;border-top:1px solid #ddd;color:#111;"><strong>Estimated visit total</strong></td>` +
    `<td style="padding:6px 0 4px;border-top:1px solid #ddd;text-align:right;color:#111;"><strong>${formatHandymanCurrency(estimate.total)}</strong></td></tr></table>`
  );
}

function selectionsList(input: HandymanEstimateInput): string {
  const items = describeSelections(input)
    .map((row) => `<li style="margin:2px 0;">${escapeHtml(row)}</li>`)
    .join("");
  return `<ul style="margin:6px 0;padding-left:18px;font-size:14px;color:#333;">${items}</ul>`;
}

export function buildHandymanAdminSubject(
  lead: HandymanLeadDetails,
  input: HandymanEstimateInput,
  estimate: HandymanEstimate,
): string {
  const category = JOB_CATEGORY_LABELS[input.category].label;
  return `Estimate lead: ${lead.name}, ${category} in ${lead.city} (${rangeLine(estimate)})`;
}

export function buildHandymanCustomerSubject(estimate: HandymanEstimate): string {
  return `Your handyman estimate: ${rangeLine(estimate)}`;
}

export function buildHandymanAdminEmailHtml(
  lead: HandymanLeadDetails,
  input: HandymanEstimateInput,
  estimate: HandymanEstimate,
): string {
  const urgency = URGENCY_LEVELS[input.urgency];
  return `
  <div style="font-family:Arial,Helvetica,sans-serif;max-width:600px;">
    <h2 style="color:#111;">New estimate lead</h2>
    <table style="border-collapse:collapse;font-size:14px;">
      <tr><td style="padding:3px 12px 3px 0;color:#666;">Name</td><td>${escapeHtml(lead.name)}</td></tr>
      <tr><td style="padding:3px 12px 3px 0;color:#666;">Email</td><td>${escapeHtml(lead.email)}</td></tr>
      <tr><td style="padding:3px 12px 3px 0;color:#666;">Phone</td><td>${escapeHtml(lead.phone || "Not provided")}</td></tr>
      <tr><td style="padding:3px 12px 3px 0;color:#666;">City</td><td>${escapeHtml(lead.city)}</td></tr>
      <tr><td style="padding:3px 12px 3px 0;color:#666;">Job type</td><td>${escapeHtml(JOB_CATEGORY_LABELS[input.category].label)}</td></tr>
      <tr><td style="padding:3px 12px 3px 0;color:#666;">Timing</td><td>${escapeHtml(`${urgency.label} (${urgency.sub})`)}</td></tr>
      <tr><td style="padding:3px 12px 3px 0;color:#666;">Materials</td><td>${input.materials === "we-pick-up" ? "We pick up (supply run added)" : "Customer supplies"}</td></tr>
      <tr><td style="padding:3px 12px 3px 0;color:#666;">Est. hours</td><td>${escapeHtml(formatHours(estimate.totalHours))}</td></tr>
    </table>
    <h3 style="color:#111;margin-bottom:2px;">Requested work</h3>
    ${selectionsList(input)}
    ${lead.notes ? `<p style="font-size:14px;color:#333;"><strong>Notes:</strong> ${escapeHtml(lead.notes)}</p>` : ""}
    <h3 style="color:#111;margin-bottom:6px;">Range shown to the visitor: ${rangeLine(estimate)}</h3>
    ${breakdownTable(estimate)}
    ${estimate.oversized ? `<p style="font-size:13px;color:#a15c00;"><strong>Heads up:</strong> this is more than a full day on site. Call to scope before quoting.</p>` : ""}
    <p style="font-size:12px;color:#888;">Server-recomputed range. Reply goes straight to the customer.</p>
  </div>`;
}

export function buildHandymanCustomerEmailHtml(
  lead: HandymanLeadDetails,
  input: HandymanEstimateInput,
  estimate: HandymanEstimate,
): string {
  const urgency = URGENCY_LEVELS[input.urgency];
  return `
  <div style="font-family:Arial,Helvetica,sans-serif;max-width:600px;color:#222;">
    <h2 style="color:#111;">Your estimate from ${escapeHtml(SITE_CONFIG.name)}</h2>
    <p style="font-size:14px;">Hi ${escapeHtml(lead.name)}, thanks for telling us about your job. Here is the starting range for the work you described:</p>
    <p style="font-size:22px;color:#111;margin:8px 0;"><strong>${rangeLine(estimate)}</strong></p>
    <h3 style="color:#111;margin-bottom:2px;">What you told us</h3>
    ${selectionsList(input)}
    <p style="font-size:13px;color:#444;">Scheduling: ${escapeHtml(`${urgency.label}, ${urgency.sub.toLowerCase()}`)}. City: ${escapeHtml(lead.city)}.</p>
    <p style="font-size:13px;color:#444;">${escapeHtml(MATERIALS_COST_NOTE)}</p>
    <p style="font-size:13px;color:#444;">${escapeHtml(HANDYMAN_RATE_DISCLAIMER)} We will follow up to confirm the scope and lock in your time.</p>
    <p style="font-size:13px;color:#444;">Want it on the calendar sooner? Call or text ${escapeHtml(SITE_CONFIG.phone)}.</p>
  </div>`;
}
