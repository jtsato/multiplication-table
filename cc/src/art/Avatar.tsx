import { HAIR_COLORS, OUTFIT_COLORS_HEX, SKIN_COLORS } from '../domain/avatar';
import type { AvatarConfig } from '../domain/types';

/**
 * Personagem em blocos, desenhado com retangulos SVG.
 *
 * Todas as opcoes (cabelo, cor, acessorio) valem para as duas bases: a unica
 * diferenca entre elas e a silhueta. Nada aqui muda regra de jogo.
 */

interface AvatarProps {
  avatar: AvatarConfig;
  /** Altura em pixels; a largura acompanha a proporcao 3:4. */
  size?: number;
  /** Anima o personagem comemorando um acerto. */
  celebrating?: boolean;
  className?: string;
  title?: string;
}

const OUTLINE = '#2b2233';
const SHOE = '#3b3247';
const EYE = '#2b2233';

function Hair({ avatar, color }: { avatar: AvatarConfig; color: string }) {
  switch (avatar.hair) {
    case 'long':
      return (
        <g fill={color}>
          <rect x="13" y="6" width="22" height="7" />
          <rect x="10" y="10" width="4" height="24" />
          <rect x="34" y="10" width="4" height="24" />
        </g>
      );
    case 'curly':
      return (
        <g fill={color}>
          <rect x="12" y="4" width="7" height="6" />
          <rect x="20" y="2" width="8" height="7" />
          <rect x="29" y="4" width="7" height="6" />
          <rect x="13" y="8" width="22" height="5" />
          <rect x="11" y="11" width="4" height="6" />
          <rect x="33" y="11" width="4" height="6" />
        </g>
      );
    case 'ponytail':
      return (
        <g fill={color}>
          <rect x="13" y="6" width="22" height="7" />
          <rect x="35" y="15" width="6" height="13" />
          <rect x="33" y="13" width="5" height="4" />
        </g>
      );
    case 'short':
    default:
      return (
        <g fill={color}>
          <rect x="13" y="6" width="22" height="7" />
          <rect x="13" y="13" width="3" height="5" />
          <rect x="32" y="13" width="3" height="5" />
        </g>
      );
  }
}

function Accessory({ avatar, outfitColor }: { avatar: AvatarConfig; outfitColor: string }) {
  switch (avatar.accessory) {
    case 'cap':
      return (
        <g>
          <rect x="12" y="2" width="24" height="7" fill={outfitColor} />
          <rect x="33" y="7" width="10" height="3" fill={outfitColor} />
          <rect x="12" y="2" width="24" height="2" fill="#ffffff" opacity="0.35" />
        </g>
      );
    case 'glasses':
      return (
        <g fill="none" stroke={OUTLINE} strokeWidth="2">
          <rect x="15" y="15" width="8" height="8" />
          <rect x="25" y="15" width="8" height="8" />
          <line x1="23" y1="19" x2="25" y2="19" />
        </g>
      );
    case 'crown':
      return (
        <g fill="#ffd23f">
          <rect x="15" y="3" width="18" height="4" />
          <rect x="15" y="0" width="4" height="4" />
          <rect x="22" y="0" width="4" height="4" />
          <rect x="29" y="0" width="4" height="4" />
        </g>
      );
    case 'none':
    default:
      return null;
  }
}

function Body({
  avatar,
  outfitColor,
  skinColor,
}: {
  avatar: AvatarConfig;
  outfitColor: string;
  skinColor: string;
}) {
  if (avatar.base === 'girl') {
    return (
      <g>
        <rect x="16" y="30" width="16" height="13" fill={outfitColor} />
        <rect x="12" y="42" width="24" height="9" fill={outfitColor} />
        <rect x="12" y="42" width="24" height="3" fill="#ffffff" opacity="0.25" />
        <rect x="18" y="51" width="5" height="8" fill={skinColor} />
        <rect x="25" y="51" width="5" height="8" fill={skinColor} />
        <rect x="16" y="59" width="8" height="4" fill={SHOE} />
        <rect x="24" y="59" width="8" height="4" fill={SHOE} />
      </g>
    );
  }

  return (
    <g>
      <rect x="15" y="30" width="18" height="17" fill={outfitColor} />
      <rect x="15" y="30" width="18" height="3" fill="#ffffff" opacity="0.25" />
      <rect x="17" y="47" width="6" height="12" fill="#3f5570" />
      <rect x="25" y="47" width="6" height="12" fill="#3f5570" />
      <rect x="15" y="59" width="8" height="4" fill={SHOE} />
      <rect x="25" y="59" width="8" height="4" fill={SHOE} />
    </g>
  );
}

export function Avatar({ avatar, size = 96, celebrating = false, className, title }: AvatarProps) {
  const skinColor = SKIN_COLORS[avatar.skin];
  const hairColor = HAIR_COLORS[avatar.hair];
  const outfitColor = OUTFIT_COLORS_HEX[avatar.outfit];

  const classes = ['avatar', celebrating ? 'avatar--celebrating' : '', className ?? '']
    .filter(Boolean)
    .join(' ');

  return (
    <svg
      className={classes}
      viewBox="0 0 48 64"
      width={(size * 48) / 64}
      height={size}
      shapeRendering="crispEdges"
      role={title ? 'img' : 'presentation'}
      aria-label={title}
      aria-hidden={title ? undefined : true}
    >
      {/* Cabelo de tras primeiro, para o rosto ficar por cima. */}
      {(avatar.hair === 'long' || avatar.hair === 'ponytail') && (
        <Hair avatar={avatar} color={hairColor} />
      )}

      {/* Bracos */}
      <rect x="9" y="31" width="6" height="13" fill={outfitColor} />
      <rect x="33" y="31" width="6" height="13" fill={outfitColor} />
      <rect x="9" y="44" width="6" height="5" fill={skinColor} />
      <rect x="33" y="44" width="6" height="5" fill={skinColor} />

      <Body avatar={avatar} outfitColor={outfitColor} skinColor={skinColor} />

      {/* Cabeca */}
      <rect x="13" y="10" width="22" height="18" fill={skinColor} />
      <rect x="17" y="17" width="4" height="4" fill={EYE} />
      <rect x="27" y="17" width="4" height="4" fill={EYE} />
      <rect x="15" y="21" width="3" height="3" fill="#ff8fa3" opacity="0.55" />
      <rect x="30" y="21" width="3" height="3" fill="#ff8fa3" opacity="0.55" />
      <rect x="21" y="23" width="6" height="3" fill="#a9503f" />

      <Hair avatar={avatar} color={hairColor} />
      <Accessory avatar={avatar} outfitColor={outfitColor} />
    </svg>
  );
}
