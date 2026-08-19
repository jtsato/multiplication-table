import type { AppStrings } from '../../i18n';
import { palette } from '../../shared/palette';

export type DayPhase = 'dia' | 'entardecer' | 'noite' | 'amanhecer';

export const DAYNIGHT = {
  /**
   * Duracao de um ciclo completo, em segundos.
   *
   * Cinco minutos. A primeira versao tinha tres, e na pratica a noite chegava
   * antes de dar tempo de montar o acampamento: montar uma fogueira exige
   * colher madeira e pedra, e cada colheita passa por caminhar ate o recurso,
   * contar os grupos e responder. Para uma crianca isso nao e questao de
   * segundos — e o tempo de ler e pensar.
   */
  cycleSeconds: 300,
} as const;

/**
 * Fronteiras das fases, como fracao do ciclo (0 a 1).
 *
 * Em segundos, com o ciclo de 300 s:
 * dia 204 · entardecer 24 · noite 48 · amanhecer 24
 *
 * A repartição anterior era 180/30/66/24 e servia a outro jogo. Ali a noite era
 * a prova a ser vencida, e por isso durava: 66 s de perseguicao era o tempo de
 * sentir tensao sem virar castigo. Sem inimigos, esse tempo nao compra mais
 * nada — vira espera no escuro.
 *
 * Agora a noite e uma janela curta e bonita, com o que so existe no escuro. 48 s
 * cabem numa carga de lanterna com folga, entao uma conta basta para atravessar
 * a noite inteira aproveitando.
 *
 * O dia cresceu para 204 s porque e nele que a crianca resolve contas, e o
 * entardecer encolheu para 24 s porque nao anuncia mais perigo nenhum: e so a
 * virada da luz, e um convite para acender a lanterna.
 */
export const PHASE_BOUNDS = {
  dia: { start: 0, end: 0.68 },
  entardecer: { start: 0.68, end: 0.76 },
  noite: { start: 0.76, end: 0.92 },
  amanhecer: { start: 0.92, end: 1 },
} as const;

/**
 * Avanca o relogio e da a volta ao fim do ciclo.
 *
 * Recebe e devolve segundos absolutos desde o inicio da partida; quem precisa da
 * posicao dentro do ciclo usa `cyclePosition`. `delta` negativo e ignorado — um
 * relogio que anda para tras quebraria a contagem de dias.
 */
export function advanceClock(clock: number, delta: number): number {
  if (!Number.isFinite(delta) || delta <= 0) return clock;
  return clock + delta;
}

/**
 * Traz uma posicao qualquer para o intervalo [0, 1).
 *
 * O `+ 1` so entra quando o valor e negativo. A forma aparentemente mais curta,
 * `((t % 1) + 1) % 1`, faz duas operacoes de ponto flutuante a mais e desloca
 * valores exatos: `0.88` vira `0.8799999999999999`, o que colocava a fronteira
 * exata de uma fase na fase anterior.
 */
function normalizePosition(position: number): number {
  const t = position % 1;
  return t < 0 ? t + 1 : t;
}

/** Posicao dentro do ciclo atual, de 0 (nascer do sol) a 1. */
export function cyclePosition(clock: number, cycleSeconds = DAYNIGHT.cycleSeconds): number {
  return normalizePosition((clock % cycleSeconds) / cycleSeconds);
}

/** Quantos ciclos completos ja se passaram. */
export function dayNumber(clock: number, cycleSeconds = DAYNIGHT.cycleSeconds): number {
  return Math.floor(clock / cycleSeconds) + 1;
}

/** Fase correspondente a uma posicao do ciclo. */
export function phaseFor(position: number): DayPhase {
  const t = normalizePosition(position);
  if (t < PHASE_BOUNDS.dia.end) return 'dia';
  if (t < PHASE_BOUNDS.entardecer.end) return 'entardecer';
  if (t < PHASE_BOUNDS.noite.end) return 'noite';
  return 'amanhecer';
}

/** Progresso dentro da fase atual, de 0 a 1. */
export function phaseProgress(position: number): number {
  const t = normalizePosition(position);
  const bounds = PHASE_BOUNDS[phaseFor(t)];
  return (t - bounds.start) / (bounds.end - bounds.start);
}

/** Segundos restantes ate a proxima fase. */
export function secondsUntilNextPhase(clock: number, cycleSeconds = DAYNIGHT.cycleSeconds): number {
  const t = cyclePosition(clock, cycleSeconds);
  const bounds = PHASE_BOUNDS[phaseFor(t)];
  return (bounds.end - t) * cycleSeconds;
}

/** Interpolacao linear entre dois numeros. */
function lerp(from: number, to: number, t: number): number {
  return from + (to - from) * t;
}

/**
 * Interpola duas cores hexadecimais canal a canal.
 *
 * Feito na mao, sobre inteiros, em vez de usar `THREE.Color`: assim a logica do
 * ciclo continua pura e testavel em ambiente node, sem importar o motor grafico.
 */
export function mixHex(from: string, to: string, t: number): string {
  const clamped = Math.min(1, Math.max(0, t));
  const a = parseInt(from.slice(1), 16);
  const b = parseInt(to.slice(1), 16);

  const channel = (shift: number) =>
    Math.round(lerp((a >> shift) & 0xff, (b >> shift) & 0xff, clamped));

  const value = (channel(16) << 16) | (channel(8) << 8) | channel(0);
  return `#${value.toString(16).padStart(6, '0')}`;
}

export interface SkyConfig {
  skyColor: string;
  sunColor: string;
  /**
   * Cor da luz hemisferica.
   *
   * Separada de `skyColor` porque as duas tem trabalhos diferentes. O ceu e
   * fundo e pode ser escuro; a luz ambiente precisa iluminar. Enquanto a
   * hemisferica usava a cor do ceu, a noite ficava preta por construcao —
   * qualquer intensidade multiplicada por `#1b2a52` continua dando preto, e
   * subir a intensidade nao resolvia nada. De dia as duas coincidem.
   */
  ambientColor: string;
  /** Intensidade da luz direcional. */
  sunIntensity: number;
  /** Intensidade da luz hemisferica. */
  ambientIntensity: number;
  /** Altura do sol, de 0 (horizonte) a 1 (a pino). */
  elevation: number;
}

/** Cor e forca da luz em cada fase, nos seus extremos. */
const PHASE_LIGHTING: Record<DayPhase, { from: SkyConfig; to: SkyConfig }> = {
  dia: {
    from: {
      skyColor: palette.skyDay,
      sunColor: palette.sunDay,
      ambientColor: palette.skyDay,
      sunIntensity: 2.1,
      ambientIntensity: 1.1,
      elevation: 0.75,
    },
    to: {
      skyColor: palette.skyDay,
      sunColor: palette.sunDay,
      ambientColor: palette.skyDay,
      sunIntensity: 2.1,
      ambientIntensity: 1.1,
      elevation: 1,
    },
  },
  entardecer: {
    from: {
      skyColor: palette.skyDay,
      sunColor: palette.sunDay,
      ambientColor: palette.skyDay,
      sunIntensity: 2.1,
      ambientIntensity: 1.1,
      elevation: 0.75,
    },
    to: {
      skyColor: palette.skyDusk,
      sunColor: palette.sunDusk,
      ambientColor: palette.skyDusk,
      sunIntensity: 0.9,
      ambientIntensity: 0.55,
      elevation: 0.12,
    },
  },
  noite: {
    from: {
      skyColor: palette.skyDusk,
      sunColor: palette.sunDusk,
      ambientColor: palette.skyDusk,
      sunIntensity: 0.9,
      ambientIntensity: 0.55,
      elevation: 0.12,
    },
    to: {
      skyColor: palette.skyNight,
      sunColor: palette.sunNight,
      ambientColor: palette.moonAmbient,
      /**
       * Luar: escuro o bastante para a lanterna valer a pena, claro o bastante
       * para nunca atrapalhar.
       *
       * Calibrado olhando o jogo rodando. Com 0.22/0.2 o teste automatizado
       * passava — a asserçao so exige "maior que zero" — mas a tela ficava
       * praticamente preta. Numero que passa em teste nao e o mesmo que numero
       * que funciona.
       *
       * A mira mudou junto com o jogo. Antes o escuro era o inimigo e valia
       * assustar; agora ele e convite, e a escuridao nunca pode ser obstaculo
       * de navegacao — sem carga na lanterna, a crianca ainda tem que enxergar
       * o terreno e voltar para casa em paz. O que a lanterna acrescenta e o
       * detalhe e o que so aparece no escuro, nao a possibilidade de andar.
       */
      sunIntensity: 0.78,
      ambientIntensity: 0.7,
      elevation: 0.4,
    },
  },
  amanhecer: {
    from: {
      skyColor: palette.skyNight,
      sunColor: palette.sunNight,
      ambientColor: palette.moonAmbient,
      // Mesmos valores do fim da noite: as fases tem que emendar sem salto.
      sunIntensity: 0.78,
      ambientIntensity: 0.7,
      elevation: 0.4,
    },
    to: {
      skyColor: palette.skyDay,
      sunColor: palette.sunDay,
      ambientColor: palette.skyDay,
      sunIntensity: 2.1,
      ambientIntensity: 1.1,
      elevation: 0.75,
    },
  },
};

/**
 * Configuracao de ceu e luz para uma posicao do ciclo.
 *
 * A noite escurece por uma raiz quadrada: rapido no comeco, estavel depois.
 *
 * A primeira versao usava `raw * raw`, que faz o oposto — o ceu ficava com cara
 * de entardecer durante quase toda a fase e so escurecia no fim. Ficava
 * estranho ver o HUD anunciar "Noite" e o ceu ainda laranja. Com a raiz, o
 * escuro chega logo depois da virada e se mantem, que e o que a fase promete.
 */
export function skyConfigFor(position: number): SkyConfig {
  const t = normalizePosition(position);
  const phase = phaseFor(t);
  const { from, to } = PHASE_LIGHTING[phase];
  const raw = phaseProgress(t);
  // Chega a noite fechada com ~45% da fase e fica la ate o amanhecer.
  const eased = phase === 'noite' ? Math.min(1, raw * 2.2) : raw;

  return {
    skyColor: mixHex(from.skyColor, to.skyColor, eased),
    sunColor: mixHex(from.sunColor, to.sunColor, eased),
    ambientColor: mixHex(from.ambientColor, to.ambientColor, eased),
    sunIntensity: lerp(from.sunIntensity, to.sunIntensity, eased),
    ambientIntensity: lerp(from.ambientIntensity, to.ambientIntensity, eased),
    elevation: lerp(from.elevation, to.elevation, eased),
  };
}

/** Rotulo da fase para o HUD. */
/** O nome da fase no idioma da crianca. */
export function phaseLabel(phase: DayPhase, strings: AppStrings): string {
  if (phase === 'dia') return strings.phaseDay;
  if (phase === 'entardecer') return strings.phaseDusk;
  if (phase === 'noite') return strings.phaseNight;
  return strings.phaseDawn;
}
