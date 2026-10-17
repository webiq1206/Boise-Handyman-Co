import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { SITE_CONFIG } from '../shared/siteConfig.ts';
import { TEXT_REPLY_HOURS, TEXT_REPLY_LINE, TEXT_SMS_HREF } from '../shared/textReply.ts';

const REPLY =
  /reply within one\s+business day|respond within one business day|reach out within one business day|Response within one business day|Replies within one business day|reply to every new request within one business day|will call within one business day|call you back within one business day/gi;

function walk(dir: string, out: string[]) {
  for (const name of readdirSync(dir)) {
    if (name === 'node_modules' || name === '.next' || name === 'seo-audit' || name === 'local-seo-audit' || name.startsWith('.')) continue;
    const path = join(dir, name);
    if (statSync(path).isDirectory()) walk(path, out);
    else if (/\.(ts|tsx)$/.test(name) && !/\.test\.ts$/.test(name)) out.push(path);
  }
}

test('the prefer-to-text hours stay in one constant', () => {
  assert.equal(TEXT_REPLY_HOURS, 'Mon–Fri 9–6, Sat 9–4 MT');
  assert.equal(SITE_CONFIG.phone, '(208) 477-1169');
  assert.equal(
    TEXT_REPLY_LINE,
    'Prefer to text? Text (208) 477-1169. We reply in minutes during business hours (Mon–Fri 9–6, Sat 9–4 MT).',
  );
  assert.equal(TEXT_SMS_HREF, 'sms:+12084771169');
  const component = readFileSync('components/PreferToTextLine.tsx', 'utf8');
  assert.ok(component.includes('TEXT_SMS_HREF'));
  assert.ok(component.includes('TEXT_REPLY_HOURS'));
  assert.equal(component.includes('Sat 9–4'), false);
});

test('every one-business-day reply line keeps that line and is followed by the text line', () => {
  const files: string[] = [];
  walk('.', files);
  const misses: string[] = [];
  let hits = 0;
  for (const file of files) {
    const text = readFileSync(file, 'utf8');
    for (const match of text.matchAll(REPLY)) {
      hits += 1;
      const start = match.index ?? 0;
      const after = text.slice(start, start + match[0].length + 1200);
      if (!/Prefer to text\?|PreferToTextLine|TEXT_REPLY_LINE/.test(after)) {
        misses.push(`${file}: ${match[0]}`);
      }
    }
  }
  assert.ok(hits > 0, 'expected reply lines');
  assert.deepEqual(misses, []);
});
