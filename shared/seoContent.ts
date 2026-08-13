import type { ServiceData, CityData } from './contentData';
import { getCountyLabel } from './contentData';
import type { LandingSection } from '@/components/seo/LandingPageTemplate';

export interface FAQItem {
  question: string;
  answer: string;
}

/** Minimal shape of a CITY_SEO_DATA entry needed to build local sections. */
export interface CitySeoFacts {
  neighborhoods: string[];
  landmarks: string[];
  climate: string;
  population?: string;
}

export interface ServiceSEOContent {
  slug: string;
  name: string;
  headline: string;
  primaryKeyword: string;
  overview: string;
  benefits: string[];
  inclusions: string[];
  timeline: string;
  processSteps: { title: string; description: string }[];
  faqs: FAQItem[];
  /**
   * Server-rendered cost copy. The estimator's price bands are client-side JS
   * and invisible to crawlers and AI engines; this section puts the pricing
   * model (hourly + trip fee, upfront quotes) in static HTML. All our own
   * dollar figures are placeholders: [NEEDS: real pricing confirmation].
   */
  costGuidance?: { heading: string; paragraphs: string[] };
  /** Examples of jobs this service covers, rendered as a "typical jobs" section. */
  typicalJobs?: string[];
  /**
   * What this service does NOT cover, with the referral note. Rendered as its
   * own section so scope stays honest on every service and city page.
   */
  outOfScope?: { heading: string; paragraphs: string[] };
}

/**
 * Pricing model used across every service below, stated once so pages stay
 * consistent: a flat trip fee of $49 per visit plus $95 per hour of labor,
 * with an upfront quote before any work starts. Market context: Treasure
 * Valley handyman rates typically run $60 to $120 per hour. Our own figures
 * (trip fee, hourly rate, and every "from" price) are PLACEHOLDERS pending
 * owner confirmation: [NEEDS: real pricing confirmation].
 */
export const SERVICE_SEO_CONTENT: Record<string, ServiceSEOContent> = {
  'drywall-repair': {
    slug: 'drywall-repair',
    name: 'Drywall Repair & Patching',
    headline: 'Drywall Repair and Patching in Boise and the Treasure Valley',
    primaryKeyword: 'drywall repair boise',
    overview:
      'Boise Handyman Co patches holes, cracks, and water-damaged drywall for homes across the Treasure Valley, then blends the texture and paint so the repair disappears. You get an upfront quote based on the size and number of patches, and most repairs are finished across one or two short visits.',
    benefits: [
      'Texture matched to your wall, not a flat shiny square',
      'Upfront quote from photos before we ever visit',
      'Dust contained with plastic and drop cloths, then cleaned up',
      'One team handles the patch, the texture, and the paint blend',
    ],
    inclusions: [
      'Holes and dents from doorknobs, furniture, or wall anchors',
      'Stress cracks at corners, seams, and above doorways',
      'Water-stained ceiling and wall patches after the leak is fixed',
      'Popcorn ceiling patching and small-area texture repair',
      'Anchor removal, hole filling, and wall prep before painting',
      'Priming and paint blending over the finished patch',
    ],
    timeline:
      'Small patches take 1 to 3 hours of working time. Because joint compound needs to dry between coats, larger repairs are usually split across two short visits a day or two apart, with texture and paint on the second visit.',
    processSteps: [
      {
        title: 'Send photos',
        description: 'A photo of each hole or crack with something for scale lets us quote accurately before we arrive.',
      },
      {
        title: 'Upfront quote',
        description: 'You approve the price, hourly labor plus the trip fee, before any work starts.',
      },
      {
        title: 'Patch and texture',
        description: 'We cut in the patch, tape and mud it, and match your wall texture. Bigger repairs get a second short visit for finish coats.',
      },
      {
        title: 'Blend and clean up',
        description: 'Primer and paint blended over the repair, dust cleaned up, and debris hauled away.',
      },
    ],
    typicalJobs: [
      'a doorknob hole behind a bathroom door',
      'a ceiling stain patch after a roof or plumbing leak was fixed',
      'settling cracks above a door frame',
      'a row of anchor holes after shelves came down',
      'a patch where a wall-mounted TV moved',
    ],
    faqs: [
      {
        question: 'How much does drywall repair cost in Boise?',
        answer:
          'Small drywall repairs with Boise Handyman Co start around $149 per visit, which covers our flat trip fee and the first stretch of labor. Most single patches land between $149 and $350 depending on size and texture matching, and larger water-damage repairs with multiple patches typically run $350 to $650. We quote the exact price upfront from photos before any work starts.',
      },
      {
        question: 'Can you match my wall texture?',
        answer:
          'Yes. Orange peel, knockdown, and most common Treasure Valley textures can be blended so the patch is hard to find once painted. Heavy custom textures take an extra finishing pass, which we include in the quote.',
      },
      {
        question: 'Do you paint the patch too?',
        answer:
          'Yes. We prime every patch and blend paint over it. If you have leftover matching paint, we use it; otherwise we can color-match a sample at the paint store on the way.',
      },
      {
        question: 'Why does drywall repair take two visits?',
        answer:
          'Joint compound has to dry before the next coat, and rushing it leaves a visible bump. Small dents can be done in one visit with fast-setting compound; patches larger than a fist usually get two short visits so the finish is actually flat.',
      },
      {
        question: 'Do you repair the leak that caused the damage?',
        answer:
          'We fix minor plumbing leaks like a failed supply line or a dripping trap as part of the same visit. Roof leaks and anything inside walls that needs a licensed plumber get referred out first, because patching over an active leak just ruins the new drywall.',
      },
    ],
    costGuidance: {
      heading: 'Drywall repair cost in the Treasure Valley',
      paragraphs: [
        'Drywall repair with Boise Handyman Co starts around $149 per visit. That covers a flat $49 trip fee plus labor at $95 per hour, quoted upfront. A typical single patch lands between $149 and $350, and multi-patch or water-damage repairs usually run $350 to $650 including texture matching and paint blending. For context, Treasure Valley handyman rates generally run $60 to $120 per hour.',
        'These are planning figures, not a bid. Send photos of the damage and we reply with a firm upfront quote, usually within one business day, before any work is scheduled.',
      ],
    },
    outOfScope: {
      heading: 'What drywall work we refer out',
      paragraphs: [
        'We handle patches and repairs, not construction. Hanging drywall for new rooms or additions, full ceiling replacements, asbestos-era popcorn removal across whole rooms, and repairs that reveal structural or moisture problems inside the wall belong with a drywall contractor or general contractor. If your job turns out to be one of those, we will tell you plainly and point you to a licensed contractor who does that work well.',
      ],
    },
  },

  'painting-touch-ups': {
    slug: 'painting-touch-ups',
    name: 'Interior & Exterior Painting',
    headline: 'Interior and Exterior Painting in Boise and the Treasure Valley',
    primaryKeyword: 'painting handyman boise',
    overview:
      'Boise Handyman Co paints rooms, trim, doors, and exterior touch-up areas for Treasure Valley homes, with proper prep and clean lines. It is painting at handyman scale: an accent wall, a refreshed bedroom, scuffed trim, a faded front door, or peeling patches caught before they spread. You get an upfront quote and tidy work.',
    benefits: [
      'Real prep: cleaning, sanding, patching, and caulking before paint',
      'Clean cut lines at ceilings, corners, and trim',
      'Upfront quote per room or task, not an open-ended day rate',
      'Furniture and floors protected, and the room put back afterward',
    ],
    inclusions: [
      'Single rooms, accent walls, and touch-up painting',
      'Trim, baseboard, door, and cabinet-front repainting',
      'Front door and shutter refinishing',
      'Small-area exterior touch-ups where paint has peeled or faded',
      'Caulking gaps and filling nail holes before painting',
      'Color matching from a chip or sample',
    ],
    timeline:
      'A single accent wall takes 2 to 3 hours. A standard bedroom, walls only, is typically 3 to 5 hours. A front door refinish runs 2 to 4 hours across coats. We quote the expected time upfront with the price.',
    processSteps: [
      {
        title: 'Describe the space',
        description: 'Room sizes, surfaces, and photos let us quote the job and the paint quantity accurately.',
      },
      {
        title: 'Upfront quote',
        description: 'A firm price for labor, the trip fee, and materials, with paint either supplied by you or picked up by us.',
      },
      {
        title: 'Prep and protect',
        description: 'Floors and furniture covered, holes filled, gaps caulked, surfaces sanded and cleaned.',
      },
      {
        title: 'Paint and reset',
        description: 'Coats applied with clean lines, then the room put back and the tape, trays, and debris hauled away.',
      },
    ],
    typicalJobs: [
      'repainting a bedroom before it becomes a nursery',
      'an accent wall behind the bed or media unit',
      'scuffed baseboards and door casings through a hallway',
      'a faded front door brought back to life',
      'peeling exterior trim spot-primed and repainted before winter',
    ],
    faqs: [
      {
        question: 'How much does it cost to paint a room in Boise?',
        answer:
          'Painting jobs with Boise Handyman Co start around $199 per visit. A typical bedroom, walls only with paint supplied, usually lands between $250 and $450 in labor, and trim or door repaints are quoted per piece. That reflects our flat trip fee plus hourly labor, quoted upfront. Whole-house repaints are better suited to a dedicated painting contractor, and we will say so.',
      },
      {
        question: 'Do I supply the paint or do you?',
        answer:
          'Either works. Many customers pick their color and have the paint ready when we arrive. If you prefer, we collect it on the way and it appears on the invoice at store cost plus the pickup time.',
      },
      {
        question: 'Can you match my existing wall color?',
        answer:
          'Yes. A chip the size of a coin is enough for the paint store to scan an accurate match, and we can take the sample and handle the matching for you.',
      },
      {
        question: 'Do you paint exteriors?',
        answer:
          'We do exterior touch-ups: peeling fascia sections, faded doors, railing and shutter repaints, and small siding areas, weather permitting. Full exterior repaints need spray rigs and crews, so we refer those to painting contractors.',
      },
      {
        question: 'When is the best time for exterior painting in the Treasure Valley?',
        answer:
          'Late spring through early fall. Exterior paint wants dry surfaces and temperatures reliably above about 50 degrees, so we schedule exterior touch-ups between roughly May and October and handle interior painting year-round.',
      },
    ],
    costGuidance: {
      heading: 'Painting cost in the Treasure Valley',
      paragraphs: [
        'Painting with Boise Handyman Co starts around $199 per visit, which covers a flat $49 trip fee plus labor at $95 per hour, quoted upfront. A typical single room, walls only, lands between $250 and $450 in labor with paint billed separately or supplied by you. Treasure Valley handyman rates for this kind of work generally run $60 to $120 per hour.',
        'These are planning figures, not a bid. Tell us the rooms and surfaces, send a photo or two, and we reply with a firm upfront quote before anything is scheduled.',
      ],
    },
    outOfScope: {
      heading: 'What painting work we refer out',
      paragraphs: [
        'Whole-house interior repaints, full exterior repaints, two-story exterior work needing staging, and cabinet refinishing with sprayed factory finishes are jobs for a dedicated painting contractor. We are honest about that line: if your project is bigger than a handyman visit does well, we will say so and refer you to a painter we trust.',
      ],
    },
  },

  'plumbing-repairs': {
    slug: 'plumbing-repairs',
    name: 'Minor Plumbing Repairs',
    headline: 'Minor Plumbing Repairs in Boise and the Treasure Valley',
    primaryKeyword: 'minor plumbing repair boise',
    overview:
      'Boise Handyman Co fixes the everyday plumbing problems that do not need a plumbing company: dripping faucets, running toilets, slow drains, failed garbage disposals, and worn supply lines. Fixture swaps and repairs are quoted upfront and usually finished in a single visit.',
    benefits: [
      'Most fixture repairs and swaps done in one visit',
      'Upfront quote before we touch a fitting',
      'We bring common washers, valves, and supply lines on the truck',
      'Straight advice on repair versus replace, with no upsell',
    ],
    inclusions: [
      'Faucet repair and replacement in kitchens and bathrooms',
      'Toilet repairs: fill valves, flappers, seals, and full swaps',
      'Garbage disposal replacement',
      'Slow drains cleared at sinks, tubs, and showers',
      'Supply line, shutoff valve, and P-trap replacement',
      'Showerhead, sprayer, and drain hardware upgrades',
    ],
    timeline:
      'A running toilet or dripping faucet is typically fixed in about an hour. Faucet and disposal replacements run 1 to 2 hours. A toilet swap takes 1.5 to 2.5 hours including haul-away of the old unit.',
    processSteps: [
      {
        title: 'Describe the problem',
        description: 'A photo of the fixture and a note on the symptom lets us arrive with the right parts.',
      },
      {
        title: 'Upfront quote',
        description: 'A firm price for the fix or the swap, labor plus trip fee, with parts listed separately.',
      },
      {
        title: 'One-trip repair',
        description: 'Water off, repair or replacement done, connections tested under pressure before we leave.',
      },
      {
        title: 'Test and tidy',
        description: 'We check for leaks, wipe down the work area, and haul away old fixtures and packaging.',
      },
    ],
    typicalJobs: [
      'a kitchen faucet that drips at the base',
      'a toilet that runs every twenty minutes',
      'a bathroom sink that drains slowly',
      'a garbage disposal that hums but will not spin',
      'a new vanity faucet you bought and need installed',
    ],
    faqs: [
      {
        question: 'How much do minor plumbing repairs cost in Boise?',
        answer:
          'Minor plumbing visits with Boise Handyman Co start around $129, covering our flat trip fee and the first stretch of labor. Simple fixes like a fill valve or flapper usually land between $145 and $220, and faucet, toilet, or disposal replacements typically run $180 to $350 in labor with the fixture billed separately or supplied by you. Every job is quoted upfront.',
      },
      {
        question: 'When do I need a licensed plumber instead of a handyman?',
        answer:
          'Anything behind the wall or under the slab: repipes, water heater replacement, gas lines, sewer lines, and new plumbing runs. Idaho requires licensed plumbers for that work, and we refer it out to plumbing companies we trust rather than touching it.',
      },
      {
        question: 'Can you install a faucet or toilet I already bought?',
        answer:
          'Yes, that is one of our most common jobs. Have the new fixture on site, and we handle removal, installation, new supply lines if needed, and haul-away of the old unit in one visit.',
      },
      {
        question: 'Can you fix a slow drain?',
        answer:
          'Usually. We clear hair and buildup clogs at sinks, tubs, and showers with hand tools and small augers. Main-line backups, roots, and recurring whole-house drainage problems need a drain company with camera and jetting gear, and we will tell you if that is what you have.',
      },
      {
        question: 'What should I do before you arrive for a leak?',
        answer:
          'If water is actively leaking, close the shutoff valve under the fixture, or the main house shutoff if the fixture valve will not turn. Then send us a photo. Stopping the water first protects your cabinets and drywall while the repair gets scheduled.',
      },
    ],
    costGuidance: {
      heading: 'Minor plumbing repair cost in the Treasure Valley',
      paragraphs: [
        'Minor plumbing repairs with Boise Handyman Co start around $145 per visit: a flat $49 trip fee plus labor at $95 per hour, quoted upfront. Simple internal repairs land between $145 and $220, and fixture replacements typically run $180 to $350 in labor plus the fixture. Treasure Valley handyman rates generally run $60 to $120 per hour, while licensed plumber call-outs often start well above that for the same small jobs.',
        'These are planning figures, not a bid. Describe the problem, send a photo, and we reply with a firm upfront quote before scheduling.',
      ],
    },
    outOfScope: {
      heading: 'What plumbing work we refer out',
      paragraphs: [
        'Water heaters, repipes, gas lines, sewer and main drain lines, slab leaks, and any new plumbing runs are licensed-plumber territory under Idaho rules, and we do not take them on. When your problem crosses that line we say so immediately and refer you to a licensed plumbing contractor we trust, so you are never paying a handyman to learn plumbing on your house.',
      ],
    },
  },

  'electrical-repairs': {
    slug: 'electrical-repairs',
    name: 'Minor Electrical Repairs',
    headline: 'Minor Electrical Repairs in Boise and the Treasure Valley',
    primaryKeyword: 'minor electrical repair boise',
    overview:
      'Boise Handyman Co handles small, like-for-like electrical jobs across the Treasure Valley: replacing outlets and switches, swapping light fixtures, and installing ceiling fans where wiring already exists. Everything is quoted upfront, done to code, and tested before we leave, and anything bigger goes to a licensed electrician.',
    benefits: [
      'Like-for-like swaps done safely, with power verified off',
      'Fixtures and fans installed on existing wiring in one visit',
      'Upfront quote per fixture, not an open-ended hourly gamble',
      'Clear line on what belongs with a licensed electrician',
    ],
    inclusions: [
      'Outlet and switch replacement, including worn or discolored devices',
      'Dimmer and smart switch installation on existing circuits',
      'Light fixture replacement: flush mounts, pendants, and vanity bars',
      'Ceiling fan replacement where a fan-rated box exists',
      'Doorbell, smoke detector, and CO detector replacement',
      'Loose outlet, cover plate, and fixture tightening and repair',
    ],
    timeline:
      'An outlet or switch swap takes about 30 to 60 minutes. A light fixture replacement runs about an hour. A ceiling fan swap on an existing fan-rated box takes 1.5 to 2.5 hours including balancing and testing.',
    processSteps: [
      {
        title: 'Tell us the fixture',
        description: 'A photo of what is there now, and of the replacement if you have it, lets us confirm the job is handyman scope.',
      },
      {
        title: 'Upfront quote',
        description: 'A firm per-fixture price, labor plus trip fee, before anything is scheduled.',
      },
      {
        title: 'Safe swap',
        description: 'Breaker off, power verified dead at the fixture, replacement wired and mounted properly.',
      },
      {
        title: 'Test and tidy',
        description: 'Every device tested, packaging and the old fixture hauled away, work area wiped down.',
      },
    ],
    typicalJobs: [
      'a dining room fixture swapped for the new one you bought',
      'yellowed outlets and switches replaced through a hallway',
      'a bedroom ceiling fan replaced on the existing box',
      'a dimmer added to the living room lights',
      'a chirping smoke detector replaced with a fresh sealed unit',
    ],
    faqs: [
      {
        question: 'How much do minor electrical repairs cost in Boise?',
        answer:
          'Minor electrical visits with Boise Handyman Co start around $129, covering our flat trip fee and the first stretch of labor. Outlet and switch swaps land around $129 to $180 each visit, light fixture replacements typically run $150 to $250, and ceiling fan swaps $200 to $350 in labor. Fixtures are billed separately or supplied by you, and every job is quoted upfront.',
      },
      {
        question: 'When do I need a licensed electrician instead of a handyman?',
        answer:
          'New circuits, panel or breaker work, service upgrades, EV charger installs, hot tub wiring, aluminum wiring, and anything that involves running new wire. Idaho requires licensed electricians for that work, and we refer it to electrical contractors we trust.',
      },
      {
        question: 'Can you install a ceiling fan where there is only a light?',
        answer:
          'Only if the ceiling box is fan-rated. Fans are heavy and they move, so a standard light box is not safe to hang one from. We check the box first; if it needs replacing or bracing we tell you upfront, and if new wiring is required the job goes to an electrician.',
      },
      {
        question: 'Do you install smart switches and dimmers?',
        answer:
          'Yes, on existing circuits. Bring the device you want, or tell us the brand and we will pick one up. We confirm your wiring has the neutral most smart switches require before quoting.',
      },
      {
        question: 'My outlet stopped working. Can you fix it?',
        answer:
          'Often, yes. A dead outlet is frequently a tripped GFCI, a worn device, or a loose connection at that outlet, all of which we can fix. If the cause traces back into the circuit or the panel, that is electrician territory and we will say so rather than guess.',
      },
    ],
    costGuidance: {
      heading: 'Minor electrical repair cost in the Treasure Valley',
      paragraphs: [
        'Minor electrical work with Boise Handyman Co starts around $145 per visit: a flat $49 trip fee plus labor at $95 per hour, quoted upfront. Typical jobs land between $145 and $350 in labor depending on the fixture, with the device itself billed separately or supplied by you. Treasure Valley handyman rates generally run $60 to $120 per hour for this class of work.',
        'These are planning figures, not a bid. Send a photo of the fixture and we confirm the job is handyman scope and reply with a firm upfront quote.',
      ],
    },
    outOfScope: {
      heading: 'What electrical work we refer out',
      paragraphs: [
        'Panel and breaker work, new circuits and wire runs, service upgrades, EV chargers, spa and hot tub wiring, and troubleshooting that leads back into the walls all require a licensed electrician in Idaho. We keep strictly to like-for-like replacements on existing wiring, and when a job crosses that line we stop and refer you to a licensed electrical contractor we trust.',
      ],
    },
  },

  'carpentry-trim-repair': {
    slug: 'carpentry-trim-repair',
    name: 'Carpentry & Trim Repair',
    headline: 'Carpentry, Trim, and Door Repair in Boise and the Treasure Valley',
    primaryKeyword: 'carpentry repair boise',
    overview:
      'Boise Handyman Co handles the small carpentry that keeps a house feeling solid: doors that stick or will not latch, damaged baseboard and casing, loose stair rails, and worn thresholds. Repairs are quoted upfront and finished cleanly, with filler, caulk, and paint touch-up where it matters.',
    benefits: [
      'Doors adjusted to close properly, not just shaved to fit',
      'Trim replacements matched to your existing profiles',
      'Loose rails and banisters anchored solidly into framing',
      'Finish-ready work: filled, caulked, and touch-up painted',
    ],
    inclusions: [
      'Door adjustment, planing, and hinge and latch repair',
      'Interior door and hardware replacement',
      'Baseboard, casing, and crown repair and replacement',
      'Stair rail, banister, and spindle tightening and repair',
      'Weatherstripping and door sweep replacement',
      'Window operation fixes: sticking sashes, locks, and balances',
    ],
    timeline:
      'A sticking door is usually adjusted in about an hour. Trim repairs run 1 to 3 hours depending on length and profile matching. An interior door swap with hardware takes 2 to 3 hours.',
    processSteps: [
      {
        title: 'Show us the problem',
        description: 'Photos of the door, trim, or rail, plus a note on what it is doing, let us quote and bring matching material.',
      },
      {
        title: 'Upfront quote',
        description: 'A firm price for the repair, labor plus trip fee, with any lumber or hardware listed separately.',
      },
      {
        title: 'Repair in one trip',
        description: 'We adjust, replace, or rebuild the piece, matching profiles and anchoring into solid framing.',
      },
      {
        title: 'Finish and clean up',
        description: 'Nail holes filled, joints caulked, paint touched up where supplied, and sawdust cleaned away.',
      },
    ],
    typicalJobs: [
      'a bathroom door that will not latch since the house settled',
      'baseboard chewed up by a puppy or a move',
      'a stair banister that shifts when you grab it',
      'a new interior door slab hung in an existing frame',
      'weatherstripping replaced before winter drafts arrive',
    ],
    faqs: [
      {
        question: 'How much does carpentry or trim repair cost in Boise?',
        answer:
          'Carpentry visits with Boise Handyman Co start around $149, covering our flat trip fee and the first stretch of labor. Door adjustments usually land between $149 and $250, trim repairs $150 to $350 depending on length, and interior door replacements $250 to $400 in labor with the door billed separately. Everything is quoted upfront before work starts.',
      },
      {
        question: 'Why do doors stick in Treasure Valley homes?',
        answer:
          'Seasonal humidity swings and normal settling. Wood doors swell in wet months and shrink in dry ones, and hinges loosen over years of use. Most sticking doors need hinge adjustment or minor planing, not replacement, and we will tell you which yours needs.',
      },
      {
        question: 'Can you match my existing trim profile?',
        answer:
          'Usually, yes. Common profiles are stocked locally, and close matches can be blended at the joints so the repair reads as original. Genuinely custom or historic profiles may need a millwork shop, and we will tell you before committing.',
      },
      {
        question: 'Do you build custom furniture or built-ins?',
        answer:
          'No. We repair and install rather than fabricate. Custom built-ins, cabinetry, and furniture belong with a finish carpenter or cabinet shop, and we are glad to point you to one.',
      },
      {
        question: 'Can you fix a sagging gate or exterior door too?',
        answer:
          'Yes. Exterior doors, thresholds, and weatherstripping are core carpentry work, and wooden gates and their hardware fall under our fence and deck repair service, often handled in the same visit.',
      },
    ],
    costGuidance: {
      heading: 'Carpentry and trim repair cost in the Treasure Valley',
      paragraphs: [
        'Carpentry and trim repair with Boise Handyman Co starts around $149 per visit: a flat $49 trip fee plus labor at $95 per hour, quoted upfront. Most door, trim, and rail repairs land between $149 and $400 in labor, with lumber and hardware listed separately on the quote. Treasure Valley handyman rates generally run $60 to $120 per hour.',
        'These are planning figures, not a bid. Send photos of the repair and we reply with a firm upfront quote, usually within one business day.',
      ],
    },
    outOfScope: {
      heading: 'What carpentry work we refer out',
      paragraphs: [
        'Structural framing, load-bearing changes, new window and exterior door installation into new openings, and custom cabinetry are beyond handyman scope. Those belong with a general contractor, window installer, or cabinet shop, and if your repair uncovers a structural problem we stop and tell you before doing anything cosmetic over it.',
      ],
    },
  },

  'mounting-assembly': {
    slug: 'mounting-assembly',
    name: 'Mounting & Assembly',
    headline: 'TV Mounting, Shelving, and Furniture Assembly in Boise',
    primaryKeyword: 'tv mounting boise',
    overview:
      'Boise Handyman Co mounts TVs, shelves, mirrors, and curtain rods level and anchored into the right structure, and assembles flat-pack furniture without the missing-screw meltdown. Fixed pricing per item, quoted upfront, with most visits finished inside two hours.',
    benefits: [
      'Anchored into studs or rated anchors, never just drywall',
      'Level lines checked twice before any holes are drilled',
      'Cables concealed neatly where the wall allows it',
      'Flat-pack assembly done fast, square, and fully tightened',
    ],
    inclusions: [
      'TV mounting on drywall, with concealed cords where feasible',
      'Floating shelves, cabinets, and heavy mirror hanging',
      'Curtain rods, blinds, and window hardware installation',
      'Flat-pack furniture assembly: dressers, desks, beds, and shelving',
      'Anchoring furniture to walls for child safety',
      'Gallery walls, art, and heavy frame hanging',
    ],
    timeline:
      'A standard TV mount takes 1 to 1.5 hours. Curtain rods and shelves run about 30 to 45 minutes each. Flat-pack furniture varies from 30 minutes for a small bookcase to 2 to 3 hours for a large wardrobe or bed with storage.',
    processSteps: [
      {
        title: 'List the items',
        description: 'Tell us what needs mounting or assembling, with photos of the wall and the boxes.',
      },
      {
        title: 'Upfront quote',
        description: 'A firm per-item price, labor plus one trip fee, so a list of tasks shares a single visit.',
      },
      {
        title: 'Mount and assemble',
        description: 'Studs located, anchors matched to the load, everything leveled, assembled, and tightened.',
      },
      {
        title: 'Clean finish',
        description: 'Packaging broken down and hauled away, dust vacuumed, and every item load-tested before we go.',
      },
    ],
    typicalJobs: [
      'a 65-inch TV mounted above a console with cords hidden',
      'an IKEA wardrobe assembled and anchored to the wall',
      'floating shelves hung level across a kitchen wall',
      'curtain rods installed through a whole main floor',
      'a heavy entry mirror hung on the right anchors',
    ],
    faqs: [
      {
        question: 'How much does TV mounting cost in Boise?',
        answer:
          'Mounting and assembly visits with Boise Handyman Co start around $145, covering our flat trip fee and the first hour of labor. A standard TV mount typically lands between $145 and $220 in labor with your bracket, and furniture assembly runs $95 per hour after the trip fee. Multiple items share one trip fee, which makes a list the best value.',
      },
      {
        question: 'Do I need to supply the TV mount or shelf hardware?',
        answer:
          'Bring the item and its bracket or hardware if you have them. If not, tell us the TV size and wall type and we will bring a suitable mount, listed on the quote at its store price.',
      },
      {
        question: 'Can you hide the TV cables in the wall?',
        answer:
          'On most interior drywall we can fit an in-wall cord concealment kit rated for power and low-voltage cables, which hides everything between the TV and the outlet. Fire-blocked, exterior, and masonry walls sometimes limit this, and we will tell you on site before cutting.',
      },
      {
        question: 'Can you mount on brick, tile, or plaster?',
        answer:
          'Yes, with the right anchors and drill bits, which we carry. Masonry and tile take a little longer than drywall, and we flag that in the quote.',
      },
      {
        question: 'Is there a minimum job size?',
        answer:
          'The flat trip fee applies to every visit, so a single small task starts around $145 all-in. Most customers bundle two or three items into the same visit, which spreads that trip fee across the list.',
      },
    ],
    costGuidance: {
      heading: 'Mounting and assembly cost in the Treasure Valley',
      paragraphs: [
        'Mounting and assembly with Boise Handyman Co starts around $145 per visit: a flat $49 trip fee plus labor at $95 per hour, quoted upfront. A standard TV mount lands between $145 and $220 in labor, and flat-pack assembly is billed on time, with most single pieces finished inside an hour. Treasure Valley rates for this work generally run $60 to $120 per hour.',
        'These are planning figures, not a bid. Send your list and photos, and we reply with a firm per-item quote before scheduling.',
      ],
    },
    outOfScope: {
      heading: 'What mounting work we refer out',
      paragraphs: [
        'Home theater wiring with new in-wall power, projector and surround-sound system design, and commercial display installations belong with an audio-video or electrical contractor. We mount, conceal, and connect what exists; new circuits and dedicated AV design get a referral.',
      ],
    },
  },

  'fence-deck-gutter-repair': {
    slug: 'fence-deck-gutter-repair',
    name: 'Fence, Deck & Gutter Repair',
    headline: 'Fence, Deck, and Gutter Repair in Boise and the Treasure Valley',
    primaryKeyword: 'fence repair boise',
    overview:
      'Boise Handyman Co repairs the exterior wear items Treasure Valley weather works on hardest: leaning fence panels and rotted posts, loose deck boards and railings, and gutters that sag, leak, or overflow. Repairs are quoted upfront and sized for a visit, not a rebuild.',
    benefits: [
      'Fence posts reset properly in concrete, not just propped',
      'Deck boards and rails replaced with matched, exterior-grade material',
      'Gutters cleaned, resealed, and re-pitched to actually drain',
      'Honest advice on repair versus replacement, with referrals for rebuilds',
    ],
    inclusions: [
      'Leaning and broken fence post replacement and resetting',
      'Fence panel, picket, and gate repair, including sagging gates',
      'Deck board, stair tread, and railing replacement',
      'Deck re-securing: loose ledger hardware flagged, fasteners tightened',
      'Gutter cleaning, resealing seams, and re-pitching runs',
      'Downspout repair, extensions, and splash block placement',
    ],
    timeline:
      'A fence post reset takes 2 to 3 hours plus concrete cure time before the panel rehangs. Gate repairs run 1 to 2 hours. Deck board swaps take 1 to 3 hours. A full gutter clean on a single-story home takes about 1.5 to 2.5 hours.',
    processSteps: [
      {
        title: 'Send photos outside',
        description: 'Shots of the leaning section, damaged boards, or overflowing run tell us materials and time.',
      },
      {
        title: 'Upfront quote',
        description: 'A firm price for labor and the trip fee, with lumber, hardware, and sealant listed separately.',
      },
      {
        title: 'Repair visit',
        description: 'Posts set, boards replaced, seams sealed, and hardware upgraded to exterior-grade fasteners.',
      },
      {
        title: 'Walkthrough and haul-away',
        description: 'We test gates and railings with you, rinse gutter runs to prove drainage, and haul away the debris.',
      },
    ],
    typicalJobs: [
      'two fence panels leaning after a windstorm',
      'a gate that drags and will not latch',
      'a handful of cupped deck boards replaced before summer',
      'gutters cleaned and resealed before fall rain',
      'a downspout extension added where water pooled at the foundation',
    ],
    faqs: [
      {
        question: 'How much does fence repair cost in Boise?',
        answer:
          'Exterior repair visits with Boise Handyman Co start around $149, covering our flat trip fee and the first stretch of labor. A single post reset typically lands between $150 and $300 in labor plus materials, gate repairs $150 to $250, and gutter cleaning $149 to $300 depending on house size. Wind-damage repairs are quoted upfront from photos.',
      },
      {
        question: 'Can you fix a leaning fence or does it need replacing?',
        answer:
          'If the rails and pickets are sound and only the posts have failed, resetting the posts saves most of the fence. If rot runs through the rails and pickets too, replacement is the honest answer, and full fence replacement is fencing-contractor work we refer out.',
      },
      {
        question: 'When should gutters be cleaned in the Treasure Valley?',
        answer:
          'At least once a year, ideally in late fall after the leaves drop and before the first hard freeze. Homes under mature trees benefit from a second clean in spring. Clogged gutters overflow at the foundation and grow ice dams in winter, so fall is the visit that matters most.',
      },
      {
        question: 'Do you build new decks or fences?',
        answer:
          'No. New fence lines, full fence replacement, and new deck construction are contractor projects with their own permits and crews. We repair what exists and refer new construction to fence and deck contractors we trust.',
      },
      {
        question: 'What time of year is best for fence and deck repairs?',
        answer:
          'Spring through fall. Concrete for post setting and stains and sealants all want temperatures above roughly 40 to 50 degrees, so we schedule most exterior repairs between March and November and keep winter for interior work.',
      },
    ],
    costGuidance: {
      heading: 'Fence, deck, and gutter repair cost in the Treasure Valley',
      paragraphs: [
        'Exterior repairs with Boise Handyman Co start around $149 per visit: a flat $49 trip fee plus labor at $95 per hour, quoted upfront. Typical repairs land between $150 and $450 in labor depending on scope, with lumber, hardware, and sealant listed separately. Treasure Valley handyman rates generally run $60 to $120 per hour for exterior repair work.',
        'These are planning figures, not a bid. Send photos of the damage and we reply with a firm upfront quote before anything is scheduled.',
      ],
    },
    outOfScope: {
      heading: 'What exterior work we refer out',
      paragraphs: [
        'New fence and deck construction, full replacements, retaining walls, concrete flatwork, roof repairs, and full gutter system replacement belong with specialty contractors. Structural deck problems, especially ledger attachment to the house, get flagged to you honestly and referred to a licensed contractor rather than patched over.',
      ],
    },
  },

  'home-maintenance': {
    slug: 'home-maintenance',
    name: 'Caulking & Home Maintenance',
    headline: 'Caulking, Weatherproofing, and Home Maintenance in Boise',
    primaryKeyword: 'home maintenance handyman boise',
    overview:
      'Boise Handyman Co handles the recurring small maintenance that keeps a Treasure Valley home tight and dry: fresh caulk in kitchens and baths, weatherstripping and draft sealing before winter, tile and grout touch-ups, and whole punch lists of small tasks cleared in a single visit.',
    benefits: [
      'Old caulk cut out fully, not smeared over',
      'Draft sealing that shows up on your winter heating bill',
      'Punch lists cleared in one visit under a single trip fee',
      'Seasonal reminders of what your home needs before the weather turns',
    ],
    inclusions: [
      'Kitchen and bathroom recaulking: tubs, showers, sinks, and backsplashes',
      'Exterior caulking at siding joints, windows, and penetrations',
      'Weatherstripping, door sweeps, and draft sealing',
      'Tile and grout repair and touch-up',
      'Small punch-list tasks: hinges, handles, stops, filters, and hardware',
      'Move-in and pre-listing fix-it lists',
    ],
    timeline:
      'A tub and shower recaulk takes 1.5 to 2.5 hours, plus overnight cure before water use. Draft sealing a typical home runs 2 to 3 hours. Punch lists depend on the list, and we quote the expected time upfront.',
    processSteps: [
      {
        title: 'Send your list',
        description: 'Every small task counts. Photos of caulk lines, drafts, and grout help us bring the right materials.',
      },
      {
        title: 'Upfront quote',
        description: 'One trip fee, hourly labor, and materials listed separately, so the whole list has a clear price.',
      },
      {
        title: 'Work the list',
        description: 'Old caulk removed, surfaces prepped, seals and repairs done properly, tasks checked off one by one.',
      },
      {
        title: 'Walkthrough',
        description: 'We review the finished list with you, note anything seasonal to plan for, and clean up completely.',
      },
    ],
    typicalJobs: [
      'a shower recaulked after the old bead went dark',
      'drafty front and garage doors sealed before winter',
      'cracked grout lines repaired in an entry floor',
      'a pre-listing punch list cleared before photos',
      'a rental turnover list finished between tenants',
    ],
    faqs: [
      {
        question: 'How much does recaulking or a maintenance visit cost in Boise?',
        answer:
          'Maintenance visits with Boise Handyman Co start around $145, covering our flat trip fee and the first hour of labor. A tub and shower recaulk typically lands between $150 and $300, draft sealing a whole home $200 to $350, and punch lists are billed on quoted time at $95 per hour. One trip fee covers the entire visit.',
      },
      {
        question: 'How often should caulk be replaced?',
        answer:
          'Wet areas like tubs and showers want fresh caulk every 3 to 5 years, sooner if it darkens, cracks, or pulls away. Exterior caulk in the Treasure Valley takes a beating from freeze-thaw cycles and hot dry summers, so checking it each fall is worth the ten minutes.',
      },
      {
        question: 'When should I weatherproof my home in Idaho?',
        answer:
          'September and October are ideal, before the first hard freeze. Sealing drafts at doors, windows, and penetrations then means the work pays for itself across the heating season, and the same sealing keeps hot air out in July.',
      },
      {
        question: 'Can you handle a whole punch list in one visit?',
        answer:
          'Yes, that is the point of the service. Send the full list, however small the items feel, and we quote it as one visit with one trip fee. Most lists of eight to twelve small tasks fit inside half a day.',
      },
      {
        question: 'Do you do pre-listing repairs for home sales?',
        answer:
          'Yes. Agents and sellers use us to clear inspection-style lists before photos and showings: caulk, hardware, doors, paint touch-ups, and the small flaws buyers notice. Items on your list that need licensed trades get flagged and referred rather than guessed at.',
      },
    ],
    costGuidance: {
      heading: 'Home maintenance cost in the Treasure Valley',
      paragraphs: [
        'Maintenance visits with Boise Handyman Co start around $145: a flat $49 trip fee plus labor at $95 per hour, quoted upfront. Most caulking, weatherproofing, and punch-list visits land between $145 and $400 depending on the list, with materials listed separately. Treasure Valley handyman rates generally run $60 to $120 per hour.',
        'These are planning figures, not a bid. Send your list with photos and we reply with a firm quote for the whole visit, usually within one business day.',
      ],
    },
    outOfScope: {
      heading: 'What maintenance work we refer out',
      paragraphs: [
        'Full bathroom regrouts and tile replacement, window replacement, insulation projects, HVAC service, and roof maintenance belong with specialty contractors. If a maintenance item on your list turns out to be a symptom of a bigger problem, a leak, rot, or a failing system, we tell you what we found and refer the right licensed trade instead of covering it up.',
      ],
    },
  },
};

export function getAreaIntro(city: CityData): string {
  const county = getCountyLabel(city.county);
  return `Boise Handyman Co provides handyman services for homes in ${city.name}, Idaho and throughout ${county}: small repairs, installs, and maintenance with upfront quotes, a flat trip fee, and most jobs finished in a single visit.`;
}

export function getCityServiceIntro(
  service: ServiceSEOContent,
  city: CityData,
  localFact?: string,
): string {
  const county = getCountyLabel(city.county);
  const fact = localFact
    ? ` ${localFact}`
    : ` We work throughout ${city.name} and the surrounding ${county} area, so scheduling is local and travel never balloons the bill.`;
  return `Need ${service.name.toLowerCase()} in ${city.name}, Idaho?${fact} Boise Handyman Co quotes every job upfront, charges a simple hourly rate plus one flat trip fee, and finishes most jobs in a single visit. Get an instant estimate online or book a handyman visit.`;
}

export function getCityServiceFaqs(service: ServiceSEOContent, city: CityData): FAQItem[] {
  const county = getCountyLabel(city.county);
  // First sentence of the cost band, reused as a direct city-level answer for
  // "{service} cost in {city}" queries (voice/AI extractable).
  const costSentence = service.costGuidance
    ? `${service.costGuidance.paragraphs[0].split('. ')[0]}.`
    : undefined;
  return [
    ...(costSentence
      ? [
          {
            question: `How much does ${service.name.toLowerCase()} cost in ${city.name}?`,
            answer: `${city.name} pricing is the same as the rest of our Treasure Valley service area, with no extra travel charge. ${costSentence} Send photos for a firm upfront quote for your ${city.name} home.`,
          },
        ]
      : []),
    ...service.faqs.slice(0, 2),
    {
      question: `Do you serve ${city.name}?`,
      answer: `Yes. ${city.name} is part of our core service area, along with the rest of ${county} and the Treasure Valley. The same flat trip fee applies across the whole area.`,
    },
    {
      question: `How do I get a quote for ${service.name.toLowerCase()} in ${city.name}?`,
      answer: `Use the online estimator for an instant planning range, or send photos of the job by text or through the contact form. We reply with a firm upfront quote, usually within one business day, before anything is scheduled.`,
    },
  ];
}

/**
 * Build localized long-form sections for a city x service page. This is the
 * core doorway-page mitigation: instead of a single keyword-swapped paragraph,
 * each page gets service-scoped local substance (neighborhoods, landmarks,
 * climate) drawn from CITY_SEO_DATA.
 */
export function getCityServiceSections(
  service: ServiceSEOContent,
  city: CityData,
  seo: CitySeoFacts | undefined,
): LandingSection[] {
  const county = getCountyLabel(city.county);
  const neighborhoods = seo?.neighborhoods ?? [];
  const landmarks = seo?.landmarks ?? [];
  const serviceLC = service.name.toLowerCase();

  const sections: LandingSection[] = [
    // Server-rendered cost bands (extractable by crawlers and AI engines,
    // unlike the client-side estimator).
    ...(service.costGuidance
      ? [
          {
            heading: `${service.name} cost in ${city.name}`,
            paragraphs: [
              `Pricing in ${city.name} matches the rest of our Treasure Valley service area, with no added travel charge. ${service.costGuidance.paragraphs[0]}`,
              service.costGuidance.paragraphs[1],
            ],
            links: [
              {
                label: 'Get an instant estimate',
                href: '/estimate',
              },
            ],
          },
        ]
      : []),
    ...(service.typicalJobs?.length
      ? [
          {
            heading: `Typical ${serviceLC} jobs in ${city.name}`,
            paragraphs: [
              `The calls we get from ${city.name} look like the calls we get everywhere: ${service.typicalJobs.join('; ')}. If your job sounds like one of these, it is squarely in scope, and if it is bigger, we will say so and point you to the right specialty contractor.`,
            ],
          },
        ]
      : []),
    {
      heading: `${service.name} across ${city.name}`,
      paragraphs: [
        neighborhoods.length
          ? `We serve homes throughout ${city.name}, including ${neighborhoods.join(', ')}. Housing stock varies between these areas, from newer subdivision builds to older homes with settled doors and original fixtures, so we ask the right questions up front and arrive with materials that suit the house.`
          : `We serve homes throughout ${city.name}, from newer subdivision builds to older houses with settled doors and original fixtures, and we arrive with materials that suit the house.`,
        landmarks.length
          ? `As a local team that knows ${city.name} landmarks like ${landmarks.slice(0, 3).join(', ')}, scheduling is straightforward: we quote a real arrival time, confirm before heading out, and one flat trip fee covers the visit.`
          : `As a local team, scheduling is straightforward: we quote a real arrival time, confirm before heading out, and one flat trip fee covers the visit.`,
      ],
    },
    {
      heading: `Scheduling ${serviceLC} in ${county}`,
      paragraphs: [
        `We take bookings across ${county} and typically reply to new requests within one business day. Most ${serviceLC} jobs are quoted from photos, scheduled within the week, and finished in a single visit, and bundling several small tasks into the same appointment spreads the trip fee across the list.`,
        seo?.climate
          ? `The local ${seo.climate} is hard on homes: caulk and exterior seals crack with freeze-thaw cycles, doors swell and shrink with the seasons, and gutters need attention before winter. We plan the work, and the materials, around that reality.`
          : `The Treasure Valley climate is hard on homes: caulk cracks with freeze-thaw cycles, doors swell and shrink with the seasons, and gutters need attention before winter. We plan the work around that reality.`,
      ],
      links: [
        { label: `Handyman services in ${city.name}`, href: `/areas/${city.slug}` },
        { label: `All ${service.name} details`, href: `/services/${service.slug}` },
      ],
    },
    ...(service.outOfScope
      ? [
          {
            heading: service.outOfScope.heading,
            paragraphs: service.outOfScope.paragraphs,
          },
        ]
      : []),
  ];

  return sections;
}

export const AREA_PAGE_FAQS: FAQItem[] = [
  {
    question: 'What kinds of jobs do you take on?',
    answer:
      'Small repairs, installs, and maintenance: drywall patching, painting touch-ups, minor plumbing and electrical fixes, carpentry and door repair, TV mounting and furniture assembly, fence, deck, and gutter repair, and caulking and weatherproofing. Most jobs run one to eight hours.',
  },
  {
    question: 'How does pricing work?',
    answer:
      'A simple hourly rate plus one flat trip fee per visit, with an upfront quote before any work starts. Materials appear as their own line, and bundling several tasks into one visit spreads the trip fee across the list.',
  },
  {
    question: 'Do you handle remodels or large projects?',
    answer:
      'No. Full remodels, additions, and anything needing a general contractor or major permits are outside our scope. We stick to small jobs done well, and we are glad to refer larger projects to contractors we trust.',
  },
  {
    question: 'How do I get started?',
    answer:
      'Call or text us, use the online estimator for an instant planning range, or send your task list with photos through the contact form. We reply within one business day with an upfront quote.',
  },
];

export const HOMEPAGE_FAQS_FOR_SCHEMA: FAQItem[] = [
  {
    question: 'What does a handyman cost in the Treasure Valley?',
    answer:
      'Treasure Valley handyman rates typically run $60 to $120 per hour. Boise Handyman Co charges a simple hourly rate plus a flat trip fee, with visits starting around $145 and every job quoted upfront before work starts.',
  },
  {
    question: 'What services do you offer?',
    answer:
      'Drywall repair, interior and exterior painting touch-ups, minor plumbing and electrical repairs, carpentry and trim repair, TV mounting and furniture assembly, fence, deck, and gutter repair, and caulking and home maintenance.',
  },
  {
    question: 'What areas do you serve?',
    answer:
      'Boise, Meridian, Eagle, Nampa, Kuna, Star, Middleton, Caldwell, and the greater Treasure Valley across Ada and Canyon County.',
  },
  {
    question: 'How quickly can you come out?',
    answer:
      'We reply to new requests within one business day and most jobs are scheduled within the week. Quotes come first, from photos, so the visit itself is spent fixing rather than estimating.',
  },
  {
    question: 'Do you handle big remodels?',
    answer:
      'No. We focus on small repair, install, and maintenance jobs, typically one to eight hours. Remodels, additions, and projects needing a general contractor get referred to contractors we trust.',
  },
];
