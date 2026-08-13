/**
 * City and neighborhood handyman guides, under the costs-and-hiring hub.
 *
 * These are assembled from a per-place data table rather than written as
 * standalone files, but the differentiating material is real prose written once
 * per place, not a template with the city name substituted in. That distinction
 * is the whole point: a location page earns its ranking by saying something
 * true about that place's housing stock and what it needs, and the housing
 * stock genuinely differs - a 1920s North End bungalow and a 2019 Meridian
 * subdivision home do not break in the same ways.
 *
 * The shared scaffolding below is deliberately thin - a coverage callout, a
 * services block, and a closing section - because everything that makes a page
 * worth reading has to come from the place-specific fields.
 *
 * Local claims here are limited to common knowledge about each area's housing
 * stock, climate, and geography. No invented job counts, clients, or projects.
 */
import type { GuidePageData } from '../guideContent';

interface PlaceGuide {
  slug: string;
  /** Place name as it appears in prose. */
  name: string;
  /** Area page slug this guide points at. Neighborhoods borrow their city's. */
  citySlug: string;
  county: 'ada' | 'canyon';
  guideType: 'location' | 'neighborhood';
  title: string;
  seoTitle: string;
  metaDescription: string;
  excerpt: string;
  quickAnswer: string;
  takeaways: string[];
  /** The housing stock and what it means for repairs. 2 paragraphs of HTML. */
  housingStock: string;
  /** The repairs and installs this stock typically needs. */
  commonRepairs: string;
  /** The local wrinkle that catches homeowners out here. */
  watchOut: string;
  /** Seasonal maintenance notes specific to this place. */
  seasonal: string;
  faqs: Array<{ question: string; answer: string }>;
}

const countyLabel = (c: 'ada' | 'canyon') => (c === 'ada' ? 'Ada County' : 'Canyon County');

const PLACES: PlaceGuide[] = [
  {
    slug: 'boise-handyman-guide',
    name: 'Boise',
    citySlug: 'boise',
    county: 'ada',
    guideType: 'location',
    title: 'Handyman Services in Boise',
    seoTitle: 'Handyman Services in Boise, Idaho',
    metaDescription:
      'Handyman services in Boise: repairs for North End and Bench-era homes, newer East Boise builds, seasonal maintenance, and flat upfront pricing.',
    excerpt:
      'Boise houses span a century of construction, and a 1920s North End bungalow needs a very different repair list from a 2015 build in Barber Valley.',
    quickAnswer:
      'We provide handyman services across Boise: drywall repair, minor plumbing and electrical, carpentry, painting, mounting, and seasonal maintenance, with flat quotes starting at $145. Boise’s housing spans a century, so the work ranges from plaster-era repairs in the North End to settling fixes in newer East Boise homes.',
    takeaways: [
      'Boise’s housing stock spans a century, and the repair list changes with the decade the house was built.',
      'Older neighborhoods bring plaster walls, original wood windows and doors, and mature trees that fill gutters fast.',
      'Mid-century Bench homes are solid but at the age where fixtures, caulk, and hardware all wear at once.',
      'Newer East and South Boise homes mostly need settling repairs, installs, and builder-grade part swaps.',
      'Old-house electrical and plumbing surprises are common: we handle minor repairs and tell you when a licensed trade is needed.',
    ],
    housingStock: `<p><strong>Boise is the rare Treasure Valley city where the age of the house tells you most of what will be on the repair list.</strong> The North End and East End hold homes from the early 1900s through the 1950s: plaster and lath walls, original wood windows and doors that have swelled and shrunk through a hundred summers, small garages, and mature trees overhead. The Bench neighborhoods add a broad band of mid-century houses, structurally settled and honestly built, but at the age where everything consumable, caulk, fixtures, hardware, water heaters, wears out in the same decade. Then Southeast Boise and the Barber Valley run right up to the present, where the issues are the ones new construction always has: settling cracks, builder-grade parts, and a list of installs the builder never included.</p>
<p>For a handyman, those are three different trades' worth of habits. Patching plaster is not patching drywall; easing a hundred-year-old door is not adjusting a hollow-core slab. We quote from photos partly because in Boise the photo tells us which century we are working in.</p>`,
    commonRepairs: `<p><strong>In the older neighborhoods the perennials are doors and windows that stick with the seasons, plaster cracks and corner damage, squeaky floors, worn cabinet hardware, and paint that needs regular attention on sun-facing sides.</strong> Mid-century Bench homes call us most for bathroom refresh work, re-caulking, fixture swaps, vanity hardware, running toilets, plus fence and gutter care under big trees. Newer East Boise homes are install country: TV mounting, shelving, ceiling fans, smart devices, and the first round of settling repairs, hairline drywall cracks and doors drifting out of square, usually in years one through three.</p>`,
    watchOut: `<p><strong>The Boise-specific trap is what old walls hide.</strong> Houses from the first half of the century can carry generations of amateur wiring and plumbing behind their plaster, and a simple fixture swap sometimes opens onto something that needs a licensed electrician or plumber rather than a handyman. We treat that moment honestly: we stop, show you what we found, and help you get the right trade in, rather than improvising on wiring that predates safety codes. It is the reason old-house owners want a handyman with firm scope boundaries.</p>`,
    seasonal: `<p><strong>Boise’s mature tree canopy makes fall gutter cleaning non-negotiable in the older neighborhoods, once after leaf drop at minimum.</strong> Spring is for checking what freeze-thaw did to fences, walks, and exterior paint; summer’s high-desert UV is hardest on the south-facing paint and trim of the older wood-clad homes, where touch-ups are protective rather than cosmetic. And in any Boise house past its thirtieth birthday, the fall weatherseal pass, caulk, weatherstripping, door sweeps, pays for itself in the first winter heating bill.</p>`,
    faqs: [
      {
        question: 'Do you work on older North End homes?',
        answer:
          'Yes, and they are some of our favorite work: plaster patching, door and window easing, hardware restoration, trim repair, and paint touch-ups suited to older construction. What we do not do is rewire or repipe them. When an old wall reveals wiring or plumbing that needs a licensed trade, we stop, show you, and help you line up the right specialist.',
      },
      {
        question: 'What do handyman services cost in Boise?',
        answer:
          'The same bands as the rest of the Treasure Valley: most single repairs run $100 to $500, market hourly rates run $60 to $120, and our services carry flat starting prices from $145. Older-home work sometimes sits toward the top of a range because matching plaster, old trim profiles, or aged paint takes more care than new drywall.',
      },
      {
        question: 'Can you handle repairs in newer East Boise homes?',
        answer:
          'Yes. Newer builds mostly need settling repairs, hairline drywall cracks, nail pops, doors drifting out of alignment, plus the install list: TV mounts, shelving, fans, and smart devices. If your builder warranty has expired, a one-visit punch list clears the accumulated small items at far less than booking them separately.',
      },
      {
        question: 'Do you do small jobs, or only big lists?',
        answer:
          'Both, though batching saves you money. A single repair is a normal call, but our minimum service charge covers the fixed cost of any visit, so three or four tasks in one trip cost far less per task. Most Boise clients keep a running list and call when it reaches a few items.',
      },
      {
        question: 'How quickly can you get to a Boise job?',
        answer:
          'Most small jobs are quoted from photos within a day and scheduled within the week, and we aim to finish in one trip by arriving with the materials the photos told us to bring. Send the list and photos through the contact page and we will reply with a flat quote and the earliest slot.',
      },
    ],
  },
  {
    slug: 'meridian-handyman-guide',
    name: 'Meridian',
    citySlug: 'meridian',
    county: 'ada',
    guideType: 'location',
    title: 'Handyman Services in Meridian',
    seoTitle: 'Handyman Services in Meridian, Idaho',
    metaDescription:
      'Handyman services in Meridian: settling repairs and builder-grade part swaps in subdivision homes, HOA-friendly exterior work, and flat upfront pricing.',
    excerpt:
      'Meridian is mostly subdivision homes built in the last thirty years, which means whole streets hit the same repair milestones at the same time.',
    quickAnswer:
      'We provide handyman services across Meridian: drywall and settling repairs, fixture and fan installs, caulking, fence and gutter care, and punch-list visits, with flat quotes starting at $145. Meridian’s subdivision homes were largely built in the last three decades, so builder-grade parts tend to wear out street by street, on schedule.',
    takeaways: [
      'Meridian’s housing stock is dominated by subdivision homes built from the 1990s onward.',
      'Builder-grade caulk, fixtures, and hardware wear out on a predictable clock, often across a whole street at once.',
      'Homes under five years old mostly need settling repairs; homes past fifteen need the first real replacement wave.',
      'HOA standards make fence, paint, and exterior upkeep a compliance matter as well as a maintenance one.',
      'Batching several small jobs into one visit is the cheapest way to run a newer home’s punch list.',
    ],
    housingStock: `<p><strong>Meridian grew faster than any city in the valley, and its housing stock shows it: overwhelmingly subdivision homes built from the 1990s through this year, in big coherent phases.</strong> That uniformity has a practical consequence for repairs: houses on the same street were built the same year with the same materials by the same crews, so they hit the same milestones together. The builder-grade kitchen faucet that fails at year twelve fails up and down the block at year twelve. The tan caulk shrinks on schedule. The water heaters age in formation.</p>
<p>The upside is predictability. If you tell us your Meridian home's age, we can usually guess most of the list before the photos arrive: settling cracks and door adjustments in the first five years, caulk and hardware refresh around year ten, and the first genuine replacement wave, fixtures, disposals, fans, weatherstripping, somewhere past fifteen.</p>`,
    commonRepairs: `<p><strong>The Meridian workload is the newer-home canon: drywall settling cracks and nail pops, interior doors drifting out of square, builder-grade faucet and fixture swaps, garbage disposals, ceiling fans, and the install list, TV mounts, garage storage, closet systems, smart thermostats and doorbells.</strong> Outside, it is vinyl and cedar fence repairs after wind events, gate adjustments, gutter cleaning on two-story homes, and re-caulking where siding meets trim. Very little of it is over $500 as a single item, which is exactly why one-visit batching is the right way to buy it.</p>`,
    watchOut: `<p><strong>The Meridian wrinkle is the HOA.</strong> A great many subdivisions here have covenants covering fence condition, exterior paint, and visible modifications, which turns a leaning fence section or peeling trim from a someday item into a letter from the management company. The fix is the same repair it always was, but the deadline is not yours anymore. We do HOA-prompted repairs regularly: matching the approved fence style and paint colors matters, and doing the repair before the second letter is cheaper than after.</p>`,
    seasonal: `<p><strong>Meridian’s newer subdivisions have young trees, so gutters clog slower than in old Boise, but its open ground means wind, and wind means fences.</strong> Spring fence checks after the windy season are the local ritual: posts loosened by freeze-thaw and gusts, pickets popped, gates dragging. Fall is for the weatherseal pass and hose-bib protection, and for sprinkler blowouts before the first hard freeze, standard across the valley. Summer UV works fastest on south-facing trim and vinyl, worth an annual walk-around.</p>`,
    faqs: [
      {
        question: 'My Meridian home is only a few years old: what will it need?',
        answer:
          'Settling work, mostly: hairline drywall cracks at corners and above openings, nail pops, doors that no longer latch cleanly, and builder-grade caulk shrinking at tubs and trim. All normal, all small. Document anything your builder warranty covers before it expires, then put the rest on a punch list for one visit.',
      },
      {
        question: 'Can you match my HOA’s fence style and colors?',
        answer:
          'Fence repairs are matched to what is there, same style, same materials, and paint is matched to the existing scheme, which in most subdivisions is what the HOA requires anyway. If your HOA needs prior approval or specific product colors, share the guideline and we will work to it.',
      },
      {
        question: 'What does a handyman visit cost in Meridian?',
        answer:
          'Valley-standard: most single repairs run $100 to $500, and our services start at flat prices from $145. Meridian jobs are often quoted quickly because the housing stock is so consistent, photos of a settling crack or a builder-grade faucet tell us nearly everything.',
      },
      {
        question: 'Do you do punch-list visits for newer homes?',
        answer:
          'Constantly, they are the ideal Meridian booking. A half-day visit typically clears eight to twelve small items: cracks patched and painted, doors adjusted, caulk redone, fixtures swapped, mounts hung. Per task it is far cheaper than separate calls, and the house feels new again by dinner.',
      },
      {
        question: 'Which parts of Meridian do you cover?',
        answer:
          'All of it, we are based in Meridian, and it is the center of our service area. Quotes come from photos within about a day, and most jobs are scheduled within the week and done in one trip.',
      },
    ],
  },
  {
    slug: 'eagle-handyman-guide',
    name: 'Eagle',
    citySlug: 'eagle',
    county: 'ada',
    guideType: 'location',
    title: 'Handyman Services in Eagle',
    seoTitle: 'Handyman Services in Eagle, Idaho',
    metaDescription:
      'Handyman services in Eagle: larger homes with more exterior to maintain, higher finish standards, deck and fence care, and flat upfront pricing.',
    excerpt:
      'Eagle homes are larger and more detailed than the valley average, which means more trim, more deck, more fence, and higher standards for how repairs should look when finished.',
    quickAnswer:
      'We provide handyman services across Eagle: carpentry and trim repair, deck and fence care, caulking and maintenance, painting touch-ups, and install work, with flat quotes starting at $145. Eagle’s larger, higher-finish homes simply have more exterior surface and detail per house, and repairs are expected to blend in invisibly.',
    takeaways: [
      'Eagle homes run larger and more detailed than the valley average: more trim, more glazing, more deck and fence per house.',
      'Higher finish standards mean repairs are judged on invisibility: texture, stain, and paint matching matter here.',
      'Larger lots mean more exterior wood and more irrigation, which together set the maintenance calendar.',
      'Foothills-edge properties add wind and sun exposure that age south-facing finishes fastest.',
      'Many Eagle communities have design standards, so exterior repairs should match what is there exactly.',
    ],
    housingStock: `<p><strong>Eagle's housing stock is the valley's upper band: larger custom and semi-custom homes, most built from the 1990s onward, on larger lots, with more of everything a handyman maintains.</strong> More linear feet of trim and fence, more deck and patio, more windows, more intricate rooflines feeding more gutter. A house like that does not have more kinds of problems than a subdivision home; it has more square footage of the same problems, and its owners have higher standards for what a finished repair should look like. A visible patch is a failed patch here.</p>
<p>The eastern and northern edges of Eagle climb toward the foothills, where wind and sun exposure age exterior finishes noticeably faster, and where larger view windows mean more glazing-adjacent caulk and trim doing weather duty.</p>`,
    commonRepairs: `<p><strong>The Eagle list leans exterior and finish-grade: deck board and rail replacement, re-staining, fence and gate repair across long runs, gutter cleaning on complex rooflines, exterior caulk and paint touch-ups, and interior trim and door work where the carpentry is a feature, not an afterthought.</strong> Inside, it is the same fixture, fan, and mounting work as anywhere, plus more of the jobs bigger houses generate: heavier TV and art mounting, closet systems, and tall-ceiling light fixture swaps. Texture, stain, and sheen matching is where this work is won or lost, and it is the part we are most careful about.</p>`,
    watchOut: `<p><strong>The Eagle trap is scale creep: exterior maintenance that would be an afternoon on a subdivision lot is a project here, and skipping a year compounds across a lot of surface.</strong> Two hundred feet of fence, a wraparound deck, and a complex roofline do not forgive deferral the way smaller properties do; one missed staining cycle or gutter season shows up as real repair work. The counter is a standing seasonal visit that works the whole perimeter at once, which per foot is far cheaper than reacting item by item.</p>`,
    seasonal: `<p><strong>Spring in Eagle is deck and fence season: screwdriver-test the deck, check every gate and post line after the windy months, and walk the sprinkler zones before summer, on big lots a misaimed head can soak siding or a deck post daily for weeks unnoticed.</strong> Summer is for staining and exterior paint on the sun-hammered south and west faces. Fall means gutter cleaning on rooflines that take real time, the weatherseal pass, and sprinkler blowout across larger systems. Winter is watching: eaves for ice dams, fence lines after wind events.</p>`,
    faqs: [
      {
        question: 'Do you match existing finishes on repairs?',
        answer:
          'Yes, and in Eagle that is usually the point. Drywall texture, trim profiles, stain color, and paint sheen are matched so the repair disappears. Where an exact profile or color needs sourcing, we say so in the quote rather than improvising with the closest thing on the shelf.',
      },
      {
        question: 'Can you maintain a large deck and fence line?',
        answer:
          'Yes: board and rail replacement, re-staining, post resetting, and gate work are core services. On larger Eagle properties we usually recommend a standing spring visit that covers the deck, fences, gates, and gutters in one pass, which per foot costs far less than reactive repairs.',
      },
      {
        question: 'What do handyman services cost in Eagle?',
        answer:
          'The same valley bands: most single repairs run $100 to $500 and our services start at flat prices from $145. Eagle jobs sometimes price toward the top of a range for scale and finish-matching reasons, a longer fence run, a taller ceiling, a stain that must be matched, and the quote states that plainly up front.',
      },
      {
        question: 'My home is on acreage with a well: does that change anything?',
        answer:
          'Not for our scope, we handle the same repairs and maintenance regardless of water source. Well pumps, pressure systems, and septic are specialist territory, and we will say so if a symptom points that way. Hard water is a valley-wide reality either way, and it is why fixture maintenance schedules matter.',
      },
      {
        question: 'Do you handle community design-standard repairs?',
        answer:
          'Yes. Several Eagle communities have design standards for fences, exterior colors, and visible elements, and repairs are matched to what exists, which keeps them compliant by definition. If your community requires approval before exterior work, share the guideline and we will work within it.',
      },
    ],
  },
  {
    slug: 'kuna-handyman-guide',
    name: 'Kuna',
    citySlug: 'kuna',
    county: 'ada',
    guideType: 'location',
    title: 'Handyman Services in Kuna',
    seoTitle: 'Handyman Services in Kuna, Idaho',
    metaDescription:
      'Handyman services in Kuna: new-subdivision settling repairs, acreage fence and outbuilding upkeep, wind and hard-water fixes, and flat upfront pricing.',
    excerpt:
      'Kuna splits between brand-new subdivisions and open acreage, and the wind that crosses that open ground is the hardest thing in the valley on fences.',
    quickAnswer:
      'We provide handyman services across Kuna: settling repairs and installs in newer subdivision homes, fence and gate repair after wind, fixture swaps where hard water has done its work, and seasonal maintenance, with flat quotes starting at $145. Kuna’s mix of new builds and acreage produces two distinct repair lists, and we run both.',
    takeaways: [
      'Kuna’s stock splits between very new subdivision homes and rural acreage properties.',
      'Open ground means wind, and wind means Kuna fences and gates take more abuse than most in the valley.',
      'New builds need settling repairs and the install list; acreage properties need perimeter and outbuilding upkeep.',
      'Hard water is at its most noticeable on acreage wells: fixtures and valves scale up faster.',
      'Batching repairs matters more here: one visit covering a whole list beats multiple trips out.',
    ],
    housingStock: `<p><strong>Kuna is two housing stocks sharing a zip code: fast-growing subdivisions full of homes under fifteen years old, and the acreage properties that were here first.</strong> The subdivision half generates the newer-home canon, settling cracks, door adjustments, builder-grade part swaps, and a long install wishlist. The acreage half generates perimeter work: long fence runs, gates that see daily use, outbuildings and shop doors, deck and porch upkeep, and the general wear of properties that work for a living.</p>
<p>What both halves share is exposure. Kuna sits on open ground, and the wind that crosses it tests every fence, gate, screen door, and patio umbrella in town. If there is one repair Kuna generates more reliably than anywhere else we work, it is the fence call after a spring windstorm.</p>`,
    commonRepairs: `<p><strong>Subdivision Kuna calls us for drywall settling repairs, interior door adjustments, fixture and fan swaps, TV mounting and garage storage, and first-round caulk refresh.</strong> Acreage Kuna calls for fence sections and post resets, gate rebuilds and re-hangs, deck and porch board replacement, screen and storm door repair, and hardware that outdoor life wears through. Hard well water on acreage adds a faster fixture-maintenance clock: aerators, fill valves, and showerheads scale up ahead of their city-water cousins, and swaps are routine work.</p>`,
    watchOut: `<p><strong>The Kuna-specific wrinkle is wind deferral: a fence that leans after one windstorm is a one-post repair, and a fence that waits for the next windstorm is a three-section rebuild.</strong> Wind finds whatever is already loose and finishes it. The economic answer is the same as everywhere but more so here: fix the first leaning post the season it leans, and have gates adjusted while they still latch, because a swinging, dragging gate levers its post looser with every gust.</p>`,
    seasonal: `<p><strong>Spring is fence season in Kuna: walk the perimeter after the windy months, catch heaved posts and popped pickets, and get gates re-hung true.</strong> Summer is for exterior paint and stain, and for keeping sprinkler heads aimed at grass rather than fence posts and siding. Fall means the standard valley pre-freeze list, weatherseal, hose bibs, sprinkler blowout, plus securing anything on open ground that winter wind can throw. Gutters on newer homes with young trees are quick work, but they still need the annual fall look.</p>`,
    faqs: [
      {
        question: 'Do you come out to rural Kuna properties?',
        answer:
          'Yes, acreage properties around Kuna are inside our normal service area. Because the drive is longer, batching matters more: send the whole list with photos and we will quote it as one visit, bringing materials for everything at once. Per task, that is much cheaper than piecemeal calls.',
      },
      {
        question: 'Can you fix wind-damaged fences?',
        answer:
          'It is one of our most common Kuna jobs: resetting or replacing heaved posts, rebuilding leaning sections, re-screwing pickets, and re-hanging gates. Sections typically run $150 to $450. The best money in fencing here is fixing the first leaning post before the next windstorm converts it into a section rebuild.',
      },
      {
        question: 'My new Kuna home has drywall cracks: is that normal?',
        answer:
          'Almost always, yes: new homes settle for a year or two, producing hairline cracks at corners and above doors, nail pops, and doors that drift out of alignment. Check what your builder warranty covers before it expires, then have the rest patched, textured, and painted in one visit once the main settling has happened.',
      },
      {
        question: 'Does well water change my fixture maintenance?',
        answer:
          'It speeds up the clock. Mineral-heavy water scales aerators, showerheads, and toilet fill valves faster, so expect swaps and cleanings more often than city-water schedules suggest. Water softener and pump service are specialist trades; the fixtures they protect are standard work for us.',
      },
      {
        question: 'What do handyman services cost in Kuna?',
        answer:
          'Valley-standard bands: most single repairs run $100 to $500, and our services carry flat starting prices from $145. Every job gets a firm quote from photos before we arrive, and one-visit batching spreads the trip cost across the whole list.',
      },
    ],
  },
  {
    slug: 'star-handyman-guide',
    name: 'Star',
    citySlug: 'star',
    county: 'ada',
    guideType: 'location',
    title: 'Handyman Services in Star',
    seoTitle: 'Handyman Services in Star, Idaho',
    metaDescription:
      'Handyman services in Star: settling repairs in new subdivisions, upkeep for older farmhouse-era properties, wind-tested fences, and flat upfront pricing.',
    excerpt:
      'Star is mid-transition from farmland to subdivisions, so brand-new homes and decades-old properties sit a mile apart and need entirely different lists.',
    quickAnswer:
      'We provide handyman services across Star: settling repairs and installs in the new subdivisions, honest upkeep for the older properties that predate them, and fence, gate, and exterior work everywhere, with flat quotes starting at $145. Star’s housing runs from this year’s builds to farmhouse-era homes, often on the same road.',
    takeaways: [
      'Star mixes brand-new subdivision homes with older properties from its small-town and agricultural past.',
      'New builds need settling repairs and installs; older properties need genuine repair carpentry and catch-up maintenance.',
      'Open western exposure means wind, and wind means fences and gates lead the exterior list.',
      'Fast growth means many owners are new to their houses: a punch-list visit after move-in finds what inspections skim.',
      'Batching several jobs into one visit is the cheapest way to buy small work here.',
    ],
    housingStock: `<p><strong>Star is in the middle of the same transition Meridian finished a decade ago: farmland becoming subdivisions, fast.</strong> The result is a housing stock with a barbell shape. One end is brand-new: homes a few years old at most, full of settling repairs waiting to be noticed and installs waiting to be wanted. The other end is the older Star, small-town homes and farm properties that have seen decades of weather and a few generations of owner improvements, where the work is real repair carpentry: porches, older doors and windows, outbuildings, and the accumulated list that older houses keep.</p>
<p>Between them sits a practical difference in how we quote: new-build work is predictable from photos alone, while older-property work earns a few extra questions, because what a 1970s porch post needs depends on what is under the paint.</p>`,
    commonRepairs: `<p><strong>In the subdivisions: drywall settling cracks, nail pops, door adjustments, builder-grade fixture swaps, ceiling fans, TV mounts, closet and garage storage, and first-round caulk refresh.</strong> On the older properties: porch and step repairs, door and window easing, siding and trim patching, screen doors, gate and fence rebuilds, and paint that protects rather than decorates. Everywhere in Star: wind-tested fences, sprinkler-season fixes, and the pre-winter seal-up. It is two different trades' rhythms, and we run both weekly.</p>`,
    watchOut: `<p><strong>The Star wrinkle is move-in blindness: most owners here are new to their specific house, and a home inspection is a snapshot, not a punch list.</strong> The first months in any house, new or old, surface the truth: the door that sticks in July, the outlet on a mystery switch, the gate that never latched. The efficient response is to keep the list and book one visit at the three-month mark rather than reacting item by item, it is cheaper, and it turns settling-in annoyances into an afternoon's work.</p>`,
    seasonal: `<p><strong>Star’s seasonal rhythm is the valley standard with a wind emphasis: spring fence and gate checks after the windy months, summer paint and stain on sun-facing surfaces, and the fall pre-freeze list, weatherseal, hose bibs, sprinkler blowout, gutters.</strong> Older properties add a spring porch-and-step check, freeze-thaw is hardest on the oldest wood, and newer subdivisions add the annual walk for settling cracks worth patching once movement slows.</p>`,
    faqs: [
      {
        question: 'Do you serve both new subdivisions and older Star properties?',
        answer:
          'Yes, and they are genuinely different work: settling repairs and installs on the new end, repair carpentry and catch-up maintenance on the old end. Both are standard for us. Photos with your list tell us which rhythm your house needs, and the quote reflects the actual work rather than an average.',
      },
      {
        question: 'We just moved to Star: what should we do first?',
        answer:
          'Keep a list for your first three months, the house will write it for you: sticking doors, mystery switches, worn caulk, a gate that will not latch. Then book one visit to clear it. That beats reacting item by item on both cost and sanity, and it gives you a baseline of a house where everything works.',
      },
      {
        question: 'Can you repair older porches and outbuildings?',
        answer:
          'Board, rail, step, and trim-level repairs, yes: that is core carpentry scope. Structural rebuilds, failed foundations, or full re-roofs on outbuildings are contractor territory, and we will say so plainly if that is what the photos show. Most older-property calls land squarely in repair scope.',
      },
      {
        question: 'What does handyman work cost in Star?',
        answer:
          'Valley-standard: most single repairs run $100 to $500, market hourly rates run $60 to $120, and our services start at flat prices from $145. Older-property work occasionally uncovers more than the surface showed; when that happens, work pauses and you approve any change before it is billed.',
      },
      {
        question: 'How far out from Star do you go?',
        answer:
          'Star and the surrounding rural roads are inside our normal Treasure Valley service area, which covers Ada and Canyon County. For properties outside town, batching the list into one quoted visit is the economical pattern, and it is how most of our rural clients book.',
      },
    ],
  },
  {
    slug: 'middleton-handyman-guide',
    name: 'Middleton',
    citySlug: 'middleton',
    county: 'canyon',
    guideType: 'location',
    title: 'Handyman Services in Middleton',
    seoTitle: 'Handyman Services in Middleton, Idaho',
    metaDescription:
      'Handyman services in Middleton: new-subdivision repairs, acreage and small-town home upkeep, fence and exterior work, and flat upfront pricing.',
    excerpt:
      'Middleton pairs a small-town core and working acreage with a ring of new subdivisions, and we run repair lists for all three.',
    quickAnswer:
      'We provide handyman services across Middleton: settling repairs and installs in the newer subdivisions, repair carpentry and upkeep for small-town and acreage properties, and fence, deck, and gutter work everywhere, with flat quotes starting at $145. Middleton is in Canyon County and sits fully inside our Treasure Valley service area.',
    takeaways: [
      'Middleton combines a small-town core, working acreage, and a growing ring of new subdivisions.',
      'Newer subdivision homes need settling repairs and installs; older town and farm properties need repair carpentry.',
      'Acreage properties bring long fence runs, outbuildings, and well-water fixture wear.',
      'Middleton is Canyon County, and it is fully inside our regular service area.',
      'One-visit batching matters most where the drive is longest: send the whole list at once.',
    ],
    housingStock: `<p><strong>Middleton's housing stock has three layers: the small-town core of older homes, the farm and acreage properties around it, and the newer subdivisions that growth has added in rings.</strong> Each layer has its own list. The older town homes need what older homes need everywhere, doors eased, porches kept sound, caulk and paint kept ahead of the weather. The acreage properties add perimeter and outbuilding work, plus the faster fixture wear that comes with hard well water. The new subdivisions run the standard newer-home program: settling repairs in the early years, builder-grade part swaps as the first decade closes.</p>
<p>Middleton owners chose the town partly for value, and the same logic applies to keeping a house here: small repairs done on time are the cheapest ownership strategy there is.</p>`,
    commonRepairs: `<p><strong>The Middleton mix: drywall settling repairs and door adjustments in the subdivisions, fixture and fan swaps everywhere, fence sections and gates across town and acreage alike, deck and porch board replacement, gutter cleaning and minor repair, and the caulk-and-weatherseal work that Canyon County winters reward.</strong> Acreage properties add screen doors, shop-door hardware, and the long-run fence repairs that open ground and wind produce. Most items are one-visit work, and most Middleton bookings are lists rather than single tasks, which is exactly how the economics work best out here.</p>`,
    watchOut: `<p><strong>The Middleton wrinkle is distance math: for any pro, a trip here costs the same whether it fixes one thing or nine, and homeowners who book single small jobs pay that overhead every time.</strong> The fix is entirely in your control: keep the running list, photograph it, and book it as one visit. Our flat quotes price the list as a package, we arrive with materials for all of it, and the per-task cost drops sharply. It is the single best cost lever for anyone living west of the county line.</p>`,
    seasonal: `<p><strong>Middleton’s calendar is the valley standard: spring fence and gate checks after wind and freeze-thaw, summer exterior paint and stain in the long dry window, fall gutter cleaning, weatherseal, hose-bib protection, and sprinkler blowout before the first hard freeze.</strong> Acreage adds a spring walk of outbuildings and gates, and well-water homes should expect the faster fixture-scale clock that mineral-heavy water sets everywhere in this valley.</p>`,
    faqs: [
      {
        question: 'Do you cover Middleton?',
        answer:
          'Yes, Middleton is fully inside our Treasure Valley service area, which spans Ada and Canyon County. Quotes come from photos within about a day, and most jobs are scheduled within the week. Because of the drive, we encourage sending the whole list at once so one visit clears it.',
      },
      {
        question: 'Can you handle acreage and farm-property repairs?',
        answer:
          'Repair-scope work, yes: fences, gates, decks and porches, screen and shop doors, fixtures, and general carpentry. Barn structural work, roofing, and anything electrical beyond minor repairs belong with specialty contractors, and we will tell you which items on your list are which.',
      },
      {
        question: 'What do handyman services cost in Middleton?',
        answer:
          'The same bands as the rest of the valley: most single repairs run $100 to $500 and our services start at flat prices from $145. Batching matters more here than anywhere: a one-visit list is quoted as a package and costs meaningfully less per task than separate calls.',
      },
      {
        question: 'My subdivision home is new: what should I expect?',
        answer:
          'The standard settling program: hairline drywall cracks, nail pops, doors drifting out of square, and shrinking builder-grade caulk over the first year or two. Note what the builder warranty covers before it expires, then batch the rest into one patch-texture-paint visit once movement slows.',
      },
      {
        question: 'Does well water affect my fixtures?',
        answer:
          'Yes, it accelerates scale in aerators, showerheads, and toilet valves, so cleaning and swap cycles run shorter than on city water. The fixtures are standard work for us; softener systems and well equipment are specialist trades, and we will say so if the symptoms point there.',
      },
    ],
  },
  {
    slug: 'nampa-handyman-guide',
    name: 'Nampa',
    citySlug: 'nampa',
    county: 'canyon',
    guideType: 'location',
    title: 'Handyman Services in Nampa',
    seoTitle: 'Handyman Services in Nampa, Idaho',
    metaDescription:
      'Handyman services in Nampa: repairs for historic downtown homes and new subdivisions alike, seasonal maintenance, and flat upfront pricing.',
    excerpt:
      'Nampa has the widest housing-stock range in Canyon County, from early-1900s homes near downtown to subdivisions finished this year, and the repair lists differ as much as the houses.',
    quickAnswer:
      'We provide handyman services across Nampa: plaster-era repairs in the historic core, settling fixes and installs in the new subdivisions, and fence, gutter, and maintenance work everywhere, with flat quotes starting at $145. Nampa is Canyon County’s largest city and sits fully inside our service area.',
    takeaways: [
      'Nampa’s housing runs from early-1900s homes near downtown to subdivisions still being built.',
      'Older-core homes bring plaster, original doors and windows, and mature-tree gutter duty.',
      'Newer subdivision homes need settling repairs and builder-grade part swaps on a predictable clock.',
      'Old-house wiring and plumbing surprises are handled honestly: minor repairs are ours, licensed-trade work gets referred.',
      'Nampa is fully inside our Ada-and-Canyon service area, with the same flat pricing as everywhere else.',
    ],
    housingStock: `<p><strong>Nampa is Canyon County's largest city and its most varied housing stock by a wide margin.</strong> The blocks around downtown hold homes from the early 1900s onward: plaster walls, original wood doors and windows, mature trees, and the accumulated modifications of a century of owners. Mid-century neighborhoods ring that core. And the city's edges are new-subdivision country, phases finishing this year, homes under warranty, streets where the trees are still staked. The same afternoon can put us in a 1915 four-square easing a swollen door and a 2022 build patching settling cracks, and the toolbag changes between them.</p>
<p>That range is worth naming because it changes the advice: what is normal for one Nampa house is a symptom in another. A sticking door in a new build is settling; in a century home it might be seasonal swelling or a hinge a hundred years tired.</p>`,
    commonRepairs: `<p><strong>Older-core Nampa calls us for plaster patching, door and window easing, hardware and trim repair, porch upkeep, paint touch-ups, and gutter care under real trees.</strong> Newer Nampa runs the settling-and-installs program: drywall cracks, door adjustments, fixture and fan swaps, TV mounts, storage systems, caulk refresh. Citywide, fences after wind, sprinkler-season fixes, and the fall weatherseal pass. Hard water does its slow work across the whole valley, so fixture cleaning and swaps are perennial on both sides of town.</p>`,
    watchOut: `<p><strong>Nampa's wrinkle is the same one every older housing core has: what previous decades left behind the walls.</strong> Century homes here can carry layered wiring and plumbing from several eras, and a routine swap sometimes opens onto something that needs a licensed electrician or plumber instead of a handyman. Our policy is to stop at that line, show you what we found, and help you get the right trade in. In a city with this much older stock, a handyman's most valuable habit is knowing exactly where his scope ends.</p>`,
    seasonal: `<p><strong>Fall gutter cleaning is serious business in Nampa's older neighborhoods, where mature trees fill gutters fast, once after leaf drop at minimum, and the fall weatherseal pass earns its keep in homes of every age.</strong> Spring is for fence and gate checks and sprinkler startup fixes; summer's UV is hardest on the painted wood of the older stock, where south-facing touch-ups are protective maintenance. Sprinkler blowouts and hose-bib protection close the season before Canyon County's first hard freeze.</p>`,
    faqs: [
      {
        question: 'Do you work on Nampa’s older homes?',
        answer:
          'Yes: plaster repair, door and window easing, trim and hardware work, porch and step repairs, and paint touch-ups appropriate to older construction are all standard scope. Rewiring and repiping are not, when an old wall reveals licensed-trade work, we stop, show you, and help you find the right specialist.',
      },
      {
        question: 'What do handyman services cost in Nampa?',
        answer:
          'The same as the rest of the Treasure Valley: most single repairs run $100 to $500, market hourly rates run $60 to $120, and our services carry flat starting prices from $145. There is no cross-county premium; Nampa is core service area for us.',
      },
      {
        question: 'Can you do a punch list on my new Nampa build?',
        answer:
          'Yes, it is one of our standard visits: settling cracks patched, textured, and painted, doors re-adjusted, caulk redone, fixtures and mounts installed, all in one trip. Check your builder warranty first and let it cover what it covers; we handle what it does not.',
      },
      {
        question: 'How fast can you get to a Nampa job?',
        answer:
          'Photo quotes usually come back within a day, and most jobs are scheduled within the week. One-trip completion is the goal, which is why we quote from photos: they tell us what materials to have on the truck before we cross the county line.',
      },
      {
        question: 'Which Nampa areas do you serve?',
        answer:
          'All of Nampa, from the historic core to the newest phases at the edges, plus the unincorporated areas around it. Our service area covers Ada and Canyon County: Boise, Meridian, Eagle, Nampa, Kuna, Star, Middleton, and Caldwell.',
      },
    ],
  },
  {
    slug: 'caldwell-handyman-guide',
    name: 'Caldwell',
    citySlug: 'caldwell',
    county: 'canyon',
    guideType: 'location',
    title: 'Handyman Services in Caldwell',
    seoTitle: 'Handyman Services in Caldwell, Idaho',
    metaDescription:
      'Handyman services in Caldwell: older-home repairs near the historic core, new-subdivision fixes, acreage upkeep, and flat upfront pricing.',
    excerpt:
      'Caldwell runs from a historic core through mid-century neighborhoods to new subdivisions and working acreage, and each layer keeps its own repair list.',
    quickAnswer:
      'We provide handyman services across Caldwell: repairs for the older homes near the historic core, settling fixes and installs in newer subdivisions, and fence, deck, and maintenance work on town lots and acreage alike, with flat quotes starting at $145. Caldwell is fully inside our Ada-and-Canyon service area.',
    takeaways: [
      'Caldwell’s stock spans a historic core, mid-century neighborhoods, new subdivisions, and surrounding acreage.',
      'Older homes need repair carpentry and paint kept ahead of the weather; new builds need settling fixes and installs.',
      'Acreage around Caldwell brings long fences, outbuildings, and well-water fixture wear.',
      'Value-minded ownership works best here: small repairs done on time are the cheapest strategy.',
      'One-visit batching keeps trip costs low across the west valley.',
    ],
    housingStock: `<p><strong>Caldwell's housing tells the same layered story as Nampa's, at a slightly smaller scale: a historic core of early-1900s homes, mid-century rings around it, new subdivisions at the edges, and working acreage beyond them.</strong> The older blocks bring the older-home program, plaster, original doors and windows, porches, mature trees, and the newer edges bring the settling-and-installs program. The acreage adds perimeter work: long fence lines, gates, outbuildings, and the faster fixture wear of well water.</p>
<p>Caldwell owners tend to be practical about their houses, and the practical playbook is the one this whole guide argues for: catch things small, batch the list, and spend on the repairs that prevent bigger ones.</p>`,
    commonRepairs: `<p><strong>Near the core: plaster and drywall repair, door and window easing, trim and hardware work, porch and step repairs, and gutter duty under mature trees.</strong> At the edges: settling cracks, door adjustments, builder-grade fixture swaps, fans, mounts, and storage installs. On acreage: fence sections and gates, deck and porch boards, screen and shop doors. Everywhere: the caulk, weatherstrip, and seasonal-seal work that a true four-season climate demands, and the sprinkler-season fixes that summer irrigation brings.</p>`,
    watchOut: `<p><strong>Caldwell's wrinkle is deferred-maintenance compounding in the older stock: a fair number of the century homes here have had stretches of easier and harder decades, and small problems that waited now sit under newer surfaces.</strong> Practically, that means an older-home repair sometimes uncovers the previous one, softer wood behind the trim, an older patch behind the paint. Our approach is to quote what the photos show, pause when something more appears, and let you approve the difference before it is billed. No surprises on the invoice, even when there are surprises in the wall.</p>`,
    seasonal: `<p><strong>The Caldwell calendar is the valley standard with an old-tree emphasis near the core: fall gutter cleaning after leaf drop, the pre-freeze weatherseal pass, hose-bib protection, and sprinkler blowout by late October.</strong> Spring means fence and gate checks after wind and freeze-thaw, porch and step checks on the older homes, and sprinkler startup fixes. Summer's long dry window is the time for exterior paint and stain, especially the sun-facing sides of painted older homes.</p>`,
    faqs: [
      {
        question: 'Do you serve Caldwell?',
        answer:
          'Yes, Caldwell is fully inside our Treasure Valley service area, which covers Ada and Canyon County. Photo quotes usually come back within a day, most jobs are scheduled within the week, and batching your list into one visit keeps the per-task cost down across the west valley.',
      },
      {
        question: 'Can you repair older Caldwell homes?',
        answer:
          'Yes: plaster patching, door and window easing, porch and step repair, trim and hardware work, and protective paint touch-ups are core scope. When an older wall reveals wiring or plumbing that needs a licensed trade, we stop, show you what we found, and help you get the right specialist in.',
      },
      {
        question: 'What do handyman services cost in Caldwell?',
        answer:
          'The same valley bands: most single repairs run $100 to $500 and our services start at flat prices from $145. Older-home work occasionally uncovers prior deferred repairs; when it does, work pauses and you approve any change before it is billed.',
      },
      {
        question: 'Do you handle acreage properties around Caldwell?',
        answer:
          'Yes: fences, gates, decks, porches, screen and shop doors, and fixtures are all standard scope on rural properties. Send the whole list with photos, one quoted visit with materials on the truck is the economical way to buy small work outside town.',
      },
      {
        question: 'My new Caldwell home is cracking at the corners: is something wrong?',
        answer:
          'Almost certainly just settling, which new homes do for a year or two: hairline cracks at corners and above openings, nail pops, and doors drifting slightly are all normal. Let the builder warranty cover what it covers, then have the rest patched, textured, and painted in one visit once movement slows.',
      },
    ],
  },
  {
    slug: 'eagle-foothills-handyman-guide',
    name: 'the Eagle Foothills',
    citySlug: 'eagle',
    county: 'ada',
    guideType: 'neighborhood',
    title: 'Handyman Services in the Eagle Foothills',
    seoTitle: 'Handyman Services in the Eagle Foothills',
    metaDescription:
      'Handyman services in the Eagle Foothills: wind- and sun-exposed exteriors, deck and fence care on sloped lots, sealing and maintenance, and flat pricing.',
    excerpt:
      'Foothills homes trade valley shelter for exposure: more wind, more sun, and exteriors that age faster on the weather side than anywhere on the valley floor.',
    quickAnswer:
      'We provide handyman services in the Eagle Foothills: deck and rail care, fence and gate repair, exterior caulk and paint upkeep, and interior repairs and installs, with flat quotes starting at $145. Foothills exteriors face more wind and sun than valley homes, and the weather side of the house sets the maintenance clock.',
    takeaways: [
      'Foothills homes take more wind and sun exposure than valley-floor homes, and exteriors age accordingly.',
      'Decks, rails, and view-side finishes are the fastest-wearing assets: inspect them every spring.',
      'Exterior caulk and paint on the weather side runs a shorter cycle than the sheltered sides.',
      'Sloped lots concentrate water: keep drainage paths, gutters, and downspout extensions working.',
      'Larger custom homes mean finish-matched repairs: visible patches are failed patches here.',
    ],
    housingStock: `<p><strong>Eagle Foothills homes are mostly larger custom builds from the last few decades, sited for views, which means sited for exposure.</strong> Wind that valley subdivisions never feel is routine up here, and the sun that makes the views glow works full-time on south- and west-facing decks, rails, trim, and paint. The houses are well built; the physics are simply harder. A deck rail or a caulk line on the weather side of a foothills home lives a visibly shorter life than its twin on the sheltered side, and the maintenance calendar has to respect that.</p>
<p>Sloped lots add the water dimension: rain and snowmelt move across these properties with intent, and gutters, downspout extensions, and drainage paths are doing structural protection, not tidying.</p>`,
    commonRepairs: `<p><strong>The foothills list leans hard to the exterior: deck board and rail replacement, re-staining on a shorter cycle, fence and gate repair after wind events, exterior caulk renewal on the weather side, paint touch-ups where UV works fastest, and gutter and downspout upkeep that sloped lots make consequential.</strong> Inside, the work matches the housing stock: finish-grade drywall and trim repairs, tall-ceiling fixture and fan swaps, heavy mounting on stone and tall walls, and the general punch lists larger homes generate. Matching texture, stain, and sheen is the standard everything gets judged by.</p>`,
    watchOut: `<p><strong>The foothills trap is assuming valley maintenance cycles apply: they do not, and the weather side of the house is the tell.</strong> A stain job that lasts five years down in the valley may want attention in three up here; caulk lines crack a season or two sooner; wind finds any fence post or picket that was already marginal. The efficient rhythm is a standing spring visit that walks the whole exposure: deck, rails, fence line, caulk, paint, gutters, and catches the weather side's wear while each item is still small.</p>`,
    seasonal: `<p><strong>Spring up here is inspection season: screwdriver-test the deck, check every rail, walk the fence line after the windy months, and confirm winter runoff did not carve new paths near the foundation.</strong> Summer is the work window, staining, painting, caulking, in the long dry heat. Fall matters doubly on sloped lots: gutters and downspout extensions must be clear and connected before snowmelt season, along with the standard valley pre-freeze list. Winter is for watching eaves and drainage during melt cycles.</p>`,
    faqs: [
      {
        question: 'Why does my foothills deck wear faster than my old valley home’s deck?',
        answer:
          'Exposure. Foothills sites take more direct sun and more wind than sheltered valley lots, and UV plus wind-driven weather ages horizontal surfaces and finishes fastest. It is normal, and the answer is a shorter inspection and re-stain cycle on the weather side, plus prompt board and rail replacement when the screwdriver test finds soft wood.',
      },
      {
        question: 'Do you do finish-matched repairs in custom homes?',
        answer:
          'Yes, and in the foothills that is the expectation we work to: drywall texture, trim profiles, stain, and paint sheen matched so the repair disappears. Where an exact material or color needs sourcing, the quote says so up front rather than substituting the closest shelf item.',
      },
      {
        question: 'Can you maintain drainage-related items?',
        answer:
          'The handyman-scope parts, yes: gutter cleaning and repair, downspout extensions, splash management, and keeping water directed away from the house. Regrading, retaining walls, and engineered drainage are contractor and specialist territory, and we will say so if that is what your slope actually needs.',
      },
      {
        question: 'What does handyman work cost in the foothills?',
        answer:
          'The same valley bands, most single repairs $100 to $500, services from $99, with scale and finish-matching sometimes placing jobs toward the top of a range. A standing spring exterior visit is the best value on sloped, exposed lots: per item it beats reactive repairs comfortably.',
      },
      {
        question: 'Do you handle wind-damage repairs?',
        answer:
          'Routinely: fence sections and posts, gates, popped pickets and boards, and the assorted exterior items wind loosens. After a significant wind event, walk the property and photograph anything leaning or moving, one visit usually puts the lot right, and quickly, before the next front finishes what the last one started.',
      },
    ],
  },
  {
    slug: 'hidden-springs-handyman-guide',
    name: 'Hidden Springs',
    citySlug: 'eagle',
    county: 'ada',
    guideType: 'neighborhood',
    title: 'Handyman Services in Hidden Springs',
    seoTitle: 'Handyman Services in Hidden Springs, Idaho',
    metaDescription:
      'Handyman services in Hidden Springs: repairs matched to community standards, maintenance for homes entering their third decade, and flat upfront pricing.',
    excerpt:
      'Hidden Springs homes are entering their third decade, which means original fixtures, caulk, and hardware are aging in unison, and repairs must match a community that cares how things look.',
    quickAnswer:
      'We provide handyman services in Hidden Springs: repairs and maintenance matched to the community’s design standards, fixture and hardware updates for homes entering their third decade, and seasonal exterior care, with flat quotes starting at $145. The neighborhood’s coherent look means repairs are matched to what exists, exactly.',
    takeaways: [
      'Hidden Springs homes largely date from the community’s founding era, and their original components are aging together.',
      'Fixtures, caulk, hardware, and exterior finishes from the same build years reach replacement age in unison.',
      'The community’s design coherence means exterior repairs must match materials and colors exactly.',
      'A foothills-edge setting adds wind and sun exposure on the weather sides.',
      'One punch-list visit a season is the natural maintenance rhythm here.',
    ],
    housingStock: `<p><strong>Hidden Springs was built as a planned community with a deliberately coherent look, and most of its homes date from the same founding era, which puts them in their second and third decades now.</strong> That shared age is the defining maintenance fact: original faucets, fans, water heaters, caulk lines, weatherstripping, and hardware across the neighborhood are reaching the end of their design lives on roughly the same schedule. None of it is failure; it is what twenty-plus years does to consumable components, all at once.</p>
<p>The community's setting at the edge of the Boise foothills adds a mild exposure factor, more wind and sun than the valley floor, and its design coherence adds a standard: exterior repairs are expected to match what exists, precisely.</p>`,
    commonRepairs: `<p><strong>The Hidden Springs list is the twenty-year refresh: faucet and fixture swaps, toilet internals, ceiling fans, re-caulking baths and exterior joints, weatherstripping renewal, cabinet hardware and hinge adjustments, and paint touch-ups where two decades of sun have worked.</strong> Exterior work runs to fence and gate repair, deck and porch upkeep, and gutter care, matched to the community's materials and colors. Interior finish repairs, drywall, trim, doors, are held to the same blend-in standard as everywhere we work in higher-finish neighborhoods.</p>`,
    watchOut: `<p><strong>The wrinkle here is simultaneity: when components age in unison, owners face a scatter of small failures across a year or two and can end up booking a dozen separate reactive calls.</strong> The better pattern is the planned refresh: one or two scheduled visits that swap the aging faucets, valves, fans, caulk, and weatherstripping in batches before they fail individually. Per item it is far cheaper, and it converts a drizzle of annoyances into an afternoon of upgrades.</p>`,
    seasonal: `<p><strong>Seasonally, Hidden Springs follows the valley calendar with a foothills-edge accent: spring checks of fences, gates, and decks after wind and freeze-thaw, summer for exterior paint and stain, and the full fall pre-freeze list, gutters, weatherseal, hose bibs, sprinkler blowout.</strong> Homes this age reward the fall weatherstrip check especially: original door seals from the founding era are usually past their best, and renewing them is one of the cheapest comfort upgrades available.</p>`,
    faqs: [
      {
        question: 'Do you match community design standards on repairs?',
        answer:
          'Yes: repairs are matched to existing materials, styles, and colors, which in a design-coherent community is both the standard and the point. If a repair type requires community approval first, share the guideline and we will work within it.',
      },
      {
        question: 'What should a twenty-year-old Hidden Springs home expect?',
        answer:
          'The unified aging of its original components: faucets, toilet internals, fans, water heaters, caulk, weatherstripping, and hardware all reaching replacement age within a few years of each other. It is normal and predictable. A planned refresh visit or two beats a year of scattered reactive calls on both cost and convenience.',
      },
      {
        question: 'What do handyman services cost in Hidden Springs?',
        answer:
          'Valley-standard bands: most single repairs run $100 to $500, and our services carry flat starting prices from $145. Batch pricing is where this neighborhood wins: a planned-refresh list quoted as one visit costs meaningfully less per item than reactive one-off calls.',
      },
      {
        question: 'Do you handle exterior work here?',
        answer:
          'Yes: fence and gate repair, deck and porch upkeep, gutter cleaning and repair, exterior caulk, and paint touch-ups, matched to the community’s materials and palette. Larger exterior projects like full repaints or roof work belong with specialty contractors, and we will say so when a job crosses that line.',
      },
      {
        question: 'How do I get a quote?',
        answer:
          'Send your list with photos through the contact page. Most Hidden Springs quotes come back flat within a day, and most visits are scheduled within the week, with materials brought for the whole list so one trip finishes it.',
      },
    ],
  },
  {
    slug: 'harris-ranch-handyman-guide',
    name: 'Harris Ranch',
    citySlug: 'boise',
    county: 'ada',
    guideType: 'neighborhood',
    title: 'Handyman Services in Harris Ranch',
    seoTitle: 'Handyman Services in Harris Ranch, Boise',
    metaDescription:
      'Handyman services in Harris Ranch: settling repairs and installs in newer East Boise homes, HOA-conscious exterior work, and flat upfront pricing.',
    excerpt:
      'Harris Ranch is newer East Boise: homes mostly under twenty years old, community standards for how exteriors look, and repair lists dominated by settling fixes and installs.',
    quickAnswer:
      'We provide handyman services in Harris Ranch: settling repairs, fixture and fan installs, mounting and storage, caulking, and exterior upkeep matched to community standards, with flat quotes starting at $145. Harris Ranch homes are mostly newer builds, so the work is the newer-home canon done to a visible-neighborhood standard.',
    takeaways: [
      'Harris Ranch homes are mostly newer construction, from the 2000s to current phases.',
      'The repair list is the newer-home canon: settling fixes, builder-grade swaps, and installs.',
      'Community design standards make exterior repairs a match-what-exists exercise.',
      'East-end proximity to the foothills adds sun and some wind exposure on facing sides.',
      'Punch-list batching is the natural booking pattern for homes this age.',
    ],
    housingStock: `<p><strong>Harris Ranch is one of Boise's newest large neighborhoods, a planned community in the Barber Valley on the city's east side, with homes running from the 2000s through phases still building.</strong> The stock is therefore young: the oldest homes are entering the age where builder-grade components begin their first replacement wave, and the newest are still settling. Density and design coherence are part of the neighborhood's character, front porches, alleys, consistent palettes, which means exterior repairs are visible to the street and expected to match.</p>
<p>The setting at the mouth of the foothills adds a mild exposure gradient: east-side and foothill-facing surfaces take more sun and weather than the sheltered sides, and age a little ahead of them.</p>`,
    commonRepairs: `<p><strong>The Harris Ranch workload is the newer-home program: drywall settling cracks and nail pops, doors drifting out of square, builder-grade faucet and fixture swaps as the first wave ages, ceiling fans, TV mounting, closet and garage storage, and smart-device installs.</strong> Exterior work runs to porch and railing upkeep, fence and gate repairs matched to community styles, gutter care, and re-caulking where siding meets trim. It is one-visit work almost without exception, which makes list-batching the economical way to book it.</p>`,
    watchOut: `<p><strong>The Harris Ranch wrinkle is street visibility: in a porch-forward, design-coherent neighborhood, exterior wear shows early and repairs are expected to match exactly.</strong> A weathered rail or a mismatched fence board reads from the sidewalk here in a way it would not on a half-acre lot. Practically that means exterior repairs are match-what-exists work, materials, profiles, colors, and that small exterior upkeep done promptly is what keeps a house looking like it belongs to the street it is on.</p>`,
    seasonal: `<p><strong>Seasonally Harris Ranch runs the standard valley calendar, young-tree edition: gutters are quick work but still need the fall look, the pre-freeze weatherseal pass and hose-bib protection matter as everywhere, and sprinkler blowout closes October.</strong> Spring means porch, rail, fence, and gate checks, plus sprinkler startup fixes; summer UV works hardest on foothill-facing paint and any south-facing porch detail, where touch-ups are worth an annual look.</p>`,
    faqs: [
      {
        question: 'What do Harris Ranch homes typically need?',
        answer:
          'The newer-home canon: settling drywall repairs, door adjustments, builder-grade fixture swaps as components hit their first replacement age, fans, mounts, storage installs, and caulk refresh. Exteriors need porch, rail, fence, and gutter upkeep matched to community styles. Nearly all of it is one-visit work.',
      },
      {
        question: 'Do you match community styles on exterior repairs?',
        answer:
          'Yes, repairs are matched to existing materials, profiles, and colors, which in a design-coherent neighborhood is the requirement anyway. If your specific repair type needs community approval first, share the guideline and we will work to it.',
      },
      {
        question: 'What does handyman work cost in Harris Ranch?',
        answer:
          'Valley-standard: most single repairs run $100 to $500 and our services carry flat starting prices from $145. Punch-list batching is the money move for homes this age, one visit clearing eight or ten small items costs far less per item than separate calls.',
      },
      {
        question: 'My home is still under builder warranty: should I call you or the builder?',
        answer:
          'The builder first, for anything the warranty covers, document settling items and submit them before the warranty window closes, typically at one year. We handle what the warranty does not cover, and everything after it expires, which is when the punch-list pattern begins.',
      },
      {
        question: 'How do I book?',
        answer:
          'Send your list with photos through the contact page. Quotes come back flat, usually within a day, and most Harris Ranch visits are scheduled within the week and completed in one trip with materials in hand.',
      },
    ],
  },
];

function buildLocationGuide(p: PlaceGuide): GuidePageData {
  const county = countyLabel(p.county);

  const coverageCallout =
    `<div class="callout note"><p class="callout-label">${p.name}: service snapshot</p>` +
    `<p>${p.name} is in <strong>${county}</strong> and sits fully inside our Treasure Valley service area. ` +
    `We handle drywall repair, minor plumbing and electrical, carpentry and trim, painting, mounting and assembly, fence, deck, and gutter repair, and seasonal maintenance, with flat quotes from photos and one-trip completion as the goal. ` +
    `Jobs that need a licensed specialty trade or a major permit get named as such at the quote, see <a href="/resources/ada-canyon-permit-flow">when a home repair needs a permit</a>.</p></div>`;

  const content = [
    coverageCallout,
    `<h2 id="housing-stock">What ${p.name} homes are like, and why it matters</h2>`,
    p.housingStock,
    `<h2 id="common-repairs">The repairs ${p.name} homes actually need</h2>`,
    p.commonRepairs,
    `<p>For typical prices on all of this, see the <a href="/guides/boise-home-repair-cost-guide">Boise home repair cost guide</a>, most single repairs across the valley land between $100 and $500, and our services carry flat starting prices from $145.</p>`,
    `<h2 id="watch-out">The thing that catches people out here</h2>`,
    p.watchOut,
    `<h2 id="seasonal">Seasonal maintenance in ${p.name}</h2>`,
    p.seasonal,
    `<p>The full season-by-season checklist for Treasure Valley homes is in <a href="/guides/boise-home-maintenance-guide">the complete Boise home maintenance guide</a>, with a printable version on the <a href="/resources">resources page</a>.</p>`,
    `<h2 id="how-we-work">How we work in ${p.name}</h2>`,
    `<p><strong>Send the list with photos, get a flat quote, and we aim to finish in one trip.</strong> The quote names the scope and the price before we arrive, and it does not move unless the scope does, in which case you approve the change first. Batching several small jobs into one visit spreads the trip cost and is the cheapest way to buy this kind of work anywhere in the valley, and especially outside the core cities. Our labor carries a workmanship guarantee, and anything on your list that belongs with a licensed specialty trade gets said plainly at the quote stage.</p>`,
    `<p>Services relevant here: <a href="/services/drywall-repair">drywall repair</a>, <a href="/services/plumbing-repairs">minor plumbing</a>, <a href="/services/electrical-repairs">minor electrical</a>, <a href="/services/carpentry-trim-repair">carpentry and trim</a>, <a href="/services/painting-touch-ups">painting</a>, <a href="/services/mounting-assembly">mounting and assembly</a>, <a href="/services/fence-deck-gutter-repair">fence, deck, and gutter repair</a>, and <a href="/services/home-maintenance">home maintenance</a>. See also <a href="/areas/${p.citySlug}">our ${p.citySlug} service area page</a> and <a href="/guides/hire-a-handyman-treasure-valley">how to hire a handyman in the Treasure Valley</a>.</p>`,
    `<h2 id="next-steps">Start with the list</h2>`,
    `<p>The fastest way to get a real answer about a repair in ${p.name} is to show it to us: <a href="/contact">send the list and a few photos</a> and we will reply with a flat quote and the earliest slot, usually within a day. No site-visit fee, no obligation, and if something on the list is not a handyman job, we will tell you whose job it is.</p>`,
  ].join('\n');

  return {
    slug: p.slug,
    title: p.title,
    seoTitle: p.seoTitle,
    metaDescription: p.metaDescription,
    excerpt: p.excerpt,
    content,
    author: 'Boise Handyman Co',
    hubSlug: 'costs-and-hiring',
    guideType: p.guideType,
    tags: [p.citySlug, p.name.toLowerCase(), 'idaho', 'handyman'],
    publishedAt: '2026-06-20',
    updatedAt: '2026-08-13',
    // Hero imagery comes from the blog image registry (see
    // scripts/generate-blog-image-registry.ts), which maps each location guide
    // to its own city streetscape. An explicit override here used to point at
    // /images/guides/<slug>.webp, files that never existed, so every location
    // guide rendered a broken hero. Omit the override and let the registry win.
    quickAnswer: p.quickAnswer,
    keyTakeaways: p.takeaways,
    faqs: p.faqs,
    linkedCities: [p.citySlug],
    relatedLinks: [
      { url: `/areas/${p.citySlug}`, anchor: `Handyman services in ${p.name}` },
      { url: '/guides/boise-home-repair-cost-guide', anchor: 'Boise Home Repair Cost Guide' },
      { url: '/guides/hire-a-handyman-treasure-valley', anchor: 'How to hire a handyman' },
      { url: '/guides/boise-home-maintenance-guide', anchor: 'Boise home maintenance guide' },
      { url: '/services/home-maintenance', anchor: 'Caulking & home maintenance' },
    ],
    primaryKeyword: `handyman ${p.name.toLowerCase()}`,
  };
}

export const LOCATION_GUIDES: GuidePageData[] = PLACES.map(buildLocationGuide);
