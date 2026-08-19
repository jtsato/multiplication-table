import { migrateAvatar, type AvatarSelection } from '../avatar/avatar.logic';
import { bridgeById } from '../regions/bridges.logic';
import { migrateLocale, type UserLocale } from '../../i18n';
import type { ShopItemKind } from '../economy/economy.logic';
import { SHOP_ITEMS } from '../economy/economy.logic';
import { emptyInventory, RESOURCE_KINDS, type Inventory } from '../resources/resources.logic';
import {
  migrateAnimalBook,
  migratePet,
  type AnimalBookEntry,
  type AnimalKind,
} from '../wildlife/wildlife.logic';

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
export const SAVE_VERSION = 1;

export const SAVE_STORAGE_KEY = 'numi-99.save';

export interface GameSave {
  version: typeof SAVE_VERSION;
  coins: number;
  /** Fatos ja resolvidos ao menos uma vez, na forma "2x4". */
  knownFacts: string[];
  inventory: Inventory;
  owned: ShopItemKind[];
  hints: number;
  avatar: AvatarSelection;
  /** Pontes ja compradas. Ausente num save anterior as regioes, e ai e `[]`. */
  openBridges: string[];
  /** Caderneta dos animais. Ausente num save anterior a Fase 5, e ai e vazia. */
  animalBook: AnimalBookEntry[];
  /** Animal escolhido como pet. Ausente antes da Fase 5, e ai e `null`. */
  pet: AnimalKind | null;
  /** Idioma escolhido. Ausente num save anterior ao i18n, e ai e o padrao. */
  locale: UserLocale;
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

  if (candidate.version !== SAVE_VERSION) {
    throw new Error(`versao de save nao suportada: ${String(candidate.version)}`);
  }

  return {
    version: SAVE_VERSION,
    coins: migrateCount(candidate.coins, 'moedas'),
    knownFacts: migrateFacts(candidate.knownFacts),
    inventory: migrateInventory(candidate.inventory),
    owned: migrateOwned(candidate.owned),
    hints: migrateCount(candidate.hints, 'dicas'),
    avatar: migrateAvatar(candidate.avatar),
    openBridges: migrateBridges(candidate.openBridges),
    animalBook: migrateAnimalBook(candidate.animalBook),
    pet: migratePet(candidate.pet),
    locale: migrateLocale(candidate.locale),
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
