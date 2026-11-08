// R03 guard: we say we answer, never how fast. Owner instruction (8 November 2026):
// "Please also make sure that we mention that we answer (do not say within one
// business day on any site)". This fails on any inquiry-response time promise in
// source or in built pages, after normalizing whitespace and JSX string splits so a
// phrase broken across lines or `{" "}` joins cannot slip past.
//
// Deliberately NOT matched (they are not response promises): the 24-hour
// cancellation notice in the terms, the paid "Priority: within 2 business days"
// scheduling tier, rate-limit "wait a few minutes" messages, cron/digest age
// buckets and how-to durations in guides.
//
// Run directly (prebuild) for the source scan; scripts/verify-shared-claims.mjs
// (postbuild) imports it and also scans every built HTML document.
import {readFileSync, readdirSync, statSync} from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

export const PROHIBITED_RESPONSE_PHRASES = [
  /\b(?:one|1|next|a|the same)[- ]business[- ]day\b/i,
  /\bbusiness[- ]day to (?:reply|respond|answer|call)/i,
  /\b(?:we|we'll|we will|our team|the team|someone)\b[^.<]{0,60}\b(?:reply|replies|respond|responds|answer|answers|call|calls|get back|gets back|follow up|follows up|reach out|reaches out)\b[^.<]{0,40}\b(?:within|inside|in under) (?:24|twenty[- ]four|48|\d+) hours?\b/i,
  /\b24[- ]hour (?:reply|response|callback|call back|turnaround)/i,
  /\b(?:reply|replies|respond|responds|response|answer|answers|call you back|get back to you|hear back)\b[^.<]{0,40}\bin (?:a |one |a few |\d+ )?minutes?\b/i,
  /\banswers? most questions in a minute\b/i,
  /\b(?:reply|respond|answer|call back)s? (?:fast|quickly|right away|immediately)\b/i,
  /\bsame[- ]day (?:reply|response|callback|call back)\b/i,
  /\bfor faster help\b/i,
];

/** Collapse whitespace and JSX `{" "}` joins so split phrases read as one line. */
export function normalizeForClaims(text) {
  return text.replace(/\{\s*(["'`])\s*\1\s*\}/g, ' ').replace(/\s+/g, ' ');
}

export function findResponsePromises(text) {
  const flat = normalizeForClaims(text);
  const hits = [];
  for (const re of PROHIBITED_RESPONSE_PHRASES) {
    const m = flat.match(re);
    if (m) hits.push(flat.slice(Math.max(0, m.index - 60), m.index + m[0].length + 40));
  }
  return hits;
}

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
// Customer-facing and conditional source: pages, components, shared copy, emails,
// assistant tools/prompts, generated llms files and the stored GBP copy.
const SOURCE_DIRS = ['app', 'components', 'shared', 'server', 'lib', 'hooks', 'content', 'public', 'local-seo-audit'];
const SOURCE_EXT = /\.(?:ts|tsx|js|jsx|mjs|cjs|json|md|txt|html|xml)$/;

function walk(dir) {
  let out = [];
  for (const entry of readdirSync(dir, {withFileTypes: true})) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === 'node_modules' || entry.name.startsWith('.')) continue;
      out = out.concat(walk(full));
    } else if (SOURCE_EXT.test(entry.name) && statSync(full).size < 5_000_000) {
      out.push(full);
    }
  }
  return out;
}

export function scanSource() {
  const failures = [];
  let files = 0;
  for (const dir of SOURCE_DIRS) {
    const abs = path.join(ROOT, dir);
    try { statSync(abs); } catch { continue; }
    for (const file of walk(abs)) {
      files++;
      for (const hit of findResponsePromises(readFileSync(file, 'utf8'))) {
        failures.push(`${path.relative(ROOT, file)}: ...${hit}...`);
      }
    }
  }
  return {files, failures};
}

// D2 (owner decision, 8 November 2026): no "bonded" claim anywhere in public
// source or built pages. "Insured" and the registration number stay.
export const PROHIBITED_CLAIM_PHRASES = [/\bbonded\b/i];

export function findProhibitedClaims(text) {
  const flat = normalizeForClaims(text);
  const hits = [];
  for (const re of PROHIBITED_CLAIM_PHRASES) {
    const m = flat.match(re);
    if (m) hits.push(flat.slice(Math.max(0, m.index - 60), m.index + m[0].length + 40));
  }
  return hits;
}

export function scanSourceClaims() {
  const failures = [];
  let files = 0;
  for (const dir of SOURCE_DIRS) {
    const abs = path.join(ROOT, dir);
    try { statSync(abs); } catch { continue; }
    for (const file of walk(abs)) {
      files++;
      for (const hit of findProhibitedClaims(readFileSync(file, 'utf8'))) {
        failures.push(`${path.relative(ROOT, file)}: ...${hit}...`);
      }
    }
  }
  return {files, failures};
}

export function scanBuiltClaims(dir = path.join(ROOT, '.next/server/app')) {
  const failures = [];
  const files = walk(dir).filter((f) => f.endsWith('.html'));
  for (const file of files) {
    const text = readFileSync(file, 'utf8').replace(/<!--[\s\S]*?-->/g, ' ');
    for (const hit of findProhibitedClaims(text)) failures.push(`${path.relative(ROOT, file)}: ...${hit}...`);
  }
  return {files: files.length, failures};
}

export function scanBuiltDocuments(dir = path.join(ROOT, '.next/server/app')) {
  const failures = [];
  const files = walk(dir).filter((f) => f.endsWith('.html'));
  for (const file of files) {
    const text = readFileSync(file, 'utf8').replace(/<!--[\s\S]*?-->/g, ' ');
    for (const hit of findResponsePromises(text)) failures.push(`${path.relative(ROOT, file)}: ...${hit}...`);
  }
  return {files: files.length, failures};
}

function selfTest() {
  const mustCatch = [
    'We reply within one business day.',
    'We call you back within one\n  business day.',
    'call you back within{" "}one business day',
    'We respond within 24 hours.',
    'The team will call you back within 2 hours.',
    'A quick call or text answers most questions in a minute.',
    'We reply in minutes during business hours.',
    '1 business day to reply',
    'texts get answered inside a business day',
    'For faster help, call us.',
  ];
  const mustPass = [
    'Cancellation of scheduled services requires 24-hour advance notice',
    'Priority: Within 2 business days',
    'Please wait a few minutes before trying again.',
    'Respond to all reviews within 48 hours',
    'please contact us within 48 hours and we will work to address your concerns',
    'We answer your questions and help you work out the next step.',
    'Anti-tip straps install into a stud in minutes.',
  ];
  for (const s of mustCatch) if (!findResponsePromises(s).length) throw new Error(`guard missed: ${s}`);
  for (const s of ['Bonded & insured', 'We are bonded, and insured.', 'licensed, bonded{" "}and insured']) {
    if (!findProhibitedClaims(s).length) throw new Error(`bonded guard missed: ${s}`);
  }
  for (const s of ['Insured; certificate on request.', 'Idaho Registered Contractor #8381215 and insured']) {
    if (findProhibitedClaims(s).length) throw new Error(`bonded guard false positive: ${s}`);
  }
  for (const s of mustPass) if (findResponsePromises(s).length) throw new Error(`guard false positive: ${s}`);
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  selfTest();
  const {files, failures} = scanSource();
  if (failures.length) {
    console.error(`Response-time promises found (R03: say we answer, never how fast):\n${failures.join('\n')}`);
    process.exit(1);
  }
  console.log(`Response language verified: ${files} source files carry no inquiry-response time promise.`);
  const claims = scanSourceClaims();
  if (claims.failures.length) {
    console.error(`"Bonded" claims found (D2: say insured and registered, never bonded):\n${claims.failures.join('\n')}`);
    process.exit(1);
  }
  console.log(`Claim language verified: ${claims.files} source files carry no "bonded" claim.`);
}
