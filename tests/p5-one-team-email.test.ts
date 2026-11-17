/**
 * One team email per request (owner decision, 17 November 2026).
 *
 * p5homeco.com sends the team's "New lead" and "Details added" emails. This
 * site's own team email is the fallback: the shared family inbox gets it only
 * when p5 did not confirm that its email went. A lead must never end with no
 * team email, so every answer except an exact "sent" sends it to everyone.
 *
 * No test here calls p5: the bridge is given a fake fetch.
 */
import test from "node:test";
import assert from "node:assert/strict";
import { EMPTY_REFINEMENTS, calculateEstimate } from "../shared/estimateEngine";
import { resolveQuotedRange } from "../shared/costs/resolve";
import {
  MAX_TEAM_NOTES,
  MAX_TEAM_NOTE_LENGTH,
  P5_BRIDGE_TIMEOUT_MS,
  buildP5IntakeBody,
  forwardConsultationToP5Intake,
  readP5TeamAlert,
  teamNoteLines,
  type P5BridgeResult,
} from "../server/services/p5IntakeBridge";
import {
  SHARED_FAMILY_INBOX_DOMAINS,
  isSharedFamilyInbox,
  scheduleTeamEmail,
  sendTeamEmailAfterBridge,
  teamEmailRecipients,
} from "../server/services/teamEmailGate";
import { buildDetailsTeamNotes, buildRequestTeamNotes } from "../server/services/consultationTeamNotes";
import type { VerifiedEstimate } from "../server/services/consultationEmail";

const SHARED = "hello@boisehandyman.co";
const OTHER = "owner@example.com";
const CONTACT = { name: "Jordan Example", phone: "(208) 555-0199", email: "jordan@example.com", inquiryId: "4b82598a-24f7-48d3-a9b6-ab5a64c44438" };

type Fetch = (url: string, init: RequestInit) => Promise<Response>;
const answering = (body: unknown, status = 200): Fetch => async () =>
  new Response(typeof body === "string" ? body : JSON.stringify(body), { status });

/**
 * A p5 that never answers; it gives up only when the bridge's own timer aborts
 * it. AbortSignal.timeout does not hold the process open by itself, so the fake
 * holds it (as an open socket would) until the abort arrives.
 */
const hanging: Fetch = (_url, init) =>
  new Promise((_resolve, reject) => {
    const open = setTimeout(() => reject(new Error("the bridge never aborted the request")), 10_000);
    init.signal?.addEventListener("abort", () => {
      clearTimeout(open);
      reject(init.signal?.reason ?? new Error("aborted"));
    });
  });

function kitchenEstimate(): VerifiedEstimate {
  const project = "kitchen" as const;
  const finish = "mid-range" as const;
  const sqft = 160;
  const guide = calculateEstimate({ project, finish, sqft, refinements: EMPTY_REFINEMENTS }, 0);
  const range = resolveQuotedRange(project, finish, sqft, EMPTY_REFINEMENTS, 0);
  return {
    project,
    finish,
    sqft,
    priceLow: (range ?? guide).priceLow,
    priceHigh: (range ?? guide).priceHigh,
    roi: guide.roi,
    confidence: guide.confidenceLabel,
    refinements: EMPTY_REFINEMENTS,
    included: guide.included,
    statedBudget: 40_000,
  };
}

/** Runs the team email against a bridge answer and reports who was emailed. */
async function deliver(bridge: Promise<P5BridgeResult> | null, recipients = [SHARED, OTHER], maxWaitMs?: number) {
  const sent: string[] = [];
  const outcome = await sendTeamEmailAfterBridge({
    label: "test",
    bridge,
    recipients: () => recipients,
    send: async (to) => {
      sent.push(to);
    },
    maxWaitMs,
  });
  return { sent, outcome };
}

/* ───────────── the bridge: what it sends */

test("the bridge asks p5 to confirm its team email, on the request and on the details", () => {
  for (const submissionKind of ["initial", "details"] as const) {
    const body = buildP5IntakeBody({ ...CONTACT, submissionKind });
    assert.equal(body.team_alert, "confirm", submissionKind);
    assert.equal(body.team_notes, undefined, "no notes, no empty list");
  }
});

test("team_notes are well formed: single `Label: value` lines, at most 40 of at most 300 characters", () => {
  const notes = buildRequestTeamNotes({
    estimate: kitchenEstimate(),
    requestId: "8d6c1f5e-2b1a-4c3d-9e8f-0a1b2c3d4e5f",
    profile: {
      county: "ada",
      parcelId: "R1234567890",
      lotSizeSqFt: 8276,
      lotSizeAcres: 0.19,
      zoning: "R-1C",
      zoningCategory: "Single family residential",
      permittingAuthority: "City of Boise",
    },
  });
  const body = buildP5IntakeBody({ ...CONTACT, teamNotes: notes });
  const sent = body.team_notes as string[];
  assert.ok(Array.isArray(sent) && sent.length > 0);
  assert.deepEqual(sent, notes, "the bridge sends the lines as built");
  assert.ok(sent.length <= MAX_TEAM_NOTES);
  for (const line of sent) {
    assert.equal(typeof line, "string");
    assert.ok(line.length <= MAX_TEAM_NOTE_LENGTH, line);
    assert.doesNotMatch(line, /[\r\n\t]/, "one line");
    assert.equal(line, line.trim());
    assert.match(line, /^[^:]{1,40}: \S/, `Label: value, got ${line}`);
    assert.doesNotMatch(line, /^(?:name|email|phone):/i, "the bridge already sends the contact");
    // No em dash, here or anywhere on the site.
    assert.equal(line.includes(String.fromCharCode(0x2014)), false);
  }
  // What this site's team email carried and the p5 body does not.
  assert.ok(sent.includes("Lead dashboard: https://leads.boisehandyman.co"));
  assert.ok(sent.some((line) => /^Site request id: 8d6c1f5e-/.test(line)));
  assert.ok(sent.some((line) => /^Planning range: \$[\d,]+ to \$[\d,]+ \(Kitchen/.test(line)));
  assert.ok(sent.some((line) => /^Stated budget: \$40,000$/.test(line)));
  assert.ok(sent.some((line) => /^Selections: .*Approx\. size: 160 sq ft/.test(line)));
  assert.ok(sent.some((line) => /^Trade price: [^:]+: \$[\d,]+/.test(line)), "the internal split by trade");
  assert.ok(sent.includes("Parcel: R1234567890"));
  assert.ok(sent.includes("Lot: 0.19 acres (8,276 sq ft)"));
  assert.ok(sent.includes("Permits: City of Boise"));
  // p5's "New lead" email is copied into HubSpot, and costs and margins stay
  // out of HubSpot: prices travel, our cost and margin do not.
  assert.doesNotMatch(
    sent.filter((line) => !line.startsWith("Cost and margin: left out")).join("\n"),
    /our cost|internal cost|direct cost|contingency|gross profit|margin|markup/i,
  );
  assert.ok(JSON.stringify(body).length < 32 * 1024, "inside the p5 intake body limit");
});

test("team notes: a request with nothing extra still says where this site keeps it, and Step 2 says only that", () => {
  assert.deepEqual(buildRequestTeamNotes({}), ["Lead dashboard: https://leads.boisehandyman.co"]);
  assert.deepEqual(buildDetailsTeamNotes({ requestId: "8d6c1f5e-2b1a-4c3d-9e8f-0a1b2c3d4e5f" }), [
    "Lead dashboard: https://leads.boisehandyman.co",
    "Site request id: 8d6c1f5e-2b1a-4c3d-9e8f-0a1b2c3d4e5f (boisehandyman.co consultation_requests)",
  ]);
  // A planning range that cannot be read never stops the request being forwarded.
  const broken = buildRequestTeamNotes({ estimate: { project: "not-a-project" } as never, requestId: "r1" });
  assert.deepEqual(broken.slice(0, 2), ["Lead dashboard: https://leads.boisehandyman.co", "Site request id: r1 (boisehandyman.co consultation_requests)"]);
});

test("teamNoteLines drops what p5 could not print as a labelled line and caps the rest", () => {
  assert.deepEqual(
    teamNoteLines([
      "  Planning range:   $18,000 to\n$24,000 ",
      "no label here",
      "Empty: ",
      "Name: Jordan Example",
      "EMAIL: jordan@example.com",
      "Phone: 2085550199",
      42,
      null,
      `Long: ${"x".repeat(400)}`,
    ] as unknown[]),
    ["Planning range: $18,000 to $24,000", `Long: ${"x".repeat(MAX_TEAM_NOTE_LENGTH - 9)}...`],
  );
  const many = teamNoteLines(Array.from({ length: 55 }, (_, i) => `Line ${i + 1}: value ${i + 1}`));
  assert.equal(many.length, MAX_TEAM_NOTES);
  assert.equal(many[38], "Line 39: value 39");
  assert.equal(many[39], "More: 16 further lines are on this site's lead record");
  assert.deepEqual(teamNoteLines(undefined), []);
  assert.deepEqual(teamNoteLines("Parcel: R1" as never), []);
});

/* ───────────── the bridge: what it reports */

test("the bridge reports p5's answer: sent, failed and none are read exactly, anything else is unknown", async () => {
  for (const alert of ["sent", "failed", "none"] as const) {
    assert.deepEqual(await forwardConsultationToP5Intake(CONTACT, answering({ ok: true, alert }, 201)), { forwarded: true, alert });
  }
  for (const answer of [{ ok: true }, { alert: "SENT" }, { alert: " sent" }, { alert: true }, { alert: null }, { alert: ["sent"] }, { result: { alert: "sent" } }, ["sent"], "sent", null, 7]) {
    assert.equal(readP5TeamAlert(answer), "unknown", JSON.stringify(answer));
  }
  // An older p5 (no alert), an answer that is not JSON, and an empty answer.
  assert.deepEqual(await forwardConsultationToP5Intake(CONTACT, answering({ ok: true, accepted: true })), { forwarded: true, alert: "unknown" });
  assert.deepEqual(await forwardConsultationToP5Intake(CONTACT, answering("<html>ok</html>")), { forwarded: true, alert: "unknown" });
  assert.deepEqual(await forwardConsultationToP5Intake(CONTACT, answering("")), { forwarded: true, alert: "unknown" });
  // An HTTP error is never a confirmation, whatever its body claims.
  assert.deepEqual(await forwardConsultationToP5Intake(CONTACT, answering({ alert: "sent" }, 500)), { forwarded: false, alert: "unknown" });
  assert.deepEqual(await forwardConsultationToP5Intake(CONTACT, answering({ alert: "sent" }, 422)), { forwarded: false, alert: "unknown" });
});

test("the bridge never throws: a thrown fetch and a timeout both report unknown", async () => {
  const thrown = await forwardConsultationToP5Intake(CONTACT, async () => {
    throw new Error("network down");
  });
  assert.deepEqual(thrown, { forwarded: false, alert: "unknown" });

  const started = Date.now();
  const timedOut = await forwardConsultationToP5Intake(CONTACT, hanging, 30);
  assert.deepEqual(timedOut, { forwarded: false, alert: "unknown" });
  assert.ok(Date.now() - started < 5_000, "the bridge gives up on its own timer");

  // p5 can take about 25 seconds in confirm mode, so the bridge waits 30.
  assert.equal(P5_BRIDGE_TIMEOUT_MS, 30_000);
  let signal: AbortSignal | null | undefined;
  await forwardConsultationToP5Intake(CONTACT, async (_url, init) => {
    signal = init.signal;
    return new Response("{}", { status: 200 });
  });
  assert.ok(signal instanceof AbortSignal, "every post carries the timeout");
});

/* ───────────── the shared inbox */

test("the shared family inbox is hello@ at every family domain, whatever the case", () => {
  assert.deepEqual([...SHARED_FAMILY_INBOX_DOMAINS], [
    "p5homeco.com",
    "boisecabinet.co",
    "boiseconstruction.co",
    "boiseremodeling.co",
    "boisehandyman.co",
    "boiseadu.co",
  ]);
  for (const domain of SHARED_FAMILY_INBOX_DOMAINS) {
    assert.equal(isSharedFamilyInbox(`hello@${domain}`), true, domain);
    assert.equal(isSharedFamilyInbox(`  Hello@${domain.toUpperCase()} `), true, domain);
    assert.equal(isSharedFamilyInbox(`Boise Handyman Co <HELLO@${domain}>`), true, domain);
  }
  for (const other of ["owner@boisehandyman.co", "hello@example.com", "hello@boisehandyman.co.example.com", "hello@mail.boisehandyman.co", "nothello@p5homeco.com", "hello+leads@p5homeco.com", "", null, undefined]) {
    assert.equal(isSharedFamilyInbox(other), false, String(other));
  }
  assert.deepEqual(teamEmailRecipients([SHARED, OTHER, "Hello@P5HomeCo.com", OTHER], "sent"), [OTHER]);
  for (const alert of ["failed", "none", "unknown"] as const) {
    assert.deepEqual(teamEmailRecipients([SHARED, OTHER], alert), [SHARED, OTHER], alert);
  }
});

/* ───────────── the decision */

test("sent: the shared inbox is skipped and any other admin recipient is still emailed", async () => {
  const { sent, outcome } = await deliver(forwardConsultationToP5Intake(CONTACT, answering({ ok: true, alert: "sent" }, 201)));
  assert.deepEqual(sent, [OTHER]);
  assert.deepEqual(outcome, { alert: "sent", sentTo: [OTHER], skipped: [SHARED] });

  // With only the shared inbox on the list (this site's default), p5's email is the one email.
  const only = await deliver(forwardConsultationToP5Intake(CONTACT, answering({ alert: "sent" })), [SHARED]);
  assert.deepEqual(only.sent, []);
  assert.deepEqual(only.outcome.skipped, [SHARED]);
});

test("failed, none, unknown, an HTTP error, a thrown fetch and a timeout each email everyone", async () => {
  const cases: Array<[string, Promise<P5BridgeResult>]> = [
    ["failed", forwardConsultationToP5Intake(CONTACT, answering({ ok: true, alert: "failed" }))],
    ["none", forwardConsultationToP5Intake(CONTACT, answering({ ok: true, duplicate: true, alert: "none" }))],
    ["unknown (an older p5, no alert)", forwardConsultationToP5Intake(CONTACT, answering({ ok: true }))],
    ["unknown (an alert this site does not know)", forwardConsultationToP5Intake(CONTACT, answering({ alert: "queued" }))],
    ["HTTP error", forwardConsultationToP5Intake(CONTACT, answering({ alert: "sent" }, 503))],
    ["thrown fetch", forwardConsultationToP5Intake(CONTACT, async () => { throw new Error("network down"); })],
    ["timeout", forwardConsultationToP5Intake(CONTACT, hanging, 30)],
  ];
  for (const [name, bridge] of cases) {
    const { sent, outcome } = await deliver(bridge);
    assert.deepEqual(sent, [SHARED, OTHER], name);
    assert.deepEqual(outcome.skipped, [], name);
    assert.notEqual(outcome.alert, "sent", name);
  }
});

test("nothing forwarded, a bridge that rejects, and a bridge that never settles each email everyone", async () => {
  assert.deepEqual((await deliver(null)).sent, [SHARED, OTHER], "the bridge was not called at all");
  assert.deepEqual((await deliver(Promise.reject(new Error("bridge threw")))).sent, [SHARED, OTHER]);
  assert.deepEqual((await deliver(Promise.resolve({ forwarded: true, alert: "delivered" } as never))).sent, [SHARED, OTHER]);
  assert.deepEqual((await deliver(Promise.resolve(undefined as never))).sent, [SHARED, OTHER]);
  const never = await deliver(new Promise<P5BridgeResult>(() => {}), [SHARED, OTHER], 20);
  assert.deepEqual(never.sent, [SHARED, OTHER]);
  assert.equal(never.outcome.alert, "unknown");
});

test("one recipient failing does not stop the next, and the send never throws", async () => {
  const sent: string[] = [];
  const outcome = await sendTeamEmailAfterBridge({
    label: "test",
    bridge: null,
    recipients: () => [SHARED, OTHER],
    send: async (to) => {
      if (to === SHARED) throw new Error("mail server refused");
      sent.push(to);
    },
  });
  assert.deepEqual(sent, [OTHER]);
  assert.deepEqual(outcome.sentTo, [OTHER]);
  await assert.doesNotReject(() =>
    sendTeamEmailAfterBridge({
      label: "test",
      bridge: null,
      recipients: () => {
        throw new Error("no recipients");
      },
      send: async () => undefined,
    }),
  );
});

/* ───────────── the visitor never waits */

test("the visitor response is not delayed: the team email waits for the bridge inside after(), and nothing is sent before it answers", async () => {
  let answer!: (result: P5BridgeResult) => void;
  const bridge = new Promise<P5BridgeResult>((resolve) => {
    answer = resolve;
  });
  const tasks: Array<() => Promise<unknown>> = [];
  const sent: string[] = [];
  const now = scheduleTeamEmail((task) => void tasks.push(task), {
    label: "test",
    bridge,
    recipients: () => [SHARED, OTHER],
    send: async (to) => {
      sent.push(to);
    },
  });
  // Scheduling returns at once with nothing for the route to await, while p5
  // has not answered: the response goes out here.
  assert.equal(now, null);
  assert.equal(tasks.length, 1);
  assert.deepEqual(sent, []);

  // after() runs the task once the response is out. It still waits for p5.
  const running = tasks[0]();
  await new Promise((resolve) => setTimeout(resolve, 20));
  assert.deepEqual(sent, [], "no team email before the bridge answers");
  answer({ forwarded: true, alert: "sent" });
  await running;
  assert.deepEqual(sent, [OTHER]);
});

test("after() unavailable: the team email goes to everyone at once, as it did before this rule", async () => {
  const sent: string[] = [];
  const now = scheduleTeamEmail(
    () => {
      throw new Error("after() was called outside a request scope");
    },
    {
      label: "test",
      // Even a bridge that would confirm is not waited on here.
      bridge: new Promise<P5BridgeResult>(() => {}),
      recipients: () => [SHARED, OTHER],
      send: async (to) => {
        sent.push(to);
      },
    },
  );
  assert.ok(now instanceof Promise);
  await now;
  assert.deepEqual(sent, [SHARED, OTHER]);
});
