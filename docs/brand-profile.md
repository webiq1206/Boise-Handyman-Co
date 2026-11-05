# Boise Handyman Co brand profile

Profile version: source record 2026-11-05.1. The later explicit instruction to resolve and merge Charcoal PR 144 authorizes its neutral palette. This records that integration with the reviewed November 4 family work; final rendered review and publication remain separate gates. No new logo, typeface or rule exception is asserted.

Source of truth: `docs/approved-design-handoff.md` (implemented 2026-09-24), `lib/familyBrand.ts`, `styles/family-tokens.css`, current loaded `app/approved-system.css`, `app/family-redesign.css`, `app/layout.tsx` and `components/approved/family-content.ts`. Those implementation files retain authority for actual values. Older Montserrat/Libre references in the brand kit and content brief conflict with the loaded approved family design and are not instructions to revert it.

- **Audience, positioning and page goals:** homeowners with small repairs, installs and maintenance in the existing Treasure Valley service area. Help visitors describe a repair list for review and a written quote. Existing scope, public contact facts and service areas stay in their current source files.
- **Visual character:** practical, warm editorial design with large serif headings, clear service photography, restrained terracotta emphasis and generous paper surfaces.
- **Logos:** existing `/brand/approved-lockup-light.svg` on dark and `/brand/approved-lockup-dark.svg` on light, intrinsic size 377 by 50. Retain the P5 Home Company endorsement and original vector assets, including their built-in colors. The light lockup has a bone main wordmark/P outline with a terracotta Co/icon accent; the earlier blanket terracotta wording did not describe that approved SVG. No asset recolor or new minimum size/clear-space approval is inferred.
- **Colors:** background/surface paper `#fbfaf6`; alternate bone `#f1ede4`; primary and chrome charcoal `#383837`; charcoal surface `#4a4a48`, border `#979794`, pressed `#30302f`; site text uses the Charcoal role, with existing muted text roles retained. Handyman accent remains `#c56b4a`, accent ink `#92472c`; on-dark text `#fbfaf6`, muted `rgba(251,250,246,0.8)`, border `rgba(251,250,246,0.18)`; success `#3f6b4a`, warning `#8a6a1f`, error `#a33a2c`. Moss `#233029` is unchanged; the canonical forest fallback is now `#383837` and the neutral scrim uses RGB `56,56,55`. Canonical role definitions in `styles/family-tokens.css` and the existing site layers remain the source of truth. No new secondary CTA accent.
- **Typography:** self-hosted Manrope and Cormorant Garamond loaded by `app/layout.tsx`. The latest November 5 heading direction uses canonical responsive roles in `styles/family-tokens.css`: editorial display 36/52/64px; page H1 40/44/52px through `--fs-page-title`; compact feature 32/44/52px; ordinary H2 28/36/40px; H3 22/26/28px; body 17/18/18px; captions 14/15/15px; labels 13px; navigation 15px and buttons 16px. Display headings use the shared 400 weight, role leading and tracking. Existing marketing hero sizing and the reviewed three-route composition stay in place. Site-owned legacy overrides now consume these roles; final rendered role equality and task-state fit remain review gates.
- **Spacing and layout:** preserve current Part B token scale and existing editorial grid. Shared token phone/tablet/desktop gutters are 20/32/48px, narrow phone 16px; content max 1280px. Existing Handyman navigation switches at 1180px per `lib/familyBrand.ts`. Token definitions and existing presentation overrides are retained rather than reinterpreted during a copy edit.
- **Shape and surface:** existing square controls/cards, 4px inputs and choice cards, full-radius utilities where present; no new shadows or borders. Hairline service divisions and image-led cards stay in use.
- **Photography:** existing approved service images are representative, not evidence of named completed jobs. `docs/photo-shot-list.md` records replacement needs. Do not label conceptual or generated imagery as authentic company project proof. Preserve the master standard's complete-head/crop rule. The Charcoal integration replaces active uses of the source-cropped carpentry worker with the existing approved people-free door/trim image, as recorded in `docs/charcoal-integration-20261104.md`; original asset URLs remain available.
- **Buttons, forms, navigation and icons:** retain current family chrome, Lucide icons, existing primary quote action, phone links and menu. Current CTA source is `shared/ctaCopy.ts` and `lib/familyBrand.ts`; source wording supersedes older handoff references to online estimates. No new overlay or input control.
- **Interaction and motion:** existing 200ms fast and 300ms base tokens, reduced-motion support, visible keyboard focus and current sticky behavior. No interaction changes here.
- **Writing:** specific plain-language small-repair scope; written scope/price/visit review before agreed work. Do not invent prices, availability, testimonials, certifications or project history. No em dashes or double hyphens in customer prose. Preserve public facts and current protected source records.
- **Public information and imagery copy:** the latest November 4 direction removes street addresses and administrative representative/storefront language from public pages, JSON-LD, contact downloads and discovery files. Keep phone, hours, service areas, legal identity and registration facts in natural wording; private business-profile/verification records stay with the profile owner. Generic images describe services, materials and visible actions without status captions or completed-project/staff claims. Generated comparisons remain unpublished.
- **Proof available:** `shared/galleryData.ts` has no verified gallery projects at this revision. Representative imagery is not project proof. Existing homepage planning interface and estimator safeguards remain protected; no new input, calculation or proof assertion is introduced. Missing authentic artifacts stay a documented gap.
- **Wizard flows:** existing repair-list consultation, public planning/estimate and RE-10 journeys remain in their existing components. This task changes no inputs, results, delivery, validation, persistence or provider behavior; it does not certify their keyboard fit or downstream delivery.
- **Accepted screenshots:** approved design provenance is `docs/approved-design-handoff.md`; dated local baseline and final evidence for this task lives outside the public repo under `../evidence/handyman`. Baseline is not a new design approval.
- **Rejected patterns:** fabricated review/project proof, unverified one-visit/invisible-finish claims, superseded blanket phone type sizes, heading nowrap rules, duplicate mobile-bar clearance and phone carousels that replace the reviewed responsive grids. Charcoal PR 144 is integrated under the later explicit owner instruction while preserving the current family roles and contact behavior.
- **Protected functionality:** routes, metadata/canonicals/robots/sitemaps/schema, analytics/consent/accepted-lead rules, inquiry routing, uploads, planning/estimate/RE-10 interfaces, integrations, CRM and provider credentials. No real lead, protected estimator or provider operation in this task.
- **Approved exceptions:** none added. Existing recorded page behavior is preserved; a baseline observation is not a rule waiver.
- **Family relationship:** Boise Handyman Co is a P5 Home Co company using shared family chrome, fonts and neutral surfaces. This brand owns its terracotta accent, wordmark, service content and repair-list journey. Do not transfer another site's accent, imagery or service claims.

For every edit and review apply the current user-owned `website-design-quality` skill and its complete master Version 2.3, implementation rules and review record, plus `organic-ai-search-visibility` 1.0.2. This profile records existing values; it does not relax mandatory design, accessibility, preservation or release gates.

Scoped November 4 C3/C4 correction: the homepage and two drywall search pages use the opt-in composition recorded in [hero-remediation-20261104.md](hero-remediation-20261104.md). It retains the palette, font families, original headline text and contact destinations, uses existing typography/spacing/control tokens and existing approved imagery, and adds no exception. Other interior heroes and all shared family chrome retain their prior implementation.

The later six-site public-copy and typography work is recorded in [public-copy-cleanup-20261104.md](public-copy-cleanup-20261104.md). The homepage hero uses the exact approved terracotta token `#c56b4a` for its accent rather than the shared lightened mix; contrast and rendered acceptance remain pending. Canonical shared header/footer transport, section imagery, independent review, exact-head CI and owner publication are separate gates.


### November4 narrow-header and menu implementation record

Canonical source `boise-remodeling-co` revision `fa720a579b696af92861fb571fa0aff043e734b0` restores the complete approved SVG below360px in a logo row above the unboxed contact/menu controls. Normal320px prototype height is89px including the border; use the actual measured header/safe-area height, not a fixed clearance. Enlarged text may grow it. Normal360px-and-up header geometry is unchanged. Mobile-menu Call/Text/Chat contact controls are transparent and borderless at rest, retain visible focus and existing destinations/capability, and use the same icons as header/footer. This records the owner-requested consistency repair, not a new identity or approval exception. The independently reviewed prototype is narrower evidence than each final built site; retain exact-head rendering and functional gates.


### Exact heading accent, November 4 owner instruction

Heading emphasis uses the actual approved logo/icon pop `#c56b4a` through the site-owned
`--color-heading-accent` role. It is not mixed with paper or replaced by accent ink.
The approved SVG bytes, existing type families/sizes/weights, neutral palette and
functional text/focus roles are preserved. Public H1/H2 and editorial display emphasis,
interior statement/aside titles, legacy hero emphasis and dark planning bands consume
this exact role. The shared HeroPhoto uses the same heading role after canonical transport.
Small FAQ open states and related/service title hover states retain readable neutral text;
underline/chevron affordances convey their state without adding a different heading hue.
Terracotta display emphasis remains on its existing paper/bone/dark contexts with no glyph outline.
This is a source implementation record, not a rendered contrast or visual acceptance.
Actual font pixels, photograph contrast, all listed template consumers and independent
review remain required at the exact final revision. Source evidence lives in the private
`evidence/brand-heading-accent-inventory.json` and implementation ledger.

### November 5 mobile heading direction

The owner's latest family direction enlarges mobile H1s, removes H1 glyph shadows
and restores earlier mobile alignment selectively. The new page-title role is
40/44/52px through `--fs-page-title`; the compact feature role remains 32/44/52px.
The shared phone photo-hero role becomes `clamp(44px,13.333vw,56px)`. Existing
Manrope/Cormorant families, 400 display weight, exact terracotta and other heading
roles stay in use. Canonical Remodeling owns the shared source and transport.

Handyman's reviewed Charcoal merge already removed the recent mobile centering;
retain its left-flowing heroes and explicit centered sections and controls. Its
homepage has no H1 glyph shadow. Preserve its separate photo/copy composition and
desktop charcoal copy field. The phone photograph uses a 96–128px responsive height
within that composition, with the complete worker head required at every crop.
The `/handyman` landing consumes the page-title role instead of its former 32px
phone override. Its normal-flow header no longer leaves a second phone header offset
inside the hero. The phone copy has 64px section padding on charcoal and precedes
a 96px photograph strip, with a top focal point intended to preserve the complete
worker head without text over it. The phone/contact note and unchanged trust
details follow immediately after the phone hero. Desktop composition and the
other contact-action consumers retain their original content and styling. The
photo crop and fit require final rendering before acceptance. Protected estimator, request-form and RE-10 task controls retain
their own typography and behavior. These are implementation directions, not new
palette, fit or accessibility exceptions or a final rendered/release acceptance.

### November 5 uniform black homepage overlay and fold direction

The later owner direction replaces the homepage split photograph/charcoal copy
field with the existing full-bleed photograph and one uniform `#000000` overlay
at60% transparency, precisely `rgba(0,0,0,.4)`. No gradient or independent copy
panel remains in the homepage opt-in. This supersedes only the earlier homepage
composition paragraph; other pages and approved typography, terracotta, media,
copy and contact destinations stay protected. The initial homepage hero reaches
the current visible viewport below the measured header, without subtracting the
bar that is already hidden over this hero or counting safe areas/browser controls
twice. Enlarged text can grow naturally. The exact overlay and protected accent
must not be darkened/recolored to manufacture contrast compliance.

The implementation and observed limits are recorded in
[hero-black-fold-20261105.md](hero-black-fold-20261105.md). Required image/text
contrast, short-phone head clearance, independent review, exact-head CI and owner
publication remain separate gates. This direction grants no accessibility
exception and establishes no final rendered approval.

The owner's delegated visual judgment permits an appropriate existing approved
brand image choice within the homepage hero. The homepage now selects the
people-free `/images/handyman/front-door-repaint-p5-reviewed-20260910.webp` to
remove short-phone head/text collisions and enlarged-text head cropping. Its
existing approval and door/trim relevance are recorded in
`docs/charcoal-integration-20261104.md`; approved carpentry service consumers
already use it. This representative photograph is not authentic completed-job
proof. Other pages keep their existing media. Exact overlay/accent, full-bleed
coverage, independent crops and actual contrast remain required review gates.
The September10 visual audit records the asset as previously generated/edited
representative imagery reviewed at full size. A focused1.8× crop places more of
the copy over the door panels; no filter or additional darkening is applied.
