/**
 * Post-build check: the client bundle must not contain the other business's
 * seeded review text. City name "Kuna" on its own is allowed.
 *
 * GNU grep exits 1 when it selects no lines. A deploy shell (`bash -e`, npm
 * lifecycle scripts) treats that as failure, which is what broke the Replit
 * republish after this script printed "no matches". This checker walks the
 * files itself: no match exits 0, a real match exits 1. A missing root exits 1.
 *
 *   node scripts/grep-static-reviews.mjs
 *   STATIC_REVIEW_GREP_ROOT=/path node scripts/grep-static-reviews.mjs
 */
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

const REVIEW_NEEDLES = [
  "Lawn Care",
  "Lawn Care Kuna has been taking care of our yard",
];

const root = process.env.STATIC_REVIEW_GREP_ROOT || ".next/static";

let rootStat;
try {
  rootStat = statSync(root);
} catch {
  console.error(`missing ${root}`);
  process.exit(1);
}
if (!rootStat.isDirectory()) {
  console.error(`missing ${root}`);
  process.exit(1);
}

function filesIn(dir) {
  const files = [];
  for (const name of readdirSync(dir)) {
    const path = join(dir, name);
    let stat;
    try {
      stat = statSync(path);
    } catch (error) {
      console.error(`unreadable ${path}: ${error.message}`);
      process.exit(1);
    }
    if (stat.isDirectory()) files.push(...filesIn(path));
    else if (stat.isFile()) files.push(path);
  }
  return files;
}

const hits = [];
for (const file of filesIn(root)) {
  let text;
  try {
    text = readFileSync(file);
  } catch (error) {
    console.error(`unreadable ${file}: ${error.message}`);
    process.exit(1);
  }
  const lines = text.toString("latin1").split("\n");
  lines.forEach((line, index) => {
    if (REVIEW_NEEDLES.some((needle) => line.includes(needle))) {
      hits.push(`${file}:${index + 1}:${line}`);
    }
  });
}

console.log(`scan ${root} for ${REVIEW_NEEDLES.map((needle) => JSON.stringify(needle)).join(" ")}`);
if (hits.length > 0) {
  console.log(hits.join("\n"));
  console.error("Seeded review text is in the client bundle.");
  process.exit(1);
}
console.log("no matches");
process.exit(0);
