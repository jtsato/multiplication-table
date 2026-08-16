export type AvatarMotion = "idle" | "celebrate";

export function getAvatarMotionClass(reducedMotion: boolean, motion: AvatarMotion = "idle"): string {
  return reducedMotion ? "avatar-motion-none" : `avatar-motion-${motion}`;
}
