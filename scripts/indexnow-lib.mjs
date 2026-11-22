/**
 * IndexNow helpers. The POST runs only after a production deploy is serving.
 * CI, pull-request builds, and local dev never call the API. Changed URLs are
 * computed at build time (see prepare-indexnow.mjs) so runtime does not need git.
 */

export const HOST = 'boisehandyman.co';
export const INDEXNOW_ENDPOINT = 'https://api.indexnow.org/indexnow';

const NINE_CITY_SLUGS = [
  'boise',
  'meridian',
  'nampa',
  'eagle',
  'kuna',
  'caldwell',
  'star',
  'middleton',
  'garden-city',
];

export function isPostDeploy(env = process.env) {
  if (env.CI === 'true' || env.CI === '1') return false;
  if (env.GITHUB_ACTIONS === 'true' || env.GITHUB_ACTIONS === '1') return false;
  if (env.GITHUB_EVENT_NAME === 'pull_request') return false;
  if (env.VERCEL_ENV === 'preview' || env.VERCEL_ENV === 'development') return false;
  if (env.INDEXNOW_DISABLE === '1') return false;
  return env.REPLIT_DEPLOYMENT === '1' || env.INDEXNOW_POST_DEPLOY === '1';
}

export function formatLog({ sha, submitted, status }) {
  return `[IndexNow] sha=${sha} submitted=${submitted} status=${status}`;
}

function absolute(host, pathname) {
  if (pathname === '/') return `https://${host}/`;
  return `https://${host}${pathname.startsWith('/') ? pathname : `/${pathname}`}`;
}

/**
 * Map a build-time git diff to public URLs. Redirect sources and their
 * targets are included when the redirect config itself changed.
 */
export function urlsForChangedFiles(files, { host = HOST, redirects = [], noindex = [] } = {}) {
  const urls = new Set();
  const add = (pathname) => urls.add(absolute(host, pathname));
  const list = Array.isArray(files) ? files : [];
  const indexChanged = list.some((file) =>
    file === 'next.config.js' ||
    file === 'shared/cityServiceIndex.json' ||
    file === 'lib/page-metadata.ts',
  );
  if (indexChanged) {
    for (const rule of redirects) {
      add(rule.source);
      add(rule.destination);
    }
    for (const key of noindex) add(`/services/${key}`);
  }
  for (const file of list) {
    if (file === 'public/llms.txt') add('/llms.txt');
    if (file === 'public/llms-full.txt') add('/llms-full.txt');
    if (file === 'lib/schema.ts' || file === 'shared/gbpProfile.ts' || file === 'app/page.tsx') add('/');
    if (file === 'app/terms-of-service/page.tsx') add('/terms-of-service');
    if (file === 'app/about/page.tsx') add('/about');
    if (file === 'app/areas/page.tsx') add('/areas');
    if (file === 'app/sitemap.ts' || file === 'lib/siteUrls.ts') add('/sitemap.xml');
    if (
      file === 'app/resources/ada-canyon-permit-flow/page.tsx' ||
      file === 'app/resources/ada-canyon-permit-flow/PermitFlowGraphic.tsx' ||
      file === 'shared/resourcePdfContent.ts'
    ) {
      add('/resources/ada-canyon-permit-flow');
    }
    if (file === 'shared/cityPageFacts.ts') {
      for (const slug of NINE_CITY_SLUGS) add(`/areas/${slug}`);
    }
    const guide = file.match(/^shared\/content\/pillars\/([^/]+)\.ts$/);
    if (guide) add(`/guides/${guide[1]}`);
    const post = file.match(/^shared\/content\/wave2\/([^/]+)\.ts$/);
    if (post) add(`/blog/${post[1]}`);
    const page = file.match(/^app\/(.+)\/page\.tsx$/);
    if (page && !page[1].includes('[')) add(`/${page[1]}`);
  }
  return [...urls];
}

/**
 * Decide what a post-deploy process should do. Does not touch the network.
 * `nextState` is written only after IndexNow accepts the list (200 or 202),
 * or when there is nothing to send, so a later cold start of the same SHA skips.
 */
export async function planSubmit({ env, payload, state, fetchImpl }) {
  if (!isPostDeploy(env)) {
    return { action: 'skip', reason: 'not-post-deploy', log: null, nextState: state ?? null };
  }
  if (!payload || !payload.sha) {
    return { action: 'skip', reason: 'no-payload', log: null, nextState: state ?? null };
  }
  if (state && state.sha === payload.sha) {
    return {
      action: 'skip',
      reason: 'already-submitted',
      log: formatLog({ sha: payload.sha, submitted: 0, status: 'skip' }),
      nextState: state,
    };
  }
  const urls = Array.isArray(payload.urls) ? payload.urls : [];
  if (urls.length === 0) {
    return {
      action: 'skip',
      reason: 'no-urls',
      log: formatLog({ sha: payload.sha, submitted: 0, status: 'skip' }),
      nextState: { sha: payload.sha },
    };
  }
  const response = await fetchImpl(INDEXNOW_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify({
      host: payload.host || HOST,
      key: payload.key,
      keyLocation: payload.keyLocation,
      urlList: urls,
    }),
  });
  const status = response.status;
  const accepted = status === 200 || status === 202;
  return {
    action: accepted ? 'submitted' : 'failed',
    reason: accepted ? 'accepted' : 'http',
    log: formatLog({ sha: payload.sha, submitted: urls.length, status }),
    nextState: accepted ? { sha: payload.sha } : state ?? null,
  };
}
