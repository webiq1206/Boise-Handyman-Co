import type { GuidePageData } from '../../guideContent';

// Every task price below is the instant estimator's preliminary range for one
// stated job (owner instruction, 20 November 2026): see
// shared/content/p5PublishedFigures.json and tests/p5-published-figures.test.ts.
// No market hourly band is stated. Our own pricing is case by case after scope
// review (owner decision D6, 8 November 2026).

export const boiseHomeRepairCostGuide: GuidePageData = {
  slug: 'boise-home-repair-cost-guide',
  // The complete per-job cost guide. Hourly rates and visit minimums belong to
  // /blog/handyman-prices-boise; the two link to each other.
  title: 'The complete Boise home repair cost guide',
  seoTitle: 'Boise Home Repair Costs: Complete Guide',
  metaDescription:
    'Boise home repair costs for 2026, job by job: planning prices for drywall, plumbing, electrical, carpentry and paint, and how to compare two quotes fairly.',
  excerpt:
    'The complete picture of what small home repairs cost in the Treasure Valley: typical ranges by job, how hourly and flat-rate pricing differ, why quotes vary, and how to tell a fair price from a padded one.',
  hubSlug: 'costs-and-hiring',
  guideType: 'hub-pillar',
  author: 'Boise Handyman Co',
  publishedAt: '2026-06-20',
  updatedAt: '2026-11-20',
  tags: ['cost', 'handyman rates', 'home repair', 'pricing', 'boise', 'treasure valley'],
  primaryKeyword: 'home repair cost boise',
  quickAnswer:
    'In our instant estimate (November 2026), replacing one outlet or switch comes to a preliminary $150 to $170, replacing one faucet you supply $250 to $290, and one small drywall patch $130 to $150. Small jobs on one list cost less than the same jobs booked one at a time, because they share the visit. We price each job case by case after reviewing the scope, and you get a written price before we arrive.',
  keyTakeaways: [
    'Our instant estimate gives a preliminary range for each common repair: one outlet or switch $150 to $170, one faucet you supply $250 to $290, one small drywall patch $130 to $150 (November 2026).',
    'Flat-rate quotes beat open-ended hourly billing for defined jobs, because the risk of a slow afternoon sits with the pro, not with you.',
    'Minimum service charges exist because travel, setup, and cleanup cost the same whether the job takes twenty minutes or two hours.',
    'Bundling several small jobs into one visit is the single most effective way to lower your cost per task.',
    'Materials are usually billed separately from labor: ask which side of the line your quote sits on before comparing it to another.',
    'A quote far below market usually means the scope is smaller than you think, not that you found a bargain.',
    'Big jobs, re-roofs, panel swaps, additions, belong with licensed specialty contractors, and an honest handyman says so.',
  ],
  linkedClusterSlugs: ['what-small-home-repairs-cost-boise', 'handyman-red-flags'],
  linkedServices: ['drywall-repair', 'plumbing-repairs', 'electrical-repairs', 'carpentry-trim-repair'],
  linkedCities: ['boise', 'meridian', 'eagle', 'nampa'],
  relatedLinks: [
    { url: '/blog/handyman-prices-boise', anchor: 'Handyman prices in Boise: hourly rates and job prices' },
    { url: '/guides/hire-a-handyman-treasure-valley', anchor: 'How to hire a handyman in the Treasure Valley' },
    { url: '/guides/first-time-homeowner-repair-handbook', anchor: "The first-time homeowner's repair handbook" },
    { url: '/services/drywall-repair', anchor: 'Drywall Repair & Patching' },
    { url: '/services/plumbing-repairs', anchor: 'Minor Plumbing Repairs' },
    { url: '/services/electrical-repairs', anchor: 'Minor Electrical Repairs' },
    { url: '/blog/category/costs-and-hiring', anchor: 'Costs & hiring articles' },
    { url: '/contact', anchor: 'Contact' },
  ],
  faqs: [
    {
      question: 'How much does a handyman cost in Boise?',
      answer:
        'It depends on the job, so we publish what our instant estimate shows for one stated job rather than a market hourly average. In November 2026 it puts replacing one outlet or switch at a preliminary $150 to $170, replacing one faucet you supply at $250 to $290, one small drywall patch at $130 to $150, and adjusting one sticking door at $150 to $170. Small jobs on one list cost less than booking them one at a time: two outlets or switches on the same visit come to $300 to $340. Many pros, us included, quote small jobs as a flat price rather than an hourly rate.',
    },
    {
      question: 'Why do handymen charge a minimum service fee?',
      answer:
        'Because the fixed costs of a visit, driving to your house, loading the right tools and materials, setting up, and cleaning up, are the same whether the repair takes twenty minutes or two hours. A minimum charge covers that overhead, which is why one small job on its own, such as replacing one outlet or switch, comes to a preliminary $150 to $170 in our instant estimate. The practical response is to batch several small tasks into one visit, which spreads the fixed cost across all of them.',
    },
    {
      question: 'Is it cheaper to pay hourly or get a flat-rate quote?',
      answer:
        'For a defined job, a flat rate is usually better for you. It puts the risk of the job running long on the professional, and it lets you compare quotes directly. Hourly billing makes sense for open-ended work like a punch list where nobody knows the full scope until it starts. Be wary of a low hourly rate with no estimate of hours, because the rate is not the price.',
    },
    {
      question: 'What does drywall repair cost in Boise?',
      answer:
        'In our instant estimate (November 2026), one small patch under 6 inches comes to a preliminary $130 to $150, and one medium patch of 1 to 2 square feet $230 to $270. Larger repairs, such as a ceiling section after a leak, are priced from your photos once a person has seen the damage. Matching the existing texture is usually the part that separates a good patch from an obvious one.',
    },
    {
      question: 'How much do small plumbing repairs cost?',
      answer:
        'Our instant estimate (November 2026) gives these preliminary ranges for one of each job: replacing a faucet you supply $250 to $290, fixing a running toilet $190 to $230, replacing a garbage disposal you supply $180 to $210, and replacing a toilet you supply $290 to $330. A slow drain is not on its list, so send it with your request and photos. Anything involving the main line, a repipe, or work behind walls belongs with a licensed plumber, and we say so when that is the case.',
    },
    {
      question: 'What do small electrical repairs cost?',
      answer:
        'Our instant estimate (November 2026) gives these preliminary ranges for one of each job: replacing an outlet or switch $150 to $170, replacing a GFCI outlet $180 to $210, swapping a light fixture you supply $180 to $210, and installing a ceiling fan on an existing fan-rated box $260 to $300. Panel work, new circuits, and service upgrades require a licensed electrician, which is outside handyman scope.',
    },
    {
      question: 'Why are two quotes for the same repair so different?',
      answer:
        'Usually because they cover different scopes. One quote includes materials, paint, texture matching, and haul-away; the other covers labor only. Before comparing totals, confirm what each includes: materials or labor only, how surprises are handled, whether cleanup and disposal are in, and whether the number is a firm quote or an estimate. A very low number usually describes a smaller job, not a better price.',
    },
    {
      question: 'When is a job too big for a handyman?',
      answer:
        'When it needs a specialty license, a significant permit, or more than a day or two of work: re-roofs, HVAC replacement, repipes, electrical panel swaps, additions, and structural changes all qualify. Handyman work is the one-to-eight-hour job done right. A good handyman tells you when your project has outgrown the category and points you toward the right contractor rather than attempting it.',
    },
    {
      question: 'Do I have to buy the materials myself?',
      answer:
        'Either way works. Supplying materials yourself gives you control over exact fixtures and finishes, and it is common for things like faucets, fans, and light fixtures where taste matters. Letting the handyman supply commodity materials, drywall compound, caulk, screws, lumber for a repair, is usually faster and only marginally different in cost. Just confirm which model your quote assumes.',
    },
    {
      question: 'How can I keep small-repair costs down?',
      answer:
        'Three habits do most of the work. Batch tasks so one visit handles five jobs instead of five visits handling one each. Fix things early, because re-caulking a tub or shower, a preliminary $240 to $280 in our instant estimate, is cheaper than the drywall and subfloor repair a slow leak causes. And get a written flat-rate quote for defined work so the price is settled before anyone starts.',
    },
  ],
  content: `
<h2 id="the-honest-answer">What home repairs cost in Boise</h2>
<p><strong>In our instant estimate, one small drywall patch comes to a preliminary $130 to $150, one faucet you supply $250 to $290, and one sticking door $150 to $170 (November 2026).</strong> A drywall patch, a faucet swap, a sticking door, a ceiling fan install: these are one-to-three-hour jobs, and the table below gives the instant estimate's preliminary range for each, so you can sanity-check any quote against it. Our own jobs are priced case by case after we review the scope, and the written price is on the table before anyone is in your hallway.</p>
<p>This guide covers the typical cost of the repairs people actually call about, how handyman pricing models work and which one favors you, why two quotes on the same job can be far apart, and where the line sits between a handyman job and a licensed-contractor job. If you want the short version for a specific repair, the ranges by job type are in the tables below, and <a href="/blog/what-small-home-repairs-cost-boise">what small home repairs cost in Boise</a> keeps a running list. For hourly rates, visit minimums and how a handyman prices one job, see <a href="/blog/handyman-prices-boise">handyman prices in Boise</a>.</p>

<h2 id="how-pricing-works">How handyman pricing works: hourly, flat rate, and minimums</h2>
<p><strong>There are three pricing models in this market, and the one your quote uses matters more than the headline number.</strong> Hourly billing charges a rate for however long the work takes. Flat-rate pricing names one number for a defined job. And nearly everyone carries a minimum service charge, because driving to your house, unloading tools, and cleaning up costs the same whether the repair takes twenty minutes or two hours.</p>
<p>For a defined repair, flat rate is the model that favors you. The risk of the job running long sits with the professional, the price is comparable across quotes, and there is no incentive for the afternoon to stretch. Hourly makes sense for genuinely open-ended work, a punch list where the scope reveals itself as the list gets worked, but an hourly rate quoted without an estimate of hours is not a price, it is a meter. Ask for the estimated total either way.</p>

<h2 id="typical-costs">Typical repair costs by job</h2>
<p><strong>These are the preliminary ranges our instant estimate gives for one of each job on its own, as of November 2026.</strong> Fixtures and products you supply are not included. Your job may sit outside them for good reasons, access, finishes, surprises behind the wall, and a quote far outside them deserves an explanation.</p>
<table>
<thead><tr><th>Repair, one of each</th><th>Preliminary range</th></tr></thead>
<tbody>
<tr><td>Small drywall patch, under 6 inches</td><td>$130 to $150</td></tr>
<tr><td>Medium drywall patch, 1 to 2 square feet</td><td>$230 to $270</td></tr>
<tr><td>Adjust a sticking door</td><td>$150 to $170</td></tr>
<tr><td>Replace a faucet you supply</td><td>$250 to $290</td></tr>
<tr><td>Fix a running toilet</td><td>$190 to $230</td></tr>
<tr><td>Replace a garbage disposal you supply</td><td>$180 to $210</td></tr>
<tr><td>Replace an outlet or switch</td><td>$150 to $170</td></tr>
<tr><td>Swap a light fixture you supply</td><td>$180 to $210</td></tr>
<tr><td>Install a ceiling fan on an existing fan-rated box</td><td>$260 to $300</td></tr>
<tr><td>Re-caulk a tub or shower</td><td>$240 to $280</td></tr>
<tr><td>Repair fence boards, one section</td><td>$330 to $380</td></tr>
<tr><td>Replace a fence post</td><td>$300 to $340</td></tr>
<tr><td>Clean gutters, one-story home</td><td>$170 to $200</td></tr>
<tr><td>Paint a room, walls, about 12 x 12 ft</td><td>$550 to $620</td></tr>
</tbody>
</table>
<p>These are preliminary ranges, not quotes, and small jobs on a longer list can cost less each because the visit is shared. TV mounting, slow drains and other jobs that are not on the instant estimate's list are priced from your request and photos. We price each job case by case after reviewing the scope, for <a href="/services/drywall-repair">drywall repair</a>, <a href="/services/plumbing-repairs">minor plumbing</a>, <a href="/services/electrical-repairs">minor electrical</a>, <a href="/services/carpentry-trim-repair">carpentry and trim</a>, <a href="/services/painting-touch-ups">painting</a>, and <a href="/services/mounting-assembly">mounting and assembly</a> alike. Every job gets a written price before work starts.</p>

<h2 id="what-moves-the-number">What actually moves the price of a small repair</h2>
<p><strong>Five things move a repair from the bottom of its range to the top: access, matching, surprises, materials, and trip count.</strong> Access means how hard the work is to reach, a ceiling patch over a stairwell costs more than the same patch at shoulder height. Matching means blending new work into old: texture on drywall, sheen on paint, stain on trim, and it is usually the difference between a repair you can find and one you cannot. Surprises are what the wall reveals when it opens, soft subfloor under a toilet, a previous owner's creative wiring. Materials matter when you choose them: a $400 faucet installs for the same labor as a $90 one, but the total is different. And trip count matters because every separate visit carries the same fixed overhead.</p>
<p>None of these are padding. They are the honest reasons identical-sounding jobs price differently, and a pro who asks questions about them before quoting is pricing your job rather than guessing at an average.</p>

<h2 id="batching">The cheapest repair is the one that shares a trip</h2>
<p><strong>Bundling several small tasks into one visit is the single most effective way to lower your cost per job.</strong> The minimum service charge and the travel overhead get spread across everything on the list, and a pro who is already set up with tools out works through task two and three far faster than a cold start. In our instant estimate, nine jobs on one list (a faucet, two light fixtures, three outlets or switches, two small drywall patches and a sticking door) come to a preliminary $1,480 to $1,670, less than the same jobs priced one at a time.</p>
<p>Keep a running list on the fridge or in your phone. When it reaches three or four items, that is a service call. This is exactly what our <a href="/services/home-maintenance">home maintenance and punch-list service</a> is built around, and it is the pattern our repeat clients settle into: one visit a season, list in hand.</p>

<h2 id="comparing-quotes">How to compare two quotes honestly</h2>
<p><strong>Before you compare totals, confirm the two quotes describe the same job.</strong> The usual differences hide in four places: whether materials are included or labor only, whether prep and finish work is in scope (paint after the patch, texture after the paint, haul-away after the demo), how surprises are handled once the wall is open, and whether the number is a firm quote or an estimate that can drift. A quote that is dramatically lower than the others is almost always describing a smaller scope, not a better price.</p>
<p>The questions that surface all of this, plus how to check reviews, insurance, and licensing where it applies, are covered in <a href="/guides/hire-a-handyman-treasure-valley">how to hire a handyman in the Treasure Valley</a> and in <a href="/blog/handyman-red-flags">handyman red flags</a>. Ten minutes of asking beats a month of regretting.</p>

<h2 id="diy-or-pro">DIY or call someone: the honest arithmetic</h2>
<p><strong>The DIY question is not whether you can, it is what your time, tools, and redo risk actually cost.</strong> Swapping a switch plate, tightening a hinge, re-caulking a tub: genuinely easy, and a homeowner with a free hour should do them. A texture-matched drywall patch, a fan on an unfamiliar box, a faucet in a corroded sink: doable, but the tool purchases plus the learning curve plus the risk of doing it twice often add up to more than having it done once: our instant estimate puts a faucet you supply at a preliminary $250 to $290 and a small drywall patch at $130 to $150. Water and electricity raise the stakes further, because the cost of getting those wrong is not the repair, it is the damage.</p>
<p>Our rule of thumb: if the job needs a tool you would use once, touches water or wiring, or has to look invisible when finished, price it out before you burn a Saturday on it. The full task-by-task breakdown of what is safe to DIY lives in <a href="/guides/first-time-homeowner-repair-handbook">the first-time homeowner's repair handbook</a>.</p>

<h2 id="deferred-repairs">What waiting costs: the deferred-repair multiplier</h2>
<p><strong>Small problems in a house do not stay small, and the gap between the early fix and the late one is routinely large.</strong> Re-caulking a shower, a preliminary $240 to $280 in our instant estimate, prevents a far larger repair of the wall behind it. Fixing a running toilet, $190 to $230, prevents months of inflated water bills. Cleaning a one-story home's gutters in the fall, $170 to $200, prevents the ice-dam and fascia damage that costs far more to put right in the spring. Water is the repeat offender in every version of this story: almost everything expensive in a house starts as something cheap that involved water and got ignored.</p>
<p>This is the economic case for a maintenance rhythm rather than a crisis rhythm, and it is the argument of <a href="/guides/boise-home-maintenance-guide">the complete Boise home maintenance guide</a>: a season-by-season checklist is inexpensive to work through and reliably prevents far larger repairs.</p>

<h2 id="out-of-scope">Jobs that are not handyman jobs, and what they cost instead</h2>
<p><strong>Some work needs a licensed specialty contractor, and a quote from anyone else is a red flag, not a deal.</strong> Re-roofs, HVAC replacement, whole-house repipes, electrical panel swaps and new circuits, additions, structural changes, and anything requiring engineered plans or major permits sit outside handyman scope in Idaho. Those projects carry permits and inspections, and they belong with contractors who do that work all day.</p>
<p>We stay on our side of that line on purpose. When your project crosses it, we say so at the quote stage and point you in the right direction, because the fastest way to lose a client's trust is to attempt a specialist's job with a generalist's toolkit. What we can tell you is <a href="/resources/ada-canyon-permit-flow">when a repair needs a permit in Ada and Canyon County</a>, which is a shorter list than most people fear.</p>

<h2 id="our-model">How we price: flat quotes, one trip, no surprises</h2>
<p><strong>We price small jobs case by case after reviewing the scope, and you get a written price before any work starts.</strong> You describe the job, ideally with a photo or two, we quote it before we arrive, and the price does not move unless the scope does, in which case you approve the change before the work happens. Most jobs are done in one visit because we show up with the materials the photos told us to bring.</p>
<p>That model exists because it is the one we would want as customers: no meter running, no mystery invoice, no third visit. <a href="/contact">Send us your list</a>, or read <a href="/guides/hire-a-handyman-treasure-valley">how to vet anyone you hire</a>, including us, before you book.</p>

<h2 id="materials">Materials: who buys them, and where the money hides</h2>
<p><strong>On most small repairs, labor is the majority of the bill, but materials are where quotes quietly diverge, so pin down three things: who buys them, what grade is assumed, and how they are billed.</strong> Commodity materials, drywall compound, caulk, screws, a stick of matching trim, are usually cheapest and fastest when the pro supplies them, because they are already on the truck and the markup, where there is one, is smaller than the cost of your errand to buy the wrong size. Choice materials are different: faucets, fans, light fixtures, and door hardware span a tenfold price range on taste alone, and supplying your own is common and sensible, provided it is on site and correct before the visit, a missing part is how one-trip jobs become two-trip jobs.</p>
<p>The grade assumption is the subtle one. A quote that includes "a faucet" might mean a $90 builder-grade unit or assume you are providing the $400 one you actually want, and two quotes with different assumptions are not comparable until you make them so. Our quotes name the assumption explicitly: either the fixture is yours to supply, or the quoted line says exactly what we are bringing. Ask for the same clarity from anyone, and the mystery gap between competing bids usually closes on the spot.</p>

<h2 id="around-the-valley">Do repair costs differ around the Treasure Valley?</h2>
<p><strong>Labor and materials cost the same across the valley, so the per-job ranges in this guide hold from Boise to Caldwell; what changes by area is what the housing stock needs.</strong> In Boise's older North End and Bench neighborhoods, the work skews toward plaster patching, door and window easing, and gutter duty under mature trees, and matching old finishes can put a job toward the top of its range. In Meridian, Kuna, and Star, where most homes are subdivision builds from the last thirty years, the list is settling repairs and builder-grade part swaps, highly predictable and usually mid-range. Eagle's larger homes carry more trim, deck, and fence per house, so lists run longer even when each item is ordinary. Nampa and Caldwell span both worlds, century homes near their downtowns and brand-new phases at their edges, and Middleton adds acreage properties where batching several jobs into one trip matters most.</p>
<p>The area-by-area detail, including what each housing stock reliably needs, lives in our city guides: <a href="/guides/boise-handyman-guide">Boise</a>, <a href="/guides/meridian-handyman-guide">Meridian</a>, <a href="/guides/eagle-handyman-guide">Eagle</a>, <a href="/guides/nampa-handyman-guide">Nampa</a>, <a href="/guides/kuna-handyman-guide">Kuna</a>, <a href="/guides/star-handyman-guide">Star</a>, <a href="/guides/middleton-handyman-guide">Middleton</a>, and <a href="/guides/caldwell-handyman-guide">Caldwell</a>. One pricing note that does hold everywhere: there is no discount for being in Canyon County and no premium for being in Ada. A faucet swap is a faucet swap on both sides of the county line.</p>

<h2 id="timing">When to book: timing, seasons, and emergencies</h2>
<p><strong>Small-repair pricing is steady year-round, but availability is not, and the calendar has two pressure points worth planning around.</strong> The first is fall: from late September to the first hard freeze, everyone in the valley wants gutters cleaned, caulk renewed, and sprinklers blown out in the same six-week window, and schedules fill. Booking fall maintenance in early September buys you the same work with none of the scramble. The second is the day after a windstorm, when every leaning fence in Kuna and Star calls at once. If your fence was already marginal in the spring, fixing it then beats joining the post-storm queue.</p>
<p>Emergency and after-hours work is the one place small-job pricing genuinely jumps, across the whole market, because someone is leaving dinner to stand in your crawl space. The good news is that very few home problems are true emergencies once you know your shutoffs: close the valve, and a burst-hose crisis becomes a normal appointment. The list of what actually cannot wait, and what can, is in <a href="/guides/first-time-homeowner-repair-handbook">the first-time homeowner's repair handbook</a>. Winter, for what it is worth, is the quiet season and the best time to book interior work: patching, painting, caulking, and the accumulated indoor list get the fastest scheduling of the year.</p>

<h2 id="next-steps">Turning a range into a number</h2>
<p><strong>The way out of a range is a description of your actual job: what is broken, where it is, and a photo of it.</strong> That is enough for a firm quote on most small repairs, without a site visit and without an obligation. <a href="/contact">Send us the list and the photos</a> and we will send back a flat price and the earliest slot we can do it in. If the honest answer is that your project needs a licensed specialty contractor instead of us, we will tell you that too, and you will have lost nothing but five minutes.</p>
`.trim(),
};
