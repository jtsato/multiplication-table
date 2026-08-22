/**
 * Medição de FPS.
 *
 * O contador é mutável de módulo de propósito: `tickFps` roda dentro do
 * `useFrame` (60x/s) e não pode passar pelo React. O DOM lê `currentFps` num
 * intervalo — mesmo padrão do joystick e do relógio.
 */

let frameCount = 0;
let windowStart = 0;
let lastFps = 0;

/** Conta um quadro e devolve o FPS atual (atualiza no máximo 1x/segundo). */
export function tickFps(now: number = performance.now()): number {
  if (windowStart === 0) windowStart = now;
  frameCount += 1;

  const elapsed = now - windowStart;
  if (elapsed >= 1000) {
    lastFps = Math.round((frameCount * 1000) / elapsed);
    frameCount = 0;
    windowStart = now;
  }
  return lastFps;
}

/** Último FPS medido, sem efeito colateral. */
export function currentFps(): number {
  return lastFps;
}

/** Zera o contador — usado nos testes. */
export function resetFps(): void {
  frameCount = 0;
  windowStart = 0;
  lastFps = 0;
}
