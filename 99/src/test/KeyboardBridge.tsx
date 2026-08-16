import { useKeyboardBindings } from '../shared/input';

/**
 * Instala a ponte teclado -> acao nos testes.
 *
 * Em producao ela e montada uma unica vez, na raiz (`App`). Um teste que monta
 * so uma slice nao tem essa raiz, entao precisa monta-la aqui — do contrario o
 * teste teria que chamar `emitAction` direto e deixaria de cobrir o mapa de
 * teclas, que e justamente onde um erro de `event.code` apareceria.
 */
export function KeyboardBridge() {
  useKeyboardBindings();
  return null;
}
