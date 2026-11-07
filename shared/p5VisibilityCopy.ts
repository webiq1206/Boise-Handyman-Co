/**
 * P5 visibility copy for /, /areas/boise and /areas/caldwell.
 * Titles and answers follow the checked brief, with the QA edits: no guarantee
 * or warranty claim, and arrival time is a booking step. Call only.
 */

export const HOME_TITLE = 'Handyman Services in Boise, ID';
export const HOME_DESCRIPTION =
  'Get your Boise repair list handled with a written quote before work starts. Share your list and photos so our team can review your project. Call us today.';
export const HOME_ANSWER =
  'Get your repair list handled with a written quote before work starts. Boise Handyman Co helps with small repairs, installs and home maintenance across Boise and the Treasure Valley. Share your list and photos so we can review the work and confirm your arrival time when you book.';

export const BOISE_AREA_TITLE = 'Boise Handyman, Written Quote First';
export const BOISE_AREA_DESCRIPTION =
  'Get your Boise repair list handled with a written quote first. We confirm your arrival time when you book. Call us about repairs for your home in Boise.';
export const BOISE_AREA_ANSWER =
  'Get your Boise repair list handled, from North End plaster to Harris Ranch nail pops. Boise Handyman Co reviews your list and photos and gives you one written quote before work starts. Our own crew does the work, and we confirm your arrival time when you book.';

export const CALDWELL_AREA_TITLE = 'Caldwell Handyman, Written Quote First';
export const CALDWELL_AREA_DESCRIPTION =
  'Get your Caldwell repair list handled, from older homes near the historic core to newer subdivisions, with a written quote before work starts. Call us.';
export const CALDWELL_AREA_ANSWER =
  'Get your Caldwell repair list handled with a written quote before work starts. Boise Handyman Co works on older homes near the historic core and newer subdivisions. Share your list and photos so we can review the work, explain the next steps and confirm your arrival time when you book.';

export const AREA_TITLE_BY_SLUG: Record<string, string> = {
  boise: BOISE_AREA_TITLE,
  caldwell: CALDWELL_AREA_TITLE,
};

export const AREA_DESCRIPTION_BY_CITY: Record<string, string> = {
  Boise: BOISE_AREA_DESCRIPTION,
  Caldwell: CALDWELL_AREA_DESCRIPTION,
};

/** Visible paragraph directly under the area H1. Keyed by that H1. */
export const AREA_ANSWER_UNDER_H1: Record<string, string> = {
  'Handyman in Boise, Idaho': BOISE_AREA_ANSWER,
  'Handyman in Caldwell, Idaho': CALDWELL_AREA_ANSWER,
};

export interface VisibilityFaq {
  question: string;
  answer: string;
}

export const HOME_VISIBILITY_FAQS: VisibilityFaq[] = [
  {
    question: 'What if the job needs a licensed plumber or electrician?',
    answer: 'Work that needs a licensed trade is referred out, so the right specialist handles it.',
  },
  {
    question: 'Do you confirm arrival times?',
    answer: 'Yes. We confirm your arrival time when you book.',
  },
];

export const AREA_VISIBILITY_FAQS: Record<string, VisibilityFaq[]> = {
  boise: [
    {
      question: 'How do I get a quote for repairs in Boise?',
      answer: 'Share your repair list and photos. We review the work and provide a written quote before work starts.',
    },
    {
      question: 'What if a small repair turns into something bigger?',
      answer: 'If a fixture swap uncovers work that needs a licensed electrician or plumber, it is referred out rather than stretched into a handyman job.',
    },
  ],
  caldwell: [
    {
      question: 'How do I get a quote for repairs in Caldwell?',
      answer: 'Share your repair list and photos. We review the work and provide a written quote before work starts.',
    },
  ],
};
