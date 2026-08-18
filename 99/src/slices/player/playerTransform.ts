/**
 * Posicao viva do jogador, fora do React.
 *
 * Por que nao guardar isto no store Zustand: a posicao muda todo quadro, e
 * escrever no store a 60 Hz re-renderizaria toda a arvore assinante. Outras
 * slices (recursos, construcao, lanterna) precisam da posicao *dentro* do
 * proprio `useFrame` delas — ou seja, no mesmo quadro, sem passar pelo React.
 *
 * Este objeto e mutavel de proposito: `PlayerView` escreve nele uma vez por
 * quadro e todo o resto so le. O HUD recebe uma copia amostrada com throttle,
 * pelo store.
 */
export const playerTransform = {
  x: 0,
  y: 0,
  z: 0,
  /** Angulo da camera em torno de Y, em radianos. */
  yaw: 0,
};

export function resetPlayerTransform(): void {
  playerTransform.x = 0;
  playerTransform.y = 0;
  playerTransform.z = 0;
  playerTransform.yaw = 0;
}
