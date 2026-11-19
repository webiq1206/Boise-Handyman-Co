# Claude Code Project Instructions

## Instant estimator (`/instant-estimate`)

Owner decision, 13 November 2026: the P5 family's central estimator is the
primary pricing call to action on this site.

* There is ONE estimator. It runs on p5homeco.com and is framed here at
  `/instant-estimate` (`app/instant-estimate/page.tsx`) with brand id
  `handyman`. Never copy estimator logic, pricing, questions or QuickBooks code
  into this repository.
* `components/estimator/EstimatorFrame.tsx` is identical across the family
  sites. Do not edit it here; site differences are props.
  `components/estimator/EstimatorAnalytics.tsx` forwards the estimator's events
  to `lib/analytics.ts` and counts a lead on `estimator_completed` only, once
  per page view.
* Calls to action live in `shared/ctaCopy.ts`. The header, mobile menu and
  sticky bar read `FAMILY_BRAND.cta` in `lib/familyBrand.ts` ("Instant
  estimate", `/instant-estimate`); never change `components/family/*`,
  `styles/family-*.css` or `lib/family/*` for this. In-page primaries use
  `components/estimator/InstantEstimateCTA.tsx` ("Get an instant estimate").
  Service pages open `/instant-estimate?project=<id>` through
  `estimatorProjectForService()`; a service with no estimator project keeps
  the request form as its primary. Never send a visitor to an estimator that
  cannot price their project.
* The request form ("Send your list and photos", `#consult`, button
  `components/modals/EstimateCTA.tsx`) is the second path, a written quote from
  a person. Keep a path to a person (form or phone) beside every estimator CTA.
* Wording. Allowed: "instant estimate", "instant preliminary estimate",
  "preliminary price range", "in minutes", "free", "any time, day or night",
  "no appointment", "no waiting for a callback", "no obligation". Not allowed:
  calling it a quote, bid, final price, firm price or guaranteed price; any
  promise about how fast a person replies (`scripts/verify-response-language.mjs`
  stays as it is); "no contact information required" (the estimator asks for
  name, email and phone before the range); a specific number of minutes or
  seconds; em dashes; "near me"; invented numbers or reviews.
* Existing tools stay until the owner retires them: the request form, the
  in-house intake at `/estimate` and `/estimate/scope`, the homepage planning
  range, the RE-10 upload tool, the chat assistant and every API route. Only
  primary CTAs were re-pointed.
* Guard: `tests/instant-estimate.test.ts` (`npm run verify:instant-estimate`,
  in prebuild).

## One team email per request (owner decision, 17 November 2026)

A request from this site used to put two emails in the shared inbox: this
site's own team email and the "New lead" (or "Details added") email
p5homeco.com sends when the request is forwarded to its intake. The p5 email
is the one that stays. This site's own team email is the fallback.

* `server/services/p5IntakeBridge.ts` posts with `team_alert: "confirm"` and
  returns `{ forwarded, alert }`, never throwing. `alert` is `sent`, `failed`,
  `none`, or `unknown` (no answer, an error, a timeout, an older p5, anything
  that is not exactly one of the three). It waits 30 seconds.
* `server/services/teamEmailGate.ts` decides. `sent`: the shared family inbox
  (`isSharedFamilyInbox()`: `hello@` at p5homeco.com, boisecabinet.co,
  boiseconstruction.co, boiseremodeling.co, boisehandyman.co, boiseadu.co) is
  left out, and any other admin recipient still gets this site's email.
  Anything else, including nothing forwarded: everyone gets it, as before. A
  lead must never end with no team email; when in doubt, send.
* Only the TEAM email waits for the bridge, inside `after()`. The visitor
  response and the customer's confirmation email never wait on p5. Both team
  emails are covered: Step 1 in `app/api/consultation/route.ts` (request,
  callback, request with a planning range) and "Details added" in
  `app/api/consultation/details/route.ts`. `skipEmail` still means this site
  sends neither email.
* Two note fields travel with a Step 1 request, both built in
  `server/services/consultationTeamNotes.ts`, both `Label: value` lines of at
  most 300 characters. Never mix them up:
  * `team_notes` (`buildRequestTeamNotes()`, at most 40 lines, "From the
    website" in the p5 email): the lead dashboard link, the saved request id,
    the county parcel record, the planning range, its selections and its PRICE
    split by trade. Never a cost, margin, markup, profit, contingency or
    overhead figure, and pricing checks as a count only: a p5 "New lead" email
    is copied into HubSpot, those figures stay out of HubSpot, and p5 withholds
    any `team_notes` line that names one.
  * `team_internal_notes` (`buildRequestInternalNotes()`, at most 60 lines,
    "Internal pricing" in the p5 email; owner, 17 November 2026): what this
    site's own team email shows under "Internal breakdown" for a request with a
    planning range. Totals first (total internal cost, gross profit, the
    margin line, quoted range, direct cost, contingency), then the wording of
    each pricing check, our cost and the customer amount per trade, and the
    first eight assumptions. When any are sent, p5 sends the email as "Lead and
    pricing: ..." instead of "New lead: ...", a subject its inbox sync never
    copies into HubSpot; that is the only reason these figures may travel.
    Sent only for a request with a planning range: nothing for a plain
    request, a callback or Step 2.
  * The figures come from the same `resolveInternalEstimate()` call as the
    email's `renderTradeRollupHtml()`; a test compares them with the rendered
    email for every project, finish and size. Change one and change the other.
* `estimate` (`buildRequestEstimate()`, same file; owner, 13 and 17 November
  2026: every estimate a visitor is given becomes a customer and an UNSENT
  estimate in QuickBooks, and p5 creates both from this field). Sent with a
  Step 1 request that has a planning range: nothing for a plain request, a
  callback or Step 2 (the bridge drops it for those). `low` and `high` are the
  range the customer was shown; `verified: true` because the route recomputes
  it (`verifyEstimate`), never because the browser said so; `label` is the
  project, finish and size; `lines` are one per trade with that trade's
  CUSTOMER amount. The lines add up, to the cent, to the customer price the
  team email shows (the centre of the range), and that sum is the QuickBooks
  total, so never drop or reorder a line without keeping the sum.
  **Customer amounts only:** no cost, margin, markup, profit, contingency or
  overhead in any field, titles and descriptions included. On any problem the
  builder returns null and the request goes without the field; it never throws.
* The contract belongs to p5homeco.com (`docs/lead-intake-contract.md` there).
  Do not change the field names here alone.
* Guard: `tests/p5-one-team-email.test.ts`, with `tests/p5-intake-bridge.test.ts`
  and `tests/consultation-details.test.ts` (`npm run verify:one-team-email`, in
  prebuild). Tests use a fake fetch; never post a test to the live intake.

## The document estimator's leads go to P5 (owner decisions, 13, 17 and 18 November 2026)

What the shared document estimator (`lib/p5`, `/estimate/scope`) takes on this
site becomes a P5 lead and a HubSpot deal, and a priced estimate becomes a
QuickBooks customer with an UNSENT estimate, with ONE team email. Both are
posts to p5homeco.com's public lead intake, built by the shared
`lib/p5/p5LeadIntake.ts`. Both are on while `P5_CRM_DELIVERY` is `on`, which
is already set in production: there is no further switch.

* The project request (no price). The `crm` channel in
  `lib/p5/intakeDeliveryRuntime.ts` (brand-owned) is
  `p5LeadIntakeTransport()`: `form: "p5-project-request"`, the brand of the
  primary team the request was routed to (a kitchen request taken here is
  filed under Boise Remodeling Co), the request's lead key as its id, and
  `team_alert: "site"`, because the `team` channel has already emailed the
  team. Without the variable it is `crm-disabled`. Only requests saved since
  18 November 2026 are sent (`P5_REQUEST_LEADS_SINCE` names another moment).
  `lib/p5/intakeCrmValidation.ts` is the same check the channel runs.
* The published estimate. `syncCrm()` in `lib/p5/deliveryAdapter.ts`
  (brand-owned) calls `forwardEstimateToP5(record, key, { brand: "Boise
  Handyman Co" })`: `form: "p5-estimator"`, `team_alert: "site"` (the internal
  estimate record has already been emailed), `request_external_id` (the
  request it answers, so both are one lead) and an `estimate` of kind
  `document`. **Customer amounts only:** no cost, margin, markup, profit,
  contingency or overhead. A refused post throws, and the outbox marks the job
  for review. The old lead dashboard (`LEAD_DASHBOARD_API_URL`) is no longer
  called from the adapter; the request form's own forward
  (`server/services/leadDashboardForward.ts`) is unchanged.
* Keep the forwarder a dynamic `await import('./p5LeadIntake.ts')` inside
  `syncCrm()`: the shared `tests/p5-intake-reply-to.test.ts` runs the adapter
  in a VM with a fixed dependency list.
* The canonical review receiver (`canonicalReviewTransport.ts`,
  `INTAKE_RUNTIME_PROOF.crm`) is not used by this runtime and stays gated. Do
  not activate it.
* `p5LeadIntake.ts`, `documentEstimateFigures.ts`, `manualReview.ts`,
  `submitEndpoint.ts` and `tests/p5-lead-intake.test.ts` are shared: edit them
  in p5-home-co only. They were copied on their own from commit `7e0338c`
  (`documentEstimatorLeads` in `lib/p5/shared-manifest.json`), not by a full
  sync. The contract is p5homeco.com's `docs/lead-intake-contract.md`.
* Guards: `tests/p5-intake-local-crm.test.ts` (the request) and
  `tests/p5-delivery-adapter.test.ts` (the estimate), both brand-owned, with
  the shared `tests/p5-lead-intake.test.ts`. Tests use a fake fetch; never
  post a test to the live intake.

## Scope and one total for customers (owner decision, 16 November 2026)

Every customer-facing estimate shows the full scope of work and ONE price (the
range, or a firm total) for the whole project: no line item, unit, category,
division, room, building or allowance price. This covers the framed instant
estimator (enforced on p5homeco.com) and this site's copy of the shared
document estimator (`lib/p5`: `/estimate/scope`, staff-published estimates,
the customer email, PDF and saved links). `customerPresentation()` in
`lib/p5/customerProjection.ts` is the one customer boundary; edit it in
p5-home-co and apply the same change here, then update
`lib/p5/shared-manifest.json`. Internal records, team emails, the
administrative PDF, the admin page, the CRM payload and QuickBooks keep every
price.

## Publishing to Replit: never approve a DROP

Replit's Republish compares the development database with production and
proposes a migration for the difference. A development database that is behind
makes Replit offer to `DROP TABLE` live tables. On 13 November 2026 this nearly
deleted a real customer estimate on p5homeco.com: the code was pulled and
published without the step below.

Every time, in this order, in the Replit workspace:

1. Pull the latest `main` into the workspace. Redeploy ships the workspace, not GitHub.
2. Run `npm run db:push` against the DEVELOPMENT database, so it matches the drizzle schema in shared/schema.ts.
3. Republish, and read the database step before approving. Approve only "no
   changes" or `CREATE` and `ADD COLUMN` lines you expect.
4. If it shows `DROP` or anything destructive, cancel and stop. Do not publish.

This applies whoever does the pull: a person, Replit's assistant or Claude.
Never run a schema command against the live database. The same checklist is in
`replit.md`, which Replit's assistant reads.

## Interior page refinement (owner approval, 19 November 2026)

Service, city and area landing pages, blog articles and guides follow the
family pattern first built on Boise Remodeling Co. Styles live in
`app/interior-refinement.css` (imported last in `app/layout.tsx`). The homepage
layout and the paid-traffic landing pages (`callFirst`) are unchanged.

* **Landing template** (`components/seo/LandingPageTemplate.tsx`): a fact row
  under the hero (`.lx-facts`, wording already used on the page; never a reply
  time), benefits two across on phones, process steps that swipe on phones,
  and questions as native `<details>` so every answer stays in the HTML. Phones
  keep copy before the photograph in the hero.
* **One closing links block**, "Keep exploring"
  (`components/seo/RelatedLinks.tsx`): places and services as photo cards (a
  swipe row on phones, balanced rows from tablet up), guides and articles as
  one list with thumbnails, and no link shown twice. Cards keep the full
  anchor text for search (`sr-only`); `.lx-cell` stays `position: relative` so
  that hidden text cannot widen the page. A noindexed city combination still
  links to the service page. Do not stack separate link lists under it again.
* **Articles and guides**: quiet header and date line, one "On this page" row
  on phones, downloads and the guide note after the article, one estimate
  prompt at the end on phones, related pages with their photographs. On
  desktop the reading column and the sticky rail fill the container.
* **Photographs.** Each trade's rotation in `shared/cityServiceImages.ts` was
  widened from the owner's photo folder so fewer city pages share a picture.
  A new file needs a description in `shared/imageAlts.ts`; unrelated work never
  fills a trade's slot.
* **Image alt text is local.** Every content image's alt is "<work> in <city>,
  Idaho: <what the picture shows>", built by `localAlt()` in
  `shared/localAlt.ts`. `altForImage()` and `getBlogImageAlt()` apply it; a
  page passes its own service and city, and Boise is the default place. New
  images go through one of those helpers, never a bare string. Brand lockups
  in the shared header and footer keep an empty alt because their link carries
  the company name. Guard: `tests/local-alt.test.ts`.
* **No qualifier beside a photograph** (owner direction). No "inspiration",
  "possibilities", "idea", "concept", "representative" or "tailored to your
  property" in an alt, heading, eyebrow, caption or image sitemap entry. Use a
  plain subject label (the service, with the city where the page has one). Do
  not replace it with wording that claims a photograph is a completed customer
  job.
* `.guide-section-details[open] .guide-section-summary > span` keeps the child
  combinator, so the rule that hides "Tap to expand" cannot hide part of a
  heading.

### Second pass (19 November 2026)

* **Photo rotations follow the display order of cities** (`CITY_SLUGS` in
  `shared/cityServiceImages.ts` matches `SERVICE_AREA_CITY_NAMES`), so two
  cities side by side in a card row take consecutive photographs. Keep three
  or more photographs in a rotation where the photo folder allows; electrical
  has seven (see below) and nothing unrelated fills it.
* **Blog and guide heroes** are assigned in `scripts/generate-blog-image-registry.ts`
  (then `npm run images:blog`). No more than two posts share one photograph,
  apart from the Boise street photo used by three Boise-area guides.
* **Listing cards are compact rows on phones** (`lx-row-card` on `BlogCard`,
  `AreaCard` and the guide index cards): photograph, label and title, the whole
  row a link. Excerpts, dates and "Read" links return from 701px up. Row photos
  use `object-position: 50% 20%` so a square crop never cuts off a head.
* **Buttons match their surface.** On a charcoal band (`surface="gradient"`,
  `ed-on-gradient`) a CTA takes `tone="dark"`; on paper it is the charcoal
  primary. `BlogEndCta`, the landing closing section and the warranty hero were
  each one tone off and nearly invisible.
* **One use per photo holds on paid-traffic pages too** (19 November 2026).
  `LandingPageTemplate` used to repeat the breather and process photos inside
  the long-form block on `callFirst` pages. An inline photo now appears only
  when the page has not already shown it, on every page.
* **Touch targets are 44px on phones and tablets.** The rule at the end of
  `app/interior-refinement.css` (`max-width: 1023px`) covers text links in
  lists, row links, disclosure summaries, phone and text links and topic
  chips. Add a new link style to that selector rather than shrinking it.
  Inline links inside a sentence are exempt.
* **About: "What sets us apart" is tap-to-open** (`WhyChooseUsSection`,
  native `details` sharing one `name`, first one open). Every paragraph stays
  in the HTML. Do not turn it back into ten open paragraphs.
* **Electrical has seven pictures** (19 November 2026): the outlet being
  wired and the two outlet close-ups from the gallery, then four stills the
  owner approved that day (`electrical-gfci-outlet`, `electrical-light-switch`,
  `electrical-ceiling-fan`, `electrical-exterior-wall-light` in
  `public/images/handyman`). Those four are AI-generated, like the rest of
  that library: describe only what a picture shows and never caption one as a
  completed customer job, a recent project or the team's own work. A page and
  its eight nearby-city cards need eleven, so the last cards still fall back
  to their city's area photograph. Never fill the slot with unrelated work.
* **Paid-traffic pages (`callFirst`) take no fact row.** Their hero is followed
  directly by the request form the hero links to; nothing goes between them.
* `docs/interior-route-audit.json` holds a fingerprint of each interior page's
  metadata and schema calls. When a page's metadata changes on purpose, update
  its `seoSignature` in the same commit (`tests/approved-interiors.test.ts`).

### Tablet pass and card photographs (19 November 2026)

* **No Keep exploring card repeats a photograph.** `pickCardImages()` in
  `shared/cityServiceImages.ts` gives each card a picture that is not on the
  page and not in another card: its own trade first, and when the trade has
  none left (electrical holds seven) the card's city area photograph, described
  as the place. A card never shows another trade's work. The template passes
  the page's own photographs as `pageImages`. Guard:
  `tests/explore-card-images.test.ts`.
* **Seven city cards never leave one alone.** The services, areas and about
  grids carry `lx-seven`: two, two and three on tablets, four and three from
  1024. It only acts on a grid of exactly seven.
* **Tablets (701 to 1023px).** Home repairs is one column (two left the copy a
  110px strip); contact channels are one card per row; the contact hero facts
  are one per line; RE-10 repair groups are one column until 1024. From 1024 to
  1199 the article rail is 280px so the reading column keeps its width.
* **The touch-target rule also applies to any touch screen** (`pointer:
  coarse`), so a tablet held sideways is covered. It is for text links: a phone
  or text link that wraps a whole card carries `block` and is left out, or the
  card shrinks to its text (this hid half of each contact card).
* **A link under a contact card** ("Save our contact") stays visible: the card
  wrapper is a column and the card takes the room that is left.
* **Buttons on the charcoal RE-10 closing band** take `tone="dark"`; the
  primary is the `hero` variant (paper fill). Two were invisible.
* **`tests/ad-landing-hero.test.ts`** knows the two reviewed drywall pages use
  `DrywallSearchHero` (4 November 2026 hero remediation,
  `docs/hero-remediation-20261104.md`): their hero is the focused section plus
  the details section under it. It runs in prebuild with the card photograph
  test (`npm run verify:landing-heroes`).
* **The request form's ids are made above the lazy boundary.**
  `LazyConsultationForm` calls `useId()` and passes `idPrefix`; an id made
  inside the form differed between server and browser (next/dynamic renders one
  more wrapper on the server) and every label and field failed hydration. The
  form's text fields and the blog search field carry `data-clarity-mask="True"`
  in the markup, the same value the masking script in `app/layout.tsx` sets
  before hydration, so the two agree. A new server-rendered text field needs
  the attribute too. Tags on a post or guide are shown once each.
