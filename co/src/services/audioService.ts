class AudioService {
  private context: AudioContext | null = null;
  private musicOscillator: OscillatorNode | null = null;
  private musicGain: GainNode | null = null;

  setMusic(enabled: boolean): void {
    if (!enabled) {
      this.musicOscillator?.stop();
      this.musicOscillator = null;
      this.musicGain = null;
      return;
    }
    if (this.musicOscillator || typeof AudioContext === 'undefined') return;
    this.context ??= new AudioContext();
    void this.context.resume();
    const oscillator = this.context.createOscillator();
    const gain = this.context.createGain();
    oscillator.type = 'triangle';
    oscillator.frequency.value = 130.81;
    gain.gain.value = 0.012;
    oscillator.connect(gain).connect(this.context.destination);
    oscillator.start();
    this.musicOscillator = oscillator;
    this.musicGain = gain;
  }

  play(kind: 'correct' | 'incorrect' | 'complete', enabled: boolean): void {
    if (!enabled || typeof AudioContext === 'undefined') return;
    this.context ??= new AudioContext();
    void this.context.resume();
    const frequencies =
      kind === 'correct' ? [523, 659] : kind === 'complete' ? [523, 659, 784] : [260, 220];
    frequencies.forEach((frequency, index) => {
      const oscillator = this.context!.createOscillator();
      const gain = this.context!.createGain();
      const start = this.context!.currentTime + index * 0.1;
      oscillator.frequency.value = frequency;
      oscillator.type = 'sine';
      gain.gain.setValueAtTime(0.0001, start);
      gain.gain.exponentialRampToValueAtTime(0.08, start + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.16);
      oscillator.connect(gain).connect(this.context!.destination);
      oscillator.start(start);
      oscillator.stop(start + 0.18);
    });
  }
}

export const audioService = new AudioService();
