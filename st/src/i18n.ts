import { getHint } from "./domain/math/hints";
import type { MultiplicationFact } from "./domain/math/facts";
import type { Customer, Product, StoreDefinition } from "./content/stores";
import type { AchievementDefinition } from "./domain/game/achievementCatalog";
import type { DailyObjective } from "./domain/game/objectives";

export type UserLocale = "pt-BR" | "en-US";

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

  // Profile creation
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

  // Store overview
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

  // Notices
  dayClosedPrefix: string;
  cannotAffordProduct: string;
  productPurchased: string;
  cannotAffordCosmetic: string;
  cosmeticPurchased: string;

  // Gameplay
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

  // Day summary
  finishedDay: string;
  storeSummary: string;
  summaryText: string;
  saveCash: string;

  // Achievements
  achievementsEyebrow: string;
  achievements: string;
  achievementsDescription: string;
  achievementUnlocked: string;
  achievementLocked: string;

  // Shop
  catalog: string;
  productsNew: string;
  catalogDescription: string;
  productPrice: string;
  available: string;
  buyFor: string;
  purchaseReady: string;
  purchaseNeedsMore: (missingText: string) => string;
  decor: string;
  decorDescription: string;
  inCollection: string;
  cosmeticNames: Record<string, string>;

  // Settings
  settingsEyebrow: string;
  settings: string;
  accessibility: string;
  highContrast: string;
  audioAndNarration: string;
  audioEffects: string;
  narration: string;
  saveSettings: string;
};

const ptBR: AppStrings = {
  skipToContent: "Pular para o conteúdo",
  loading: "Abrindo a loja...",
  errorTitle: "Ops!",
  retry: "Tentar novamente",
  storageError: "Não conseguimos abrir os jogadores salvos neste dispositivo.",
  saveError: "Não foi possível salvar esta mudança. Tente novamente.",
  createError: "Não foi possível criar o jogador. Verifique o armazenamento do navegador.",
  updateNotice: "Uma versão nova está pronta. Atualize quando terminar esta atividade.",
  updateButton: "Atualizar",

  brandTag: "Uma loja para descobrir",
  appName: "Lojinha Maluca",
  lead: "Cada compra esconde uma conta. Vamos descobrir quanto custa?",
  back: "← Voltar",
  firstStep: "Primeiro passo",
  createProfile: "Criar perfil",
  nicknameLabel: "Como você quer ser chamado na sua loja?",
  nicknamePlaceholder: "Seu apelido",
  chooseStore: "Escolha sua loja",
  chooseStyle: "Escolha o estilo da loja",
  personalAvatar: "Monte seu lojista",
  quickSettings: "Configurações rápidas",
  start: "Começar",
  reduceMotion: "Reduzir movimento",
  largeText: "Usar texto grande",
  styleLabels: { sunrise: "Amanhecer", ocean: "Oceano", garden: "Jardim" },
  mascotKindLabel: "Escolha o chapéu",
  mascotColorLabel: "Escolha a cor",
  mascotKinds: { antenna: "Antena", cap: "Boné", crown: "Coroa", bow: "Laço", leaf: "Folhinha" },
  mascotColors: { orange: "Laranja", mint: "Menta", berry: "Framboesa", sky: "Céu", grape: "Uva", sun: "Sol" },

  yourShop: "Sua loja",
  cashLabel: "Saldo",
  dayLabel: "Dia",
  chapterLabel: "Capítulo",
  ready: "Pronta para atender?",
  readyDescription: "Atenda 5 ou 6 clientes e faça sua loja crescer.",
  objectiveOptional: "Objetivo opcional",
  completed: "Concluído",
  storeAchievements: "Conquistas da loja",
  startDay: "Começar dia",
  storeActionsLabel: "Ações da loja",
  menuShop: "Novos produtos",
  menuAchievements: "Conquistas",
  menuSettings: "Configurações",
  resetTitle: "Recomeçar",
  resetDescription: "Apaga a loja atual e começa tudo de novo, do zero.",
  resetButton: "Recomeçar do zero",
  resetConfirmQuestion: "Tem certeza? A loja atual será apagada.",
  resetConfirm: "Sim, apagar tudo",
  resetCancel: "Não, continuar jogando",

  todayLabel: "Hoje",
  nextGoal: "Próxima meta",
  goShopping: "Ir às compras",
  allProductsOwned: "Você já tem todos os produtos desta loja. Que loja completa!",

  dayClosedPrefix: "Dia fechado!",
  cannotAffordProduct: "Ainda não dá para comprar isso. Vamos juntar mais dinheiro primeiro.",
  productPurchased: "Produto novo disponível na sua loja!",
  cannotAffordCosmetic: "Ainda não dá para comprar essa decoração.",
  cosmeticPurchased: "A decoração nova já pode aparecer na loja!",

  backToShop: "← Loja",
  backToShopLabel: "Voltar para a loja",
  seeAccount: "Ver a conta",
  howMany: "Vamos descobrir quanto custa a compra.",
  separateProducts: "Separe os produtos",
  removeProduct: "Remover produto",
  addProduct: "Adicionar produto",
  qaTitle: "Quanto devo cobrar?",
  answersLabel: "Alternativas de resposta",
  wrongAnswer: "Ainda não fechou a conta.",
  useFullAnswer: "Usar a conta completa para continuar",
  tryAgain: "Tentar de novo",
  answerAccepted: "Esse valor entrou nas vendas da loja.",
  nextCustomer: "Próxima venda",
  seeCloseout: "Ver fechamento",

  finishedDay: "Dia encerrado",
  storeSummary: "Fechamento da loja",
  summaryText: "Foi o faturamento de hoje. Esse dinheiro entra no seu caixa.",
  saveCash: "Guardar no caixa",

  achievementsEyebrow: "Marcos da loja",
  achievements: "Conquistas",
  achievementsDescription: "Cada marco acompanha o crescimento da loja, sem nota ou competição.",
  achievementUnlocked: "Conquistada",
  achievementLocked: "Em descoberta",

  catalog: "Catálogo",
  productsNew: "Novos produtos para a loja",
  catalogDescription: "Escolha o que vai aparecer na próxima expansão.",
  productPrice: "Preço de venda",
  available: "Disponível",
  buyFor: "Comprar por",
  purchaseReady: "Pode comprar",
  purchaseNeedsMore: (missingText) => `Falta ${missingText}`,
  decor: "Decorações",
  decorDescription: "Uma mudança visual para a loja.",
  inCollection: "Na coleção",
  cosmeticNames: {
    banner: "Faixa colorida",
    plant: "Vaso geométrico",
    lamp: "Luz de balcão",
  },

  settingsEyebrow: "Ajustes",
  settings: "Configurações",
  accessibility: "Acessibilidade",
  highContrast: "Contraste reforçado",
  audioAndNarration: "Áudio e narração",
  audioEffects: "Sons de feedback",
  narration: "Narração",
  saveSettings: "Salvar configurações",
};

const enUS: AppStrings = {
  skipToContent: "Skip to content",
  loading: "Opening the shop...",
  errorTitle: "Oops!",
  retry: "Try again",
  storageError: "We could not load saved players on this device.",
  saveError: "We could not save this change. Please try again.",
  createError: "We could not create the player. Check your browser storage.",
  updateNotice: "A new version is ready. Refresh when you finish this activity.",
  updateButton: "Refresh",

  brandTag: "A shop for discovering",
  appName: "Lojinha Maluca",
  lead: "Every purchase hides a math question. Shall we work out the total?",
  back: "← Back",
  firstStep: "First step",
  createProfile: "Create profile",
  nicknameLabel: "What would you like to be called in your shop?",
  nicknamePlaceholder: "Your nickname",
  chooseStore: "Choose your shop",
  chooseStyle: "Choose your shop style",
  personalAvatar: "Build your shopkeeper",
  quickSettings: "Quick settings",
  start: "Start",
  reduceMotion: "Reduce motion",
  largeText: "Use large text",
  styleLabels: { sunrise: "Sunrise", ocean: "Ocean", garden: "Garden" },
  mascotKindLabel: "Pick the hat",
  mascotColorLabel: "Pick the colour",
  mascotKinds: { antenna: "Antenna", cap: "Cap", crown: "Crown", bow: "Bow", leaf: "Little leaf" },
  mascotColors: { orange: "Orange", mint: "Mint", berry: "Berry", sky: "Sky", grape: "Grape", sun: "Sun" },

  yourShop: "Your shop",
  cashLabel: "Balance",
  dayLabel: "Day",
  chapterLabel: "Chapter",
  ready: "Ready to serve?",
  readyDescription: "Serve 5 or 6 customers and grow your shop.",
  objectiveOptional: "Optional goal",
  completed: "Completed",
  storeAchievements: "Shop milestones",
  startDay: "Start day",
  storeActionsLabel: "Shop actions",
  menuShop: "New products",
  menuAchievements: "Achievements",
  menuSettings: "Settings",
  resetTitle: "Start over",
  resetDescription: "Deletes the current shop and starts again from scratch.",
  resetButton: "Start from scratch",
  resetConfirmQuestion: "Are you sure? The current shop will be deleted.",
  resetConfirm: "Yes, delete everything",
  resetCancel: "No, keep playing",

  todayLabel: "Today",
  nextGoal: "Next goal",
  goShopping: "Go shopping",
  allProductsOwned: "You already own every product in this shop. What a complete shop!",

  dayClosedPrefix: "Day closed!",
  cannotAffordProduct: "We cannot buy that yet. Let's save up a little more first.",
  productPurchased: "A new product is available in your shop!",
  cannotAffordCosmetic: "We cannot buy that decoration yet.",
  cosmeticPurchased: "The new decoration can show up in the shop now!",

  backToShop: "← Shop",
  backToShopLabel: "Back to the shop",
  seeAccount: "See the calculation",
  howMany: "Let's work out what this purchase costs.",
  separateProducts: "Set the products aside",
  removeProduct: "Remove product",
  addProduct: "Add product",
  qaTitle: "How much should I charge?",
  answersLabel: "Answer options",
  wrongAnswer: "That total is not right yet.",
  useFullAnswer: "Use the full calculation to continue",
  tryAgain: "Try again",
  answerAccepted: "That amount went into the shop's sales.",
  nextCustomer: "Next sale",
  seeCloseout: "See closing",

  finishedDay: "Day closed",
  storeSummary: "Store closing",
  summaryText: "That was today's revenue. This money goes into your cash box.",
  saveCash: "Save in cash box",

  achievementsEyebrow: "Shop milestones",
  achievements: "Achievements",
  achievementsDescription: "Each milestone follows the shop's growth, with no grades or competition.",
  achievementUnlocked: "Unlocked",
  achievementLocked: "Still to discover",

  catalog: "Catalog",
  productsNew: "New products for the shop",
  catalogDescription: "Choose what appears in the next expansion.",
  productPrice: "Sale price",
  available: "Available",
  buyFor: "Buy for",
  purchaseReady: "Can buy",
  purchaseNeedsMore: (missingText) => `Need ${missingText} more`,
  decor: "Decorations",
  decorDescription: "A new visual touch for the shop.",
  inCollection: "In collection",
  cosmeticNames: {
    banner: "Colorful banner",
    plant: "Geometric planter",
    lamp: "Counter light",
  },

  settingsEyebrow: "Adjustments",
  settings: "Settings",
  accessibility: "Accessibility",
  highContrast: "High contrast",
  audioAndNarration: "Audio and narration",
  audioEffects: "Feedback sounds",
  narration: "Narration",
  saveSettings: "Save settings",
};

export const appStrings: Record<UserLocale, AppStrings> = {
  "pt-BR": ptBR,
  "en-US": enUS,
};

/**
 * Game content (stores, products, customers, achievements, objectives) is authored in
 * pt-BR inside the domain modules. Only the translations away from that canonical copy
 * live here, keyed by the same ids, so the domain stays free of locale plumbing.
 */
/**
 * Formas de sentença dos produtos. O plural e o gênero não dão para derivar por regra
 * em português (revista→revistas mas pincel→pincéis, lápis→lápis), então ficam escritos.
 * O gênero decide "Quantos/Quantas" e "cada um/cada uma"; em inglês é ignorado.
 */
type ProductGrammar = { one: string; many: string; gender: "m" | "f" };

const PRODUCT_GRAMMAR: Record<UserLocale, Record<string, ProductGrammar>> = {
  "pt-BR": {
    bookmark: { one: "marcador", many: "marcadores", gender: "m" },
    magazine: { one: "revista", many: "revistas", gender: "f" },
    book: { one: "livro", many: "livros", gender: "m" },
    comic: { one: "quadrinho", many: "quadrinhos", gender: "m" },
    notebook: { one: "caderno", many: "cadernos", gender: "m" },
    atlas: { one: "atlas", many: "atlas", gender: "m" },
    pencil: { one: "lápis", many: "lápis", gender: "m" },
    brush: { one: "pincel", many: "pincéis", gender: "m" },
    ruler: { one: "régua", many: "réguas", gender: "f" },
    "drawing-block": { one: "bloco de desenho", many: "blocos de desenho", gender: "m" },
    "pencil-case": { one: "estojo", many: "estojos", gender: "m" },
    "small-canvas": { one: "tela pequena", many: "telas pequenas", gender: "f" },
    cone: { one: "cone", many: "cones", gender: "m" },
    rope: { one: "corda", many: "cordas", gender: "f" },
    "sports-bottle": { one: "garrafa esportiva", many: "garrafas esportivas", gender: "f" },
    shuttlecock: { one: "peteca", many: "petecas", gender: "f" },
    ball: { one: "bola", many: "bolas", gender: "f" },
    racket: { one: "raquete", many: "raquetes", gender: "f" },
    led: { one: "LED para projeto", many: "LEDs para projeto", gender: "m" },
    "connection-cable": { one: "cabo de conexão", many: "cabos de conexão", gender: "m" },
    "electronic-button": { one: "botão eletrônico", many: "botões eletrônicos", gender: "m" },
    sensor: { one: "sensor", many: "sensores", gender: "m" },
    "mini-motor": { one: "mini motor", many: "mini motores", gender: "m" },
    "maker-kit": { one: "kit maker", many: "kits maker", gender: "m" },
  },
  "en-US": {
    bookmark: { one: "bookmark", many: "bookmarks", gender: "m" },
    magazine: { one: "magazine", many: "magazines", gender: "m" },
    book: { one: "book", many: "books", gender: "m" },
    comic: { one: "comic", many: "comics", gender: "m" },
    notebook: { one: "notebook", many: "notebooks", gender: "m" },
    atlas: { one: "atlas", many: "atlases", gender: "m" },
    pencil: { one: "pencil", many: "pencils", gender: "m" },
    brush: { one: "paintbrush", many: "paintbrushes", gender: "m" },
    ruler: { one: "ruler", many: "rulers", gender: "m" },
    "drawing-block": { one: "drawing pad", many: "drawing pads", gender: "m" },
    "pencil-case": { one: "pencil case", many: "pencil cases", gender: "m" },
    "small-canvas": { one: "small canvas", many: "small canvases", gender: "m" },
    cone: { one: "cone", many: "cones", gender: "m" },
    rope: { one: "jump rope", many: "jump ropes", gender: "m" },
    "sports-bottle": { one: "sports bottle", many: "sports bottles", gender: "m" },
    shuttlecock: { one: "shuttlecock", many: "shuttlecocks", gender: "m" },
    ball: { one: "ball", many: "balls", gender: "m" },
    racket: { one: "racket", many: "rackets", gender: "m" },
    led: { one: "project LED", many: "project LEDs", gender: "m" },
    "connection-cable": { one: "jumper cable", many: "jumper cables", gender: "m" },
    "electronic-button": { one: "push button", many: "push buttons", gender: "m" },
    sensor: { one: "sensor", many: "sensors", gender: "m" },
    "mini-motor": { one: "mini motor", many: "mini motors", gender: "m" },
    "maker-kit": { one: "maker kit", many: "maker kits", gender: "m" },
  },
};

function productGrammar(product: Product, locale: UserLocale): ProductGrammar {
  const fallback: ProductGrammar = { one: product.name.toLowerCase(), many: product.name.toLowerCase(), gender: "m" };
  return PRODUCT_GRAMMAR[locale]?.[product.id] ?? fallback;
}

type ContentTranslations = {
  stores: Record<string, { name: string; tagline: string }>;
  products: Record<string, string>;
  customerPhrases: Record<string, string>;
  achievements: Record<string, { title: string; description: string }>;
  objectives: Record<string, { title: string; description: string }>;
  hintLevel1: string;
  hintLevel2: (fact: MultiplicationFact, money: (value: number) => string) => string;
};

const enContent: ContentTranslations = {
  stores: {
    bookstore: { name: "Bookshop", tagline: "Ideas that fit in a backpack" },
    art: { name: "Art Shop", tagline: "Color, line and imagination" },
    sports: { name: "Sports Shop", tagline: "Movement for everyone" },
    technology: { name: "Tech & Robotics", tagline: "Small projects, big ideas" },
  },
  products: {
    bookmark: "Bookmark",
    magazine: "Magazine",
    book: "Book",
    comic: "Comic",
    notebook: "Notebook",
    atlas: "Atlas",
    pencil: "Pencil",
    brush: "Paintbrush",
    ruler: "Ruler",
    "drawing-block": "Drawing pad",
    "pencil-case": "Pencil case",
    "small-canvas": "Small canvas",
    cone: "Cone",
    rope: "Jump rope",
    "sports-bottle": "Sports bottle",
    shuttlecock: "Shuttlecock",
    ball: "Ball",
    racket: "Racket",
    led: "Project LED",
    "connection-cable": "Jumper cable",
    "electronic-button": "Push button",
    sensor: "Sensor",
    "mini-motor": "Mini motor",
    "maker-kit": "Maker kit",
  },
  customerPhrases: {
    lia: "I want a few items for my project.",
    caio: "I need materials for an activity.",
    bia: "I want to build a new idea.",
    theo: "Could you set these products aside for me?",
    nina: "Today I'm preparing a surprise.",
    davi: "I'm looking for something to create with.",
  },
  achievements: {
    "first-day": { title: "First day", description: "Close a day of service." },
    "first-expansion": { title: "Growing shop", description: "Buy your first expansion." },
    "new-chapter": { title: "New chapter", description: "Open a new chapter of the shop." },
  },
  objectives: {
    "welcome-customers": { title: "Doors open", description: "Serve customers calmly." },
    "stock-shelf": { title: "Shelf in order", description: "Complete five customer visits." },
    "keep-discovering": { title: "Discoveries of the day", description: "Serve four customers and watch the shop grow." },
  },
  hintLevel1: "Check the quantity and the price of each item.",
  hintLevel2: (fact, money) => `${fact.a} products · ${money(fact.b)} each`,
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
  dayClosedNotice: (revenue: number) => string;
  narrateCorrect: (quantity: number, price: number, answer: number) => string;
  narrateRetry: (hint: string) => string;
  customerCounter: (current: number, total: number) => string;
  customerArrived: (name: string) => string;
  /** Split so the requested items keep their <strong> emphasis in the markup. */
  customerWants: (quantity: number, product: Product) => { before: string; emphasis: string; after: string };
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
  achievementText: (achievement: AchievementDefinition) => { title: string; description: string };
  objectiveText: (objective: DailyObjective) => { title: string; description: string };
  cosmeticName: (id: string, fallback: string) => string;
};

export function getUserLocale(): UserLocale {
  const browserLocale = typeof navigator !== "undefined" ? navigator.language : "pt-BR";
  return browserLocale.toLowerCase().startsWith("en") ? "en-US" : "pt-BR";
}

export function getLocalizedStrings(locale: UserLocale = getUserLocale()): LocaleBundle {
  const strings = appStrings[locale] ?? appStrings["pt-BR"];
  const english = locale === "en-US";
  const money = (value: number) => (english ? `$${value}` : `R$ ${value}`);
  const countedProduct = (product: Product, quantity: number) => {
    const grammar = productGrammar(product, locale);
    return quantity === 1 ? grammar.one : grammar.many;
  };

  return {
    ...strings,
    locale,
    money,
    dioramaLabel: (storeName) => (english ? `${storeName} diorama` : `Diorama da ${storeName}`),
    dayAndChapter: (day, chapter) => `${strings.dayLabel} ${day} · ${strings.chapterLabel} ${chapter}`,
    cashBadgeLabel: (cash) => `${strings.cashLabel} ${money(cash)}`,
    canBuyNow: (productName, priceText) =>
      english
        ? `You have enough to buy the ${productName} for ${priceText}!`
        : `Você já tem dinheiro para comprar ${productName} por ${priceText}!`,
    missingAmount: (missingText, productName) =>
      english
        ? `${missingText} more and the ${productName} is yours.`
        : `Faltam ${missingText} para comprar ${productName}.`,
    dayClosedNotice: (revenue) =>
      english
        ? `${strings.dayClosedPrefix} ${money(revenue)} went into the cash box.`
        : `${strings.dayClosedPrefix} ${money(revenue)} entraram no caixa.`,
    narrateCorrect: (quantity, price, answer) =>
      english
        ? `Well done! ${quantity} times ${price} equals ${answer}.`
        : `Muito bem! ${quantity} vezes ${price} e igual a ${answer}.`,
    narrateRetry: (hint) => (english ? `Let's try again. ${hint}` : `Vamos tentar de novo. ${hint}`),
    customerCounter: (current, total) =>
      english ? `Customer ${current} of ${total}` : `Cliente ${current} de ${total}`,
    customerArrived: (name) => (english ? `${name} arrived` : `${name} chegou`),
    customerWants: (quantity, product) => ({
      before: english ? "I'd like " : "Quero ",
      emphasis: `${quantity} ${countedProduct(product, quantity)}`,
      after: ".",
    }),
    quantityQuestion: (product) => {
      const grammar = productGrammar(product, locale);
      return english
        ? `How many ${grammar.many}?`
        : `${grammar.gender === "f" ? "Quantas" : "Quantos"} ${grammar.many}?`;
    },
    unitExplain: (quantity, product, priceText) => {
      const label = countedProduct(product, quantity);
      if (english) return `${quantity} ${label}, and each one costs ${priceText}.`;
      const each = productGrammar(product, locale).gender === "f" ? "cada uma" : "cada um";
      return `${quantity} ${label}, e ${each} custa ${priceText}.`;
    },
    quantityPileLabel: (selected, total) =>
      english ? `${selected} of ${total} products set aside` : `${selected} de ${total} produtos separados`,
    quantityProgress: (selected, total) =>
      english ? `${selected} of ${total} set aside` : `${selected} de ${total} separados`,
    equation: (quantity, price) => `${quantity} × ${money(price)}`,
    correctAnswer: (answer) => (english ? `✓ ${money(answer)} — correct!` : `✓ ${money(answer)} — certo!`),
    priceLine: (price) => `${strings.productPrice}: ${money(price)}`,
    buyForLabel: (cost) => `${strings.buyFor} ${money(cost)}`,
    hintText: (fact, errorCount) => {
      const hint = getHint(fact, errorCount);
      if (!english) return hint.text;
      if (hint.level === 1) return enContent.hintLevel1;
      if (hint.level === 2) return enContent.hintLevel2(fact, money);
      return hint.text;
    },
    storeText: (store) => (english ? enContent.stores[store.id] ?? store : store),
    productName: (product) => (english ? enContent.products[product.id] ?? product.name : product.name),
    customerPhrase: (customer) =>
      english ? enContent.customerPhrases[customer.id] ?? customer.phrase : customer.phrase,
    achievementText: (achievement) => (english ? enContent.achievements[achievement.id] ?? achievement : achievement),
    objectiveText: (objective) => (english ? enContent.objectives[objective.id] ?? objective : objective),
    cosmeticName: (id, fallback) => strings.cosmeticNames[id] ?? fallback,
  };
}
