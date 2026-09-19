import test from "node:test";
import assert from "node:assert/strict";
import { buildCrmPayload, syncCrm } from "../lib/p5/deliveryAdapter.ts";

const envKeys = ["LEAD_DASHBOARD_KEY", "LEAD_DASHBOARD_API_URL"] as const;

function withCrmEnv<T>(fn: () => Promise<T>): Promise<T> {
  const saved = Object.fromEntries(envKeys.map((key) => [key, process.env[key]]));
  process.env.LEAD_DASHBOARD_KEY = "test-crm-token";
  process.env.LEAD_DASHBOARD_API_URL = "https://crm.test/leads";
  return fn().finally(() => {
    for (const key of envKeys) {
      if (saved[key] === undefined) delete process.env[key];
      else process.env[key] = saved[key];
    }
  });
}

function record(overrides: Record<string, unknown> = {}) {
  return {
    draftId: "draft-123",
    revision: 7,
    contact: {
      name: "A very helpful customer",
      email: "customer@example.com",
      phone: "208-555-0100",
    },
    scope: {
      text: "Kitchen remodel in Boise",
      reviewedAt: "2025-01-01T00:00:00.000Z",
      answers: {
        address: "123 Main Street",
        location: "Boise",
        service: "kitchen",
      },
    },
    internal: {
      confidential: true,
      staffNote: "Do not disclose this administrative note",
      cost: 1200,
    },
    customer: {
      status: "complete",
      summary: "Replace cabinets and counters",
      range: { low: 10000, high: 15000 },
      lineItems: [{ description: "Cabinets", amount: 10000 }],
      assumptions: ["Existing plumbing remains"],
      exclusions: ["Appliances"],
      disclaimer: "Planning estimate only",
    },
    ...overrides,
  };
}

test("buildCrmPayload applies receiver field limits without mutating confidential admin data", () => {
  const input = record({
    contact: {
      name: "名".repeat(400),
      email: "e".repeat(400),
      phone: "p".repeat(100),
    },
    scope: {
      text: "scope",
      reviewedAt: "2025-01-01",
      answers: {
        address: "a".repeat(700),
        location: "l".repeat(200),
        service: "kitchen",
      },
    },
    customer: {
      status: "complete",
      summary: "s".repeat(2500),
      range: { low: 10000, high: 15000 },
    },
  });
  const before = structuredClone(input);
  const payload = buildCrmPayload(input, "lead-key");

  assert.ok(payload.fullName.length <= 255);
  assert.ok(payload.email.length <= 255);
  assert.ok(payload.phone.length <= 50);
  assert.ok(payload.source.length <= 100);
  assert.ok(payload.propertyAddress.length <= 500);
  assert.ok(payload.city.length <= 100);
  assert.ok(payload.projectScope.length <= 1990);
  assert.ok(payload.estimateSummary.length <= 19900);
  assert.ok(payload.estimateRange.length <= 95);
  assert.deepEqual(input, before, "payload construction must not alter the admin record");
  assert.equal(payload.externalLeadId, "lead-key");
  assert.equal(payload.inquiryId, "draft-123");
});

test("buildCrmPayload keeps UTF-8 request body under the 90 KiB budget", () => {
  const payload = buildCrmPayload(
    record({
      scope: {
        text: "🧰".repeat(100_000),
        reviewedAt: "2025-01-01",
        answers: { address: "🏠".repeat(1000), location: "Boise", service: "kitchen" },
      },
      internal: { privateMemo: "🔒".repeat(100_000) },
      customer: { summary: "é".repeat(100_000), range: { low: 1, high: 2 },lineItems:Array.from({length:5000},()=>({description:"🔧".repeat(100)})),assumptions:["a".repeat(200_000)],exclusions:["x".repeat(200_000)] },
      extra:"ignored",
    }),
    "utf8-lead",
  );
  assert.ok(Buffer.byteLength(JSON.stringify(payload), "utf8") < 90 * 1024);
});

test("syncCrm sends deterministic identifiers and accepts a provider id", async () => {
  await withCrmEnv(async () => {
    const originalFetch = globalThis.fetch;
    let request: { url: string; init?: RequestInit } | undefined;
    globalThis.fetch = (async (url, init) => {
      request = { url: String(url), init };
      return Response.json({ accepted: true, leadId: "provider-42" }, { status: 201 });
    }) as typeof fetch;
    try {
      assert.equal(await syncCrm(record(), "p5-deterministic-key"), "provider-42");
      assert.equal(request?.url, "https://crm.test/leads");
      assert.equal(request?.init?.headers && (request.init.headers as Record<string, string>)["Idempotency-Key"], "p5-deterministic-key");
      assert.equal((request?.init?.headers as Record<string, string>)?.Authorization, "Bearer test-crm-token");
      const body = JSON.parse(String(request?.init?.body));
      assert.equal(body.externalLeadId, "p5-deterministic-key");
      assert.equal(body.inquiryId, "draft-123");
    } finally {
      globalThis.fetch = originalFetch;
    }
  });
});

test("syncCrm accepts a duplicate lead response", async () => {
  await withCrmEnv(async () => {
    const originalFetch = globalThis.fetch;
    globalThis.fetch = (async () => Response.json({ error:"Duplicate submission",leadId: "existing-lead" }, { status: 409 })) as typeof fetch;
    try {
      assert.equal(await syncCrm(record(), "duplicate-key"), "existing-lead");
      globalThis.fetch = (async () => Response.json({ leadId: "unrelated-conflict" }, { status: 409 })) as typeof fetch;
      await assert.rejects(syncCrm(record(),"conflict"),/HTTP 409/);
    } finally {
      globalThis.fetch = originalFetch;
    }
  });
});

test("syncCrm rejects malformed, identifier-less, and timed-out responses", async () => {
  await withCrmEnv(async () => {
    const originalFetch = globalThis.fetch;
    try {
      globalThis.fetch = (async () => new Response("not-json", { status: 201 })) as typeof fetch;
      await assert.rejects(syncCrm(record(), "malformed"), /acknowledged without a record identifier/);

      globalThis.fetch = (async () => Response.json({ accepted: true }, { status: 201 })) as typeof fetch;
      await assert.rejects(syncCrm(record(), "no-id"), /acknowledged without a record identifier/);

      globalThis.fetch = (async () => {
        throw new DOMException("The operation timed out", "TimeoutError");
      }) as typeof fetch;
      await assert.rejects(syncCrm(record(), "timeout"), /timed out|timeout/i);
    } finally {
      globalThis.fetch = originalFetch;
    }
  });
});