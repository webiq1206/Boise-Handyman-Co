/**
 * Execute the actual estimate POST handler with isolated delivery boundaries.
 * No database, email provider, or CRM is contacted, even if secrets are set.
 * A confirmation requires a business receipt; a customer email alone is not one.
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
  db: "absent" | "saved" | "throws";
  dashboard: boolean;
  transport?: "noop" | "throws";
  admin: MailOutcome;
  customer: MailOutcome;
  status: number;
  customerAccepted?: boolean;
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
  estimate: { ...input, priceLow: estimate.priceLow, priceHigh: estimate.priceHigh, laborHours: estimate.laborHours },
};

const scenarios: Scenario[] = [
  { name: "unconfigured delivery cannot confirm", db: "absent", dashboard: false, transport: "noop", admin: "accepted", customer: "accepted", status: 503 },
  { name: "all destinations reject", db: "throws", dashboard: false, admin: "rejected", customer: "accepted", status: 503 },
  { name: "admin network exception", db: "absent", dashboard: false, admin: "throws", customer: "accepted", status: 503 },
  { name: "empty provider response is not a receipt", db: "absent", dashboard: false, admin: "empty", customer: "accepted", status: 503 },
  { name: "database receipt survives unavailable mail", db: "saved", dashboard: false, transport: "throws", admin: "rejected", customer: "rejected", status: 200, customerAccepted: false },
  { name: "database receipt with development transport", db: "saved", dashboard: false, transport: "noop", admin: "accepted", customer: "accepted", status: 200, customerAccepted: false },
  { name: "CRM receipt survives unavailable mail", db: "throws", dashboard: true, transport: "throws", admin: "rejected", customer: "rejected", status: 200, customerAccepted: false },
  { name: "admin email alone retains the lead", db: "absent", dashboard: false, admin: "accepted", customer: "rejected", status: 200, customerAccepted: false },
  { name: "customer network failure does not lose a saved lead", db: "saved", dashboard: false, admin: "accepted", customer: "throws", status: 200, customerAccepted: false },
  { name: "customer acceptance is reported separately", db: "absent", dashboard: false, admin: "accepted", customer: "accepted", status: 200, customerAccepted: true },
  { name: "CRM receipt permits the customer copy after admin exception", db: "absent", dashboard: true, admin: "throws", customer: "accepted", status: 200, customerAccepted: true },
  { name: "database receipt permits the customer copy after admin rejection", db: "saved", dashboard: false, admin: "rejected", customer: "accepted", status: 200, customerAccepted: true },
];

async function main() {
  const routePath = path.resolve("app/api/estimate-lead/route.ts");
  const requireFromRoute = createRequire(routePath);
  const compiled = ts.transpileModule(readFileSync(routePath, "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText;

  for (const scenario of scenarios) {
    const mailCalls: string[] = [];
    const savedRows: Record<string, unknown>[] = [];
    let dashboardCalls = 0;
    const mockRequire = (id: string) => {
      if (id === "@/lib/db") return {
        db: scenario.db === "absent" ? null : {
          insert: () => ({ values: async (row: Record<string, unknown>) => {
            if (scenario.db === "throws") throw new Error("simulated database failure");
            savedRows.push(row);
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
        method: "POST", body: JSON.stringify(payload), headers: { "Content-Type": "application/json" },
      }));
    } finally {
      console.error = oldError;
    }
    const body = await response.json();
    assert.equal(response.status, scenario.status, scenario.name);
    assert.equal(dashboardCalls, 1, `${scenario.name}: forward exactly once`);
    if (scenario.status === 503) {
      assert.notEqual(body.success, true, scenario.name);
      assert.ok(body.message, `${scenario.name}: actionable error`);
      assert.ok(!mailCalls.includes(payload.email), `${scenario.name}: do not quote an unreceived request`);
    } else {
      assert.equal(body.success, true, scenario.name);
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
