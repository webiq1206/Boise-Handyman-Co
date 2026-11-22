/**
 * Paste-ready /services hub and homepage proof copy (Priya, 21 November 2026).
 * The visible FAQ and the FAQPage JSON-LD both read SERVICES_HUB_FAQS, so the
 * two cannot drift. No hourly rate, no warranty length, no street address.
 */

export const HOME_META_DESCRIPTION =
  'Boise handyman for small repairs, installs and home upkeep across the Treasure Valley. One written quote before work starts. Call, text or send your list.';

export const SERVICES_HUB_TITLE = 'Boise Handyman Services and Home Repairs';

export const SERVICES_HUB_DOCUMENT_TITLE = `${SERVICES_HUB_TITLE} | Boise Handyman Co`;

export const SERVICES_HUB_DESCRIPTION =
  'Handyman services in Boise and the Treasure Valley: drywall, trim, doors, painting, mounting and repair lists. One written quote before any work starts.';

export const SERVICES_HUB_OG_TITLE = 'Handyman services in Boise and the Treasure Valley';

export const SERVICES_HUB_OG_DESCRIPTION =
  'Send your list and photos, get one written quote, and pay when the work is done.';

export const SERVICES_HUB_H1 = 'Handyman services in Boise and the Treasure Valley';

export const SERVICES_HUB_ANSWER =
  'Boise Handyman Co takes care of the small repairs, installs and upkeep that pile up around a home in Boise and the Treasure Valley. Send your list and a few photos, get one written quote before any work starts, and pay when the job is done. Call or text and a real person answers.';

export const SERVICES_HUB_FIX_INTRO =
  'Pick a service to see what is included, or put everything on one list and we will plan it as one visit.';

export const SERVICES_HUB_PRICING =
  'You get one written price for the whole list before anything is scheduled. We look at your tasks and photos, then quote the labor and list materials on their own line, so you can see exactly what you are paying for. There is no trip fee in Ada and Canyon County. Bundling several small jobs into one visit is usually the best value. If we open something up and find more than expected, we stop and agree a revised price with you first.';

export const SERVICES_HUB_PRICING_ID = 'how-a-handyman-visit-is-priced';

export const SERVICES_HUB_WHERE =
  'The same pricing applies across our whole service area, so where you live never inflates the quote.';

export const SERVICES_HUB_LARGER =
  'Some projects need more than a repair visit. When yours does, we will say so plainly and point you to the right team in the P5 Home Co family.';

export interface ServicesHubCard {
  title: string;
  benefit: string;
  href: string;
  link: string;
}

/** Parent service pages only. Never a /services/{service}/{city} URL. */
export const SERVICES_HUB_CARDS: readonly ServicesHubCard[] = [
  {
    title: 'Drywall repair and patching',
    benefit: 'Holes, cracks and water spots patched and blended so the wall looks whole again.',
    href: '/services/drywall-repair',
    link: 'drywall repair in Boise',
  },
  {
    title: 'Painting and touch-ups',
    benefit: 'Fresh rooms, trim and doors with careful prep and clean lines.',
    href: '/services/painting-touch-ups',
    link: 'interior painting and touch-ups',
  },
  {
    title: 'Carpentry and trim repair',
    benefit: 'Doors that close, trim that lines up and baseboards that look finished.',
    href: '/services/carpentry-trim-repair',
    link: 'carpentry and trim repair',
  },
  {
    title: 'Mounting and assembly',
    benefit: 'TVs, shelves and mirrors hung level and anchored right; furniture built and in use.',
    href: '/services/mounting-assembly',
    link: 'TV mounting and assembly',
  },
  {
    title: 'Fence, deck and gutter repair',
    benefit: 'Leaning panels, loose boards and clogged gutters put right before they get worse.',
    href: '/services/fence-deck-gutter-repair',
    link: 'fence, deck and gutter repair',
  },
  {
    title: 'Caulking and home maintenance',
    benefit: 'Fresh caulk, weatherproofing and the punch list you keep meaning to get to.',
    href: '/services/home-maintenance',
    link: 'home maintenance services',
  },
  {
    title: 'Minor plumbing repairs',
    benefit: 'Faucets, toilets, disposals and supply lines fixed without a full plumbing call.',
    href: '/services/plumbing-repairs',
    link: 'minor plumbing repairs',
  },
  {
    title: 'Minor electrical repairs',
    benefit: 'Outlets, switches, light fixtures and ceiling fans swapped safely.',
    href: '/services/electrical-repairs',
    link: 'minor electrical repairs',
  },
  {
    title: 'RE-10 and inspection repairs',
    benefit: 'Turn an inspection list into agreed repairs so your closing stays on track.',
    href: '/re-10-repairs-boise',
    link: 'RE-10 and inspection repairs',
  },
];

export const VISIT_STEPS = [
  {
    title: 'Send your list.',
    body: 'Text or upload the tasks and a few photos. Product details and your target date help.',
  },
  {
    title: 'Approve one written quote.',
    body: 'Review the work, time and materials before you commit.',
  },
  {
    title: 'Pick a visit time.',
    body: 'We confirm the arrival time and materials before we head out.',
  },
  {
    title: 'Walk through and done.',
    body: 'We review the work with you, clean up, and you pay when the job is finished.',
  },
] as const;

export const LARGER_WORK = [
  {
    lead: 'Kitchen, bath or whole-home remodel',
    name: 'Boise Remodeling Co',
    href: 'https://boiseremodeling.co',
  },
  {
    lead: 'New home, addition or build on your lot',
    name: 'Boise Construction Co',
    href: 'https://boiseconstruction.co',
  },
  {
    lead: 'New cabinets, vanities or built-ins',
    name: 'Boise Cabinet Co',
    href: 'https://boisecabinet.co',
  },
] as const;

export type VisitProofIcon = 'quote' | 'trip' | 'registered' | 'insured';

export interface VisitProofItem {
  icon: VisitProofIcon;
  label: string;
  line: string;
  verify?: boolean;
}

/** Homepage Block 1 and the services hub proof row. The lines match word for word. */
export const VISIT_PROOF: readonly VisitProofItem[] = [
  {
    icon: 'quote',
    label: 'Written quote first',
    line: 'One price for your whole list before any work starts.',
  },
  {
    icon: 'trip',
    label: 'No trip fee',
    line: 'Anywhere in Ada and Canyon County.',
  },
  {
    icon: 'registered',
    label: 'Registered',
    line: 'Idaho Registered Contractor #8381215.',
    verify: true,
  },
  {
    icon: 'insured',
    label: 'Insured',
    line: 'Our crew is insured.',
  },
];

export const SERVICES_HUB_FAQS: readonly { question: string; answer: string }[] = [
  {
    question: 'What does a handyman do in Boise?',
    answer:
      'A handyman takes care of small home repairs, installs and upkeep: drywall patches, paint touch-ups, sticking doors, loose trim, TV mounting, fixture swaps, fence and gutter fixes, and the punch list in between. Boise Handyman Co handles these across Boise and the Treasure Valley with one written quote per list.',
  },
  {
    question: 'How do I get a quote?',
    answer:
      'Call, text or send your list with a few photos. We review the tasks and reply with one written quote that lists labor and materials separately. You approve the number before anything is scheduled, and the quote is yours to keep.',
  },
  {
    question: 'Is there a trip fee?',
    answer:
      'No. There is no trip fee anywhere in Ada and Canyon County, and the same pricing applies in every city we serve.',
  },
  {
    question: 'Can you do several small jobs in one visit?',
    answer:
      'Yes, and it is usually the best value. Put everything on one list and we plan the visit around it, so you get more done with one arrival.',
  },
  {
    question: 'Do you take on remodels or additions?',
    answer:
      'No. Remodels, additions and work that needs a general contractor are outside our scope on purpose. We will tell you plainly and point you to Boise Remodeling Co or Boise Construction Co, our sister companies in the P5 Home Co family.',
  },
  {
    question: 'What areas do you serve?',
    answer:
      'We serve Boise, Meridian, Nampa, Eagle, Kuna, Caldwell, Star, Middleton and Garden City in Ada and Canyon County.',
  },
  {
    question: 'Is your work guaranteed?',
    answer:
      "Yes. Our own team's work comes with a written workmanship warranty. If something we repaired or installed fails because of how we did it, we come back and make it right.",
  },
];
