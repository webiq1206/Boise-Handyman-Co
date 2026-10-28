export interface HomepageFaq {
  q: string;
  a: string;
  /** Anchor for answers that point at this question. */
  id?: string;
}

/**
 * How many FAQs FAQSection renders by default before "Show all" - the
 * FAQPage schema (components/seo/HomePageSchema.tsx) must mark up only this
 * many, since the rest aren't in the page's HTML until that button is
 * clicked. Lives here (not in the client component) so a server component can
 * import it without crossing the client/server boundary.
 */
export const INITIAL_FAQ_COUNT = 9;

/**
 * Homepage FAQ set. These feed FAQPage schema, so answers lead with the direct
 * response before adding context.
 *
 * D4: do not explain hourly pricing without publishing the rate. Lead with the
 * written-quote promise, materials at cost, and no trip fee.
 */
export const HOMEPAGE_FAQS: HomepageFaq[] = [
  {
    q: "How is a Boise handyman visit priced?",
    a: "You get one written price before work starts, usually within one business day of sending photos. Materials are billed at cost on their own line. There is a one-hour minimum per visit and no trip fee in Ada and Canyon County. Bundling several tasks into one visit is usually the best value. Work that needs a general contractor or a licensed trade is referred out honestly.",
  },
  {
    id: "handyman-cost",
    q: "How much does a handyman cost in Boise and the Treasure Valley?",
    a: "Every job gets a written quote from your list and photos before work starts. A single faucet swap is usually about one hour plus the faucet; a four-item list like a door, a patch, a faucet and a TV mount is usually about a half day. Materials stay on their own line at cost, with no trip fee in Ada and Canyon County.",
  },
  {
    q: "How soon can you come?",
    a: "Share your requested dates with your repair list. We usually schedule within a few business days after the quote is approved; say if it is urgent and we will tell you the soonest honest slot. We are not an emergency service, so for active water leaks shut off the supply valve first, and for anything dangerous call the appropriate emergency line before calling us.",
  },
  {
    q: "What areas do you serve?",
    a: "We serve the Treasure Valley: Boise, Meridian, Eagle, Nampa, Kuna, Star, Middleton, Garden City, and Caldwell, along with the surrounding areas of Ada and Canyon County. The same pricing applies across the whole service area, so where you live never inflates the quote. If you sit just outside these areas, reach out anyway and we will tell you honestly whether we can take the job.",
  },
  {
    q: "How do quotes work?",
    a: "Send us the task, ideally with a photo or two, and we reply with a written quote: one clear price for the work and any materials as their own line. You approve the number before anything is scheduled. If we open something up and find more than expected, we stop and agree a revised price with you before continuing.",
  },
  {
    q: "Who supplies the materials?",
    a: "Either of us, whichever you prefer. Many customers buy their own fixture, paint, or hardware and have it ready when we arrive. If you would rather not, we pick up materials on the way and list them on the invoice at store cost. We also carry common parts on the truck, so small jobs rarely wait on a store run.",
  },
  {
    q: "Is there a trip fee?",
    a: "No. There is no trip fee in Ada and Canyon County. A one-hour minimum applies per visit, and materials are billed at cost on their own line.",
  },
  {
    q: "Are you a registered contractor and insured?",
    a: "Plumbing, electrical and HVAC work on your list is done by the licensed trade partners we schedule and stand behind, inside the same written quote and the same visit plan. Drywall, doors, mounting, fences, decks, caulk, assembly and hardware are our crew's own work. We are an Idaho Registered Contractor #8381215, bonded, and insured.",
  },
  {
    q: "Do you handle big remodels or additions?",
    a: "No. Kitchen and bathroom remodels, additions, basement finishes, re-roofs, and anything needing a general contractor or major permits are outside our scope on purpose. We do small jobs well: repairs, installs, and maintenance that take one to eight hours. When your project is bigger than that, we will say so plainly and refer you to a contractor we would use on our own house.",
  },
  {
    q: "What kinds of jobs do you take on?",
    a: "Drywall patching and texture blending, room and trim painting, carpentry and door repair, TV mounting and furniture assembly, fence, deck, and gutter repairs, and caulking, weatherproofing, and punch lists. Plumbing, electrical and HVAC items on the same list are scheduled with licensed trade partners we stand behind. If it is a small job a homeowner would rather not do themselves, it is probably on our list.",
  },
  {
    q: "Do you take cards and when is payment due?",
    a: "Yes. Card, check and electronic payments are accepted. Pay when the work is done, not before. Standard small jobs do not require a deposit.",
  },
  {
    q: "How long is the workmanship guarantee?",
    a: "One year on our workmanship. If something we repaired or installed fails because of how we did the work, rather than normal wear, misuse, or a pre-existing condition, tell us and we come back to make it right. Materials carry their manufacturers' warranties, which we pass through on anything we supply. See the full terms on our warranty page.",
  },
];
