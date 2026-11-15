/**
 * Plain numbers the homepage calculator needs from the shared pricing engine.
 *
 * The markup itself is lib/p5/pricing.ts (companyAllocation, SERVICE_MATRIX,
 * priceFromRiskAdjustedCost). This module only reads those results and the
 * cost book. It does not contain a markup factor of its own.
 *
 * Server only: the price book uses node:crypto.
 */
import { PRICE_BOOK } from "../lib/p5/priceBookData.ts";
import { DEFAULT_FINANCE, SERVICE_MATRIX, companyAllocation } from "../lib/p5/pricing.ts";
import { OTHER_JOB_SIZES, SUPPLY_RUN_CODE, TASK_CATALOG, type HandymanPriceContext } from "./estimateEngine.ts";

const MINIMUM_CODE = "01-01-07";
const RUSH_CODE = "01-01-15";
const EMERGENCY_CODE = "01-01-09";

function bookRow(code: string) {
  const row = PRICE_BOOK.find((entry) => entry[0] === code);
  if (!row) throw new Error(`Cost book is missing ${code}`);
  return row;
}

/** Direct unit amount at Signature, or the Signature percentage for a percentage line. */
function bookAmount(code: string): number {
  const row = bookRow(code);
  const amount = row[11];
  if (!Number.isFinite(amount) || amount <= 0) throw new Error(`Cost book line ${code} has no Signature amount`);
  return amount;
}

/**
 * Quote-class band from the estimator (rangeWidth in app/lib/estimator/narrative.ts).
 * This calculator has no address yet, so the engine's jurisdiction risk applies:
 * 5% plus 1% for that risk, never over 8%.
 */
function quoteRangeWidth(): number {
  const jurisdictionRisk = 1;
  return Math.min(0.08, 0.05 + jurisdictionRisk * 0.01);
}

export function handymanPriceContext(now = new Date()): HandymanPriceContext {
  const allocation = companyAllocation(DEFAULT_FINANCE, now);
  const matrix = SERVICE_MATRIX.handyman;
  const direct: Record<string, number> = {};
  const division: Record<string, string> = {};
  const codes = new Set<string>([MINIMUM_CODE, SUPPLY_RUN_CODE]);
  for (const tasks of Object.values(TASK_CATALOG)) {
    for (const task of tasks) if (task.bookCode) codes.add(task.bookCode);
  }
  for (const size of Object.values(OTHER_JOB_SIZES)) if (size.bookCode) codes.add(size.bookCode);
  for (const code of codes) {
    direct[code] = bookAmount(code);
    division[code] = code.slice(0, 2);
  }
  return {
    overhead: allocation.overhead,
    profit: matrix.target,
    contingency: matrix.contingency[0],
    rangeWidth: quoteRangeWidth(),
    minimumCode: MINIMUM_CODE,
    minimumDirect: direct[MINIMUM_CODE],
    rushCode: RUSH_CODE,
    rushRate: bookAmount(RUSH_CODE),
    emergencyCode: EMERGENCY_CODE,
    emergencyRate: bookAmount(EMERGENCY_CODE),
    direct,
    division,
  };
}
