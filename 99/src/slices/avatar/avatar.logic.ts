/**
 * Aparencia do personagem.
 *
 * **A regra que nao pode ser quebrada:** a silhueta escolhida nao tranca nada. O
 * menu de cores e acessorios e identico nas duas, e nenhum item tem "de menino"
 * ou "de menina" escrito nele. A escolha e de aparencia, nao de permissao.
 *
 * Tudo aqui e cor de material e primitiva do Three sobre o boneco que ja existe.
 * Nenhum asset novo, como no resto do jogo.
 */

export const SILHOUETTES = ['menino', 'menina'] as const;
export type Silhouette = (typeof SILHOUETTES)[number];

/** Seis tons, do mais claro ao mais escuro. */
export const SKIN_TONES = [
  '#ffe0bd',
  '#f1c27d',
  '#e0ac69',
  '#c68642',
  '#8d5524',
  '#5c3317',
] as const;

export const CLOTHES_COLORS = [
  '#f2a03d',
  '#e05263',
  '#3fbf6f',
  '#4a8fd4',
  '#9b5de5',
  '#ffd166',
  '#2ec4b6',
  '#f28ab2',
] as const;

export type HeadAccessory = 'nenhum' | 'bone' | 'chapeu' | 'coroa';
export type FaceAccessory = 'nenhum' | 'oculos';

export interface AvatarSelection {
  silhouette: Silhouette;
  /** Indice em `SKIN_TONES`. */
  skin: number;
  /** Indice em `CLOTHES_COLORS`. */
  clothes: number;
  head: HeadAccessory;
  face: FaceAccessory;
}

export const DEFAULT_AVATAR: AvatarSelection = {
  silhouette: 'menino',
  skin: 1,
  clothes: 0,
  head: 'nenhum',
  face: 'nenhum',
};

/**
 * O que cada acessorio exige para aparecer no espelho.
 *
 * `null` significa disponivel desde o comeco. Os demais **se ganham por marco de
 * tabuada**: a roupa vira o boletim que a crianca quer exibir, que e o mecanismo
 * do trofeu sem parecer prova.
 */
/**
 * Um acessorio.
 *
 * **Sem rotulo aqui.** O nome e texto e vive nos arquivos de idioma, pela mesma
 * razao dos itens de loja: o que fica no catalogo e o que nao se traduz — a
 * identidade e o marco de tabuada que o libera.
 */
export interface AccessorySpec<T extends string> {
  id: T;
  requiresTable: number | null;
}

export const HEAD_ACCESSORIES: AccessorySpec<HeadAccessory>[] = [
  { id: 'nenhum', requiresTable: null },
  { id: 'bone', requiresTable: null },
  { id: 'chapeu', requiresTable: 5 },
  { id: 'coroa', requiresTable: 9 },
];

export const FACE_ACCESSORIES: AccessorySpec<FaceAccessory>[] = [
  { id: 'nenhum', requiresTable: null },
  { id: 'oculos', requiresTable: 3 },
];

/** Fatores que compoem uma tabuada, de 1 a 10. */
export const TABLE_FACTORS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10] as const;

/** Chave canonica de um fato, na mesma forma que a economia guarda. */
function keyOf(a: number, b: number): string {
  const [menor, maior] = a <= b ? [a, b] : [b, a];
  return `${menor}x${maior}`;
}

/**
 * A tabuada esta inteira dominada?
 *
 * Exige os dez fatos, e nao "a maioria": o marco tem que significar alguma
 * coisa. Meia tabuada dando coroa esvaziaria o premio.
 */
export function tableIsMastered(table: number, knownFacts: readonly string[]): boolean {
  return TABLE_FACTORS.every((factor) => knownFacts.includes(keyOf(table, factor)));
}

/** Os acessorios que a crianca ja pode escolher. */
export function unlockedAccessories<T extends string>(
  specs: readonly AccessorySpec<T>[],
  knownFacts: readonly string[],
): AccessorySpec<T>[] {
  return specs.filter(
    (spec) => spec.requiresTable === null || tableIsMastered(spec.requiresTable, knownFacts),
  );
}

/** O acessorio escolhido continua valido? Usado ao carregar um save. */
export function accessoryIsAvailable<T extends string>(
  specs: readonly AccessorySpec<T>[],
  id: T,
  knownFacts: readonly string[],
): boolean {
  return unlockedAccessories(specs, knownFacts).some((spec) => spec.id === id);
}

function isSilhouette(value: unknown): value is Silhouette {
  return SILHOUETTES.includes(value as Silhouette);
}

function indexOrDefault(value: unknown, length: number, fallback: number): number {
  if (typeof value !== 'number' || !Number.isInteger(value) || value < 0 || value >= length) {
    return fallback;
  }
  return value;
}

/**
 * Valida uma selecao vinda do save.
 *
 * Nunca lanca: uma aparencia estranha guardada no navegador nao pode impedir a
 * crianca de jogar. Campo invalido volta ao padrao, e so.
 */
export function migrateAvatar(raw: unknown): AvatarSelection {
  if (typeof raw !== 'object' || raw === null) return DEFAULT_AVATAR;
  const candidate = raw as Partial<Record<keyof AvatarSelection, unknown>>;

  const head = HEAD_ACCESSORIES.some((spec) => spec.id === candidate.head)
    ? (candidate.head as HeadAccessory)
    : DEFAULT_AVATAR.head;
  const face = FACE_ACCESSORIES.some((spec) => spec.id === candidate.face)
    ? (candidate.face as FaceAccessory)
    : DEFAULT_AVATAR.face;

  return {
    silhouette: isSilhouette(candidate.silhouette)
      ? candidate.silhouette
      : DEFAULT_AVATAR.silhouette,
    skin: indexOrDefault(candidate.skin, SKIN_TONES.length, DEFAULT_AVATAR.skin),
    clothes: indexOrDefault(candidate.clothes, CLOTHES_COLORS.length, DEFAULT_AVATAR.clothes),
    head,
    face,
  };
}
