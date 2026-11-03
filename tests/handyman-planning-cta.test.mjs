import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import test from 'node:test';
import ts from 'typescript';

// Exercise only the marketing component. No estimator implementation, browser,
// API, storage, or notification modules are loaded by this isolated harness.
const source = readFileSync(new URL('../components/sections/HandymanPlanningRange.tsx', import.meta.url), 'utf8');
const ctaSource = readFileSync(new URL('../shared/ctaCopy.ts', import.meta.url), 'utf8');
const categories = ['drywall-repair', 'painting-touch-ups', 'plumbing-repairs', 'electrical-repairs', 'mounting-assembly', 'carpentry-trim-repair'];
const tasks = Object.fromEntries(categories.map(id => [id, Array.from({ length: 4 }, (_, i) => ({ id: `${id}-${i}`, label: `Task ${i}`, sub: 'Test task' }))]));
const jsx = (type, props) => ({ type, props: props ?? {} });
function harness() {
  const state = [];
  let cursor = 0;
  const react = {
    useState(initial) { const i = cursor++; if (!(i in state)) state[i] = initial; return [state[i], value => { state[i] = value; }]; },
    useMemo: fn => fn(),
  };
  const module = { exports: {} };
  const imports = {
    react,
    'react/jsx-runtime': { jsx, jsxs: jsx, Fragment: 'Fragment' },
    'lucide-react': { ArrowRight: 'ArrowRight' },
    '@/components/Reveal': { Reveal: 'Reveal' },
    '@/components/marketing/Section': { Section: 'Section' },
    '@/components/ui/button': { Button: 'Button' },
    '@/components/estimate/wizard/SelectableCard': { SelectableCard: 'SelectableCard' },
    '@/shared/ctaCopy': { CTA_SECONDARY: ctaSource.match(/CTA_SECONDARY = "([^"]+)"/)[1], CTA_PRIMARY: 'Send your list and photos' },
    'next/link': { default: 'Link' },
    '@/shared/sentenceCase': { toSentenceCase: value => value },
    '@/shared/estimateEngine': {
      JOB_CATEGORY_LABELS: Object.fromEntries(categories.map(id => [id, { label: id, sub: 'Test category' }])),
      TASK_CATALOG: tasks,
      calculateHandymanEstimate: () => ({ priceLow: 100, priceHigh: 200, totalHours: 1 }),
      formatHandymanCurrency: n => `$${n}`,
      HANDYMAN_RATE_DISCLAIMER: 'Test disclaimer',
    },
  };
  const compiled = ts.transpileModule(source, { compilerOptions: { jsx: ts.JsxEmit.ReactJSX, module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } });
  vm.runInNewContext(compiled.outputText, { module, exports: module.exports, require(name) { assert.ok(name in imports, `Unexpected import: ${name}`); return imports[name]; } });
  function render() { cursor = 0; return module.exports.HandymanPlanningRange(); }
  return { render };
}
function nodes(node) {
  if (Array.isArray(node)) return node.flatMap(nodes);
  if (!node || typeof node !== 'object') return [];
  return [node, ...nodes(node.props?.children)];
}
function byTestId(tree, id) { return nodes(tree).find(n => n.props['data-testid'] === id); }
function verifyCta(tree) {
  const ctas = nodes(tree).filter(n => n.props['data-testid'] === 'proof-cta-contact');
  assert.equal(ctas.length, 1, 'Exactly one section CTA');
  assert.equal(ctas[0].props.variant, 'brand');
  const link = nodes(ctas[0]).find(n => n.props.href);
  assert.equal(link.props.href, '/#consult');
  assert.ok(nodes(ctas[0]).some(n => Array.isArray(n.props.children) && n.props.children.includes('Request a quote')), 'Explicit quote wording');
}
test('default worked example exposes one quote CTA', () => { const h = harness(); const tree = h.render(); verifyCta(tree); assert.ok(byTestId(tree, 'proof-range-value')); });
for (const category of categories) {
  test(`${category}: quote remains through empty task and all four task selections`, () => {
    const h = harness();
    let tree = h.render();
    byTestId(tree, `proof-category-${category}`).props.onSelect();
    tree = h.render();
    verifyCta(tree);
    assert.equal(byTestId(tree, 'proof-range-value'), undefined);
    for (const task of tasks[category]) {
      byTestId(tree, `proof-task-${task.id}`).props.onSelect();
      tree = h.render();
      verifyCta(tree);
      assert.ok(byTestId(tree, 'proof-range-value'));
    }
    // Selecting the same category again resets its task and must retain contact.
    byTestId(tree, `proof-category-${category}`).props.onSelect();
    verifyCta(h.render());
  });
}
test('quote destination remains a public homepage form', () => {
  const home = readFileSync(new URL('../app/page.tsx', import.meta.url), 'utf8');
  assert.match(home, /id="consult"/);
  assert.match(home, /<ConsultationForm\s*\/>/);
});
