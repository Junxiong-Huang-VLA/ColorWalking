import { expect, test } from "@playwright/test";

test("mobile main flow keeps lamb alive and completes waitlist closure", async ({ page }) => {
  await page.goto("/?demo=1&internal=1");
  await expect(page.locator("#hero-stage .live-xyj")).toBeVisible();

  await page.locator(".home-life-draw").click();
  await expect(page.locator(".home-stage-memory")).not.toBeEmpty();
  await expect(page.locator(".home-life-color-line small")).toContainText("#");

  await page.locator(".home-life-start").click();
  await expect(page).toHaveURL(/\/lucky-color/);
  await expect(page.locator(".lucky-live-stage .live-xyj")).toBeVisible();

  await page.locator(".lucky-main-actions .cta").click();
  await page.locator(".lucky-main-actions button").nth(1).click();
  await expect(page.locator(".lucky-feedback-line")).not.toBeEmpty();

  await page.locator(".lucky-soft-links a").first().click();
  await expect(page).toHaveURL(/\/future/);
  await expect(page.locator(".growth-stage .live-xyj")).toBeVisible();

  await page.locator(".waitlist-conversion-form input[autocomplete='name']").fill("Mobile E2E");
  await page.locator(".waitlist-conversion-form input[type='email']").fill(`mobile+${Date.now()}@example.com`);
  await page.locator(".waitlist-submit").click();
  await expect(page.locator(".waitlist-followup")).toBeVisible({ timeout: 20000 });

  await page.locator(".growth-soft-links a[href*='/about']").click({ force: true });
  await expect(page).toHaveURL(/\/about/);
  await expect(page.locator(".memory-page .live-xyj")).toBeVisible();
});
