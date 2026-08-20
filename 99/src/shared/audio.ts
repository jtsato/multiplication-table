/**
 * Áudio 100% sintetizado com Web Audio API — nenhum asset externo.
 *
 * O projeto inteiro tem a regra de arte/som gerados em código; este módulo é o
 * equivalente sonoro da paleta. Cada efeito é descrito como dados puros
 * (`SOUND_PRESETS`) e o reprodutor só transforma esses dados em osciladores e
 * ruído filtrado no momento em que o som toca.
 *
 * O `AudioContext` é criado de forma preguiçosa no primeiro gesto do usuário
 * (pointerdown/keydown), porque navegadores bloqueiam áudio antes de interação.
 */

export type SoundName =
  | 'correct'
  | 'wrong'
  | 'harvest'
  | 'lantern'
  | 'coin'
  | 'build'
  | 'hint'
  | 'feed'
  | 'order'
  | 'bridge'
  | 'ui'
  | 'step-sand'
  | 'step-grass'
  | 'step-wood'
  | 'step-stone';

/** Um passo de tom: oscilador com envelope simples ataque/decai. */
export interface ToneStep {
  frequency: number;
  /** Início relativo ao começo do som, em segundos. */
  start: number;
  /** Duração do envelope, em segundos. */
  duration: number;
  type: OscillatorType;
  /** Ganho de pico (0 a 1). */
  gain: number;
}

/** Um passo de ruído: burst curto de ruído branco passado por filtro. */
export interface NoiseStep {
  /** Início relativo ao começo do som, em segundos. */
  start: number;
  duration: number;
  filter: BiquadFilterType;
  /** Frequência central do filtro. */
  frequency: number;
  /** Ganho de pico (0 a 1). */
  gain: number;
}

export interface SoundPreset {
  tones: ToneStep[];
  noises: NoiseStep[];
}

/**
 * As partituras de cada efeito.
 *
 * São dados puros de propósito: podem ser testados sem `AudioContext` e
 * descrevem a *intenção* do som — xilofone no acerto, mola macia no erro,
 * areia/grama/madeira/pedra nos passos.
 */
export const SOUND_PRESETS: Record<SoundName, SoundPreset> = {
  // Acorde ascendente de xilofone: recompensa sem ansiedade.
  correct: {
    tones: [
      { frequency: 523.25, start: 0, duration: 0.18, type: 'triangle', gain: 0.22 },
      { frequency: 659.25, start: 0.07, duration: 0.18, type: 'triangle', gain: 0.22 },
      { frequency: 783.99, start: 0.14, duration: 0.22, type: 'triangle', gain: 0.22 },
      { frequency: 1046.5, start: 0.21, duration: 0.3, type: 'triangle', gain: 0.2 },
    ],
    noises: [],
  },
  // Mola macia: avisa que errou sem soar como punição.
  wrong: {
    tones: [
      { frequency: 311.13, start: 0, duration: 0.16, type: 'sine', gain: 0.16 },
      { frequency: 233.08, start: 0.1, duration: 0.24, type: 'sine', gain: 0.14 },
      { frequency: 174.61, start: 0.22, duration: 0.28, type: 'sine', gain: 0.12 },
    ],
    noises: [],
  },
  // Colheita: pop curto + brilho alto.
  harvest: {
    tones: [
      { frequency: 880, start: 0, duration: 0.08, type: 'square', gain: 0.08 },
      { frequency: 1318.5, start: 0.05, duration: 0.18, type: 'triangle', gain: 0.18 },
    ],
    noises: [{ start: 0, duration: 0.06, filter: 'highpass', frequency: 2400, gain: 0.12 }],
  },
  // Acender a lanterna: sopro (ruído filtrado) + acorde quente.
  lantern: {
    tones: [
      { frequency: 392, start: 0.06, duration: 0.35, type: 'sine', gain: 0.18 },
      { frequency: 493.88, start: 0.06, duration: 0.35, type: 'sine', gain: 0.16 },
      { frequency: 587.33, start: 0.06, duration: 0.4, type: 'sine', gain: 0.14 },
    ],
    noises: [{ start: 0, duration: 0.3, filter: 'bandpass', frequency: 900, gain: 0.1 }],
  },
  // Moeda: dois pingos altos.
  coin: {
    tones: [
      { frequency: 987.77, start: 0, duration: 0.09, type: 'square', gain: 0.08 },
      { frequency: 1318.5, start: 0.07, duration: 0.16, type: 'square', gain: 0.08 },
    ],
    noises: [],
  },
  // Construção: baque grave de madeira.
  build: {
    tones: [{ frequency: 130.81, start: 0, duration: 0.22, type: 'sine', gain: 0.22 }],
    noises: [{ start: 0, duration: 0.1, filter: 'lowpass', frequency: 700, gain: 0.16 }],
  },
  // Dica: blip delicado.
  hint: {
    tones: [
      { frequency: 659.25, start: 0, duration: 0.12, type: 'sine', gain: 0.12 },
      { frequency: 880, start: 0.09, duration: 0.16, type: 'sine', gain: 0.1 },
    ],
    noises: [],
  },
  // Amizade com animal: duas notas gentis.
  feed: {
    tones: [
      { frequency: 523.25, start: 0, duration: 0.2, type: 'sine', gain: 0.16 },
      { frequency: 659.25, start: 0.16, duration: 0.28, type: 'sine', gain: 0.14 },
    ],
    noises: [],
  },
  // Encomenda entregue: papel + recompensa.
  order: {
    tones: [
      { frequency: 587.33, start: 0.08, duration: 0.14, type: 'triangle', gain: 0.16 },
      { frequency: 880, start: 0.18, duration: 0.22, type: 'triangle', gain: 0.16 },
    ],
    noises: [{ start: 0, duration: 0.08, filter: 'bandpass', frequency: 1800, gain: 0.08 }],
  },
  // Ponte liberada: acorde mais amplo.
  bridge: {
    tones: [
      { frequency: 261.63, start: 0, duration: 0.3, type: 'sine', gain: 0.18 },
      { frequency: 329.63, start: 0.04, duration: 0.3, type: 'sine', gain: 0.16 },
      { frequency: 392, start: 0.08, duration: 0.38, type: 'sine', gain: 0.16 },
    ],
    noises: [{ start: 0, duration: 0.12, filter: 'highpass', frequency: 3000, gain: 0.06 }],
  },
  // Clique de interface: tick mínimo.
  ui: {
    tones: [{ frequency: 660, start: 0, duration: 0.05, type: 'square', gain: 0.05 }],
    noises: [],
  },
  // Passos: areia é ruído grave e abafado.
  'step-sand': {
    tones: [],
    noises: [{ start: 0, duration: 0.12, filter: 'lowpass', frequency: 500, gain: 0.12 }],
  },
  // Grama: ruído um pouco mais agudo e curto.
  'step-grass': {
    tones: [],
    noises: [{ start: 0, duration: 0.08, filter: 'lowpass', frequency: 900, gain: 0.1 }],
  },
  // Madeira (ponte, cais): clique oco com ressonância média.
  'step-wood': {
    tones: [{ frequency: 220, start: 0, duration: 0.07, type: 'sine', gain: 0.06 }],
    noises: [{ start: 0, duration: 0.07, filter: 'bandpass', frequency: 1200, gain: 0.1 }],
  },
  // Pedra: clique seco e mais agudo.
  'step-stone': {
    tones: [],
    noises: [{ start: 0, duration: 0.05, filter: 'highpass', frequency: 2000, gain: 0.08 }],
  },
};

let context: AudioContext | null = null;
let masterGain: GainNode | null = null;
let enabled = true;
let desiredVolume = 0.5;

type AudioContextConstructor = typeof AudioContext;

function getContextConstructor(): AudioContextConstructor | null {
  if (typeof window === 'undefined') return null;
  const w = window as unknown as {
    AudioContext?: AudioContextConstructor;
    webkitAudioContext?: AudioContextConstructor;
  };
  return w.AudioContext ?? w.webkitAudioContext ?? null;
}

function ensureContext(): AudioContext | null {
  const Ctor = getContextConstructor();
  if (!Ctor) return null;
  if (!context) {
    context = new Ctor();
    masterGain = context.createGain();
    masterGain.gain.value = desiredVolume;
    masterGain.connect(context.destination);
  }
  if (context.state === 'suspended') void context.resume();
  return context;
}

/**
 * Libera o áudio. Deve ser chamado no primeiro gesto do usuário (pointerdown ou
 * keydown) — sem isso o navegador mantém o contexto suspenso.
 */
export function unlockAudio(): void {
  ensureContext();
}

/** Permite desligar o áudio (acessibilidade ou preferência). */
export function setAudioEnabled(value: boolean): void {
  enabled = value;
}

/** Ajusta o volume mestre, de 0 a 1. */
export function setAudioVolume(value: number): void {
  desiredVolume = Math.min(1, Math.max(0, value));
  if (masterGain && context) {
    masterGain.gain.setTargetAtTime(desiredVolume, context.currentTime, 0.02);
  }
}

export function isAudioEnabled(): boolean {
  return enabled;
}

function playTone(ctx: AudioContext, destination: AudioNode, step: ToneStep): void {
  const oscillator = ctx.createOscillator();
  const gain = ctx.createGain();
  oscillator.type = step.type;
  oscillator.frequency.setValueAtTime(step.frequency, ctx.currentTime + step.start);

  const start = ctx.currentTime + step.start;
  const end = start + step.duration;
  gain.gain.setValueAtTime(0.0001, start);
  gain.gain.exponentialRampToValueAtTime(Math.max(0.0001, step.gain), start + 0.01);
  gain.gain.exponentialRampToValueAtTime(0.0001, end);

  oscillator.connect(gain);
  gain.connect(destination);
  oscillator.start(start);
  oscillator.stop(end + 0.02);
}

function playNoise(ctx: AudioContext, destination: AudioNode, step: NoiseStep): void {
  const length = Math.max(0.02, step.duration);
  const buffer = ctx.createBuffer(1, Math.ceil(ctx.sampleRate * length), ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < data.length; i += 1) {
    // Ruído branco simples, suficiente para um burst curto low poly.
    data[i] = Math.random() * 2 - 1;
  }

  const source = ctx.createBufferSource();
  const filter = ctx.createBiquadFilter();
  const gain = ctx.createGain();
  source.buffer = buffer;
  filter.type = step.filter;
  filter.frequency.value = step.frequency;
  filter.Q.value = 0.8;

  const start = ctx.currentTime + step.start;
  const end = start + step.duration;
  gain.gain.setValueAtTime(0.0001, start);
  gain.gain.exponentialRampToValueAtTime(Math.max(0.0001, step.gain), start + 0.005);
  gain.gain.exponentialRampToValueAtTime(0.0001, end);

  source.connect(filter);
  filter.connect(gain);
  gain.connect(destination);
  source.start(start);
  source.stop(end + 0.02);
}

/**
 * Toca um efeito sonoro pelo nome.
 *
 * Sem `AudioContext` (node, jsdom, navegador bloqueando áudio) não faz nada —
 * o jogo continua 100% jogável sem som, como era antes.
 */
export function playSound(name: SoundName): void {
  if (!enabled) return;
  const ctx = ensureContext();
  if (!ctx || !masterGain) return;

  const preset = SOUND_PRESETS[name];
  for (const tone of preset.tones) playTone(ctx, masterGain, tone);
  for (const noise of preset.noises) playNoise(ctx, masterGain, noise);
}
