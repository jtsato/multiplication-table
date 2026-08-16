// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { render } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { createDefaultState } from '../domain/defaultState';
import { I18nProvider } from '../i18n/I18nProvider';
import { IslandCompleteScreen } from './IslandCompleteScreen';

describe('IslandCompleteScreen celebration', () => {
  it('renderiza papel picado colorido na conclusão da ilha', () => {
    const state = createDefaultState('en-US');
    const { container } = render(
      <I18nProvider locale="en-US">
        <IslandCompleteScreen
          state={state}
          table={2}
          unlockedTable={3}
          onBackToMap={vi.fn()}
        />
      </I18nProvider>,
    );

    const pieces = Array.from(container.querySelectorAll('.confetti'));
    expect(pieces.length).toBeGreaterThanOrEqual(24);
    expect(container.querySelector('.confetti--strip')).toBeInTheDocument();
    expect(container.querySelector('.confetti--dot')).toBeInTheDocument();
    expect(container.querySelector('.confetti--square')).toBeInTheDocument();
    expect(container.querySelector('.mascot--cheering')).toBeInTheDocument();
    expect(pieces.every((piece) => piece.getAttribute('aria-hidden') === 'true')).toBe(true);
  });
});
