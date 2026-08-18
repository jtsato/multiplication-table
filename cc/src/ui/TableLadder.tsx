import type { CSSProperties } from 'react';
import { factsForTable, productOf } from '../domain/facts';
import { factKey } from '../domain/facts';
import { isMastered, isStruggling } from '../domain/mastery';
import type { FactStats } from '../domain/types';
import { useTranslation } from '../i18n/I18nProvider';

interface TableLadderProps {
  table: number;
  /** Cor dos blocos; vem da paleta do bioma da ilha. */
  color: string;
  /** Estatisticas por conta, para marcar o que ja esta dominado. */
  stats: FactStats;
}

/**
 * A tabuada inteira como uma escada de blocos.
 *
 * Cada linha e `b` grupos de `table` blocos - a MESMA ordem do `HintArray`
 * que aparece depois de um erro, para "multiplicar" ter um desenho so no jogo
 * inteiro. A ordem importa: com `table` grupos de `b`, a tabuada do 10 vira
 * dez grupinhos em toda linha, todas iguais, e o padrao some. Assim, cada
 * degrau ganha um grupo a mais - dois blocos na ilha do 2, uma dezena inteira
 * na do 10.
 *
 * O bloco encolhe conforme a tabuada cresce: na do 10 a ultima linha tem 100
 * blocos e precisa caber na mesma largura da primeira.
 */
/** Lado do bloco: quanto maior a tabuada, mais blocos por linha, menor o bloco. */
function blockSize(table: number): number {
  if (table <= 5) {
    return 10;
  }
  return table <= 7 ? 8 : 6;
}

export function TableLadder({ table, color, stats }: TableLadderProps) {
  const { t } = useTranslation();
  const facts = factsForTable(table);

  const style = {
    '--ladder-color': color,
    '--ladder-block': `${blockSize(table)}px`,
    // Grupo de ate 5 blocos por fileira: uma dezena vira um retangulo 5x2 em
    // vez de uma fita de 10, que nao caberia dez vezes na mesma linha.
    '--ladder-cols': Math.min(5, table),
  } as CSSProperties;

  return (
    <ol className="ladder" style={style}>
      {facts.map((fact) => {
        const key = factKey(fact);
        const mastered = isMastered(stats, key);
        const struggling = isStruggling(stats, key);
        const answer = productOf(fact);

        return (
          <li
            key={key}
            className={`ladder__row ${struggling ? 'ladder__row--weak' : ''}`.trimEnd()}
          >
            <span className="ladder__fact">
              {fact.a} × {fact.b}
            </span>

            {/* Os blocos sao a mesma informacao do numero, em desenho: quem
                usa leitor de tela ja ouviu "10 x 3" e "30". */}
            <span className="ladder__blocks" aria-hidden="true">
              {Array.from({ length: fact.b }, (_, group) => (
                <span className="ladder__group" key={group}>
                  {Array.from({ length: fact.a }, (_, block) => (
                    <span className="ladder__block" key={block} />
                  ))}
                </span>
              ))}
            </span>

            <span className="ladder__result">{answer}</span>

            <span className="ladder__mark">
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
