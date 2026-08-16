import { describe, expect, it } from 'vitest';
import { buildSceneBlocks, GROUND_Y, SCENE_WIDTH, UNIT, visibleBlockCount } from './scenes';
import { MISSIONS } from '../domain/missions';
import { getPalette, ISLANDS } from '../domain/islands';

const SCENES = [...new Set(MISSIONS.map((mission) => mission.scene))];

describe('buildSceneBlocks', () => {
  it('gera blocos para todas as cenas usadas pelas missoes', () => {
    for (const scene of SCENES) {
      const blocks = buildSceneBlocks(scene, getPalette(2));
      expect(blocks.length).toBeGreaterThan(0);
    }
  });

  it('mantem todo bloco dentro do quadro da cena', () => {
    for (const island of ISLANDS) {
      for (const scene of SCENES) {
        for (const block of buildSceneBlocks(scene, island.palette)) {
          expect(block.x).toBeGreaterThanOrEqual(0);
          expect(block.x + block.w).toBeLessThanOrEqual(SCENE_WIDTH);
          expect(block.y).toBeGreaterThanOrEqual(0);
          expect(block.y + block.h).toBeLessThanOrEqual(GROUND_Y);
        }
      }
    }
  });

  it('alinha todos os blocos na grade', () => {
    for (const scene of SCENES) {
      for (const block of buildSceneBlocks(scene, getPalette(4))) {
        expect(block.x % UNIT).toBe(0);
        expect((GROUND_Y - block.y) % UNIT).toBe(0);
        expect(block.w).toBe(UNIT);
        expect(block.h).toBe(UNIT);
      }
    }
  });

  it('nao empilha dois blocos na mesma posicao', () => {
    for (const scene of SCENES) {
      const blocks = buildSceneBlocks(scene, getPalette(6));
      const positions = blocks.map((block) => `${block.x}:${block.y}`);
      expect(new Set(positions).size).toBe(positions.length);
    }
  });

  it('da a cada acerto pelo menos um bloco novo', () => {
    for (const mission of MISSIONS) {
      const total = buildSceneBlocks(mission.scene, getPalette(mission.table)).length;
      expect(total).toBeGreaterThanOrEqual(mission.questionCount);
    }
  });

  it('usa as cores do bioma da ilha', () => {
    const fields = buildSceneBlocks('tower', getPalette(2));
    const ice = buildSceneBlocks('tower', getPalette(8));
    expect(fields.map((block) => block.color)).not.toEqual(ice.map((block) => block.color));
  });
});

describe('visibleBlockCount', () => {
  it('nao mostra nada antes do primeiro acerto', () => {
    expect(visibleBlockCount(18, 0)).toBe(0);
  });

  it('mostra a construcao inteira ao concluir', () => {
    expect(visibleBlockCount(18, 1)).toBe(18);
  });

  it('cresce junto com o progresso', () => {
    let previous = 0;
    for (let step = 0; step <= 10; step += 1) {
      const count = visibleBlockCount(18, step / 10);
      expect(count).toBeGreaterThanOrEqual(previous);
      previous = count;
    }
  });

  it('nunca passa do total de blocos', () => {
    expect(visibleBlockCount(18, 1.5)).toBe(18);
    expect(visibleBlockCount(18, -1)).toBe(0);
  });
});
