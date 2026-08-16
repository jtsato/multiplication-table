import { useTranslation } from '../i18n/I18nProvider';

interface StarsProps {
  /** Estrelas conquistadas, 0..3. */
  count: number;
  total?: number;
  size?: number;
}

const STAR_PATH = 'M12 2 L15 9 L22 9.5 L16.5 14 L18.5 21 L12 17 L5.5 21 L7.5 14 L2 9.5 L9 9 Z';

/**
 * Estrelas da ilha. O numero tambem vai em texto para leitores de tela:
 * o status nunca depende so do desenho.
 */
export function Stars({ count, total = 3, size = 28 }: StarsProps) {
  const { t } = useTranslation();

  return (
    <span className="stars" role="img" aria-label={t('map.stars', { count })}>
      {Array.from({ length: total }, (_, index) => {
        const earned = index < count;
        return (
          <svg
            key={index}
            className={earned ? 'star star--earned' : 'star star--empty'}
            viewBox="0 0 24 24"
            width={size}
            height={size}
            aria-hidden="true"
          >
            <path d={STAR_PATH} />
          </svg>
        );
      })}
    </span>
  );
}
