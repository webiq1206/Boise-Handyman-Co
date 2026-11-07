import assert from 'node:assert/strict';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import test from 'node:test';

/**
 * Customer-facing source must not bring back the removed claims.
 * Google Business Profile copy, the internal estimate model, and market
 * articles stay out of this scan: those files are not the published claim
 * surfaces this ruling cleaned.
 */
const SKIP_DIRS = new Set([
  'node_modules',
  '.next',
  'content',
  'costs',
  'legacy',
  'plans',
  'documents',
  'p5',
  'backlink-engine',
  'local-seo-audit',
  'docs',
  'seo-audit',
  '.agents',
  'audits',
  'tests',
  'scripts',
]);

const SKIP_FILES = new Set([
  'shared/gbpProfile.ts',
  'shared/estimateEngine.ts',
]);

const CLAIM = /\bbonded\b|\btrip fees?\b/i;

/** Placeholder from-prices and the ranges the homepage planning widget displayed. */
const WIDGET_DOLLARS = /\$145\b|\$149\b|\$199\b|\$130 to \$175|\$170 to \$230|\$215 to \$285|\$260 to \$345|\$300 to \$400|HandymanPlanningRange|proof-range-value|handyman-planning-range/i;

function walk(dir: string, hits: string[], pattern: RegExp): void {
  for (const name of readdirSync(dir)) {
    if (SKIP_DIRS.has(name)) continue;
    const path = join(dir, name);
    if (statSync(path).isDirectory()) {
      walk(path, hits, pattern);
      continue;
    }
    if (!/\.(tsx|ts|mjs|css|txt|json)$/.test(name)) continue;
    const rel = path.replace(/\\/g, '/');
    if (SKIP_FILES.has(rel)) continue;
    const text = readFileSync(path, 'utf8');
    text.split(/\n/).forEach((line, index) => {
      if (pattern.test(line)) hits.push(`${rel}:${index + 1}:${line.trim()}`);
    });
  }
}

test('removed bonded and trip-fee claims stay out of customer-facing source', () => {
  const hits: string[] = [];
  for (const root of ['app', 'components', 'shared', 'server', 'lib', 'public']) {
    walk(root, hits, CLAIM);
  }
  const area = 'shared/content/areaCopy.ts';
  readFileSync(area, 'utf8').split(/\n/).forEach((line, index) => {
    if (CLAIM.test(line)) hits.push(`${area}:${index + 1}:${line.trim()}`);
  });
  assert.deepEqual(hits, []);
});

test('the planning widget and its dollar ranges stay out of the pages and components', () => {
  const hits: string[] = [];
  for (const root of ['app', 'components']) {
    walk(root, hits, WIDGET_DOLLARS);
  }
  assert.deepEqual(hits, []);
});
