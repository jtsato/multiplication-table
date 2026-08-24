import type { RegionId } from '../slices/regions/regions.logic';
import type { ResourceKind } from '../slices/resources/resources.logic';
import type { ShopItemKind } from '../slices/economy/economy.logic';
import type { AnimalKind } from '../slices/wildlife/wildlife.logic';

/**
 * Os idiomas que a maquina cobre.
 *
 * A lista e a mesma do projeto irmao `st`, que ja resolveu a gramatica dos oito.
 * Estar aqui nao significa estar disponivel: quem decide isso e `LOCALES`, que e
 * parcial de proposito.
 */
export type UserLocale =
  'pt-BR' | 'en-US' | 'es-ES' | 'fr-FR' | 'de-DE' | 'ja-JP' | 'ko-KR' | 'zh-CN';

/**
 * Genero gramatical do substantivo.
 *
 * `n` (neutro) existe por causa do alemao, que tem tres; os idiomas sem genero
 * simplesmente ignoram o campo.
 */
export type Gender = 'm' | 'f' | 'n';

/**
 * As formas de um substantivo num idioma.
 *
 * `one`/`many` nao dao para derivar por regra — "cristal" vira "cristais", nao
 * "cristals" — entao ficam escritas. Idiomas latinos usam `gender`; japones,
 * coreano e chines nao tem plural nem genero, mas exigem um `counter`
 * (classificador) que muda conforme o formato do objeto.
 */
export interface NounForms {
  one: string;
  many: string;
  gender?: Gender;
  counter?: string;
}

/**
 * As regras que transformam `NounForms` em frase.
 *
 * Cada idioma implementa do jeito que a sua gramatica exige — inclusive a ordem,
 * ja que em chines o classificador vem antes do substantivo e em japones vem
 * depois. E por isso que isto e funcao, e nao um modelo com marcadores: nenhuma
 * interpolacao `{{n}} {{item}}` daria conta dos dois lados.
 */
export interface LocaleGrammar {
  /** "3 conchas" · "3 shells" */
  counted: (quantity: number, forms: NounForms) => string;
  /** "Quantas conchas?" · "How many shells?" */
  howMany: (forms: NounForms) => string;
}

/*
  Nao ha `each` aqui de proposito.
 
  O projeto irmao `st` tem, porque la a frase e montada em codigo. Aqui o
  enunciado inteiro e um modelo por idioma — "{{grupos}} com {{itens}} cada" —
  entao a palavra e a posicao dela ja sao escolha de quem traduz. Uma funcao a
  mais na gramatica seria codigo morto com cara de simetria.
*/

/**
 * Como um recurso se descreve no enunciado.
 *
 * `group` e o que junta ("galho", "cacho", "colmeia") e `item` e o que se conta.
 * Os dois precisam de formas proprias porque a frase concorda com os dois.
 */
export interface ResourceNouns {
  group: NounForms;
  /** O que se conta no desafio: "graveto", "pote de mel". */
  item: NounForms;
  /**
   * Como o recurso aparece no inventario e nas receitas: "madeira", "mel".
   *
   * **Nao e o mesmo que `item`**, e a diferenca importa: o enunciado conta
   * gravetos, mas o HUD guarda madeira. Alguns sao nomes de massa e nem tem
   * plural. Confundir os dois faz a receita da fogueira dizer "8 gravetos".
   */
  stock: NounForms;
}

/**
 * Textos da interface. **So dados: nada aqui e funcao**, para que um idioma novo
 * seja um arquivo de traducao e nao um ramo de codigo.
 *
 * Os campos com `{{marcador}}` sao modelos interpolados na hora de usar.
 */
export interface AppStrings {
  // Marca
  tagline: string;
  loading: string;

  // HUD
  day: string;
  phaseDay: string;
  phaseDusk: string;
  phaseNight: string;
  phaseDawn: string;
  campfire: string;
  fence: string;
  coins: string;
  coinsLabel: string;
  lanternLabel: string;
  lanternLow: string;
  duskWarning: string;
  harvestPrompt: string;
  plantSeedPrompt: string;
  buildPrompt: string;
  buildOffLand: string;
  buildOverlaps: string;
  buildTooClose: string;
  buildCampfireAtNight: string;
  bridgePrompt: string;

  controlsTitle: string;
  controlsMove: string;
  controlsCamera: string;
  controlsSolve: string;
  controlsBuild: string;
  controlsPlant: string;
  controlsSpace: string;
  joystickLabel: string;
  touchHarvest: string;
  touchPlant: string;
  touchFeed: string;
  touchOrder: string;
  touchRefuel: string;
  touchBuild: string;
  touchCancel: string;
  plantTree: string;
  plantFruitTree: string;
  summaryLabel: string;
  bedLabel: string;
  tableHeader: string;
  language: string;
  /** Rótulo acessível do minimapa. */
  mapLabel: string;
  /** Titulo do mapa em tela cheia. */
  mapTitle: string;
  /** Texto alternativo do botao do mapa no canto da tela. */
  mapButton: string;

  // Desafio
  challengePrompt: string;
  correct: string;
  wrong: string;
  answerWas: string;
  errorExplain: string;
  useHint: string;
  fireFull: string;
  fireSome: string;
  /** Saudação exibida quando um NPC se aproxima. */
  npcGreeting: string;
  /** Convite para alimentar um animal proximo. */
  feedPrompt: string;
  /** Feedback de acerto no desafio de alimentar. */
  feedFriend: string;
  /** Convite para entregar uma encomenda a um NPC. */
  orderPrompt: string;
  /** Feedback de acerto no desafio de encomenda. */
  orderDone: string;
  /** Feedback de acerto no pedagio da ponte. */
  tollOpen: string;
  /** Feedback de acerto no desafio de construir. */
  buildDone: string;
  /** Titulo do quadro de encomendas dentro de casa. */
  ordersTitle: string;

  // Loja
  hintsStored: string;
  shopTitle: string;
  shopClose: string;
  noCoins: string;
  noResources: string;
  alreadyOwned: string;
  needTable: string;

  // Casa
  mirrorTitle: string;
  chartTitle: string;
  chartFree: string;
  chartProgress: string;
  chartCell: string;
  chartCellKnown: string;
  teacherTitle: string;
  teacherAdvice: string;
  bedTitle: string;
  bedQuestion: string;
  bedSleep: string;
  bedNotYet: string;
  ready: string;
  close: string;

  // Configurações
  settingsTitle: string;
  settingsVolume: string;
  settingsSensitivity: string;
  settingsLanguage: string;
  settingsFullscreen: string;
  settingsExitFullscreen: string;

  // Caderneta dos animais
  bookTitle: string;
  bookSeen: string;
  bookFriend: string;
  bookNotSeen: string;
  bookTake: string;
  bookCurrentPet: string;

  // Avatar
  character: string;
  boy: string;
  girl: string;
  skin: string;
  clothes: string;
  /** Rotulos de leitor de tela: mais explicitos que a legenda do grupo. */
  skinTone: string;
  clothesColor: string;
  head: string;
  face: string;
  noHat: string;
  cap: string;
  hat: string;
  crown: string;
  noGlasses: string;
  glasses: string;

  // Resumo do dia
  summaryTitle: string;
  summaryCorrect: string;
  summaryCorrectOne: string;
  summaryCoins: string;
  summaryCoinsOne: string;
  summaryLearned: string;
  continueLabel: string;

  // Eventos diários
  dailyTitle: string;
  dailyChuva: string;
  dailyFartura: string;
  dailyVisitante: string;
  dailyBaleiaNaPraia: string;
  /** Acessivel: botao do sino de eventos do dia. */
  dailyButton: string;
  /** Texto do botao "fechar/marcar como lido" no aviso expandido do dia. */
  dailyDismiss: string;
}

/** Um idioma completo: interface, gramatica e os substantivos do mundo. */
export interface LocaleDefinition {
  strings: AppStrings;
  /** Formas de cada colheita, para o HUD e para o enunciado. */
  resources: Record<ResourceKind, ResourceNouns>;
  /** O nome de cada regiao. */
  regions: Record<RegionId, string>;
  /** O nome de cada animal. */
  animals: Record<AnimalKind, string>;
  /** Rotulo e efeito de cada item da loja. */
  shop: Record<ShopItemKind, { label: string; effect: string }>;
}

/** Tudo que a interface precisa num idioma, ja com a gramatica junto. */
export interface LocaleBundle extends LocaleDefinition {
  locale: UserLocale;
  grammar: LocaleGrammar;
}
