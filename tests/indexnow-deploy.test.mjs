import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { isPostDeploy, planSubmit, urlsForChangedFiles, formatLog } from '../scripts/indexnow-lib.mjs';

const index = {
  redirects: [{ source: '/services/drywall-repair/boise', destination: '/services/drywall-repair' }],
  noindex: [],
};

test('IndexNow does not post from CI or a pull request build', () => {
  assert.equal(isPostDeploy({ CI: 'true', REPLIT_DEPLOYMENT: '1' }), false);
  assert.equal(isPostDeploy({ GITHUB_ACTIONS: 'true', REPLIT_DEPLOYMENT: '1' }), false);
  assert.equal(isPostDeploy({ GITHUB_EVENT_NAME: 'pull_request', REPLIT_DEPLOYMENT: '1' }), false);
  assert.equal(isPostDeploy({}), false);
  assert.equal(isPostDeploy({ REPLIT_DEPLOYMENT: '1' }), true);
});

test('a changed redirect config pings the source and the target only', () => {
  const urls = urlsForChangedFiles(['next.config.js'], index);
  assert.ok(urls.includes('https://boisehandyman.co/services/drywall-repair/boise'));
  assert.ok(urls.includes('https://boisehandyman.co/services/drywall-repair'));
  assert.equal(urls.some((url) => url.endsWith('/services/drywall-repair/kuna')), false);
});

test('a cold start of a SHA that was already submitted does not post', async () => {
  let called = false;
  const result = await planSubmit({
    env: { REPLIT_DEPLOYMENT: '1' },
    payload: { sha: 'abc', urls: ['https://boisehandyman.co/'], key: 'k', keyLocation: 'https://boisehandyman.co/k.txt' },
    state: { sha: 'abc' },
    fetchImpl: async () => {
      called = true;
      return { status: 200 };
    },
  });
  assert.equal(called, false);
  assert.equal(result.log, formatLog({ sha: 'abc', submitted: 0, status: 'skip' }));
});

test('a production deploy posts changed URLs and logs the status line', async () => {
  let body = '';
  const result = await planSubmit({
    env: { INDEXNOW_POST_DEPLOY: '1' },
    payload: {
      sha: 'def',
      urls: ['https://boisehandyman.co/llms.txt'],
      key: 'k',
      keyLocation: 'https://boisehandyman.co/k.txt',
    },
    state: { sha: 'older' },
    fetchImpl: async (_url, init) => {
      body = init.body;
      return { status: 202 };
    },
  });
  assert.equal(result.action, 'submitted');
  assert.equal(result.log, '[IndexNow] sha=def submitted=1 status=202');
  assert.equal(result.nextState.sha, 'def');
  assert.match(body, /llms\.txt/);
});

test('start.sh pings only after the server is backgrounded, and dev does not', () => {
  const start = readFileSync(new URL('../start.sh', import.meta.url), 'utf8');
  const dev = readFileSync(new URL('../dev-start.sh', import.meta.url), 'utf8');
  assert.match(start, /\(sleep 5 && node scripts\/submit-indexnow\.mjs\) &/);
  assert.match(start, /node \.next\/standalone\/server\.js/);
  assert.doesNotMatch(dev, /submit-indexnow/);
  const workflows = readFileSync(new URL('../package.json', import.meta.url), 'utf8');
  assert.match(workflows, /prepare-indexnow\.mjs/);
  assert.doesNotMatch(workflows, /submit-indexnow/);
});
