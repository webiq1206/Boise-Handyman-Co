/**
 * Generates the SITE-WIDE default Open Graph card: public/images/og-default.png.
 *
 * This is the fallback share image for every page that has no post-specific card
 * (home, services, areas, about, contact). app/layout.tsx and lib/page-metadata
 * both point social scrapers and iMessage at it.
 *
 * WHY THIS SCRIPT EXISTS. The previous og-default.png was a hand-made asset with
 * no reproduction path, so a rebrand once missed it: every share of the site kept
 * surfacing the old brand months after the company changed. Now it has a
 * generator, keyed off the same brand tokens and fonts as the per-post cards in
 * generate-og-images.mjs, so it can never silently drift again.
 *
 * Composition: 1200x630 dark card. The reverse (bone) seal and wordmark from the
 * generated brand kit sit on charcoal over the tagline and domain. Run
 * `node scripts/brand/generate-brand-assets.mjs` first if public/brand is stale.
 *
 * Usage:  node scripts/generate-og-default.mjs
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import satori from 'satori';
import { Resvg } from '@resvg/resvg-js';
import sharp from 'sharp';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');
const assets = path.join(__dirname, 'og-assets');
const brand = path.join(root, 'public', 'brand');

const W = 1200;
const H = 630;

// Brand tokens, identical to generate-og-images.mjs.
const BONE = '#F7F5F3';
const MIST = '#9F9C97';
const ACCENT = '#8FAEC4'; // steel blue, 5.74:1 on charcoal
const CHARCOAL = '#201E1D';

const TAGLINE = 'REPAIRS · INSTALLS · HOME MAINTENANCE';
const LOCALE = 'TREASURE VALLEY · IDAHO';
const DOMAIN = 'BOISEHANDYMAN.CO';

const fontLight = fs.readFileSync(path.join(assets, 'Montserrat-Light.ttf'));
const fontMedium = fs.readFileSync(path.join(assets, 'Montserrat-Medium.ttf'));

// Reverse brand marks from the generated kit, inlined as data URIs.
const pngUri = (rel) =>
  `data:image/png;base64,${fs.readFileSync(path.join(brand, rel)).toString('base64')}`;
const sealUri = pngUri('png/seal/dark/boise-handyman-co-seal-bone-accent-512px.png');
const wordmarkRel = 'png/wordmark/dark/boise-handyman-co-wordmark-bone-accent-1200w.png';
const wordmarkUri = pngUri(wordmarkRel);

function h(type, style, children) {
  return { type, props: { style, ...(children !== undefined ? { children } : {}) } };
}

/** One L-shaped corner bracket, mirrored via flags. */
function corner(top, left) {
  const len = 46;
  const thick = 2;
  const inset = 48;
  const vert = { position: 'absolute', width: thick, height: len, backgroundColor: ACCENT, display: 'flex' };
  const horiz = { position: 'absolute', width: len, height: thick, backgroundColor: ACCENT, display: 'flex' };
  const y = top ? { top: inset } : { bottom: inset };
  const x = left ? { left: inset } : { right: inset };
  return h('div', { position: 'absolute', width: len, height: len, ...y, ...x, display: 'flex' }, [
    h('div', { ...vert, ...(top ? { top: 0 } : { bottom: 0 }), ...(left ? { left: 0 } : { right: 0 }) }),
    h('div', { ...horiz, ...(top ? { top: 0 } : { bottom: 0 }), ...(left ? { left: 0 } : { right: 0 }) }),
  ]);
}

async function build() {
  // The wordmark PNG carries vertical padding from its 200-unit viewBox, so
  // derive the display height from the file's real aspect ratio.
  const wmMeta = await sharp(path.join(brand, wordmarkRel)).metadata();
  const WM_WIDTH = 660;
  const wmHeight = Math.round((WM_WIDTH * wmMeta.height) / wmMeta.width);

  const seal = h('img', {
    width: 236, height: 236, display: 'flex',
  });
  seal.props.src = sealUri;

  const wordmark = h('img', {
    width: WM_WIDTH, height: wmHeight, display: 'flex', marginTop: 26,
  });
  wordmark.props.src = wordmarkUri;

  const tree = h('div', {
    width: W, height: H, position: 'relative', display: 'flex',
    alignItems: 'center', justifyContent: 'center', fontFamily: 'Montserrat',
    // Radial highlight over charcoal, matching the original card's soft centre glow.
    backgroundColor: CHARCOAL,
    backgroundImage: 'radial-gradient(circle at 50% 42%, #2B2825 0%, #201E1D 60%)',
  }, [
    corner(true, true), corner(true, false), corner(false, true), corner(false, false),
    h('div', {
      position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center', width: 960,
    }, [
      seal,
      wordmark,
      h('div', {
        display: 'flex', fontSize: 21, fontWeight: 500, color: MIST, letterSpacing: '4.5px', marginTop: 24,
      }, TAGLINE),
      h('div', {
        display: 'flex', fontSize: 14, fontWeight: 500, color: MIST, letterSpacing: '3px', marginTop: 12,
      }, LOCALE),
      h('div', {
        display: 'flex', fontSize: 18, fontWeight: 500, color: ACCENT, letterSpacing: '4px', marginTop: 22,
      }, DOMAIN),
    ]),
  ]);

  const svg = await satori(tree, {
    width: W, height: H,
    fonts: [
      { name: 'Montserrat', data: fontLight, weight: 300, style: 'normal' },
      { name: 'Montserrat', data: fontMedium, weight: 500, style: 'normal' },
    ],
  });

  const png = new Resvg(svg, { fitTo: { mode: 'width', value: W } }).render().asPng();
  const dest = path.join(root, 'public', 'images', 'og-default.png');
  // Kept as PNG (its existing format and filename, referenced across the app).
  await sharp(png).png().toFile(dest);
  return dest;
}

build()
  .then((dest) => console.log(`og-default written: ${dest} (${Math.round(fs.statSync(dest).size / 1024)}KB)`))
  .catch((e) => { console.error('ERR', e.message); process.exit(1); });
