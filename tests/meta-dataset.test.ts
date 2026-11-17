import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import { HANDYMAN_META_DATASET_ID as ID, handymanBrowserDataset as browser, handymanServerDataset as server } from "../lib/metaDataset.ts";

test("Handyman uses only its verified own dataset, never the Remodeling fallback", () => {
  assert.equal(browser(undefined), ID);
  assert.equal(browser(ID), ID);
  assert.equal(browser(` ${ID} `), ID);
  for (const bad of ["", "2461987544292871", "925837669911613", "899086193239991", "1064430746652370", "garbage", "</script>"]) {
    assert.equal(browser(bad), "");
    assert.equal(server(bad, ID), "");
    assert.equal(server(ID, bad), "");
  }
});

test("server stays opt-in and shares the exact browser dataset", () => {
  assert.equal(server(undefined, undefined), "");
  assert.equal(server(undefined, ID), ID);
  assert.equal(server(ID, undefined), ID);
  assert.equal(server(ID, ID), ID);
  assert.equal(server("", ID), "");
});

test("checked-in Replit build configuration selects the same verified Handyman dataset", () => {
  const config = readFileSync(new URL("../.replit", import.meta.url), "utf8");
  const ids = [...config.matchAll(/^NEXT_PUBLIC_META_PIXEL_ID\s*=\s*"([^"]*)"/gm)].map(match => match[1]);
  assert.deepEqual(ids, [ID]);
});
