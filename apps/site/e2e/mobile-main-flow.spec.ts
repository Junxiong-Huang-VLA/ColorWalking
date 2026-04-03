import { expect, test } from "@playwright/test";

test("mobile main flow closes from home to waitlist submit", async ({ page }) => {
  await page.context().clearCookies();
  await page.addInitScript(() => {
    window.localStorage.clear();
    window.sessionStorage.clear();
  });

  await page.route("**/api/waitlist", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        accepted: true,
        queuedAt: new Date().toISOString(),
        channel: "backend_relay",
        submissionId: `pw-${Date.now()}`
      })
    });
  });

  await page.goto("/");
  await expect(page.locator('[data-testid="home-page"]')).toBeVisible();
  await expect(page.getByTestId("home-draw-color")).toBeVisible();
  await expect(page.getByTestId("home-go-interaction")).toBeVisible();

  await page.getByTestId("home-draw-color").click();
  await page.getByTestId("home-go-interaction").click();

  await expect(page.locator('[data-testid="interaction-page"]')).toBeVisible();
  await page.getByTestId("interaction-event-touch_head").click();
  await page.getByTestId("interaction-chat-input").fill("今晚也想让你陪着我。");
  await page.getByTestId("interaction-chat-send").click();

  await page.getByTestId("tab-growth").click();
  await expect(page.locator('[data-testid="growth-page"]')).toBeVisible();

  await page.getByTestId("tab-memory").click();
  await expect(page.getByText("记忆沉淀")).toBeVisible();

  await page.getByTestId("tab-validation").click();
  await expect(page.locator('[data-testid="validation-page"]')).toBeVisible();

  await page.getByTestId("waitlist-join-select").selectOption("yes");
  await page.getByTestId("waitlist-contact-input").fill(`pw-mobile-${Date.now()}@example.com`);
  await page.getByTestId("waitlist-physical-select").selectOption("yes");
  await page.getByTestId("waitlist-submit").click();

  await expect(page.locator('[data-testid="survey-pill-success"]')).toBeVisible();

  await page.getByTestId("validation-back-home").click();
  await expect(page.locator('[data-testid="home-page"]')).toBeVisible();
  await expect(page.getByTestId("home-go-interaction")).toBeVisible();
});
