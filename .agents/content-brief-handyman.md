# Content brief: Boise Handyman Co blog posts

(Filename is historical: this brief previously covered the new-construction
library. As of the August 2026 conversion it is the authoring brief for the
**handyman** content library. Every article written for this site must satisfy
everything below. This file is the contract between the content and the rest of
the codebase; when a number here disagrees with an article, the article is
wrong.)

## The company

- **Name:** Boise Handyman Co (never "Boise Construction Co", never
  "Boise Remodeling Co", never "BCC" or "BRC")
- **What it is:** a locally owned **handyman service** doing SMALL repair,
  maintenance, and install jobs, typically 1 to 8 hours of work. It is not a
  home builder, not a remodeler, and not a general contractor, and must never
  be described as any of those.
- **Where:** based in Meridian, Idaho. Serves the Treasure Valley: Boise,
  Meridian, Eagle, Nampa, Kuna, Star, Middleton, and Caldwell, across Ada and
  Canyon County.
- **Author byline for all posts:** `Boise Handyman Co`

### Claims that are true and may be used

- An upfront quote before any work starts: hourly rate, trip fee, and expected
  time, with materials as their own line.
- One flat trip fee per visit, however many tasks are on the list, which is why
  bundling a punch list into one visit is the best value.
- An agreed arrival time rather than a half-day window.
- Most repairs and installs finished in a single visit ("one-trip fixes").
- If the scope grows once something is opened up, work stops and the price is
  agreed before it changes.
- Walkthrough and cleanup at the end of the job; workmanship made right if it
  ever falls short.
- Larger jobs (anything needing a general contractor or major permits) are
  referred out honestly.

### Claims that are forbidden

- Any license or registration number, certification, award, rating, membership,
  founding year, years in business, jobs-completed count, or staff name.
- Any named client, testimonial, review, or quotation from a customer.
- Any specific completed job presented as ours.
- "Licensed", "bonded", or "insured" as bare claims. Use "license and insurance
  details available on request".
- Offering out-of-scope work: new builds, additions, full remodels, commercial
  construction, re-roofs, HVAC replacement, repipes or panel swaps, structural
  work, or anything requiring a general contractor or major permits.

## Published price figures

Our own prices are placeholders pending confirmation
([NEEDS: real pricing confirmation]); reproduce them only from
`shared/contentData.ts` (`planningFrom`, rendered as "From $X") and never
invent a different figure for us. Market-typical RANGES in editorial content
are fine when framed as market context, not our quote (for example "Treasure
Valley handyman rates typically run $60 to $120 per hour"). Always attribute
market ranges as typical/common, never as our rate card.

Service catalog (slugs and names verbatim from `shared/contentData.ts`):

| slug | name |
| --- | --- |
| `drywall-repair` | Drywall Repair & Patching |
| `painting-touch-ups` | Interior & Exterior Painting |
| `plumbing-repairs` | Minor Plumbing Repairs |
| `electrical-repairs` | Minor Electrical Repairs |
| `carpentry-trim-repair` | Carpentry & Trim Repair |
| `mounting-assembly` | Mounting & Assembly |
| `fence-deck-gutter-repair` | Fence, Deck & Gutter Repair |
| `home-maintenance` | Caulking & Home Maintenance |

Umbrella scope also includes door/window repair and adjustment (under
carpentry), tile and grout repair and popcorn-ceiling patching (under
drywall/home-maintenance), gutter cleaning (under fence-deck-gutter-repair),
furniture assembly (under mounting-assembly), and punch-list work
(home-maintenance).

## Local facts that may be used

- Service area is the Treasure Valley across Ada County (Boise, Meridian,
  Eagle, Kuna, Star) and Canyon County (Nampa, Caldwell, Middleton).
- Treasure Valley housing stock spans 1970s ranches to new-build subdivisions,
  which is why texture matching and trim profiles vary block to block.
- Idaho weather swings (hot dry summers, freezing winters) drive caulking,
  weatherstripping, fence, deck, and gutter maintenance cycles.

**Do not invent:** specific fee amounts for a named jurisdiction, specific
review turnaround times, named subdivisions, population or growth statistics,
or any statistic attributed to a named source. If an article needs a number
that is not in this brief, write around it, or use a range hedged with
"commonly" or "typically".

## Voice

Write like a careful tradesperson explaining something to a homeowner across
the kitchen counter, not like a marketing department. Specifically:

- **Answer first.** Every article and every H2 section opens with the answer,
  then explains it. No throat-clearing.
- **Concrete over abstract.** "A quart of matched paint and a 20-minute patch
  beats repainting the wall" beats "our team delivers efficient solutions".
- **Admit trade-offs.** Say when a repair is a DIY job, when it is not worth
  doing, and when the honest answer costs us the sale. Small-job respect is the
  brand.
- Plain sentences. No "elevate", "unlock", "nestled", "boasts", "dream home",
  "peace of mind", "state-of-the-art", "we pride ourselves".
- Second person for the reader, first person plural for us.
- No exclamation marks. No rhetorical question stacks. No bulleted fragments
  where a sentence would do.

## Hard technical constraints

1. **No em-dashes.** The character U+2014 fails the `verify:no-em-dash` build
   step. Use a spaced hyphen `-` or restructure the sentence. This applies to
   every field including `content`, `faqs`, and `metaDescription`.
2. **File shape.** One file per post at
   `shared/content/wave2/<slug>.ts`, exporting a single named const typed
   `BlogPostData`, imported from `'../../blogContent'`. Match the existing
   files exactly.
3. **Register it.** Every post must be imported and listed in
   `shared/content/wave2/index.ts`.
4. **Required fields:** `slug`, `title`, `seoTitle`, `metaDescription`,
   `excerpt`, `category`, `hubSlug`, `author`, `publishedAt`, `tags`,
   `heroImage`, `primaryKeyword`, `searchIntent`, `wordCountTarget`,
   `quickAnswer`, `keyTakeaways`, `relatedLinks`, `faqs`, `content`.
5. **`heroImage`** is `/images/blog/<slug>.webp`. The file will not exist yet;
   that is expected and handled separately.
6. **`category`** must equal the hub's `categoryLabel` exactly (see below).
7. **`seoTitle`** at most 60 characters. **`metaDescription`** 140 to 158
   characters.
8. **`quickAnswer`** is 40 to 60 words, written to stand alone away from the
   page, because answer engines lift it verbatim. It must be true on its own.
9. **`keyTakeaways`** 4 to 6 single-sentence items.
10. **`faqs`** 5 to 7 entries. Questions phrased the way someone types them.
    Answers 40 to 90 words, self-contained.
11. **`content`** is an HTML string, `.trim()`ed, 1,600 to 2,200 words. Use
    `<h2 id="kebab-slug">` for each section and `<p>` for prose. 8 to 12
    sections. `<strong>` for the answer sentence in each section. Tables are
    allowed as plain `<table>` when comparing figures.
12. **Internal links.** 4 to 8 in the body, all to paths that exist. At least
    one to the hub pillar guide, at least one to another post in the same hub,
    and one to `/contact` or `/estimate` in the closing section.

## Pillar guides

A pillar guide lives at `shared/content/pillars/<slug>.ts`, exports a single
named const typed `GuidePageData` imported from `'../../guideContent'`, and is
collected by `shared/content/pillars/index.ts` (generated - run
`node scripts/generate-pillar-index.mjs`). Differences from a cluster post are
unchanged from the previous library: no `category` field (use `guideType`),
extra `linkedClusterSlugs` / `linkedServices` fields, 2,800 to 4,000 words,
8 to 12 FAQs, 12 to 20 internal links, unique kebab-case `<h2 id>`s.

## Hubs

The hub taxonomy is defined in `shared/contentHubs.ts`; that manifest is the
source of truth for pillar paths and cluster slugs. Current hubs:

| hubSlug | categoryLabel |
| --- | --- |
| `repairs-and-fixes` | Repairs & Fixes |
| `installs-and-upgrades` | Installs & Upgrades |
| `home-maintenance` | Home Maintenance |
| `costs-and-hiring` | Costs & Hiring |
| `exterior-and-outdoor` | Exterior & Outdoor |

## Routes that exist and may be linked

Services: `/services`, plus `/services/<slug>` for each catalog slug above.
Each also has a city variant, for example `/services/drywall-repair/meridian`.

Areas: `/areas`, and `/areas/{boise,meridian,eagle,nampa,kuna,star,middleton,caldwell}`.

Other: `/`, `/about`, `/contact`, `/estimate`, `/guides`, `/blog`,
`/resources`, `/re-10-repairs-boise`.

Blog posts: `/blog/<slug>` for any slug in the manifest in
`shared/contentHubs.ts`. Do not link to a slug that is not in that manifest.

Category hubs: `/blog/category/<hubSlug>` for the five hubs above.

**Never link to** any path containing `custom-home`, `semi-custom`,
`build-on-your-lot`, `design-build`, `home-plans-design`, `lot-evaluation`,
`shop-homes`, `energy-efficient-homes`, `remodel`, `testimonials`, or
`whole-home`. Those belong to the old business and are redirected or gone;
linking to them creates a redirect hop from an internal link.
