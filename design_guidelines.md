# Boise Handyman Co Design Guidelines

## Design Approach

**Premium, Clear, Trustworthy** - A local handyman service presented with a calm, editorial feel: warm neutrals, confident typography, and generous whitespace. Small jobs, treated seriously.

**Core principles:**
- Clarity over clutter: one primary action per section
- Bone primary CTAs; **steel blue is the brand accent** - strategic, not decorative
- Mobile-first conversion (estimator, consult CTA)
- Shared tokens in `app/globals.css` - no one-off page styles

**Steel blue usage (two tones, used where each reads best):**
- **Steel blue `#8FAEC4` (`--accent-legible`) = all accent TEXT:** heading accent
  words (`.brc-accent`), eyebrow ticks, text-link hover, focus rings, step
  numerals. AA-legible (5.38:1) on the charcoal ground at any size. Never set
  steel blue text on bone (2.28:1, decorative only).
- **Deep steel blue `#4E6B7E` (`--accent`) = graphic fills only:** chips, tints,
  slider track, icon grounds (always with bone text on top). Too dark for text.

The seal carries steel blue on its outer ring and dots; the wordmark carries it on
the italic "Co." only. Never recolor marks outside charcoal, bone, and `#8FAEC4`.

---

## Color Palette

| Role | Token | Use |
|------|-------|-----|
| Canvas | `--background` | Default sections |
| Greige | `--surface-greige` | Alternating sections |
| Card | `--card` | White cards |
| Ink | `--foreground` | Body text (AA) |
| Meta | `--muted-foreground` | Eyebrows, captions only |
| Anchor | `--inverse` | Dark bands, footer |
| Accent | `--accent-legible` (steel blue #8FAEC4) | `.brc-accent` accent words, links, focus, eyebrow ticks |
| Graphic fill | `--accent` (deep steel blue #4E6B7E) | chips, tints, slider thumb, icon grounds - not text |

---

## Typography

- **UI & body:** Montserrat (`font-sans`)
- **Accent word:** Libre Baskerville italic in steel blue via `.brc-accent` (max one word per heading)
- **Numerals:** Libre Baskerville via `.brc-display-num` / `<DisplayNum>`
- **Eyebrows:** `.brc-label` - 11px, uppercase, 0.14em tracking

Living reference: `/style-guide` (noindex).

---

## Buttons & links

1. **Primary:** `Button variant="brand"` (charcoal solid)
2. **Secondary:** `Button variant="brandOutline"`
3. **Tertiary:** `<TextLink href="…">`

Do not use `brandAccent`, `brandGhost`, or `brandInverseOutline` on marketing pages.

---

## Components

- `Section` - variants: `canvas` (default), `greige`, `surface`, `inverse`, `tint`
- `PageHeader` - inner page heroes
- `MarketingCard` / `BlogCard`
- `Hairline` - fullBleed, spaced
- `Chip` - categories and tags

---

## Imagery

- Paths: `shared/siteImages.ts`, `shared/serviceBackgrounds.ts`, `shared/blogImages.ts`
- Class: `.img-brand-grade` on all `next/image` marketing photos
- Replace placeholder files in `public/images/` before launch

---

## Contact config

Single source: `shared/siteConfig.ts` (env: `NEXT_PUBLIC_PHONE`, `NEXT_PUBLIC_EMAIL`, `NEXT_PUBLIC_SITE_URL`).
