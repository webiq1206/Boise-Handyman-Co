# 07 - NAP Consistency & Citation Plan

## Canonical NAP record (user-confirmed; use verbatim everywhere)

- Name: `Boise Handyman Co`
- Legal name (registrations only): `P5 Home Co LLC`
- Phone: `(208) 477-1169`
- Address model: **Service Area Business** - registered address supplied privately for verification, never published. Public locality: `Meridian, ID`
- Service area: Boise, Meridian, Eagle, Nampa, Kuna, Star, Middleton, Garden City, Caldwell, ID
- Website: `https://boisehandyman.co`
- Email: `hello@boisehandyman.co`
- Hours: Mon to Fri 9:00 AM to 6:00 PM, Sat 9:00 AM to 4:00 PM, Sun closed
- Categories: Handyman; Drywall contractor; Painter; Furniture assembly service; Fence contractor; Gutter cleaning service
- Description (short, for directories): "Handyman service for small repairs, installations and maintenance across the Treasure Valley. Written quotes before work starts. Idaho Registered Contractor #8381215. Insured; certificate on request."

## On-site NAP audit - CONSISTENT (verified in code)

`shared/siteConfig.ts` drives phone/email/locality everywhere (footer, contact, schema, meta descriptions). One phone, one locality, no street leakage. No action needed on-site. Two stale repo docs (`SEO-AUDIT-CONTEXT.md` root, old `audits/`) contain the retired `(208) 352-2011` and a Wapoot St address - internal only, no SEO impact, but flagged for archival to avoid future confusion.

## Off-site NAP audit - 1 critical conflict, near-zero footprint

### CRITICAL: the old phone number has propagated across at least 3 citations

Live listings for this business should use Boise Handyman Co, (208) 477-1169, and https://boisehandyman.co. A listing under another company name, another phone, or a street address is not this profile.

1. **ProMatcher**: search for Boise Handyman Co. Set the phone to (208) 477-1169 and the website to https://boisehandyman.co. Do not publish a street address.
2. **MapQuest**: confirm the name is Boise Handyman Co, the phone is (208) 477-1169, and the website is https://boisehandyman.co. Do not publish a street address.
3. **Yelp (inferred)**: an unclaimed/legacy Yelp listing with the old number is the likely upstream source of the MapQuest record.

**Fix (this week, in order):** see [gbp-phase0-citation-checklist.md](./gbp-phase0-citation-checklist.md)

### Everything else: missing
No findable presence on: Google (unverified), Bing Places, Apple Maps, Yelp, Houzz, Angi, BBB, Thumbtack, Porch, BuildZoom, Nextdoor, HomeAdvisor, Idaho AGC, Boise Metro Chamber. Facebook/Instagram pages are referenced in `sameAs` - verify both actually exist and carry the canonical NAP (could not be confirmed from search).

### Name-confusion risk (monitor, not fixable)
Other companies use remodeling names and domains. Citations for this business use the full name Boise Handyman Co, the phone (208) 477-1169, and https://boisehandyman.co. Do not shorten the name.

## Citation build list (priority order, identical NAP each time)

Tier 1 (week 1-2, free, highest trust):
1. Google Business Profile (recover - see 02-gbp-plan.md)
2. Bing Places
3. Apple Business Connect
4. Facebook page (confirm/align NAP, set category Home Improvement)
5. Nextdoor business page (high-intent local audience for home repairs)

Tier 2 (week 2-4, core industry):
6. Houzz (free profile; photo-driven - upload the same project sets as GBP)
7. Yelp (claim/create; do not pay for ads)
8. Angi (free listing tier)
9. BBB (accreditation optional; free profile listing first)
10. Thumbtack + Porch + BuildZoom (BuildZoom auto-generates from permit data - claim and correct)

Tier 3 (month 2+, local authority):
11. Boise Metro Chamber of Commerce (paid membership - also an authority link)
12. Idaho statewide directories, Meridian Chamber
13. NARI membership if pursued (see 11-eeat-audit.md) - directory listing + credential

After each Tier 1-2 listing goes live, append its URL to `BUSINESS_INFO.sameAs` in `lib/seo.ts` (structure already supports it; this is how Google reconciles the entity graph).

## Duplicate-citation policy
None found today (footprint too small). After the build-out, quarterly check: search for Boise Handyman Co outside boisehandyman.co, and search the phone number in quotes. Remove duplicates and old phone variants.
