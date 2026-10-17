/**
 * Per-city area page copy for the seven Treasure Valley hubs.
 * Other cities keep the shared template in shared/seoContent.ts.
 * Visible FAQ text and FAQPage schema both read this array, in this order.
 */
export interface AreaFaq {
  question: string;
  answer: string;
}

export interface AreaCityCopy {
  intro: string;
  faqs: AreaFaq[];
}

export const AREA_CITY_COPY: Record<string, AreaCityCopy> = {
  boise: {
    intro:
      "Boise's houses have some age on them: the median home was built in 1986, and about 17% of the city's housing predates 1960 (Census ACS 2020-2024). Boise Handyman Co takes care of the small stuff those homes collect, from drywall cracks and sticking doors to dripping faucets, loose deck boards, and a TV that needs mounting, with one written quote upfront and most jobs done in a single visit.",
    faqs: [
      {
        question: 'What kinds of jobs do you take on?',
        answer:
          'Small repairs, installs, and maintenance around Boise homes: patching drywall, touching up paint, fixing minor plumbing and electrical problems, repairing doors and carpentry, mounting TVs and assembling furniture, mending fences, decks, and gutters, and caulking or weatherproofing. Most jobs take one to eight hours.',
      },
      {
        question: 'How does pricing work?',
        answer:
          "You get one written quote upfront, before work starts, and it's priced by the time the job takes, with a one-hour minimum. A single small repair starts around $145, materials are billed at cost on their own line, and grouping a few tasks per visit is the best value (prices are being finalized; every job gets a written quote first).",
      },
      {
        question: 'Do you handle remodels or large projects?',
        answer:
          "No. We don't do full remodels, additions, or work that needs a general contractor or major permits. Our focus is small jobs done well. If your Boise project is bigger than that, we're glad to point you to contractors we trust.",
      },
      {
        question: 'How do I get started?',
        answer:
          "Call or text (208) 477-1169, try the online estimator to see a preliminary planning range, or use the contact form to share your list and a few photos. You'll have an upfront quote within one business day.",
      },
      {
        question: 'Do you serve Boise, Idaho?',
        answer:
          'Yes. Boise is core Treasure Valley territory for us, Downtown, the East End, and Southwest Boise included. We handle small repairs, installs, and maintenance anywhere in the city, and quotes and pricing match everywhere else we work.',
      },
      {
        question: 'Which small jobs need a permit in Boise?',
        answer:
          "More than people expect. The City of Boise homeowner guide requires a plumbing permit to install or replace a water heater, an electrical permit to add an outlet or light fixture, and a building permit for a deck more than 12 inches high or a fence over seven feet. Low-voltage outdoor lighting needs none. Work that needs a licensed trade or a major permit is out of our scope, and we refer it out honestly.",
      },
      {
        question: 'Anything special about older and historic Boise homes?',
        answer:
          'Two things. Roughly four in ten Boise homes (42%) predate 1980, and older houses tend to show doors that have settled, caulk that has aged, and original fixtures. And in a Boise historic district, the city requires a Certificate of Appropriateness from Planning for many exterior changes, including windows and siding, before that work starts.',
      },
    ],
  },
  meridian: {
    intro:
      "Most of Meridian's housing is young: about 70% of homes were built in 2000 or later, and 82% are detached single-family houses (Census ACS 2020-2024). Newer doesn't mean maintenance-free, and Boise Handyman Co covers the punch lists that come with it across Meridian, including drywall cracks, caulk lines, loose fixtures, fence panels, and mounting jobs, all quoted upfront as one written price.",
    faqs: [
      {
        question: 'What kinds of jobs do you take on?',
        answer:
          'The small stuff on your Meridian list: drywall patches and paint touch-ups, minor electrical and plumbing fixes, door and carpentry repair, furniture assembly, TV mounting, gutter, deck, and fence repair, plus caulk and weatherproofing. Small repairs, installs, and maintenance, basically, and a typical job runs one to eight hours.',
      },
      {
        question: 'How does pricing work?',
        answer:
          "Before anything starts, you get a single upfront written quote. It's based on how long the work takes, with a one-hour minimum; materials show up as a separate line at cost; and stacking a few jobs into the same trip gives you the best value.",
      },
      {
        question: 'Do you handle remodels or large projects?',
        answer:
          "Not those. Full remodels, additions, and jobs that call for a general contractor or major permits fall outside what we do. We'd rather do small jobs well, and for a larger Meridian project we're happy to send you to contractors we trust.",
      },
      {
        question: 'How do I get started?',
        answer:
          "Text or call us, get a preliminary range from the estimator on our site, or send photos and your to-do list via the contact form. Within one business day we'll get back to you with an upfront quote.",
      },
      {
        question: 'Do you serve Meridian, Idaho?',
        answer:
          'Yes, Meridian is a core part of our service area, from Paramount to Lochsa Falls. Small repairs, installs, and maintenance anywhere in town get the same upfront quoting and the same rates we use across the Treasure Valley.',
      },
      {
        question: 'Do I need a permit for a fence or shed in Meridian?',
        answer:
          'For a fence, yes: Meridian requires a Residential Fence permit (R-FEN), listed at $10 on the city fee schedule, with a drawing of the placement but no plan review. A one-story detached shed of 200 sq ft or less needs no building permit, though setbacks and HOA rules still apply, and any electrical work needs its own permit.',
      },
      {
        question: 'How wet does Meridian get, and when should exterior work happen?',
        answer:
          'Not very. A CoCoRaHS gauge 4.8 miles south-southeast of Meridian averages about 12.8 inches of precipitation a year in NOAA\'s 1991-2020 normals, with January at 1.43 inches and July at just 0.37. Dry summers suit fence, deck, and exterior caulk work, and interior jobs run year-round.',
      },
    ],
  },
  nampa: {
    intro:
      "Nampa's homes run the full range, with about 15% built before 1960 and 22% since 2010 (Census ACS 2020-2024), so one street can need very different fixes. Boise Handyman Co covers Nampa and Canyon County with the fix-it work: one written price before work starts, materials at cost, and most jobs wrapped up in a single trip.",
    faqs: [
      {
        question: 'What kinds of jobs do you take on?',
        answer:
          'In Nampa we handle repairs, installs, and upkeep that fit in one to eight hours: sticking doors and carpentry, drywall holes, minor plumbing and electrical fixes, paint touch-ups, furniture assembly, wall-mounted TVs, fences, gutters, and decks, and caulking and weatherproofing.',
      },
      {
        question: 'How does pricing work?',
        answer:
          'Pricing is time-based with a one-hour minimum, and you see it as one upfront written quote before work begins. For context, Treasure Valley handyman rates typically run $60 to $120 per hour. Materials are listed separately at cost, and if you group several small tasks you get the best value.',
      },
      {
        question: 'Do you handle remodels or large projects?',
        answer:
          "No, those sit outside our scope: full remodels, additions, and anything that has to involve a general contractor or major permits. We stay focused on doing small jobs well, and we'll gladly pass a bigger Nampa project to contractors we trust.",
      },
      {
        question: 'How do I get started?',
        answer:
          "Reach us by phone or text, pull a preliminary planning range from the online estimator, or attach your list and photos to a contact-form message. You'll hear back within one business day, upfront quote included.",
      },
      {
        question: 'Do you serve Nampa, Idaho?',
        answer:
          'Yes. Nampa is one of our core Treasure Valley cities, with Greenhurst on the map. Every small repair, install, or maintenance job here is quoted and priced exactly as it would be anywhere else we work.',
      },
      {
        question: 'Does Nampa require a permit to replace or repair a fence?',
        answer:
          "Yes. Nampa's Planning and Zoning fence permit, a $10 nonrefundable fee, covers residential fences that are built, replaced, or substantially repaired in city limits. The city's handout caps fences at 6 feet, limits front-yard fences to 3 feet solid or 4 feet open-vision, and keeps them 36 inches from fire hydrants.",
      },
      {
        question: 'Does outdoor lighting need a permit in Nampa?',
        answer:
          "It depends on voltage. Nampa's residential FAQ says low-voltage outdoor lighting needs no electrical permit, while 110-volt lighting does. The same FAQ exempts interior painting, flooring, and cabinets, but requires a permit once framing is exposed or plumbing fixtures are relocated.",
      },
    ],
  },
  eagle: {
    intro:
      'Eagle summers run hot: 1991-2020 NOAA normals at the Boise airport, the nearest official weather station, average about 55 days a year at 90°F or above. That sun is hard on exterior paint, caulk, and deck boards. Boise Handyman Co handles that upkeep across Eagle, along with indoor repairs and installs, and quotes every job as one written price before work starts.',
    faqs: [
      {
        question: 'What kinds of jobs do you take on?',
        answer:
          'Small repairs, installs, and maintenance for Eagle homes. That covers TV mounting and furniture assembly, caulking and weatherproofing, carpentry and door repair, drywall patching, touch-up painting, minor plumbing or electrical fixes, and repairs to fences, decks, and gutters. Most jobs land between one and eight hours.',
      },
      {
        question: 'How does pricing work?',
        answer:
          'One upfront written quote, delivered before any work begins. The price reflects the time the job takes, subject to a one-hour minimum. Materials appear on their own line at cost, and the best value comes from bundling several tasks into the same visit.',
      },
      {
        question: 'Do you handle remodels or large projects?',
        answer:
          'No. Additions, full remodels, and work that requires a general contractor or major permits are beyond us. Small jobs done well is the whole idea, and if your Eagle project is larger, we can recommend contractors we trust.',
      },
      {
        question: 'How do I get started?',
        answer:
          "Phone, text, or check the estimator for a preliminary planning number. Prefer to write it out? Send the list and some photos through our contact form, and we'll answer with an upfront quote inside one business day.",
      },
      {
        question: 'Do you serve Eagle, Idaho?',
        answer:
          "Yes. Eagle is in our core coverage, Banbury and Floating Feather included. We do small repairs, installs, and maintenance throughout Eagle, at the same upfront quotes and pricing you'd get elsewhere in the valley. Our Eagle Foothills guide covers hillside homes.",
      },
      {
        question: "What are Eagle's rules for a front-yard fence?",
        answer:
          "Any residential fence or retaining wall in a front yard or along a street needs a Fence Permit from Eagle Planning and Zoning, regardless of height. Fences over 6 feet also need a building permit, and fences on common lots require Design Review first, according to the City of Eagle's fences and retaining walls page.",
      },
      {
        question: 'How old are homes in Eagle?',
        answer:
          "Mostly newer. Census ACS 2020-2024 estimates put Eagle's median year built at 2007, with 86% of homes detached single-family houses. Even newer homes need regular attention to caulk lines, door adjustments, and exterior touch-ups as they go through freeze-thaw seasons.",
      },
    ],
  },
  kuna: {
    intro:
      "Kuna's homes are some of the newest in the valley, with a median build year of 2008 and roughly 15% built in 2020 or later, per Census ACS 2020-2024 estimates. We take on the small jobs Kuna homeowners collect, from first-year punch lists to fence and gutter repairs, with one written price upfront, materials at cost, and never a travel surcharge.",
    faqs: [
      {
        question: 'What kinds of jobs do you take on?',
        answer:
          'Fence, deck, and gutter repair; caulking and weatherproofing; drywall patching; painting touch-ups; door and carpentry repair; minor plumbing and electrical fixes; TV mounting and furniture assembly. In short, the small repairs, installs, and maintenance Kuna homes need, with most jobs taking one to eight hours.',
      },
      {
        question: 'How does pricing work?',
        answer:
          "You'll see one upfront written quote before work starts. We price by the time a job takes, with a one-hour minimum, show materials as a separate at-cost line, and the best deal is a visit that knocks out several items at once.",
      },
      {
        question: 'Do you handle remodels or large projects?',
        answer:
          "No, we leave full remodels, additions, and general-contractor or major-permit work to others. We do small jobs well, and when a Kuna project outgrows that, we're glad to refer it to contractors we trust.",
      },
      {
        question: 'How do I get started?',
        answer:
          'Send a text or call, plug your job into the online estimator for a preliminary range, or post your task list and pictures through our contact form. A written upfront quote comes back within one business day.',
      },
      {
        question: 'Do you serve Kuna, Idaho?',
        answer:
          'Yes. Kuna sits in our core Treasure Valley area. Indian Creek is the creek that runs through Kuna, Nampa, and Caldwell, and Indian Creek Plaza is in Caldwell. Repairs, installs, and maintenance in Kuna are quoted the same way, and priced the same, as every other place we work.',
      },
      {
        question: 'What does a Kuna fence permit cost?',
        answer:
          "The City of Kuna Building Department's fee schedule lists a $25 residential fence application fee, and a $65 reinstatement fee for patio or fence permits. Confirm current requirements with the department at 751 W 4th Street before a new or replacement fence goes in.",
      },
      {
        question: 'When does Kuna get its wet weather?',
        answer:
          "Mostly in winter. In NOAA's 1991-2020 normals, the volunteer CoCoRaHS gauge 1.5 miles south-southeast of Kuna records roughly 11.8 inches a year: 1.35 inches in an average January versus 0.29 in July. That's why gutter cleaning before the first freeze and caulk refreshes before winter pay off.",
      },
    ],
  },
  caldwell: {
    intro:
      "Caldwell's median home was built in 2003, yet about 15% of its housing was built before 1960 (Census ACS 2020-2024), so one week can bring a modern fixture swap and a settled original door. Boise Handyman Co works across Caldwell with repairs, installs, and upkeep, priced upfront in writing.",
    faqs: [
      {
        question: 'What kinds of jobs do you take on?',
        answer:
          'Drywall patching, door and carpentry repair, paint touch-ups, minor plumbing and electrical fixes, weatherproofing and caulking, fence and deck and gutter repair, TV mounting, furniture assembly: those are the Caldwell jobs we take on, small repairs, installs, and maintenance that usually take one to eight hours each.',
      },
      {
        question: 'How does pricing work?',
        answer:
          'Each job is priced by time with a one-hour minimum and written up as a single upfront quote before work starts. Materials are a separate line billed at cost. Bundling tasks together is the best value for Caldwell homeowners.',
      },
      {
        question: 'Do you handle remodels or large projects?',
        answer:
          "No. Remodels, additions, and projects that need major permits or a general contractor aren't in our scope. Small jobs, done well, are what we do; for larger Caldwell work, we're glad to connect you with contractors we trust.",
      },
      {
        question: 'How do I get started?',
        answer:
          "The quickest options: a call or text, the estimator's preliminary planning range, or uploading your list and photos via the contact form. We respond inside one business day with an upfront quote.",
      },
      {
        question: 'Do you serve Caldwell, Idaho?',
        answer:
          'Yes. Caldwell is core service territory, with Wilson among its neighborhoods. Indian Creek is the creek that runs through Kuna, Nampa, and Caldwell, and Indian Creek Plaza is in Caldwell. Small repairs, installs, and upkeep throughout Caldwell carry identical upfront quoting and pricing to anywhere else in our service area.',
      },
      {
        question: 'Is a permit needed for a fence in Caldwell?',
        answer:
          "Caldwell's Department of Building Safety treats fences as a miscellaneous project: you complete the building permit application and the city does a minimal review. Any electrical, plumbing, or mechanical work needs its own separate permit, per the city's residential permit packet.",
      },
      {
        question: 'When do freezes start and end around Caldwell?',
        answer:
          "NOAA's 1991-2020 normals for the Deer Flat Dam station at Lake Lowell, southwest of Caldwell, put the median last spring freeze around April 23 and the first fall freeze around October 18. That window is the best time for exterior caulking, deck, and fence repairs, while interior work runs all year.",
      },
    ],
  },
  star: {
    intro:
      'Star is the youngest city we serve: about half its homes went up in 2010 or later, and 90% are single-family detached (Census ACS 2020-2024). We help Star homeowners with the repairs, installs, and maintenance that new, settling houses need, quoted upfront as one written price with materials at cost.',
    faqs: [
      {
        question: 'What kinds of jobs do you take on?',
        answer:
          'For Star homes we mount TVs, assemble furniture, patch drywall, touch up paint, make minor electrical and plumbing repairs, fix carpentry and doors, repair fences, decks, and gutters, and caulk and weatherproof. These small repair, install, and maintenance tasks typically take one to eight hours.',
      },
      {
        question: 'How does pricing work?',
        answer:
          "You'll get one upfront written quote first, before we start. The number is based on time, with a one-hour minimum. Materials are their own at-cost line, and combining multiple tasks in a single visit is where the best value is.",
      },
      {
        question: 'Do you handle remodels or large projects?',
        answer:
          'No. Full remodels and additions, along with anything calling for a general contractor or major permits, sit outside our scope. We keep to small jobs done well and happily refer larger Star projects to contractors we trust.',
      },
      {
        question: 'How do I get started?',
        answer:
          "Call or text, see a preliminary planning range in the online estimator, or attach photos and the task list to the contact form. We'll reply within one business day with your upfront quote.",
      },
      {
        question: 'Do you serve Star, Idaho?',
        answer:
          'Yes, Star is part of our core coverage, including Star River Ranch. Small repairs, installs, and maintenance across Star are quoted and priced just as in the rest of the Treasure Valley.',
      },
      {
        question: 'When does a Star home project need a permit?',
        answer:
          "Star's building FAQ lists fences over 6 feet, decks 30 or more inches above grade, re-roofing, siding replacement over 100 sq ft, sheds of 200 sq ft or more, and patio covers or pergolas, among others. A concrete slab of any size needs no building permit. Larger permitted work is outside our scope and gets referred out.",
      },
      {
        question: 'When should Star homeowners schedule exterior work?',
        answer:
          'Between freezes. The Boise Airport station, the official weather site closest to Star, has a median last spring freeze near April 24 and a first fall freeze near October 21 in NOAA\'s 1991-2020 normals. Gutters are best cleaned in late fall, before that first freeze.',
      },
    ],
  },
  middleton: {
    intro:
      "Middleton's housing is newer than most: the median home was built in 2009, and about one in eight went up in 2020 or later (Census ACS 2020-2024). Boise Handyman Co handles the small repairs, installs, and maintenance those homes need across Middleton and Canyon County, quoting each job upfront and finishing most of them in one visit.",
    faqs: [
      {
        question: 'What kinds of jobs do you take on?',
        answer:
          "Mounting a TV, assembling furniture, patching drywall, touching up paint, fixing a minor plumbing or electrical problem, repairing a door or other carpentry, mending fences, decks, and gutters, refreshing caulk and weatherproofing: that's the Middleton work we do. It's all small repairs, installs, and maintenance, and most jobs need one to eight hours.",
      },
      {
        question: 'How does pricing work?',
        answer:
          "First you get a written quote, one upfront price before anything starts. It reflects the job's time, subject to a one-hour minimum; materials go on a separate line at cost; and lining up several tasks for one visit gives you the best value.",
      },
      {
        question: 'Do you handle remodels or large projects?',
        answer:
          "No. A full remodel, an addition, or a job that calls for a general contractor or major permits is outside our lane, because doing small jobs well is the point. If your Middleton project is bigger, we'll refer you to contractors we trust.",
      },
      {
        question: 'How do I get started?',
        answer:
          'Text or call (208) 477-1169, see a preliminary planning range in our estimator, or send your to-do list and a few photos through the contact form. Expect an upfront quote from us within one business day.',
      },
      {
        question: 'Do you serve Middleton, Idaho?',
        answer:
          'Yes, we cover Middleton as part of our core Treasure Valley area, Middleton Heights included. Same-week scheduling is typical, and every small repair, install, or maintenance job in town carries the same upfront quotes and pricing as the rest of our area.',
      },
      {
        question: 'Does a fence in Middleton need a permit?',
        answer:
          'Not if it follows the code. Middleton exempts residential fencing that complies with city code from the building permit requirement. That code caps residential fences at 6 feet, allows a 3-foot privacy fence or a 4-foot see-through fence in front and side-street setbacks, and prohibits electric and barbed wire fences except when containing animals or in an industrial zone.',
      },
      {
        question: 'When do freezes start and stop around Middleton?',
        answer:
          "Using 1991-2020 NOAA data from the long-term Nampa Sugar Factory station, which lies roughly 7 miles south-southeast, the typical last frost of spring falls near April 29 and the first of fall near October 13, a growing season of roughly 164 days. Exterior caulk, paint, and fence repairs fit best inside that window.",
      },
    ],
  },
  'garden-city': {
    intro:
      "Garden City is about 6 miles from the Boise Airport weather station, where NOAA's 1991-2020 normals record about 17.6 inches of snow a season and average December and January lows near 25°F. Boise Handyman Co provides handyman services for Garden City homes and the rest of Ada County: small repairs, installs, and maintenance, quoted upfront and usually finished in one visit.",
    faqs: [
      {
        question: 'What kinds of jobs do you take on?',
        answer:
          'Garden City jobs we handle include fence, gutter, and deck repair, minor electrical and plumbing fixes, drywall patching and painting touch-ups, door and carpentry fixes, assembling furniture and mounting TVs, and caulking and weatherproofing. Small repairs, installs, and maintenance, in other words, typically one to eight hours each.',
      },
      {
        question: 'How does pricing work?',
        answer:
          'Time-based pricing with a one-hour minimum, written up as one upfront quote that you approve before work starts. Materials are billed separately at cost, and putting several jobs on one visit is the best value.',
      },
      {
        question: 'Do you handle remodels or large projects?',
        answer:
          'No, not those. We skip full remodels and additions, plus any job requiring a general contractor or major permits, so we can focus on small jobs done well. Larger Garden City work gets referred to contractors we trust.',
      },
      {
        question: 'How do I get started?',
        answer:
          "Call or text us, check our online estimator for a preliminary number, or use the contact form to send your list with photos. We'll reply with an upfront quote within one business day.",
      },
      {
        question: 'Do you serve Garden City, Idaho?',
        answer:
          'Yes. Garden City falls within our core Treasure Valley coverage. We take care of small repairs, installs, and maintenance throughout the city, and quotes and prices are identical to anywhere else we go.',
      },
      {
        question: 'Which small jobs skip the permit in Garden City?',
        answer:
          "Garden City's building code exempts painting, papering, tiling, carpeting, cabinets, and countertops; work with a total value of $500 or less; fences up to 7 feet; decks no more than 12 inches above grade that don't serve the required exit door; and one-story sheds up to 200 sq ft. Exempt work still has to meet code and zoning rules.",
      },
      {
        question: 'Are there fence rules near the Greenbelt in Garden City?',
        answer:
          'Yes. The city prohibits fences and retaining walls within 5 feet of the Greenbelt or Nature Path travel way, and fences 5 to 15 feet from it, or next to a public park, are limited to 3.5 feet unless screening conditions are met. Fences along a public street or in a front setback are limited to 3.5 feet unless they sit behind a building or are set back at least 10 feet for landscaping, and rear or side yard fences between homes top out at 6 feet.',
      },
    ],
  },
};

export function getAreaCityCopy(slug: string): AreaCityCopy | undefined {
  return AREA_CITY_COPY[slug];
}
