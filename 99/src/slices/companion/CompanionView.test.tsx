// @vitest-environment jsdom
import { beforeEach, describe, expect, it } from 'vitest';
import { useGameStore } from '../../app/store';
import { renderScene } from '../../test/sceneHarness';
import { resetPlayerTransform } from '../player/playerTransform';
import { CompanionView } from './CompanionView';
import { petTransform, resetPetTransform } from './petTransform';
import { PET, petAnchor } from './companion.logic';

const state = () => useGameStore.getState();

describe('CompanionView', () => {
  beforeEach(() => {
    state().resetCompanion();
    resetPlayerTransform();
    resetPetTransform();
  });

  it('sem pet, nao desenha nada', async () => {
    const renderer = await renderScene(<CompanionView />);
    await renderer.advanceFrames(2, 1 / 60);

    expect(renderer.scene.findAllByType('Mesh')).toHaveLength(0);

    await renderer.unmount();
  });

  it('com pet, o bicho aparece e converge para o ponto atras do jogador', async () => {
    useGameStore.setState({ pet: 'cachorro' });
    // Jogador na origem; pet comeca longe.
    petTransform.x = -10;
    petTransform.z = -10;

    const renderer = await renderScene(<CompanionView />);
    // Avanca o suficiente para o pet atravessar os 14 m ate a ancora.
    await renderer.advanceFrames(240, 1 / 60);

    expect(renderer.scene.findAllByType('Mesh').length).toBeGreaterThan(0);

    const ancora = petAnchor({ x: 0, y: 0, z: 0 }, 0);
    const distancia = Math.hypot(petTransform.x - ancora.x, petTransform.z - ancora.z);
    expect(distancia).toBeLessThan(PET.speed / 10);

    await renderer.unmount();
  });
});
