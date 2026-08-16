import { BlockScene } from '../components/BlockScene';
import { getIsland } from '../content/islands';
import { TABLES } from '../domain/types';
import { useI18n } from '../i18n/useI18n';
import type { ResultSummary } from './GameScreen';

export function ResultScreen({ result, onMap }: { result: ResultSummary; onMap(): void }) {
  const t = useI18n();
  const island = getIsland(result.table);
  const total = result.correct + result.incorrect;
  const stars =
    total === 0 ? 1 : result.correct / total >= 0.8 ? 3 : result.correct / total >= 0.6 ? 2 : 1;
  const final = result.table === TABLES.at(-1);
  return (
    <section className="result-screen">
      <div className="confetti" aria-hidden="true">
        {Array.from({ length: 18 }, (_, i) => (
          <i key={i} style={{ '--i': i } as React.CSSProperties} />
        ))}
      </div>
      <div className="result-card">
        <span className="result-badge">✓</span>
        <h1>{t('result.title')}</h1>
        <p>{t('result.subtitle', { name: result.state.player?.name ?? '' })}</p>
        <BlockScene island={island} built={6} celebrating />
        <h2>{t(`construction.${island.construction}`)}</h2>
        <div className="result-stars" aria-label={t('island.stars', { stars })}>
          {[1, 2, 3].map((star) => (
            <i key={star} className={star <= stars ? 'is-earned' : ''}>
              ★
            </i>
          ))}
        </div>
        <strong className="reward-text">{t('result.reward', { stars })}</strong>
        <div className="result-stats">
          <div>
            <b>{result.correct}</b>
            <span>{t('result.correct')}</span>
          </div>
          <div>
            <b>{result.incorrect}</b>
            <span>{t('result.incorrect')}</span>
          </div>
        </div>
        <p className="unlock-note">{t(final ? 'result.allComplete' : 'result.nextUnlocked')}</p>
        <button className="primary-button" onClick={onMap}>
          {t('result.map')}
        </button>
      </div>
    </section>
  );
}
