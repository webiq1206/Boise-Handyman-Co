import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import test from "node:test";
import { PGlite } from "@electric-sql/pglite";
import { trackGoogleAdsLeadConversion } from "../lib/googleAdsConversion.ts";
import { assertAdditiveSql } from "../scripts/p5-schema-safety.mjs";
import { decorateEstimatorLead } from "../server/services/enhancedConversionLead.ts";
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

test("a suppression lookup error skips user_data and a missing contact stays allowed", async () => {
  const previous = (globalThis as { __p5Pool?: unknown }).__p5Pool;
  (globalThis as { __p5Pool?: { query: () => Promise<never> } }).__p5Pool = {
    query: async () => {
      throw new Error("db down");
    },
  };
  clearEnhancedConversionSuppressionReady();
  try {
    assert.equal(await allowEnhancedConversions({ email: "ada@example.com" }), false);
    assert.equal(await allowEnhancedConversions({}), true);
  } finally {
    clearEnhancedConversionSuppressionReady();
    if (previous === undefined) delete (globalThis as { __p5Pool?: unknown }).__p5Pool;
    else (globalThis as { __p5Pool?: unknown }).__p5Pool = previous;
  }
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
      acceptedLead: true,
    }, "estimator:suppressed"), true);
    assert.equal(calls.some((call) => call[0] === "set"), false);
    assert.deepEqual(calls[0], ["event", "conversion", { send_to: "AW-18354188204/cEzmCPOagKAdEKzf-q9E", transaction_id: "estimator:suppressed" }]);
    assert.deepEqual(calls[1], ["event", "conversion", { send_to: "AW-18354188204/LE2vCPXstO8cEKzf-q9E", value: 50, currency: "USD", transaction_id: "estimator:suppressed" }]);
    assert.equal(Object.hasOwn(calls[0][2] as object, "user_data"), false);
    assert.equal(Object.hasOwn(calls[1][2] as object, "user_data"), false);
    calls.length = 0;
    assert.equal(trackGoogleAdsLeadConversion({
      email: "ada@example.com",
      name: "Ada Lovelace",
      service: "handyman",
      acceptedLead: true,
    }, "estimator:cookie-block"), true);
    assert.equal(calls.some((call) => call[0] === "set"), false);
    assert.equal(calls.length, 2);
    assert.equal(Object.hasOwn(calls[0][2] as object, "user_data"), false);
    assert.equal(Object.hasOwn(calls[1][2] as object, "user_data"), false);
    calls.length = 0;
    assert.equal(trackGoogleAdsLeadConversion({
      email: "ada@example.com",
      name: "Ada Lovelace",
      allowEnhancedConversions: true,
    }, "form:allowed"), true);
    assert.equal(calls.some((call) => call[0] === "set"), false);
    const allowed = calls[0] as [string, string, { send_to?: string; user_data?: { email?: string } }];
    assert.equal(allowed[2].send_to, "AW-18354188204/LE2vCPXstO8cEKzf-q9E");
    assert.equal(allowed[2].user_data?.email, "ada@example.com");
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

test("a pending submit is unchanged and a suppressed customer keeps the lead", async () => {
  const pending = Response.json({ pending: true }, { status: 202 });
  const untouched = await decorateEstimatorLead(new Request("https://boisehandyman.co/api/p5-estimator/submit", { method: "POST" }), pending);
  assert.equal(untouched, pending);
  await withDatabase(async () => {
    await addEnhancedConversionSuppression({ email: "ada@example.com" });
    const lead = { accepted: true, duplicate: false, id: "draft-1", result: { total: 50 }, document: { customer: { email: "Ada@Example.com", phone: "2085550000" } } };
    const response = await decorateEstimatorLead(new Request("https://boisehandyman.co/api/p5-estimator/submit", { method: "POST" }), Response.json(lead));
    const body = await response.json();
    assert.equal(body.accepted, true);
    assert.equal(body.id, "draft-1");
    assert.deepEqual(body.result, { total: 50 });
    assert.equal(body.document.customer.email, "Ada@Example.com");
    assert.equal(body.allowEnhancedConversions, false);
    assert.match(response.headers.get("set-cookie") || "", /p5_allow_enhanced=0/);
    const intake = await decorateEstimatorLead(
      new Request("https://boisehandyman.co/api/p5-estimator/intake", { method: "POST" }),
      Response.json({ accepted: true, projectId: "intake-1" }),
    );
    const intakeBody = await intake.json();
    assert.equal(intakeBody.accepted, true);
    assert.equal(intakeBody.projectId, "intake-1");
    assert.equal(intakeBody.allowEnhancedConversions, true);
  });
});

test("the suppression table migration is additive and the shared estimator is unchanged", () => {
  const sql = readFileSync(new URL("../migrations/0003_enhanced_conversion_suppressions.sql", import.meta.url), "utf8");
  assert.doesNotThrow(() => assertAdditiveSql(sql, "0003"));
  assert.match(sql, /value_hash/);
  assert.equal(sql.includes("email varchar"), false);
  const estimator = readFileSync(new URL("../components/P5Estimator.tsx", import.meta.url), "utf8");
  assert.equal(estimator.includes("allowEnhancedConversions"), false);
  const submitRoute = readFileSync(new URL("../app/api/p5-estimator/submit/route.ts", import.meta.url), "utf8");
  const intakeRoute = readFileSync(new URL("../app/api/p5-estimator/intake/route.ts", import.meta.url), "utf8");
  assert.equal(submitRoute.includes("allowEnhancedConversions"), false);
  assert.equal(intakeRoute.includes("allowEnhancedConversions"), false);
  const manifest = JSON.parse(readFileSync(new URL("../lib/p5/shared-manifest.json", import.meta.url), "utf8")) as { files: Record<string, string> };
  const hash = (file: string) => createHash("sha256").update(readFileSync(new URL("../" + file, import.meta.url), "utf8").replace(/\r\n/g, "\n")).digest("hex");
  assert.equal(hash("app/api/p5-estimator/submit/route.ts"), manifest.files["app/api/p5-estimator/submit/route.ts"]);
  assert.equal(hash("app/api/p5-estimator/intake/route.ts"), manifest.files["app/api/p5-estimator/intake/route.ts"]);
  const config = readFileSync(new URL("../next.config.js", import.meta.url), "utf8");
  assert.match(config, /beforeFiles/);
  assert.match(config, /source: '\/api\/p5-estimator\/submit', destination: '\/api\/p5-estimator\/enhanced-submit'/);
  assert.match(config, /source: '\/api\/p5-estimator\/intake', destination: '\/api\/p5-estimator\/enhanced-intake'/);
  const enhancedSubmit = readFileSync(new URL("../app/api/p5-estimator/enhanced-submit/route.ts", import.meta.url), "utf8");
  const enhancedIntake = readFileSync(new URL("../app/api/p5-estimator/enhanced-intake/route.ts", import.meta.url), "utf8");
  assert.match(enhancedSubmit, /postSubmission/);
  assert.match(enhancedSubmit, /decorateEstimatorLead/);
  assert.match(enhancedSubmit, /maxDuration=300/);
  assert.match(enhancedIntake, /postIntake/);
  assert.match(enhancedIntake, /decorateEstimatorLead/);
  assert.match(readFileSync(new URL("../server/services/enhancedConversionLead.ts", import.meta.url), "utf8"), /readDraft/);
  const consultation = readFileSync(new URL("../app/api/consultation/route.ts", import.meta.url), "utf8");
  assert.match(consultation, /allowEnhancedConversions: allowUserData/);
  const privacy = readFileSync(new URL("../app/privacy-policy/page.tsx", import.meta.url), "utf8");
  assert.equal(privacy.includes("opt out of enhanced"), false);
  assert.equal(privacy.includes("suppression list"), false);
});
