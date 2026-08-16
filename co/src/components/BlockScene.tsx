import type { IslandDefinition } from '../content/islands';
import { Avatar } from './Avatar';
import { useGame } from '../state/GameProvider';
import { useI18n } from '../i18n/useI18n';

export function BlockScene({
  island,
  built,
  total = 6,
  celebrating = false,
}: {
  island: IslandDefinition;
  built: number;
  total?: number;
  celebrating?: boolean;
}) {
  const { state } = useGame();
  const t = useI18n();
  const player = state.player;
  const blocks = Array.from({ length: total }, (_, index) => index < built);
  return (
    <div
      className={`block-scene block-scene--${island.biome}`}
      style={
        {
          '--sky': island.palette.sky,
          '--land': island.palette.land,
          '--accent': island.palette.accent,
          '--dark': island.palette.dark,
        } as React.CSSProperties
      }
      aria-label={t(`construction.${island.construction}`)}
    >
      <div className="scene-sun" />
      <div className="scene-island">
        <span />
        <span />
        <span />
      </div>
      <div className={`construction construction--${island.construction}`}>
        {blocks.map((done, index) => (
          <i
            key={index}
            className={done ? 'is-built' : ''}
            style={{ '--order': index } as React.CSSProperties}
          />
        ))}
      </div>
      <div className={`scene-water ${island.biome === 'volcano' ? 'scene-water--lava' : ''}`}>
        <i />
        <i />
        <i />
      </div>
      {player && (
        <div className={`scene-avatar ${built === total ? 'scene-avatar--crossed' : ''}`}>
          <Avatar
            style={player.avatarStyle}
            outfitColor={player.outfitColor}
            hairStyle={player.hairStyle}
            accessory={player.accessory}
            size="small"
            celebrating={celebrating}
          />
        </div>
      )}
      <div className="scene-mascot" aria-hidden="true">
        <i />
        <b>•ᴗ•</b>
      </div>
    </div>
  );
}
