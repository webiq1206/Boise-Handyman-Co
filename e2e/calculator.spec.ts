import { test, expect, type Page } from "@playwright/test";

/**
 * Handyman estimator wizard: the flows worth proving end to end.
 *
 * Three job types are exercised: a fixed-task category with quantities
 * (electrical), a category with the supply-run and urgency options in play
 * (plumbing), and the free-text "something else" path. The lead POST is
 * stubbed so the suite runs without email or database credentials.
 */

const scrollToCalculator = async (page: Page) => {
  await page.goto("/estimate");
  await page.locator("#calculator").scrollIntoViewIfNeeded();
};

const stubLeadEndpoint = async (page: Page) => {
  await page.route("**/api/estimate-lead", (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ success: true }),
    }),
  );
};

const fillContact = async (page: Page) => {
  await page.locator('[data-testid="input-name"]').fill("Test Homeowner");
  await page.locator('[data-testid="input-email"]').fill("homeowner@example.com");
  await page.locator('[data-testid="input-city"]').selectOption({ label: "Boise" });
};

test.use({ viewport: { width: 390, height: 844 } });

test.describe("Handyman estimator wizard", () => {
  test("electrical flow: quantity stepper moves the range and submits a lead", async ({ page }) => {
    await stubLeadEndpoint(page);
    await scrollToCalculator(page);

    // Step 1: picking a job type auto-advances to the task list.
    await page.locator('[data-testid="job-card-electrical-repairs"]').click();
    await expect(page.locator('[data-testid="step-tasks"]')).toBeVisible();

    // Step 2: select outlets and raise the quantity.
    await page.locator('[data-testid="task-card-electrical-outlet-switch"]').click();
    await expect(page.locator('[data-testid="qty-value-electrical-outlet-switch"]')).toHaveText("1");
    await page.locator('[data-testid="qty-plus-electrical-outlet-switch"]').click();
    await page.locator('[data-testid="qty-plus-electrical-outlet-switch"]').click();
    await expect(page.locator('[data-testid="qty-value-electrical-outlet-switch"]')).toHaveText("3");
    await page.locator('[data-testid="wizard-continue"]').click();

    // Step 3: materials and timing are both required before Continue enables.
    await expect(page.locator('[data-testid="step-details"]')).toBeVisible();
    await expect(page.locator('[data-testid="wizard-continue"]')).toBeDisabled();
    await page.locator('[data-testid="materials-customer"]').click();
    await page.locator('[data-testid="urgency-standard"]').click();
    await page.locator('[data-testid="wizard-continue"]').click();

    // Step 4: the estimate range and breakdown are visible.
    await expect(page.locator('[data-testid="estimate-range"]')).toBeVisible();
    await expect(page.locator('[data-testid="estimate-line-trip-fee"]')).toBeVisible();
    await expect(page.locator('[data-testid="estimate-line-labor"]')).toBeVisible();
    await expect(page.locator('[data-testid="rate-disclaimer"]')).toContainText(
      "written quote",
    );

    await fillContact(page);
    await page.locator('[data-testid="wizard-continue"]').click();
    await expect(page.locator('[data-testid="estimate-success"]')).toBeVisible();
  });

  test("plumbing flow: supply run and priority scheduling appear as lines", async ({ page }) => {
    await stubLeadEndpoint(page);
    await scrollToCalculator(page);

    await page.locator('[data-testid="job-card-plumbing-repairs"]').click();
    await page.locator('[data-testid="task-card-plumbing-faucet-swap"]').click();
    await page.locator('[data-testid="task-card-plumbing-toilet-repair"]').click();
    await page.locator('[data-testid="wizard-continue"]').click();

    await page.locator('[data-testid="materials-we-pick-up"]').click();
    await page.locator('[data-testid="urgency-priority"]').click();
    await page.locator('[data-testid="wizard-continue"]').click();

    // The choices show up as their own lines in the breakdown.
    await expect(page.locator('[data-testid="estimate-line-supply-run"]')).toBeVisible();
    await expect(page.locator('[data-testid="estimate-line-urgency"]')).toContainText("+15%");

    await fillContact(page);
    await page.locator('[data-testid="wizard-continue"]').click();
    await expect(page.locator('[data-testid="estimate-success"]')).toBeVisible();
  });

  test("something-else flow: description and size are required, then price a range", async ({ page }) => {
    await stubLeadEndpoint(page);
    await scrollToCalculator(page);

    await page.locator('[data-testid="job-card-something-else"]').click();
    await expect(page.locator('[data-testid="step-tasks"]')).toBeVisible();

    // No description yet: Continue stays disabled.
    await expect(page.locator('[data-testid="wizard-continue"]')).toBeDisabled();

    await page
      .locator('[data-testid="input-other-description"]')
      .fill("Back gate sags and the doorbell is dead");
    // Description alone is not enough; a size guess is required too.
    await expect(page.locator('[data-testid="wizard-continue"]')).toBeDisabled();
    await page.locator('[data-testid="other-size-medium"]').click();
    await expect(page.locator('[data-testid="wizard-continue"]')).toBeEnabled();
    await page.locator('[data-testid="wizard-continue"]').click();

    await page.locator('[data-testid="materials-customer"]').click();
    await page.locator('[data-testid="urgency-emergency"]').click();
    await page.locator('[data-testid="wizard-continue"]').click();

    await expect(page.locator('[data-testid="estimate-range"]')).toBeVisible();
    await expect(page.locator('[data-testid="estimate-line-urgency"]')).toContainText("+30%");

    // Back preserves every answer.
    await page.locator('[data-testid="wizard-back"]').click();
    await expect(page.locator('[data-testid="urgency-emergency"]')).toHaveAttribute(
      "data-selected",
      "true",
    );
    await page.locator('[data-testid="wizard-continue"]').click();

    await fillContact(page);
    await page.locator('[data-testid="wizard-continue"]').click();
    await expect(page.locator('[data-testid="estimate-success"]')).toBeVisible();
  });

  test("contact step validates before submitting", async ({ page }) => {
    await stubLeadEndpoint(page);
    await scrollToCalculator(page);

    await page.locator('[data-testid="job-card-drywall-repair"]').click();
    await page.locator('[data-testid="task-card-drywall-small-patch"]').click();
    await page.locator('[data-testid="wizard-continue"]').click();
    await page.locator('[data-testid="materials-customer"]').click();
    await page.locator('[data-testid="urgency-standard"]').click();
    await page.locator('[data-testid="wizard-continue"]').click();

    // Continue is disabled until name, email and city are present.
    await expect(page.locator('[data-testid="wizard-continue"]')).toBeDisabled();
    await page.locator('[data-testid="input-name"]').fill("Test Homeowner");
    await expect(page.locator('[data-testid="wizard-continue"]')).toBeDisabled();
    await page.locator('[data-testid="input-email"]').fill("homeowner@example.com");
    await expect(page.locator('[data-testid="wizard-continue"]')).toBeDisabled();
    await page.locator('[data-testid="input-city"]').selectOption({ label: "Meridian" });
    await expect(page.locator('[data-testid="wizard-continue"]')).toBeEnabled();
  });
});
