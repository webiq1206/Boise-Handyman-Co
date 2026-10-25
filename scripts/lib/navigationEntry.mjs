import assert from 'node:assert/strict';

// Follow the site's actual entry path before running the shared estimator assertions.
export async function enterEstimator(page, {route, brand, parent}) {
  if (parent) return;
  if (['boise-handyman-co','handyman'].includes(brand) && (route === '/' || route === '/estimate')) {
    await page.locator('#quick-request form').waitFor();
    await page.locator('a[href="/estimate?review=1"]').first().click();
    await page.waitForURL(url=>url.pathname==='/estimate'&&url.searchParams.get('review')==='1');
    const destination = new URL(page.url());
    assert.equal(destination.pathname, '/estimate');
    assert.equal(destination.searchParams.get('review'), '1');
  } else if (['boise-remodeling-co','remodeling'].includes(brand) && route === '/') {
    await page.locator('a[href="/#calculator"]').first().click();
    await page.locator('#calculator').first().scrollIntoViewIfNeeded();
  } else if (route === '/') {
    await page.locator('#calculator').first().scrollIntoViewIfNeeded();
  }
}
