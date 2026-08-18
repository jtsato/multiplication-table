import type { CSSProperties } from 'react';
import { useTranslation } from '../i18n/I18nProvider';

interface HintArrayProps {
  /** Tabuada da conta: o tamanho de cada grupo. */
  a: number;
  /** Multiplicador: quantos grupos. */
  b: number;
  color: string;
}

/**
 * Ajuda visual depois de um erro: `b` grupos de `a` blocos.
 *
 * Mostra o que a multiplicacao significa em vez de dizer a resposta. E o
 * unico "castigo" por errar - ver a conta desenhada.
 *
 * A ordem e a mesma da escada da tela de estudo (`TableLadder`): o grupo tem
 * o tamanho da tabuada e a quantidade de grupos e o que cresce. Assim "10 x 3"
 * e sempre tres dezenas, na dica e no estudo.
 */
export function HintArray({ a, b, color }: HintArrayProps) {
  const { t } = useTranslation();

  return (
    <div
      className="hint"
      // Grupo de ate 5 blocos por fileira, igual a escada da tela de estudo:
      // uma dezena vira um retangulo 5x2 em vez de uma coluna de dez.
      style={{ '--hint-cols': Math.min(5, a) } as CSSProperties}
    >
      <p className="hint__title">{t('game.hintTitle', { groups: b, size: a })}</p>

      <div className="hint__groups">
        {Array.from({ length: b }, (_, group) => (
          <div className="hint__group" key={group}>
            {Array.from({ length: a }, (_, item) => (
              <span
                className="hint__block"
                key={item}
                style={{ background: color, animationDelay: `${(group * a + item) * 0.03}s` }}
              />
            ))}
          </div>
        ))}
      </div>

      <p className="hint__count">{t('game.hintCount', { answer: a * b })}</p>
    </div>
  );
}
