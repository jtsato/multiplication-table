import { useTranslation } from '../i18n/I18nProvider';

interface HintArrayProps {
  /** Quantidade de grupos. */
  a: number;
  /** Blocos por grupo. */
  b: number;
  color: string;
}

/**
 * Ajuda visual depois de um erro: `a` grupos de `b` blocos.
 *
 * Mostra o que a multiplicacao significa em vez de dizer a resposta. E o
 * unico "castigo" por errar - ver a conta desenhada.
 */
export function HintArray({ a, b, color }: HintArrayProps) {
  const { t } = useTranslation();

  return (
    <div className="hint">
      <p className="hint__title">{t('game.hintTitle', { a, b })}</p>

      <div className="hint__groups">
        {Array.from({ length: a }, (_, group) => (
          <div className="hint__group" key={group}>
            {Array.from({ length: b }, (_, item) => (
              <span
                className="hint__block"
                key={item}
                style={{ background: color, animationDelay: `${(group * b + item) * 0.03}s` }}
              />
            ))}
          </div>
        ))}
      </div>

      <p className="hint__count">{t('game.hintCount', { answer: a * b })}</p>
    </div>
  );
}
