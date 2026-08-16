import { useEffect, useRef, type RefObject } from 'react';

/**
 * Rastreia as teclas fisicas pressionadas em um `Set` guardado num ref.
 *
 * Devolve um ref, e nao estado do React, de proposito: o loop de quadro le as
 * teclas 60 vezes por segundo e nenhuma dessas leituras pode disparar
 * re-renderizacao da arvore (regra de performance do projeto).
 *
 * Usa `event.code` (layout fisico), entao WASD continua no mesmo lugar em
 * teclados AZERTY ou Dvorak.
 */
export function useHeldKeys(): RefObject<Set<string>> {
  const keysRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    const held = keysRef.current;

    const onKeyDown = (event: KeyboardEvent) => {
      held.add(event.code);
    };
    const onKeyUp = (event: KeyboardEvent) => {
      held.delete(event.code);
    };
    // Ao trocar de aba, o `keyup` nunca chega e a tecla ficaria "presa".
    const onBlur = () => held.clear();

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    window.addEventListener('blur', onBlur);

    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
      window.removeEventListener('blur', onBlur);
      held.clear();
    };
  }, []);

  return keysRef;
}

/**
 * Executa uma acao no momento em que a tecla e pressionada (borda, nao estado).
 *
 * Serve para acoes pontuais como interagir (E) ou construir (B), que nao devem
 * repetir enquanto a tecla fica segurada — por isso `event.repeat` e ignorado.
 */
export function useKeyPress(code: string, handler: () => void): void {
  const handlerRef = useRef(handler);
  // Atualizado em efeito, nao durante o render: escrever num ref no corpo do
  // componente quebra o modelo de concorrencia do React (regra react-hooks/refs).
  // Sem deps de proposito — o handler deve refletir sempre o ultimo render.
  useEffect(() => {
    handlerRef.current = handler;
  });

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.code === code && !event.repeat) handlerRef.current();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [code]);
}
