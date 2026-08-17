import { expect, test, type Page } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    if (!sessionStorage.getItem("lojinha-e2e-reset")) {
      indexedDB.deleteDatabase("lojinha-maluca");
      sessionStorage.setItem("lojinha-e2e-reset", "done");
    }
  });
});

async function createPlayer(page: Page): Promise<void> {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Quem vai jogar?" })).toBeVisible();
  await page.getByRole("button", { name: /criar novo jogador/i }).click();
  await page.getByLabel(/como você quer ser chamado/i).fill("Lojista Pixel");
  await page.getByRole("button", { name: "Começar" }).click();
  await expect(page.getByRole("heading", { name: "Livraria" })).toBeVisible();
}

async function openQuestion(page: Page): Promise<void> {
  const startQuestion = page.getByRole("button", { name: "Ver a conta" });
  if (await startQuestion.count()) {
    await startQuestion.click();
  } else {
    const addProduct = page.getByRole("button", { name: "Adicionar produto" });
    for (let attempt = 0; attempt < 10 && !(await page.getByRole("heading", { name: "Quanto devo cobrar?" }).count()); attempt += 1) {
      await addProduct.click();
    }
  }
  await expect(page.getByRole("heading", { name: "Quanto devo cobrar?" })).toBeVisible();
}

test("creates a player and starts the first shop day", async ({ page }) => {
  await createPlayer(page);
  await page.getByRole("button", { name: "Começar dia" }).click();
  await expect(page.getByText(/Cliente 1 de [56]/)).toBeVisible();
});

const WCAG_TAGS = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"];

async function expectNoViolations(page: Page, screen: string): Promise<void> {
  const results = await new AxeBuilder({ page }).withTags(WCAG_TAGS).analyze();
  expect(results.violations, `${screen}: ${results.violations.map((violation) => violation.id).join(", ")}`).toEqual([]);
}

test("profile selection has no automated axe violations", async ({ page }) => {
  await page.goto("/");
  const results = await new AxeBuilder({ page }).analyze();
  expect(results.violations).toEqual([]);
});

test("every screen passes the automated WCAG 2.2 AA checks", async ({ page }) => {
  await page.goto("/");
  await expectNoViolations(page, "profile selection");

  await page.getByRole("button", { name: /criar novo jogador/i }).click();
  await expectNoViolations(page, "profile creation");

  await page.getByLabel(/como você quer ser chamado/i).fill("Lojista Pixel");
  await page.getByRole("button", { name: "Começar" }).click();
  await expect(page.getByRole("heading", { name: "Livraria" })).toBeVisible();
  await expectNoViolations(page, "store overview");

  await page.getByRole("button", { name: "Produtos novos" }).click();
  await expect(page.getByRole("heading", { name: "Produtos novos" })).toBeVisible();
  await expectNoViolations(page, "shop");

  await page.getByRole("button", { name: /Voltar para a loja/ }).click();
  await page.getByRole("button", { name: "Conquistas" }).click();
  await expectNoViolations(page, "achievements");

  await page.getByRole("button", { name: /Voltar para a loja/ }).click();
  await page.getByRole("button", { name: "Configurações" }).click();
  await expectNoViolations(page, "settings");

  await page.getByRole("button", { name: /Voltar para a loja/ }).click();
  await page.getByRole("button", { name: "Começar dia" }).click();
  await expect(page.getByText(/Cliente 1 de [56]/)).toBeVisible();
  await expectNoViolations(page, "gameplay");
});

/**
 * SC 2.5.8 is new in WCAG 2.2 and axe does not check it. Checkboxes are measured
 * through their wrapping label, which is the actual clickable target.
 */
async function expectTargetSizes(page: Page, screen: string): Promise<void> {
  const targets = page.locator("button:visible, a:visible, select:visible, label.check-row:visible");
  const boxes = await targets.evaluateAll((elements) =>
    elements.map((element) => {
      const { width, height } = element.getBoundingClientRect();
      return { label: element.textContent?.trim().slice(0, 30) ?? "", width, height };
    }),
  );
  expect(boxes.length, `${screen} has no interactive targets`).toBeGreaterThan(0);
  const tooSmall = boxes.filter((box) => box.width < 24 || box.height < 24);
  expect(tooSmall, `${screen} targets under 24x24`).toEqual([]);
}

test("interactive targets meet the WCAG 2.2 minimum size", async ({ page }) => {
  await page.goto("/");
  await expectTargetSizes(page, "profile selection");

  await page.getByRole("button", { name: /criar novo jogador/i }).click();
  await expectTargetSizes(page, "profile creation");

  await page.getByLabel(/como você quer ser chamado/i).fill("Lojista Pixel");
  await page.getByRole("button", { name: "Começar" }).click();
  await expect(page.getByRole("heading", { name: "Livraria" })).toBeVisible();
  await expectTargetSizes(page, "store overview");

  await page.getByRole("button", { name: "Configurações" }).click();
  await expect(page.getByRole("heading", { name: "Configurações" })).toBeVisible();
  await expectTargetSizes(page, "settings");

  await page.getByRole("button", { name: /Voltar para a loja/ }).click();
  await page.getByRole("button", { name: "Começar dia" }).click();
  await openQuestion(page);
  await expectTargetSizes(page, "gameplay");
});

test("renders the English locale end to end", async ({ browser }) => {
  const context = await browser.newContext({ locale: "en-US" });
  const page = await context.newPage();

  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Who is playing?" })).toBeVisible();
  await expect(page.locator("html")).toHaveAttribute("lang", "en-US");

  await page.getByRole("button", { name: /create new player/i }).click();
  await page.getByLabel(/what would you like to be called/i).fill("Pixel Shopkeeper");
  await page.getByRole("button", { name: "Start" }).click();

  await expect(page.getByRole("heading", { name: "Bookshop" })).toBeVisible();
  await expect(page.getByLabel("Balance $120")).toBeVisible();
  await page.getByRole("button", { name: "Start day" }).click();
  await expect(page.getByText(/Customer 1 of [56]/)).toBeVisible();
  await expectNoViolations(page, "english gameplay");

  await context.close();
});

test("shows progressive hints after an incorrect answer", async ({ page }) => {
  await createPlayer(page);
  await page.getByRole("button", { name: "Começar dia" }).click();
  await openQuestion(page);

  const [quantity, price] = (await page.locator(".equation-context").textContent() ?? "").match(/\d+/g)!.map(Number);
  const correctAnswer = quantity * price;
  const labels = await page.locator(".answer-button").allTextContents();
  const wrongIndex = labels.findIndex((label) => Number(label.replace(/\D/g, "")) !== correctAnswer);
  await page.locator(".answer-button").nth(wrongIndex).click();
  await expect(page.getByRole("status")).toContainText("Ainda não fechou");
  const firstHint = await page.locator(".hint-box p").textContent();

  await page.getByRole("button", { name: "Tentar de novo" }).click();
  await page.locator(".answer-button").nth(wrongIndex).click();
  await expect(page.locator(".hint-box p")).not.toHaveText(firstHint ?? "");
});

test("persists a purchased expansion in the store", async ({ page }) => {
  await createPlayer(page);
  await page.getByRole("button", { name: "Produtos novos" }).click();
  await expect(page.getByLabel("Saldo R$ 120")).toBeVisible();
  await page.getByRole("button", { name: "Comprar por R$ 80" }).first().click();
  await page.getByRole("button", { name: /Voltar para a loja/ }).click();
  await expect(page.getByRole("status")).toContainText("Produto novo");
  await expect(page.locator(".expansion-blocks span")).toHaveCount(1);
});

test("keeps the player available after a refresh", async ({ page }) => {
  await createPlayer(page);
  await page.reload();
  await expect(page.getByRole("heading", { name: "Quem vai jogar?" })).toBeVisible();
  await expect(page.getByRole("button", { name: /Lojista Pixel/ })).toBeVisible();
});

test("shows optional store achievements", async ({ page }) => {
  await createPlayer(page);
  await page.getByRole("button", { name: "Conquistas" }).click();
  await expect(page.getByRole("heading", { name: "Conquistas" })).toBeVisible();
  await expect(page.getByText("Primeiro dia")).toBeVisible();
  await expect(page.getByText("Em descoberta")).toHaveCount(3);
});

test("opens from the cached app shell while offline", async ({ page, context }) => {
  await createPlayer(page);
  await page.reload();
  await expect(page.getByRole("heading", { name: "Quem vai jogar?" })).toBeVisible();
  await page.waitForFunction(() => Boolean(navigator.serviceWorker?.controller));
  await context.setOffline(true);
  await page.reload();
  await expect(page.getByRole("button", { name: /Lojista Pixel/ })).toBeVisible();
});
