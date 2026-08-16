/**
 * Áudio 100% gerado em runtime com a Web Audio API — nenhum arquivo externo,
 * nenhum asset licenciado. O jogo é totalmente compreensível sem som.
 *
 * Para trocar por arquivos de áudio depois, basta reimplementar os métodos
 * públicos desta classe; nenhuma tela conhece osciladores.
 */

export type SoundName = 'place' | 'wrong' | 'complete' | 'unlock' | 'tap';

interface ToneSpec {
  freq: number;
  duration: number;
  delay: number;
  type: OscillatorType;
  gain: number;
}

const SOUNDS: Record<SoundName, ToneSpec[]> = {
  tap: [{ freq: 520, duration: 0.07, delay: 0, type: 'triangle', gain: 0.12 }],
  place: [
    { freq: 660, duration: 0.09, delay: 0, type: 'triangle', gain: 0.16 },
    { freq: 880, duration: 0.12, delay: 0.08, type: 'triangle', gain: 0.16 },
  ],
  wrong: [
    { freq: 320, duration: 0.12, delay: 0, type: 'sine', gain: 0.14 },
    { freq: 260, duration: 0.16, delay: 0.1, type: 'sine', gain: 0.14 },
  ],
  complete: [
    { freq: 523, duration: 0.12, delay: 0, type: 'triangle', gain: 0.16 },
    { freq: 659, duration: 0.12, delay: 0.11, type: 'triangle', gain: 0.16 },
    { freq: 784, duration: 0.12, delay: 0.22, type: 'triangle', gain: 0.16 },
    { freq: 1047, duration: 0.26, delay: 0.33, type: 'triangle', gain: 0.18 },
  ],
  unlock: [
    { freq: 440, duration: 0.14, delay: 0, type: 'square', gain: 0.1 },
    { freq: 660, duration: 0.14, delay: 0.12, type: 'square', gain: 0.1 },
    { freq: 880, duration: 0.3, delay: 0.24, type: 'triangle', gain: 0.14 },
  ],
};

/** Melodia simples e calma em pentatônica, em loop. */
const MUSIC_NOTES = [523, 587, 659, 784, 880, 784, 659, 587];
const MUSIC_STEP = 0.42;

export class AudioService {
  private context: AudioContext | null = null;
  private musicTimer: ReturnType<typeof setInterval> | null = null;
  private musicIndex = 0;
  private soundEnabled = true;
  private musicEnabled = true;

  setEnabled(sound: boolean, music: boolean): void {
    this.soundEnabled = sound;
    this.musicEnabled = music;
    if (!music) this.stopMusic();
  }

  /** Deve ser chamado dentro de um gesto do usuário (política dos browsers). */
  unlock(): void {
    const ctx = this.ensureContext();
    if (ctx && ctx.state === 'suspended') void ctx.resume();
  }

  private ensureContext(): AudioContext | null {
    if (this.context) return this.context;
    const Ctor =
      globalThis.AudioContext ??
      (globalThis as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctor) return null;
    try {
      this.context = new Ctor();
    } catch {
      this.context = null;
    }
    return this.context;
  }

  private tone(spec: ToneSpec, volumeScale = 1): void {
    const ctx = this.ensureContext();
    if (!ctx) return;
    const start = ctx.currentTime + spec.delay;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = spec.type;
    osc.frequency.setValueAtTime(spec.freq, start);
    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.exponentialRampToValueAtTime(spec.gain * volumeScale, start + 0.015);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + spec.duration);
    osc.connect(gain).connect(ctx.destination);
    osc.start(start);
    osc.stop(start + spec.duration + 0.05);
  }

  play(name: SoundName): void {
    if (!this.soundEnabled) return;
    for (const spec of SOUNDS[name]) this.tone(spec);
  }

  startMusic(): void {
    if (!this.musicEnabled || this.musicTimer) return;
    if (!this.ensureContext()) return;
    this.musicTimer = setInterval(() => {
      const freq = MUSIC_NOTES[this.musicIndex % MUSIC_NOTES.length] as number;
      this.tone({ freq, duration: MUSIC_STEP * 0.8, delay: 0, type: 'sine', gain: 0.05 }, 1);
      this.musicIndex += 1;
    }, MUSIC_STEP * 1000);
  }

  stopMusic(): void {
    if (this.musicTimer) clearInterval(this.musicTimer);
    this.musicTimer = null;
  }
}

export const audioService = new AudioService();
