import { useMemo } from 'react';
import { Instance, Instances } from '@react-three/drei';
import { CuboidCollider, CylinderCollider, RigidBody } from '@react-three/rapier';
import { useGameStore } from '../../app/store';
import { palette } from '../../shared/palette';
import { createRng, randomRange } from '../../shared/rng';
import { openingsFor } from '../regions/bridges.logic';
import {
  REGIONS,
  WORLD_BOUNDS,
  randomGroundPositionIn,
  type Region,
} from '../regions/regions.logic';
import { scatterPositions } from './world.logic';

/** Quanto de terra existe abaixo do chao de uma regiao, ate afundar no mar. */
const BASE_THICKNESS = 3;
/** Quantos segmentos de parede invisivel formam a borda de uma regiao. */
const WALL_SEGMENTS = 24;
/** Altura do mar. Toda regiao precisa mergulhar abaixo disto. */
const SEA_LEVEL = -1.6;
/** Metade da largura do tabuleiro, para dimensionar o buraco na parede. */
const DECK_HALF_WIDTH = 1.6;

/** Menor angulo entre duas direcoes, sempre positivo. */
function diferencaAngular(a: number, b: number): number {
  const bruta = Math.abs(a - b) % (Math.PI * 2);
  return bruta > Math.PI ? Math.PI * 2 - bruta : bruta;
}

/**
 * Espessura do disco de terra de uma regiao.
 *
 * Cresce com a altura do terreno: o Pico fica a 7 de altura e, com uma espessura
 * fixa de 3, o disco dele terminaria em y = 4 — uma ilha flutuando no ar, com o
 * mar visivel por baixo. A base tem que ir sempre abaixo do nivel do mar.
 */
function espessura(regiao: Region): number {
  return regiao.groundY - SEA_LEVEL + BASE_THICKNESS;
}

/**
 * Parede invisivel na borda de uma regiao.
 *
 * Preferida a "grudar" a posicao do jogador dentro do raio por codigo: corrigir
 * a posicao todo quadro briga com o solver do Rapier e produz tremor. Um anel de
 * colisores deixa a contencao a cargo da propria fisica.
 *
 * O anel abre exatamente onde ha uma ponte comprada, e so ali. A agua nao pune —
 * simplesmente nao se entra nela.
 */
function RegionWalls({ regiao }: { regiao: Region }) {
  const openBridges = useGameStore((state) => state.openBridges);

  const segments = useMemo(() => {
    const width = (2 * Math.PI * regiao.radius) / WALL_SEGMENTS;
    const aberturas = openingsFor(regiao.id, openBridges);
    // Meio-arco do buraco, medido pela largura do tabuleiro: uma abertura fixa em
    // radianos ficaria estreita nas regioes grandes e larga demais nas pequenas.
    const meioArco = Math.atan2(DECK_HALF_WIDTH * 1.6, regiao.radius);

    return Array.from({ length: WALL_SEGMENTS }, (_, index) => {
      const angle = (index / WALL_SEGMENTS) * Math.PI * 2;
      return {
        key: index,
        angle,
        position: [
          regiao.center.x + Math.cos(angle) * regiao.radius,
          regiao.groundY + 1.5,
          regiao.center.z + Math.sin(angle) * regiao.radius,
        ] as const,
        // O colisor gira para ficar tangente ao circulo.
        rotation: [0, -angle, 0] as const,
        // Meia-largura com folga, para os segmentos se sobreporem e nao deixarem fresta.
        halfWidth: width * 0.75,
      };
    }).filter(
      (segment) =>
        !aberturas.some((abertura) => diferencaAngular(segment.angle, abertura) < meioArco),
    );
  }, [regiao, openBridges]);

  return (
    <RigidBody type="fixed" colliders={false}>
      {segments.map((segment) => (
        <CuboidCollider
          key={segment.key}
          args={[0.3, 2.5, segment.halfWidth]}
          position={segment.position}
          rotation={segment.rotation}
        />
      ))}
    </RigidBody>
  );
}

/** O chao de uma regiao: areia em volta, grama por cima, colisor por baixo. */
function RegionGround({ regiao }: { regiao: Region }) {
  const altura = espessura(regiao);
  const { x, z } = regiao.center;

  return (
    <>
      {/*
        Faixa de areia: anel em volta do gramado.

        O topo tem que ficar ABAIXO de `groundY`, que e o topo do gramado. Numa
        versao anterior este disco terminava acima e, sendo maior que a ilha,
        cobria o gramado inteiro — a ilha aparecia bege e sem sombra nenhuma,
        porque as sombras caiam neste disco em vez de na grama.
      */}
      <mesh position={[x, regiao.groundY - 0.6, z]} receiveShadow>
        <cylinderGeometry args={[regiao.radius + 2.2, regiao.radius + 1.2, 1, 24]} />
        <meshLambertMaterial color={palette.sand} flatShading />
      </mesh>

      <RigidBody type="fixed" colliders={false}>
        <mesh position={[x, regiao.groundY - altura / 2, z]} receiveShadow>
          <cylinderGeometry args={[regiao.radius, regiao.radius - 1.5, altura, 24]} />
          <meshLambertMaterial color={palette.grass} flatShading />
        </mesh>
        <CylinderCollider
          args={[altura / 2, regiao.radius]}
          position={[x, regiao.groundY - altura / 2, z]}
        />
      </RigidBody>

      <RegionWalls regiao={regiao} />
    </>
  );
}

/**
 * Cenario decorativo instanciado.
 *
 * Tufos de grama e pedrinhas somam centenas de objetos; como `InstancedMesh`
 * eles custam uma unica chamada de desenho por tipo. Arvores e moitas nao estao
 * aqui — elas sao nos interativos, com estado proprio.
 *
 * Uma unica malha instanciada para o arquipelago inteiro, e nao uma por regiao:
 * seis `Instances` custariam seis chamadas de desenho para desenhar a mesma
 * grama.
 */
function Scenery({ seed }: { seed: number }) {
  const { tufts, pebbles } = useMemo(() => {
    const rng = createRng(seed);
    const espalharPorTodas = (porRegiao: number, spacing: number) =>
      REGIONS.flatMap((regiao) =>
        scatterPositions(rng, porRegiao, spacing, undefined, (semente) =>
          randomGroundPositionIn(regiao, semente),
        ).map((position) => ({ position, groundY: regiao.groundY })),
      );

    const tuftPositions = espalharPorTodas(24, 1.6);
    const pebblePositions = espalharPorTodas(10, 2.2);

    return {
      tufts: tuftPositions.map(({ position, groundY }, index) => ({
        key: index,
        position: [position.x, groundY + 0.18, position.z] as const,
        rotation: [0, randomRange(rng, 0, Math.PI * 2), 0] as const,
        scale: randomRange(rng, 0.7, 1.4),
      })),
      pebbles: pebblePositions.map(({ position, groundY }, index) => ({
        key: index,
        position: [position.x, groundY + 0.12, position.z] as const,
        rotation: [
          randomRange(rng, 0, Math.PI),
          randomRange(rng, 0, Math.PI * 2),
          randomRange(rng, 0, Math.PI),
        ] as const,
        scale: randomRange(rng, 0.18, 0.42),
      })),
    };
  }, [seed]);

  return (
    <>
      <Instances limit={tufts.length} castShadow>
        <coneGeometry args={[0.22, 0.55, 4]} />
        <meshLambertMaterial color={palette.grassDark} flatShading />
        {tufts.map((tuft) => (
          <Instance
            key={tuft.key}
            position={tuft.position}
            rotation={tuft.rotation}
            scale={tuft.scale}
          />
        ))}
      </Instances>

      <Instances limit={pebbles.length} castShadow>
        <dodecahedronGeometry args={[1, 0]} />
        <meshLambertMaterial color={palette.rock} flatShading />
        {pebbles.map((pebble) => (
          <Instance
            key={pebble.key}
            position={pebble.position}
            rotation={pebble.rotation}
            scale={pebble.scale}
          />
        ))}
      </Instances>
    </>
  );
}

export function WorldView({ seed }: { seed: number }) {
  return (
    <>
      {/* As luzes ficam em `DayNightView`: quem manda nelas e o ciclo, nao a
          geometria. Aqui mora so o que compoe fisicamente o mundo. */}

      {/* Mar: plano grande e barato, sem fisica — o jogador nunca chega nele.
          Centrado no arquipelago, e nao na origem, porque a Praia deixou de ser
          o meio do mundo. */}
      <mesh
        position={[WORLD_BOUNDS.center.x, SEA_LEVEL, WORLD_BOUNDS.center.z]}
        rotation={[-Math.PI / 2, 0, 0]}
        receiveShadow={false}
      >
        <planeGeometry args={[WORLD_BOUNDS.radius * 8, WORLD_BOUNDS.radius * 8]} />
        <meshLambertMaterial color={palette.water} />
      </mesh>

      {REGIONS.map((regiao) => (
        <RegionGround key={regiao.id} regiao={regiao} />
      ))}

      <Scenery seed={seed} />
    </>
  );
}
