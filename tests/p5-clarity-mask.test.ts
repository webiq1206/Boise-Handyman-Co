import { readFileSync } from 'node:fs';
import test from 'node:test';
import assert from 'node:assert/strict';
import { clarityFormMaskScript } from '../lib/clarityFormMask.ts';

type FakeEl = {
  tag: string;
  attrs: Record<string, string>;
  children: FakeEl[];
  setAttribute: (name: string, value: string) => void;
  querySelectorAll: (selector: string) => FakeEl[];
};

function el(tag: string, children: FakeEl[] = []): FakeEl {
  const node: FakeEl = {
    tag,
    attrs: {},
    children,
    setAttribute(name, value) {
      this.attrs[name] = value;
    },
    querySelectorAll(selector) {
      const tags = selector.split(',').map((part) => part.trim().toLowerCase());
      const out: FakeEl[] = [];
      const walk = (current: FakeEl) => {
        if (tags.includes(current.tag)) out.push(current);
        current.children.forEach(walk);
      };
      this.children.forEach(walk);
      return out;
    },
  };
  return node;
}

test('the Clarity mask script marks every input, textarea, and select', () => {
  const name = el('input');
  const email = el('input');
  const phone = el('input');
  const notes = el('textarea');
  const service = el('select');
  const submit = el('button');
  const heading = el('div');
  const body = el('body', [
    el('form', [name, email, heading]),
    el('form', [phone, notes, service, submit]),
  ]);
  const root = el('html', [body]);
  const observers: Array<{ callback: () => void }> = [];

  class MutationObserver {
    callback: () => void;
    constructor(callback: () => void) {
      this.callback = callback;
      observers.push(this);
    }
    observe() {}
  }

  const document = {
    readyState: 'complete',
    documentElement: root,
    addEventListener() {},
    querySelectorAll: (selector: string) => root.querySelectorAll(selector),
  };

  new Function('document', 'MutationObserver', clarityFormMaskScript)(document, MutationObserver);

  for (const field of [name, email, phone, notes, service]) {
    assert.equal(field.attrs['data-clarity-mask'], 'True');
  }
  assert.equal(submit.attrs['data-clarity-mask'], undefined);
  assert.equal(heading.attrs['data-clarity-mask'], undefined);

  const intake = el('input');
  const estimateNotes = el('textarea');
  const estimateService = el('select');
  body.children.push(el('form', [intake, estimateNotes, estimateService]));
  assert.equal(observers.length, 1);
  observers[0].callback();
  assert.equal(intake.attrs['data-clarity-mask'], 'True');
  assert.equal(estimateNotes.attrs['data-clarity-mask'], 'True');
  assert.equal(estimateService.attrs['data-clarity-mask'], 'True');
});

test('the root layout installs the Clarity mask before the Clarity tag', () => {
  const layout = readFileSync(new URL('../app/layout.tsx', import.meta.url), 'utf8');
  const maskAt = layout.indexOf('id="clarity-form-mask"');
  const clarityAt = layout.indexOf('<MicrosoftClarity />');
  assert.ok(maskAt > 0);
  assert.ok(clarityAt > maskAt);
  assert.match(layout, /strategy="beforeInteractive"/);
  assert.match(clarityFormMaskScript, /"input, textarea, select"/);
  assert.match(clarityFormMaskScript, /"data-clarity-mask"/);
  assert.match(clarityFormMaskScript, /"True"/);
  assert.match(clarityFormMaskScript, /querySelectorAll\(SELECTOR\)/);
  assert.match(clarityFormMaskScript, /setAttribute\(ATTR, VALUE\)/);
});
