# Charcoal PR 144 integration

Source inputs: Charcoal PR head `b13f33b805f58b844d166c35f87a1a19362bd415` and current main `def0ad7764e65d66d6239ab0b8d3e0a335edc902`, which includes reviewed family head `51ec0103dc4056795a379ddd772149006ff52bc8`. The owner explicitly requested resolving and merging the Charcoal requests. Work follows Website Design Quality 2.3, its implementation rules/review record and `docs/brand-profile.md` source record 2026-11-04.2. Final rendered review, exact-head build and publication are separate gates.

## Conflict reconciliation

The three site-owned conflicts were `app/approved-family.css`, `app/approved-system.css` and `app/style-guide/page.tsx`. The CSS resolution applies the PR's 16 and 24 color-declaration changes onto main's current declaration structure, retaining its typography and composition. The style guide retains main's copy and heading-role cleanup with the PR's charcoal examples. The canonical Remodeling owner resolves `styles/family-tokens.css` and `lib/family/manifest.json`; all 17 shared files and their manifest are transported byte-identical rather than edited independently here.

The current family roles remain authoritative: phone body 17px, responsive display/interior heading roles, 48px inputs and 56px choice-card minimums. The phone audit's contrast, scannable repair-list answers and appropriate touch targets remain. Older blanket 40px H1/36px H2/16px body overrides, 44px input downgrades, heading nowrap rules, forced hero height, duplicate bar clearance and replacement carousels are superseded by the reviewed family implementation. Current icons, destinations, privacy cleanup, original SVGs and Handyman H1 accent `#c56b4a` remain.

## Focused layout fixes

- The request grid now has two shrinkable columns from 1024px, matching its children's existing `lg` placement. Below 1024px it uses one shrinkable track. The old 1100px parent stack created an implicit second column while the children still requested desktop placement, clipping the form at 1024px. No form fields, validation, step logic, persistence or delivery code changes.
- Contact-channel cards use an explicit shrinkable phone track; card children may shrink and long content may wrap. On phones the icon sits above the text, and saved-contact links lose the desktop indent. Phone/text/email destinations and the contact form remain unchanged.

## One bad image and every active consumer

The original `/images/handyman/service-carpentry-trim-branded.webp` and its `/family/handyman-service-carpentry-trim-branded.webp` copy already crop the worker's head in the source. Changing `object-position` cannot restore missing image content. Both originals remain available at their existing URLs.

The replacement is the existing approved `/images/handyman/front-door-repaint-p5-reviewed-20260910.webp`, inspected at its actual source size: a people-free sage-green front door with white trim and black hardware. It is relevant to the existing door/trim service. No new generated comparison or claim of a completed company project is published.

| Source consumer | Affected display or data | Change |
| --- | --- | --- |
| `shared/siteImages.ts` `valueCraft` | Common value/carpentry image | Existing approved door/trim asset |
| `components/sections/WhyChooseUsSection.tsx` | About why-choose-us photograph | Common image plus observed door/trim alt |
| `components/sections/ValueOverheadSection.tsx` | Value section photograph | Common image plus observed door/trim alt |
| `shared/blogImages.ts` inline pool | Repair/install article inline figure selections | Common image plus observed door/trim alt |
| `shared/serviceBackgrounds.ts` background and image-set hero | Services directory, carpentry landing page and its image-set consumers | Common safe image |
| `shared/cityServiceImages.ts` carpentry rotation | City/service imagery and fallbacks that select this rotation entry | Common safe image |
| `app/handyman/page.tsx` | Doors, trim and baseboards service card | Safe source and matching alt; label and price unchanged |
| `components/approved/family-content.ts` Handyman carpentry service | Approved family service-card consumers | Safe source; service identity unchanged |
| `shared/blogImageRegistry.ts` DIY-versus-hiring post | Article hero and existing image data | Safe source and matching observed alt |
| `scripts/generate-blog-image-registry.ts` carpentry mapping | Future regeneration of that registry | Same safe source and observed alt |

The old path's entry in `shared/imageAlts.ts` remains a legacy URL catalog entry and does not select or render the asset. There are no remaining active selections of either bad source in app/components/shared/scripts. The existing DIY OG card was also inspected: it depicts a people-free tool bag rather than the bad worker source. Its original bytes and public URL remain unchanged; a one-slug existing-renderer exercise is archived only in external evidence.

## Preservation and verification

Titles, canonical routes, schema identity, public phone/text/email destinations and business facts are preserved. The changed article image/alt is an intentional image correction, not a new route or schema identity. P5 presentation-only palette changes and their shared manifest remain under the parent/P5 canonical owner's review and transport; this task does not independently bless those hashes. No provider, pricing, policy, security or protected form behavior is changed.

Local source evidence and the working review record are in `../evidence/charcoal-handyman`. Baseline captures remain unchanged under the prior exact-head Handyman evidence. Passing cheap checks do not establish rendered fit, actual mobile-keyboard behavior, downstream delivery, independent F4 acceptance or deployment. Final review must inspect every affected image consumer and the form/contact layouts at the relevant responsive sizes on the final integrated revision.
