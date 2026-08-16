import { BlockButton } from '../components/BlockButton';
import { Stars } from '../components/Stars';
import { Mascot } from '../render/Mascot';
import { useI18n } from '../i18n/I18nProvider';

interface ResultScreenProps {
  correct: number;
  total: number;
  stars: number;
  hasNextMission: boolean;
  onNext: () => void;
  onMap: () => void;
}

export function ResultScreen({ correct, total, stars, hasNextMission, onNext, onMap }: ResultScreenProps) {
  const { t } = useI18n();
  const wrong = Math.max(0, total - correct);
  const accuracy = total > 0 ? Math.round((correct / total) * 100) : 0;

  return (
    <section className="result">
      <Mascot mood="cheer" size={96} />
      <h1>{t('result.title')}</h1>
      <Stars value={stars} size={44} label={t('common.stars', { count: stars })} />
      <dl className="result__stats">
        <div>
          <dt>{t('result.correct')}</dt>
          <dd>{correct}</dd>
        </div>
        <div>
          <dt>{t('result.wrong')}</dt>
          <dd>{wrong}</dd>
        </div>
        <div>
          <dt>{t('result.accuracy')}</dt>
          <dd>{accuracy}%</dd>
        </div>
      </dl>
      <div className="result__actions">
        {hasNextMission && (
          <BlockButton variant="primary" size="xl" onClick={onNext}>
            {t('result.nextMission')}
          </BlockButton>
        )}
        <BlockButton variant="secondary" size="lg" onClick={onMap}>
          {t('result.backToMap')}
        </BlockButton>
      </div>
    </section>
  );
}
