# Local owner-service planning policy

Authorized 2026-11-23. This applies only to new pricing calculations in this
brand's independent document and consultation engines. The guided estimator
iframe remains hosted and priced by P5. No database migration is required.

## Final customer rates

| SKU | Service | Final hourly rate | Requested QBO item |
| --- | --- | --- | --- |
| 01-31-03 | Project management | $120 | 48 |
| 01-31-04 | Project administration | $120 | 49 |
| 01-31-05 | Project accounting | $120 | 47 |

The common pure calculator is `lib/p5/ownerServices.ts`. It uses outside
direct costs, excluding owner services, owner production, overhead, profit,
taxes, contingency and replaced owner allowances. Detailed landed-material
tax is removed from the hour basis as well. Existing pre-owner direct costs
supply the baseline when no finer detail exists.

Per $1,000 outside cost: management 0.50h, administration 0.20h, accounting
0.10h. Minimums are 0.25h, 0.125h, 0.125h for the ENTIRE project. These
are editable estimating assumptions, not claims about actual time worked.

Internal review supports project-hour overrides and named milestone overrides.
Automatic hours are allocated by milestone outside costs when all are known,
otherwise equally. Explicit milestone hours take precedence; a project override
allocates only its remaining hours. Conflicting explicit totals fail rather
than silently overwriting an override. There is no per-milestone minimum.

## Credits and audit trail

Legacy 01-31-01/02, L-03-00 and explicit duplicate owner-management/salary
allowances are removed BEFORE contingency and markup. Distinct outside
superintendent and field supervision remain direct project costs. Explicit
additional owner production remains separate labor, not management.

The document engine's existing overhead budget includes owner salaries. By
default, the overlap credit is the lesser of owner-service charges and overhead
actually recovered; it cannot consume profit or exceed the new owner charges.
An internal `ownerServices.salaryOverheadCredit` can document a smaller known
salary-only overlap. Non-salary overhead recovery remains in the outside-work
lines. This capped overlap is recorded explicitly in the result; it is not an
extra negative fee applied again on delivery.

The construction consultation engine replaced its separately priced L-03-00
owner time at the takeoff stage. It has no separate salary-overhead recovery
amount, so no second inferred overhead credit is taken.

Final-rate owner services have a separate `ownerServiceLines` ledger to keep
cost-only scope mapping and audits from treating zero-direct-cost selling
lines as missing work. Internal screens/PDFs and QBO exports join the two
ledgers. Public output remains work scope and the total range, with no owner
hour, rate or credit breakdown.

Currency is rounded to cents. `plannedHours` retains the original default or
override; billed hours equal the rounded fee divided by $120 so downstream QBO
rate derivation stays exactly $120 rather than $119.99 or $120.01. Milestone
billed hours reconcile to that project quantity; the rounding is at most half
a cent of service time and never adds a milestone minimum.

No saved record is rewritten. Existing submitted-result reads, PDFs and
delivery retries use stored pricing. Signed review publication is blocked.
Historical finance replay is explicit and cannot be selected by the internal
new-review request body. Any intentional new review uses the new policy.

## QBO receiver dependency

The brand exports `sku` and `qboItemId`, plus the same identifiers in each
owner line's description so they survive older P5 intake normalization.
Grouping/size reduction preserves these three lines and their quantities.

Inspection of P5's current canonical intake implementation found it normalizes
away SKU/item-ID metadata and chooses QBO items from a fixed division-name
mapping. That mapping does not yet contain the three owner services.
**Local payload validation is not proof of the final QBO ItemRef.**
P5's receiver must honor these three mappings before correct downstream
item booking can be declared verified. No live lead, QBO estimate, database
write or production deployment was used to test this.

## Checks

`node --import tsx --test tests/p5-owner-services.test.ts` exercises small/large
projects, milestones, overrides, cabinet services, overlap credits,
recomputation, history, public projection, QBO payload detail and totals.
Existing historical financial fixtures explicitly replay the old policy.
