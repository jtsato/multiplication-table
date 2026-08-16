/**
 * O React precisa saber que esta num ambiente de teste para nao avisar sobre
 * atualizacoes fora de `act(...)`. O renderizador de teste do R3F ja embrulha as
 * suas proprias atualizacoes; sem esta flag, cada montagem imprime um aviso.
 */
globalThis.IS_REACT_ACT_ENVIRONMENT = true;

declare global {
  var IS_REACT_ACT_ENVIRONMENT: boolean;
}

export {};
