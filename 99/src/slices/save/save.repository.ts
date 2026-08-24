import { migrateAvatar, type AvatarSelection } from '../avatar/avatar.logic';
import { bridgeById } from '../regions/bridges.logic';
import { migrateLocale, type UserLocale } from '../../i18n';
import type { ShopItemKind } from '../economy/economy.logic';
import { SHOP_ITEMS } from '../economy/economy.logic';
import {
  emptyInventory,
  RESOURCE_KINDS,
  type Inventory,
  type ResourceNode,
} from '../resources/resources.logic';
import {
  gardenPlotForRegion,
  initialGardenState,
  type GardenPlot,
  type GardenState,
} from '../garden/garden.logic';
import { vec3, type Vec3 } from '../../shared/vec';
import type { Structure, StructureKind } from '../building/building.logic';
import { clampSensitivity, clampVolume, SETTINGS } from '../settings/settings.logic';
import {
  migrateAnimalBook,
  migratePet,
  type AnimalBookEntry,
  type AnimalKind,
} from '../wildlife/wildlife.logic';
import {
  factProgressToCounts,
  factProgressToKnownFacts,
  isValidFactKey,
  migrateToProgress,
  type FactProgress,
  type FactProgressMap,
} from '../pedagogy/pedagogy.logic';

/**
 * Persistencia.
 *
 * Espelha de perto o padrao ja provado no projeto irmao `ds`
 * (`src/slices/save-game/`): uma versao explicita, uma funcao de migracao que
 * **lanca** em dado invalido, e um repositorio que **engole** erro de
 * armazenamento. A divisao importa — dado corrompido e um bug a ser detectado;
 * `localStorage` indisponivel (aba privada, cota cheia) e um fato da vida, e nao
 * pode impedir a crianca de jogar.
 */
export const SAVE_VERSION = 8;

export const SAVE_STORAGE_KEY = 'numi-99.save';

export interface GameSave {
  version: typeof SAVE_VERSION;
  coins: number;
  /** Fatos ja resolvidos ao menos uma vez, na forma "2x4". */
  knownFacts: string[];
  /** Quantas vezes cada fato foi resolvido (3 repeteções por fato por ilha). */
  factCounts: Record<string, number>;
  factProgress: FactProgressMap;
  learningStep: number;
  lastFactKey: string | null;
  inventory: Inventory;
  owned: ShopItemKind[];
  hints: number;
  /** Sementes para a horta. Ausente num save anterior a horta, e ai e `0`. */
  seeds: number;
  /** Estado da horta do Pomar. Ausente antes da horta, e ai e vazia. */
  garden: GardenState;
  avatar: AvatarSelection;
  /** Pontes ja compradas. Ausente num save anterior as regioes, e ai e `[]`. */
  openBridges: string[];
  /** Caderneta dos animais. Ausente num save anterior a Fase 5, e ai e vazia. */
  animalBook: AnimalBookEntry[];
  /** Animal escolhido como pet. Ausente antes da Fase 5, e ai e `null`. */
  pet: AnimalKind | null;
  /** Idioma escolhido. Ausente num save anterior ao i18n, e ai e o padrao. */
  locale: UserLocale;
  /**
   * Construcoes (fogueira, cerca). Ausente num save anterior a Fase 9E, e ai e
   * `[]` — a crianca nao perde o que construiu ao fechar a tela.
   */
  structures: Structure[];
  /** IDs de depositos ja esgotados; o mundo nao reativa recursos automaticamente. */
  depletedNodeIds: string[];
  /** Vegetacao plantada pela crianca, com posicao e progresso persistidos. */
  plantedNodes: ResourceNode[];
  /**
   * Segundos do relogio do jogo. Sem isto o combustivel da fogueira e o numero
   * do dia voltariam ao zero no reload, e uma horta plantada no dia 3 abriria
   * como pronta no dia 1.
   */
  clockSeconds: number;
  /** Volume mestre do áudio, de 0 a 1. Ausente antes da Fase 9F, e ai e 0.5. */
  volume: number;
  /** Multiplicador da sensibilidade da câmera, de 0.5 a 2. Ausente antes da Fase 9F. */
  cameraSensitivity: number;
}

export interface SaveRepository {
  save(save: GameSave): void;
  load(): GameSave | null;
  clear(): void;
}

function migrateCount(raw: unknown, campo: string): number {
  if (raw === undefined) return 0;
  if (typeof raw !== 'number' || !Number.isFinite(raw) || raw < 0) {
    throw new Error(`${campo} invalido`);
  }
  return Math.floor(raw);
}

function migrateVolume(raw: unknown): number {
  if (raw === undefined) return SETTINGS.defaultVolume;
  if (typeof raw !== 'number' || !Number.isFinite(raw)) throw new Error('volume invalido');
  return clampVolume(raw);
}

function migrateSensitivity(raw: unknown): number {
  if (raw === undefined) return SETTINGS.defaultSensitivity;
  if (typeof raw !== 'number' || !Number.isFinite(raw)) throw new Error('sensibilidade invalida');
  return clampSensitivity(raw);
}

export function migrateGarden(raw: unknown, version = 7): GardenState {
  if (raw === undefined) return initialGardenState();

  if (typeof raw !== 'object' || raw === null) throw new Error('horta invalida');

  if (!Array.isArray(raw)) {
    const candidate = raw as Record<string, unknown>;
    if (version >= 8 && !('planted' in candidate || 'plantedDay' in candidate)) {
      throw new Error('horta invalida');
    }
    const pomar = gardenPlotForRegion('pomar');
    return [
      {
        ...pomar,
        planted: candidate.planted === true,
        plantedDay: migrateCount(candidate.plantedDay, 'horta.plantedDay'),
      },
    ];
  }

  return raw.map((item, index) => {
    if (typeof item !== 'object' || item === null) throw new Error(`canteiro invalido: ${index}`);
    const candidate = item as Record<string, unknown>;
    if (typeof candidate.id !== 'string' || !candidate.id.startsWith('canteiro-')) {
      throw new Error(`canteiro invalido: ${index}`);
    }
    if (!RESOURCE_KINDS.includes(candidate.crop as never) && candidate.crop !== 'madeira') {
      throw new Error(`canteiro invalido: ${index}`);
    }
    return {
      id: candidate.id,
      position: migrateVec3(candidate.position, `canteiros[${index}].position`),
      planted: candidate.planted === true,
      plantedDay: migrateCount(candidate.plantedDay, `canteiros[${index}].plantedDay`),
      crop: (candidate.crop === 'madeira' ? 'fruta' : candidate.crop) as GardenPlot['crop'],
      table: migrateCount(candidate.table, `canteiros[${index}].table`),
    };
  });
}

/** Número finito que pode ser negativo (rotação, por exemplo). */
function migrateFiniteNumber(raw: unknown, campo: string): number {
  if (typeof raw !== 'number' || !Number.isFinite(raw)) {
    throw new Error(`${campo} invalido`);
  }
  return raw;
}

function migrateVec3(raw: unknown, campo: string): Vec3 {
  if (typeof raw !== 'object' || raw === null) throw new Error(`${campo} invalido`);
  const candidate = raw as Record<string, unknown>;
  return vec3(
    migrateFiniteNumber(candidate.x, `${campo}.x`),
    migrateFiniteNumber(candidate.y, `${campo}.y`),
    migrateFiniteNumber(candidate.z, `${campo}.z`),
  );
}

const STRUCTURE_KINDS: readonly StructureKind[] = ['fogueira', 'cerca'];

/**
 * Construcoes guardadas.
 *
 * Estrutura malformada e bug e derruba o save; campo ausente (save anterior a
 * Fase 9E) significa que a crianca ainda nao construiu nada.
 */
function migrateStructures(raw: unknown): Structure[] {
  if (raw === undefined) return [];
  if (!Array.isArray(raw)) throw new Error('construcoes invalidas');

  return raw.map((item, index) => {
    if (typeof item !== 'object' || item === null) throw new Error('construcao invalida');
    const candidate = item as Record<string, unknown>;
    if (typeof candidate.id !== 'string' || candidate.id.length === 0) {
      throw new Error('construcao invalida');
    }
    if (typeof candidate.kind !== 'string' || !STRUCTURE_KINDS.includes(candidate.kind as StructureKind)) {
      throw new Error('construcao invalida');
    }
    return {
      id: candidate.id,
      kind: candidate.kind as StructureKind,
      position: migrateVec3(candidate.position, `construcoes[${index}].position`),
      rotation: migrateFiniteNumber(candidate.rotation, `construcoes[${index}].rotation`),
      fuelUntil: migrateFiniteNumber(candidate.fuelUntil, `construcoes[${index}].fuelUntil`),
    };
  });
}

/**
 * Fatos guardados.
 *
 * Formato "AxB" com numeros de 1 a 10. Lixo aqui e bug, nao dado do jogador —
 * um fato invalido pintaria o mural errado, entao lanca.
 */
export function migrateFacts(raw: unknown): string[] {
  if (raw === undefined) return [];
  if (!Array.isArray(raw)) throw new Error('fatos invalidos');

  return raw.map((item) => {
    if (typeof item !== 'string' || !/^\d{1,2}x\d{1,2}$/.test(item)) {
      throw new Error('fatos invalidos');
    }
    return item;
  });
}

/** Contagem de repetições por fato. Ausente antes da v5, e ai é `{}`. */
export function migrateFactCounts(raw: unknown): Record<string, number> {
  if (raw === undefined) return {};
  if (typeof raw !== 'object' || raw === null || Array.isArray(raw)) {
    throw new Error('contagem de fatos invalida');
  }
  const resultado: Record<string, number> = {};
  for (const [chave, valor] of Object.entries(raw as Record<string, unknown>)) {
    if (typeof valor !== 'number' || !Number.isFinite(valor) || valor < 0) {
      throw new Error('contagem de fatos invalida');
    }
    resultado[chave] = Math.floor(valor);
  }
  return resultado;
}

function migrateNodeIds(raw: unknown): string[] {
  if (raw === undefined) return [];
  if (!Array.isArray(raw)) throw new Error('nos esgotados invalidos');
  return raw.filter((item): item is string => typeof item === 'string' && item.length > 0);
}

function migratePlantedNodes(raw: unknown): ResourceNode[] {
  if (raw === undefined) return [];
  if (!Array.isArray(raw)) throw new Error('plantas invalidas');
  return raw.map((item, index) => {
    if (typeof item !== 'object' || item === null) throw new Error(`planta invalida: ${index}`);
    const candidate = item as Record<string, unknown>;
    if (typeof candidate.id !== 'string' || !candidate.id.startsWith('planta-')) {
      throw new Error(`planta invalida: ${index}`);
    }
    if (
      typeof candidate.kind !== 'string' ||
      (!RESOURCE_KINDS.includes(candidate.kind as never) && candidate.kind !== 'madeira')
    ) {
      throw new Error(`planta invalida: ${index}`);
    }
    return {
      id: candidate.id,
      // Saves anteriores podiam conter uma arvore de madeira. Ela migra para a
      // unica arvore que continua existindo: a frutifera.
      kind: (candidate.kind === 'madeira' ? 'fruta' : candidate.kind) as ResourceNode['kind'],
      position: migrateVec3(candidate.position, `plantas[${index}].position`),
      groups: migrateCount(candidate.groups, `plantas[${index}].groups`),
      perGroup: migrateCount(candidate.perGroup, `plantas[${index}].perGroup`),
      depleted: candidate.depleted === true,
      planted: true,
      lastHarvestDay: migrateCount(candidate.lastHarvestDay, `plantas[${index}].lastHarvestDay`),
    };
  });
}

export function migrateInventory(raw: unknown): Inventory {
  if (raw === undefined) return emptyInventory();
  if (typeof raw !== 'object' || raw === null) throw new Error('inventario invalido');

  const candidate = raw as Record<string, unknown>;
  const resultado = emptyInventory();
  for (const kind of RESOURCE_KINDS) {
    resultado[kind] = migrateCount(candidate[kind], `inventario.${kind}`);
  }
  return resultado;
}

/**
 * Pontes compradas.
 *
 * Uma ponte desconhecida e descartada em silencio, pelo mesmo motivo dos itens:
 * pode ser de uma versao futura do mapa. E um save de antes das regioes
 * simplesmente nao tem o campo — a crianca volta com o mundo fechado, que e o
 * estado correto para quem nunca comprou ponte nenhuma.
 */
export function migrateBridges(raw: unknown): string[] {
  if (raw === undefined) return [];
  if (!Array.isArray(raw)) throw new Error('pontes invalidas');
  return raw.filter(
    (item): item is string => typeof item === 'string' && bridgeById(item) !== undefined,
  );
}

/** Itens comprados. Um item desconhecido e descartado em silencio: pode ser de
 *  uma versao futura do catalogo, e ignora-lo e melhor que recusar o save. */
export function migrateOwned(raw: unknown): ShopItemKind[] {
  if (raw === undefined) return [];
  if (!Array.isArray(raw)) throw new Error('itens invalidos');
  return raw.filter((item): item is ShopItemKind => typeof item === 'string' && item in SHOP_ITEMS);
}

export function migrateFactProgress(
  raw: unknown,
  knownFacts: unknown,
  factCounts: unknown,
): FactProgressMap {
  const herdado = migrateToProgress(migrateFacts(knownFacts), migrateFactCounts(factCounts));

  if (raw === undefined) return herdado;
  if (typeof raw !== 'object' || raw === null || Array.isArray(raw)) {
    throw new Error('progresso pedagógico inválido');
  }

  const candidato = raw as Record<string, unknown>;
  const resultado: FactProgressMap = { ...herdado };

  for (const [chave, valor] of Object.entries(candidato)) {
    if (!isValidFactKey(chave)) throw new Error(`fato inválido: ${chave}`);
    resultado[chave] = validateFactProgress(chave, valor);
  }

  return resultado;
}

function validateFactProgress(key: string, raw: unknown): FactProgress {
  if (typeof raw !== 'object' || raw === null || Array.isArray(raw)) {
    throw new Error(`progresso do fato inválido: ${key}`);
  }
  const candidato = raw as Record<string, unknown>;

  const numero = (campo: string, valor: unknown): number => {
    if (typeof valor !== 'number' || !Number.isFinite(valor) || valor < 0) {
      throw new Error(`progresso do fato inválido: ${key}.${campo}`);
    }
    return Math.floor(valor);
  };

  const lastSeen = candidato.lastSeen;
  if (lastSeen !== null && (typeof lastSeen !== 'number' || !Number.isFinite(lastSeen))) {
    throw new Error(`progresso do fato inválido: ${key}.lastSeen`);
  }

  return {
    key,
    correct: numero('correct', candidato.correct),
    wrong: numero('wrong', candidato.wrong),
    streak: numero('streak', candidato.streak),
    lastSeen: (lastSeen as number | null) ?? null,
    dueAt: numero('dueAt', candidato.dueAt),
  };
}

/**
 * Valida e migra um save bruto para o schema atual.
 *
 * Campos ausentes recebem o padrao; dado invalido lanca — e quem chama decide o
 * que fazer com isso. O repositorio, por exemplo, comeca do zero.
 */
export function migrateSave(raw: unknown): GameSave {
  if (typeof raw !== 'object' || raw === null) {
    throw new Error('save invalido: nao e um objeto');
  }
  const candidate = raw as Record<string, unknown>;

  const rawVersion = candidate.version;
  if (
    rawVersion !== 1 &&
    rawVersion !== 2 &&
    rawVersion !== 3 &&
    rawVersion !== 4 &&
     rawVersion !== 5 &&
     rawVersion !== 6 &&
     rawVersion !== 7 &&
     rawVersion !== SAVE_VERSION
  ) {
    throw new Error(`versao de save nao suportada: ${String(rawVersion)}`);
  }

  const factProgress = migrateFactProgress(
    candidate.factProgress,
    candidate.knownFacts,
    candidate.factCounts,
  );

  return {
    version: SAVE_VERSION,
    coins: migrateCount(candidate.coins, 'moedas'),
    knownFacts: factProgressToKnownFacts(factProgress),
    factCounts: factProgressToCounts(factProgress),
    factProgress,
    learningStep: migrateCount(candidate.learningStep, 'aprendizado'),
    lastFactKey: typeof candidate.lastFactKey === 'string' ? candidate.lastFactKey : null,
    inventory: migrateInventory(candidate.inventory),
    owned: migrateOwned(candidate.owned),
    hints: migrateCount(candidate.hints, 'dicas'),
    seeds: migrateCount(candidate.seeds, 'sementes'),
      garden: migrateGarden(candidate.garden, rawVersion as number),
    avatar: migrateAvatar(candidate.avatar),
    openBridges: migrateBridges(candidate.openBridges),
    animalBook: migrateAnimalBook(candidate.animalBook),
    pet: migratePet(candidate.pet),
    locale: migrateLocale(candidate.locale),
     structures: migrateStructures(candidate.structures),
     depletedNodeIds: migrateNodeIds(candidate.depletedNodeIds),
     plantedNodes: migratePlantedNodes(candidate.plantedNodes),
     clockSeconds: migrateCount(candidate.clockSeconds, 'relogio'),
    volume: migrateVolume(candidate.volume),
    cameraSensitivity: migrateSensitivity(candidate.cameraSensitivity),
  };
}

type MinimalStorage = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>;

export class LocalStorageRepository implements SaveRepository {
  // Campo explicito, e nao propriedade de parametro: o projeto compila com
  // `erasableSyntaxOnly`, que so aceita sintaxe apagavel sem emitir codigo.
  private readonly storage: MinimalStorage;

  constructor(storage: MinimalStorage) {
    this.storage = storage;
  }

  save(save: GameSave): void {
    try {
      this.storage.setItem(SAVE_STORAGE_KEY, JSON.stringify(save));
    } catch {
      // Armazenamento indisponivel (aba privada, cota): segue sem persistir. O
      // jogo nao para por causa disso.
    }
  }

  load(): GameSave | null {
    try {
      const raw = this.storage.getItem(SAVE_STORAGE_KEY);
      if (raw === null) return null;
      return migrateSave(JSON.parse(raw));
    } catch {
      // Save corrompido ou de versao desconhecida: comeca do zero, em silencio.
      return null;
    }
  }

  clear(): void {
    try {
      this.storage.removeItem(SAVE_STORAGE_KEY);
    } catch {
      // Nada a limpar.
    }
  }
}

/**
 * Repositorio da aplicacao.
 *
 * `localStorage` pode nem existir (SSR, teste em node). O objeto vazio deixa o
 * jogo rodar sem persistir, que e exatamente o comportamento desejado.
 */
const armazenamentoVazio: MinimalStorage = {
  getItem: () => null,
  setItem: () => {},
  removeItem: () => {},
};

export const saveRepository = new LocalStorageRepository(
  typeof window !== 'undefined' && window.localStorage ? window.localStorage : armazenamentoVazio,
);
