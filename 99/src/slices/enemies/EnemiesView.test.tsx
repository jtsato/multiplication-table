// @vitest-environment jsdom
import { beforeEach, describe, expect, it } from 'vitest';
import { useGameStore } from '../../app/store';
import { renderScene } from '../../test/sceneHarness';
import { BUILDING, type Structure } from '../building/building.logic';
import { dayNightClock, resetDayNightClock } from '../daynight/dayNightClock';
import { DAYNIGHT, PHASE_BOUNDS } from '../daynight/daynight.logic';
import { playerTransform, resetPlayerTransform } from '../player';
import { EnemiesView } from './EnemiesView';
import { ENEMIES } from './enemies.logic';

const state = () => useGameStore.getState();

/** Coloca o relogio do jogo numa fracao do ciclo. */
function relogioEm(fracao: number) {
  dayNightClock.seconds = fracao * DAYNIGHT.cycleSeconds;
}

const meioDaNoite = (PHASE_BOUNDS.noite.start + PHASE_BOUNDS.noite.end) / 2;
const meioDoAmanhecer = (PHASE_BOUNDS.amanhecer.start + 1) / 2;

function fogueiraEm(x: number, z: number, acesa = true): Structure {
  return {
    id: `fogueira-teste-${x}-${z}`,
    kind: 'fogueira',
    position: { x, y: 0, z },
    rotation: 0,
    fuelUntil: acesa ? dayNightClock.seconds + BUILDING.fireFuelSeconds : 0,
  };
}

/**
 * Distância do inimigo mais próximo até o jogador.
 *
 * Filtra pelo nome `inimigo`: o corpo de cada vulto tem um `group` interno na
 * origem local, que sem o filtro entraria na conta como distância zero.
 */
function distanciaAoJogador(renderer: Awaited<ReturnType<typeof renderScene>>) {
  const vultos = renderer.scene.findAllByType('Group').filter((g) => g.instance.name === 'inimigo');

  expect(vultos.length).toBeGreaterThan(0);

  return Math.min(
    ...vultos.map((g) =>
      Math.hypot(
        g.instance.position.x - playerTransform.x,
        g.instance.position.z - playerTransform.z,
      ),
    ),
  );
}

describe('EnemiesView', () => {
  beforeEach(() => {
    resetDayNightClock();
    resetPlayerTransform();
    state().resetSurvival();
    state().resetBuilding();
    state().resetClock();
  });

  it('nao traz inimigo nenhum durante o dia', async () => {
    relogioEm(0.25);
    const renderer = await renderScene(<EnemiesView />);
    await renderer.advanceFrames(10, 1 / 60);

    expect(state().enemies).toHaveLength(0);

    await renderer.unmount();
  });

  it('faz surgir a leva da noite na virada da fase', async () => {
    relogioEm(0.25);
    const renderer = await renderScene(<EnemiesView />);
    await renderer.advanceFrames(2, 1 / 60);
    expect(state().enemies).toHaveLength(0);

    relogioEm(meioDaNoite);
    await renderer.advanceFrames(2, 1 / 60);

    expect(state().enemies).toHaveLength(ENEMIES.perNight);
    expect(state().survivedNight).toBe(true);

    await renderer.unmount();
  });

  it('nao acumula levas se a fase for publicada de novo', async () => {
    relogioEm(0.25);
    const renderer = await renderScene(<EnemiesView />);
    await renderer.advanceFrames(2, 1 / 60);

    relogioEm(meioDaNoite);
    await renderer.advanceFrames(2, 1 / 60);
    state().spawnNightEnemies();
    state().spawnNightEnemies();

    expect(state().enemies).toHaveLength(ENEMIES.perNight);

    await renderer.unmount();
  });

  it('persegue o jogador de fato', async () => {
    relogioEm(0.25);
    const renderer = await renderScene(<EnemiesView />);
    await renderer.advanceFrames(2, 1 / 60);
    relogioEm(meioDaNoite);
    await renderer.advanceFrames(2, 1 / 60);

    const antes = distanciaAoJogador(renderer);
    await renderer.advanceFrames(60, 0.05);
    const depois = distanciaAoJogador(renderer);

    expect(depois).toBeLessThan(antes);

    await renderer.unmount();
  });

  it('a fogueira acesa mantem os inimigos afastados', async () => {
    relogioEm(0.25);
    const renderer = await renderScene(<EnemiesView />);
    await renderer.advanceFrames(2, 1 / 60);

    relogioEm(meioDaNoite);
    // Fogueira em cima do jogador: nenhum inimigo deve conseguir encostar.
    useGameStore.setState({ structures: [fogueiraEm(0, 0)] });
    await renderer.advanceFrames(2, 1 / 60);

    await renderer.advanceFrames(200, 0.05);

    expect(distanciaAoJogador(renderer)).toBeGreaterThan(BUILDING.fireSafeRadius - 1);
    expect(state().health).toBe(ENEMIES.maxHealth);

    await renderer.unmount();
  });

  it('uma fogueira apagada nao protege mais', async () => {
    relogioEm(0.25);
    const renderer = await renderScene(<EnemiesView />);
    await renderer.advanceFrames(2, 1 / 60);

    relogioEm(meioDaNoite);
    useGameStore.setState({ structures: [fogueiraEm(0, 0, false)] });
    await renderer.advanceFrames(2, 1 / 60);

    await renderer.advanceFrames(200, 0.05);

    expect(state().health).toBeLessThan(ENEMIES.maxHealth);

    await renderer.unmount();
  });

  it('a cerca barra os inimigos de verdade', async () => {
    relogioEm(0.25);
    const renderer = await renderScene(<EnemiesView />);
    await renderer.advanceFrames(2, 1 / 60);

    relogioEm(meioDaNoite);
    await renderer.advanceFrames(2, 1 / 60);

    /**
     * Cerca o jogador com um anel de cercas.
     *
     * Os inimigos nao sao corpos do Rapier — andam por posicao —, entao o
     * colisor da cerca nao os detem sozinho. Este teste existe porque, sem o
     * teste de segmento em `stepAvoidingFences`, eles passavam direto pela
     * cerca: a construcao prometia uma defesa que nao entregava.
     */
    const anel: Structure[] = Array.from({ length: 12 }, (_, i) => {
      const angulo = (i / 12) * Math.PI * 2;
      const raio = 2.6;
      return {
        id: `cerca-anel-${i}`,
        kind: 'cerca',
        position: { x: Math.cos(angulo) * raio, y: 0, z: Math.sin(angulo) * raio },
        // Tangente ao circulo, para os segmentos fecharem o cerco.
        rotation: -angulo + Math.PI / 2,
        fuelUntil: 0,
      };
    });
    useGameStore.setState({ structures: anel });
    await renderer.advanceFrames(2, 1 / 60);

    // Tempo de sobra para atravessar a ilha inteira, se conseguissem.
    await renderer.advanceFrames(300, 0.05);

    // Nenhum inimigo entrou no cercado, entao ninguem encostou no jogador.
    expect(distanciaAoJogador(renderer)).toBeGreaterThan(2);
    expect(state().health).toBe(ENEMIES.maxHealth);

    await renderer.unmount();
  });

  it('sem cerca, os inimigos chegam ate o jogador', async () => {
    relogioEm(0.25);
    const renderer = await renderScene(<EnemiesView />);
    await renderer.advanceFrames(2, 1 / 60);
    relogioEm(meioDaNoite);
    await renderer.advanceFrames(2, 1 / 60);

    await renderer.advanceFrames(300, 0.05);

    // Contraprova do teste acima: sem a cerca, eles encostam.
    expect(distanciaAoJogador(renderer)).toBeLessThan(2);

    await renderer.unmount();
  });

  it('tira vida no contato e leva a derrota se nada barrar', async () => {
    relogioEm(0.25);
    const renderer = await renderScene(<EnemiesView />);
    await renderer.advanceFrames(2, 1 / 60);
    relogioEm(meioDaNoite);
    await renderer.advanceFrames(2, 1 / 60);

    // Tempo mais que suficiente para alcancar e drenar a vida inteira.
    for (let i = 0; i < 400; i += 1) {
      dayNightClock.seconds += 0.05;
      await renderer.advanceFrames(1, 0.05);
    }

    expect(state().health).toBe(0);
    expect(state().outcome).toBe('perdeu');

    await renderer.unmount();
  });

  it('vence ao amanhecer depois de atravessar a noite', async () => {
    relogioEm(0.25);
    const renderer = await renderScene(<EnemiesView />);
    await renderer.advanceFrames(2, 1 / 60);

    relogioEm(meioDaNoite);
    await renderer.advanceFrames(2, 1 / 60);
    expect(state().enemies.length).toBeGreaterThan(0);

    // Sobrevive: teleporta para longe e chega o amanhecer.
    relogioEm(meioDoAmanhecer);
    await renderer.advanceFrames(2, 1 / 60);

    expect(state().outcome).toBe('venceu');
    expect(state().enemies).toHaveLength(0);

    await renderer.unmount();
  });

  it('nao vence no amanhecer sem ter passado pela noite', async () => {
    relogioEm(meioDoAmanhecer);
    const renderer = await renderScene(<EnemiesView />);
    await renderer.advanceFrames(4, 1 / 60);

    expect(state().survivedNight).toBe(false);
    expect(state().outcome).toBe('jogando');

    await renderer.unmount();
  });

  it('congela a simulacao depois do desfecho', async () => {
    relogioEm(0.25);
    const renderer = await renderScene(<EnemiesView />);
    await renderer.advanceFrames(2, 1 / 60);
    relogioEm(meioDaNoite);
    await renderer.advanceFrames(2, 1 / 60);

    useGameStore.setState({ health: 0, outcome: 'perdeu' });
    const congelado = distanciaAoJogador(renderer);
    await renderer.advanceFrames(60, 0.05);

    expect(distanciaAoJogador(renderer)).toBeCloseTo(congelado, 5);

    await renderer.unmount();
  });
});
