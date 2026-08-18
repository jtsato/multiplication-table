import type { MultiplicationFact } from "../domain/math/facts";
import type { Customer, Product, StoreDefinition } from "../content/stores";
import type { AchievementDefinition } from "../domain/game/achievementCatalog";
import type { DailyObjective } from "../domain/game/objectives";

export type UserLocale =
  "pt-BR" | "en-US" | "es-ES" | "fr-FR" | "de-DE" | "ja-JP" | "ko-KR" | "zh-CN";

/**
 * Gênero gramatical do substantivo. `n` (neutro) existe por causa do alemão,
 * que tem três; os idiomas sem gênero simplesmente ignoram o campo.
 */
export type Gender = "m" | "f" | "n";

/**
 * Formas de um produto num idioma.
 *
 * `one`/`many` não dão para derivar por regra (revista→revistas mas
 * pincel→pincéis, Buch→Bücher), então ficam escritas. Idiomas latinos usam
 * `gender`; japonês, coreano e chinês não têm plural nem gênero, mas exigem um
 * `counter` (classificador) que muda conforme o formato do objeto — 鉛筆3本,
 * 本3冊, ボール3個. Cada idioma preenche o que a sua gramática pede.
 */
export type NounForms = {
  one: string;
  many: string;
  gender?: Gender;
  counter?: string;
};

/**
 * As regras que transformam `NounForms` em frase. Cada idioma implementa do
 * jeito que a sua gramática exige — inclusive a ordem, já que em chinês o
 * classificador vem antes do substantivo e em japonês vem depois.
 */
export type LocaleGrammar = {
  /** "3 réguas" · "3 rulers" · "定規3本" · "3支铅笔" */
  counted: (quantity: number, forms: NounForms) => string;
  /** "Quantas réguas?" · "How many rulers?" · "定規は何本？" */
  howMany: (forms: NounForms) => string;
  /** "cada uma" · "each one" · "1つあたり" */
  each: (forms: NounForms) => string;
};

/**
 * Textos da interface. Só dados: nada aqui é função, para que um idioma novo
 * seja um arquivo de tradução e não um ramo de código.
 *
 * Os campos com `{{marcador}}` são modelos interpolados em `getLocalizedStrings`.
 */
export type AppStrings = {
  // App shell
  skipToContent: string;
  loading: string;
  errorTitle: string;
  retry: string;
  storageError: string;
  saveError: string;
  createError: string;
  updateNotice: string;
  updateButton: string;

  brandTag: string;
  appName: string;
  lead: string;

  // Criação de perfil
  back: string;
  firstStep: string;
  createProfile: string;
  nicknameLabel: string;
  nicknamePlaceholder: string;
  chooseStore: string;
  chooseStyle: string;
  personalAvatar: string;
  quickSettings: string;
  start: string;
  reduceMotion: string;
  largeText: string;
  styleLabels: Record<"sunrise" | "ocean" | "garden", string>;
  mascotKindLabel: string;
  mascotColorLabel: string;
  mascotKinds: Record<"antenna" | "cap" | "crown" | "bow" | "leaf", string>;
  mascotColors: Record<"orange" | "mint" | "berry" | "sky" | "grape" | "sun", string>;

  // Visão geral da loja
  yourShop: string;
  cashLabel: string;
  dayLabel: string;
  chapterLabel: string;
  ready: string;
  readyDescription: string;
  objectiveOptional: string;
  completed: string;
  storeAchievements: string;
  startDay: string;
  storeActionsLabel: string;
  menuShop: string;
  menuAchievements: string;
  menuSettings: string;
  resetTitle: string;
  resetDescription: string;
  resetButton: string;
  resetConfirmQuestion: string;
  resetConfirm: string;
  resetCancel: string;

  todayLabel: string;
  nextGoal: string;
  goShopping: string;
  allProductsOwned: string;

  // Avisos
  dayClosedPrefix: string;
  cannotAffordProduct: string;
  productPurchased: string;
  cannotAffordCosmetic: string;
  cosmeticPurchased: string;

  // Jogo
  backToShop: string;
  backToShopLabel: string;
  seeAccount: string;
  howMany: string;
  separateProducts: string;
  removeProduct: string;
  addProduct: string;
  qaTitle: string;
  answersLabel: string;
  wrongAnswer: string;
  useFullAnswer: string;
  tryAgain: string;
  answerAccepted: string;
  nextCustomer: string;
  seeCloseout: string;

  // Fechamento do dia
  finishedDay: string;
  storeSummary: string;
  summaryText: string;
  saveCash: string;

  // Conquistas
  achievementsEyebrow: string;
  achievements: string;
  achievementsDescription: string;
  achievementUnlocked: string;
  achievementLocked: string;

  // Catálogo
  catalog: string;
  productsNew: string;
  catalogDescription: string;
  productPrice: string;
  available: string;
  buyFor: string;
  decor: string;
  decorDescription: string;
  inCollection: string;
  cosmeticNames: Record<string, string>;

  // Configurações
  settingsEyebrow: string;
  settings: string;
  accessibility: string;
  highContrast: string;
  audioAndNarration: string;
  audioEffects: string;
  narration: string;
  saveSettings: string;
};

/**
 * Frases montadas com valores. Ficam separadas de `AppStrings` porque no bundle
 * final elas viram funções com o mesmo nome — deixá-las no mesmo tipo faria a
 * intersecção virar `string & (...) => string`, que nada satisfaz.
 */
export type MessageTemplates = {
  /** Como o dinheiro é escrito. `"R$ {{value}}"` · `"${{value}}"` */
  moneyFormat: string;
  /** `"Diorama da {{store}}"` */
  dioramaLabel: string;
  /** `"Você já tem dinheiro para comprar {{product}} por {{price}}!"` */
  canBuyNow: string;
  /** `"Faltam {{missing}} para comprar {{product}}."` */
  missingAmount: string;
  /** `"Saldo insuficiente. Faltam {{missing}} para comprar {{product}}."` */
  purchaseUnavailable: string;
  /** `"{{prefix}} {{money}} entraram no caixa."` */
  dayClosedNotice: string;
  /** `"Muito bem! {{quantity}} vezes {{price}} e igual a {{answer}}."` */
  narrateCorrect: string;
  /** `"Vamos tentar de novo. {{hint}}"` */
  narrateRetry: string;
  /** `"Cliente {{current}} de {{total}}"` */
  customerCounter: string;
  /** `"{{name}} chegou"` */
  customerArrived: string;
  /** O pedido é partido em dois para o meio ficar em `<strong>`. */
  customerWantsBefore: string;
  customerWantsAfter: string;
  /** `"{{counted}}, e {{each}} custa {{price}}."` */
  unitExplain: string;
  /** `"{{selected}} de {{total}} produtos separados"` */
  quantityPileLabel: string;
  /** `"{{selected}} de {{total}} separados"` */
  quantityProgress: string;
  /** `"✓ {{money}} — certo!"` */
  correctAnswer: string;
  /** Dica de nível 1: só aponta para onde olhar. */
  hintLevel1: string;
  /** Dica de nível 2: `"{{quantity}} produtos · {{price}} cada"` */
  hintLevel2: string;
};

/**
 * Conteúdo do jogo (lojas, produtos, clientes, conquistas, objetivos).
 *
 * O conteúdo canônico é escrito em pt-BR dentro dos módulos de domínio; só as
 * traduções que se afastam dele moram aqui, com as mesmas chaves de id, para o
 * domínio continuar sem encanamento de idioma. Por isso pt-BR não tem tabela.
 */
export type ContentTranslations = {
  stores: Record<string, { name: string; tagline: string }>;
  products: Record<string, string>;
  customerPhrases: Record<string, string>;
  achievements: Record<string, { title: string; description: string }>;
  objectives: Record<string, { title: string; description: string }>;
};

/** Tudo o que um idioma precisa entregar. */
export type LocaleDefinition = {
  strings: AppStrings & MessageTemplates;
  /** Formas de cada produto neste idioma, indexadas pelo id do produto. */
  nouns: Record<string, NounForms>;
  /** Ausente em pt-BR, que usa o texto do próprio domínio. */
  content?: ContentTranslations;
};

export type LocaleBundle = AppStrings & {
  locale: UserLocale;
  money: (value: number) => string;
  dioramaLabel: (storeName: string) => string;
  dayAndChapter: (day: number, chapter: number) => string;
  cashBadgeLabel: (cash: number) => string;
  /** Liga o dinheiro ganho ao que ela pode fazer com ele. */
  canBuyNow: (productName: string, priceText: string) => string;
  missingAmount: (missingText: string, productName: string) => string;
  purchaseUnavailable: (missingText: string, productName: string) => string;
  dayClosedNotice: (revenue: number) => string;
  narrateCorrect: (quantity: number, price: number, answer: number) => string;
  narrateRetry: (hint: string) => string;
  customerCounter: (current: number, total: number) => string;
  customerArrived: (name: string) => string;
  /** Partido para os itens pedidos manterem o <strong> na marcação. */
  customerWants: (
    quantity: number,
    product: Product,
  ) => { before: string; emphasis: string; after: string };
  quantityQuestion: (product: Product) => string;
  /** Diz em texto o que o desenho das unidades mostra: quantos itens e o preço de cada um. */
  unitExplain: (quantity: number, product: Product, priceText: string) => string;
  quantityPileLabel: (selected: number, total: number) => string;
  quantityProgress: (selected: number, total: number) => string;
  equation: (quantity: number, price: number) => string;
  correctAnswer: (answer: number) => string;
  priceLine: (price: number) => string;
  buyForLabel: (cost: number) => string;
  hintText: (fact: MultiplicationFact, errorCount: number) => string;
  storeText: (store: StoreDefinition) => { name: string; tagline: string };
  productName: (product: Product) => string;
  customerPhrase: (customer: Customer) => string;
  achievementText: (achievement: AchievementDefinition) => {
    title: string;
    description: string;
  };
  objectiveText: (objective: DailyObjective) => { title: string; description: string };
  cosmeticName: (id: string, fallback: string) => string;
};
