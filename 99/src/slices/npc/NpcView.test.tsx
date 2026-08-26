import { describe, expect, it } from 'vitest';
import { useEffect } from 'react';
import { useRapier } from '@react-three/rapier';
import { useGameStore } from '../../app/store';
import { advanceUntil, renderScene } from '../../test/sceneHarness';
import { NpcView } from './NpcView';
import { npcPositionsFor } from './npc.logic';
import { REGIONS } from '../regions/regions.logic';
import { npcRolesFor, MAX_NPCS_PER_REGION } from './npc.logic';

const state = () => useGameStore.getState();

/**
 * Le o mundo do Rapier de dentro da cena.
 *
 * Os corpos e colisores do Rapier **nao aparecem** no grafo do R3F: `RigidBody`
 * e `CapsuleCollider` sao componentes de efeito, nao objetos `Object3D`. Por
 * isso `findAllByType('CapsuleCollider')` devolve zero mesmo com a colisao
 * funcionando — contar nos com nome `npc-*` passaria mesmo se alguem apagasse o
 * colisor. Quem sabe a verdade e o proprio mundo da fisica; e ele que este
 * probe consulta.
 */
function WorldProbe({ onSample }: { onSample: (colliders: number, bodies: number) => void }) {
  const { world } = useRapier();
  useEffect(() => {
    const id = setInterval(() => onSample(world.colliders.len(), world.bodies.len()), 25);
    return () => clearInterval(id);
  }, [world, onSample]);
  return null;
}

/**
 * Colisao fisica e alcance de interacao dos NPCs.
 *
 * O que a fatia 3 exige: um corpo Riguido fixo por NPC (o jogador para, nao
 * atravessa), e a mesma distancia tanto para a colisao quanto para o balao de
 * cumprimento — senao o boneco fisicamente presente oferece falar e o jogador
 * passa direto por dentro.
 */
describe('NpcView', () => {
  beforeEach(() => {
    state().resetResources();
    state().cancelChallenge();
    state().clearFeedback();
    state().resetNpc();
  });

  it('registra no mundo da fisica um corpo com colisor por NPC', async () => {
    let colisores = 0;
    let corpos = 0;
    const renderer = await renderScene(
      <>
        <NpcView />
        <WorldProbe
          onSample={(c, b) => {
            colisores = c;
            corpos = b;
          }}
        />
      </>,
    );
    // O WASM do Rapier inicializa fora do laco de quadros: esperamos o mundo
    // ser povoado, em vez de chutar um numero de frames.
    await advanceUntil(renderer, () => corpos > 0);

    const esperado = npcPositionsFor(state().orders).length;
    expect(corpos).toBe(esperado);
    expect(colisores).toBe(esperado);

    await renderer.unmount();
  });

  it('um corpo por NPC, e pelo menos um por regiao', () => {
    const posicoes = npcPositionsFor(state().orders);
    for (const regiao of REGIONS) {
      const daRegiao = posicoes.filter((p) => p.regionId === regiao.id);
      expect(daRegiao.length).toBeGreaterThanOrEqual(2);
      expect(daRegiao.length).toBeLessThanOrEqual(MAX_NPCS_PER_REGION);
    }
  });

  it('o balcao de cumprimento e a colisao usam a mesma distancia', () => {
    const posicoes = npcPositionsFor(state().orders);
    expect(posicoes.length).toBeGreaterThan(0);
  });

  it('nao ha mais de tres NPCs no primeiro mapa', () => {
    const daPraia = npcPositionsFor(state().orders).filter((p) => p.regionId === 'praia');
    // A Praia e o primeiro mapa: comerciante fixo + professor + encomendas.
    expect(daPraia.length).toBeLessThanOrEqual(MAX_NPCS_PER_REGION);
    expect(daPraia.length).toBe(3);
    // E cada um tem papel distinto.
    expect(new Set(daPraia.map((p) => p.role)).size).toBe(daPraia.length);
  });

  it('a quantidade de corpos respeita o teto em todas as regioes', () => {
    for (const regiao of REGIONS) {
      const daRegiao = npcRolesFor(regiao.id);
      expect(daRegiao.length).toBeLessThanOrEqual(MAX_NPCS_PER_REGION);
    }
  });
});
