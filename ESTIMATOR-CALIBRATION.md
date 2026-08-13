# Estimator calibration

> **Read this first (2026-08).** The construction-era calibration this document
> used to describe is gone with the construction estimator. The live estimator
> prices handyman jobs with a deliberately small model in
> `shared/estimateEngine.ts`. The separate RE-10 repair estimator
> (`shared/costs/re10Repairs.ts`, `/re-10-repairs-boise`) keeps its own
> calibration and is not covered here.

## The pricing model

One formula, applied the same way on the page, in the emails, and in the CRM
record:

```
total    = TRIP_FEE + billableHours * HOURLY_RATE * urgencyMultiplier
range    = [total * 0.9, total * 1.2], rounded to the nearest $5
```

- **Hourly rate:** $95/hr
- **Trip fee:** $49, once per visit
- **Minimum:** 1 billable labor hour per visit
- **Supply run:** picking materials up for the customer adds 0.75 hr of labor
  as its own line; materials themselves are always billed at cost and are
  never inside the estimate
- **Urgency:** standard x1.0 (next available), priority x1.15 (within 2
  business days), same-week emergency x1.30
- **Hours:** each fixed-scope task in `TASK_CATALOG` carries an estimated
  hours figure (times quantity); the free-text "something else" path bills
  small = 2 hr, medium = 4 hr, large = 8 hr
- **Range:** always shown as a band (-10% / +20%), never a point number

## Every number is a placeholder

All of the constants above are plausible market-typical figures, not confirmed
prices. Each one is flagged `[NEEDS: real pricing confirmation]` at its
definition in `shared/estimateEngine.ts`. Until they are confirmed, every
surface that renders a range also renders the disclaimer:

> Typical starting rates. Your written quote comes before any work begins.

To calibrate for real: adjust the constants and per-task hours in
`shared/estimateEngine.ts` against actual closed jobs, then re-record the
golden table:

```
GOLDEN_RECORD=1 npx tsx scripts/verify-golden-estimates.ts
```

and commit the updated goldens in the same change that moved the rates.

## What is verified on every build

- `npm run verify:estimate` - invariants: the category list matches the live
  service catalog, every task prices to a finite ordered range, the trip fee
  appears exactly once, the 1-hour minimum holds, quantity and urgency are
  monotonic, the supply run adds exactly its hours, and empty input never
  prices as $0.
- `npm run verify:golden` - 11 pinned scenarios covering every job category,
  all three urgency tiers, quantity math, the minimum, and the supply run,
  asserted to the dollar.
- `npm run verify:lead-payload` - the wire schema accepts everything the
  engine defines, rejects malformed payloads, and the server-side recompute in
  `/api/estimate-lead` agrees with an honestly built client payload.

## Retired

The construction cost engine (`shared/costs/` line-item takeoff, assessor
lookups, plan analysis, budget fit) is no longer referenced by the estimator.
Parts of it remain in the tree only because modules owned by other surfaces
still import them; see `shared/estimateEngine.ts` and
`shared/legacy/constructionEstimateEngine.ts` for the removal plan.
