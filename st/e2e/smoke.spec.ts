import { expect, test } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    indexedDB.deleteDatabase("lojinha-maluca");
  });
});

test("creates a player and starts the first shop day", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Quem vai jogar?" })).toBeVisible();
  await page.getByRole("button", { name: /criar novo jogador/i }).click();
  await page.getByLabel(/como você quer ser chamado/i).fill("Lojista Pixel");
  await page.getByRole("button", { name: "Começar" }).click();
  await expect(page.getByRole("heading", { name: "Livraria" })).toBeVisible();
  await page.getByRole("button", { name: "Começar dia" }).click();
  await expect(page.getByText(/Cliente 1 de [56]/)).toBeVisible();
});

test("profile selection has no automated axe violations", async ({ page }) => {
  await page.goto("/");
  const results = await new AxeBuilder({ page }).analyze();
  expect(results.violations).toEqual([]);
});
