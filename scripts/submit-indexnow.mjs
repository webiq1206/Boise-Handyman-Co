#!/usr/bin/env node
/**
 * Post-deploy IndexNow ping. Runs from start.sh after the server is listening.
 * Cold starts of a deploy that already submitted this SHA do nothing.
 * CI and pull-request builds never reach the network: isPostDeploy() is false
 * unless REPLIT_DEPLOYMENT=1 or INDEXNOW_POST_DEPLOY=1.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { isPostDeploy, planSubmit } from './indexnow-lib.mjs';

const INDEXNOW_KEY = process.env.INDEXNOW_KEY ?? '9e89d20492d96d9f284ac07ca15508f1';
const HOST = process.env.HOST ?? 'boisehandyman.co';
const KEY_LOCATION = process.env.KEY_LOCATION ?? `https://${HOST}/${INDEXNOW_KEY}.txt`;
const STATE_FILE = process.env.INDEXNOW_STATE_FILE ?? path.join(process.cwd(), '.indexnow-state.json');

function readJson(file) {
  try {
    return JSON.parse(readFileSync(file, 'utf8'));
  } catch {
    return null;
  }
}

function loadPayload() {
  const candidates = [
    process.env.INDEXNOW_PAYLOAD,
    path.join(process.cwd(), '.next/standalone/indexnow-deploy.json'),
    path.join(process.cwd(), '.next/indexnow-deploy.json'),
    path.join(process.cwd(), 'indexnow-deploy.json'),
  ].filter(Boolean);
  for (const file of candidates) {
    const payload = readJson(file);
    if (payload && payload.sha) return payload;
  }
  return null;
}

async function main() {
  if (!isPostDeploy(process.env)) {
    console.log('[IndexNow] skipped: not a production deploy');
    return;
  }
  const payload = loadPayload();
  const state = readJson(STATE_FILE);
  const result = await planSubmit({
    env: process.env,
    payload: payload
      ? { ...payload, host: HOST, key: INDEXNOW_KEY, keyLocation: KEY_LOCATION }
      : null,
    state,
    fetchImpl: (url, init) => fetch(url, init),
  });
  if (result.log) console.log(result.log);
  if (result.nextState && result.nextState !== state) {
    try {
      writeFileSync(STATE_FILE, `${JSON.stringify(result.nextState)}\n`);
    } catch (error) {
      console.warn(`[IndexNow] could not record sha: ${error instanceof Error ? error.message : 'unknown'}`);
    }
  }
}

main().catch((error) => {
  console.error(`[IndexNow] Error: ${error instanceof Error ? error.message : 'unknown'}`);
  process.exitCode = 0;
});
