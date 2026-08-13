interface SeasonWindow {
  startMonth: number;
  startDay: number;
  endMonth: number;
  endDay: number;
}

interface ServiceSeasonConfig {
  seasons: SeasonWindow[];
  nearSeasonBufferDays: number;
  isRecurringEligible: boolean;
  maxFrequency: "weekly" | "bi-weekly" | "monthly" | null;
  recurringLeadPrice?: number;
}

/**
 * Handyman seasonality in the Treasure Valley:
 * - Interior work (drywall, plumbing, electrical, carpentry, mounting) runs
 *   year-round; winter is actually the natural season for interior lists.
 * - Caulking and weatherproofing runs year-round but peaks in early fall,
 *   before the first hard freeze.
 * - Fence, deck, and gutter work is genuinely seasonal: concrete post-setting
 *   and exterior sealants want temperatures above roughly 40 degrees, and
 *   gutter cleaning clusters in late fall. That service carries a Mar-Nov
 *   window with a spring buffer so it surfaces as "coming into season".
 * - Painting includes interior work, so it stays year-round even though
 *   exterior touch-ups cluster May-Oct.
 * None are recurring by nature (no weekly/monthly subscription work).
 */
const YEAR_ROUND: ServiceSeasonConfig = {
  seasons: [{ startMonth: 1, startDay: 1, endMonth: 12, endDay: 31 }],
  nearSeasonBufferDays: 0,
  isRecurringEligible: false,
  maxFrequency: null,
};

const EXTERIOR_SEASON: ServiceSeasonConfig = {
  seasons: [{ startMonth: 3, startDay: 1, endMonth: 11, endDay: 30 }],
  nearSeasonBufferDays: 21,
  isRecurringEligible: false,
  maxFrequency: null,
};

const SERVICE_SEASON_CONFIG: Record<string, ServiceSeasonConfig> = {
  "drywall-repair": YEAR_ROUND,
  "painting-touch-ups": YEAR_ROUND,
  "plumbing-repairs": YEAR_ROUND,
  "electrical-repairs": YEAR_ROUND,
  "carpentry-trim-repair": YEAR_ROUND,
  "mounting-assembly": YEAR_ROUND,
  "fence-deck-gutter-repair": EXTERIOR_SEASON,
  "home-maintenance": YEAR_ROUND,
};

function dateToYearDay(month: number, day: number): number {
  const daysInMonth = [0, 31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  let total = 0;
  for (let m = 1; m < month; m++) {
    total += daysInMonth[m];
  }
  return total + day;
}

function isDateInWindow(month: number, day: number, window: SeasonWindow): boolean {
  const current = dateToYearDay(month, day);
  const start = dateToYearDay(window.startMonth, window.startDay);
  const end = dateToYearDay(window.endMonth, window.endDay);

  if (start <= end) {
    return current >= start && current <= end;
  }
  return current >= start || current <= end;
}

function subtractDays(month: number, day: number, daysToSubtract: number): { month: number; day: number } {
  const date = new Date(2024, month - 1, day);
  date.setDate(date.getDate() - daysToSubtract);
  return { month: date.getMonth() + 1, day: date.getDate() };
}

export function isServiceInSeason(serviceId: string, date?: Date): boolean {
  const config = SERVICE_SEASON_CONFIG[serviceId];
  if (!config) return true;

  const now = date || new Date();
  const month = now.getMonth() + 1;
  const day = now.getDate();

  for (const window of config.seasons) {
    if (isDateInWindow(month, day, window)) return true;

    if (config.nearSeasonBufferDays > 0) {
      const bufferStart = subtractDays(window.startMonth, window.startDay, config.nearSeasonBufferDays);
      const bufferWindow: SeasonWindow = {
        startMonth: bufferStart.month,
        startDay: bufferStart.day,
        endMonth: window.startMonth,
        endDay: window.startDay,
      };
      if (isDateInWindow(month, day, bufferWindow)) return true;
    }
  }

  return false;
}

export function getAvailableServices(date?: Date): string[] {
  return Object.keys(SERVICE_SEASON_CONFIG).filter(id => isServiceInSeason(id, date));
}

export function getServiceSeasonLabel(serviceId: string): string | null {
  const config = SERVICE_SEASON_CONFIG[serviceId];
  if (!config) return null;

  const monthNames = ["", "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

  if (config.seasons.length === 1) {
    const s = config.seasons[0];
    if (s.startMonth === 1 && s.startDay === 1 && s.endMonth === 12 && s.endDay === 31) {
      return null;
    }
    return `${monthNames[s.startMonth]} - ${monthNames[s.endMonth]}`;
  }

  return config.seasons
    .map(s => `${monthNames[s.startMonth]} - ${monthNames[s.endMonth]}`)
    .join(", ");
}

export function getRecurringEligibleServices(): Set<string> {
  const result = new Set<string>();
  for (const [id, config] of Object.entries(SERVICE_SEASON_CONFIG)) {
    if (config.isRecurringEligible) {
      result.add(id);
    }
  }
  return result;
}

export function getRecurringLeadPrices(): Record<string, number> {
  const result: Record<string, number> = {};
  for (const [id, config] of Object.entries(SERVICE_SEASON_CONFIG)) {
    if (config.isRecurringEligible && config.recurringLeadPrice) {
      result[id] = config.recurringLeadPrice;
    }
  }
  return result;
}

export function getMaxFrequencyForServices(serviceIds: string[]): "weekly" | "bi-weekly" | "monthly" | null {
  let best: "weekly" | "bi-weekly" | "monthly" | null = null;
  const rank = { weekly: 3, "bi-weekly": 2, monthly: 1 };

  for (const id of serviceIds) {
    const config = SERVICE_SEASON_CONFIG[id];
    if (config?.maxFrequency) {
      const current = rank[config.maxFrequency] || 0;
      const bestRank = best ? rank[best] || 0 : 0;
      if (current > bestRank) {
        best = config.maxFrequency;
      }
    }
  }

  return best;
}

export function hasAnyRecurringService(serviceIds: string[]): boolean {
  const eligible = getRecurringEligibleServices();
  return serviceIds.some(id => eligible.has(id));
}

export function getServiceMaxFrequency(serviceId: string): "weekly" | "bi-weekly" | "monthly" | null {
  const config = SERVICE_SEASON_CONFIG[serviceId];
  return config?.maxFrequency || null;
}

export function getServiceDefaultFrequency(serviceId: string): string {
  const config = SERVICE_SEASON_CONFIG[serviceId];
  if (!config?.isRecurringEligible) return "one-time";
  if (config.maxFrequency === "weekly") return "bi-weekly";
  if (config.maxFrequency === "monthly") return "monthly";
  return "one-time";
}

export { SERVICE_SEASON_CONFIG };
export type { ServiceSeasonConfig, SeasonWindow };
