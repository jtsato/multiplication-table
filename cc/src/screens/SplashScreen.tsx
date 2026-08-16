import { useEffect } from 'react';
import { getPalette } from '../domain/islands';
import { useTranslation } from '../i18n/I18nProvider';
import { Mascot } from '../art/Mascot';

interface SplashScreenProps {
  /** Chamado quando a animacao termina E o estado ja foi carregado. */
  onDone: () => void;
  ready: boolean;
}

const MIN_DURATION_MS = 1200;

/** Tela de abertura. Curta: existe para o carregamento nao piscar. */
export function SplashScreen({ onDone, ready }: SplashScreenProps) {
  const { t } = useTranslation();
  const palette = getPalette(2);

  useEffect(() => {
    if (!ready) {
      return;
    }
    const timer = setTimeout(onDone, MIN_DURATION_MS);
    return () => clearTimeout(timer);
  }, [ready, onDone]);

  return (
    <div className="splash">
      <div className="splash__blocks" aria-hidden="true">
        {['#ff5d8f', '#ffd23f', '#6ecb56', '#3aa0ff', '#c86bff'].map((color, index) => (
          <span
            key={color}
            className="splash__block"
            style={{ background: color, animationDelay: `${index * 0.12}s` }}
          />
        ))}
      </div>

      <Mascot palette={palette} size={104} mood="cheering" />

      <h1 className="splash__title">{t('splash.title')}</h1>
      <p className="splash__tagline">{t('splash.tagline')}</p>
      <p className="splash__loading">{t('common.loading')}</p>
    </div>
  );
}
