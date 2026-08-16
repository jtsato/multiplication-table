// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { createDefaultState } from '../domain/defaultState';
import { I18nProvider } from '../i18n/I18nProvider';
import { SceneView } from './SceneView';

const palette = {
  skyTop: '#bfe7ff',
  skyBottom: '#f2fbff',
  groundTop: '#8fd14f',
  groundMid: '#6db83f',
  groundDeep: '#4e8e34',
  water: '#62c3e8',
  waterDeep: '#3d9ac2',
  block: '#ffd23f',
  blockLight: '#fff1a8',
  blockDark: '#b98208',
  accent: '#ffd23f',
  accentSoft: '#fff1a8',
};

describe('SceneView hero interaction', () => {
  it('faz o herói acenar e coloca o companheiro em waving', async () => {
    const user = userEvent.setup();
    const { container } = render(
      <I18nProvider locale="en-US">
        <SceneView
          scene="bridge"
          palette={palette}
          decor={['tree', 'flower']}
          progress={0}
          avatar={createDefaultState('en-US').player.avatar}
          mascotId="bloco"
        />
      </I18nProvider>,
    );

    await user.click(screen.getByRole('button', { name: 'Tap to wave' }));
    expect(container.querySelector('.scene__hero--waving')).toBeInTheDocument();
    expect(container.querySelector('.mascot--waving')).toBeInTheDocument();
  });

  it('exposes the scene as a group and preserves the interactive hero', () => {
    render(
      <I18nProvider locale="en-US">
        <SceneView
          scene="bridge"
          palette={palette}
          decor={['tree']}
          progress={0}
          avatar={createDefaultState('en-US').player.avatar}
          mascotId="bloco"
          ariaLabel="Construction progress: 0 percent"
        />
      </I18nProvider>,
    );

    expect(
      screen.getByRole('group', { name: 'Construction progress: 0 percent' }),
    ).toBeInTheDocument();
    expect(screen.queryByRole('img')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Tap to wave' })).toBeInTheDocument();
  });
});
