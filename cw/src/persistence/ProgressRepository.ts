import type { GameState } from '../domain/types';

/**
 * Contrato de persistência do jogo. A lógica do jogo nunca conhece o
 * mecanismo de armazenamento — apenas esta interface.
 *
 * Hoje: LocalStorageProgressRepository.
 * Amanhã: ApiProgressRepository (mesma interface, zero mudança no domínio).
 */
export interface ProgressRepository {
  load(): Promise<GameState>;
  save(state: GameState): Promise<void>;
  clear(): Promise<void>;
}
