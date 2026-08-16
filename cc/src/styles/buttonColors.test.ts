/// <reference types="node" />
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const css = readFileSync(resolve(process.cwd(), 'src/styles/global.css'), 'utf8');

describe('button color system', () => {
  it.each([
    // Primario: Owl Green vivo com tinta Eel Black (5,3:1).
    ['--button-primary-bg', 'var(--accent)'],
    ['--button-primary-text', 'var(--fg)'],
    // Secundario: recipe "Streak" em Bee Yellow (7,1:1).
    ['--button-secondary-bg', 'var(--warn)'],
    ['--button-secondary-text', 'var(--fg)'],
    // Ghost: recipe "Secondary" branco com borda grossa.
    ['--button-ghost-bg', 'var(--bg)'],
    ['--button-ghost-text', 'var(--fg)'],
    // Perigo: recipe "Error" a partir do Cardinal Red Deep (4,9:1).
    ['--button-danger-bg', 'var(--danger-deep)'],
    ['--button-danger-text', '#ffffff'],
  ])('maps %s to the design token %s', (token, value) => {
    expect(css).toContain(`${token}: ${value};`);
  });

  it.each([
    '.btn--primary:hover:not(:disabled)',
    '.btn--primary:active:not(:disabled)',
    '.btn--secondary:hover:not(:disabled)',
    '.btn--ghost:active:not(:disabled)',
    '.btn--danger:active:not(:disabled)',
  ])('defines the interaction selector %s', (selector) => {
    expect(css).toContain(selector);
  });

  it('presses buttons 4px down and collapses the chunky shadow on active', () => {
    expect(css).toContain('transform: translateY(4px);');
    expect(css).toContain('box-shadow: 0 0 0 var(--button-primary-shadow);');
  });

  it('keeps the background stable on active so no state loses contrast', () => {
    const activeBlock = css.slice(
      css.indexOf('.btn--primary:active:not(:disabled) {'),
      css.indexOf('.btn--secondary:active:not(:disabled) {'),
    );

    expect(activeBlock).not.toContain('background');
  });
});
