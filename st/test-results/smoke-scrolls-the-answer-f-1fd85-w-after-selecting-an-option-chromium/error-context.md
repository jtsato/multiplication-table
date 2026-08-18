# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: smoke.spec.ts >> scrolls the answer feedback into view after selecting an option
- Location: e2e\smoke.spec.ts:216:1

# Error details

```
Error: expect(received).toBe(expected) // Object.is equality

Expected: true
Received: false

Call Log:
- Timeout 5000ms exceeded while waiting on the predicate
```

# Page snapshot

```yaml
- generic [ref=e3]:
  - link "Pular para o conteúdo" [ref=e4] [cursor=pointer]:
    - /url: "#main-content"
  - main [ref=e5]:
    - generic [ref=e6]:
      - button "Voltar para a loja" [ref=e7] [cursor=pointer]: × Voltar para a loja
      - generic [ref=e8]: Cliente 1 de 5
      - generic [ref=e9]:
        - generic [ref=e10]:
          - generic [ref=e11]: Saldo
          - strong [ref=e12]: R$ 120
        - generic [ref=e13]:
          - generic [ref=e14]: Hoje
          - strong [ref=e15]: R$ 0
    - generic [ref=e36]:
      - paragraph [ref=e37]: Caio chegou
      - heading "Preciso de materiais para uma atividade." [level=1] [ref=e38]
      - paragraph [ref=e39]:
        - text: Quero
        - strong [ref=e40]: 4 livros
        - text: .
    - generic [ref=e48]:
      - generic [ref=e49]:
        - generic [ref=e50]: R$ 7
        - generic [ref=e57]: R$ 7
        - generic [ref=e64]: R$ 7
        - generic [ref=e71]: R$ 7
      - paragraph [ref=e78]: 4 livros, e cada um custa R$ 7.
      - paragraph [ref=e79]: 4 × R$ 7
      - heading "Quanto devo cobrar?" [level=2] [ref=e80]
      - group "Alternativas de resposta" [ref=e81]:
        - button "R$ 49" [disabled] [ref=e82]
        - button "R$ 28" [disabled] [ref=e83]
        - button "R$ 16" [disabled] [ref=e84]
      - status [ref=e85]:
        - strong [ref=e86]: Ainda não fechou a conta.
        - paragraph [ref=e87]: Confira a quantidade e o preço de cada item.
        - button "Tentar de novo" [ref=e88] [cursor=pointer]
```

# Test source

```ts
  130 | });
  131 | 
  132 | /**
  133 |  * SC 2.5.8 is new in WCAG 2.2 and axe does not check it. Checkboxes are measured
  134 |  * through their wrapping label, which is the actual clickable target.
  135 |  */
  136 | async function expectTargetSizes(page: Page, screen: string): Promise<void> {
  137 |   const targets = page.locator("button:visible, a:visible, select:visible, label.check-row:visible");
  138 |   const boxes = await targets.evaluateAll((elements) =>
  139 |     elements.map((element) => {
  140 |       const { width, height } = element.getBoundingClientRect();
  141 |       return { label: element.textContent?.trim().slice(0, 30) ?? "", width, height };
  142 |     }),
  143 |   );
  144 |   expect(boxes.length, `${screen} has no interactive targets`).toBeGreaterThan(0);
  145 |   const tooSmall = boxes.filter((box) => box.width < 24 || box.height < 24);
  146 |   expect(tooSmall, `${screen} targets under 24x24`).toEqual([]);
  147 | }
  148 | 
  149 | test("interactive targets meet the WCAG 2.2 minimum size", async ({ page }) => {
  150 |   await page.goto("/");
  151 |   await expectTargetSizes(page, "profile creation");
  152 | 
  153 |   await page.getByLabel(/como você quer ser chamado/i).fill("Ana");
  154 |   await page.getByRole("button", { name: "Começar" }).click();
  155 |   await expect(page.getByRole("heading", { name: "Livraria" })).toBeVisible();
  156 |   await expectTargetSizes(page, "store overview");
  157 | 
  158 |   await page.getByRole("button", { name: "Configurações" }).click();
  159 |   await expect(page.getByRole("heading", { name: "Configurações" })).toBeVisible();
  160 |   await expectTargetSizes(page, "settings");
  161 | 
  162 |   await page.getByRole("button", { name: /Voltar para a loja/ }).click();
  163 |   await page.getByRole("button", { name: "Começar dia" }).click();
  164 |   await openQuestion(page);
  165 |   await expectTargetSizes(page, "gameplay");
  166 | });
  167 | 
  168 | test("renders the English locale end to end", async ({ browser }) => {
  169 |   const context = await browser.newContext({ locale: "en-US" });
  170 |   const page = await context.newPage();
  171 | 
  172 |   await page.goto("/");
  173 |   await expect(page.getByRole("heading", { name: "Create profile" })).toBeVisible();
  174 |   await expect(page.locator("html")).toHaveAttribute("lang", "en-US");
  175 | 
  176 |   await page.getByLabel(/what would you like to be called/i).fill("Pixel");
  177 |   await page.getByRole("button", { name: "Start" }).click();
  178 | 
  179 |   await expect(page.getByRole("heading", { name: "Bookshop" })).toBeVisible();
  180 |   await expect(page.getByLabel("Balance $120")).toBeVisible();
  181 |   await page.getByRole("button", { name: "Start day" }).click();
  182 |   await expect(page.getByText(/Customer 1 of [56]/)).toBeVisible();
  183 |   await expectNoViolations(page, "english gameplay");
  184 | 
  185 |   await context.close();
  186 | });
  187 | 
  188 | test("shows progressive hints after an incorrect answer", async ({ page }) => {
  189 |   await createPlayer(page);
  190 |   await page.getByRole("button", { name: "Começar dia" }).click();
  191 |   await openQuestion(page);
  192 | 
  193 |   const [quantity, price] = (await page.locator(".equation-context").textContent() ?? "").match(/\d+/g)!.map(Number);
  194 |   const correctAnswer = quantity * price;
  195 |   const labels = await page.locator(".answer-button").allTextContents();
  196 |   const wrongIndex = labels.findIndex((label) => Number(label.replace(/\D/g, "")) !== correctAnswer);
  197 |   await page.locator(".answer-button").nth(wrongIndex).click();
  198 |   await expect(page.getByRole("status")).toContainText("Ainda não fechou");
  199 |   const firstHint = await page.locator(".hint-box p").textContent();
  200 | 
  201 |   await page.getByRole("button", { name: "Tentar de novo" }).click();
  202 |   await page.locator(".answer-button").nth(wrongIndex).click();
  203 |   await expect(page.locator(".hint-box p")).not.toHaveText(firstHint ?? "");
  204 | });
  205 | 
  206 | test("persists a purchased expansion in the store", async ({ page }) => {
  207 |   await createPlayer(page);
  208 |   await page.getByRole("button", { name: "Novos produtos" }).click();
  209 |   await expect(page.getByLabel("Saldo R$ 120")).toBeVisible();
  210 |   await page.getByRole("button", { name: "Comprar por R$ 80" }).first().click();
  211 |   await page.getByRole("button", { name: /Voltar para a loja/ }).click();
  212 |   await expect(page.getByRole("status")).toContainText("Produto novo");
  213 |   await expect(page.locator(".expansion-blocks .product-art")).toHaveCount(1);
  214 | });
  215 | 
  216 | test("scrolls the answer feedback into view after selecting an option", async ({ page }) => {
  217 |   await page.setViewportSize({ width: 390, height: 500 });
  218 |   await createPlayer(page);
  219 |   await page.getByRole("button", { name: "Começar dia" }).click();
  220 |   await openQuestion(page);
  221 |   await page.evaluate(() => window.scrollTo({ top: 0, behavior: "auto" }));
  222 | 
  223 |   await page.locator(".answer-button").first().click();
  224 |   const feedback = page.locator(".success-box, .hint-box");
  225 |   await expect(feedback).toBeVisible();
  226 |   await expect.poll(() => page.evaluate(() => window.scrollY)).toBeGreaterThan(0);
  227 |   await expect.poll(() => feedback.evaluate((element) => {
  228 |     const rect = element.getBoundingClientRect();
  229 |     return rect.top >= 0 && rect.bottom <= window.innerHeight;
> 230 |   })).toBe(true);
      |       ^ Error: expect(received).toBe(expected) // Object.is equality
  231 | });
  232 | 
  233 | test("signals which shop purchases fit the available cash", async ({ page }) => {
  234 |   await createPlayer(page);
  235 |   await page.getByRole("button", { name: "Novos produtos" }).click();
  236 |   await expect(page.getByRole("heading", { name: "Novos produtos para a loja" })).toBeVisible();
  237 | 
  238 |   await expect(page.getByText("Pode comprar", { exact: true })).toHaveCount(5);
  239 |   const unavailableCard = page.locator(".product-card").filter({ hasText: "Falta R$ 30" });
  240 |   await expect(unavailableCard).toHaveCount(1);
  241 |   await expect(unavailableCard.getByRole("button")).toBeDisabled();
  242 | });
  243 | 
  244 | test("uses a visual child-friendly button for returning to the shop", async ({ page }) => {
  245 |   await createPlayer(page);
  246 |   await page.getByRole("button", { name: "Novos produtos" }).click();
  247 |   const backButton = page.locator("button.back-button");
  248 | 
  249 |   await expect(backButton).toContainText("Loja");
  250 |   await expect(backButton).toHaveAttribute("aria-label", "Voltar para a loja");
  251 | });
  252 | 
  253 | test("reopens the saved shop after a refresh", async ({ page }) => {
  254 |   await createPlayer(page);
  255 |   await page.getByRole("button", { name: "Novos produtos" }).click();
  256 |   await page.getByRole("button", { name: "Comprar por R$ 80" }).first().click();
  257 |   // Espera a compra aparecer na vitrine antes de recarregar: a gravação no
  258 |   // IndexedDB é assíncrona e o reload correria com ela.
  259 |   await page.getByRole("button", { name: /Voltar para a loja/ }).click();
  260 |   await expect(page.locator(".expansion-blocks .product-art")).toHaveCount(1);
  261 |   await page.reload();
  262 | 
  263 |   await expect(page.getByRole("heading", { name: "Livraria" })).toBeVisible();
  264 |   await expect(page.locator(".expansion-blocks .product-art")).toHaveCount(1);
  265 | });
  266 | 
  267 | test("shows optional store achievements", async ({ page }) => {
  268 |   await createPlayer(page);
  269 |   await page.getByRole("button", { name: "Conquistas" }).click();
  270 |   await expect(page.getByRole("heading", { name: "Conquistas" })).toBeVisible();
  271 |   await expect(page.getByText("Primeiro dia")).toBeVisible();
  272 |   await expect(page.getByText("Em descoberta")).toHaveCount(3);
  273 | });
  274 | 
  275 | test("opens from the cached app shell while offline", async ({ page, context }) => {
  276 |   await createPlayer(page);
  277 |   await page.reload();
  278 |   await expect(page.getByRole("heading", { name: "Livraria" })).toBeVisible();
  279 |   await page.waitForFunction(() => Boolean(navigator.serviceWorker?.controller));
  280 |   await context.setOffline(true);
  281 |   await page.reload();
  282 |   await expect(page.getByRole("heading", { name: "Livraria" })).toBeVisible();
  283 | });
  284 | 
```