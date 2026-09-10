/**
 * Execute the actual estimate POST handler with isolated delivery boundaries.
 * No database, email provider, or CRM is contacted, even if secrets are set.
 * A new acceptance requires a saved inquiry and lead; delivery cannot bypass it.
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";
import ts from "typescript";
import { NextRequest } from "next/server";
import { calculateHandymanEstimate, type HandymanEstimateInput } from "../shared/estimateEngine";

type MailOutcome = "accepted" | "rejected" | "throws" | "empty";
type Scenario = {
  name: string;
  db: "absent" | "saved" | "throws" | "duplicate";
  dashboard: boolean;
  transport?: "noop" | "throws";
  admin: MailOutcome;
  customer: MailOutcome;
  status: number;
  customerAccepted?: boolean;
  duplicate?: boolean;
};

const input: HandymanEstimateInput = {
  category: "drywall-repair",
  tasks: [{ taskId: "drywall-small-patch", quantity: 1 }],
  otherJob: null,
  materials: "customer",
  urgency: "standard",
};
const estimate = calculateHandymanEstimate(input)!;
const payload = {
  name: "Delivery Test",
  email: "delivery-test@example.com",
  city: "Boise",
  inquiryId: "00000000-0000-4000-8000-000000000001",
  estimate: { ...input, priceLow: estimate.priceLow, priceHigh: estimate.priceHigh, laborHours: estimate.laborHours },
};

const scenarios: Scenario[] = [
  { name: "unconfigured persistence cannot confirm", db: "absent", dashboard: false, transport: "noop", admin: "accepted", customer: "accepted", status: 503 },
  { name: "database failure cannot use CRM as an acceptance fallback", db: "throws", dashboard: true, admin: "accepted", customer: "accepted", status: 503 },
  { name: "email cannot substitute for durable persistence", db: "absent", dashboard: false, admin: "accepted", customer: "accepted", status: 503 },
  { name: "duplicate does not redeliver or count again", db: "duplicate", dashboard: true, admin: "accepted", customer: "accepted", status: 200, duplicate: true },
  { name: "saved lead survives unavailable transport", db: "saved", dashboard: false, transport: "throws", admin: "rejected", customer: "rejected", status: 200, customerAccepted: false },
  { name: "development transport is not email acceptance", db: "saved", dashboard: false, transport: "noop", admin: "accepted", customer: "accepted", status: 200, customerAccepted: false },
  { name: "saved lead survives customer rejection", db: "saved", dashboard: false, admin: "accepted", customer: "rejected", status: 200, customerAccepted: false },
  { name: "saved lead survives customer exception", db: "saved", dashboard: false, admin: "accepted", customer: "throws", status: 200, customerAccepted: false },
  { name: "empty email response is not acceptance", db: "saved", dashboard: false, admin: "accepted", customer: "empty", status: 200, customerAccepted: false },
  { name: "customer acceptance is reported separately", db: "saved", dashboard: false, admin: "accepted", customer: "accepted", status: 200, customerAccepted: true },
  { name: "admin rejection does not stop customer copy", db: "saved", dashboard: false, admin: "rejected", customer: "accepted", status: 200, customerAccepted: true },
  { name: "admin exception does not stop customer copy", db: "saved", dashboard: true, admin: "throws", customer: "accepted", status: 200, customerAccepted: true },
  { name: "empty admin response does not lose saved lead", db: "saved", dashboard: false, admin: "empty", customer: "accepted", status: 200, customerAccepted: true },
];

// The real acceptance service uses this test-only secret with an isolated HTTP-driver fixture.
process.env.LEAD_FINGERPRINT_SECRET = "isolated-delivery-test-secret";

async function main() {
  const routePath = path.resolve("app/api/estimate-lead/route.ts");
  const requireFromRoute = createRequire(routePath);
  const compiled = ts.transpileModule(readFileSync(routePath, "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText;

  for (const [index, scenario] of scenarios.entries()) {
    const mailCalls: string[] = [];
    const savedRows: Record<string, unknown>[] = [];
    let dashboardCalls = 0;
    const mockRequire = (id: string) => {
      if (id === "@/lib/db") return {
        db: scenario.db === "absent" ? null : {
          execute: async () => ({}),
          delete: () => ({ where: async () => ({}) }),
            insert: () => ({ values: (row: Record<string, unknown>) => {
              if (row.duplicateKey) return {
                onConflictDoNothing: () => ({ returning: async () => scenario.db === "duplicate" ? [] : [{ id: payload.inquiryId }] }),
              };
              if (scenario.db === "throws") throw new Error("simulated database failure");
              savedRows.push(row);
              return Promise.resolve();
            } }),
        },
      };
      if (id === "@/server/services/leadDashboardForward") return {
        forwardToLeadDashboard: async () => { dashboardCalls++; return scenario.dashboard; },
      };
      if (id === "@/server/services/emailTransport") return {
        getUncachableEmailClient: async () => {
          if (scenario.transport === "throws") throw new Error("simulated transport failure");
          return { fromEmail: "test@example.com", client: {
            __noop: scenario.transport === "noop",
            emails: { send: async ({ to }: { to: string }) => {
              mailCalls.push(to);
              const outcome = to === payload.email ? scenario.customer : scenario.admin;
              if (outcome === "throws") throw new Error("simulated provider failure");
              if (outcome === "rejected") return { error: { message: "rejected" }, data: null };
              if (outcome === "empty") return {};
              return { data: { id: "test-receipt" }, error: null };
            } },
          } };
        },
      };
      return requireFromRoute(id);
    };
    const route = { exports: {} as { POST: (request: NextRequest) => Promise<Response> } };
    new Function("require", "module", "exports", compiled)(mockRequire, route, route.exports);
    const oldError = console.error;
    console.error = () => {}; // Expected failures are assertions, not noisy output.
    let response: Response;
    try {
      response = await route.exports.POST(new NextRequest("http://localhost/api/estimate-lead", {
        method: "POST", body: JSON.stringify(payload), headers: { "Content-Type": "application/json", "x-forwarded-for": `192.0.2.${index + 1}` },
      }));
    } finally {
      console.error = oldError;
    }
    const body = await response.json();
    assert.equal(response.status, scenario.status, scenario.name);
    assert.equal(dashboardCalls, scenario.db === "saved" ? 1 : 0, `${scenario.name}: only forward newly saved leads`);
    if (scenario.status === 503) {
      assert.notEqual(body.success, true, scenario.name);
      assert.ok(body.message, `${scenario.name}: actionable error`);
      assert.equal(mailCalls.length, 0, `${scenario.name}: no delivery before persistence`);
    } else if (scenario.duplicate) {
      assert.equal(body.success, true, scenario.name);
      assert.equal(body.accepted, false, scenario.name);
      assert.equal(body.duplicate, true, scenario.name);
      assert.equal(body.customerEmailAccepted, undefined, scenario.name);
      assert.equal(mailCalls.length, 0, `${scenario.name}: do not redeliver`);
      assert.equal(savedRows.length, 0, `${scenario.name}: do not save again`);
    } else {
      assert.equal(body.success, true, scenario.name);
      assert.equal(body.accepted, true, scenario.name);
      assert.equal(body.duplicate, false, scenario.name);
      assert.equal(body.customerEmailAccepted, scenario.customerAccepted, scenario.name);
    }
    if (scenario.db === "saved") {
      assert.equal(savedRows.length, 1, scenario.name);
      assert.equal(savedRows[0].estimateLow, estimate.priceLow.toString(), scenario.name);
      assert.equal(savedRows[0].estimateHigh, estimate.priceHigh.toString(), scenario.name);
    }
  }
  console.log(`verify-estimate-delivery: all ${scenarios.length} delivery scenarios passed`);
}

main().catch((error) => { console.error(error); process.exitCode = 1; });
