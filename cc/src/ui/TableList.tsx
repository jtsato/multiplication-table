import { factKey, factsForTable, productOf } from '../domain/facts';
import { isMastered, isStruggling } from '../domain/mastery';
import type { FactStats } from '../domain/types';
import { useTranslation } from '../i18n/I18nProvider';

interface TableListProps {
  table: number;
  /** Estatisticas por conta, para marcar o que ja esta dominado. */
  stats: FactStats;
}

/**
 * A tabuada da ilha escrita por extenso, do jeito da escola.
 *
 * Sem desenho de blocos: o que a crianca precisa levar para a missao e o
 * numero, e o numero fica maior quando nao divide a linha com uma fileira de
 * quadradinhos. A representacao visual do que a conta significa continua
 * existindo onde ela e util - no `HintArray`, logo depois de um erro.
 *
 * O que a lista acrescenta a uma tabuada de papel e o progresso: cada linha
 * mostra se aquela conta ja esta dominada ou se ainda escorrega.
 */
export function TableList({ table, stats }: TableListProps) {
  const { t } = useTranslation();

  return (
    <ol className="table-list">
      {factsForTable(table).map((fact) => {
        const key = factKey(fact);
        const mastered = isMastered(stats, key);
        const struggling = isStruggling(stats, key);

        return (
          <li
            key={key}
            className={`table-list__row ${struggling ? 'table-list__row--weak' : ''}`.trimEnd()}
          >
            <span className="table-list__fact">
              {fact.a} × {fact.b}
            </span>
            <span className="table-list__equals" aria-hidden="true">
              =
            </span>
            <span className="table-list__result">{productOf(fact)}</span>

            <span className="table-list__mark">
              {mastered && (
                <span role="img" aria-label={t('study.mastered')}>
                  ⭐
                </span>
              )}
              {!mastered && struggling && (
                <span role="img" aria-label={t('study.struggling')}>
                  👀
                </span>
              )}
            </span>
          </li>
        );
      })}
    </ol>
  );
}
