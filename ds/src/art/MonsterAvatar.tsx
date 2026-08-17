/**
 * Sprites dos monstros, desenhados com blocos SVG (mesmo estilo do cc/src/art).
 *
 * Nada aqui muda regra de jogo: é pura apresentação. Cada monstro tem um
 * sprite próprio com silhueta e paleta distintas, em um viewBox 64×64.
 */

import type { MonsterSpriteId } from "./sprite-ids";

interface MonsterAvatarProps {
  monsterId: MonsterSpriteId;
  size?: number;
  className?: string;
  title?: string;
}

const OUTLINE = "#2b2233";
const EYE = "#2b2233";

/** Sombra no chão, comum a todos os sprites. */
function GroundShadow() {
  return <rect x="14" y="58" width="36" height="4" rx="2" fill={OUTLINE} opacity="0.18" />;
}

function AvengerSprite() {
  return (
    <g>
      {/* Capa */}
      <rect x="14" y="16" width="36" height="40" fill="#c0392b" />
      <rect x="14" y="16" width="36" height="6" fill="#ffffff" opacity="0.22" />
      {/* Corpo/armadura */}
      <rect x="20" y="26" width="24" height="30" fill="#7d8ba1" />
      <rect x="24" y="30" width="16" height="6" fill="#d9a441" />
      <rect x="27" y="26" width="10" height="4" fill="#d9a441" />
      {/* Braços */}
      <rect x="13" y="28" width="7" height="16" fill="#7d8ba1" />
      <rect x="44" y="28" width="7" height="16" fill="#7d8ba1" />
      <rect x="12" y="44" width="9" height="6" fill="#e8b56b" />
      <rect x="43" y="44" width="9" height="6" fill="#e8b56b" />
      {/* Espada */}
      <rect x="7" y="22" width="3" height="28" fill="#c8ccd4" />
      <rect x="6" y="20" width="5" height="3" fill="#c98f2d" />
      {/* Elmo com pluma */}
      <rect x="24" y="8" width="16" height="6" fill="#d9a441" />
      <rect x="27" y="4" width="10" height="5" fill="#e74c3c" />
      <rect x="22" y="13" width="20" height="14" fill="#d9a441" />
      <rect x="26" y="17" width="12" height="6" fill={OUTLINE} />
      <rect x="29" y="19" width="6" height="2" fill="#e74c3c" />
    </g>
  );
}

function TiamatSprite() {
  const heads: { x: number; y: number; color: string }[] = [
    { x: 8, y: 12, color: "#c0392b" },
    { x: 18, y: 6, color: "#3a5f8c" },
    { x: 28, y: 4, color: "#e6e6e6" },
    { x: 38, y: 10, color: "#2b2233" },
    { x: 46, y: 18, color: "#5faf4a" },
  ];
  return (
    <g>
      {/* Cauda e corpo de dragão */}
      <rect x="14" y="34" width="36" height="22" rx="3" fill="#3f9b8f" />
      <rect x="14" y="34" width="36" height="6" fill="#ffffff" opacity="0.22" />
      <rect x="8" y="40" width="8" height="6" fill="#3f9b8f" />
      <rect x="48" y="38" width="8" height="8" fill="#3f9b8f" />
      {/* Asas */}
      <rect x="6" y="22" width="10" height="16" rx="2" fill="#2e8a7e" />
      <rect x="48" y="20" width="10" height="18" rx="2" fill="#2e8a7e" />
      {/* Cinco cabeças */}
      {heads.map((h, i) => (
        <g key={i}>
          <rect x={h.x} y={h.y} width="12" height="12" rx="1" fill={h.color} />
          <rect
            x={h.x + 9}
            y={h.y + 3}
            width="5"
            height="4"
            fill={h.color === "#e6e6e6" ? "#c9c9c9" : "#2b2233"}
          />
          <rect x={h.x + 3} y={h.y + 4} width="3" height="3" fill="#ffd23f" />
        </g>
      ))}
    </g>
  );
}

function ShadowDemonSprite() {
  return (
    <g>
      {/* Corpo espectral */}
      <rect x="16" y="18" width="32" height="36" rx="3" fill="#4b2e83" />
      <rect x="16" y="18" width="32" height="6" fill="#ffffff" opacity="0.18" />
      <rect x="20" y="52" width="6" height="6" fill="#4b2e83" />
      <rect x="30" y="52" width="6" height="8" fill="#4b2e83" />
      <rect x="40" y="52" width="6" height="6" fill="#4b2e83" />
      {/* Chifres */}
      <rect x="20" y="10" width="5" height="10" fill="#2b1a4d" />
      <rect x="39" y="10" width="5" height="10" fill="#2b1a4d" />
      {/* Olhos brilhantes */}
      <rect x="22" y="30" width="8" height="8" fill="#ffd23f" />
      <rect x="34" y="30" width="8" height="8" fill="#ffd23f" />
      <rect x="25" y="33" width="3" height="3" fill={EYE} />
      <rect x="37" y="33" width="3" height="3" fill={EYE} />
      {/* Sorriso */}
      <rect x="26" y="44" width="12" height="3" rx="1" fill="#2b1a4d" />
    </g>
  );
}

function DecaySprite() {
  return (
    <g>
      {/* Capa escura */}
      <rect x="16" y="16" width="32" height="40" fill="#23262e" />
      {/* Armadura */}
      <rect x="22" y="26" width="20" height="30" fill="#3a4150" />
      <rect x="25" y="30" width="14" height="4" fill="#23262e" />
      {/* Crânio */}
      <rect x="24" y="10" width="16" height="16" rx="1" fill="#e6e6e6" />
      <rect x="26" y="13" width="5" height="6" fill={EYE} />
      <rect x="33" y="13" width="5" height="6" fill={EYE} />
      <rect x="29" y="13" width="1" height="6" fill="#e6e6e6" />
      <rect x="27" y="20" width="4" height="3" fill={EYE} />
      <rect x="33" y="20" width="4" height="3" fill={EYE} />
      {/* Olhos verdes */}
      <rect x="26" y="15" width="3" height="2" fill="#6ee06e" />
      <rect x="35" y="15" width="3" height="2" fill="#6ee06e" />
      {/* Espada escura */}
      <rect x="8" y="24" width="3" height="26" fill="#23262e" />
      <rect x="7" y="22" width="5" height="3" fill="#3a4150" />
    </g>
  );
}

function KeleogSprite() {
  return (
    <g>
      {/* Manto */}
      <rect x="18" y="26" width="28" height="32" fill="#7b4fbf" />
      <rect x="18" y="26" width="28" height="5" fill="#ffffff" opacity="0.22" />
      <rect x="22" y="52" width="8" height="6" fill="#4a2f80" />
      <rect x="34" y="52" width="8" height="6" fill="#4a2f80" />
      {/* Cinto com estrela */}
      <rect x="18" y="42" width="28" height="4" fill="#4a2f80" />
      <rect x="29" y="39" width="6" height="9" fill="#4fd6d9" />
      {/* Chapéu pontudo */}
      <rect x="20" y="8" width="24" height="18" fill="#5a3a99" />
      <rect x="14" y="16" width="36" height="10" fill="#5a3a99" />
      <rect x="28" y="14" width="3" height="4" fill="#ffd23f" />
      {/* Rosto */}
      <rect x="24" y="16" width="16" height="10" fill="#f2c59b" />
      <rect x="27" y="20" width="3" height="3" fill={EYE} />
      <rect x="34" y="20" width="3" height="3" fill={EYE} />
      <rect x="29" y="22" width="6" height="2" fill="#a9503f" />
      {/* Cajado */}
      <rect x="7" y="18" width="3" height="38" fill="#8a5a2b" />
      <rect x="4" y="14" width="9" height="7" rx="1" fill="#4fd6d9" />
      <rect x="6" y="16" width="5" height="3" fill="#ffffff" opacity="0.5" />
    </g>
  );
}

function DarklingSprite() {
  return (
    <g>
      {/* Corpo baixo e largo */}
      <rect x="16" y="30" width="32" height="26" fill="#6b4a2f" />
      <rect x="16" y="30" width="32" height="5" fill="#ffffff" opacity="0.18" />
      <rect x="20" y="52" width="10" height="6" fill="#4a3020" />
      <rect x="34" y="52" width="10" height="6" fill="#4a3020" />
      {/* Barba */}
      <rect x="20" y="38" width="24" height="14" fill="#c98f5f" />
      <rect x="20" y="42" width="6" height="10" fill="#c98f5f" />
      <rect x="38" y="42" width="6" height="10" fill="#c98f5f" />
      {/* Elmo */}
      <rect x="18" y="14" width="28" height="14" rx="2" fill="#3a4150" />
      <rect x="22" y="10" width="20" height="6" rx="1" fill="#3a4150" />
      {/* Rosto */}
      <rect x="22" y="24" width="20" height="16" fill="#e8b56b" />
      <rect x="26" y="29" width="3" height="3" fill={EYE} />
      <rect x="35" y="29" width="3" height="3" fill={EYE} />
      <rect x="28" y="33" width="8" height="3" rx="1" fill="#a9503f" />
      {/* Machado */}
      <rect x="6" y="34" width="4" height="18" fill="#8a5a2b" />
      <rect x="2" y="28" width="12" height="8" rx="1" fill="#8a939e" />
    </g>
  );
}

function LizardmenSprite() {
  return (
    <g>
      {/* Cauda */}
      <rect x="8" y="44" width="10" height="6" fill="#4a9440" />
      <rect x="4" y="48" width="8" height="5" fill="#4a9440" />
      {/* Corpo */}
      <rect x="20" y="26" width="24" height="30" fill="#5faf4a" />
      <rect x="20" y="26" width="24" height="5" fill="#ffffff" opacity="0.22" />
      <rect x="24" y="52" width="7" height="6" fill="#3d7d34" />
      <rect x="33" y="52" width="7" height="6" fill="#3d7d34" />
      {/* Cabeça com focinho */}
      <rect x="22" y="10" width="20" height="18" fill="#5faf4a" />
      <rect x="32" y="16" width="12" height="8" fill="#5faf4a" />
      <rect x="42" y="18" width="3" height="4" fill="#3d7d34" />
      {/* Crista vermelha */}
      <rect x="24" y="6" width="4" height="5" fill="#e67e22" />
      <rect x="30" y="4" width="4" height="7" fill="#e67e22" />
      <rect x="36" y="6" width="4" height="5" fill="#e67e22" />
      {/* Olhos e boca */}
      <rect x="26" y="14" width="3" height="3" fill="#ffd23f" />
      <rect x="30" y="14" width="3" height="3" fill="#ffd23f" />
      <rect x="33" y="21" width="8" height="2" fill={EYE} />
    </g>
  );
}

function BullywugsSprite() {
  return (
    <g>
      {/* Corpo de sapo */}
      <rect x="18" y="30" width="28" height="26" rx="3" fill="#4fc3a1" />
      <rect x="24" y="38" width="16" height="10" rx="2" fill="#b7e8d8" />
      <rect x="22" y="52" width="8" height="6" fill="#35907a" />
      <rect x="34" y="52" width="8" height="6" fill="#35907a" />
      {/* Olhos grandes no topo */}
      <rect x="20" y="14" width="10" height="12" rx="2" fill="#4fc3a1" />
      <rect x="34" y="14" width="10" height="12" rx="2" fill="#4fc3a1" />
      <rect x="22" y="18" width="6" height="6" fill="#ffffff" />
      <rect x="36" y="18" width="6" height="6" fill="#ffffff" />
      <rect x="24" y="20" width="3" height="3" fill={EYE} />
      <rect x="38" y="20" width="3" height="3" fill={EYE} />
      {/* Boca larga */}
      <rect x="22" y="42" width="20" height="4" rx="1" fill={EYE} />
      <rect x="26" y="41" width="12" height="2" fill="#ffffff" opacity="0.7" />
      {/* Braços */}
      <rect x="11" y="34" width="7" height="12" rx="1" fill="#4fc3a1" />
      <rect x="46" y="34" width="7" height="12" rx="1" fill="#4fc3a1" />
    </g>
  );
}

function WardukeSprite() {
  return (
    <g>
      {/* Capa */}
      <rect x="16" y="18" width="32" height="40" fill="#2f3b52" />
      {/* Armadura */}
      <rect x="20" y="28" width="24" height="28" fill="#5b6b8c" />
      <rect x="20" y="28" width="24" height="5" fill="#ffffff" opacity="0.22" />
      <rect x="24" y="33" width="16" height="4" fill="#8a939e" />
      {/* Elmo com chifres */}
      <rect x="22" y="10" width="20" height="16" rx="2" fill="#5b6b8c" />
      <rect x="14" y="12" width="8" height="6" rx="1" fill="#c8ccd4" />
      <rect x="42" y="12" width="8" height="6" rx="1" fill="#c8ccd4" />
      <rect x="26" y="17" width="12" height="5" fill={EYE} />
      {/* Escudo */}
      <rect x="40" y="34" width="16" height="20" rx="2" fill="#3a5f8c" />
      <rect x="44" y="38" width="8" height="8" fill="#c8ccd4" />
      <rect x="46" y="40" width="4" height="4" fill="#3a5f8c" />
      {/* Espada */}
      <rect x="6" y="24" width="3" height="28" fill="#c8ccd4" />
      <rect x="5" y="22" width="5" height="3" fill="#c98f2d" />
    </g>
  );
}

function BeholderSprite() {
  const stalks: { x: number; y: number; w: number; h: number }[] = [
    { x: 6, y: 14, w: 4, h: 12 },
    { x: 16, y: 6, w: 4, h: 10 },
    { x: 44, y: 6, w: 4, h: 10 },
    { x: 54, y: 14, w: 4, h: 12 },
    { x: 10, y: 34, w: 4, h: 10 },
    { x: 50, y: 34, w: 4, h: 10 },
  ];
  return (
    <g>
      {/* Corpo flutuante */}
      <rect x="18" y="16" width="28" height="34" rx="6" fill="#b06ab3" />
      <rect x="18" y="16" width="28" height="8" rx="6" fill="#ffffff" opacity="0.25" />
      {/* Olhos nos talos */}
      {stalks.map((s, i) => (
        <g key={i}>
          <rect x={s.x} y={s.y} width={s.w} height={s.h} fill="#b06ab3" />
          <rect
            x={s.x - 2}
            y={s.y - 3}
            width={s.w + 4}
            height={s.h - 5}
            rx={s.h / 2 - 3}
            fill="#8f4a92"
          />
          <rect x={s.x} y={s.y - 1} width={s.w} height={2} fill="#ffd23f" />
        </g>
      ))}
      {/* Olho central */}
      <rect x="24" y="22" width="16" height="16" rx="2" fill="#ffffff" />
      <rect x="29" y="26" width="6" height="6" rx="1" fill={EYE} />
      <rect x="31" y="28" width="2" height="2" fill="#ffffff" />
      {/* Boca com dentes */}
      <rect x="24" y="42" width="16" height="4" rx="1" fill="#8f4a92" />
      <rect x="26" y="44" width="3" height="2" fill="#ffffff" />
      <rect x="31" y="44" width="3" height="2" fill="#ffffff" />
      <rect x="36" y="44" width="3" height="2" fill="#ffffff" />
    </g>
  );
}

function MonsterSprite({ id }: { id: MonsterSpriteId }) {
  switch (id) {
    case "avenger":
      return <AvengerSprite />;
    case "tiamat":
      return <TiamatSprite />;
    case "shadow-demon":
      return <ShadowDemonSprite />;
    case "decay":
      return <DecaySprite />;
    case "keleog":
      return <KeleogSprite />;
    case "darkling":
      return <DarklingSprite />;
    case "lizardmen":
      return <LizardmenSprite />;
    case "bullywugs":
      return <BullywugsSprite />;
    case "warduke":
      return <WardukeSprite />;
    case "beholder":
      return <BeholderSprite />;
  }
}

export function MonsterAvatar({ monsterId, size = 64, className, title }: MonsterAvatarProps) {
  const classes = ["monster-avatar", `monster-avatar--${monsterId}`, className ?? ""]
    .filter(Boolean)
    .join(" ");

  return (
    <svg
      className={classes}
      viewBox="0 0 64 64"
      width={size}
      height={size}
      shapeRendering="crispEdges"
      role={title ? "img" : "presentation"}
      aria-label={title}
      aria-hidden={title ? undefined : true}
    >
      <MonsterSprite id={monsterId} />
      <GroundShadow />
    </svg>
  );
}
