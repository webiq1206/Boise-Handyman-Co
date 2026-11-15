/** Public homepage choices and customer ranges. No pricing inputs belong here. */
export type HandymanPlanningRange = {low: number; high: number};
export type HandymanPlanningTask = {id: string; label: string; description?: string; range: HandymanPlanningRange | null};
export type HandymanPlanningCategory = {id: string; label: string; description?: string; tasks: HandymanPlanningTask[]};
export type HandymanPlanningData = {version: 1; categories: HandymanPlanningCategory[]};

const currency = new Intl.NumberFormat("en-US", {style: "currency", currency: "USD", maximumFractionDigits: 0});
export function formatPublicHandymanRange(range: HandymanPlanningRange): string {
  return `${currency.format(range.low)} to ${currency.format(range.high)}`;
}
