// @vitest-environment jsdom

import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { ISLANDS } from '../domain/islands';
import { IslandBadge } from './IslandBadge';

describe('IslandBadge landmarks', () => {
  it('renders a distinct landmark for every island biome', () => {
    for (const island of ISLANDS) {
      const { container, unmount } = render(
        <IslandBadge biome={island.biome} palette={island.palette} status="available" />,
      );

      expect(container.querySelector(`[data-landmark="${island.biome}"]`)).not.toBeNull();
      unmount();
    }
  });

  it('keeps the lock overlay for locked islands', () => {
    const { container } = render(
      <IslandBadge biome="forest" palette={ISLANDS[1]!.palette} status="locked" />,
    );

    expect(container.querySelector('[data-landmark="forest"]')).not.toBeNull();
    expect(container.querySelector('.island-badge--locked')).not.toBeNull();
    expect(container.querySelector('rect[fill="#1c2333"]')).not.toBeNull();
  });

  it('keeps a completion accent for completed islands', () => {
    const { container } = render(
      <IslandBadge biome="city" palette={ISLANDS[8]!.palette} status="completed" />,
    );

    expect(container.querySelector('[data-landmark="city"]')).not.toBeNull();
    expect(container.querySelector('[data-completion-accent]')).not.toBeNull();
  });

  it('preserves the legacy badge when no biome is provided', () => {
    const { container } = render(<IslandBadge palette={ISLANDS[8]!.palette} status="completed" />);

    expect(container.querySelector('[data-landmark]')).toBeNull();
    expect(container.querySelector('[data-completion-accent]')).toBeNull();
  });
});
