import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const css = readFileSync(resolve(process.cwd(), 'src/styles/global.css'), 'utf8');

describe('button color system', () => {
  it.each([
    ['--button-primary-bg', '#f5b82e'],
    ['--button-primary-text', '#172b4d'],
    ['--button-secondary-bg', '#fff4c2'],
    ['--button-secondary-text', '#3d2b00'],
    ['--button-ghost-bg', '#e8f3ff'],
    ['--button-ghost-text', '#174a78'],
    ['--button-danger-bg', '#e9665a'],
    ['--button-danger-text', '#431a1e'],
  ])('defines %s as %s', (token, value) => {
    expect(css).toContain(`${token}: ${value};`);
  });

  it.each([
    '.btn--primary:hover',
    '.btn--primary:active',
    '.btn--secondary:hover',
    '.btn--ghost:active',
    '.btn--danger:active',
  ])('defines the interaction selector %s', (selector) => {
    expect(css).toContain(selector);
  });
});
