import { useId, useMemo } from 'react';
import type { BiomePalette, DecorKind } from '../domain/islands';
import type { SceneType } from '../domain/missions';
import type { AvatarConfig } from '../domain/types';
import { Avatar } from './Avatar';
import { Decor } from './Decor';
import {
  buildSceneBlocks,
  GROUND_Y,
  SCENE_HEIGHT,
  SCENE_WIDTH,
  sceneHasWater,
  UNIT,
  visibleBlockCount,
} from './scenes';

/**
 * O cenario da missao.
 *
 * Tudo e SVG gerado pelo projeto: ceu, nuvens, morros, chao, agua, enfeites,
 * a construcao e o personagem. Os blocos da construcao aparecem conforme o
 * progresso; como cada bloco mantem sua chave, apenas os novos "nascem" com
 * animacao - os antigos ficam parados.
 */

interface SceneViewProps {
  scene: SceneType;
  palette: BiomePalette;
  decor: readonly DecorKind[];
  /** 0..1 - fracao da construcao concluida. */
  progress: number;
  avatar: AvatarConfig;
  celebrating?: boolean;
  reducedMotion?: boolean;
  ariaLabel?: string;
}

/** Trecho de agua sob as cenas que atravessam um rio ou o mar. */
function waterSpan(scene: SceneType): { x: number; width: number } | null {
  if (scene === 'bridge') {
    return { x: 8 * UNIT, width: 14 * UNIT };
  }
  if (scene === 'boat') {
    return { x: 7 * UNIT, width: 17 * UNIT };
  }
  return null;
}

function Clouds({ reducedMotion }: { reducedMotion: boolean }) {
  const cloudClass = reducedMotion ? 'scene__cloud' : 'scene__cloud scene__cloud--drifting';
  return (
    <g fill="#ffffff" opacity="0.75">
      <g className={cloudClass}>
        <rect x="40" y="26" width="34" height="10" rx="2" />
        <rect x="50" y="18" width="18" height="10" rx="2" />
      </g>
      <g className={cloudClass} style={{ animationDelay: '-6s' }}>
        <rect x="150" y="16" width="40" height="10" rx="2" />
        <rect x="162" y="8" width="20" height="10" rx="2" />
      </g>
      <g className={cloudClass} style={{ animationDelay: '-12s' }}>
        <rect x="250" y="34" width="28" height="9" rx="2" />
      </g>
    </g>
  );
}

export function SceneView({
  scene,
  palette,
  decor,
  progress,
  avatar,
  celebrating = false,
  reducedMotion = false,
  ariaLabel,
}: SceneViewProps) {
  const gradientId = useId();
  const blocks = useMemo(() => buildSceneBlocks(scene, palette), [scene, palette]);
  const visible = visibleBlockCount(blocks.length, progress);
  const water = waterSpan(scene);
  const complete = progress >= 1;

  // Ao terminar uma ponte, o personagem atravessa para o outro lado.
  const walksAcross = complete && sceneHasWater(scene);

  return (
    <svg
      className="scene"
      viewBox={`0 0 ${SCENE_WIDTH} ${SCENE_HEIGHT}`}
      preserveAspectRatio="xMidYMax meet"
      shapeRendering="crispEdges"
      role="img"
      aria-label={ariaLabel}
    >
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={palette.skyTop} />
          <stop offset="100%" stopColor={palette.skyBottom} />
        </linearGradient>
      </defs>

      <rect x="0" y="0" width={SCENE_WIDTH} height={SCENE_HEIGHT} fill={`url(#${gradientId})`} />

      <rect x="306" y="16" width="22" height="22" rx="3" fill={palette.accentSoft} opacity="0.9" />
      <Clouds reducedMotion={reducedMotion} />

      {/* Morros ao fundo */}
      <g fill={palette.groundMid} opacity="0.55">
        <rect x="12" y="132" width="96" height="36" />
        <rect x="36" y="120" width="48" height="16" />
        <rect x="200" y="126" width="120" height="42" />
        <rect x="240" y="112" width="52" height="18" />
      </g>

      {/* Chao em camadas */}
      <rect x="0" y={GROUND_Y} width={SCENE_WIDTH} height={UNIT} fill={palette.groundTop} />
      <rect x="0" y={GROUND_Y + UNIT} width={SCENE_WIDTH} height={UNIT} fill={palette.groundMid} />
      <rect
        x="0"
        y={GROUND_Y + UNIT * 2}
        width={SCENE_WIDTH}
        height={SCENE_HEIGHT - GROUND_Y - UNIT * 2}
        fill={palette.groundDeep}
      />

      {/* Rio ou mar, quando a cena precisa */}
      {water && (
        <g>
          <rect
            x={water.x}
            y={GROUND_Y}
            width={water.width}
            height={SCENE_HEIGHT - GROUND_Y}
            fill={palette.waterDeep}
          />
          <rect
            x={water.x}
            y={GROUND_Y}
            width={water.width}
            height={UNIT * 2}
            fill={palette.water}
          />
          <g className={reducedMotion ? undefined : 'scene__waves'} fill="#ffffff" opacity="0.35">
            <rect x={water.x + 16} y={GROUND_Y + 4} width="20" height="4" />
            <rect x={water.x + 62} y={GROUND_Y + 12} width="26" height="4" />
            <rect x={water.x + 118} y={GROUND_Y + 5} width="18" height="4" />
          </g>
        </g>
      )}

      {/* Enfeites do bioma, sempre fora da area de construcao */}
      <Decor kind={decor[0] ?? 'tree'} x={4} groundY={GROUND_Y} palette={palette} />
      <Decor kind={decor[1] ?? 'flower'} x={326} groundY={GROUND_Y} palette={palette} />
      {decor[2] && <Decor kind={decor[2]} x={300} groundY={GROUND_Y} palette={palette} />}

      {/* A construcao: um bloco por acerto */}
      <g>
        {blocks.slice(0, visible).map((block, index) => (
          <rect
            key={`${block.x}-${block.y}`}
            className={[
              'scene__block',
              reducedMotion ? '' : 'scene__block--pop',
              block.glow && complete ? 'scene__block--glow' : '',
            ]
              .filter(Boolean)
              .join(' ')}
            x={block.x}
            y={block.y}
            width={block.w}
            height={block.h}
            fill={block.color}
            data-index={index}
          />
        ))}
      </g>

      {/*
        Dois grupos de proposito: o de fora posiciona o personagem com o
        atributo `transform`, o de dentro recebe as animacoes CSS. Se as duas
        coisas ficassem no mesmo elemento, o transform do CSS apagaria o
        posicionamento do atributo.
      */}
      <g transform={`translate(30, ${GROUND_Y - 60})`}>
        <g
          className={[
            'scene__hero',
            celebrating && !reducedMotion ? 'scene__hero--celebrating' : '',
            walksAcross ? 'scene__hero--crossing' : '',
          ]
            .filter(Boolean)
            .join(' ')}
        >
          <Avatar avatar={avatar} size={60} />
        </g>
      </g>
    </svg>
  );
}
