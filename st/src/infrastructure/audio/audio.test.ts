import { describe, expect, it, vi } from "vitest";
import { narrate, playFeedbackTone, type NarrationDriver, type ToneDriver } from "./audio";

describe("audio feedback", () => {
  it("narrates in Brazilian Portuguese when narration is enabled", () => {
    const driver: NarrationDriver = {
      cancel: vi.fn(),
      createUtterance: vi.fn((text) => ({ text, lang: "", rate: 1, pitch: 1 })),
      speak: vi.fn(),
    };

    narrate("Muito bem!", true, driver);

    expect(driver.cancel).toHaveBeenCalledOnce();
    expect(driver.createUtterance).toHaveBeenCalledWith("Muito bem!");
    expect(driver.speak).toHaveBeenCalledWith({ text: "Muito bem!", lang: "pt-BR", rate: 0.95, pitch: 1.05 });
  });

  it("does not invoke disabled narration", () => {
    const driver: NarrationDriver = {
      cancel: vi.fn(),
      createUtterance: vi.fn((text) => ({ text, lang: "", rate: 1, pitch: 1 })),
      speak: vi.fn(),
    };

    narrate("Silêncio", false, driver);

    expect(driver.cancel).not.toHaveBeenCalled();
    expect(driver.speak).not.toHaveBeenCalled();
  });

  it("plays distinct tones for success and error when effects are enabled", () => {
    const driver: ToneDriver = { play: vi.fn() };

    playFeedbackTone("success", true, driver);
    playFeedbackTone("error", true, driver);

    expect(driver.play).toHaveBeenNthCalledWith(1, { frequency: 660, durationMs: 120 });
    expect(driver.play).toHaveBeenNthCalledWith(2, { frequency: 220, durationMs: 160 });
  });
});
