/**
 * Quote form clarity standard (owner, 11 November 2026, after a client found a
 * family form confusing because "it just kept asking more questions"): Step 1
 * shows only what we need to call back, every optional field sits in one
 * closed dropdown, files and extra details wait in one closed dropdown on the
 * success screen, and nothing after sending reads as another required
 * question. These pin that layout in the form source; the browser walk is
 * verifyHandymanHomeEntry in scripts/lib/shortBrandEntry.mjs.
 */
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const read = (path: string) => readFileSync(new URL(path, import.meta.url), "utf8");
const form = read("../components/ConsultationForm.tsx");
const step1 = form.slice(form.indexOf('data-testid="consultation-wizard"'), form.indexOf("/* ───────────────────────────── Step 2"));
const success = form.slice(form.indexOf("if (success) {"), form.indexOf("const describedBy"));
const panel = form.slice(form.indexOf("function DetailsPanel("));
const at = (source: string, needle: string) => {
  const index = source.indexOf(needle);
  assert.ok(index >= 0, `missing: ${needle}`);
  return index;
};

test("Step 1 shows the steps, the quiet tabs, the list, name and phone, in that order", () => {
  const order = [
    "<QuoteSteps sent={false} />",
    'data-testid="request-mode-request"',
    'data-testid="request-mode-callback"',
    'data-testid="textarea-message"',
    'data-testid="input-name"',
    'data-testid="input-phone"',
    'data-testid="quote-options"',
    'data-testid="button-consult-submit"',
    'data-testid="consult-send-footnote"',
    "{talk}",
  ].map((needle) => at(step1, needle));
  assert.deepEqual(order, [...order].sort((a, b) => a - b));
  assert.match(step1, /<label className="hm-form-tab">/);
  assert.doesNotMatch(step1, /hm-form-pill">\s*<input\s+type="radio"\s+name=\{ids\("mode"\)\}/, "the mode switch is no longer a filled pill");
});

test("Step 1 has no file control: files are offered on Step 2 only", () => {
  assert.doesNotMatch(step1, /AttachmentTile|type="file"/);
  assert.equal(form.match(/<AttachmentTile/g)?.length, 1);
  assert.ok(at(panel, "<AttachmentTile") > 0);
  assert.match(form, /filesPending: undefined/);
});

test("every optional Step 1 field sits inside the one closed dropdown", () => {
  const open = at(step1, 'data-testid="quote-options"');
  const close = at(step1, "</details>");
  for (const needle of ['data-testid="input-email"', "How should we reach you?", "button-preferred-contact-"]) {
    const index = at(step1, needle);
    assert.ok(index > open && index < close, needle);
  }
  assert.equal(step1.match(/<details/g)?.length, 1);
  assert.match(step1, /Add an email or choose how we reach you <span className="hm-form-optional">\(optional\)<\/span>/);
  // Closed until asked for; a draft or prefill with an email, or a non-default reply choice, opens it.
  assert.match(form, /const \[optionsOpen, setOptionsOpen\] = useState\(false\)/);
  assert.match(form, /draft\.email \|\| \(draft\.reach && draft\.reach !== DEFAULT_REACH\)\) setOptionsOpen\(true\)/);
  // Validation that needs the email opens the dropdown before focusing the field.
  assert.match(form, /first === "email" && optionsRef\.current && !optionsRef\.current\.open/);
});

test("one send button, one short line under it, and Prefer to talk as one line of links", () => {
  assert.equal(step1.match(/type="submit"/g)?.length, 1);
  assert.match(step1, /"We call you back during business hours\." : "That is all we need\. You can add photos after you send\."/);
  const talk = form.slice(at(form, "const talk = ("), at(form, 'data-testid="consultation-wizard"'));
  assert.match(talk, /<p className="hm-form-talk"/);
  for (const id of ["link-consult-form-call", "link-consult-form-text", "button-consult-form-chat"]) at(talk, `data-testid="${id}"`);
  assert.doesNotMatch(talk, /hm-form-talk-actions|<Phone|<MessageSquare/);
});

test("the success screen says the request is sent and nothing else is needed", () => {
  const order = ["<QuoteSteps sent />", "We have your request.", "You are all set. Nothing else is needed.", "<DetailsPanel"].map((needle) =>
    at(success, needle),
  );
  assert.deepEqual(order, [...order].sort((a, b) => a - b));
  assert.match(success, /data-quote-follow-up=""/);
});

test("Step 2 is one closed dropdown with no Skip button, and keeps its saved state", () => {
  const disclosure = at(panel, 'data-testid="quote-details-disclosure"');
  assert.ok(at(panel, 'data-testid="consult-details"') < disclosure, "the panel test id stays on the wrapper");
  assert.doesNotMatch(panel.slice(disclosure, disclosure + 120), /\bopen\b/, "closed by default");
  assert.match(panel, /Add photos or job details <span className="hm-form-optional">\(optional\)<\/span>/);
  for (const needle of ['data-testid="details-address"', "<AttachmentTile", 'data-testid="button-details-save"']) {
    assert.ok(at(panel, needle) > disclosure, needle);
  }
  assert.doesNotMatch(form, /button-details-skip|>\s*Skip\s*<|"skipped"|Help us prepare/);
  at(panel, 'data-testid="consult-details-saved"');
});

test("the step indicator names both steps and the sent state", () => {
  const steps = read("../components/forms/QuoteSteps.tsx");
  assert.match(steps, /sent \? "Request sent" : "Your request"/);
  assert.match(steps, /Photos and details \(optional\)/);
  assert.match(steps, /sent \? <Check size=\{14\} \/> : "1"/);
});

test("the estimator recovery prompt asks for the phone only; the optional name is in a closed dropdown", () => {
  const prompt = read("../components/estimate/recovery/AbandonmentPrompt.tsx");
  const open = at(prompt, 'data-testid="recovery-options"');
  const name = at(prompt, 'id="recovery-name"');
  assert.ok(name > open && name < prompt.indexOf("</details>", open));
  assert.ok(at(prompt, 'data-testid="recovery-phone"') < open);
});
