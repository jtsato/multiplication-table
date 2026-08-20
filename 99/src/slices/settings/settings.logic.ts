/**
 * Configurações do jogador: volume, sensibilidade da câmera e tela cheia.
 *
 * A lógica é pura/curta de propósito — o que importa são os limites e o
 * comportamento de tela cheia, que é um efeito colateral do navegador.
 */

export const SETTINGS = {
  defaultVolume: 0.5,
  minVolume: 0,
  maxVolume: 1,
  defaultSensitivity: 1,
  minSensitivity: 0.5,
  maxSensitivity: 2,
  defaultInstantBuild: false,
} as const;

/** Limita o volume a [0, 1]. */
export function clampVolume(value: number): number {
  return Math.min(SETTINGS.maxVolume, Math.max(SETTINGS.minVolume, value));
}

/** Limita o multiplicador de sensibilidade a [0.5, 2]. */
export function clampSensitivity(value: number): number {
  return Math.min(SETTINGS.maxSensitivity, Math.max(SETTINGS.minSensitivity, value));
}

/** O navegador está em tela cheia? */
export function isFullscreen(): boolean {
  return typeof document !== 'undefined' && document.fullscreenElement != null;
}

/** Entra ou sai da tela cheia, sem lançar se o navegador não permitir. */
export function toggleFullscreen(): void {
  if (typeof document === 'undefined') return;
  if (isFullscreen()) {
    if (document.exitFullscreen) {
      void document.exitFullscreen().catch(() => {});
    }
  } else if (document.documentElement.requestFullscreen) {
    void document.documentElement.requestFullscreen().catch(() => {});
  }
}
