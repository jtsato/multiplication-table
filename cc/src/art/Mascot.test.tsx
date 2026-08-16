// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Mascot } from './Mascot';

const palette = { accent: '#8fd14f', accentSoft: '#d9f2b4', blockDark: '#41642d' };

describe('Mascot moods', () => {
  it.each(['happy', 'waving', 'cheering'] as const)('aplica a classe do humor %s', (mood) => {
    const { container } = render(<Mascot palette={palette} mood={mood} />);
    expect(container.querySelector(`.mascot--${mood}`)).toBeInTheDocument();
  });

  it('renderiza o sorriso e os braços expressivos no estado feliz', () => {
    const { container } = render(<Mascot palette={palette} mood="happy" />);
    expect(container.querySelector('.mascot__smile')).toBeInTheDocument();
    expect(container.querySelector('.mascot__arms')).toBeInTheDocument();
  });

  it('renderiza a variação de aceno e o destaque da comemoração', () => {
    const waving = render(<Mascot palette={palette} mood="waving" />);
    expect(waving.container.querySelector('.mascot__arm--waving')).toBeInTheDocument();
    waving.unmount();

    const cheering = render(<Mascot palette={palette} mood="cheering" />);
    expect(cheering.container.querySelector('.mascot__sparkles')).toBeInTheDocument();
  });
});
