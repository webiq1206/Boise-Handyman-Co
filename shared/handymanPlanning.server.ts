import "server-only";
import {calculateHandymanEstimate, JOB_CATEGORY_LABELS, TASK_CATALOG} from "./estimateEngine.ts";
import {handymanPriceContext} from "./handymanCustomerPrice.ts";
import type {HandymanPlanningData} from "./handymanPlanning.ts";

const CATEGORIES = ["drywall-repair", "painting-touch-ups", "plumbing-repairs", "electrical-repairs", "mounting-assembly", "carpentry-trim-repair"] as const;

/** Price the existing fixed one-task example on the server; publish only its customer range. */
export function getHandymanPlanningData(now = new Date()): HandymanPlanningData {
  const context = handymanPriceContext(now);
  return {
    version: 1,
    categories: CATEGORIES.map(id => ({
      id,
      label: JOB_CATEGORY_LABELS[id].label,
      description: JOB_CATEGORY_LABELS[id].sub,
      tasks: TASK_CATALOG[id].slice(0, 4).map(task => {
        const result = calculateHandymanEstimate({category: id, tasks: [{taskId: task.id, quantity: 1}], materials: "customer", urgency: "standard"}, context);
        return {
          id: task.id,
          label: task.label,
          ...(task.sub ? {description: task.sub} : {}),
          range: result ? {low: result.priceLow, high: result.priceHigh} : null,
        };
      }),
    })),
  };
}
