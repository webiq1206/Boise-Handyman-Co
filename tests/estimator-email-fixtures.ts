/**
 * Stored estimate records for Boise Handyman Co email renders.
 * Ranges are fixtures. Nothing here prices a job.
 */
import {estimateEmail} from "../lib/p5/estimateEmail.ts";
import {ESTIMATE_DISCLAIMER, valueTier, type ValueTier} from "../lib/p5/emailKit.ts";

export type EmailFixture = {
  id: string;
  service: "handyman" | "re10" | "change-order" | "rush";
  tier: ValueTier | "withheld";
  low: number | null;
  high: number | null;
  name: string;
  email: string;
  phone: string;
  summary: string;
  task: string;
  uploads: {name: string; url?: string}[];
};

const INTERNAL = {directCost: 111111, contractPrice: 222222, operatingProfit: 33333, publishable: true, lines: [] as const};

export const EMAIL_FIXTURES: EmailFixture[] = [
  {id: "handyman-small", service: "handyman", tier: "small", low: 240, high: 860, name: "Ada Cole", email: "ada.cole@example.com", phone: "2085550142", summary: "Hang three shelves and patch two nail holes.", task: "Hang three shelves", uploads: []},
  {id: "re10-mid", service: "re10", tier: "standard", low: 14000, high: 22000, name: "Jonah Hale", email: "jonah.hale@example.com", phone: "", summary: "RE-10 repair list for a Meridian listing: drywall, paint, and a sticking door.", task: "Patch and paint listed walls", uploads: []},
  {id: "change-order-major", service: "change-order", tier: "major", low: 82000, high: 96000, name: "Nia Brooks", email: "nia.brooks@example.com", phone: "2085550177", summary: "Change order for a whole-house punch list already under way.", task: "Complete the remaining punch list", uploads: []},
  {id: "handyman-uploads", service: "handyman", tier: "small", low: 900, high: 2400, name: "Ruth Nguyen", email: "ruth.nguyen@example.com", phone: "2085550188", summary: "Mount a television and assemble two bookcases. Photos attached.", task: "Mount a television", uploads: [{name: "tv-wall.jpg", url: "https://files.example.com/tv-wall.jpg"}, {name: "bookcase.jpg", url: "https://files.example.com/bookcase.jpg"}]},
  {id: "rush-withheld", service: "rush", tier: "withheld", low: null, high: null, name: "Lila Moss", email: "lila.moss@example.com", phone: "2085550190", summary: "Priority visit for a leak under the kitchen sink. Price withheld until someone sees it.", task: "Look at the leak", uploads: []},
];

function money(amount: number): string {
  return new Intl.NumberFormat("en-US", {style: "currency", currency: "USD", maximumFractionDigits: 0}).format(Math.round(amount));
}

export function storedRange(fixture: EmailFixture): string {
  if (fixture.low == null || fixture.high == null) return "";
  if (fixture.low === fixture.high) return money(fixture.low);
  return `${money(fixture.low)} to ${money(fixture.high)}`;
}

export function recordFor(fixture: EmailFixture) {
  const priced = fixture.low != null && fixture.high != null;
  const customer = {
    summary: fixture.summary,
    includedCategories: ["General"],
    range: priced ? {low: fixture.low, high: fixture.high} : null,
    lineItems: priced ? [{id: "a", category: "General", description: fixture.task, quantity: 1, unit: "LS", low: fixture.low, high: fixture.high, unitLow: fixture.low, unitHigh: fixture.high}] : [],
    categoryRanges: priced ? [{category: "General", low: fixture.low, high: fixture.high}] : [],
    assumptions: [],
    exclusions: ["Permits"],
    allowances: [],
    factors: [],
    message: "Review your estimate.",
    nextStep: "Consultation",
    disclaimer: "Preliminary only.",
    status: priced ? "complete" : "review-required",
  };
  return {
    customer,
    contact: {name: fixture.name, email: fixture.email, phone: fixture.phone},
    scope: {text: fixture.summary, answers: {service: fixture.service, location: "Meridian, ID"}, uploads: fixture.uploads},
    uploads: fixture.uploads,
    internal: {...INTERNAL, publishable: priced, service: fixture.service},
  };
}

export function renderFixture(fixture: EmailFixture) {
  const id = `00000000-0000-4000-8000-${fixture.id.replace(/[^a-z0-9]/g, "").padEnd(12, "0").slice(0, 12)}`;
  const record = recordFor(fixture);
  return {
    fixture,
    range: storedRange(fixture),
    tier: fixture.tier === "withheld" ? "withheld" : valueTier(fixture.high),
    admin: estimateEmail(id, record, true),
    customer: estimateEmail(id, record, false),
  };
}

export {ESTIMATE_DISCLAIMER};
