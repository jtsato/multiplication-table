// @vitest-environment jsdom
import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import '@testing-library/jest-dom/vitest';
import { resetPlayerTransform } from '../player/playerTransform';
import { Minimapa } from './Minimapa';

describe('Minimapa', () => {
  beforeEach(() => {
    resetPlayerTransform();
  });

  it('mostra as seis regiões e o ponto do jogador', () => {
    const { container } = render(<Minimapa />);

    expect(screen.getByRole('img', { name: 'Mapa da ilha' })).toBeInTheDocument();
    for (const nome of ['Praia', 'Porto', 'Bosque', 'Cachoeira', 'Pomar', 'Pico']) {
      expect(screen.getByText(nome)).toBeInTheDocument();
    }
    expect(container.querySelector('.minimap__player')).not.toBeNull();
  });
});
