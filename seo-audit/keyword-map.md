# Keyword Map: Boise Handyman Co

Replaces the earlier remodeling keyword map that was copied into this repo. Search volumes below are NOT yet pulled for handyman terms: run each in Ahrefs Keywords Explorer (US) and fill the Vol and KD columns before prioritizing further.

## Primary targets

| Page | Primary keyword | Secondary | Intent |
|---|---|---|---|
| `/` | boise handyman | handyman boise idaho, handyman services boise, handyman near me | commercial-local head |
| `/areas/boise` | handyman in boise idaho | boise handyman services, handyman boise id | transactional-local |
| `/areas/{meridian,eagle,nampa}` | handyman {city} idaho | {city} handyman services | transactional-local |
| `/re-10-repairs-boise` | RE-10 repairs boise | inspection repair list boise, home inspection repairs before closing | transactional-local (realtor angle, low competition) |
| `/services/drywall-repair` | drywall repair boise | drywall patch boise, popcorn ceiling repair boise | commercial head |
| `/services/painting-touch-ups` | painting touch ups boise | interior paint repair boise | commercial head |
| `/services/plumbing-repairs` | minor plumbing repair boise | faucet repair boise, toilet repair boise | commercial head |
| `/services/electrical-repairs` | light fixture installation boise | ceiling fan install boise | commercial head |
| `/services/mounting-assembly` | tv mounting boise | furniture assembly boise | commercial head |
| `/guides/boise-home-repair-cost-guide` | handyman prices boise | how much does a handyman cost in boise | informational |

## Indexing rule for city x service pages

Only an allowlist is indexable (see `lib/page-metadata.ts`): the five core services (drywall, painting, plumbing, electrical, mounting) in Boise, Meridian, Eagle, and Nampa, plus carpentry, fence/deck/gutter, and home maintenance in Boise and Meridian. That is 26 pages. Every other combination is `noindex, follow` and out of the sitemap until it earns unique proof (real reviews, local job photos, neighborhood detail).

## Next steps

1. Pull volume and difficulty for every primary and secondary term above.
2. Track weekly from a Boise location: boise handyman, handyman boise, handyman boise idaho, RE-10 repairs boise.
3. Add completed local job photos and real customer reviews to the Boise, Meridian, Eagle, and Nampa pages first.
