/**
 * P5 visibility copy for /, /areas/boise and /areas/caldwell.
 * Wording is the Sam-checked Priya brief (7 Nov 2026). Do not paraphrase.
 * Call only: no SMS or text call to action in this copy.
 */

export const HOME_TITLE = 'Handyman Services in Boise, ID';
export const HOME_DESCRIPTION =
  'Hand us your repair list and get one written quote before work starts. Our own crew does the work, backed by a written workmanship guarantee. Call us.';
export const HOME_ANSWER =
  'Get your repair list handled with one written quote before work starts. Boise Handyman Co takes on small repairs, installs and home maintenance across Boise and the Treasure Valley. Share your list and photos. Our own crew does the work, repairs carry a written workmanship guarantee, and you get an arrival time and confirmation before we head out.';

export const BOISE_AREA_TITLE = 'Boise Handyman, Written Quote First';
export const BOISE_AREA_DESCRIPTION =
  'From North End plaster to Harris Ranch nail pops, get your Boise repair list handled with one written quote first and a confirmed arrival time. Call us.';
export const BOISE_AREA_ANSWER =
  'Get your Boise repair list handled, from North End plaster to Harris Ranch nail pops. Boise Handyman Co reviews your list and photos and gives you one written quote before work starts. Our own crew does the work, and you get an arrival time and a confirmation before we head out.';

export const CALDWELL_AREA_TITLE = 'Caldwell Handyman, Written Quote First';
export const CALDWELL_AREA_DESCRIPTION =
  'Get your Caldwell repair list handled, from older homes near the historic core to newer subdivisions, with a written quote before work starts. Call us.';
export const CALDWELL_AREA_ANSWER =
  'Get your Caldwell repair list handled with a written quote before work starts. Boise Handyman Co works on older homes near the historic core and newer subdivisions. Share your list and photos so we can review the work, explain the next steps and confirm an arrival time before we head out.';

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
    answer: 'Yes. You get an arrival time and a confirmation before we head out.',
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
    {
      question: 'Is the work guaranteed?',
      answer: 'Yes. Our workmanship carries a written guarantee, and manufacturer warranties pass through on parts we supply.',
    },
  ],
};
