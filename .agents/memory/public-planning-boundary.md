---
name: Public homepage planning ranges
description: Keep internal pricing inputs on the server and preserve the scoped calculator's complete viewport and state behavior.
---

The homepage's planning example is a fixed, one-task, quantity-one, standard-timing customer range. `shared/handymanPlanning.server.ts` prepares its existing 24 choices with the established server calculator. It publishes only version, category/task identity and display copy, and customer low/high ranges. An unpriced task remains null.

Never pass `handymanPriceContext`, cost-book rows, direct costs, overhead, profit, contingency, financial policy or calculation traces to a client component, serialized page props, browser storage or public endpoint. Do not rename those fields and send the same data. The server module uses the `server-only` marker. The public component imports only the safe public types/formatter and ID-only state helpers. `ConsultationForm` uses a separate display-only currency helper, avoiding a second runtime import of the pricing barrel.

Display-only legacy Handyman helpers and qualifications live in `shared/handymanDisplay.ts`; client components must import that module directly. Private engine/context modules reject browser bundling through a Node-only dependency and reject actual browser execution even if a bundler provides Node shims. Keep both checks while preserving ordinary offline Node financial fixtures.

Keep `verify:public-planning` and `verify:home-planning` in prebuild. The first runs its server-only fixture with `--conditions=react-server`; do not apply that condition to general React/browser suites. Verify actual production HTML/Flight and emitted public JavaScript before release, not just TypeScript imports or a source naming convention.

The focused calculator has job, task, review and result screens. Preserve the initial worked result, all 24 choices and their qualifiers, null/unpriced copy, exact customer ranges, valid Back/Next, editable review, ID-only session/history restoration and result before contact. Choice cards stay at least 56px; task navigation replaces the promotional bar while active. Keep the current Website Design Quality2.3 standard, implementation rules and this site's brand profile authoritative. A passing numeric fit does not establish visual acceptance.

Test every changed screen and meaningful state at the required phone/tablet/desktop sizes, including short landscape, long task labels and storage failure. These choices have no text input or software keyboard. Use loopback previews, outbound/API guards and fictional isolated fixtures only; do not submit real forms, messages, CRM or accounting records as tests.

`scripts/verify-home-planning.cjs` exports an offline customer-only fixture and delegates current acceptance to the full browser matrix. The exact historical component fixture remains source lineage; it cannot be freshly rendered against the new private engine guard. Label old rendered evidence with its original revision rather than treating it as a current baseline.
