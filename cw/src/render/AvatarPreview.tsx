import { useEffect, useRef } from 'react';
import { drawAvatar } from './avatarSprite';
import type { AvatarConfig } from '../domain/types';

interface AvatarPreviewProps {
  avatar: AvatarConfig;
  size?: number;
  label?: string;
}

/** Retrato estático do personagem, usado em telas e botões de escolha. */
export function AvatarPreview({ avatar, size = 96, label }: AvatarPreviewProps) {
  const ref = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const dpr = Math.min(globalThis.devicePixelRatio || 1, 2);
    canvas.width = size * dpr;
    canvas.height = size * dpr;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, size, size);
    drawAvatar(ctx, avatar, size * 0.1, size * 0.12, size * 0.8);
  }, [avatar, size]);

  return (
    <canvas
      ref={ref}
      style={{ width: size, height: size }}
      role="img"
      aria-label={label ?? ''}
      className="avatar-preview"
    />
  );
}
