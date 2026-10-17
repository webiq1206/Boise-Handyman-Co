import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const forbidden = /illustrat|AI-generated|for illustration|\bconcept\b|render(?:ed|ing)|our work|recent jobs|our projects|recent projects|Representative /i;

function read(path: string): string {
  return readFileSync(new URL("../" + path, import.meta.url), "utf8");
}

test("photo alt text describes the picture and does not label it as our work", () => {
  const files = [
    "app/re-10-repairs-boise/page.tsx",
    "app/about/page.tsx",
    "app/contact/page.tsx",
    "components/sections/HeroSection.tsx",
    "components/sections/ProcessSection.tsx",
    "components/sections/StatementBandSection.tsx",
    "components/sections/ValueOverheadSection.tsx",
    "components/sections/WhyChooseUsSection.tsx",
    "components/sections/ProjectGallerySection.tsx",
    "shared/blogImageRegistry.ts",
  ];
  for (const file of files) {
    const source = read(file);
    const alts = [...source.matchAll(/alt(?:=|:)\s*\{?["']([^"']+)["']/g)].map((match) => match[1]);
    for (const alt of alts) assert.equal(forbidden.test(alt), false, `${file}: ${alt}`);
    assert.equal(source.includes("Service illustration"), false, file);
    assert.equal(source.includes(">Our work<"), false, file);
  }
  const re10 = read("app/re-10-repairs-boise/page.tsx");
  assert.match(re10, /alt="An open canvas tool bag with a drill, level, and tape measure on a drop cloth"/);
  assert.equal(re10.includes("<figcaption>"), false);
  for (const file of [
    "components/BeforeAfterSlider.tsx",
    "components/sections/FeaturedBeforeAfterSection.tsx",
    "components/sections/ProjectGallerySection.tsx",
    "components/seo/LandingPageTemplate.tsx",
  ]) {
    const visible = read(file).replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "");
    assert.equal(/before\s*\/\s*after|before and after|>Before<|>After<| - before| - after/i.test(visible), false, file);
  }
});
