/// <reference types="node" />
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const css = readFileSync(resolve(process.cwd(), 'src/styles/global.css'), 'utf8');

describe('interface background', () => {
  it('carries the design system token block verbatim', () => {
    expect(css).toContain('--bg: #ffffff;');
    expect(css).toContain('--surface: #f7f7f7;');
    expect(css).toContain('--fg: #3c3c3c;');
    expect(css).toContain('--accent: #58cc02;');
    expect(css).toContain('--elev-raised: 0 4px 0 #d7d7d7;');
    expect(css).toContain('--ease-standard: cubic-bezier(0.34, 1.56, 0.64, 1);');
  });

  it('uses the untinted Snow canvas on the shell', () => {
    expect(css).toContain('background: var(--bg);');
    expect(css).toContain('color: var(--fg);');
    // O canvas nunca e tingido: a grade azul-marinho anterior foi removida.
    expect(css).not.toContain('--color-bg-grid');
    expect(css).not.toContain('background-size: 52px 52px;');
  });

  it('bridges the legacy screen tokens onto the Snow canvas', () => {
    expect(css).toContain('--color-bg: var(--bg);');
    expect(css).toContain('--color-text-on-dark: var(--fg);');
    expect(css).toContain('--color-text-soft-on-dark: var(--muted);');
  });
});
