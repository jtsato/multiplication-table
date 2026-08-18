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
  test("inicia a batalha, mostra o vingador com HP e mantém acessibilidade", async ({ page }) => {
    await page.goto("/");

    await page.getByRole("button", { name: "Iniciar aventura" }).click();

    await expect(page.getByRole("heading", { level: 2, name: "Batalha" })).toBeVisible();
    await expect(page.getByRole("progressbar", { name: "Zangado" })).toHaveAttribute(
      "aria-valuenow",
      "20",
    );
    await expect(page.getByRole("progressbar", { name: "Guerreiro" })).toHaveAttribute(
      "aria-valuenow",
      "3",
    );
    await expect(page.getByRole("status")).toContainText("Um Zangado selvagem apareceu!");
    await expect(page.getByText("20 / 20")).toBeVisible();

    await expectNoSeriousViolations(page);
  });
});

test.describe("Avatar e Mapas", () => {
  test("seleciona Elfa, personaliza a cor e inicia no mapa da tabuada do 2", async ({ page }) => {
    await page.goto("/");

    await page.getByRole("button", { name: /Elfa/ }).click();
    await page.getByRole("button", { name: "Azul" }).click();
    await page.getByRole("button", { name: "Iniciar aventura" }).click();

    await expect(page.getByRole("heading", { level: 2, name: "Batalha" })).toBeVisible();
    await expect(page.getByRole("progressbar", { name: "Elfa" })).toHaveAttribute(
      "aria-valuemax",
      "3",
    );
    await expect(page.locator(".battle-map-info")).toContainText("Mapa 1 de 9");
    await expect(page.locator(".map-background--meadow")).toBeVisible();
    await expect(page.getByRole("img", { name: "Coruja" })).toBeVisible();
    await expectNoSeriousViolations(page);
  });
});

test.describe("Slice 2 — Math Attack", () => {
  async function startBattle(page: import("@playwright/test").Page) {
    await page.goto("/");
    await page.getByRole("button", { name: "Iniciar aventura" }).click();
    await expect(page.locator(".question")).toBeVisible();
    const text = (await page.locator(".question").innerText()) ?? "";
    const match = text.match(/(\d+)\s*×\s*(\d+)/);
    if (!match) throw new Error(`pergunta inesperada: ${text}`);
    return { a: Number(match[1]), b: Number(match[2]) };
  }

  /** Espera a pergunta voltar a ficar interativa (após o feedback do turno). */
  async function waitForInteractiveQuestion(page: import("@playwright/test").Page) {
    await expect(page.locator(".alternative:not(:disabled)").first()).toBeVisible();
  }

  test("acertar reduz o HP do vingador e avança para a próxima pergunta", async ({ page }) => {
    const { a, b } = await startBattle(page);

    await page.getByRole("button", { name: String(a * b) }).click();

    await expect(page.getByRole("progressbar", { name: "Zangado" })).toHaveAttribute(
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
    await expect(page.getByRole("progressbar", { name: "Zangado" })).toHaveAttribute(
      "aria-valuenow",
      "20",
    );
    await expect(page.getByRole("progressbar", { name: "Guerreiro" })).toHaveAttribute(
      "aria-valuenow",
      "2",
    );
  });

  test("batalha é jogável por teclado (TAB + ENTER)", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("button", { name: "Iniciar aventura" }).focus();
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
    await page.getByRole("button", { name: "Iniciar aventura" }).click();

    for (let i = 0; i < 3; i += 1) {
      await waitForInteractiveQuestion(page);
      await expect(page.locator(".question")).toBeVisible();
      const text = (await page.locator(".question").innerText()) ?? "";
      const match = text.match(/(\d+)\s*×\s*(\d+)/);
      if (!match) throw new Error(`pergunta inesperada: ${text}`);
      await page.getByRole("button", { name: String(Number(match[1]) * Number(match[2])) }).click();
    }

    await expect(page.getByText("Combo ×3")).toBeVisible();
    await expect(page.getByRole("progressbar", { name: "Zangado" })).toHaveAttribute(
      "aria-valuenow",
      "2",
    );
  });

  test("golden path: quatro acertos, XP, vitória e jogar novamente", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("button", { name: "Iniciar aventura" }).click();

    for (let i = 0; i < 4; i += 1) {
      await waitForInteractiveQuestion(page);
      await expect(page.locator(".question")).toBeVisible();
      const text = (await page.locator(".question").innerText()) ?? "";
      const match = text.match(/(\d+)\s*×\s*(\d+)/);
      if (!match) throw new Error(`pergunta inesperada: ${text}`);
      await page.getByRole("button", { name: String(Number(match[1]) * Number(match[2])) }).click();
    }

    await expect(page.getByRole("progressbar", { name: "Zangado" })).toHaveAttribute(
      "aria-valuenow",
      "0",
    );
    await expect(page.getByRole("heading", { level: 3, name: "Vitória!" })).toBeVisible();
    await expect(page.getByText("Você derrotou o Zangado!")).toBeVisible();
    await expect(page.getByText("XP da batalha: 70")).toBeVisible();
    await expect(page.getByText("XP total: 70")).toBeVisible();
    await expect(page.getByRole("button", { name: "Super Ataque" })).not.toBeVisible();
    await expectNoSeriousViolations(page);

    await page.getByRole("button", { name: "Jogar novamente" }).click();

    // Progressão: o próximo combate é contra a Tita, a Dragãozinha.
    await expect(page.getByRole("progressbar", { name: "Tita, a Dragãozinha" })).toHaveAttribute(
      "aria-valuenow",
      "26",
    );
    await expect(page.locator(".question")).toBeVisible();
  });

  test("progressão: derrotar o Zangado avança para Tita no próximo combate", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("button", { name: "Iniciar aventura" }).click();

    for (let i = 0; i < 4; i += 1) {
      await waitForInteractiveQuestion(page);
      await expect(page.locator(".question")).toBeVisible();
      const text = (await page.locator(".question").innerText()) ?? "";
      const match = text.match(/(\d+)\s*×\s*(\d+)/);
      if (!match) throw new Error(`pergunta inesperada: ${text}`);
      await page.getByRole("button", { name: String(Number(match[1]) * Number(match[2])) }).click();
    }
    await expect(page.getByRole("heading", { level: 3, name: "Vitória!" })).toBeVisible();

    await page.getByRole("button", { name: "Jogar novamente" }).click();

    await expect(page.getByRole("progressbar", { name: "Tita, a Dragãozinha" })).toHaveAttribute(
      "aria-valuenow",
      "26",
    );
    await expect(page.getByText(/Tita, a Dragãozinha apareceu/)).toBeVisible();

    // O save persiste a progressão: reload continua no dragão.
    await page.reload();
    await expect(page.getByRole("progressbar", { name: "Tita, a Dragãozinha" })).toHaveAttribute(
      "aria-valuenow",
      "26",
    );
    await expectNoSeriousViolations(page);
  });

  test("três erros derrotam o herói e mostram a tela de derrota", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("button", { name: "Iniciar aventura" }).click();

    for (let i = 0; i < 3; i += 1) {
      await waitForInteractiveQuestion(page);
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
    await expect(page.getByRole("progressbar", { name: "Guerreiro" })).toHaveAttribute(
      "aria-valuenow",
      "0",
    );
    await expectNoSeriousViolations(page);
  });
});

test.describe("Slice 7 — Save Game", () => {
  test("a batalha continua após o reload (estado permanece)", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("button", { name: "Iniciar aventura" }).click();

    // Um acerto: vingador 20 → 14.
    await expect(page.locator(".question")).toBeVisible();
    const text = (await page.locator(".question").innerText()) ?? "";
    const match = text.match(/(\d+)\s*×\s*(\d+)/);
    if (!match) throw new Error(`pergunta inesperada: ${text}`);
    await page.getByRole("button", { name: String(Number(match[1]) * Number(match[2])) }).click();
    await expect(page.getByRole("progressbar", { name: "Zangado" })).toHaveAttribute(
      "aria-valuenow",
      "14",
    );

    await page.reload();

    // Auto-resume: volta para a batalha com o estado salvo.
    await expect(page.getByRole("heading", { level: 2, name: "Batalha" })).toBeVisible();
    await expect(page.getByRole("progressbar", { name: "Zangado" })).toHaveAttribute(
      "aria-valuenow",
      "14",
    );
    await expect(page.locator(".question")).toBeVisible();
    await expectNoSeriousViolations(page);
  });
});

test.describe("Slice 9 — Adaptive Review", () => {
  test("erros ficam registrados no save para o reforço adaptativo", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("button", { name: "Iniciar aventura" }).click();

    await expect(page.locator(".question")).toBeVisible();
    const text = (await page.locator(".question").innerText()) ?? "";
    const match = text.match(/(\d+)\s*×\s*(\d+)/);
    if (!match) throw new Error(`pergunta inesperada: ${text}`);
    const a = Number(match[1]);
    const b = Number(match[2]);
    const resposta = String(a * b);

    // Responder errado: o fato deve ganhar erros no histórico salvo.
    await page
      .getByRole("button", { name: /^\d+$/ })
      .filter({ hasNotText: resposta })
      .first()
      .click();
    await expect(page.getByRole("status")).toContainText("Quase");

    const save = await page.evaluate(() => {
      const raw = window.localStorage.getItem("batalha-da-tabuada.save") ?? "{}";
      return JSON.parse(raw) as {
        facts: { a: number; b: number; attempts: number; errors: number }[];
      };
    });
    const fato =
      save.facts.find((f) => f.a === a && f.b === b) ??
      save.facts.find((f) => f.a === b && f.b === a);
    expect(fato).toBeDefined();
    expect(fato?.errors).toBeGreaterThanOrEqual(1);

    // O erro persiste após o reload (reforço continua na próxima sessão).
    await page.reload();
    const save2 = await page.evaluate(() => {
      const raw = window.localStorage.getItem("batalha-da-tabuada.save") ?? "{}";
      return JSON.parse(raw) as { facts: { a: number; b: number; errors: number }[] };
    });
    const fato2 =
      save2.facts.find((f) => f.a === a && f.b === b) ??
      save2.facts.find((f) => f.a === b && f.b === a);
    expect(fato2?.errors).toBeGreaterThanOrEqual(1);
  });
});
