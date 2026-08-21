export interface HomepageFaq {
  q: string;
  a: string;
}

/**
 * How many FAQs FAQSection renders by default before "Show all" - the
 * FAQPage schema (components/seo/HomePageSchema.tsx) must mark up only this
 * many, since the rest aren't in the page's HTML until that button is
 * clicked. Lives here (not in the client component) so a server component can
 * import it without crossing the client/server boundary.
 */
export const INITIAL_FAQ_COUNT = 8;

/**
 * Homepage FAQ set. These feed FAQPage schema, so answers lead with the direct
 * response before adding context.
 *
 * Our own dollar figures (visit minimums, starting prices) are placeholders
 * pending owner sign-off: [NEEDS: real pricing confirmation]. Market ranges
 * ($60-$120/hour) are editorial context, not our quote. The internal rate
 * model (trip fee + hourly) is deliberately not published.
 */
export const HOMEPAGE_FAQS: HomepageFaq[] = [
  {
    q: "How much does a handyman cost in Boise and the Treasure Valley?",
    a: "Treasure Valley handyman rates typically run $60 to $120 per hour, with many companies adding a service call or minimum charge on top. We keep it simple: one written price for the visit, quoted upfront before any work starts. Most single-task visits start around $99 to $149, and materials appear on the quote as their own line at what they cost. Because extra tasks only add the time they take, bundling several small tasks into one appointment is the best value.",
  },
  {
    q: "How quickly can you get to my job?",
    a: "We reply to every new request within one business day, and most jobs are scheduled within the week. Because we quote from photos before we come out, the visit itself is spent doing the work rather than looking at it. If your job is urgent, say so when you reach out and we will tell you honestly what the soonest slot is. We are not an emergency service, so for active water leaks, shut off the supply valve first, and for anything dangerous call the appropriate emergency line before calling us.",
  },
  {
    q: "What areas do you serve?",
    a: "We serve the Treasure Valley: Boise, Meridian, Eagle, Nampa, Kuna, Star, Middleton, and Caldwell, along with the surrounding areas of Ada and Canyon County. The same pricing applies across the whole service area, so where you live never inflates the quote. If you sit just outside these areas, reach out anyway and we will tell you honestly whether we can take the job.",
  },
  {
    q: "How do quotes work?",
    a: "Send us the task, ideally with a photo or two, and we reply with a written upfront quote: one clear price for the work, the expected time, and any materials as their own line. You approve the number before anything is scheduled. If we open something up and find more than expected, we stop and agree a revised price with you before continuing, so the final bill is never a surprise.",
  },
  {
    q: "Who supplies the materials?",
    a: "Either of us, whichever you prefer. Many customers buy their own fixture, paint, or hardware and have it ready when we arrive, which works perfectly. If you would rather not, we pick up materials on the way and list them on the invoice at store cost plus the pickup time. We also carry common parts on the truck, washers, anchors, caulk, supply lines, and fasteners, so small jobs rarely wait on a store run.",
  },
  {
    q: "Is there a minimum job size?",
    a: "Yes. Every visit carries a practical minimum, so a single small task starts around $99. No job is too small, the minimum just means a lone picture-hanging costs more per minute than a morning of tasks. That is why we encourage a list: the second, third, and fourth tasks in the same visit only cost the additional time.",
  },
  {
    // Deliberately claims nothing: [NEEDS: confirm insurance/bond status and
    // Idaho registration details before strengthening this answer].
    q: "Are you licensed and insured?",
    a: "We keep our work within the scope Idaho allows for handyman services and refer anything that requires a licensed plumbing, electrical, or HVAC contractor to licensed specialists we trust. Business registration and insurance details are available on request, and we are happy to answer any question about coverage before you book.",
  },
  {
    q: "Do you handle big remodels or additions?",
    a: "No. Kitchen and bathroom remodels, additions, basement finishes, re-roofs, and anything needing a general contractor or major permits are outside our scope on purpose. We do small jobs well: repairs, installs, and maintenance that take one to eight hours. When your project is bigger than that, we will say so plainly and refer you to a contractor we would use on our own house.",
  },
  {
    q: "What kinds of jobs do you take on?",
    a: "Drywall patching and texture blending, room and trim painting, minor plumbing fixes like faucets, toilets, and disposals, minor electrical swaps like outlets, fixtures, and ceiling fans, carpentry and door repair, TV mounting and furniture assembly, fence, deck, and gutter repairs, and caulking, weatherproofing, and punch lists. If it is a small job a homeowner would rather not do themselves, it is probably on our list.",
  },
  {
    q: "Do you guarantee your work?",
    a: "We stand behind our workmanship. If something we repaired or installed fails because of how we did the work, rather than normal wear, misuse, or a pre-existing condition, tell us and we come back to make it right. Materials carry their manufacturers' warranties, which we pass through on anything we supply.",
  },
];
