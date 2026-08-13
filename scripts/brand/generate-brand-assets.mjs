/**
 * Boise Handyman Co - PLACEHOLDER brand kit generator.
 *
 * Rebuilds the full public/brand kit (seal, wordmark, wordmark-full, icon,
 * favicons, app icons) from the source fonts using opentype.js + resvg. The
 * output tree and file naming mirror the previous professionally drawn
 * Boise Construction Co kit exactly:
 *
 *   public/brand/svg/{seal,wordmark,wordmark-full,icon}/...
 *   public/brand/png/...   (same tree, size-suffixed)
 *   public/brand/favicon.ico
 *   public/favicon.svg, favicon.ico, favicon-16.png, favicon-32.png
 *   public/icons/apple-touch-icon.png, icon-192.png, icon-512.png
 *
 * Naming: boise-handyman-co-{mark}-{ink}[-accent]-{size}
 *
 * STATUS: this kit is a programmatically generated PLACEHOLDER pending real
 * brand assets. When approved artwork arrives, drop it into public/brand and
 * retire this script again.
 *
 * Usage:
 *   node scripts/brand/generate-brand-assets.mjs           # write assets
 *   node scripts/brand/generate-brand-assets.mjs --preview # also write previews
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import opentype from "opentype.js";
import { Resvg } from "@resvg/resvg-js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..", "..");
const assets = path.join(root, "scripts", "og-assets");

const BRAND = {
  name: "Boise Handyman Co",
  tagline: "HANDYMAN SERVICES",
  region: "TREASURE VALLEY · IDAHO",
  slug: "boise-handyman-co",
};

const COLOR = {
  ink: "#2C302F",   // charcoal (shared brand ink)
  bone: "#F7F5F3",  // bone (shared brand light)
  accent: "#8FAEC4", // Steel blue - the one brand-distinct color. It appears
                     // ONLY on the seal's outer ring + dots, the wordmark's
                     // "Co.", the full wordmark's rule, and the icon field.
                     // WCAG contrast on charcoal 5.74:1 (AA for normal text);
                     // on bone 2.14:1 (decorative only).
};

const METADATA =
  "Boise Handyman Co, handyman services, home repairs, drywall repair, " +
  "painting, plumbing repairs, electrical repairs, carpentry, mounting, " +
  "home maintenance, Boise, Meridian, Eagle, Nampa, Treasure Valley, Idaho, " +
  "logo, brand identity";

const loadFont = (file) =>
  opentype.parse(fs.readFileSync(path.join(assets, file)).buffer);

const montserrat = loadFont("Montserrat-Light.ttf");

// Fraunces ships as a variable font whose default master is Black at the
// smallest optical size, with the "wonky" swash alternates switched on. The
// identity uses the light, high-contrast display cut with plain letterforms,
// so pin the axes before any glyph is measured or drawn.
const fraunces = loadFont("Fraunces-Italic.ttf");
fraunces.variation.set({ wght: 300, opsz: 144, SOFT: 0, WONK: 0 });

/** Tracking used throughout the identity, expressed as a fraction of em. */
const TRACK_EM = 13 / 112;

// The italic "Co." suffix is unchanged by the rename, so the original outlines
// are reused rather than re-rendered. See scripts/brand/extract-co-mark.mjs.
const CO_MARK = JSON.parse(fs.readFileSync(path.join(__dirname, "co-mark.json"), "utf8"));

/**
 * Place the italic "Co." lockup at a given cap height and baseline.
 * Returns the SVG group plus the ink extents so callers can lay out around it.
 */
function coMark({ capHeight, x, y, fill }) {
  const scale = capHeight / CO_MARK.capHeight;
  return {
    svg: `<g transform="translate(${x.toFixed(3)} ${y.toFixed(3)}) scale(${scale.toFixed(6)})"><path d="${CO_MARK.d}" fill="${fill}"/></g>`,
    width: CO_MARK.width * scale,
    maxX: x + CO_MARK.width * scale,
  };
}

const capSize = (font, capHeight) =>
  (capHeight * font.unitsPerEm) / font.tables.os2.sCapHeight;

/**
 * Serialise an opentype Path.
 *
 * opentype's own toPathData() omits the separator before a coordinate that is
 * exactly zero, so "-22.56 0 -22.56" is emitted as "-22.5600-22.56" and the
 * glyph renders corrupt. Any glyph sitting on an exact zero baseline hits this,
 * which is every glyph in the arc-set text, so paths are written out here.
 */
function toPath(p, precision = 3) {
  const n = (v) => {
    const r = Number(v.toFixed(precision));
    return Object.is(r, -0) ? "0" : String(r);
  };
  const out = [];
  for (const c of p.commands) {
    switch (c.type) {
      case "M":
        out.push(`M ${n(c.x)} ${n(c.y)}`);
        break;
      case "L":
        out.push(`L ${n(c.x)} ${n(c.y)}`);
        break;
      case "C":
        out.push(`C ${n(c.x1)} ${n(c.y1)} ${n(c.x2)} ${n(c.y2)} ${n(c.x)} ${n(c.y)}`);
        break;
      case "Q":
        out.push(`Q ${n(c.x1)} ${n(c.y1)} ${n(c.x)} ${n(c.y)}`);
        break;
      case "Z":
        out.push("Z");
        break;
      default:
        break;
    }
  }
  return out.join(" ");
}

/**
 * Lay out a run of text as outline path data.
 * Returns the combined `d` plus the ink box so callers can centre precisely.
 */
function layout(font, text, { size, trackEm = 0, x = 0, y = 0 }) {
  const tracking = trackEm * size;
  let pen = x;
  const parts = [];
  let minX = Infinity;
  let maxX = -Infinity;
  let minY = Infinity;
  let maxY = -Infinity;

  for (const ch of text) {
    // font.getPath (rather than glyph.getPath) is what honours variable-font
    // axis settings, so all measurement goes through the placed path.
    if (ch !== " ") {
      const p = font.getPath(ch, pen, y, size);
      if (p.commands.length) {
        parts.push(toPath(p));
        const box = p.getBoundingBox();
        minX = Math.min(minX, box.x1);
        maxX = Math.max(maxX, box.x2);
        minY = Math.min(minY, box.y1);
        maxY = Math.max(maxY, box.y2);
      }
    }
    pen += font.getAdvanceWidth(ch, size) + tracking;
  }

  // Trailing tracking is not part of the mark.
  const advance = pen - tracking - x;
  return { d: parts.join(" "), minX, maxX, minY, maxY, advance, inkWidth: maxX - minX };
}

/** Lay out text along a circular arc, one rotated glyph at a time. */
function layoutArc(font, text, { size, trackEm = 0, cx, cy, radius, centerDeg, flip = false, ink }) {
  const tracking = trackEm * size;

  const widths = [...text].map((ch) => ({
    ch,
    advance: font.getAdvanceWidth(ch, size) + tracking,
  }));
  const total = widths.reduce((sum, g) => sum + g.advance, 0) - tracking;
  const totalDeg = (total / (2 * Math.PI * radius)) * 360;

  const dir = flip ? -1 : 1;
  let angle = centerDeg - (dir * totalDeg) / 2;
  const parts = [];

  for (const { ch, advance } of widths) {
    const stepDeg = (advance / (2 * Math.PI * radius)) * 360;
    const midDeg = angle + (dir * stepDeg) / 2;
    const probe = ch === " " ? null : font.getPath(ch, 0, 0, size);
    if (probe && probe.commands.length) {
      const rad = ((midDeg - 90) * Math.PI) / 180;
      const px = cx + radius * Math.cos(rad);
      const py = cy + radius * Math.sin(rad);
      // Glyph drawn at the origin on its own baseline, then rotated upright
      // relative to the circle centre.
      const box = probe.getBoundingBox();
      const halfInk = (box.x1 + box.x2) / 2;
      const d = toPath(font.getPath(ch, -halfInk, 0, size));
      const rot = flip ? midDeg + 180 : midDeg;
      parts.push(
        `<path d="${d}" fill="${ink}" transform="translate(${px.toFixed(2)} ${py.toFixed(
          2,
        )}) rotate(${rot.toFixed(3)})"/>`,
      );
    }
    angle += dir * stepDeg;
  }
  return parts.join("");
}

const svgHeader = (w, h, label, desc) =>
  `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" role="img" aria-label="${label}"><title>${label}</title><desc>${desc}</desc><metadata>${METADATA}</metadata>`;

/* ------------------------------------------------------------------ *
 * Seal - circular maker's mark
 *
 * Top arc: HANDYMAN SERVICES. Bottom arc: TREASURE VALLEY / IDAHO. The
 * previous kit carried "EST 2020" in the bottom arc; that founding-year
 * claim is removed, and the region line takes its place so the ring stays
 * balanced top to bottom.
 * ------------------------------------------------------------------ */
function buildSeal({ ink, ring, dotColor, disc = null, variantLabel }) {
  const S = 1024;
  const cx = S / 2;
  const cy = S / 2;
  const arcRadius = 446;

  const arcSize = capSize(montserrat, 22.4);
  const topArc = layoutArc(montserrat, BRAND.tagline, {
    size: arcSize,
    trackEm: 0.16,
    cx,
    cy,
    radius: arcRadius,
    centerDeg: 0,
    ink,
  });
  const bottomArc = layoutArc(montserrat, BRAND.region, {
    size: arcSize,
    trackEm: 0.16,
    cx,
    cy,
    radius: arcRadius,
    centerDeg: 180,
    flip: true,
    ink,
  });

  // "BOISE" centred above the script.
  const boiseSize = capSize(montserrat, 42);
  const boiseTrack = 0.3;
  const boiseProbe = layout(montserrat, "BOISE", { size: boiseSize, trackEm: boiseTrack, x: 0, y: 0 });
  const boise = layout(montserrat, "BOISE", {
    size: boiseSize,
    trackEm: boiseTrack,
    x: cx - boiseProbe.inkWidth / 2 - boiseProbe.minX,
    y: 432,
  });

  // Script word, scaled to fit the seal interior.
  const SCRIPT_MAX_WIDTH = 800;
  let scriptSize = 250;
  let script = layout(fraunces, "Handyman", { size: scriptSize, x: 0, y: 0 });
  if (script.inkWidth > SCRIPT_MAX_WIDTH) {
    scriptSize = scriptSize * (SCRIPT_MAX_WIDTH / script.inkWidth);
    script = layout(fraunces, "Handyman", { size: scriptSize, x: 0, y: 0 });
  }
  const scriptPlaced = layout(fraunces, "Handyman", {
    size: scriptSize,
    x: cx - script.inkWidth / 2 - script.minX,
    y: 580,
  });

  // Small "C O" under the script. Unlike "Construction", "Handyman" has a
  // descender: the "y" tail ends about 51 units below the script baseline
  // (about y 631), so this line sits lower than it did in the old kit to
  // clear the tail's ball terminal.
  const CO_BASELINE = 664;
  const coSize = capSize(montserrat, 13.3);
  const coTrack = 0.6;
  const coProbe = layout(montserrat, "CO", { size: coSize, trackEm: coTrack, x: 0, y: 0 });
  const co = layout(montserrat, "CO", {
    size: coSize,
    trackEm: coTrack,
    x: cx - coProbe.inkWidth / 2 - coProbe.minX,
    y: CO_BASELINE,
  });

  // Tick hairlines follow the ink; dots carry the accent (accent variants).
  const tick = (x1, x2, y) =>
    `<line x1="${x1}" y1="${y}" x2="${x2}" y2="${y}" stroke="${ink}" stroke-width="1.3"/>`;
  const dot = (x, y, r = 2.1) =>
    `<circle cx="${x}" cy="${y}" r="${r}" fill="${dotColor}"/>`;

  const boiseRuleGap = 26;
  const boiseLeftEnd = boise.minX - boiseRuleGap;
  const boiseRightStart = boise.maxX + boiseRuleGap;
  const coLeftEnd = co.minX - boiseRuleGap;
  const coRightStart = co.maxX + boiseRuleGap;

  const label = `${BRAND.name} seal, ${variantLabel}`;
  const desc = `Circular seal logo for ${BRAND.name}, handyman services in Boise and the Treasure Valley, Idaho.`;

  // Outer ring and dots carry the accent on accent variants; the inner ring
  // and all lettering are ink.
  return (
    svgHeader(S, S, label, desc) +
    (disc ? `<circle cx="${cx}" cy="${cy}" r="${S / 2}" fill="${disc}"/>` : "") +
    `<circle cx="${cx}" cy="${cy}" r="500" fill="none" stroke="${ring}" stroke-width="2.3"/>` +
    `<circle cx="${cx}" cy="${cy}" r="487" fill="none" stroke="${ink}" stroke-width="1.5"/>` +
    topArc +
    bottomArc +
    dot(66, cy, 4) +
    `<line x1="66" y1="499" x2="66" y2="481" stroke="${ink}" stroke-width="1.3"/>` +
    `<line x1="66" y1="525" x2="66" y2="543" stroke="${ink}" stroke-width="1.3"/>` +
    dot(958, cy, 4) +
    `<line x1="958" y1="499" x2="958" y2="481" stroke="${ink}" stroke-width="1.3"/>` +
    `<line x1="958" y1="525" x2="958" y2="543" stroke="${ink}" stroke-width="1.3"/>` +
    tick(boiseLeftEnd - 78, boiseLeftEnd, 410) +
    tick(boiseRightStart, boiseRightStart + 78, 410) +
    dot(boiseLeftEnd - 78, 410) +
    dot(boiseRightStart + 78, 410) +
    `<path d="${boise.d}" fill="${ink}"/>` +
    `<path d="${scriptPlaced.d}" fill="${ink}"/>` +
    `<path d="${co.d}" fill="${ink}"/>` +
    tick(coLeftEnd - 78, coLeftEnd, 656) +
    tick(coRightStart, coRightStart + 78, 656) +
    dot(coLeftEnd - 78, 656) +
    dot(coRightStart + 78, 656) +
    `</svg>`
  );
}

/* ------------------------------------------------------------------ *
 * Wordmark - "BOISE HANDYMAN Co."
 * ------------------------------------------------------------------ */
function buildWordmark(fill, coFill, variantLabel) {
  const CAP_HEIGHT = 78.4;
  const size = capSize(montserrat, CAP_HEIGHT);
  const baseline = 132;
  const startX = 73.4;

  const caps = layout(montserrat, "BOISE HANDYMAN", {
    size,
    trackEm: TRACK_EM,
    x: startX,
    y: baseline,
  });

  // The italic "Co." is the wordmark's single accent moment (brand kit rule).
  const co = coMark({
    capHeight: CAP_HEIGHT,
    x: caps.maxX + size * 0.34,
    y: baseline,
    fill: coFill,
  });

  const width = Math.round(co.maxX + startX);
  const label = `${BRAND.name} wordmark, ${variantLabel}`;
  const desc = `Horizontal wordmark for ${BRAND.name}, handyman services in Boise and the Treasure Valley, Idaho.`;

  return (
    svgHeader(width, 200, label, desc) +
    `<path d="${caps.d}" fill="${fill}"/>` +
    co.svg +
    `</svg>`
  );
}

/* ------------------------------------------------------------------ *
 * Full wordmark - name over rule, tagline, and region line
 * ------------------------------------------------------------------ */
function buildWordmarkFull(fill, ruleColor, coFill, variantLabel) {
  const CAP_HEIGHT = 72.8;
  const size = capSize(montserrat, CAP_HEIGHT);
  const baseline = 196;
  const startX = 60;

  const caps = layout(montserrat, "BOISE HANDYMAN", {
    size,
    trackEm: TRACK_EM,
    x: startX,
    y: baseline,
  });
  const co = coMark({
    capHeight: CAP_HEIGHT,
    x: caps.maxX + size * 0.34,
    y: baseline,
    fill: coFill,
  });

  const width = Math.round(co.maxX + startX);
  const center = width / 2;

  // Tagline and region lines, centred under the wordmark.
  const tagSize = capSize(montserrat, 18.54);
  const tagTrack = 0.28;
  const tagProbe = layout(montserrat, BRAND.tagline, { size: tagSize, trackEm: tagTrack, x: 0, y: 0 });
  const tag = layout(montserrat, BRAND.tagline, {
    size: tagSize,
    trackEm: tagTrack,
    x: center - tagProbe.inkWidth / 2 - tagProbe.minX,
    y: 312,
  });

  const regSize = capSize(montserrat, 13.3);
  const regTrack = 0.24;
  const regProbe = layout(montserrat, BRAND.region, { size: regSize, trackEm: regTrack, x: 0, y: 0 });
  const reg = layout(montserrat, BRAND.region, {
    size: regSize,
    trackEm: regTrack,
    x: center - regProbe.inkWidth / 2 - regProbe.minX,
    y: 356,
  });

  const ruleHalf = 150;
  const label = `${BRAND.name} full wordmark, ${variantLabel}`;
  const desc = `Stacked wordmark lockup for ${BRAND.name}, handyman services in Boise and the Treasure Valley, Idaho.`;

  return (
    svgHeader(width, 420, label, desc) +
    `<path d="${caps.d}" fill="${fill}"/>` +
    co.svg +
    `<line x1="${center - ruleHalf}" y1="262" x2="${center + ruleHalf}" y2="262" stroke="${ruleColor}" stroke-width="1.4"/>` +
    `<path d="${tag.d}" fill="${fill}"/>` +
    `<path d="${reg.d}" fill="${fill}"/>` +
    `</svg>`
  );
}

/* ------------------------------------------------------------------ *
 * Icon - small-size mark: the script "H" initial on a disc
 *
 * The seal stops reading below about 160px, so this separately built mark
 * covers favicons, app icons, and avatars. The accent is a solid band at
 * 5.9% of the diameter where a ring is present; the letterform is the
 * script initial from "Handyman".
 * ------------------------------------------------------------------ */
function buildIcon({ field, innerDisc = null, glyph, variantLabel }) {
  const S = 512;
  const c = S / 2;
  const TARGET_INK_HEIGHT = 220;

  // Measure the script H at a probe size, then scale so the ink box lands at
  // the target height, centred on the disc.
  const probe = layout(fraunces, "H", { size: 100, x: 0, y: 0 });
  const size = (100 * TARGET_INK_HEIGHT) / (probe.maxY - probe.minY);
  const measured = layout(fraunces, "H", { size, x: 0, y: 0 });
  const placed = layout(fraunces, "H", {
    size,
    x: c - measured.inkWidth / 2 - measured.minX,
    y: c + (measured.maxY - measured.minY) / 2 - measured.maxY,
  });

  const label = `${BRAND.slug} icon, ${variantLabel}`;
  const desc = `Small-size icon mark for ${BRAND.name}, handyman services in Boise, Idaho.`;

  return (
    svgHeader(S, S, label, desc) +
    `<circle cx="${c}" cy="${c}" r="${c}" fill="${field}"/>` +
    (innerDisc ? `<circle cx="${c}" cy="${c}" r="226" fill="${innerDisc}"/>` : "") +
    `<path d="${placed.d}" fill="${glyph}"/>` +
    `</svg>`
  );
}

/* ------------------------------------------------------------------ *
 * Build every SVG variant (mirrors the previous kit's tree exactly)
 * ------------------------------------------------------------------ */
const { ink, bone, accent } = COLOR;
const slug = BRAND.slug;

const svgs = {
  // Seal: light ground (transparent), dark ground (transparent), and "any"
  // (opaque disc for placement over photography or color).
  [`svg/seal/light/${slug}-seal-charcoal.svg`]: buildSeal({
    ink, ring: ink, dotColor: ink, variantLabel: "charcoal",
  }),
  [`svg/seal/light/${slug}-seal-charcoal-accent.svg`]: buildSeal({
    ink, ring: accent, dotColor: accent, variantLabel: "charcoal accent",
  }),
  [`svg/seal/dark/${slug}-seal-bone.svg`]: buildSeal({
    ink: bone, ring: bone, dotColor: bone, variantLabel: "bone",
  }),
  [`svg/seal/dark/${slug}-seal-bone-accent.svg`]: buildSeal({
    ink: bone, ring: accent, dotColor: accent, variantLabel: "bone accent",
  }),
  [`svg/seal/any/${slug}-seal-on-charcoal.svg`]: buildSeal({
    ink: bone, ring: bone, dotColor: bone, disc: ink, variantLabel: "on charcoal",
  }),
  [`svg/seal/any/${slug}-seal-on-charcoal-accent.svg`]: buildSeal({
    ink: bone, ring: accent, dotColor: accent, disc: ink, variantLabel: "on charcoal accent",
  }),
  [`svg/seal/any/${slug}-seal-on-bone.svg`]: buildSeal({
    ink, ring: ink, dotColor: ink, disc: bone, variantLabel: "on bone",
  }),
  [`svg/seal/any/${slug}-seal-on-bone-accent.svg`]: buildSeal({
    ink, ring: accent, dotColor: accent, disc: bone, variantLabel: "on bone accent",
  }),

  // Wordmark.
  [`svg/wordmark/light/${slug}-wordmark-charcoal.svg`]: buildWordmark(ink, ink, "charcoal"),
  [`svg/wordmark/light/${slug}-wordmark-charcoal-accent.svg`]: buildWordmark(ink, accent, "charcoal accent"),
  [`svg/wordmark/dark/${slug}-wordmark-bone.svg`]: buildWordmark(bone, bone, "bone"),
  [`svg/wordmark/dark/${slug}-wordmark-bone-accent.svg`]: buildWordmark(bone, accent, "bone accent"),

  // Full wordmark: accent variants carry the accent on the rule and "Co.".
  [`svg/wordmark-full/light/${slug}-wordmark-full-charcoal.svg`]: buildWordmarkFull(ink, ink, ink, "charcoal"),
  [`svg/wordmark-full/light/${slug}-wordmark-full-charcoal-accent.svg`]: buildWordmarkFull(ink, accent, accent, "charcoal accent"),
  [`svg/wordmark-full/dark/${slug}-wordmark-full-bone.svg`]: buildWordmarkFull(bone, bone, bone, "bone"),
  [`svg/wordmark-full/dark/${slug}-wordmark-full-bone-accent.svg`]: buildWordmarkFull(bone, accent, accent, "bone accent"),

  // Small-size icon mark.
  [`svg/icon/${slug}-icon-accent.svg`]: buildIcon({
    field: accent, glyph: ink, variantLabel: "accent",
  }),
  [`svg/icon/${slug}-icon-bone.svg`]: buildIcon({
    field: accent, innerDisc: bone, glyph: ink, variantLabel: "bone",
  }),
  [`svg/icon/${slug}-icon-charcoal.svg`]: buildIcon({
    field: accent, innerDisc: ink, glyph: bone, variantLabel: "charcoal",
  }),
  [`svg/icon/${slug}-icon-mono-charcoal.svg`]: buildIcon({
    field: bone, innerDisc: ink, glyph: bone, variantLabel: "mono-charcoal",
  }),
  [`svg/icon/${slug}-icon-mono-bone.svg`]: buildIcon({
    field: ink, innerDisc: bone, glyph: ink, variantLabel: "mono-bone",
  }),
};

/* ------------------------------------------------------------------ *
 * Emit
 * ------------------------------------------------------------------ */
const write = (rel, contents) => {
  const dest = path.join(root, rel);
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.writeFileSync(dest, contents);
  console.log("  wrote", rel.replace(/\\/g, "/"));
};

console.log("Brand marks (SVG):");
for (const [rel, contents] of Object.entries(svgs)) {
  write(path.join("public", "brand", rel), contents);
}

/* Raster ladders ---------------------------------------------------- */
function raster(svg, width) {
  return new Resvg(svg, { fitTo: { mode: "width", value: width } }).render().asPng();
}

const SEAL_SIZES = [64, 128, 256, 512, 1024];
const WORDMARK_WIDTHS = [300, 600, 1200, 2400];
const ICON_SIZES = [16, 32, 64, 128, 180, 256, 512];

console.log("Raster exports (PNG):");
for (const [rel, svg] of Object.entries(svgs)) {
  const pngRel = rel.replace(/^svg\//, "png/").replace(/\.svg$/, "");
  if (rel.startsWith("svg/seal/")) {
    for (const size of SEAL_SIZES) {
      write(path.join("public", "brand", `${pngRel}-${size}px.png`), raster(svg, size));
    }
  } else if (rel.startsWith("svg/wordmark")) {
    for (const w of WORDMARK_WIDTHS) {
      write(path.join("public", "brand", `${pngRel}-${w}w.png`), raster(svg, w));
    }
  } else if (rel.startsWith("svg/icon/")) {
    for (const size of ICON_SIZES) {
      write(path.join("public", "brand", `${pngRel}-${size}px.png`), raster(svg, size));
    }
  }
}

/**
 * Pack PNG buffers into a multi-resolution .ico.
 *
 * The ICO container accepts embedded PNG payloads directly for any dimension up
 * to 256, so no BMP re-encoding is needed. Layout is a 6-byte ICONDIR followed
 * by one 16-byte ICONDIRENTRY per image, then the payloads. A dimension of 256
 * is encoded as 0 in the single width/height bytes.
 */
function buildIco(pngs) {
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0); // reserved
  header.writeUInt16LE(1, 2); // type: icon
  header.writeUInt16LE(pngs.length, 4);

  let offset = 6 + pngs.length * 16;
  const entries = [];
  for (const { size, data } of pngs) {
    const entry = Buffer.alloc(16);
    entry.writeUInt8(size >= 256 ? 0 : size, 0);
    entry.writeUInt8(size >= 256 ? 0 : size, 1);
    entry.writeUInt8(0, 2); // palette count
    entry.writeUInt8(0, 3); // reserved
    entry.writeUInt16LE(1, 4); // color planes
    entry.writeUInt16LE(32, 6); // bits per pixel
    entry.writeUInt32LE(data.length, 8);
    entry.writeUInt32LE(offset, 12);
    entries.push(entry);
    offset += data.length;
  }

  return Buffer.concat([header, ...entries, ...pngs.map((p) => p.data)]);
}

/* Favicons and app icons -------------------------------------------- *
 * The favicon is the script "H" initial on the accent field (icon-accent),
 * the boldest read at very small sizes.                                */
const faviconSvg = svgs[`svg/icon/${slug}-icon-accent.svg`];
const ico = buildIco([16, 32, 48, 64].map((size) => ({ size, data: raster(faviconSvg, size) })));

console.log("Favicons and app icons:");
write("public/brand/favicon.ico", ico);
write("public/favicon.ico", ico);
write("public/favicon.svg", faviconSvg);
write("public/favicon-16.png", raster(faviconSvg, 16));
write("public/favicon-32.png", raster(faviconSvg, 32));
write("public/icons/apple-touch-icon.png", raster(faviconSvg, 180));
write("public/icons/icon-192.png", raster(faviconSvg, 192));
write("public/icons/icon-512.png", raster(faviconSvg, 512));

/* Optional previews --------------------------------------------------- */
if (process.argv.includes("--preview")) {
  const previewDir = "scripts/brand/preview";
  console.log("Previews:");
  write(`${previewDir}/new-seal-light-accent.png`, raster(svgs[`svg/seal/light/${slug}-seal-charcoal-accent.svg`], 900));
  write(`${previewDir}/new-seal-on-charcoal-accent.png`, raster(svgs[`svg/seal/any/${slug}-seal-on-charcoal-accent.svg`], 900));
  write(`${previewDir}/new-wordmark-charcoal-accent.png`, raster(svgs[`svg/wordmark/light/${slug}-wordmark-charcoal-accent.svg`], 1400));
  write(`${previewDir}/new-wordmark-full-charcoal-accent.png`, raster(svgs[`svg/wordmark-full/light/${slug}-wordmark-full-charcoal-accent.svg`], 1400));
  write(`${previewDir}/new-icon-accent.png`, raster(svgs[`svg/icon/${slug}-icon-accent.svg`], 400));
}

console.log("\nDone.");
