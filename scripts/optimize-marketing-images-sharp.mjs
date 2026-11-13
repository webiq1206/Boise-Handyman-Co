/**
 * Compress the source PNG renders to the WebP files the site actually serves.
 *
 * Sources live in assets/source-renders/, which is NOT served. They used to sit
 * in public/ next to their WebP output, where nothing referenced them and all
 * 71 MB of them shipped to production alongside the 3.6 MB of WebP that pages
 * actually load. They are kept rather than deleted because they are the
 * original AI renders and regeneration is not deterministic: rerunning the
 * prompt gives a different house, not the same house again.
 *
 * Directory layout under assets/source-renders/ mirrors public/, so
 * assets/source-renders/images/areas/nampa.png becomes
 * public/images/areas/nampa.webp.
 *
 * Eight served photos were replaced on 13 November 2026 (seven area photos
 * and gallery-boise-bungalow-exterior). Their renders here were replaced with
 * the new photographs at the served pixel size, and the served WebP files are
 * this script's own output, so a run reproduces them byte for byte. When a
 * served photo is replaced without its render, list the render in
 * SUPERSEDED_SOURCES below until the render is replaced too.
 *
 * Run: npm run images:optimize
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import sharp from "sharp";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const sourceRoot = path.join(root, "assets", "source-renders");
const publicRoot = path.join(root, "public");
const MAX_WIDTH = 1920;
const QUALITY = 80;

/**
 * Renders whose served WebP has been replaced with a different photograph
 * while the PNG kept here is still the OLD picture. Converting one would put
 * the retired photo back on the site, so these are skipped. Remove an entry
 * only when its render has been replaced with the source of the photo now
 * being served. Empty since 13 November 2026: every render matches its served
 * file again.
 */
const SUPERSEDED_SOURCES = new Set([]);

function collectPngs(directory) {
  if (!fs.existsSync(directory)) return [];
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(directory, entry.name);
    if (entry.isDirectory()) return collectPngs(full);
    return entry.name.toLowerCase().endsWith(".png") ? [full] : [];
  });
}

async function optimizeFile(inputPath) {
  const relative = path.relative(sourceRoot, inputPath);
  if (SUPERSEDED_SOURCES.has(relative.split(path.sep).join("/"))) {
    console.log(`${relative}: skipped, the served photo was replaced and this render is the old one`);
    return;
  }
  const outputPath = path.join(publicRoot, relative).replace(/\.png$/i, ".webp");
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });

  const before = fs.statSync(inputPath).size;

  let pipeline = sharp(inputPath);
  const meta = await pipeline.metadata();
  if (meta.width && meta.width > MAX_WIDTH) {
    pipeline = pipeline.resize({ width: MAX_WIDTH, withoutEnlargement: true });
  }

  await pipeline.webp({ quality: QUALITY, effort: 6 }).toFile(outputPath);

  const after = fs.statSync(outputPath).size;
  console.log(
    `${path.relative(root, outputPath)}: ${Math.round(before / 1024)}KB -> ${Math.round(after / 1024)}KB`,
  );
}

const pngs = collectPngs(sourceRoot);
if (pngs.length === 0) {
  console.log(`No PNG sources found under ${path.relative(root, sourceRoot)}.`);
  process.exit(0);
}

console.log(`Optimizing ${pngs.length} PNG source(s) to WebP...`);
for (const png of pngs) {
  await optimizeFile(png);
}
console.log("Done.");
