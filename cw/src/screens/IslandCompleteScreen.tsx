import { BlockButton } from '../components/BlockButton';
import { IslandArt } from '../render/IslandArt';
import { Mascot } from '../render/Mascot';
import { useI18n } from '../i18n/I18nProvider';
import { getIsland } from '../domain/world';

interface IslandCompleteScreenProps {
  table: number;
  unlockedTable: number | null;
  onContinue: () => void;
}

/** Celebração maior de fim de tabuada: a ilha aparece com suas construções. */
export function IslandCompleteScreen({ table, unlockedTable, onContinue }: IslandCompleteScreenProps) {
  const { t } = useI18n();
  const island = getIsland(table);

  return (
    <section className="island-complete">
      <div className="confetti" aria-hidden="true">
        {Array.from({ length: 18 }, (_, index) => (
          <span key={index} style={{ ['--i' as string]: index }} />
        ))}
      </div>
      <h1>{t('islandComplete.title', { island: t(island.nameKey) })}</h1>
      <IslandArt island={island} status="completed" size={190} />
      <p>{t('islandComplete.subtitle')}</p>
      <Mascot mood="cheer" size={80} />
      <p className="island-complete__unlock">
        {unlockedTable
          ? t('islandComplete.unlocked', { island: t(`islands.${unlockedTable}.name`) })
          : t('islandComplete.allDone')}
      </p>
      <BlockButton variant="primary" size="xl" onClick={onContinue}>
        {t('islandComplete.backToMap')}
      </BlockButton>
    </section>
  );
}
