import { expect, test } from "@playwright/test";

test("external mode hides demo controls by default", async ({ page }) => {
  await page.context().clearCookies();
  await page.addInitScript(() => {
    window.localStorage.clear();
    window.sessionStorage.clear();
  });

  await page.goto("/");

  await expect(page.locator('[data-testid="home-page"]')).toBeVisible();
  await expect(page.locator('[data-testid="demo-mode-panel"]')).toHaveCount(0);
  await expect(page.getByText("演示视频脚本")).toHaveCount(0);
});

test("demo mode is explicitly available through query", async ({ page }) => {
  await page.context().clearCookies();
  await page.addInitScript(() => {
    window.localStorage.clear();
    window.sessionStorage.clear();
  });

  await page.goto("/?mode=demo");

  await expect(page.locator('[data-testid="home-page"]')).toBeVisible();
  await expect(page.locator('[data-testid="demo-mode-panel"]')).toBeVisible();
  await expect(page.getByText("演示视频脚本")).toBeVisible();
});

