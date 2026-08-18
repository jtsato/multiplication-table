export type NarrationUtterance = {
  text: string;
  lang: string;
  rate: number;
  pitch: number;
};

export type NarrationDriver = {
  cancel: () => void;
  createUtterance: (text: string) => NarrationUtterance;
  speak: (utterance: NarrationUtterance) => void;
};

export type Tone = "success" | "error";

export type ToneRequest = {
  frequency: number;
  durationMs: number;
};

export type ToneDriver = {
  play: (request: ToneRequest) => void;
};

/**
 * Lê o texto em voz alta no idioma em que ele foi escrito.
 *
 * `lang` precisa acompanhar o idioma da interface: com a etiqueta errada o
 * sintetizador lê japonês com fonemas portugueses, o que soa pior do que não
 * narrar. O padrão pt-BR só vale para quem chama sem informar o idioma.
 */
export function narrate(
  text: string,
  enabled: boolean,
  lang = "pt-BR",
  driver = createBrowserNarrationDriver(),
): void {
  if (!enabled || !driver || !text.trim()) return;

  const utterance = driver.createUtterance(text);
  utterance.lang = lang;
  utterance.rate = 0.95;
  utterance.pitch = 1.05;
  driver.cancel();
  driver.speak(utterance);
}

export function playFeedbackTone(
  tone: Tone,
  enabled: boolean,
  driver = createBrowserToneDriver(),
): void {
  if (!enabled || !driver) return;
  driver.play(
    tone === "success" ? { frequency: 660, durationMs: 120 } : { frequency: 220, durationMs: 160 },
  );
}

function createBrowserNarrationDriver(): NarrationDriver | undefined {
  if (
    typeof window === "undefined" ||
    !("speechSynthesis" in window) ||
    !("SpeechSynthesisUtterance" in window)
  ) {
    return undefined;
  }

  return {
    cancel: () => window.speechSynthesis.cancel(),
    createUtterance: (text) => new SpeechSynthesisUtterance(text),
    speak: (utterance) =>
      window.speechSynthesis.speak(utterance as unknown as SpeechSynthesisUtterance),
  };
}

function createBrowserToneDriver(): ToneDriver | undefined {
  if (typeof window === "undefined") return undefined;
  const AudioContextConstructor =
    window.AudioContext ??
    (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!AudioContextConstructor) return undefined;

  return {
    play: ({ frequency, durationMs }) => {
      const context = new AudioContextConstructor();
      const oscillator = context.createOscillator();
      const gain = context.createGain();
      const endAt = context.currentTime + durationMs / 1000;
      oscillator.frequency.value = frequency;
      oscillator.type = "sine";
      gain.gain.setValueAtTime(0.0001, context.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.12, context.currentTime + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.0001, endAt);
      oscillator.connect(gain);
      gain.connect(context.destination);
      oscillator.start();
      oscillator.stop(endAt);
      oscillator.addEventListener("ended", () => void context.close(), { once: true });
    },
  };
}
