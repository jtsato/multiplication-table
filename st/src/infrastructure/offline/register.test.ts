import { describe, expect, it, vi } from "vitest";
import { registerServiceWorker } from "./register";

describe("offline registration", () => {
  it("registers the service worker with cache updates disabled", async () => {
    const register = vi.fn().mockResolvedValue({ scope: "/" });

    await registerServiceWorker({ register });

    expect(register).toHaveBeenCalledWith("/sw.js", { updateViaCache: "none" });
  });

  it("does nothing when service workers are unavailable", async () => {
    await expect(registerServiceWorker(undefined)).resolves.toBeUndefined();
  });

  it("notifies the app when an updated worker is waiting", async () => {
    const onUpdate = vi.fn();
    const registration = {
      waiting: {},
      addEventListener: vi.fn(),
    };
    const register = vi.fn().mockResolvedValue(registration);

    await registerServiceWorker({ register }, onUpdate);

    expect(onUpdate).toHaveBeenCalledOnce();
  });
});
