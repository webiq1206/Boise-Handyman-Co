import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";
import { GET } from "../app/api/testimonials/route.ts";
import {
  getTestimonialsFor,
  getTestimonialsForCity,
  publishedTestimonials,
  SHOW_TESTIMONIALS,
  TESTIMONIALS,
} from "../shared/testimonialsData.ts";

const SEED_MARKERS = ["Lawn Care Kuna", "Sarah M.", "christmas-lights"];

test("the public testimonials endpoint is empty while the flag is off", async () => {
  assert.equal(SHOW_TESTIMONIALS, false);
  assert.deepEqual(publishedTestimonials(), []);
  assert.deepEqual(getTestimonialsFor("lawn-care", "kuna"), []);
  assert.deepEqual(getTestimonialsForCity("kuna"), []);

  const response = await GET();
  assert.equal(response.status, 200);
  assert.equal(response.headers.get("cache-control"), "no-store");
  assert.deepEqual(await response.json(), []);

  const data = readFileSync(new URL("../shared/testimonialsData.ts", import.meta.url), "utf8");
  const route = readFileSync(new URL("../app/api/testimonials/route.ts", import.meta.url), "utf8");
  const section = readFileSync(new URL("../components/sections/TestimonialsSection.tsx", import.meta.url), "utf8");
  assert.equal(data.includes("export const TESTIMONIALS"), true);
  assert.ok(route.indexOf("if (!SHOW_TESTIMONIALS)") < route.indexOf("db.select().from(testimonials)"));
  assert.equal(route.includes("db.select().from(testimonials)"), true);
  assert.equal(route.includes("storage.getAllTestimonials()"), true);
  assert.match(section, /publishedTestimonials\(\)/);
  assert.equal(Array.isArray(TESTIMONIALS), true);

  const surfaces = [
    "public/llms.txt",
    "public/llms-full.txt",
    "app/sitemap.ts",
    "app/feed.xml/route.ts",
  ].map((path) => readFileSync(new URL(`../${path}`, import.meta.url), "utf8"));
  for (const surface of surfaces) {
    for (const marker of SEED_MARKERS) {
      assert.equal(surface.includes(marker), false, marker);
    }
  }
});

test("the post-build static grep catches Lawn Care and Kuna review text only", () => {
  const script = fileURLToPath(new URL("../scripts/grep-static-reviews.mjs", import.meta.url));
  const seeded = mkdtempSync(join(tmpdir(), "reviews-seeded-"));
  writeFileSync(
    join(seeded, "chunk.js"),
    'const quote = "Lawn Care Kuna has been taking care of our yard for 2 years now.";',
  );
  const leaked = spawnSync(process.execPath, [script], {
    env: { ...process.env, STATIC_REVIEW_GREP_ROOT: seeded },
    encoding: "utf8",
  });
  assert.equal(leaked.status, 1);
  assert.match(leaked.stdout, /Lawn Care/);
  assert.match(leaked.stdout, /Lawn Care Kuna has been taking care of our yard/);

  const cityOnly = mkdtempSync(join(tmpdir(), "reviews-city-"));
  writeFileSync(join(cityOnly, "chunk.js"), "Handyman service in Kuna, Idaho");
  const clean = spawnSync(process.execPath, [script], {
    env: { ...process.env, STATIC_REVIEW_GREP_ROOT: cityOnly },
    encoding: "utf8",
  });
  assert.equal(clean.status, 0, clean.stderr);
  assert.match(clean.stdout, /no matches/);
});
