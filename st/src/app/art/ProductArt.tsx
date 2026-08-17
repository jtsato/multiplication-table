import type { ReactNode } from "react";

/**
 * Arte chapada dos produtos, no mesmo espírito das ilhas do mapa: formas simples,
 * cores fortes, sem gradiente. Tudo desenhado num viewBox 64x64 para os itens
 * ficarem do mesmo tamanho relativo quando aparecem lado a lado.
 */
const C = {
  ink: "#1c2a35",
  red: "#e05252",
  orange: "#e57a44",
  yellow: "#f5c14b",
  green: "#3f9c8c",
  leaf: "#4caf6d",
  blue: "#5e78bd",
  sky: "#6eb5d1",
  purple: "#8b83d4",
  pink: "#d48aaf",
  brown: "#a2673f",
  paper: "#fdf6ec",
  gray: "#c9d1d8",
};

const SHAPES: Record<string, ReactNode> = {
  // Livraria
  bookmark: (
    <>
      <polygon points="22,8 42,8 42,48 32,39 22,48" fill={C.pink} />
      <rect x="22" y="8" width="20" height="8" fill={C.purple} />
    </>
  ),
  magazine: (
    <>
      <rect x="14" y="10" width="36" height="40" rx="3" fill={C.blue} />
      <rect x="18" y="14" width="28" height="16" rx="2" fill={C.sky} />
      <rect x="18" y="34" width="28" height="3" rx="1.5" fill={C.paper} />
      <rect x="18" y="41" width="20" height="3" rx="1.5" fill={C.paper} />
    </>
  ),
  book: (
    <>
      <rect x="14" y="12" width="36" height="38" rx="3" fill={C.orange} />
      <rect x="14" y="12" width="9" height="38" fill={C.brown} />
      <rect x="27" y="20" width="18" height="3" rx="1.5" fill={C.paper} />
      <rect x="27" y="28" width="18" height="3" rx="1.5" fill={C.paper} />
    </>
  ),
  comic: (
    <>
      <rect x="14" y="12" width="36" height="38" rx="3" fill={C.yellow} />
      <circle cx="32" cy="28" r="11" fill={C.paper} />
      <polygon points="26,37 32,31 36,40" fill={C.paper} />
      <circle cx="28" cy="27" r="2" fill={C.ink} />
      <circle cx="36" cy="27" r="2" fill={C.ink} />
    </>
  ),
  notebook: (
    <>
      <rect x="18" y="10" width="32" height="42" rx="3" fill={C.leaf} />
      <rect x="25" y="19" width="19" height="3" rx="1.5" fill={C.paper} />
      <rect x="25" y="27" width="19" height="3" rx="1.5" fill={C.paper} />
      <rect x="25" y="35" width="13" height="3" rx="1.5" fill={C.paper} />
      <circle cx="18" cy="17" r="3" fill={C.gray} />
      <circle cx="18" cy="31" r="3" fill={C.gray} />
      <circle cx="18" cy="45" r="3" fill={C.gray} />
    </>
  ),
  atlas: (
    <>
      <rect x="14" y="12" width="36" height="38" rx="3" fill={C.blue} />
      <circle cx="32" cy="31" r="12" fill={C.sky} />
      <path d="M20 31h24" stroke={C.paper} strokeWidth="2" />
      <ellipse cx="32" cy="31" rx="5" ry="12" fill="none" stroke={C.paper} strokeWidth="2" />
    </>
  ),

  // Loja de Arte
  pencil: (
    <>
      <rect x="27" y="8" width="10" height="6" rx="2" fill={C.pink} />
      <rect x="27" y="14" width="10" height="26" fill={C.yellow} />
      <polygon points="27,40 37,40 32,53" fill={C.paper} />
      <polygon points="30,48 34,48 32,53" fill={C.ink} />
    </>
  ),
  brush: (
    <>
      <rect x="28" y="8" width="8" height="23" rx="2" fill={C.brown} />
      <rect x="26" y="29" width="12" height="9" rx="2" fill={C.gray} />
      <polygon points="26,38 38,38 32,54" fill={C.purple} />
    </>
  ),
  ruler: (
    <>
      <rect x="10" y="24" width="44" height="16" rx="3" fill={C.sky} />
      <rect x="17" y="24" width="2" height="7" fill={C.paper} />
      <rect x="25" y="24" width="2" height="7" fill={C.paper} />
      <rect x="33" y="24" width="2" height="7" fill={C.paper} />
      <rect x="41" y="24" width="2" height="7" fill={C.paper} />
    </>
  ),
  "drawing-block": (
    <>
      <rect x="14" y="12" width="36" height="40" rx="3" fill={C.paper} stroke={C.gray} strokeWidth="2" />
      <rect x="25" y="8" width="14" height="7" rx="3" fill={C.gray} />
      <path d="M21 42q6-16 11-2t11-8" stroke={C.pink} strokeWidth="3" fill="none" strokeLinecap="round" />
    </>
  ),
  "pencil-case": (
    <>
      <rect x="9" y="24" width="46" height="21" rx="9" fill={C.purple} />
      <rect x="9" y="31" width="46" height="4" fill={C.paper} />
      <circle cx="45" cy="33" r="3" fill={C.yellow} />
    </>
  ),
  "small-canvas": (
    <>
      <rect x="14" y="10" width="36" height="30" rx="2" fill={C.paper} stroke={C.brown} strokeWidth="3" />
      <polygon points="19,36 28,22 37,36" fill={C.leaf} />
      <circle cx="41" cy="20" r="4" fill={C.yellow} />
      <rect x="30" y="40" width="4" height="14" fill={C.brown} />
    </>
  ),

  // Loja de Esportes
  cone: (
    <>
      <polygon points="32,8 47,46 17,46" fill={C.orange} />
      <rect x="25" y="26" width="14" height="6" fill={C.paper} />
      <rect x="11" y="46" width="42" height="8" rx="3" fill={C.orange} />
    </>
  ),
  rope: (
    <>
      <path d="M16 40q16-30 32 0" stroke={C.pink} strokeWidth="5" fill="none" strokeLinecap="round" />
      <rect x="10" y="36" width="9" height="16" rx="4" fill={C.brown} />
      <rect x="45" y="36" width="9" height="16" rx="4" fill={C.brown} />
    </>
  ),
  "sports-bottle": (
    <>
      <rect x="27" y="9" width="10" height="8" rx="2" fill={C.ink} />
      <rect x="23" y="17" width="18" height="36" rx="6" fill={C.green} />
      <rect x="23" y="29" width="18" height="9" fill={C.paper} />
    </>
  ),
  shuttlecock: (
    <>
      <polygon points="24,20 32,6 40,20" fill={C.paper} stroke={C.gray} strokeWidth="1.5" />
      <polygon points="18,26 32,10 26,30" fill={C.paper} stroke={C.gray} strokeWidth="1.5" />
      <polygon points="46,26 32,10 38,30" fill={C.paper} stroke={C.gray} strokeWidth="1.5" />
      <circle cx="32" cy="42" r="11" fill={C.red} />
    </>
  ),
  ball: (
    <>
      <circle cx="32" cy="32" r="21" fill={C.paper} stroke={C.ink} strokeWidth="2" />
      <polygon points="32,19 42,26 38,38 26,38 22,26" fill={C.ink} />
    </>
  ),
  racket: (
    <>
      <ellipse cx="32" cy="24" rx="15" ry="18" fill={C.paper} stroke={C.blue} strokeWidth="5" />
      <path d="M32 8v32M18 24h28" stroke={C.gray} strokeWidth="2" />
      <rect x="29" y="40" width="6" height="16" rx="3" fill={C.brown} />
    </>
  ),

  // Tecnologia & Robótica
  led: (
    <>
      <path d="M22 32a10 10 0 0 1 20 0v8H22z" fill={C.yellow} />
      <rect x="22" y="38" width="20" height="4" rx="2" fill={C.orange} />
      <rect x="26" y="42" width="4" height="13" fill={C.gray} />
      <rect x="34" y="42" width="4" height="13" fill={C.gray} />
    </>
  ),
  "connection-cable": (
    <>
      <path d="M14 24C22 52 42 52 50 24" stroke={C.purple} strokeWidth="5" fill="none" strokeLinecap="round" />
      <rect x="9" y="14" width="11" height="11" rx="2" fill={C.gray} />
      <rect x="44" y="14" width="11" height="11" rx="2" fill={C.gray} />
    </>
  ),
  "electronic-button": (
    <>
      <rect x="15" y="31" width="34" height="20" rx="3" fill={C.blue} />
      <circle cx="32" cy="28" r="11" fill={C.red} />
      <circle cx="32" cy="26" r="6" fill={C.pink} />
    </>
  ),
  sensor: (
    <>
      <rect x="13" y="22" width="38" height="23" rx="3" fill={C.leaf} />
      <circle cx="32" cy="33" r="8" fill={C.ink} />
      <circle cx="32" cy="33" r="3.5" fill={C.sky} />
      <rect x="20" y="45" width="3" height="9" fill={C.gray} />
      <rect x="41" y="45" width="3" height="9" fill={C.gray} />
    </>
  ),
  "mini-motor": (
    <>
      <rect x="16" y="19" width="30" height="26" rx="5" fill={C.gray} />
      <rect x="16" y="26" width="30" height="5" fill={C.blue} />
      <rect x="46" y="29" width="10" height="6" rx="2" fill={C.ink} />
      <circle cx="31" cy="38" r="4" fill={C.ink} />
    </>
  ),
  "maker-kit": (
    <>
      <circle cx="23" cy="19" r="6" fill={C.leaf} />
      <rect x="34" y="12" width="7" height="14" rx="2" fill={C.purple} />
      <rect x="11" y="25" width="42" height="27" rx="3" fill={C.orange} />
      <rect x="11" y="25" width="42" height="7" fill={C.brown} />
    </>
  ),

  // Decorações
  banner: (
    <>
      <path d="M8 16h48" stroke={C.brown} strokeWidth="3" />
      <polygon points="12,17 22,17 17,30" fill={C.red} />
      <polygon points="26,17 36,17 31,30" fill={C.yellow} />
      <polygon points="40,17 50,17 45,30" fill={C.sky} />
    </>
  ),
  plant: (
    <>
      <circle cx="32" cy="22" r="10" fill={C.leaf} />
      <circle cx="23" cy="28" r="7" fill={C.green} />
      <circle cx="41" cy="28" r="7" fill={C.green} />
      <polygon points="20,36 44,36 40,54 24,54" fill={C.orange} />
    </>
  ),
  lamp: (
    <>
      <polygon points="20,12 44,12 50,30 14,30" fill={C.yellow} />
      <rect x="29" y="30" width="6" height="18" fill={C.gray} />
      <rect x="20" y="48" width="24" height="6" rx="3" fill={C.ink} />
    </>
  ),
};

const FALLBACK: ReactNode = (
  <>
    <rect x="14" y="18" width="36" height="30" rx="4" fill={C.gray} />
    <rect x="14" y="18" width="36" height="8" rx="4" fill={C.blue} />
  </>
);

export type ProductArtProps = {
  /** Id do produto ou da decoração. */
  id: string;
  size?: "tiny" | "small" | "medium";
  /** Plataforma colorida sob o item, como nos cartões do mapa. */
  platform?: boolean;
  platformColor?: string;
};

const SIZES: Record<NonNullable<ProductArtProps["size"]>, number> = {
  tiny: 44,
  small: 64,
  medium: 96,
};

export function ProductArt({ id, size = "small", platform = false, platformColor = C.sky }: ProductArtProps) {
  const px = SIZES[size];
  return (
    // Decorativa: o nome do produto sempre aparece como texto ao lado.
    <svg className="product-art" width={px} height={px} viewBox="0 0 64 64" aria-hidden="true" focusable="false">
      {platform && (
        <>
          <rect x="5" y="50" width="54" height="10" rx="5" fill={platformColor} />
          <rect x="5" y="56" width="54" height="4" rx="2" fill="rgba(28, 42, 53, 0.18)" />
        </>
      )}
      {SHAPES[id] ?? FALLBACK}
    </svg>
  );
}
