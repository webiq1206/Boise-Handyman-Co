/**
 * Post-build check: the client bundle must not contain the other business's
 * seeded review text. City name "Kuna" on its own is allowed.
 *
 *   node scripts/grep-static-reviews.mjs
 *   STATIC_REVIEW_GREP_ROOT=/path node scripts/grep-static-reviews.mjs
 */
import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";

const REVIEW_NEEDLES = [
  "Lawn Care",
  "Lawn Care Kuna has been taking care of our yard",
];

const root = process.env.STATIC_REVIEW_GREP_ROOT || ".next/static";

if (!existsSync(root)) {
  console.error(`missing ${root}`);
  process.exit(1);
}

const args = ["-R", "-a", "-n", "-F", ...REVIEW_NEEDLES.flatMap((needle) => ["-e", needle]), root];
console.log(`grep ${args.join(" ")}`);
const result = spawnSync("grep", args, { encoding: "utf8" });
if (result.stdout) process.stdout.write(result.stdout);
if (result.stderr) process.stderr.write(result.stderr);
if (result.error) {
  console.error(result.error.message);
  process.exit(1);
}
if (result.status === 0) {
  console.error("Seeded review text is in the client bundle.");
  process.exit(1);
}
if (result.status === 1) {
  console.log("no matches");
  process.exit(0);
}
process.exit(result.status ?? 1);
