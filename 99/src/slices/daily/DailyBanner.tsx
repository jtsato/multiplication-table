import { useMemo } from 'react';
import { useGameStore } from '../../app/store';
import type { AppStrings } from '../../i18n';
import { eventForDay, hasDailyEvent, type DailyEventKind } from './daily.logic';
import './daily.css';

const LABEL_KEYS: Record<DailyEventKind, keyof AppStrings> = {
  'dia-comum': 'dailyTitle',
  chuva: 'dailyChuva',
  fartura: 'dailyFartura',
  visitante: 'dailyVisitante',
  'baleia-na-praia': 'dailyBaleiaNaPraia',
};

/**
 * Aviso do evento do dia, em DOM por cima do jogo.
 *
 * Aparece só quando o dia não é comum: chuva, fartura, visitante ou baleia perto
 * da Praia. É uma linha curta, sem modal — a criança vê e continua jogando.
 */
export function DailyBanner() {
  const day = useGameStore((state) => state.clock.day);
  const strings = useGameStore((state) => state.text.strings);
  const event = useMemo(() => eventForDay(day), [day]);

  if (!hasDailyEvent(event.kind)) return null;

  return (
    <div className="daily-banner" role="status">
      <strong>{strings.dailyTitle}</strong> {strings[LABEL_KEYS[event.kind]]}
    </div>
  );
}
