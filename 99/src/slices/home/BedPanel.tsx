import { useGameStore } from '../../app/store';
import './bed.css';

/**
 * A cama.
 *
 * Dormir pula para o próximo amanhecer e fecha o dia. Existe mesmo tendo a noite
 * virado algo desejável nesta reforma: um porto seguro onde a criança não pode
 * decidir quando o dia acaba não é dela.
 *
 * O texto não empurra: "Dormir até amanhecer" e "Ainda não". Nenhuma das duas é
 * a resposta certa.
 */
export function BedPanel() {
  const openSpot = useGameStore((state) => state.openSpot);
  const sleep = useGameStore((state) => state.sleep);
  const closeSpot = useGameStore((state) => state.closeSpot);

  if (openSpot !== 'cama') return null;

  return (
    <div className="bed-overlay">
      <div className="bed" role="dialog" aria-label="Cama">
        <h2 className="bed__title">Sua cama</h2>
        <p className="bed__text">Quer dormir e acordar amanhã de manhã?</p>

        <div className="bed__actions">
          <button type="button" className="bed__button bed__button--sleep" onClick={sleep}>
            Dormir até amanhecer
          </button>
          <button type="button" className="bed__button" onClick={closeSpot}>
            Ainda não
          </button>
        </div>
      </div>
    </div>
  );
}
