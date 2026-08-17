import { expect, test } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

async function expectNoSeriousViolations(page: import("@playwright/test").Page) {
  const results = await new AxeBuilder({ page }).analyze();
  const serious = results.violations.filter(
    (violation) => violation.impact === "critical" || violation.impact === "serious",
  );
  expect(serious, JSON.stringify(serious, null, 2)).toEqual([]);
}

test.describe("Slice 0 — Foundation", () => {
  test("aplicação abre em pt-BR, troca de idioma e persiste no reload", async ({ page }) => {
    await page.goto("/");

    await expect(page.getByRole("heading", { level: 1, name: "Batalha da Tabuada" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Português" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );

    await page.getByRole("button", { name: "English" }).click();

    await expect(page.getByRole("heading", { level: 1, name: "Times Table Battle" })).toBeVisible();
    await expect(page.getByRole("button", { name: "English" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );

    await page.reload();

    await expect(page.getByRole("heading", { level: 1, name: "Times Table Battle" })).toBeVisible();
  });

  test("não há violações serious/critical de acessibilidade na tela inicial", async ({ page }) => {
    await page.goto("/");
    await expectNoSeriousViolations(page);
  });
});

test.describe("Slice 1 — Battle Shell", () => {
  test("inicia a batalha, mostra o slime com HP e mantém acessibilidade", async ({ page }) => {
    await page.goto("/");

    await page.getByRole("button", { name: "Iniciar batalha" }).click();

    await expect(page.getByRole("heading", { level: 2, name: "Batalha" })).toBeVisible();
    await expect(page.getByRole("progressbar", { name: "Slime" })).toHaveAttribute(
      "aria-valuenow",
      "20",
    );
    await expect(page.getByRole("progressbar", { name: "Herói" })).toHaveAttribute(
      "aria-valuenow",
      "30",
    );
    await expect(page.getByRole("status")).toContainText("Um Slime selvagem apareceu!");
    await expect(page.getByText("20 / 20")).toBeVisible();

    await expectNoSeriousViolations(page);
  });
});
