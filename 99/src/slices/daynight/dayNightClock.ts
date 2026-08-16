/**
 * Relogio vivo do jogo, fora do React.
 *
 * Mesmo motivo de `playerTransform`: o relogio avanca todo quadro, e escrever
 * isso no store a 60 Hz re-renderizaria a arvore inteira. `DayNightView` escreve
 * aqui uma vez por quadro; o store recebe uma amostra com throttle, e as outras
 * slices leem o valor vivo dentro do proprio `useFrame` delas.
 */
export const dayNightClock = {
  /** Segundos decorridos desde o inicio da partida. */
  seconds: 0,
};

export function resetDayNightClock(): void {
  dayNightClock.seconds = 0;
}
