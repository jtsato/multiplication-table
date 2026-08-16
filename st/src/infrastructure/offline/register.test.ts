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
});
