#!/usr/bin/env node
/**
 * Build-time IndexNow payload. Git is available here and is not available in
 * the deployed image, so the changed URL list is written into the build output.
 * This script never calls IndexNow.
 */
import { execSync } from 'node:child_process';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { urlsForChangedFiles } from './indexnow-lib.mjs';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');

function git(args) {
  try {
    return execSync(`git ${args}`, { cwd: root, stdio: ['ignore', 'pipe', 'ignore'] }).toString().trim();
  } catch {
    return '';
  }
}

function main() {
  const sha = process.env.INDEXNOW_SHA || git('rev-parse HEAD') || 'unknown';
  const names = git('diff --name-only HEAD~1 HEAD');
  const files = names ? names.split('\n').filter(Boolean) : [];
  let redirects = [];
  let noindex = [];
  try {
    const index = JSON.parse(readFileSync(path.join(root, 'shared/cityServiceIndex.json'), 'utf8'));
    redirects = index.redirects ?? [];
    noindex = index.noindex ?? [];
  } catch {
    redirects = [];
    noindex = [];
  }
  const payload = {
    sha,
    urls: sha === 'unknown' ? [] : urlsForChangedFiles(files, { redirects, noindex }),
  };
  const json = `${JSON.stringify(payload, null, 2)}\n`;
  const destinations = [
    path.join(root, '.next/indexnow-deploy.json'),
    path.join(root, '.next/standalone/indexnow-deploy.json'),
  ];
  for (const destination of destinations) {
    mkdirSync(path.dirname(destination), { recursive: true });
    writeFileSync(destination, json);
  }
  console.log(`[IndexNow] prepared sha=${sha} urls=${payload.urls.length}`);
}

try {
  main();
} catch (error) {
  console.warn(`[IndexNow] prepare skipped: ${error instanceof Error ? error.message : 'unknown'}`);
}
