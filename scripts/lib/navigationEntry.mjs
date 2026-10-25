// Follow the site's actual entry path before running the shared estimator assertions.
export async function enterEstimator(page, {route, brand, parent}) {
  if (parent) return;
  if (['boise-remodeling-co','remodeling'].includes(brand) && route === '/') {
    await page.locator('a[href="/#calculator"]').first().click();
    await page.locator('#calculator').first().scrollIntoViewIfNeeded();
  } else if (route === '/') {
    await page.locator('#calculator').first().scrollIntoViewIfNeeded();
  }
}
