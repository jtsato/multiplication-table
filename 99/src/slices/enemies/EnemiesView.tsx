import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import type { Group } from 'three';
import { useGameStore } from '../../app/store';
import { palette } from '../../shared/palette';
import { vec3, type Vec3 } from '../../shared/vec';
import { isLit } from '../building/building.logic';
import { dayNightClock } from '../daynight/dayNightClock';
import { cyclePosition, phaseFor } from '../daynight/daynight.logic';
import { playerTransform } from '../player';
import {
  ENEMIES,
  applyContactDamage,
  evaluateOutcome,
  fireThreatening,
  isTouching,
  stepAvoidingFences,
  stepAway,
} from './enemies.logic';

/** Vulto low poly: corpo escuro e dois olhos que denunciam a aproximacao. */
function EnemyBody() {
  return (
    <group>
      <mesh position={[0, 0.6, 0]} castShadow>
        <octahedronGeometry args={[0.62, 0]} />
        <meshLambertMaterial color={palette.enemy} flatShading />
      </mesh>
      {[-0.2, 0.2].map((offset) => (
        <mesh key={offset} position={[offset, 0.78, 0.42]}>
          <sphereGeometry args={[0.09, 6, 6]} />
          <meshBasicMaterial color={palette.enemyEye} />
        </mesh>
      ))}
    </group>
  );
}

/**
 * Inimigos, sobrevivencia e desfecho da partida.
 *
 * As posicoes vivas ficam num array de refs, nunca no store: elas mudam todo
 * quadro. O store guarda so o que muda raramente — vida, desfecho e a lista de
 * inimigos da noite.
 *
 * Os inimigos nao sao corpos do Rapier. Sao cinematicos por posicao: para cinco
 * vultos que andam em linha reta, o solver nao acrescentaria nada e cobraria
 * caro. O preco dessa escolha e que o colisor da cerca nao os detem sozinho —
 * quem faz isso e `stepAvoidingFences`, com teste de segmento.
 */
export function EnemiesView() {
  const enemies = useGameStore((state) => state.enemies);
  const groupsRef = useRef<(Group | null)[]>([]);
  const lastHitRef = useRef(-Infinity);
  const lastPhaseRef = useRef(phaseFor(0));

  /**
   * Posicao viva de cada inimigo.
   *
   * Guardada num ref, e nao num `useMemo`: o valor e mutado a cada quadro, e
   * mutar o resultado de um memo quebra as garantias do React (o compilador
   * pode descarta-lo e recalcular a qualquer momento). A lista e ressincronizada
   * dentro do proprio laco quando a leva da noite muda.
   */
  const liveRef = useRef<{ id: string; position: Vec3 }[]>([]);

  useFrame((_, rawDelta) => {
    const delta = Math.min(rawDelta, 0.05);
    const now = dayNightClock.seconds;
    const state = useGameStore.getState();
    const phase = phaseFor(cyclePosition(now));

    // Virada de fase: a noite traz a leva, o amanhecer limpa o que sobrou.
    if (phase !== lastPhaseRef.current) {
      lastPhaseRef.current = phase;
      if (phase === 'noite') state.spawnNightEnemies();
      if (phase === 'amanhecer') state.clearEnemies();
    }

    if (state.outcome !== 'jogando') return;

    // Ressincroniza quando a leva muda (nova noite, ou amanhecer que limpou).
    const live = liveRef.current;
    if (live.length !== state.enemies.length || live.some((e, i) => e.id !== state.enemies[i].id)) {
      liveRef.current = state.enemies.map((enemy) => ({
        id: enemy.id,
        position: vec3(enemy.position.x, enemy.position.y, enemy.position.z),
      }));
    }

    // Só fogueiras acesas afugentam — uma que ficou sem lenha não protege mais.
    const litFires = state.structures.filter((structure) => isLit(structure, now));

    let health = state.health;

    for (let index = 0; index < liveRef.current.length; index += 1) {
      const current = liveRef.current[index].position;
      const threat = fireThreatening(current, litFires);

      const next = threat
        ? stepAway(current, threat.position, ENEMIES.retreatSpeed, delta)
        : stepAvoidingFences(current, playerTransform, ENEMIES.speed, delta, state.structures);

      current.x = next.x;
      current.z = next.z;

      const group = groupsRef.current[index];
      if (group) {
        group.position.set(current.x, current.y, current.z);
        // Encara o jogador; o modelo tem os olhos em +Z.
        group.rotation.y = Math.atan2(playerTransform.x - current.x, playerTransform.z - current.z);
      }

      if (!threat && isTouching(current, playerTransform)) {
        const hit = applyContactDamage(health, now, lastHitRef.current);
        if (hit.applied) {
          health = hit.health;
          lastHitRef.current = hit.lastHitAt;
        }
      }
    }

    if (health !== state.health) state.setHealth(health);

    state.setOutcome(evaluateOutcome(health, phase, state.survivedNight));
  });

  return (
    <>
      {enemies.map((enemy, index) => (
        <group
          key={enemy.id}
          // Nomeado para distinguir do `group` interno do corpo, que fica na
          // origem local — sem isto nao da para localizar o inimigo na cena.
          name="inimigo"
          ref={(instance) => {
            groupsRef.current[index] = instance;
          }}
          position={[enemy.position.x, enemy.position.y, enemy.position.z]}
        >
          <EnemyBody />
        </group>
      ))}
    </>
  );
}
