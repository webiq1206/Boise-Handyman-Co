import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import test from 'node:test';
import ts from 'typescript';
import * as publicPlanning from '../shared/handymanPlanning.ts';
import * as planningState from '../shared/handymanPlanningState.ts';

const source = readFileSync(new URL('../components/sections/HandymanPlanningRange.tsx', import.meta.url), 'utf8');
const categories = ['drywall-repair', 'painting-touch-ups', 'plumbing-repairs', 'electrical-repairs', 'mounting-assembly', 'carpentry-trim-repair'];
const planning = {version: 1, categories: categories.map(id => ({id, label: id, tasks: Array.from({length: 4}, (_, n) => ({id: `${id}-${n}`, label: `Task ${n}`, range: n === 1 ? null : {low: 100 + n * 10, high: 200 + n * 10}}))}))};
const jsx = (type, props) => ({type, props: props ?? {}});
function harness(data = planning) {
  const values = []; let cursor = 0;
  const react = {
    useState(initial) {const i = cursor++; if (!(i in values)) values[i] = initial; return [values[i], value => {values[i] = value;}];},
    useReducer(reducer, initial, init) {const i = cursor++; if (!(i in values)) values[i] = init(initial); return [values[i], action => {values[i] = reducer(values[i], action);}];},
    useRef() {return {current: null};}, useEffect() {},
  };
  const module = {exports: {}};
  const imports = {
    react, 'react/jsx-runtime': {jsx, jsxs: jsx, Fragment: 'Fragment'}, 'lucide-react': {Check: 'Check'},
    '@/components/Reveal': {Reveal: 'Reveal'}, '@/components/marketing/Section': {Section: 'Section'},
    '@/shared/ctaCopy': {CTA_SECONDARY: 'Request a quote'}, 'next/link': {default: 'Link'},
    '@/shared/handymanPlanning': publicPlanning, '@/shared/handymanPlanningState': planningState,
    './HandymanPlanningRange.module.css': {default: new Proxy({}, {get: (_, key) => key})},
  };
  vm.runInNewContext(ts.transpileModule(source, {compilerOptions: {jsx: ts.JsxEmit.ReactJSX, module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true}}).outputText,
    {module, exports: module.exports, require(name) {assert.ok(name in imports, `Unexpected browser import: ${name}`); return imports[name];}});
  return {render() {cursor = 0; return module.exports.HandymanPlanningRange({planning: data});}};
}
function nodes(node) {return Array.isArray(node) ? node.flatMap(nodes) : !node || typeof node !== 'object' ? [] : [node, ...nodes(node.props?.children)];}
function find(tree, id) {return nodes(tree).find(node => node.props['data-testid'] === id);}
function click(h, id) {const item = find(h.render(), id); assert.ok(item, id); item.props.onClick(); return h.render();}
function checkCta(tree) {const cta = find(tree, 'proof-cta-contact'); assert.equal(cta.props.href, '/#consult'); assert.equal(cta.props.children, 'Request a quote');}

test('the initial worked range is available before contact and can be edited', () => {
  const h = harness(); const tree = h.render(); checkCta(tree);
  assert.equal(find(tree, 'proof-range-value').props.children, '$100 to $200');
  const review = click(h, 'proof-back');
  assert.ok(find(review, 'proof-edit-category')); assert.ok(find(review, 'proof-edit-task'));
});
for (const id of categories) test(`${id}: all four choices, unpriced recovery, Back and selection retention`, () => {
  const h = harness(); click(h, 'proof-back'); click(h, 'proof-edit-category'); click(h, `proof-category-${id}`); click(h, 'proof-next');
  for (const task of planning.categories.find(item => item.id === id).tasks) {
    click(h, `proof-task-${task.id}`);
    let tree = click(h, 'proof-next'); assert.ok(find(tree, 'proof-review'));
    tree = click(h, 'proof-next'); checkCta(tree);
    assert.equal(Boolean(find(tree, 'proof-range-value')), Boolean(task.range));
    assert.equal(Boolean(find(tree, 'proof-unpriced')), !task.range);
    click(h, 'proof-back'); tree = click(h, 'proof-back');
    assert.equal(find(tree, `proof-task-${task.id}`).props['aria-checked'], true);
  }
  click(h, 'proof-back'); click(h, 'proof-next');
  assert.equal(find(h.render(), `proof-task-${id}-3`).props['aria-checked'], true);
});
test('a changed category clears its incompatible task and cannot advance until a task is chosen', () => {
  const h = harness(); click(h, 'proof-back'); click(h, 'proof-edit-category'); click(h, 'proof-category-plumbing-repairs');
  const tree = click(h, 'proof-next'); assert.equal(find(tree, 'proof-next').props.disabled, true);
  assert.ok(find(tree, 'proof-selection-help'));
});
test('refresh accepts only known selection IDs and restores the exact step', () => {
  let state = planningState.initialPlanningState(planning);
  state = planningState.updatePlanningState(planning, state, {type: 'edit-task'});
  state = planningState.updatePlanningState(planning, state, {type: 'task', id: 'drywall-repair-2'});
  assert.deepEqual(planningState.readPlanningState(planning, JSON.parse(JSON.stringify(state))), state);
  const bad = {...state, taskId: 'plumbing-repairs-0'};
  assert.deepEqual(planningState.readPlanningState(planning, bad), planningState.initialPlanningState(planning));
});
test('empty public data keeps a path to a person without a fabricated range', () => {
  const tree = harness({version: 1, categories: []}).render(); checkCta(tree);
  assert.equal(find(tree, 'proof-range-value'), undefined);
});
test('the public component has no pricing engine import and the quote target remains a public form', () => {
  assert.doesNotMatch(source, /estimateEngine|handymanCustomerPrice|HandymanPriceContext|lib\/p5\/pricing/);
  const home = readFileSync(new URL('../app/page.tsx', import.meta.url), 'utf8');
  assert.match(home, /id="consult"/); assert.match(home, /<ConsultationForm\s*\/>/);
});
