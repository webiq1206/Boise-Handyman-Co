import { HOME_VISIBILITY_FAQS } from '@/shared/p5VisibilityCopy';

export interface HomepageFaq {
  q: string;
  a: string;
  /** Anchor for answers that point at this question. */
  id?: string;
}

/**
 * Homepage FAQ set. These feed FAQPage schema, so answers lead with the direct
 * response before adding context.
 *
 * Lead with the written quote. Do not add a rate, a fee, a visit length, or a
 * lead-time range.
 */
export const HOMEPAGE_FAQS: HomepageFaq[] = [
  {
    q: "How is a Boise handyman visit priced?",
    a: "You get one written price before work starts, after we review your list and photos. Bundling several tasks into one visit is usually the best value. Work that needs a general contractor or a licensed trade is referred out honestly.",
  },
  {
    id: "handyman-cost",
    q: "How much does a handyman cost in Boise and the Treasure Valley?",
    a: "Every job gets a written quote from your list and photos before work starts.",
  },
  {
    q: "How soon can you come?",
    a: "Share your requested dates with your repair list. We confirm availability after the quote is approved; say if it is urgent and we will tell you the soonest available slot. We are not an emergency service, so for active water leaks shut off the supply valve first, and for anything dangerous call the appropriate emergency line before calling us.",
  },
  {
    q: "What areas do you serve?",
    a: "We serve the Treasure Valley: Boise, Meridian, Eagle, Nampa, Kuna, Star, Middleton, Garden City, and Caldwell, along with the surrounding areas of Ada and Canyon County. If you sit just outside these areas, reach out anyway and we will tell you honestly whether we can take the job.",
  },
  {
    q: "How do quotes work?",
    a: "Send us the task, ideally with a photo or two, and we reply with a written quote: one clear price for the work and any materials as their own line. You approve the number before anything is scheduled. If we open something up and find more than expected, we stop and agree a revised price with you before continuing.",
  },
  {
    q: "Are you a registered contractor and insured?",
    a: "Plumbing, electrical and HVAC work on your list is done by the licensed trade partners we schedule and stand behind, inside the same written quote and the same visit plan. Drywall, doors, mounting, fences, decks, caulk, assembly and hardware are our crew's own work. We are an Idaho Registered Contractor #8381215 and insured.",
  },
  {
    q: "Who supplies the materials?",
    a: "Either of us, whichever you prefer. Many customers buy their own fixture, paint, or hardware and have it ready when we arrive. If you would rather not, we pick up materials on the way and list them on the invoice. We also carry common parts on the truck, so small jobs rarely wait on a store run.",
  },
  {
    q: "Do you handle big remodels or additions?",
    a: "No. Kitchen and bathroom remodels, additions, basement finishes, re-roofs, and anything needing a general contractor or major permits are outside our scope on purpose. We do small jobs well: repairs, installs, and maintenance. When your project is bigger than that, we will say so plainly and refer you to a contractor we would use on our own house.",
  },
  {
    q: "What kinds of jobs do you take on?",
    a: "Drywall patching and texture blending, room and trim painting, carpentry and door repair, TV mounting and furniture assembly, fence, deck, and gutter repairs, and caulking, weatherproofing, and punch lists. Plumbing, electrical and HVAC items on the same list are scheduled with licensed trade partners we stand behind. If it is a small job a homeowner would rather not do themselves, it is probably on our list.",
  },
  {
    q: "Do you take cards and when is payment due?",
    a: "Yes. Card, check and electronic payments are accepted. Pay when the work is done, not before.",
  },
  ...HOME_VISIBILITY_FAQS.map((faq) => ({ q: faq.question, a: faq.answer })),
];

/**
 * Every homepage question is in the first HTML response. FAQPage schema marks
 * up this same count, so the appended visibility questions stay in the single
 * FAQPage node and match the visible text.
 */
export const INITIAL_FAQ_COUNT = HOMEPAGE_FAQS.length;
