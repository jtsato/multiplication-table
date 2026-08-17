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

test.describe("Slice 2 — Math Attack", () => {
  async function startBattle(page: import("@playwright/test").Page) {
    await page.goto("/");
    await page.getByRole("button", { name: "Iniciar batalha" }).click();
    await expect(page.locator(".question")).toBeVisible();
    const text = (await page.locator(".question").innerText()) ?? "";
    const match = text.match(/(\d+)\s*×\s*(\d+)/);
    if (!match) throw new Error(`pergunta inesperada: ${text}`);
    return { a: Number(match[1]), b: Number(match[2]) };
  }

  test("acertar reduz o HP do slime e avança para a próxima pergunta", async ({ page }) => {
    const { a, b } = await startBattle(page);

    await page.getByRole("button", { name: String(a * b) }).click();

    await expect(page.getByRole("progressbar", { name: "Slime" })).toHaveAttribute(
      "aria-valuenow",
      "14",
    );
    await expect(page.getByRole("status")).toContainText("Correto");
    await expect(page.locator(".question")).toBeVisible();
    await expectNoSeriousViolations(page);
  });

  test("errar faz o monstro atacar e o herói perder HP", async ({ page }) => {
    const { a, b } = await startBattle(page);
    const answer = String(a * b);

    await page
      .getByRole("button", { name: /^\d+$/ })
      .filter({ hasNotText: answer })
      .first()
      .click();

    await expect(page.getByRole("status")).toContainText("Quase");
    await expect(page.getByRole("status")).toContainText(`${a} × ${b} = ${a * b}`);
    await expect(page.getByRole("status")).toContainText("te acertou");
    await expect(page.getByRole("progressbar", { name: "Slime" })).toHaveAttribute(
      "aria-valuenow",
      "20",
    );
    await expect(page.getByRole("progressbar", { name: "Herói" })).toHaveAttribute(
      "aria-valuenow",
      "25",
    );
  });

  test("batalha é jogável por teclado (TAB + ENTER)", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("button", { name: "Iniciar batalha" }).focus();
    await page.keyboard.press("Enter");

    await expect(page.locator(".question")).toBeVisible();

    // O título da batalha recebe o foco ao montar; TAB leva à primeira alternativa.
    await page.keyboard.press("Tab");
    const focused = await page.evaluate(() => document.activeElement?.textContent ?? "");
    expect(focused).toMatch(/^\d+$/);

    await page.keyboard.press("Enter");
    await expect(page.getByRole("status")).toContainText(/Correto|Quase/);

    // Após responder, a próxima pergunta devolve o foco à primeira alternativa.
    await expect(page.locator(".question")).toBeVisible();
    await expect
      .poll(() => page.evaluate(() => document.activeElement?.textContent ?? ""))
      .toMatch(/^\d+$/);
  });

  test("três acertos em sequência constroem o combo ×3", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("button", { name: "Iniciar batalha" }).click();

    for (let i = 0; i < 3; i += 1) {
      await expect(page.locator(".question")).toBeVisible();
      const text = (await page.locator(".question").innerText()) ?? "";
      const match = text.match(/(\d+)\s*×\s*(\d+)/);
      if (!match) throw new Error(`pergunta inesperada: ${text}`);
      await page.getByRole("button", { name: String(Number(match[1]) * Number(match[2])) }).click();
    }

    await expect(page.getByText("Combo ×3")).toBeVisible();
    await expect(page.getByRole("progressbar", { name: "Slime" })).toHaveAttribute(
      "aria-valuenow",
      "2",
    );
  });

  test("golden path: três acertos, super ataque, vitória e jogar novamente", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("button", { name: "Iniciar batalha" }).click();

    for (let i = 0; i < 3; i += 1) {
      await expect(page.locator(".question")).toBeVisible();
      const text = (await page.locator(".question").innerText()) ?? "";
      const match = text.match(/(\d+)\s*×\s*(\d+)/);
      if (!match) throw new Error(`pergunta inesperada: ${text}`);
      await page.getByRole("button", { name: String(Number(match[1]) * Number(match[2])) }).click();
    }

    await expect(page.getByRole("button", { name: "Super Ataque" })).toBeVisible();
    await page.getByRole("button", { name: "Super Ataque" }).click();

    await expect(page.getByRole("progressbar", { name: "Slime" })).toHaveAttribute(
      "aria-valuenow",
      "0",
    );
    await expect(page.getByRole("heading", { level: 3, name: "Vitória!" })).toBeVisible();
    await expect(page.getByText("Você derrotou o Slime!")).toBeVisible();
    await expectNoSeriousViolations(page);

    await page.getByRole("button", { name: "Jogar novamente" }).click();

    await expect(page.getByRole("progressbar", { name: "Slime" })).toHaveAttribute(
      "aria-valuenow",
      "20",
    );
    await expect(page.locator(".question")).toBeVisible();
  });

  test("seis erros derrotam o herói e mostram a tela de derrota", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("button", { name: "Iniciar batalha" }).click();

    for (let i = 0; i < 6; i += 1) {
      await expect(page.locator(".question")).toBeVisible();
      const text = (await page.locator(".question").innerText()) ?? "";
      const match = text.match(/(\d+)\s*×\s*(\d+)/);
      if (!match) throw new Error(`pergunta inesperada: ${text}`);
      const answer = String(Number(match[1]) * Number(match[2]));
      await page
        .getByRole("button", { name: /^\d+$/ })
        .filter({ hasNotText: answer })
        .first()
        .click();
    }

    await expect(page.getByRole("heading", { level: 3, name: "Derrota!" })).toBeVisible();
    await expect(page.getByRole("progressbar", { name: "Herói" })).toHaveAttribute(
      "aria-valuenow",
      "0",
    );
    await expectNoSeriousViolations(page);
  });
});
