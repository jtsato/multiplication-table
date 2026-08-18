import { expect, test, type Locator, type Page } from "@playwright/test";
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
  await page.getByLabel(/como você quer ser chamado/i).fill("Ana");
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

/** Answers the visit on screen correctly, whatever phase it opens in. */
async function serveCurrentCustomer(page: Page): Promise<void> {
  await openQuestion(page);
  const equation = (await page.locator(".equation-context").textContent()) ?? "";
  const [quantity, price] = equation.match(/\d+/g)!.map(Number);
  const labels = await page.locator(".answer-button").allTextContents();
  const correctIndex = labels.findIndex((label) => Number(label.replace(/\D/g, "")) === quantity * price);
  expect(correctIndex, `no correct answer offered for ${equation}`).toBeGreaterThanOrEqual(0);
  await page.locator(".answer-button").nth(correctIndex).click();
  await expect(page.locator(".success-box")).toBeVisible();
}

async function renderedLineCount(locator: Locator): Promise<number> {
  return locator.evaluate((element) => {
    const range = document.createRange();
    range.selectNodeContents(element);
    return new Set(Array.from(range.getClientRects()).map((rect) => Math.round(rect.top))).size;
  });
}

test("creates a player and starts the first shop day", async ({ page }) => {
  await createPlayer(page);
  await page.getByRole("button", { name: "Começar dia" }).click();
  await expect(page.getByText(/Cliente 1 de [56]/)).toBeVisible();
});

test("moves focus to the new screen on navigation", async ({ page }) => {
  await createPlayer(page);
  // Focus lands on <body> unless the app moves it, leaving keyboard users at the
  // top of the document with nothing announced.
  await page.getByRole("button", { name: "Novos produtos" }).click();
  await expect(page.locator("#main-content")).toBeFocused();

  await page.getByRole("button", { name: /Voltar para a loja/ }).click();
  await expect(page.locator("#main-content")).toBeFocused();
  await expect(page.getByRole("heading", { name: "Livraria" })).toBeVisible();
});

test("plays a full day through to the closing summary", async ({ page }) => {
  await createPlayer(page);
  await page.getByRole("button", { name: "Começar dia" }).click();

  const counter = (await page.getByText(/Cliente 1 de [56]/).textContent()) ?? "";
  const totalCustomers = Number(counter.match(/de (\d+)/)![1]);

  for (let visit = 1; visit <= totalCustomers; visit += 1) {
    await serveCurrentCustomer(page);
    const closeout = page.getByRole("button", { name: "Ver fechamento" });
    if (await closeout.count()) {
      await closeout.click();
      break;
    }
    await page.getByRole("button", { name: "Próxima venda" }).click();
  }

  // The summary screen is only reachable by finishing a day, so nothing had covered it.
  await expect(page.getByRole("heading", { name: "Fechamento da loja" })).toBeVisible();
  const revenue = Number(((await page.locator(".summary-total").textContent()) ?? "").replace(/\D/g, ""));
  expect(revenue).toBeGreaterThan(0);
  await expectNoViolations(page, "day summary");

  await page.getByRole("button", { name: "Guardar no caixa" }).click();
  await expect(page.getByRole("status")).toContainText("Dia fechado!");
  await expect(page.getByLabel(`Saldo R$ ${120 + revenue}`)).toBeVisible();
  await expect(page.getByText("Dia 2 ·")).toBeVisible();
});

const WCAG_TAGS = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"];

async function expectNoViolations(page: Page, screen: string): Promise<void> {
  const results = await new AxeBuilder({ page }).withTags(WCAG_TAGS).analyze();
  expect(results.violations, `${screen}: ${results.violations.map((violation) => violation.id).join(", ")}`).toEqual([]);
}

test("the first screen has no automated axe violations", async ({ page }) => {
  await page.goto("/");
  const results = await new AxeBuilder({ page }).analyze();
  expect(results.violations).toEqual([]);
});

test("every screen passes the automated WCAG 2.2 AA checks", async ({ page }) => {
  await page.goto("/");
  await expectNoViolations(page, "profile creation");

  await page.getByLabel(/como você quer ser chamado/i).fill("Ana");
  await page.getByRole("button", { name: "Começar" }).click();
  await expect(page.getByRole("heading", { name: "Livraria" })).toBeVisible();
  await expectNoViolations(page, "store overview");

  await page.getByRole("button", { name: "Novos produtos" }).click();
  await expect(page.getByRole("heading", { name: "Novos produtos para a loja" })).toBeVisible();
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
  await expectTargetSizes(page, "profile creation");

  await page.getByLabel(/como você quer ser chamado/i).fill("Ana");
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
  await expect(page.getByRole("heading", { name: "Create profile" })).toBeVisible();
  await expect(page.locator("html")).toHaveAttribute("lang", "en-US");

  await page.getByLabel(/what would you like to be called/i).fill("Pixel");
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
  await page.getByRole("button", { name: "Novos produtos" }).click();
  await expect(page.getByLabel("Saldo R$ 120")).toBeVisible();
  await page.getByRole("button", { name: "Comprar por R$ 80" }).first().click();
  await page.getByRole("button", { name: /Voltar para a loja/ }).click();
  await expect(page.getByRole("status")).toContainText("Produto novo");
  await expect(page.locator(".expansion-blocks .product-art")).toHaveCount(1);
});

test("scrolls the answer feedback into view after selecting an option", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 500 });
  await createPlayer(page);
  await page.getByRole("button", { name: "Começar dia" }).click();
  await openQuestion(page);
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: "auto" }));

  await page.locator(".answer-button").first().click();
  const feedback = page.locator(".success-box, .hint-box");
  await expect(feedback).toBeVisible();
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBeGreaterThan(0);
  await expect.poll(() => feedback.evaluate((element) => {
    const rect = element.getBoundingClientRect();
    return rect.top >= 0 && rect.bottom <= window.innerHeight;
  })).toBe(true);
});

test("keeps money and navigation labels readable on a narrow screen", async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 800 });
  await createPlayer(page);
  await expect.poll(() => renderedLineCount(page.locator(".cash-badge"))).toBe(1);

  await page.getByRole("button", { name: "Novos produtos" }).click();
  await expect(page.getByRole("heading", { name: "Novos produtos para a loja" })).toBeVisible();
  await expect.poll(() => renderedLineCount(page.locator(".cash-badge"))).toBe(1);
  await expect.poll(() => renderedLineCount(page.locator(".back-button"))).toBe(1);

  await page.getByRole("button", { name: /Voltar para a loja/ }).click();
  await page.getByRole("button", { name: "Começar dia" }).click();
  await expect(page.getByText(/Cliente 1 de [56]/)).toBeVisible();
  await expect.poll(() => renderedLineCount(page.locator(".service-header .back-button"))).toBe(1);
  for (const money of await page.locator(".header-money-item strong").all()) {
    await expect.poll(() => renderedLineCount(money)).toBe(1);
  }
});

test("signals which shop purchases fit the available cash", async ({ page }) => {
  await createPlayer(page);
  await page.getByRole("button", { name: "Novos produtos" }).click();
  await expect(page.getByRole("heading", { name: "Novos produtos para a loja" })).toBeVisible();

  await expect(page.locator(".purchase-state--can")).toHaveCount(5);
  const unavailableCard = page.locator(".product-card").filter({ hasText: "Falta R$ 30" });
  await expect(unavailableCard).toHaveCount(1);
  await expect(unavailableCard.getByRole("button")).toBeDisabled();
});

test("uses a visual child-friendly button for returning to the shop", async ({ page }) => {
  await createPlayer(page);
  await page.getByRole("button", { name: "Novos produtos" }).click();
  const backButton = page.locator("button.back-button");

  await expect(backButton).toContainText("Loja");
  await expect(backButton).toHaveAttribute("aria-label", "Voltar para a loja");
});

test("reopens the saved shop after a refresh", async ({ page }) => {
  await createPlayer(page);
  await page.getByRole("button", { name: "Novos produtos" }).click();
  await page.getByRole("button", { name: "Comprar por R$ 80" }).first().click();
  // Espera a compra aparecer na vitrine antes de recarregar: a gravação no
  // IndexedDB é assíncrona e o reload correria com ela.
  await page.getByRole("button", { name: /Voltar para a loja/ }).click();
  await expect(page.locator(".expansion-blocks .product-art")).toHaveCount(1);
  await page.reload();

  await expect(page.getByRole("heading", { name: "Livraria" })).toBeVisible();
  await expect(page.locator(".expansion-blocks .product-art")).toHaveCount(1);
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
  await expect(page.getByRole("heading", { name: "Livraria" })).toBeVisible();
  await page.waitForFunction(() => Boolean(navigator.serviceWorker?.controller));
  await context.setOffline(true);
  await page.reload();
  await expect(page.getByRole("heading", { name: "Livraria" })).toBeVisible();
});
