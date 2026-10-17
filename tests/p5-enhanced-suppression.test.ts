import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import test from "node:test";
import { PGlite } from "@electric-sql/pglite";
import { trackGoogleAdsLeadConversion } from "../lib/googleAdsConversion.ts";
import { assertAdditiveSql } from "../scripts/p5-schema-safety.mjs";
import {
  addEnhancedConversionSuppression,
  allowEnhancedConversions,
  clearEnhancedConversionSuppressionReady,
  responseWithEnhancedDecision,
  sha256Hex,
  suppressionHashes,
} from "../server/services/enhancedConversionSuppression.ts";

function sha(value: string): string {
  return createHash("sha256").update(value, "utf8").digest("hex");
}

async function withDatabase<T>(run: (db: PGlite) => Promise<T>): Promise<T> {
  const db = new PGlite();
  const previous = (globalThis as { __p5Pool?: unknown }).__p5Pool;
  (globalThis as { __p5Pool?: PGlite }).__p5Pool = db;
  clearEnhancedConversionSuppressionReady();
  try {
    return await run(db);
  } finally {
    clearEnhancedConversionSuppressionReady();
    if (previous === undefined) delete (globalThis as { __p5Pool?: unknown }).__p5Pool;
    else (globalThis as { __p5Pool?: unknown }).__p5Pool = previous;
    await db.close();
  }
}

test("suppression stores only SHA-256 hashes of a trimmed email and an E.164 phone", async () => {
  await withDatabase(async (db) => {
    const stored = await addEnhancedConversionSuppression({ email: "  Ada@Example.com ", phone: "1 (208) 555-1212" });
    assert.deepEqual(stored, [
      { kind: "email", hash: sha("ada@example.com") },
      { kind: "phone", hash: sha("+12085551212") },
    ]);
    const rows = (await db.query("SELECT kind, value_hash FROM enhanced_conversion_suppressions ORDER BY kind")).rows;
    assert.deepEqual(rows, [
      { kind: "email", value_hash: sha("ada@example.com") },
      { kind: "phone", value_hash: sha("+12085551212") },
    ]);
    const raw = JSON.stringify(rows);
    assert.equal(raw.includes("Ada@Example.com"), false);
    assert.equal(raw.includes("ada@example.com"), false);
    assert.equal(raw.includes("2085551212"), false);
    assert.equal(suppressionHashes({ phone: "555-1212" }).length, 0);
    assert.equal(sha256Hex("ada@example.com"), sha("ada@example.com"));
  });
});

test("a matching email or phone hash blocks enhanced data and leaves everyone else allowed", async () => {
  await withDatabase(async () => {
    await addEnhancedConversionSuppression({ email: "ada@example.com" });
    assert.equal(await allowEnhancedConversions({ email: " Ada@Example.com ", phone: "2085559999" }), false);
    await addEnhancedConversionSuppression({ phone: "2085551212" });
    assert.equal(await allowEnhancedConversions({ email: "other@example.com", phone: "(208) 555-1212" }), false);
    assert.equal(await allowEnhancedConversions({ email: "other@example.com", phone: "2085550000" }), true);
    assert.equal(await allowEnhancedConversions({}), true);
  });
});

test("a suppressed contact skips user_data and still fires the conversion", () => {
  const calls: unknown[][] = [];
  const previousWindow = globalThis.window;
  const previousDocument = globalThis.document;
  Object.assign(globalThis, {
    window: { gtag: (...args: unknown[]) => calls.push(args), location: { pathname: "/" }, sessionStorage: { getItem: () => null, setItem: () => undefined } },
    document: { cookie: "p5_allow_enhanced=0" },
  });
  try {
    assert.equal(trackGoogleAdsLeadConversion({
      email: "ada@example.com",
      phone: "2085551212",
      name: "Ada Lovelace",
      service: "handyman",
      allowEnhancedConversions: false,
    }, "estimator:suppressed"), true);
    assert.equal(calls.some((call) => call[0] === "set"), false);
    assert.deepEqual(calls[0], ["event", "conversion", { send_to: "AW-18354188204/LE2vCPXstO8cEKzf-q9E", value: 50, currency: "USD", transaction_id: "estimator:suppressed" }]);
    calls.length = 0;
    assert.equal(trackGoogleAdsLeadConversion({
      email: "ada@example.com",
      name: "Ada Lovelace",
      service: "handyman",
    }, "estimator:cookie-block"), true);
    assert.equal(calls.some((call) => call[0] === "set"), false);
    assert.equal((calls[0] as [string, string])[1], "conversion");
  } finally {
    if (previousWindow === undefined) delete (globalThis as { window?: unknown }).window;
    else Object.assign(globalThis, { window: previousWindow });
    if (previousDocument === undefined) delete (globalThis as { document?: unknown }).document;
    else Object.assign(globalThis, { document: previousDocument });
  }
});

test("the lead response keeps its result and adds the server decision", async () => {
  await withDatabase(async () => {
    await addEnhancedConversionSuppression({ email: "ada@example.com" });
    const lead = { accepted: true, duplicate: false, id: "draft-1", result: { total: 50 }, document: { customer: { email: "ada@example.com", phone: "2085551212" } } };
    const response = await responseWithEnhancedDecision(Response.json(lead), { email: "ada@example.com", phone: "2085551212" });
    const body = await response.json();
    assert.equal(body.accepted, true);
    assert.equal(body.duplicate, false);
    assert.equal(body.id, "draft-1");
    assert.deepEqual(body.result, { total: 50 });
    assert.equal(body.document.customer.email, "ada@example.com");
    assert.equal(body.allowEnhancedConversions, false);
    assert.match(response.headers.get("set-cookie") || "", /p5_allow_enhanced=0/);
  });
});

test("the suppression table migration is additive and the shared estimator is unchanged", () => {
  const sql = readFileSync(new URL("../migrations/0003_enhanced_conversion_suppressions.sql", import.meta.url), "utf8");
  assert.doesNotThrow(() => assertAdditiveSql(sql, "0003"));
  assert.match(sql, /value_hash/);
  assert.equal(sql.includes("email varchar"), false);
  const estimator = readFileSync(new URL("../components/P5Estimator.tsx", import.meta.url), "utf8");
  assert.equal(estimator.includes("allowEnhancedConversions"), false);
  const consultation = readFileSync(new URL("../app/api/consultation/route.ts", import.meta.url), "utf8");
  assert.match(consultation, /allowEnhancedConversions: allowUserData/);
  const privacy = readFileSync(new URL("../app/privacy-policy/page.tsx", import.meta.url), "utf8");
  assert.equal(privacy.includes("opt out of enhanced"), false);
  assert.equal(privacy.includes("suppression list"), false);
});
