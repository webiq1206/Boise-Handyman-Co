import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';

/** Run the actual component with effects deferred until after a user
 * interaction, as happens while the initial production tree is hydrating. */
function scrollComponent(initialPath = '/') {
  let pathname = initialPath, hook = 0, scrollY = 0;
  const listeners = new Map<string, Set<() => void>>();
  const location = {pathname: initialPath, hash: ""};
  const refs: Array<{current: unknown}> = [], dependencies: unknown[][] = [], pending: Array<() => void> = [];
  const calls: Array<{top: number; left: number; behavior: string}> = [];
  const exports: any = {};
  const react = {
    useRef(value: unknown) { const index = hook++; return refs[index] ||= {current: value}; },
    useLayoutEffect(effect: () => void, deps: unknown[]) {
      const index = hook++, previous = dependencies[index];
      if (!previous || deps.some((value, i) => value !== previous[i])) pending.push(effect);
      dependencies[index] = deps;
    },
  };
  vm.runInNewContext(ts.transpileModule(readFileSync('components/ScrollToTop.tsx', 'utf8'), {
    compilerOptions: {module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX},
  }).outputText, {
    exports,
    require(name: string) {
      if (name === 'react') return react;
      if (name === 'next/navigation') return {usePathname: () => pathname};
      throw new Error(`Unexpected dependency ${name}`);
    },
    window: {
      location,
      addEventListener(name: string, callback: () => void) {if (!listeners.has(name)) listeners.set(name, new Set()); listeners.get(name)!.add(callback);},
      removeEventListener(name: string, callback: () => void) {listeners.get(name)?.delete(callback);},
      scrollTo(options: {top: number; left: number; behavior: string}) {calls.push({...options}); scrollY = options.top;},
    },
  });
  return {
    calls,
    render(path = pathname) {pathname = path; location.pathname = path; hook = 0; exports.ScrollToTop();},
    hash(value: string) {location.hash = value;},
    pop(path: string) {location.pathname = path; for (const callback of listeners.get("popstate") || []) callback();},
    flush() {for (const effect of pending.splice(0)) effect();},
    move(top: number) {scrollY = top;},
    get scrollY() {return scrollY;},
  };
}

test('initial deferred effect cannot displace a pointer already on the quote link', () => {
  const app = scrollComponent();
  app.render();
  // The browser has scrolled to the native /estimate anchor for pointerdown.
  app.move(1213);
  app.flush();
  assert.equal(app.scrollY, 1213, 'Pointerup must see the same scroll position as pointerdown');
  assert.deepEqual(app.calls, []);
});

test('native initial hash and restored history positions survive initial hydration', () => {
  for (const nativePosition of [480, 860]) {
    const app = scrollComponent('/services/custom-homes');
    app.move(nativePosition);
    app.render(); app.flush();
    assert.equal(app.scrollY, nativePosition);
    assert.deepEqual(app.calls, []);
  }
});

test('later client pathname changes reset once; same pathname/search/hash renders preserve position', () => {
  const app = scrollComponent();
  app.render(); app.flush(); app.move(900);
  app.render('/estimate'); app.flush();
  assert.equal(app.scrollY, 0);
  assert.deepEqual(app.calls, [{top: 0, left: 0, behavior: 'instant'}]);
  app.move(480);
  // usePathname deliberately excludes search and hash, including native anchor jumps.
  app.render('/estimate'); app.flush();
  assert.equal(app.scrollY, 480);
  assert.equal(app.calls.length, 1);
  app.render('/services'); app.flush();
  assert.equal(app.scrollY, 0);
  assert.equal(app.calls.length, 2);
});


test('later hash navigation and browser history keep their native restoration position', () => {
  const app = scrollComponent();
  app.render(); app.flush();
  app.move(1213); app.hash('#consult'); app.render('/services'); app.flush();
  assert.equal(app.scrollY, 1213); assert.deepEqual(app.calls, []);
  app.hash(''); app.move(860); app.pop('/'); app.render('/'); app.flush();
  assert.equal(app.scrollY, 860); assert.deepEqual(app.calls, []);
  app.render('/contact'); app.flush();
  assert.equal(app.scrollY, 0); assert.equal(app.calls.length, 1);
});
