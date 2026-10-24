import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import ts from 'typescript';

const root = process.cwd();
const read = (file: string) => readFileSync(path.join(root, file), 'utf8');
const inventory: { route: string; file: string; seoSignature: string }[] = JSON.parse(read('docs/interior-route-audit.json'));
const printer = ts.createPrinter({ removeComments: true });

function seoSignature(source: string, file: string) {
  const tree = ts.createSourceFile(file, source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  const nodes: string[] = [];
  function visit(node: ts.Node) {
    const protectedFunction = ts.isFunctionDeclaration(node) && ['generateMetadata', 'generateStaticParams'].includes(node.name?.text ?? '');
    const metadata = ts.isVariableStatement(node) && node.declarationList.declarations.some(d => d.name.getText(tree) === 'metadata');
    const schema = ts.isCallExpression(node) && /^(generate\w*Schema|buildPageMetadata|catalogMetadata|catalogDescription)$/.test(node.expression.getText(tree));
    if (protectedFunction || metadata || schema) nodes.push(printer.printNode(ts.EmitHint.Unspecified, node, tree).replace(/\s+/g, ' '));
    ts.forEachChild(node, visit);
  }
  visit(tree);
  return createHash('sha256').update(JSON.stringify(nodes.sort())).digest('hex');
}

for (const entry of inventory) {
  test(`${entry.route}: interior layout and preserved SEO contract`, () => {
    const source = read(entry.file);
    assert.match(source, /<InteriorPage\b/);
    assert.equal(seoSignature(source, entry.file), entry.seoSignature, 'Intentional SEO changes require reviewing and updating the route audit.');
  });
}

test('interior CSS follows the original family and system layers', () => {
  const source = read('app/layout.tsx');
  const styles = [...source.matchAll(/import ['"](.+\.css)['"]/g)].map(match => match[1]);
  for (const layer of ['./family.css', './approved-system.css', './approved-interiors.css', './audit-accessibility.css']) assert.ok(styles.includes(layer), layer);
  assert.ok(styles.indexOf('./family.css') < styles.indexOf('./approved-system.css'));
  assert.ok(styles.indexOf('./approved-system.css') < styles.indexOf('./approved-interiors.css'));
  assert.ok(styles.indexOf('./approved-interiors.css') < styles.indexOf('./audit-accessibility.css'), 'accessibility corrections override the presentation layers');
});

test('contact hero quote request points at the contact form, ahead of the visit link', () => {
  const source = read('app/contact/page.tsx');
  const about = read('app/about/page.tsx');
  const stats = read('shared/siteContent.ts');
  assert.match(source, /interior-contact-actions[\s\S]*?<InteriorEstimateLink\s+label="Request a quote"\s+href="\/contact#consult"\s*\/>[\s\S]*?href="#consult"/);
  assert.doesNotMatch(source, /href="\/estimate"/);
  assert.match(read('components/approved/InteriorLayout.tsx'), /href='\/estimate'/);
  for (const phrase of ['Instant online estimate', '60 sec', 'Get my online estimate', 'online estimator']) {
    assert.equal(about.includes(phrase), false, `about: ${phrase}`);
    assert.equal(source.includes(phrase), false, `contact: ${phrase}`);
  }
  assert.match(stats, /label: "Planning range after photos"/);
  assert.match(stats, /num: "Upfront quote"/);
  assert.doesNotMatch(stats, /Instant online estimate|60 sec/);
  assert.match(source, /Send photos and your task list for a preliminary planning range, then get a firm upfront quote\. Nothing is scheduled until you approve\./);
  assert.match(source, /Send your task list with photos for an upfront quote, or call or text our team to explore a range for your repair, install, or maintenance job\./);
});
