# Boise Handyman Co · Brand Kit

> **PLACEHOLDER kit generated programmatically pending real brand assets.**
> Every file in this folder is rebuilt from source fonts by
> `scripts/brand/generate-brand-assets.mjs`. When approved artwork arrives,
> replace this tree and retire the generator.

Handyman Services · Boise & the Treasure Valley, Idaho

The kit follows the shared Boise trades brand conventions: charcoal ink, bone
light, Montserrat Light lettering, italic serif accents, a circular seal, and
exactly one brand-distinct accent color.

---

## What makes this brand distinct

| | |
|---|---|
| **Accent color** | `#8FAEC4` - Steel blue |
| **Seal arc** | `HANDYMAN SERVICES` (top) / `TREASURE VALLEY · IDAHO` (bottom) |
| **Seal centre** | `BOISE` / *Handyman* / `CO` |
| **Wordmark** | `BOISE HANDYMAN` *Co.* |

Everything else, charcoal, bone, both typefaces, the ring geometry, spacing,
and minimum sizes, is shared across the family.

### Accent contrast

| Pairing | Ratio | Verdict |
|---|---|---|
| `#8FAEC4` on charcoal `#2C302F` | 5.74:1 | Passes AA for normal text |
| `#8FAEC4` on bone `#F7F5F3` | 2.14:1 | Decorative only |

The accent appears on the seal's **outer ring and dots**, the wordmark's
***Co.***, the full wordmark's **rule**, and the small-size icon's **field**.

It reads well on charcoal and acceptably as a soft tint on bone. The reverse
lockups are where it has the most presence. Don't set accent-colored *text*
on bone.

---

## Files

```
boise-handyman-co/
├── svg/
│   ├── seal/           light/  dark/  any/   (8 files)
│   ├── wordmark/       light/  dark/         (4 files)
│   ├── wordmark-full/  light/  dark/         (4 files)
│   └── icon/                                 (5 files)
├── png/           same tree, transparent
│   ├── seal/…           1024 / 512 / 256 / 128 / 64 px
│   ├── wordmark/…       2400 / 1200 / 600 / 300 px wide
│   ├── wordmark-full/…  2400 / 1200 / 600 / 300 px wide
│   └── icon/…           512 / 256 / 180 / 128 / 64 / 32 / 16 px
└── favicon.ico    16 / 32 / 48 / 64 px
```

**Naming:** `boise-handyman-co-{mark}-{ink}[-accent]-{size}`

| Use | File |
|---|---|
| Default, light background | `svg/seal/light/boise-handyman-co-seal-charcoal.svg` |
| Default, dark background | `svg/seal/dark/boise-handyman-co-seal-bone.svg` |
| With accent, light | `svg/seal/light/boise-handyman-co-seal-charcoal-accent.svg` |
| With accent, dark | `svg/seal/dark/boise-handyman-co-seal-bone-accent.svg` |
| Over a photo | `svg/seal/any/boise-handyman-co-seal-on-charcoal.svg` |
| Horizontal lockup | `svg/wordmark/light/boise-handyman-co-wordmark-charcoal.svg` |
| Favicon / avatar | `svg/icon/boise-handyman-co-icon-accent.svg` |

---

## Typefaces

| Face | Used for | License |
|---|---|---|
| **Montserrat Light** | `BOISE`, the arc lines, `CO`, and `BOISE HANDYMAN` | SIL OFL 1.1 |
| **Fraunces Italic** (wght 300, opsz 144) | *Handyman* in the seal, *Co.* in the wordmark, the icon's *H* | SIL OFL 1.1 |

Both permit commercial and trademark use. Source font files live in
`scripts/og-assets/` at the repo root. All type in the kit is outlined, so
nothing depends on fonts being installed.

---

## Quick rules

- Seal minimum **160px** on screen, **0.75in** in print. Below that use the wordmark or icon.
- Wordmark minimum **600px** wide, **2.5in**.
- Clear space: **8% of seal diameter**; for the wordmark, one cap height of the `B`.
- Over photography, always use an `any/` disc version.
- Never recolor outside charcoal, bone, and `#8FAEC4`.
- No founding-year or "EST" claims appear anywhere in the kit, and none should be added until a real founding year is confirmed.
