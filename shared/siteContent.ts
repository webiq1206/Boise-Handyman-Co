import {
  ShieldCheck,
  MessageSquare,
  CalendarClock,
  Wallet,
  Hammer,
  HeartHandshake,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

export const SITE_TAGLINE = "Treasure Valley handyman service, built on upfront quotes and tidy work";

export const HERO_EYEBROW = "Boise Handyman · Treasure Valley";

// The hero subhead doubles as the homepage's extractable answer block: what we
// do, where, and how pricing works, in one readable sentence pair. Pricing
// figures are placeholders: [NEEDS: real pricing confirmation].
export const HERO_SUBHEAD =
  "Boise Handyman Co handles small repairs, installs, and maintenance for homes in Boise, Meridian, Eagle, Nampa, and the rest of the Treasure Valley. One upfront written quote before any work starts, and most jobs finished in a single visit.";

export const HERO_STATS = [
  { num: "60 sec", label: "Instant online estimate" },
  { num: "Upfront", label: "Quote before work starts" },
  { num: "1 trip", label: "Most jobs done in one visit" },
] as const;

export const DIFFERENTIATORS_HEADLINE = "Built for people whose small jobs keep getting ignored";

export const DIFFERENTIATORS_INTRO =
  "Most people we meet have the same story: contractors who never called back because the job was too small, a vague quote that grew once the work started, or a fix that needed a second and third visit. We built our process around the opposite. Small jobs taken seriously, an upfront quote before any work starts, and one person who shows up with the right materials to finish in a single trip.";

export interface Differentiator {
  title: string;
  body: string;
  contrast: string;
}

/** Top differentiators for homepage; full list on About. */
export const HOMEPAGE_DIFFERENTIATOR_INDICES = [0, 1, 2, 3, 4] as const;

export const DIFFERENTIATORS: Differentiator[] = [
  {
    title: "An upfront quote before any work starts",
    contrast: "Instead of a vague ballpark that quietly grows once the tools come out,",
    body: "you get a written quote before we start: one clear price for the work and what the job should take. If we open something up and find more than expected, we stop and talk to you before the price changes.",
  },
  {
    title: "Small jobs treated as real jobs",
    contrast: "Rather than being told your repair is too small to bother with,",
    body: "small jobs are the whole business. A sticking door, a leaking faucet, a drywall patch, a wobbly fence panel: these are the jobs we schedule, show up for on time, and finish properly.",
  },
  {
    title: "One trip whenever the job allows it",
    contrast: "Instead of a look-around visit, a parts visit, and a someday follow-up,",
    body: "we ask the right questions and request photos up front, so we arrive with the materials and hardware the job actually needs. Most repairs and installs are finished the first time we visit.",
  },
  {
    title: "One person accountable for the fix",
    contrast: "Rather than a call center, a dispatcher, and a rotating cast of strangers,",
    body: "you deal with the same local team from the first message to the finished job. The person who quoted the work is accountable for how it turns out.",
  },
  {
    title: "A tidy home when we leave",
    contrast: "Rather than dust on the floor and packaging left by the bins,",
    body: "we protect the work area, clean up after ourselves, and haul away the small debris a job creates. You should only be able to tell we were there by the thing that now works.",
  },
  {
    title: "Honest advice about what the job needs",
    contrast: "Instead of upselling a bigger project than you asked for,",
    body: "we tell you plainly when a cheap part fixes it, when a replacement beats a repair, and when a job is beyond handyman scope and belongs with a licensed specialty contractor. If we are not the right fit, we say so and point you to someone who is.",
  },
  {
    title: "Clear scope for licensed trade work",
    contrast: "Rather than quietly taking on work that should go to a specialist,",
    body: "we stick to minor plumbing, minor electrical, and small repairs. Panel work, repipes, gas lines, HVAC, roofing, and structural changes get referred to licensed specialty contractors we trust.",
  },
  {
    title: "Scheduling that respects your day",
    contrast: "Instead of a four-hour window that turns into a no-show,",
    body: "we agree a time, confirm before we head out, and let you know if anything shifts. Your time is part of the job.",
  },
  {
    title: "Materials handled the way you prefer",
    contrast: "Rather than surprise markups on parts you never saw,",
    body: "you can supply your own materials or have us pick them up on the way. When we supply parts, they appear on the quote as their own line, not folded into a mystery number.",
  },
  {
    title: "We stand behind the work",
    contrast: "Beyond a quick fix and a fast exit,",
    body: "if something we repaired or installed fails because of our workmanship, tell us and we come back to make it right. That is how repeat customers happen, and repeat customers are the business.",
  },
];

/**
 * Headline credibility stats. Owner-provided facts about the business - keep
 * these accurate and update in one place.
 *
 * `established` is intentionally blank: the previous "2020" figure belonged to
 * the prior construction business, and publishing it for Boise Handyman Co
 * would fabricate a years-in-business claim. [NEEDS: real founding year]
 */
export const PROOF_STATS = {
  established: "",
} as const;

/**
 * Post-hero proof bar. Only claims the business genuinely carries: no bonded
 * or insured claims, review counts, ratings, or job counters until real ones
 * are confirmed for the handyman entity. Keep at six entries so the strip
 * fills the six-column desktop grid in HeroSection.
 */
export const TRUST_ITEMS = [
  "Locally Owned",
  "Upfront Quotes",
  "Hourly + Trip Fee Pricing",
  "One-Trip Fixes",
  "Tidy Job Sites",
  "Ada & Canyon County",
];

export const PROMISE_ITEMS = [
  {
    num: "01",
    title: "A quote you can actually read",
    body: "An upfront quote before work starts: one clear price for the work, with any materials as their own line, so you know what the job costs before we touch a tool.",
  },
  {
    num: "02",
    title: "Communication without chasing",
    body: "We reply within one business day, confirm before we head out, and tell you immediately if a job turns out bigger than quoted.",
  },
  {
    num: "03",
    title: "A schedule you can plan around",
    body: "An agreed arrival time, not a half-day window. If anything shifts, you hear it from us before it happens.",
  },
  {
    num: "04",
    title: "Work we stand behind",
    body: "If a repair or install fails because of our workmanship, we come back and make it right.",
  },
];

export interface ClientPriority {
  title: string;
  body: string;
  icon: LucideIcon;
}

export const CLIENT_PRIORITIES: ClientPriority[] = [
  {
    title: "Trust in your home",
    body: "A local team you can identify by name, an agreed arrival time, and respect for your home while we work in it.",
    icon: ShieldCheck,
  },
  {
    title: "Quality workmanship",
    body: "Proper anchors, level lines, clean caulk beads, and paint that blends. Small jobs done the careful way.",
    icon: Hammer,
  },
  {
    title: "Clear communication",
    body: "Replies within one business day, a confirmation before we arrive, and a heads-up the moment anything changes.",
    icon: MessageSquare,
  },
  {
    title: "Honest pricing",
    body: "One written price, quoted upfront before work starts. Materials listed as their own line, never a hidden markup.",
    icon: Wallet,
  },
  {
    title: "Your time respected",
    body: "One scheduled visit with the right parts on the truck, instead of three visits and a month of waiting.",
    icon: CalendarClock,
  },
  {
    title: "No pressure, ever",
    body: "We quote the job you asked about. If it is beyond handyman scope, we say so and refer you to a specialist.",
    icon: HeartHandshake,
  },
];

export const HOW_WE_BUILD_STEPS = [
  {
    number: "01",
    title: "Tell us what needs doing",
    desc: "Call, text, or send the form with your task list. Photos help us quote accurately and arrive with the right materials.",
  },
  {
    number: "02",
    title: "Get an upfront quote",
    desc: "We reply within one business day with a clear quote: one written price and the expected time. No surprises, no obligation.",
  },
  {
    number: "03",
    title: "Pick a time that works",
    desc: "We agree an arrival time, not a half-day window, and confirm before we head out.",
  },
  {
    number: "04",
    title: "One-trip fix",
    desc: "We show up with the parts the job needs and work through your list. Most repairs and installs are finished in a single visit.",
  },
  {
    number: "05",
    title: "Walkthrough and cleanup",
    desc: "We walk the finished work with you, clean up the area, and haul away the small debris. If our workmanship ever lets you down, we come back and make it right.",
  },
];

export const PRINCIPLES = [
  {
    title: "Quote first, work second",
    desc: "Every job starts with an upfront quote. If the scope grows once we open something up, we stop and talk before the price changes.",
  },
  {
    title: "Small jobs get real respect",
    desc: "A one-hour fix gets the same scheduling, the same care, and the same cleanup as a full-day list.",
  },
  {
    title: "Know the limits of the trade",
    desc: "Minor plumbing and electrical, yes. Panels, repipes, gas, HVAC, roofing, and structural work go to licensed specialists, every time.",
  },
  {
    title: "Leave it tidy",
    desc: "Drop cloths down, dust contained, packaging hauled away. The only evidence we were there should be the thing that now works.",
  },
  {
    title: "One accountable person",
    desc: "The person who quotes your job is accountable for how it turns out. You always know who to call.",
  },
  {
    title: "Stand behind the work",
    desc: "If a repair or install fails because of our workmanship, we come back and fix it. Simple as that.",
  },
];

export const STANDARD_INCLUSIONS = [
  "An upfront quote before any work starts",
  "One written price for the whole visit",
  "Materials listed as their own line on the quote",
  "An agreed arrival time, confirmed beforehand",
  "Cleanup and small-debris haul-away",
  "Workmanship we stand behind",
];

export const OPTIONAL_ENHANCEMENTS = {
  title: "Add to the list while we are there",
  body: "Extra tasks in the same visit only add the time they take. Many customers keep a running punch list, the loose handle, the slow drain, the picture that never got hung, and clear the whole thing in one appointment.",
  note: "Mention your extra tasks when you book so we bring the right materials.",
};

export const BUDGET_GUIDANCE_POINTS = [
  {
    title: "A range first, then a firm quote",
    body: "The online estimator gives you an instant planning range for your kind of job. Once we see photos or the task itself, that range becomes a firm upfront quote you approve before work starts.",
  },
  {
    title: "Priced by the time the job takes",
    body: "Your quote reflects the time the work takes, with a one-hour minimum per visit. Book several tasks in one visit and each extra task only adds its own time, which is why a list is the best value.",
  },
  {
    title: "Materials as their own line",
    body: "Parts and materials appear on the quote separately, at what they cost. You are welcome to supply your own, or we pick them up on the way for the time it takes.",
  },
  {
    title: "Changes agreed before they happen",
    body: "If we open a wall and find more than expected, we stop, show you, and agree a revised price before continuing. Nothing extra happens on a handshake.",
  },
];

export const LEADERSHIP_COPY = {
  label: "Our commitment",
  headline: "Getting small things fixed should be easy.",
  paragraphs: [
    "Boise Handyman Co was built on a simple observation: Treasure Valley homeowners can find someone to build a house or gut a kitchen, but getting a door adjusted, a faucet replaced, or a fence panel fixed means calls that never get returned.",
    "We know how that feels, and we know why it happens. Small jobs do not fit the way big contractors price and schedule, so those jobs get ignored or quoted absurdly.",
    "So we built a company around them instead. One written price before work starts, one scheduled visit with the right materials, and a clean home when we leave.",
  ],
  closing: "That is not a slogan. It is how we would want the job handled if the house were ours.",
};

export const FINANCING_BULLETS = [
  "Card, check, and electronic payments accepted",
  "Pay when the work is done, not before",
  "One visit covers the whole list, however many tasks",
  "Written quote to keep, whatever you decide",
  "No deposits on standard small jobs",
];

export const CONSULT_BULLETS = [
  "Nobody here works on commission",
  "No pressure and no obligation to book",
  "An upfront quote that is yours to keep",
  "We reply within one business day",
];

/**
 * Full-bleed cinematic statement band on the homepage - a photographic
 * "breather" that breaks the run of text sections below the estimator.
 * `accentWord` renders as the ochre Libre Baskerville italic accent (keep it to one word).
 */
export const STATEMENT_BAND = {
  eyebrow: "The standard we work to",
  statement: "No job is too small to be done",
  accentWord: "right",
  support:
    "One person owns the fix, the price is agreed before the toolbox opens, and the room is left cleaner than we found it - whether the job took forty minutes or all afternoon.",
} as const;

/**
 * "Where your money goes" positioning: a lean local operation without the
 * overhead of a franchise or a big contracting firm. Flagship homepage band
 * placed just before the estimator so it frames the pricing conversation.
 * Editorial voice, confident (not a "what you're not paying for" list).
 */
export const VALUE_MODEL = {
  eyebrow: "Where your money goes",
  headlineA: "Pay for the fix,",
  headlineB: "not the",
  accentWord: "overhead",
  costs: "A franchise fee. A call center in another state. Wrapped trucks and a dispatcher who has never held a drill.",
  costsBody: "None of it is free. It gets folded into a minimum charge and an inflated hourly rate, whether your job needed any of it or not.",
  reframe:
    "We built the company to leave that out. A small local operation keeps our costs low, so what you pay goes into the time and materials your repair actually takes - one fair written price and nothing padding the invoice.",
  taglineLead: "Fair rates,",
  taglineAccent: "honest invoices",
} as const;
