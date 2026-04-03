import { expect, test } from "@playwright/test";

test.afterEach(async ({ request }, testInfo) => {
  const status = testInfo.status === "passed" ? "passed" : "failed";
  await request.post("http://127.0.0.1:8787/api/e2e/runs", {
    data: {
      suite: "investor-demo-baseline",
      status,
      note: `playwright:${testInfo.title}`
    }
  });
});

test("investor demo flow closes loop with persisted waitlist and bridge output", async ({ page, request }) => {
  await page.goto("/?demo=1&internal=1");
  await expect(page.locator("#hero-stage .live-xyj")).toBeVisible();

  await page.getByRole("button", { name: "抽取今日幸运色" }).click();
  await expect(page.locator(".home-stage-memory")).toContainText("你", { timeout: 12000 });

  await page.getByRole("button", { name: "摸摸头" }).click();
  await page.getByRole("link", { name: "进入完整互动页" }).click();
  await expect(page).toHaveURL(/lucky-color/);

  await page.getByRole("button", { name: "抽取今日幸运色" }).click();
  await page.getByRole("link", { name: "下一步：去看关系成长" }).click();
  await expect(page).toHaveURL(/future/);

  await page.locator(".waitlist-conversion-form input[autocomplete='name']").fill("E2E Investor");
  await page.locator(".waitlist-conversion-form input[type='email']").fill(`e2e+${Date.now()}@example.com`);
  await page.locator(".waitlist-submit").click();
  await expect(page.locator(".waitlist-status-line")).toContainText("上传成功", { timeout: 20000 });

  await page.locator(".closure-readiness-panel summary").click();
  await expect(page.locator(".closure-score")).toContainText("/ 8");
  await expect(page.locator(".closure-json")).toContainText("\"trigger\"");

  const waitlistResp = await request.get("http://127.0.0.1:8787/api/waitlist?limit=1");
  expect(waitlistResp.ok()).toBeTruthy();
  const waitlistJson = (await waitlistResp.json()) as { waitlist: Array<{ status: string }> };
  expect(waitlistJson.waitlist[0]?.status).toBe("success");

  const bridgeResp = await request.get("http://127.0.0.1:8787/api/bridge/outputs?limit=1");
  expect(bridgeResp.ok()).toBeTruthy();
  const bridgeJson = (await bridgeResp.json()) as { outputs: Array<{ trigger: string }> };
  expect(bridgeJson.outputs[0]?.trigger).toBeTruthy();
});
