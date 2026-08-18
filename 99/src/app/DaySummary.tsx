import { useGameStore } from './store';
import './summary.css';

/**
 * Resumo do dia, no amanhecer.
 *
 * Ocupa o lugar da tela de desfecho removida na Fase 1, com uma diferenca que
 * importa: nao ha botao de "jogar de novo", porque nao acabou nada. So um
 * "Continuar".
 *
 * O texto e elogio concreto, nao pontuacao — "14 contas certas" e "voce
 * aprendeu 2x7", nao "800 pontos". E tambem, de quebra, o relatorio que o adulto
 * quer ver, sem nunca ter sido apresentado a crianca como avaliacao.
 */
export function DaySummary() {
  const open = useGameStore((state) => state.summaryOpen);
  const day = useGameStore((state) => state.clock.day);
  const correctToday = useGameStore((state) => state.correctToday);
  const coinsToday = useGameStore((state) => state.coinsToday);
  const newFactsToday = useGameStore((state) => state.newFactsToday);
  const closeSummary = useGameStore((state) => state.closeSummary);

  if (!open) return null;

  return (
    <div className="summary-overlay">
      <div className="summary" role="dialog" aria-label="Resumo do dia">
        <h2 className="summary__title">Amanheceu — dia {day}</h2>

        <ul className="summary__lines">
          <li>
            <strong>{correctToday}</strong> {correctToday === 1 ? 'conta certa' : 'contas certas'}
          </li>
          <li>
            <strong>{coinsToday}</strong> {coinsToday === 1 ? 'moeda' : 'moedas'}
          </li>
        </ul>

        {/* A descoberta ganha destaque próprio: é a única linha que fala do que
            a criança aprendeu, e não do que ela juntou. */}
        {newFactsToday.length > 0 && (
          <p className="summary__facts">
            Você aprendeu {newFactsToday.map((fact) => fact.replace('x', ' × ')).join(', ')}
          </p>
        )}

        <button type="button" className="summary__button" onClick={closeSummary} autoFocus>
          Continuar
        </button>
      </div>
    </div>
  );
}
