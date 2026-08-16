import type { GameState } from '../domain/types';

/**
 * De onde o progresso veio nesta sessao.
 *  - `fresh`     primeiro acesso, nada salvo ainda;
 *  - `stored`    save valido e na versao atual;
 *  - `migrated`  save antigo convertido para o schema atual;
 *  - `recovered` save corrompido; o que deu para aproveitar foi mantido.
 */
export type LoadSource = 'fresh' | 'stored' | 'migrated' | 'recovered';

export interface LoadOutcome {
  state: GameState;
  source: LoadSource;
}

/**
 * Contrato de persistencia do jogo.
 *
 * O MVP usa `LocalStorageProgressRepository`. Trocar por um backend no futuro
 * e escrever um `ApiProgressRepository` com esta mesma interface e injeta-lo
 * no provider - nenhuma tela e nenhuma regra de dominio muda.
 * Por isso os metodos ja sao assincronos, mesmo sendo sincronos hoje.
 */
export interface ProgressRepository {
  load(): Promise<LoadOutcome>;
  save(state: GameState): Promise<void>;
  clear(): Promise<void>;
}
