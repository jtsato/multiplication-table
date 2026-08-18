import { useGameStore } from '../../app/store';
import { factKey } from '../economy';
import './wallchart.css';

/** Linhas e colunas do mural: a tabuada inteira, de 1 a 10. */
const FATORES = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

/**
 * O mural da tabuada.
 *
 * Aqui **consultar é de graça e sem penalidade**. No campo, a dica custa moeda;
 * em casa, o resultado está na parede para quem quiser olhar. Essa diferença é a
 * decisão pedagógica da fase: o porto seguro é da matemática também, e não só do
 * escuro.
 *
 * O mural preenche sozinho conforme `knownFacts` cresce — a criança vê a própria
 * memória do jogo tomando forma, e o que ainda não conquistou aparece apagado,
 * mas com o número visível. Esconder o resultado transformaria o mural em prova.
 */
export function WallChart() {
  const openSpot = useGameStore((state) => state.openSpot);
  const knownFacts = useGameStore((state) => state.knownFacts);
  const closeSpot = useGameStore((state) => state.closeSpot);

  if (openSpot !== 'mural') return null;

  const dominados = FATORES.flatMap((linha) =>
    FATORES.filter((coluna) => knownFacts.includes(factKey(linha, coluna))),
  ).length;

  return (
    <div className="chart-overlay">
      <div className="chart" role="dialog" aria-label="Mural da tabuada">
        <header className="chart__head">
          <h2 className="chart__title">Mural da tabuada</h2>
          <span className="chart__count">
            {dominados} de {FATORES.length * FATORES.length}
          </span>
        </header>

        <table className="chart__grid">
          <caption className="chart__caption">Pode olhar à vontade — aqui não custa nada.</caption>
          <thead>
            <tr>
              <th scope="col" aria-label="tabuada">
                ×
              </th>
              {FATORES.map((coluna) => (
                <th key={coluna} scope="col">
                  {coluna}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {FATORES.map((linha) => (
              <tr key={linha}>
                <th scope="row">{linha}</th>
                {FATORES.map((coluna) => {
                  const conhecido = knownFacts.includes(factKey(linha, coluna));
                  return (
                    <td
                      key={coluna}
                      className={conhecido ? 'chart__cell chart__cell--known' : 'chart__cell'}
                      aria-label={`${linha} vezes ${coluna} é ${linha * coluna}${
                        conhecido ? ', você já sabe' : ''
                      }`}
                    >
                      {linha * coluna}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>

        <button type="button" className="chart__close" onClick={closeSpot}>
          Fechar
        </button>
      </div>
    </div>
  );
}
