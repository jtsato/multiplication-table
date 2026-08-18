import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import type { Mesh, PointLight } from 'three';
import { useGameStore } from '../../app/store';
import { palette } from '../../shared/palette';
import { createRng } from '../../shared/rng';
import { dayNightClock } from '../daynight/dayNightClock';
import { phaseFor, cyclePosition } from '../daynight/daynight.logic';
import { playerTransform } from '../player/playerTransform';
import { FIREFLY, createSwarms, firefliesAreOut, motePosition, swarmSeed } from './fireflies.logic';

/**
 * Os enxames de vaga-lumes.
 *
 * A unica recarga de lanterna que nao cobra nada fora de casa: encostar enche a
 * luz, sem conta e sem moeda. Existem para quebrar uma dependencia circular — se
 * recarregar exigisse voltar a fogueira, a crianca sem carga teria que atravessar
 * o escuro para poder enxergar no escuro.
 *
 * Nada aqui passa pelo React por quadro: a fase vem do relogio vivo e a posicao
 * do jogador do `playerTransform`, os dois lidos dentro do `useFrame`.
 */
export function FirefliesView({ seed }: { seed: number }) {
  const swarms = useMemo(() => createSwarms(createRng(swarmSeed(seed))), [seed]);

  const moteRefs = useRef<(Mesh | null)[]>([]);
  const lightRefs = useRef<(PointLight | null)[]>([]);
  const groupRefs = useRef<(Mesh | null)[]>([]);

  const motes = useMemo(
    () =>
      swarms.flatMap((enxame, enxameIndex) =>
        Array.from({ length: FIREFLY.motes }, (_, index) => ({
          key: `${enxame.id}-${index}`,
          index,
          enxameIndex,
          enxame,
        })),
      ),
    [swarms],
  );

  useFrame((_, delta) => {
    const acesos = firefliesAreOut(phaseFor(cyclePosition(dayNightClock.seconds)));

    // Apaga tudo de dia sem desmontar nada: montar e desmontar dezenas de
    // objetos a cada virada de fase custaria mais que deixa-los invisiveis.
    for (let i = 0; i < motes.length; i += 1) {
      const malha = moteRefs.current[i];
      if (!malha) continue;
      malha.visible = acesos;
      if (!acesos) continue;

      const { enxame, index } = motes[i];
      const p = motePosition(dayNightClock.seconds, index, enxame.position);
      malha.position.set(p.x, p.y, p.z);
    }

    for (let i = 0; i < swarms.length; i += 1) {
      const luz = lightRefs.current[i];
      if (luz) luz.visible = acesos;
    }

    if (!acesos) return;

    // Encostou num enxame: a lanterna enche sozinha, sem abrir desafio.
    const state = useGameStore.getState();
    const alcanceSq = FIREFLY.radius * FIREFLY.radius;
    for (const enxame of swarms) {
      const dx = playerTransform.x - enxame.position.x;
      const dz = playerTransform.z - enxame.position.z;
      if (dx * dx + dz * dz > alcanceSq) continue;
      // O delta do quadro, e nunca um valor fixo. Com `1 / 60` cravado, numa
      // maquina que roda a 15 quadros por segundo o quadro dura mais do que a
      // carga que ele adiciona: a lanterna expirava antes do quadro seguinte e a
      // carga ficava travada em 0,03 s para sempre. So apareceu no navegador com
      // WebGL por software — os testes chamavam a funcao direto, com delta 1.
      state.keepLanternTopped(dayNightClock.seconds, delta);
      break;
    }
  });

  return (
    <>
      {swarms.map((enxame, i) => (
        <pointLight
          key={`luz-${enxame.id}`}
          ref={(luz) => {
            lightRefs.current[i] = luz;
          }}
          position={[enxame.position.x, enxame.position.y + FIREFLY.height, enxame.position.z]}
          color={palette.firefly}
          intensity={6}
          distance={FIREFLY.radius * 2.4}
          visible={false}
        />
      ))}

      {motes.map(({ key, enxame, index }, i) => {
        const inicial = motePosition(0, index, enxame.position);
        return (
          <mesh
            key={key}
            ref={(malha) => {
              moteRefs.current[i] = malha;
              groupRefs.current[i] = malha;
            }}
            position={[inicial.x, inicial.y, inicial.z]}
            visible={false}
          >
            <sphereGeometry args={[0.09, 6, 5]} />
            {/* `meshBasicMaterial`: o vaga-lume emite a propria luz e nao pode
                escurecer junto com o resto da cena — se ele apagasse no escuro,
                perderia a unica razao de existir. */}
            <meshBasicMaterial color={palette.firefly} />
          </mesh>
        );
      })}
    </>
  );
}
