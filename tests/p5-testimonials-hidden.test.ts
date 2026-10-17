import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
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
  assert.deepEqual(await response.json(), []);

  const data = readFileSync(new URL("../shared/testimonialsData.ts", import.meta.url), "utf8");
  const route = readFileSync(new URL("../app/api/testimonials/route.ts", import.meta.url), "utf8");
  const section = readFileSync(new URL("../components/sections/TestimonialsSection.tsx", import.meta.url), "utf8");
  assert.equal(data.includes("export const TESTIMONIALS"), true);
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
