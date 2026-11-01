import type { ServiceData, CityData } from './contentData';
import { getCountyLabel } from './contentData';
import { getAreaCityCopy } from './content/areaCopy';
import { getCityServiceCopy } from './content/cityServiceCopy';
import { getCityLocalSection, getCityOnlyFaqs } from './cityPageFacts';
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
   * story (upfront written quotes, per-visit starting prices) in static HTML.
   * All our own dollar figures are placeholders: [NEEDS: real pricing
   * confirmation].
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
 * Pricing story used across every service below, stated once so pages stay
 * consistent: every job gets one upfront written quote before any work
 * starts, with per-visit starting prices as the public anchors. The internal
 * rate model (trip fee + hourly, see estimateEngine) is deliberately NOT
 * published anywhere customer-facing. Market context: Treasure Valley
 * handyman rates typically run $60 to $120 per hour. Our own figures (every
 * "from" price) are PLACEHOLDERS pending owner confirmation:
 * [NEEDS: real pricing confirmation].
 */
export const SERVICE_SEO_CONTENT: Record<string, ServiceSEOContent> = {
  'drywall-repair': {
    slug: 'drywall-repair',
    name: 'Drywall repair & patching',
    headline: 'Drywall repair in Boise',
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
      "Timing depends on the repair list, materials, access and any drying or curing needed. We review the scope and agree scheduling before work begins.",
    processSteps: [
      {
        title: 'Send photos',
        description: 'A photo of each hole or crack with something for scale lets us quote accurately before we arrive.',
      },
      {
        title: 'Upfront quote',
        description: 'You approve one written price before any work starts.',
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
          "The price depends on your repair list, materials, access and preparation. Send the details and photos for a scope review and written quote before work begins.",
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
    costGuidance: {"heading":"Scope and pricing for your project","paragraphs":["Send your repair list and photos. Our team reviews the work, materials and access before preparing a quote.","Scope, price and scheduling are agreed before work begins. A request does not reserve a visit or confirm a price."]},
    outOfScope: {
      heading: 'What drywall work we refer out',
      paragraphs: [
        'We handle patches and repairs, not construction. Hanging drywall for new rooms or additions, full ceiling replacements, asbestos-era popcorn removal across whole rooms, and repairs that reveal structural or moisture problems inside the wall belong with a drywall contractor or general contractor. If your job turns out to be one of those, we will tell you plainly and point you to a licensed contractor who does that work well.',
      ],
    },
  },

  'painting-touch-ups': {
    slug: 'painting-touch-ups',
    // Touch-ups and small repaints, matching the slug and the scope; whole-house
    // and full exterior repaints are referred out (see outOfScope).
    name: 'Painting touch-ups',
    headline: 'Paint touch-ups in Boise and the Treasure Valley',
    primaryKeyword: 'paint touch up boise',
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
      "Timing depends on the repair list, materials, access and any drying or curing needed. We review the scope and agree scheduling before work begins.",
    processSteps: [
      {
        title: 'Describe the space',
        description: 'Room sizes, surfaces, and photos let us quote the job and the paint quantity accurately.',
      },
      {
        title: 'Upfront quote',
        description: 'A firm written price for the work, with paint either supplied by you or picked up by us and billed at cost.',
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
          "The price depends on your repair list, materials, access and preparation. Send the details and photos for a scope review and written quote before work begins.",
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
    costGuidance: {"heading":"Scope and pricing for your project","paragraphs":["Send your repair list and photos. Our team reviews the work, materials and access before preparing a quote.","Scope, price and scheduling are agreed before work begins. A request does not reserve a visit or confirm a price."]},
    outOfScope: {
      heading: 'What painting work we refer out',
      paragraphs: [
        'Whole-house interior repaints, full exterior repaints, two-story exterior work needing staging, and cabinet refinishing with sprayed factory finishes are jobs for a dedicated painting contractor. We are honest about that line: if your project is bigger than a handyman visit does well, we will say so and refer you to a painter we trust.',
      ],
    },
  },

  'plumbing-repairs': {
    slug: 'plumbing-repairs',
    name: 'Minor plumbing repairs',
    headline: 'Minor plumbing repairs in Boise and the Treasure Valley',
    primaryKeyword: 'minor plumbing repair boise',
    overview:
      'Boise Handyman Co schedules everyday plumbing items on your repair list with licensed plumbing trade partners we stand behind, inside the same written quote and visit plan: dripping faucets, running toilets, slow drains, disposals and worn supply lines. Water heaters, repipes, gas and new plumbing runs stay with the plumber.',
    benefits: [
      'Fixture scope and parts reviewed before scheduling',
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
      'Timing depends on the reviewed scope, fixture condition, parts and access. The team confirms scheduling after reviewing the work.',
    processSteps: [
      {
        title: 'Describe the problem',
        description: 'A photo of the fixture and a note on the symptom lets us arrive with the right parts.',
      },
      {
        title: 'Upfront quote',
        description: 'A firm written price for the fix or the swap, with parts listed separately.',
      },
      {
        title: 'Complete the agreed repair',
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
          'Pricing depends on the repair scope, fixture, materials and access. Send the details for review and a written quote before scheduling.',
      },
      {
        question: 'When do I need a licensed plumber instead of a handyman?',
        answer:
          'Anything behind the wall or under the slab: repipes, water heater replacement, gas lines, sewer lines, and new plumbing runs. Idaho requires licensed plumbers for that work, and we refer it out to plumbing companies we trust rather than touching it.',
      },
      {
        question: 'Can you install a faucet or toilet I already bought?',
        answer:
          'Yes, that is one of our most common jobs. Have the new fixture on site, and we handle removal, installation, new supply lines if needed, and haul-away of the old unit as agreed in the scope.',
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
        'Pricing depends on the repair scope, fixture, materials and access. Send the details for review and a written quote before scheduling.',
        'Describe the problem and send optional photos. The team confirms the scope, quote and scheduling after review.',
      ],
    },
    outOfScope: {
      heading: 'What plumbing work we refer out',
      paragraphs: [
        'Plumbing, electrical and HVAC work on your list is done by the licensed trade partners we schedule and stand behind, inside the same written quote and the same visit plan. Water heaters, repipes, gas lines, sewer and main drain lines, slab leaks and new plumbing runs stay with the plumber. Our crew handles the drywall, mounting, doors, caulk and related finish work around those trades.',
      ],
    },
  },

  'electrical-repairs': {
    slug: 'electrical-repairs',
    name: 'Minor electrical repairs',
    headline: 'Minor electrical repairs in Boise and the Treasure Valley',
    primaryKeyword: 'minor electrical repair boise',
    overview:
      'Boise Handyman Co schedules electrical items on your repair list with licensed electrical trade partners we stand behind, inside the same written quote and visit plan. Like-for-like outlet, switch, fixture and ceiling-fan work on existing wiring is coordinated that way; new circuits, panels and added wiring stay with the electrician.',
    benefits: [
      'Like-for-like swaps done safely, with power verified off',
      'Fixture and fan work reviewed against the existing wiring',
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
      'Timing depends on the reviewed scope, fixture condition, parts and access. The team confirms scheduling after reviewing the work.',
    processSteps: [
      {
        title: 'Tell us the fixture',
        description: 'A photo of what is there now, and of the replacement if you have it, lets us confirm the job is handyman scope.',
      },
      {
        title: 'Upfront quote',
        description: 'A firm per-fixture written price before anything is scheduled.',
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
          'Pricing depends on the repair scope, fixture, materials and access. Send the details for review and a written quote before scheduling.',
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
        'Pricing depends on the repair scope, fixture, materials and access. Send the details for review and a written quote before scheduling.',
        'Send optional photos of the fixture so the team can review whether the work fits the service and prepare a quote.',
      ],
    },
    outOfScope: {
      heading: 'What electrical work we refer out',
      paragraphs: [
        'Plumbing, electrical and HVAC work on your list is done by the licensed trade partners we schedule and stand behind, inside the same written quote and the same visit plan. Panel and breaker work, new circuits, service upgrades, EV chargers and anything that runs new wire stay with the electrician. Our crew handles the drywall, mounting, doors, caulk and related finish work around those trades.',
      ],
    },
  },

  'carpentry-trim-repair': {
    slug: 'carpentry-trim-repair',
    name: 'Carpentry & trim repair',
    headline: 'Carpentry and trim repair in Boise',
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
      "Timing depends on the repair list, materials, access and any drying or curing needed. We review the scope and agree scheduling before work begins.",
    processSteps: [
      {
        title: 'Show us the problem',
        description: 'Photos of the door, trim, or rail, plus a note on what it is doing, let us quote and bring matching material.',
      },
      {
        title: 'Upfront quote',
        description: 'A firm written price for the repair, with any lumber or hardware listed separately.',
      },
      {
        title: 'Complete the agreed repairs',
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
          "The price depends on your repair list, materials, access and preparation. Send the details and photos for a scope review and written quote before work begins.",
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
    costGuidance: {"heading":"Scope and pricing for your project","paragraphs":["Send your repair list and photos. Our team reviews the work, materials and access before preparing a quote.","Scope, price and scheduling are agreed before work begins. A request does not reserve a visit or confirm a price."]},
    outOfScope: {
      heading: 'What carpentry work we refer out',
      paragraphs: [
        'Structural framing, load-bearing changes, new window and exterior door installation into new openings, and custom cabinetry are beyond handyman scope. Those belong with a general contractor, window installer, or cabinet shop, and if your repair uncovers a structural problem we stop and tell you before doing anything cosmetic over it.',
      ],
    },
  },

  'mounting-assembly': {
    slug: 'mounting-assembly',
    name: 'Mounting & assembly',
    headline: 'TV mounting, shelving, and furniture assembly in Boise',
    primaryKeyword: 'tv mounting boise',
    overview:
      'Boise Handyman Co helps with TV mounting, shelves, mirrors, curtain rods and furniture assembly. Send the items, product details and installation locations so our team can review the scope before preparing a quote.',
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
      "Timing depends on the repair list, materials, access and any drying or curing needed. We review the scope and agree scheduling before work begins.",
    processSteps: [
      {
        title: 'List the items',
        description: 'Tell us what needs mounting or assembling, with photos of the wall and the boxes.',
      },
      {
        title: 'Upfront quote',
        description: 'We review the items, required preparation and materials, then confirm the scope and pricing before work begins.',
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
          "The price depends on your repair list, materials, access and preparation. Send the details and photos for a scope review and written quote before work begins.",
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
          "The price depends on your repair list, materials, access and preparation. Send the details and photos for a scope review and written quote before work begins.",
      },
    ],
    costGuidance: {"heading":"Scope and pricing for your project","paragraphs":["Send your repair list and photos. Our team reviews the work, materials and access before preparing a quote.","Scope, price and scheduling are agreed before work begins. A request does not reserve a visit or confirm a price."]},
    outOfScope: {
      heading: 'What mounting work we refer out',
      paragraphs: [
        'Home theater wiring with new in-wall power, projector and surround-sound system design, and commercial display installations belong with an audio-video or electrical contractor. We mount, conceal, and connect what exists; new circuits and dedicated AV design get a referral.',
      ],
    },
  },

  'fence-deck-gutter-repair': {
    slug: 'fence-deck-gutter-repair',
    name: 'Fence, deck & gutter repair',
    headline: 'Fence, deck, and gutter repair in Boise and the Treasure Valley',
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
      "Timing depends on the repair list, materials, access and any drying or curing needed. We review the scope and agree scheduling before work begins.",
    processSteps: [
      {
        title: 'Send photos outside',
        description: 'Shots of the leaning section, damaged boards, or overflowing run tell us materials and time.',
      },
      {
        title: 'Upfront quote',
        description: 'A firm written price for the work, with lumber, hardware, and sealant listed separately.',
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
          "The price depends on your repair list, materials, access and preparation. Send the details and photos for a scope review and written quote before work begins.",
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
    costGuidance: {"heading":"Scope and pricing for your project","paragraphs":["Send your repair list and photos. Our team reviews the work, materials and access before preparing a quote.","Scope, price and scheduling are agreed before work begins. A request does not reserve a visit or confirm a price."]},
    outOfScope: {
      heading: 'What exterior work we refer out',
      paragraphs: [
        'New fence and deck construction, full replacements, retaining walls, concrete flatwork, roof repairs, and full gutter system replacement belong with specialty contractors. Structural deck problems, especially ledger attachment to the house, get flagged to you honestly and referred to a licensed contractor rather than patched over.',
      ],
    },
  },

  'home-maintenance': {
    slug: 'home-maintenance',
    name: 'Caulking & home maintenance',
    headline: 'Caulking, weatherproofing, and home maintenance in Boise',
    primaryKeyword: 'home maintenance handyman boise',
    overview:
      'Boise Handyman Co handles the recurring small maintenance that keeps a Treasure Valley home tight and dry: fresh caulk in kitchens and baths, weatherstripping and draft sealing before winter, tile and grout touch-ups, and household punch lists reviewed together.',
    benefits: [
      'Old caulk cut out fully, not smeared over',
      'Draft sealing that shows up on your winter heating bill',
      'Send the full punch list for a scope review',
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
      "Timing depends on the repair list, materials, access and any drying or curing needed. We review the scope and agree scheduling before work begins.",
    processSteps: [
      {
        title: 'Send your list',
        description: 'Every small task counts. Photos of caulk lines, drafts, and grout help us bring the right materials.',
      },
      {
        title: 'Upfront quote',
        description: 'One written price for the visit, with materials listed separately, so the whole list has a clear number.',
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
          "The price depends on your repair list, materials, access and preparation. Send the details and photos for a scope review and written quote before work begins.",
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
          'Send the full list so we can review it together. Whether it fits into one visit depends on the tasks, materials, access and preparation. We confirm the scope and schedule with you before work begins.',
      },
      {
        question: 'Do you do pre-listing repairs for home sales?',
        answer:
          'Yes. Agents and sellers use us to clear inspection-style lists before photos and showings: caulk, hardware, doors, paint touch-ups, and the small flaws buyers notice. Items on your list that need licensed trades get flagged and referred rather than guessed at.',
      },
    ],
    costGuidance: {"heading":"Scope and pricing for your project","paragraphs":["Send your repair list and photos. Our team reviews the work, materials and access before preparing a quote.","Scope, price and scheduling are agreed before work begins. A request does not reserve a visit or confirm a price."]},
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
  const base = `Boise Handyman Co provides small repairs, installs and maintenance for homes in ${city.name}, Idaho and throughout ${county}. Scope, pricing and the number of visits are confirmed after review.`;
  const added = getAreaCityCopy(city.slug)?.intro;
  return added ? `${added} ${base}` : base;
}

export function getCityServiceIntro(
  service: ServiceSEOContent,
  city: CityData,
  localFact?: string,
): string {
  const override = getCityServiceCopy(service.slug, city.slug);
  if (override) return override.intro;
  const county = getCountyLabel(city.county);
  const fact = localFact
    ? ` ${localFact}`
    : ` We work throughout ${city.name} and the surrounding ${county} area, for the service you are requesting.`;
  return `Need ${service.name.toLowerCase()} in ${city.name}, Idaho?${fact} Boise Handyman Co reviews your repair details before preparing a quote and discussing scheduling. Call, text or send a repair request.`;
}

export function getCityServiceFaqs(service: ServiceSEOContent, city: CityData): FAQItem[] {
  const override = getCityServiceCopy(service.slug, city.slug);
  if (override) return override.faqs;
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
    ...service.faqs.filter((faq) => !costSentence || !/^how much\b/i.test(faq.question)).slice(0, 2),
    {
      question: `Do you serve ${city.name}?`,
      answer: `Yes. ${city.name} is part of our core service area, along with the rest of ${county} and the Treasure Valley. Where you live in the service area never inflates the quote.`,
    },
    {
      question: `How do I get a quote for ${service.name.toLowerCase()} in ${city.name}?`,
      answer: `Call or text to discuss the repair, or send details and optional photos through the inquiry form. The team reviews the scope and confirms the quote and scheduling before work is agreed.`,
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
                label: 'Request a repair estimate',
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
        ...(city.slug === 'kuna' || city.slug === 'caldwell'
          ? ['Indian Creek is the creek that runs through Kuna, Nampa, and Caldwell. Indian Creek Plaza is in Caldwell.']
          : []),
        landmarks.length
          ? `As a local team that knows ${city.name} landmarks like ${landmarks.slice(0, 3).join(', ')}, scheduling is straightforward: we quote a real arrival time, confirm before heading out, and never add a travel surcharge.`
          : `As a local team, scheduling is straightforward: we quote a real arrival time, confirm before heading out, and never add a travel surcharge.`,
      ],
    },
    {
      heading: `Scheduling ${serviceLC} in ${county}`,
      paragraphs: [
        `Send your ${serviceLC} request and service address in ${county}. Timing and the number of visits depend on the scope, materials and access. Include any requested dates; availability is confirmed by the team after review.`,
        seo?.climate
          ? `The local ${seo.climate} is hard on homes: caulk and exterior seals crack with freeze-thaw cycles, doors swell and shrink with the seasons, and gutters need attention before winter. We plan the work, and the materials, around that reality.`
          : `The Treasure Valley climate is hard on homes: caulk cracks with freeze-thaw cycles, doors swell and shrink with the seasons, and gutters need attention before winter. We plan the work around that reality.`,
      ],
      links: [
        { label: `Handyman services in ${city.name}`, href: `/areas/${city.slug}` },
        { label: `All ${service.name.toLowerCase()} details`, href: `/services/${service.slug}` },
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
    getCityLocalSection(city, service.name),
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
      'Every job gets one upfront written quote before any work starts, priced by the time it takes with a one-hour minimum. Materials appear as their own line at cost, and bundling several tasks into one visit is the best value.',
  },
  {
    question: 'Do you handle remodels or large projects?',
    answer:
      'No. Full remodels, additions, and anything needing a general contractor or major permits are outside our scope. We stick to small jobs done well, and we are glad to refer larger projects to contractors we trust.',
  },
  {
    question: 'How do I get started?',
    answer:
      'Call or text us, use the online estimator for a preliminary planning range, or send your task list with photos through the contact form. We reply within one business day with an upfront quote.',
  },
];

function appendNewFaqs(base: FAQItem[], extra: FAQItem[]): FAQItem[] {
  const seen = new Set(base.map((faq) => faq.question));
  return [...base, ...extra.filter((faq) => !seen.has(faq.question))];
}

/**
 * Visible area-page FAQs. Published city copy stays first, in its original
 * order. The two city-only questions are appended. FAQPage schema must use
 * this same array.
 */
export function areaPageFaqs(city: CityData): FAQItem[] {
  const published = getAreaCityCopy(city.slug)?.faqs;
  const base = published ?? [
    ...AREA_PAGE_FAQS,
    {
      question: `Do you serve ${city.name}, Idaho?`,
      answer: `Yes. ${city.name} is part of our core Treasure Valley service area. We handle small repairs, installs, and maintenance across the city, with the same upfront quotes and pricing as everywhere else we work.`,
    },
  ];
  return appendNewFaqs(base, getCityOnlyFaqs(city));
}

/** Visible service-city FAQs. Published service copy stays first; city-only questions follow. */
export function cityServicePageFaqs(service: ServiceSEOContent, city: CityData): FAQItem[] {
  return appendNewFaqs(getCityServiceFaqs(service, city), getCityOnlyFaqs(city, service.name));
}

export const HOMEPAGE_FAQS_FOR_SCHEMA: FAQItem[] = [
  {
    question: 'What does a handyman cost in the Treasure Valley?',
    answer:
      'Treasure Valley handyman rates typically run $60 to $120 per hour. Boise Handyman Co quotes every job upfront as one written price, with visits starting around $145 and no work scheduled before you approve the number.',
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
