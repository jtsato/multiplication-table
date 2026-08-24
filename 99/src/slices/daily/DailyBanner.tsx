import { useEffect, useMemo, useState } from 'react';
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
 * Aviso do evento do dia.
 *
 * Antes era uma faixa de texto atravessada no topo da tela o dia inteiro. Virou
 * um **sino**: um icone pequeno que so avisa que ha novidade. Quem quiser ler
 * aperta, e o recado abre no meio da tela, onde o olho ja esta.
 *
 * Ler **marca como lido**: o aviso fecha e o sino se apaga pelo resto do dia. No
 * dia seguinte, com evento novo, o sino volta a chamar — e por isso o "lido"
 * guarda o *numero do dia*, e nao um booleano.
 */
export function DailyBanner() {
  const day = useGameStore((state) => state.clock.day);
  const strings = useGameStore((state) => state.text.strings);
  const event = useMemo(() => eventForDay(day), [day]);

  /*
    Os dois estados guardam **o dia**, e nao um booleano.

    Assim a virada do dia ja fecha o aviso e reacende o sino sozinha, sem um
    efeito que observe `day` para chamar `setState` — cascata de render que o
    lint barra, e com razao.
  */
  const [openDay, setOpenDay] = useState<number | null>(null);
  const [readDay, setReadDay] = useState<number | null>(null);

  const open = openDay === day;

  // Escape fecha, como em qualquer outro painel do jogo.
  useEffect(() => {
    if (!open) return undefined;
    const onKey = (evento: KeyboardEvent) => {
      if (evento.key === 'Escape') setOpenDay(null);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  if (!hasDailyEvent(event.kind)) return null;

  const lido = readDay === day;
  const mensagem = strings[LABEL_KEYS[event.kind]];

  const marcarComoLido = () => {
    setReadDay(day);
    setOpenDay(null);
  };

  return (
    <>
      <button
        type="button"
        className={`daily-bell ${lido ? 'daily-bell--read' : ''}`}
        aria-label={strings.dailyButton}
        aria-haspopup="dialog"
        aria-expanded={open}
        onClick={() => setOpenDay(open ? null : day)}
      >
        <span className="daily-bell__icon" aria-hidden="true" />
        {/* O ponto some quando o recado ja foi lido: o sino continua ali para
            reler, mas para de pedir atencao. */}
        {!lido && <span className="daily-bell__dot" aria-hidden="true" />}
      </button>

      {open && (
        <div
          className="daily-overlay"
          role="dialog"
          aria-modal="true"
          aria-label={strings.dailyTitle}
          onClick={marcarComoLido}
        >
          <div className="daily-card" onClick={(evento) => evento.stopPropagation()}>
            <strong className="daily-card__title">{strings.dailyTitle}</strong>
            <p className="daily-card__text" role="status">
              {mensagem}
            </p>
            <button type="button" className="daily-card__button" onClick={marcarComoLido}>
              {strings.dailyDismiss}
            </button>
          </div>
        </div>
      )}
    </>
  );
}
