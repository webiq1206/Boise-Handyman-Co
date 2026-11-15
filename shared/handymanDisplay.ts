/** Display-only helpers and existing qualifications. Safe for browser consumers. */
export function formatHandymanCurrency(value: number): string {
  return `$${Math.round(value).toLocaleString("en-US")}`;
}
export function formatHours(hours: number): string {
  const rounded = Math.round(hours * 4) / 4;
  return rounded === 1 ? "1 hr" : `${rounded} hrs`;
}
export function formatHandymanRange(estimate: {priceLow: number; priceHigh: number}): string {
  const low = formatHandymanCurrency(estimate.priceLow), high = formatHandymanCurrency(estimate.priceHigh);
  return low === high ? low : `${low} to ${high}`;
}
export const HANDYMAN_RATE_DISCLAIMER = "Planning guidance from the cost book, not a price. Each job is priced case by case after we review the scope, with a written price before any work begins.";
export const MATERIALS_COST_NOTE = "This figure covers the cost book lines for your selected tasks. Materials the line does not include are billed at cost with your receipt.";
export const OVERSIZED_JOB_NOTE = "That is a bigger visit than we usually book online. Send it through anyway and we will call to scope it properly, or split it across visits.";
