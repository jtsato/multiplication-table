import { getIsland } from '../domain/islands';
import { missionsForTable } from '../domain/missions';
import { islandStatus, missionProgress, nextMissionForTable } from '../domain/progression';
import type { GameState } from '../domain/types';
import { useTranslation } from '../i18n/I18nProvider';
import { IslandBadge } from '../art/IslandBadge';
import { Button } from '../ui/Button';
import { ScreenLayout } from '../ui/ScreenLayout';
import { TableLadder } from '../ui/TableLadder';

interface IslandStudyScreenProps {
  state: GameState;
  table: number;
  onPlay: () => void;
  onBack: () => void;
}

/**
 * O cartao da ilha: a tabuada inteira antes de jogar.
 *
 * A tabuada pertence a ILHA, e nao a missao - por isso ela mora numa tela
 * propria entre o mapa e a missao, e nao dentro do briefing, que se repete
 * quatro vezes por ilha.
 *
 * Estudar aqui e sempre opcional: o botao de jogar esta no rodape, visivel
 * sem rolar, e a crianca pode ignorar a escada inteira.
 */
export function IslandStudyScreen({ state, table, onPlay, onBack }: IslandStudyScreenProps) {
  const { t } = useTranslation();
  const island = getIsland(table);
  const missions = missionProgress(state.progress, table);
  // Ilha terminada nao tem "proxima": o rotulo aponta para a mesma missao que
  // `enterMission` vai abrir, que ali volta a ser a primeira.
  const next = nextMissionForTable(state.progress, table) ?? missionsForTable(table)[0];
  const order = next?.order ?? 1;

  return (
    <ScreenLayout
      title={t('map.tableLabel', { table })}
      subtitle={t('map.missions', { completed: missions.completed, total: missions.total })}
      onBack={onBack}
      backLabel={t('common.back')}
      className="study"
      footer={
        <Button size="lg" block onClick={onPlay}>
          {t('study.play', { order })}
        </Button>
      }
    >
      <div className="study__island">
        <IslandBadge
          biome={island.biome}
          palette={island.palette}
          status={islandStatus(state.progress, table)}
          size={72}
        />
        <div>
          <p className="study__island-name">{t(`islands.${table}.name`)}</p>
          <p className="study__hint">{t('study.hint', { table })}</p>
        </div>
      </div>

      <div className="study__card">
        <TableLadder table={table} color={island.palette.block} stats={state.statistics.facts} />
      </div>
    </ScreenLayout>
  );
}
