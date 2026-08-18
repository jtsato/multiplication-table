/**
 * Fundo 2D pixel art inspirado em jogos de 32 bits dos anos 90.
 * Cada tema de mapa tem céu, chão e elementos decorativos próprios.
 */

import type { MapThemeId } from "../slices/maps/maps";

export interface MapBackgroundProps {
  theme: MapThemeId;
  className?: string;
  /** Rótulo acessível quando o fundo transmite informação. */
  label?: string;
}

const THEME_COLORS: Record<
  MapThemeId,
  { sky: string; ground: string; accent: string; detail: string }
> = {
  meadow: { sky: "#79c6ea", ground: "#3f9b4f", accent: "#ffd23f", detail: "#2e7d3a" },
  desert: { sky: "#f7c978", ground: "#d9a441", accent: "#e67e22", detail: "#b07a2a" },
  forest: { sky: "#1f5c3d", ground: "#2e7d3a", accent: "#8fdc5a", detail: "#1a4a2f" },
  cave: { sky: "#2b2233", ground: "#4a3d5c", accent: "#4fd6d9", detail: "#342a44" },
  ice: { sky: "#a8d8ea", ground: "#e8f4f8", accent: "#ffffff", detail: "#8fc3d9" },
  volcano: { sky: "#4a1a1a", ground: "#3a2b22", accent: "#ff6b35", detail: "#2b1a16" },
  sky: { sky: "#3f7fd6", ground: "#f5efe6", accent: "#ffffff", detail: "#8fc3d9" },
  castle: { sky: "#23265c", ground: "#3a4150", accent: "#8a93a8", detail: "#2b2f45" },
  void: { sky: "#1a1030", ground: "#2b1a4d", accent: "#b06ab3", detail: "#4b2e83" },
};

function MeadowDecor() {
  return (
    <g>
      <rect x="24" y="96" width="48" height="10" rx="4" fill="#2e7d3a" />
      <rect x="252" y="92" width="56" height="14" rx="5" fill="#2e7d3a" />
      <rect x="48" y="116" width="10" height="10" fill="#e8a33d" />
      <rect x="60" y="124" width="8" height="8" fill="#e8a33d" />
      <rect x="120" y="118" width="10" height="10" fill="#e06a9e" />
      <rect x="204" y="120" width="10" height="10" fill="#e06a9e" />
      <rect x="286" y="116" width="10" height="10" fill="#e8a33d" />
    </g>
  );
}

function DesertDecor() {
  return (
    <g>
      <rect x="40" y="96" width="80" height="14" rx="6" fill="#e8b56b" />
      <rect x="210" y="100" width="90" height="12" rx="5" fill="#e8b56b" />
      <rect x="80" y="76" width="8" height="30" fill="#3f9b4f" />
      <rect x="88" y="84" width="8" height="6" fill="#3f9b4f" />
      <rect x="72" y="84" width="8" height="6" fill="#3f9b4f" />
      <rect x="240" y="70" width="8" height="34" fill="#3f9b4f" />
      <rect x="248" y="78" width="8" height="6" fill="#3f9b4f" />
      <rect x="232" y="78" width="8" height="6" fill="#3f9b4f" />
    </g>
  );
}

function ForestDecor() {
  return (
    <g>
      <rect x="16" y="60" width="40" height="8" fill="#1a4a2f" />
      <rect x="30" y="44" width="12" height="18" fill="#1a4a2f" />
      <rect x="120" y="50" width="48" height="10" fill="#1a4a2f" />
      <rect x="134" y="34" width="14" height="18" fill="#1a4a2f" />
      <rect x="252" y="56" width="44" height="10" fill="#1a4a2f" />
      <rect x="264" y="42" width="12" height="16" fill="#1a4a2f" />
      <rect x="60" y="112" width="12" height="12" fill="#8fdc5a" />
      <rect x="180" y="120" width="12" height="12" fill="#8fdc5a" />
      <rect x="300" y="114" width="12" height="12" fill="#8fdc5a" />
    </g>
  );
}

function CaveDecor() {
  return (
    <g>
      <rect x="40" y="80" width="8" height="34" fill="#4fd6d9" />
      <rect x="34" y="74" width="20" height="8" fill="#4fd6d9" />
      <rect x="120" y="70" width="6" height="28" fill="#b06ab3" />
      <rect x="115" y="64" width="16" height="8" fill="#b06ab3" />
      <rect x="260" y="86" width="8" height="30" fill="#4fd6d9" />
      <rect x="254" y="80" width="20" height="8" fill="#4fd6d9" />
      <rect x="170" y="120" width="40" height="8" rx="4" fill="#342a44" />
      <rect x="80" y="132" width="56" height="8" rx="4" fill="#342a44" />
    </g>
  );
}

function IceDecor() {
  return (
    <g>
      <rect x="30" y="70" width="80" height="40" fill="#e8f4f8" />
      <rect x="54" y="44" width="60" height="28" fill="#e8f4f8" />
      <rect x="220" y="64" width="72" height="44" fill="#e8f4f8" />
      <rect x="244" y="40" width="56" height="26" fill="#e8f4f8" />
      <rect x="60" y="30" width="6" height="6" fill="#ffffff" />
      <rect x="160" y="50" width="6" height="6" fill="#ffffff" />
      <rect x="280" y="28" width="6" height="6" fill="#ffffff" />
    </g>
  );
}

function VolcanoDecor() {
  return (
    <g>
      <rect x="100" y="64" width="120" height="70" fill="#2b1a16" />
      <rect x="140" y="44" width="40" height="22" fill="#2b1a16" />
      <rect x="148" y="60" width="24" height="10" fill="#ff6b35" />
      <rect x="60" y="120" width="200" height="12" fill="#ff6b35" />
      <rect x="48" y="132" width="8" height="12" fill="#ff6b35" />
      <rect x="120" y="136" width="8" height="12" fill="#ff6b35" />
      <rect x="200" y="134" width="8" height="12" fill="#ff6b35" />
      <rect x="280" y="130" width="8" height="12" fill="#ff6b35" />
    </g>
  );
}

function SkyDecor() {
  return (
    <g>
      <rect x="40" y="52" width="56" height="16" rx="8" fill="#ffffff" opacity="0.9" />
      <rect x="220" y="36" width="64" height="16" rx="8" fill="#ffffff" opacity="0.9" />
      <rect x="70" y="96" width="70" height="16" rx="6" fill="#2e7d3a" />
      <rect x="84" y="82" width="42" height="16" rx="6" fill="#2e7d3a" />
      <rect x="230" y="112" width="60" height="14" rx="6" fill="#3a5f8c" />
      <rect x="242" y="100" width="36" height="14" rx="6" fill="#3a5f8c" />
    </g>
  );
}

function CastleDecor() {
  return (
    <g>
      <rect x="36" y="60" width="56" height="76" fill="#5b6b8c" />
      <rect x="48" y="44" width="32" height="18" fill="#5b6b8c" />
      <rect x="44" y="40" width="8" height="10" fill="#5b6b8c" />
      <rect x="76" y="40" width="8" height="10" fill="#5b6b8c" />
      <rect x="228" y="52" width="60" height="84" fill="#5b6b8c" />
      <rect x="240" y="36" width="36" height="18" fill="#5b6b8c" />
      <rect x="236" y="32" width="8" height="10" fill="#5b6b8c" />
      <rect x="272" y="32" width="8" height="10" fill="#5b6b8c" />
      <rect x="148" y="96" width="24" height="40" fill="#3a4150" />
    </g>
  );
}

function VoidDecor() {
  return (
    <g>
      <rect x="40" y="40" width="6" height="6" fill="#ffffff" opacity="0.8" />
      <rect x="120" y="28" width="4" height="4" fill="#ffffff" opacity="0.7" />
      <rect x="240" y="52" width="6" height="6" fill="#ffffff" opacity="0.8" />
      <rect x="280" y="24" width="4" height="4" fill="#ffffff" opacity="0.7" />
      <rect x="80" y="88" width="56" height="14" rx="6" fill="#4b2e83" />
      <rect x="92" y="76" width="34" height="14" rx="6" fill="#4b2e83" />
      <rect x="210" y="104" width="64" height="14" rx="6" fill="#4b2e83" />
      <rect x="224" y="92" width="36" height="14" rx="6" fill="#4b2e83" />
    </g>
  );
}

function ThemeDecor({ theme }: { theme: MapThemeId }) {
  switch (theme) {
    case "meadow":
      return <MeadowDecor />;
    case "desert":
      return <DesertDecor />;
    case "forest":
      return <ForestDecor />;
    case "cave":
      return <CaveDecor />;
    case "ice":
      return <IceDecor />;
    case "volcano":
      return <VolcanoDecor />;
    case "sky":
      return <SkyDecor />;
    case "castle":
      return <CastleDecor />;
    case "void":
      return <VoidDecor />;
  }
}

export function MapBackground({ theme, className, label }: MapBackgroundProps) {
  const colors = THEME_COLORS[theme];
  const classes = ["map-background", `map-background--${theme}`, className ?? ""]
    .filter(Boolean)
    .join(" ");

  return (
    <svg
      className={classes}
      viewBox="0 0 320 180"
      preserveAspectRatio="xMidYMid slice"
      role={label ? "img" : "presentation"}
      aria-label={label}
      aria-hidden={label ? undefined : true}
      shapeRendering="crispEdges"
    >
      <rect x="0" y="0" width="320" height="180" fill={colors.sky} />
      <ThemeDecor theme={theme} />
      {/* Chão */}
      <rect x="0" y="136" width="320" height="44" fill={colors.ground} />
      <rect x="0" y="136" width="320" height="4" fill={colors.detail} />
      {/* Brilho no horizonte, reforçando a pegada 32 bits */}
      <rect x="0" y="130" width="320" height="6" fill={colors.accent} opacity="0.35" />
    </svg>
  );
}
