import { useI18n } from '../i18n/I18nProvider';
import { Mascot } from '../render/Mascot';

/** Tela de carregamento inicial. O logo é montado com blocos, sem imagens. */
export function SplashScreen() {
  const { t } = useI18n();
  return (
    <section className="splash">
      <div className="logo" aria-label={t('app.title')} role="img">
        {'BLOQUILHA'.split('').map((letter, index) => (
          <span className="logo__block" key={`${letter}-${index}`} style={{ ['--i' as string]: index }}>
            {letter}
          </span>
        ))}
      </div>
      <p className="splash__tagline">{t('app.tagline')}</p>
      <Mascot mood="happy" size={90} />
      <p className="splash__loading">{t('common.loading')}</p>
    </section>
  );
}
