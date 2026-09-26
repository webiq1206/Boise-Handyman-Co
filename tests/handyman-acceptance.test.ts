import test from "node:test";
import assert from "node:assert/strict";
import { customerPdf, administrativePdf } from "../lib/p5/pdf.ts";
import { pdfTextLayers } from "../lib/p5/pdfText.ts";
import { estimateEmail } from "../lib/p5/estimateEmail.ts";
import { estimateSections } from "../lib/p5/presentation.ts";
import {customerEstimate} from "../lib/p5/pricing.ts";
import { catalogResolution, marketResolution } from "../lib/p5/scopePricing.ts";
import { createPlanningConfiguration, PLANNING_MODEL_VERSION, type PlanningCatalog } from "../lib/p5/planningBooks.ts";

const date = "2026-09-11T00:00:00.000Z";
const catalog: PlanningCatalog = {
  version: PLANNING_MODEL_VERSION, source: "Handyman acceptance fixture", authorizedBy: "Test only",
  importedAt: date,
  rates: ["03-17-01-M", "03-17-01-L", "03-15-02-M", "03-15-02-L", "03-16-01-M", "03-16-01-L",
    "03-14-01-M", "03-14-01-L", "03-04-01", "03-04-02", "03-04-03", "03-05-02-M", "03-05-02-L",
    "REF-GENERAL-HOUR", "REF-PLUMBING-HOUR", "REF-ELECTRICAL-HOUR",
    "03-18-02-M", "03-18-02-L", "03-19-04-M", "03-19-04-L"].map(code => ({
      code, description: code === "03-18-02-M" ? "Trim material" : code === "03-18-02-L" ? "Trim installation labor" : code.startsWith("03-19-04") ? "Door hardware" : "Fixture rate",
      type: code.endsWith("-M") ? "Material" as const : "Labor" as const,
      unit: code.includes("HOUR") ? "HR" as const : code.startsWith("03-19-04") ? "EA" as const : "LF" as const,
      amount: code === "03-18-02-M" ? 2 : code === "03-18-02-L" ? 5 : 60,
      source: "Fixture", basis: "owner-average-cost" as const,
    })),
};
const config = createPlanningConfiguration(catalog);
const scope = {
  text: "Repair 3 door hinges and install 20 LF owner-supplied trim. No painting.",
  answers: { service: "handyman", taskList: "Repair 3 door hinges; install 20 LF trim", trimLf: "20", exclusions: "No painting" },
  extraction: null, uploads: [], reviewedAt: date, corrections: [],
} as any;
const task = (description: string, evidence: string, additions: any[]) => ({
  id: description.toLowerCase().replaceAll(" ", "-"), description, evidence,
  existingLineIds: [], additions, researchDescription: "", issues: [],
});

test("customer API projection removes adversarial direct-cost wording without changing selling totals or allowance disclosure",()=>{
  const result=customerEstimate({
    publishable:true,planningRange:{low:300,high:400},contingencyRate:0,divisor:.5,
    lines:[{id:"trim",description:"Install 20 LF trim $2.00/LF ($200.00 direct cost)",quantity:20,unit:"LF",cost:200,unitCost:10,category:"field-labor",evidence:{basis:"owner-estimating-schedule"},allowance:true}],
    allowances:[],assumptions:[
      "Labor direct cost is $200. Preliminary allowance; verify quantity.",
      "$2/LF direct cost. Direct costs: $200. direct-cost: $200. our direct cost was $200.",
      "Preliminary allowance $500; our direct cost was $200.",
      "Preliminary allowance $500; our direct cost after freight, handling, supplier coordination, mobilization, disposal, supervision, insurance and labor burden was $200.",
    ],exclusions:["Painting excluded"],riskFactors:[],contractMethod:"Confirm scope",
  } as any,"Direct project cost: $200. Install 20 LF trim.");
  const serialized=JSON.stringify(result);
  assert.doesNotMatch(serialized,/direct (?:project )?cost/i);
  assert.deepEqual(result.range,{low:300,high:400});
  assert.equal(result.lineItems[0].quantity,20);
  assert.match(result.assumptions[0],/Preliminary allowance/);
  assert.match(result.assumptions[2],/\$500/);
});

test("Handyman customer/admin delivery keeps direct cost confidential and ranges identical", async () => {
  const customer = {
    status: "complete", range: { low: 300, high: 400 },
    summary: "Repair 3 door hinges; install 20 LF owner-supplied trim.",
    message: "Preliminary planning information only.",
    includedCategories: ["Handyman"], categoryRanges: [{ category: "Handyman", low: 300, high: 400 }],
    lineItems: [
      { id: "hinges", category: "Handyman", description: "Repair door hinges", quantity: 3, unit: "EA", low: 120, high: 160, unitLow: 40, unitHigh: 53.33 },
      { id: "trim", category: "Handyman", description: "Install owner-supplied trim $2.00/LF ($200.00 direct cost)", quantity: 20, unit: "LF", low: 180, high: 240, unitLow: 9, unitHigh: 12 },
    ],
    assumptions: ["Labor direct cost is $200. Direct project cost: $200."], exclusions: ["Trim material supplied by owner", "Painting excluded"], factors: [],
    allowances: [], nextStep: "Confirm the appointment", disclaimer: "Not a bid, quote, offer or guaranteed price.",
  };
  const internal = {
    publishable: true, planningRange: customer.range, directCost: 200, riskAdjustedDirectCost: 200,
    contingency: 0, contingencyRate: 0, contractPrice: 400, operatingProfit: 80, targetOperatingProfit: .2,
    divisor: .5, allocationDollars: { overhead: 120 }, lines: [
      { id: "trim-cost", trade: "Trim", description: "Owner-supplied trim labor", quantity: 20, unit: "LF", unitCost: 2, cost: 40, quantitySource: "Fixture", evidence: { basis: "fixture" } },
    ],
  };
  const record = { customer, internal, contact: { name: "Fixture customer", email: "fixture@example.invalid" } };
  const presentation = estimateSections(customer as any);
  const customerEmail = estimateEmail("handyman-fixture", record, false);
  const adminEmail = estimateEmail("handyman-fixture", record, true);
  const leak = "$2.00/LF ($200.00 direct cost)";
  assert.deepEqual(customer.lineItems.map(item => [item.quantity, item.unit]), [[3, "EA"], [20, "LF"]]);
  assert.ok(presentation.some(section => section.kind === "excluded" && section.bullets?.some(item => /material supplied by owner|painting excluded/i.test(item))));
  assert.ok(!JSON.stringify(presentation).includes(leak));
  assert.ok(!JSON.stringify(customerEmail).includes(leak));
  assert.ok(!customerEmail.text.includes("$200.00 direct cost"));
  assert.doesNotMatch(JSON.stringify(estimateSections(customer as any)),/direct (?:project )?cost/i);
  assert.match(adminEmail.text, /Direct project cost: \$200/);
  assert.match(adminEmail.html, /Direct project cost/);

  const customerText = (await pdfTextLayers(await customerPdf("handyman-fixture", customer as any))).join("\n");
  const adminText = (await pdfTextLayers(await administrativePdf("handyman-fixture", {...internal,customer}))).join("\n");
  assert.ok(!customerText.includes(leak));
  assert.ok(!customerText.includes("direct cost"));
  assert.match(adminText, /Direct project cost/);
  assert.match(adminText, /Direct project cost \$200(?:\.00)?\b/);
  assert.match(customerText, /\$300 to \$400/);
  assert.match(adminText, /\$300 to \$400/);
  assert.match(customerText, /20 LF/);
  assert.match(customerText, /Install owner-supplied trim/);
  assert.deepEqual(customer.range, internal.planningRange);
});

test("Handyman scope preserves hinge and owner-supplied trim quantities, exclusions, and normal supplied materials", () => {
  const owner = catalogResolution({
    tasks: [task("Hinge repairs", "3 hinges", [{ code: "03-19-04-L", quantity: 3, quantityEvidence: "3 hinge repairs" }]),
      task("Owner trim installation", "20 LF owner-supplied trim", [{ code: "03-18-02-L", quantity: 20, quantityEvidence: "20 LF installed" }])],
    issues: [], notes: [], replacements: [], removeExclusions: [],
  } as any, config, [], new Date(date), scope);
  assert.deepEqual(owner.rules.map(rule => rule.quantity.fixed), [3, 20]);
  assert.equal(owner.issues.length, 0);
  assert.match(scope.text, /3 door hinges/);
  assert.match(scope.text, /20 LF owner-supplied trim/);
  assert.match(scope.answers.exclusions, /No painting/);

  const supplied = catalogResolution({
    tasks: [task("Contractor-supplied trim", "20 LF contractor supplies material and labor", [
       { code: "03-18-02-M", quantity: 20, quantityEvidence: "20 LF material" },
       { code: "03-18-02-L", quantity: 20, quantityEvidence: "20 LF installation labor" },
    ])], issues: [], notes: [], replacements: [], removeExclusions: [],
  } as any, config, [], new Date(date), { ...scope, text: "Contractor supplies and installs 20 LF trim.", answers: { ...scope.answers, ownerSupplied: "" } });
  assert.deepEqual(supplied.rules.map(rule => rule.quantity.fixed), [20, 20]);
  assert.equal(supplied.issues.length, 0);
});

test("Mutually exclusive alternates are not billable together, and incompatible units block", () => {
  const alternate = catalogResolution({
    tasks: [
      task("Selected trim package", "Selected option; 20 LF", [{ code: "03-18-02-M", quantity: 20, quantityEvidence: "20 LF selected option" }]),
      task("Optional alternate trim package", "Alternate not selected; 20 LF", [{ code: "03-18-02-M", quantity: 20, quantityEvidence: "20 LF alternate" }]),
    ], issues: [], notes: [], replacements: [], removeExclusions: [],
  } as any, config, [], new Date(date), scope);
  assert.equal(alternate.rules.length, 1);
  assert.ok([...alternate.issues, ...alternate.assumptions].some(note => /not billable|ambiguous or conflicting/i.test(note)));

  const researched: any = {
    rates: [{ taskId: "trim", description: "Trim", unit: "LF", quantity: 20, quantityEvidence: "20 LF", basis: "material-purchase",
      includes: "trim", excludes: "", landedCost: null,
      sources: [
        { url: "https://fixture-a.invalid", low: 2, high: 2, unit: "LF", costBasis: "material-purchase", sourceType: "regional-guide", dateBasis: "published", publishedAt: date, region: "Idaho", excerpt: "fixture" },
        { url: "https://fixture-b.invalid", low: 2, high: 2, unit: "LF", costBasis: "material-purchase", sourceType: "regional-guide", dateBasis: "published", publishedAt: date, region: "Idaho", excerpt: "fixture" },
      ] }],
    issues: [],
  };
  assert.throws(() => marketResolution({ ...researched, rates: [{ ...researched.rates[0], sources: researched.rates[0].sources.map((source: any) => ({ ...source, unit: "HR" })) }] }, ["https://fixture-a.invalid", "https://fixture-b.invalid"], [{ id: "trim", description: "Trim", researchDescription: "Trim material", evidence: "20 LF" }], new Date(date)), /Incompatible benchmark unit or cost basis/);
});