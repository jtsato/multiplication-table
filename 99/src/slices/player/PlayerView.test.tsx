// @vitest-environment jsdom
// PlayerView escuta teclado e ponteiro em `window`; sem DOM os efeitos lancam.
import { useEffect } from 'react';
import { useThree } from '@react-three/fiber';
import { beforeEach, describe, expect, it } from 'vitest';
import type { Camera } from 'three';
import { advanceUntil, renderScene } from '../../test/sceneHarness';
import { PlayerView } from './PlayerView';
import { followCameraTarget } from './player.logic';
import { playerTransform, resetPlayerTransform } from './playerTransform';
import { useGameStore } from '../../app/store';
import { vec3 } from '../../shared/vec';

/** Captura a camera do R3F para o teste poder inspecionar a suavizacao. */
function CameraProbe({ onReady }: { onReady: (camera: Camera) => void }) {
  const camera = useThree((state) => state.camera);
  // Chaves obrigatorias: um retorno implicito faria o React tratar o valor
  // devolvido como funcao de limpeza.
  useEffect(() => {
    onReady(camera);
  }, [camera, onReady]);
  return null;
}

/**
 * Verifica a fiacao do laco de quadro, que os testes de funcao pura nao alcancam:
 * que `useFrame` roda, que a posicao do corpo chega em `playerTransform` e que a
 * camera converge para o alvo calculado.
 *
 * A fisica fica pausada no harness, entao o corpo permanece no ponto de spawn —
 * o que aqui e uma vantagem: da um alvo conhecido para conferir a camera.
 */
describe('PlayerView', () => {
  beforeEach(() => {
    resetPlayerTransform();
  });

  it('publica a posicao do corpo em playerTransform a cada quadro', async () => {
    const renderer = await renderScene(<PlayerView />);
    // Espera o corpo do Rapier existir, em vez de apostar em dois quadros: o
    // `useFrame` sai cedo enquanto `bodyRef` esta vazio, e a posicao ficaria no
    // zero do `resetPlayerTransform`. Era assim que este teste falhava no CI e
    // passava aqui.
    await advanceUntil(renderer, () => playerTransform.y !== 0);

    // Spawn definido em PlayerView: [0, 2, 0].
    expect(playerTransform.y).toBeCloseTo(2, 1);
    expect(playerTransform.x).toBeCloseTo(0, 5);
    expect(playerTransform.z).toBeCloseTo(0, 5);
    expect(playerTransform.yaw).toBe(0);

    await renderer.unmount();
  });

  it('converge a camera para a posicao de seguimento', async () => {
    let camera: Camera | null = null;
    const renderer = await renderScene(
      <>
        <CameraProbe
          onReady={(instance) => {
            camera = instance;
          }}
        />
        <PlayerView />
      </>,
    );

    // O alvo da camera e derivado de `playerTransform`, entao o corpo precisa
    // existir antes de a convergencia comecar a valer.
    await advanceUntil(renderer, () => playerTransform.y !== 0);
    // Suavizacao exponencial: tres segundos de quadros levam a camera ao alvo.
    await renderer.advanceFrames(180, 1 / 60);

    const expected = followCameraTarget(vec3(0, 2, 0), 0);
    const actual = camera as Camera | null;
    expect(actual).not.toBeNull();
    expect(actual!.position.x).toBeCloseTo(expected.x, 1);
    expect(actual!.position.y).toBeCloseTo(expected.y, 1);
    expect(actual!.position.z).toBeCloseTo(expected.z, 1);

    await renderer.unmount();
  });

  it('aplica o zoom na distancia da camera', async () => {
    let camera: Camera | null = null;
    const renderer = await renderScene(
      <>
        <CameraProbe
          onReady={(instance) => {
            camera = instance;
          }}
        />
        <PlayerView />
      </>,
    );

    await advanceUntil(renderer, () => playerTransform.y !== 0);
    await renderer.advanceFrames(180, 1 / 60);

    const base = followCameraTarget(vec3(0, 2, 0), 0);
    const zoomed = followCameraTarget(vec3(0, 2, 0), 0, 11 * 1.8);

    // Sem zoom, a camera fica a distancia base.
    expect(camera!.position.x).toBeCloseTo(base.x, 1);
    expect(camera!.position.z).toBeCloseTo(base.z, 1);

    // Zoom maximo afasta a camera do jogador.
    useGameStore.getState().setCameraZoom(1.8);
    await renderer.advanceFrames(180, 1 / 60);

    expect(camera!.position.x).toBeCloseTo(zoomed.x, 1);
    expect(camera!.position.z).toBeCloseTo(zoomed.z, 1);
    expect(camera!.position.z).toBeGreaterThan(base.z);

    await renderer.unmount();
  });
});
