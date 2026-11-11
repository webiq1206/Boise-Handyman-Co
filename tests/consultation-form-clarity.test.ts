/**
 * Quote form clarity standard (owner, 11 November 2026). Round 1: only what we
 * need to call back shows, everything optional is hidden until asked for.
 * Round 2: "It cannot look cluttered. It needs to look very clean." Nothing
 * sits in the form that is not a field, the button or one quiet line: no step
 * indicator, no tabs, no footnote, no boxed dropdown, no trust bullets.
 * These pin that layout in the form source; the browser walk is
 * verifyHandymanHomeEntry in scripts/lib/shortBrandEntry.mjs.
 */
import test from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";

const read = (path: string) => readFileSync(new URL(path, import.meta.url), "utf8");
const form = read("../components/ConsultationForm.tsx");
const css = read("../app/family-adoption.css");
const step1 = form.slice(form.indexOf('data-testid="consultation-wizard"'), form.indexOf("/* ───────────────────────────── Step 2"));
const success = form.slice(form.indexOf("if (success) {"), form.indexOf("const describedBy"));
const panel = form.slice(form.indexOf("function DetailsPanel("));
const at = (source: string, needle: string) => {
  const index = source.indexOf(needle);
  assert.ok(index >= 0, `missing: ${needle}`);
  return index;
};
const ascending = (source: string, needles: string[]) => {
  const order = needles.map((needle) => at(source, needle));
  assert.deepEqual(order, [...order].sort((a, b) => a - b));
};

test("before sending: heading, list, name, phone, the quiet toggle, the button, two quiet lines, in that order", () => {
  ascending(step1, [
    "data-quote-form-heading",
    'data-testid="textarea-message"',
    'data-testid="input-name"',
    'data-testid="input-phone"',
    'data-testid="quote-options"',
    'data-testid="button-consult-submit"',
    'data-testid="link-consult-form-call"',
    'data-testid="request-mode-request"',
    'data-testid="request-mode-callback"',
    'href="/privacy-policy"',
  ]);
  assert.match(step1, /<div className="hm-form-pair">/, "name and phone share a row on a wide screen");
  assert.match(css, /@media \(min-width: 640px\) \{\s*\.hm-form \.hm-form-pair \{\s*grid-template-columns/);
});

test("nothing else is in the form: no steps, tabs, footnote, trust bullets, text or chat links, or extra helper lines", () => {
  assert.doesNotMatch(
    form,
    /QuoteSteps|hm-form-tab|hm-form-steps|consult-send-footnote|That is all we need|CONSULT_BULLETS|showTrust|onRevise|link-consult-form-text|button-consult-form-chat|does not book a visit|hm-form-hint|hm-form-next/,
  );
  assert.equal(existsSync(new URL("../components/forms/QuoteSteps.tsx", import.meta.url)), false);
  assert.doesNotMatch(css, /hm-form-steps|hm-form-tab|hm-form-footnote|hm-form-talk|hm-form-trust|hm-form-hint|hm-form-next/);
  // At most the two quiet lines under the button, plus the attached range when there is one.
  const afterButton = step1.slice(at(step1, 'data-testid="button-consult-submit"'));
  assert.equal(afterButton.match(/<p className="hm-form-quiet"/g)?.length, 2);
  assert.match(step1, /<p className="hm-form-quiet" data-testid="text-estimate-summary">/, "an attached range is one muted line");
});

test("the callback switch is the same two radios, drawn as one text link in the line under the button", () => {
  const start = at(step1, '<fieldset className="hm-form-mode">');
  const line = step1.slice(start, step1.indexOf("</fieldset>", start));
  assert.equal(line.match(/type="radio"/g)?.length, 2);
  assert.match(line, /Prefer to talk\?\{" "\}/);
  assert.match(line, /"Rather write it down\? "/);
  assert.match(line, /<span>Send a request<\/span>/);
  assert.match(line, /<span>Have us call you<\/span>/);
  // Only the mode you are not in shows; the active radio stays in the page, visually hidden.
  assert.match(line, /<label className=\{callback \? "hm-form-mode-link" : "sr-only"\}>\s*<input\s+type="radio"\s+name=\{ids\("mode"\)\}\s+value="request"/);
  assert.match(line, /<label className=\{callback \? "sr-only" : "hm-form-mode-link is-inline"\}>\s*<input\s+type="radio"\s+name=\{ids\("mode"\)\}\s+value="callback"/);
});

test("Step 1 has no file control: files are offered after sending only", () => {
  assert.doesNotMatch(step1, /AttachmentTile|type="file"/);
  assert.equal(form.match(/<AttachmentTile/g)?.length, 1);
  assert.ok(at(panel, "<AttachmentTile") > 0);
  assert.match(form, /filesPending: undefined/);
});

test("every optional Step 1 field sits behind the one quiet text toggle, which is not a box", () => {
  const open = at(step1, 'data-testid="quote-options"');
  const close = at(step1, "</details>");
  for (const needle of ['data-testid="input-email"', "How should we reach you?", "button-preferred-contact-"]) {
    const index = at(step1, needle);
    assert.ok(index > open && index < close, needle);
  }
  assert.equal(step1.match(/<details/g)?.length, 1);
  assert.match(step1, /<span>Add email or contact preference \(optional\)<\/span>/);
  const rules = [...css.matchAll(/\.hm-form \.hm-form-more[^{]*\{[^}]*\}/g)].map((match) => match[0]).join("\n");
  assert.ok(rules.length > 0);
  assert.doesNotMatch(rules, /border|background|padding/, "the toggle has no border, background or padding box");
  // Closed until asked for; a draft or prefill with an email, or a non-default reply choice, opens it.
  assert.match(form, /const \[optionsOpen, setOptionsOpen\] = useState\(false\)/);
  assert.match(form, /draft\.email \|\| \(draft\.reach && draft\.reach !== DEFAULT_REACH\)\) setOptionsOpen\(true\)/);
  // Validation that needs the email opens the toggle before focusing the field.
  assert.match(form, /first === "email" && optionsRef\.current && !optionsRef\.current\.open/);
});

test("one send button", () => {
  assert.equal(step1.match(/type="submit"/g)?.length, 1);
});

test("after sending: a tick, the thanks, one sentence ending Nothing else is needed, the toggle, one call line", () => {
  ascending(success, ["hm-form-done-tick", "We have your request.", 'data-testid="quote-all-set"', "<DetailsPanel", 'data-testid="link-consult-success-phone"']);
  assert.match(success, /"We review your list and reply with a written quote\. Nothing else is needed\."/);
  assert.match(success, /`We will call you back at \$\{submitted\?\.phone\}\. Nothing else is needed\.`/);
  assert.equal(success.match(/<p /g)?.length, 2, "one sentence and one call line, nothing more");
  assert.match(success, /data-quote-follow-up=""/);
});

test("the after-send toggle is closed, has no Skip button and no helper lines, and keeps its saved state", () => {
  const disclosure = at(panel, 'data-testid="quote-details-disclosure"');
  assert.ok(at(panel, 'data-testid="consult-details"') < disclosure, "the panel test id stays on the wrapper");
  assert.doesNotMatch(panel.slice(disclosure, disclosure + 120), /\bopen\b/, "closed by default");
  assert.match(panel, /<span>Add photos, plans or details \(optional\)<\/span>/);
  for (const needle of ['data-testid="details-address"', "<AttachmentTile", 'data-testid="button-details-save"']) {
    assert.ok(at(panel, needle) > disclosure, needle);
  }
  assert.doesNotMatch(form, /button-details-skip|>\s*Skip\s*<|"skipped"|Help us prepare/);
  at(panel, 'data-testid="consult-details-saved"');
});

test("the consult dialog shows the form and nothing around it", () => {
  const dialog = read("../components/modals/ConsultDialog.tsx");
  assert.match(dialog, /<DialogHeader className="sr-only">/);
  assert.match(dialog, /<ConsultationForm headingLevel="h2" \/>/);
});

test("the estimator recovery prompt: one phone field, one button, the optional name behind a quiet toggle", () => {
  const prompt = read("../components/estimate/recovery/AbandonmentPrompt.tsx");
  const open = at(prompt, 'data-testid="recovery-options"');
  const name = at(prompt, 'id="recovery-name"');
  assert.ok(name > open && name < prompt.indexOf("</details>", open));
  assert.ok(at(prompt, 'data-testid="recovery-phone"') < open);
  assert.equal(prompt.match(/type="submit"/g)?.length, 1);
  assert.doesNotMatch(prompt, /ed-eyebrow|Or request a callback|placeholder=/);
  for (const id of ["recovery-call", "recovery-text"]) at(prompt, `data-testid="${id}"`);
});
