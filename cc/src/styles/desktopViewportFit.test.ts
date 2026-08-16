/// <reference types="node" />
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const css = readFileSync(resolve(process.cwd(), 'src/styles/global.css'), 'utf8');

function rule(selector: string): string {
  const start = css.indexOf(`${selector} {`);
  if (start === -1) {
    return '';
  }

  const end = css.indexOf('\n}', start);
  return end === -1 ? css.slice(start) : css.slice(start, end);
}

describe('desktop gameplay viewport fit', () => {
  it('provides a viewport height fallback for the gameplay shell', () => {
    const levelRule = rule('.level');

    expect(levelRule).toContain('min-height: 100vh;');
    expect(levelRule).toContain('min-height: 100dvh;');
  });

  it('keeps the stage and panel shrinkable while allowing panel scrolling', () => {
    expect(rule('.level__stage')).toContain('min-height: 0;');

    const panelRule = rule('.level__panel');
    expect(panelRule).toContain('min-height: 0;');
    expect(panelRule).toContain('overflow-y: auto;');
  });

  it('bounds the desktop scene using the 5:3 viewBox proportion', () => {
    const sceneRule = rule('.level__stage .scene');

    expect(sceneRule).toContain('aspect-ratio: 5 / 3;');
    expect(sceneRule).toContain('width: min(100%, var(--level-scene-width-limit));');
    expect(css).toContain('--level-scene-width-limit: 66.6667vh;');
    expect(css).toContain('--level-scene-width-limit: 66.6667dvh;');
  });
});
