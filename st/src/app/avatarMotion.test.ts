import { describe, expect, it } from "vitest";
import { getAvatarMotionClass } from "./avatarMotion";

describe("avatar motion", () => {
  it("uses a celebration animation after a correct answer", () => {
    expect(getAvatarMotionClass(false, "celebrate")).toBe("avatar-motion-celebrate");
  });

  it("disables avatar animation when reduced motion is enabled", () => {
    expect(getAvatarMotionClass(true, "celebrate")).toBe("avatar-motion-none");
  });
});
