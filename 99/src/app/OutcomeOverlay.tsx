import { restartGame, useGameStore } from './store';
import { resetDayNightClock } from '../slices/daynight';
import { resetPlayerTransform } from '../slices/player';
import './outcome.css';

/**
 * Tela de vitoria e derrota.
 *
 * Reinicia sem recarregar a pagina: o `restartGame` do store limpa todas as
 * slices, e os dois relogios vivos que moram fora do React sao zerados aqui.
 * Recarregar a pagina custaria a reinicializacao inteira do WASM do Rapier.
 */
export function OutcomeOverlay() {
  const outcome = useGameStore((state) => state.outcome);
  const day = useGameStore((state) => state.clock.day);

  if (outcome === 'jogando') return null;

  const venceu = outcome === 'venceu';

  function reiniciar() {
    resetDayNightClock();
    resetPlayerTransform();
    restartGame();
  }

  return (
    <div className={`outcome outcome--${venceu ? 'venceu' : 'perdeu'}`} role="alertdialog">
      <div className="outcome__card">
        <h1 className="outcome__title">{venceu ? 'Amanheceu!' : 'A noite venceu'}</h1>
        <p className="outcome__text">
          {venceu
            ? `Você atravessou a noite do dia ${day}. O fogo aguentou e a matemática segurou a ilha.`
            : 'Da próxima vez, junte mais madeira de dia e mantenha a fogueira acesa.'}
        </p>
        <button type="button" className="outcome__button" onClick={reiniciar} autoFocus>
          Jogar de novo
        </button>
      </div>
    </div>
  );
}
