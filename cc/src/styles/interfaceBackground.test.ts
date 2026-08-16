/// <reference types="node" />
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const css = readFileSync(resolve(process.cwd(), 'src/styles/global.css'), 'utf8');

describe('interface background', () => {
  it('defines the navy grid tokens', () => {
    expect(css).toContain('--color-bg: #172f6b;');
    expect(css).toContain('--color-bg-grid: rgba(255, 255, 255, 0.08);');
    expect(css).toContain('--color-text-on-dark: #f4f7ff;');
    expect(css).toContain('--color-text-soft-on-dark: #cbd8f5;');
  });

  it('applies a static 52 pixel grid to the body shell', () => {
    expect(css).toContain('background-color: var(--color-bg);');
    expect(css).toContain(
      'linear-gradient(var(--color-bg-grid) 1px, transparent 1px)',
    );
    expect(css).toContain(
      'linear-gradient(90deg, var(--color-bg-grid) 1px, transparent 1px)',
    );
    expect(css).toContain('background-size: 52px 52px;');
  });
});
