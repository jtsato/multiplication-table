/**
 * Mascotes dos heróis, desenhados com blocos SVG (pixel art 32 bits).
 * Cada classe tem um companheiro: lobo, coruja, fênix ou texugo.
 */

import type { MascotId } from "../slices/avatar/avatar";

export interface MascotAvatarProps {
  mascotId: MascotId;
  size?: number;
  className?: string;
  title?: string;
}

function WolfSprite() {
  return (
    <g>
      {/* Cauda */}
      <rect x="4" y="14" width="5" height="4" fill="#7d8896" />
      <rect x="3" y="12" width="3" height="4" fill="#7d8896" />
      {/* Corpo */}
      <rect x="9" y="15" width="14" height="11" fill="#7d8896" />
      <rect x="9" y="15" width="14" height="3" fill="#aab4c0" />
      {/* Pernas */}
      <rect x="10" y="26" width="4" height="5" fill="#5b6572" />
      <rect x="18" y="26" width="4" height="5" fill="#5b6572" />
      {/* Cabeça */}
      <rect x="10" y="8" width="12" height="9" fill="#7d8896" />
      <rect x="12" y="12" width="3" height="3" fill="#ffd23f" />
      <rect x="17" y="12" width="3" height="3" fill="#ffd23f" />
      <rect x="13" y="15" width="6" height="2" fill="#2b2233" />
      {/* Orelhas */}
      <rect x="10" y="4" width="4" height="5" fill="#7d8896" />
      <rect x="18" y="4" width="4" height="5" fill="#7d8896" />
    </g>
  );
}

function OwlSprite() {
  return (
    <g>
      {/* Asas */}
      <rect x="5" y="15" width="4" height="12" fill="#8a5a2b" />
      <rect x="23" y="15" width="4" height="12" fill="#8a5a2b" />
      {/* Corpo */}
      <rect x="9" y="14" width="14" height="14" fill="#a97142" />
      <rect x="9" y="14" width="14" height="3" fill="#d9b380" />
      {/* Cabeça */}
      <rect x="10" y="6" width="12" height="10" fill="#a97142" />
      {/* Olhos grandes */}
      <rect x="11" y="9" width="4" height="4" fill="#ffffff" />
      <rect x="17" y="9" width="4" height="4" fill="#ffffff" />
      <rect x="12" y="10" width="2" height="2" fill="#2b2233" />
      <rect x="18" y="10" width="2" height="2" fill="#2b2233" />
      {/* Bico */}
      <rect x="14" y="13" width="4" height="2" fill="#e8a33d" />
      {/* Pés */}
      <rect x="12" y="28" width="3" height="3" fill="#e8a33d" />
      <rect x="17" y="28" width="3" height="3" fill="#e8a33d" />
    </g>
  );
}

function PhoenixSprite() {
  return (
    <g>
      {/* Chamas da cauda */}
      <rect x="12" y="22" width="4" height="4" fill="#e74c3c" />
      <rect x="16" y="24" width="4" height="4" fill="#e67e22" />
      <rect x="10" y="25" width="3" height="4" fill="#e67e22" />
      <rect x="18" y="26" width="4" height="3" fill="#e74c3c" />
      {/* Corpo */}
      <rect x="12" y="12" width="8" height="12" fill="#e67e22" />
      <rect x="12" y="12" width="8" height="3" fill="#ffd23f" />
      {/* Asas */}
      <rect x="8" y="14" width="5" height="8" fill="#e74c3c" />
      <rect x="19" y="14" width="5" height="8" fill="#e74c3c" />
      {/* Cabeça */}
      <rect x="13" y="6" width="6" height="7" fill="#e67e22" />
      <rect x="15" y="8" width="3" height="3" fill="#2b2233" />
      {/* Crista */}
      <rect x="14" y="3" width="4" height="4" fill="#ffd23f" />
      {/* Pés */}
      <rect x="13" y="24" width="3" height="3" fill="#d9a441" />
      <rect x="17" y="24" width="3" height="3" fill="#d9a441" />
    </g>
  );
}

function BadgerSprite() {
  return (
    <g>
      {/* Corpo */}
      <rect x="8" y="15" width="16" height="12" fill="#3a4150" />
      <rect x="8" y="15" width="16" height="3" fill="#5b6b8c" />
      {/* Pernas */}
      <rect x="10" y="27" width="4" height="4" fill="#2b2233" />
      <rect x="18" y="27" width="4" height="4" fill="#2b2233" />
      {/* Cabeça */}
      <rect x="10" y="7" width="12" height="10" fill="#3a4150" />
      {/* Listra branca */}
      <rect x="14" y="6" width="4" height="11" fill="#f5efe6" />
      {/* Olhos */}
      <rect x="11" y="11" width="3" height="3" fill="#2b2233" />
      <rect x="18" y="11" width="3" height="3" fill="#2b2233" />
      {/* Focinho */}
      <rect x="14" y="13" width="4" height="3" fill="#2b2233" />
      {/* Orelhas */}
      <rect x="10" y="4" width="4" height="4" fill="#5b6b8c" />
      <rect x="18" y="4" width="4" height="4" fill="#5b6b8c" />
    </g>
  );
}

function MascotSprite({ mascotId }: { mascotId: MascotId }) {
  switch (mascotId) {
    case "wolf":
      return <WolfSprite />;
    case "owl":
      return <OwlSprite />;
    case "phoenix":
      return <PhoenixSprite />;
    case "badger":
      return <BadgerSprite />;
  }
}

export function MascotAvatar({ mascotId, size = 32, className, title }: MascotAvatarProps) {
  const classes = ["mascot-avatar", `mascot-avatar--${mascotId}`, className ?? ""]
    .filter(Boolean)
    .join(" ");

  return (
    <svg
      className={classes}
      viewBox="0 0 32 32"
      width={size}
      height={size}
      shapeRendering="crispEdges"
      role={title ? "img" : "presentation"}
      aria-label={title}
      aria-hidden={title ? undefined : true}
    >
      <MascotSprite mascotId={mascotId} />
    </svg>
  );
}
