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
