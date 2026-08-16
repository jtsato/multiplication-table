/**
 * Audio gerado em tempo real com a Web Audio API.
 *
 * Nenhum arquivo de som no projeto: todos os efeitos sao ondas sintetizadas,
 * o que evita assets externos e mantem o build leve. O jogo NUNCA depende do
 * audio para ser entendido - som e enfeite, e pode ser desligado.
 */

export type SoundName = 'click' | 'correct' | 'wrong' | 'build' | 'complete' | 'unlock';

interface Note {
  frequency: number;
  /** Atraso do inicio, em segundos. */
  delay: number;
  duration: number;
  type: OscillatorType;
  gain: number;
}

/** Efeitos curtos, alegres e sem picos agressivos. */
const SOUNDS: Record<SoundName, Note[]> = {
  click: [{ frequency: 620, delay: 0, duration: 0.07, type: 'triangle', gain: 0.16 }],
  correct: [
    { frequency: 660, delay: 0, duration: 0.1, type: 'triangle', gain: 0.2 },
    { frequency: 880, delay: 0.08, duration: 0.12, type: 'triangle', gain: 0.2 },
  ],
  // Erro: dois tons descendentes suaves. Nada de buzzer punitivo.
  wrong: [
    { frequency: 330, delay: 0, duration: 0.12, type: 'sine', gain: 0.16 },
    { frequency: 262, delay: 0.1, duration: 0.16, type: 'sine', gain: 0.14 },
  ],
  build: [{ frequency: 420, delay: 0, duration: 0.08, type: 'square', gain: 0.09 }],
  complete: [
    { frequency: 523, delay: 0, duration: 0.12, type: 'triangle', gain: 0.2 },
    { frequency: 659, delay: 0.1, duration: 0.12, type: 'triangle', gain: 0.2 },
    { frequency: 784, delay: 0.2, duration: 0.14, type: 'triangle', gain: 0.2 },
    { frequency: 1047, delay: 0.32, duration: 0.26, type: 'triangle', gain: 0.18 },
  ],
  unlock: [
    { frequency: 784, delay: 0, duration: 0.1, type: 'triangle', gain: 0.18 },
    { frequency: 1047, delay: 0.09, duration: 0.1, type: 'triangle', gain: 0.18 },
    { frequency: 1319, delay: 0.18, duration: 0.22, type: 'triangle', gain: 0.16 },
  ],
};

/**
 * Melodia de fundo: frase mais longa em pentatonica maior, com pausas (0),
 * para nao virar um loop curto e repetitivo de subida-e-descida.
 */
const MUSIC_NOTES = [523, 659, 784, 1047, 880, 784, 659, 587, 0, 659, 880, 784, 659, 523, 587, 0];
const MUSIC_STEP_MS = 420;

export interface AudioService {
  setSoundEnabled(enabled: boolean): void;
  setMusicEnabled(enabled: boolean): void;
  play(sound: SoundName): void;
  /** Deve ser chamado no primeiro toque/clique: politica de autoplay. */
  unlock(): void;
  stopAll(): void;
}

export function createAudioService(): AudioService {
  let context: AudioContext | null = null;
  let soundEnabled = true;
  let musicEnabled = false;
  let musicTimer: ReturnType<typeof setInterval> | null = null;
  let musicStep = 0;

  function getContext(): AudioContext | null {
    if (typeof window === 'undefined') {
      return null;
    }
    const Ctor =
      window.AudioContext ??
      (window as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctor) {
      return null;
    }
    if (!context) {
      try {
        context = new Ctor();
      } catch {
        return null;
      }
    }
    if (context.state === 'suspended') {
      void context.resume().catch(() => undefined);
    }
    return context;
  }

  function playNote(note: Note, volumeScale = 1): void {
    const ctx = getContext();
    if (!ctx) {
      return;
    }
    const startAt = ctx.currentTime + note.delay;
    const oscillator = ctx.createOscillator();
    const gain = ctx.createGain();

    oscillator.type = note.type;
    oscillator.frequency.setValueAtTime(note.frequency, startAt);

    // Envelope curto: ataque rapido e decaimento suave, sem estalo.
    gain.gain.setValueAtTime(0.0001, startAt);
    gain.gain.exponentialRampToValueAtTime(note.gain * volumeScale, startAt + 0.015);
    gain.gain.exponentialRampToValueAtTime(0.0001, startAt + note.duration);

    oscillator.connect(gain);
    gain.connect(ctx.destination);
    oscillator.start(startAt);
    oscillator.stop(startAt + note.duration + 0.05);
  }

  function stopMusic(): void {
    if (musicTimer !== null) {
      clearInterval(musicTimer);
      musicTimer = null;
    }
  }

  function startMusic(): void {
    if (musicTimer !== null || typeof window === 'undefined') {
      return;
    }
    musicTimer = setInterval(() => {
      const frequency = MUSIC_NOTES[musicStep % MUSIC_NOTES.length] ?? 523;
      musicStep += 1;
      // 0 e uma pausa: da respiro a frase em vez de tocar nota por cima dela.
      if (frequency === 0) {
        return;
      }
      playNote(
        { frequency, delay: 0, duration: 0.34, type: 'sine', gain: 0.05 },
        // A melodia fica bem abaixo dos efeitos para nao competir com eles.
        1,
      );
    }, MUSIC_STEP_MS);
  }

  return {
    setSoundEnabled(enabled) {
      soundEnabled = enabled;
    },

    setMusicEnabled(enabled) {
      musicEnabled = enabled;
      if (enabled) {
        startMusic();
      } else {
        stopMusic();
      }
    },

    play(sound) {
      if (!soundEnabled) {
        return;
      }
      for (const note of SOUNDS[sound]) {
        playNote(note);
      }
    },

    unlock() {
      getContext();
      if (musicEnabled) {
        startMusic();
      }
    },

    stopAll() {
      stopMusic();
    },
  };
}

/** Instancia unica usada pelo app. */
export const audioService: AudioService = createAudioService();
