/**
 * The only dollar lookup for the homepage handyman calculator.
 * Amounts come from sharedBookRate, which reads lib/p5/priceBookData.ts.
 * Do not import this module from a client component: priceBook.ts hashes the
 * book with node:crypto at load.
 */
import { sharedBookRate } from "../lib/p5/priceBook.ts";
import {
  OTHER_JOB_SIZES,
  SUPPLY_RUN_CODE,
  TASK_CATALOG,
  type HandymanBookRates,
} from "./estimateEngine.ts";

export function handymanBookRates(): HandymanBookRates {
  const codes = new Set<string>([SUPPLY_RUN_CODE]);
  for (const tasks of Object.values(TASK_CATALOG)) {
    for (const task of tasks) if (task.bookCode) codes.add(task.bookCode);
  }
  for (const size of Object.values(OTHER_JOB_SIZES)) if (size.bookCode) codes.add(size.bookCode);

  const rates: Record<string, number> = {};
  for (const code of codes) {
    const rate = sharedBookRate(code, "mid", false);
    if (!rate) throw new Error(`Cost book has no unit price for ${code}`);
    rates[code] = rate.amount;
  }
  return rates;
}
