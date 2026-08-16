import { useEffect, useRef } from 'react';
import {
  GRID_H,
  GRID_W,
  GROUND_Y,
  createScenePlan,
  visibleBlockCount,
  type Block,
} from './scenePlan';
import { drawAvatar } from './avatarSprite';
import type { BiomePalette, SceneKind } from '../domain/world';
import type { AvatarConfig } from '../domain/types';

interface BlockSceneProps {
  kind: SceneKind;
  palette: BiomePalette;
  avatar: AvatarConfig;
  /** Avanço da construção, de 0 a 1. */
  progress: number;
  reducedMotion: boolean;
  /** Incrementa a cada acerto para disparar a animação de "bloco caindo". */
  pulseKey: number;
  label: string;
}

interface DrawState {
  shownBlocks: number;
  animatingSince: number;
}

function roundedBlock(
  ctx: CanvasRenderingContext2D,
  block: Block,
  cell: number,
  alpha = 1,
  offsetY = 0,
) {
  const x = block.x * cell;
  const y = block.y * cell + offsetY;
  const w = block.w * cell;
  const h = block.h * cell;
  ctx.globalAlpha = alpha;
  ctx.fillStyle = block.color;
  ctx.fillRect(x, y, w, h);
  // Face superior mais clara: dá volume sem depender de sprites externos.
  ctx.fillStyle = 'rgba(255,255,255,0.22)';
  ctx.fillRect(x, y, w, Math.max(2, h * 0.16));
  ctx.fillStyle = 'rgba(0,0,0,0.12)';
  ctx.fillRect(x, y + h - Math.max(2, h * 0.12), w, Math.max(2, h * 0.12));
  if (block.shine) {
    ctx.fillStyle = 'rgba(255,255,255,0.55)';
    ctx.fillRect(x + w * 0.15, y + h * 0.2, w * 0.25, h * 0.25);
  }
  ctx.globalAlpha = 1;
}

export function BlockScene({
  kind,
  palette,
  avatar,
  progress,
  reducedMotion,
  pulseKey,
  label,
}: BlockSceneProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const stateRef = useRef<DrawState>({ shownBlocks: 0, animatingSince: 0 });
  const frameRef = useRef<number>(0);

  useEffect(() => {
    stateRef.current.animatingSince = performance.now();
  }, [pulseKey]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const plan = createScenePlan(kind, palette);
    const target = visibleBlockCount(plan, progress);

    const render = (time: number) => {
      const dpr = Math.min(globalThis.devicePixelRatio || 1, 2);
      const width = canvas.clientWidth;
      const height = canvas.clientHeight;
      if (canvas.width !== width * dpr || canvas.height !== height * dpr) {
        canvas.width = width * dpr;
        canvas.height = height * dpr;
      }
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const cell = Math.min(width / GRID_W, height / GRID_H);
      const offsetX = (width - cell * GRID_W) / 2;
      const offsetY = (height - cell * GRID_H) / 2;

      ctx.clearRect(0, 0, width, height);
      ctx.save();
      ctx.translate(offsetX, offsetY);

      // Céu
      const sky = ctx.createLinearGradient(0, 0, 0, cell * GRID_H);
      sky.addColorStop(0, palette.skyTop);
      sky.addColorStop(1, palette.skyBottom);
      ctx.fillStyle = sky;
      ctx.fillRect(0, 0, cell * GRID_W, cell * GRID_H);

      // Sol/lua de blocos e nuvens
      ctx.fillStyle = 'rgba(255,255,255,0.75)';
      const drift = reducedMotion ? 0 : ((time / 90) % (cell * GRID_W + 200)) - 100;
      ctx.fillRect(drift, cell * 1.2, cell * 3, cell * 0.8);
      ctx.fillRect(drift + cell, cell * 0.6, cell * 1.6, cell * 0.8);
      ctx.fillRect(cell * GRID_W - drift * 0.6 - cell * 4, cell * 2.4, cell * 2.4, cell * 0.7);
      ctx.fillStyle = palette.accent;
      ctx.fillRect(cell * (GRID_W - 3), cell * 0.7, cell * 1.6, cell * 1.6);

      for (const block of plan.scenery) roundedBlock(ctx, block, cell);

      const state = stateRef.current;
      const elapsed = time - state.animatingSince;
      const dropDuration = reducedMotion ? 0 : 380;

      plan.build.slice(0, target).forEach((block, index) => {
        const isNewest = index >= target - 1 && elapsed < dropDuration;
        if (isNewest && dropDuration > 0) {
          const t = Math.min(1, elapsed / dropDuration);
          const eased = 1 - Math.pow(1 - t, 3);
          roundedBlock(ctx, block, cell, eased, -cell * 4 * (1 - eased));
        } else {
          roundedBlock(ctx, block, cell);
        }
      });

      // Personagem caminha conforme a construção avança
      const walkX = plan.walk.from + (plan.walk.to - plan.walk.from) * Math.min(1, progress);
      const bounce = reducedMotion ? 0 : Math.abs(Math.sin(time / 320)) * cell * 0.12;
      drawAvatar(ctx, avatar, walkX * cell, (GROUND_Y - 2) * cell - bounce, cell * 2);

      ctx.restore();
      frameRef.current = requestAnimationFrame(render);
    };

    frameRef.current = requestAnimationFrame(render);
    return () => cancelAnimationFrame(frameRef.current);
  }, [kind, palette, progress, avatar, reducedMotion]);

  return <canvas ref={canvasRef} className="block-scene" role="img" aria-label={label} />;
}
