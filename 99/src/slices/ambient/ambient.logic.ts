import { createRng } from '../../shared/rng';
import { type Vec3, vec3 } from '../../shared/vec';
import { REGIONS, randomGroundPositionIn } from '../regions/regions.logic';

/**
 * Fauna de ambiente: borboletas e pássaros que não interagem com a matemática.
 *
 * Eles existem para o mundo não parecer um cenário estático: as borboletas
 * pairam perto de um ponto de origem e fogem quando o jogador chega perto; os
 * pássaros fazem círculos no céu. Nenhum dos dois dá moeda, recurso ou amizade —
 * é só vida, como a baleia.
 */

export type AmbientKind = 'borboleta' | 'passaro';

export interface AmbientCreature {
  id: string;
  kind: AmbientKind;
  /** Ponto de origem do movimento (borboleta) ou centro do círculo (pássaro). */
  anchor: Vec3;
  /** Semente estável para o movimento não repetir igual em todo lugar. */
  seed: number;
}

export const AMBIENT = {
  /** Borboletas por região: 6 regiões × 2 = 12. */
  butterfliesPerRegion: 2,
  /** Pássaros por região: 6 regiões × 1 = 6. */
  birdsPerRegion: 1,
  /** Distância em que o jogador espanta uma borboleta. */
  fleeRadius: 3.5,
  /** O quanto a fuga empurra a borboleta para longe. */
  fleeStrength: 1.6,
  /** Raio do bailado da borboleta em torno da âncora. */
  flutterRadius: 0.7,
  /** Raio do círculo do pássaro. */
  birdRadius: 2.6,
  /** Altura do círculo dos pássaros. */
  birdHeight: 5,
} as const;

/** Gera a fauna ambiente com a mesma semente do mundo. */
export function createAmbient(seed: number): AmbientCreature[] {
  const rng = createRng(seed ^ 0x9b2a);
  const criaturas: AmbientCreature[] = [];

  for (const regiao of REGIONS) {
    for (let i = 0; i < AMBIENT.butterfliesPerRegion; i += 1) {
      const anchor = randomGroundPositionIn(regiao, rng);
      criaturas.push({
        id: `${regiao.id}-borboleta-${i}`,
        kind: 'borboleta',
        anchor: vec3(anchor.x, regiao.groundY + 0.8, anchor.z),
        seed: Math.floor(rng() * 1000),
      });
    }
    for (let i = 0; i < AMBIENT.birdsPerRegion; i += 1) {
      const anchor = randomGroundPositionIn(regiao, rng);
      criaturas.push({
        id: `${regiao.id}-passaro-${i}`,
        kind: 'passaro',
        anchor: vec3(anchor.x, regiao.groundY + AMBIENT.birdHeight, anchor.z),
        seed: Math.floor(rng() * 1000),
      });
    }
  }

  return criaturas;
}

/**
 * O bailado da borboleta em torno da âncora.
 *
 * Lissajous no plano com um salto vertical suave: parece voo, não uma mola. O
 * par horizontal é normalizado para nunca sair do raio — dois senos com
 * frequências diferentes podem ultrapassar a amplitude quando estão em fase.
 */
export function flutterOffset(seed: number, time: number): Vec3 {
  const rawX = Math.sin(time * 1.7 + seed);
  const rawZ = Math.cos(time * 1.3 + seed);
  const magnitude = Math.hypot(rawX, rawZ);
  const scale = magnitude > 0 ? AMBIENT.flutterRadius / magnitude : 0;
  return vec3(
    rawX * scale,
    Math.abs(Math.sin(time * 2.3 + seed)) * 0.5,
    rawZ * scale,
  );
}

/** O círculo do pássaro no céu. */
export function birdOffset(seed: number, time: number): Vec3 {
  const angle = time * 0.5 + seed;
  return vec3(
    Math.cos(angle) * AMBIENT.birdRadius,
    Math.sin(time * 0.9 + seed) * 1.1,
    Math.sin(angle) * AMBIENT.birdRadius,
  );
}

/**
 * O empurrão de fuga quando o jogador chega perto.
 *
 * Devolve vetor zero fora do raio; dentro, empurra para longe do jogador com
 * força que cresce com a proximidade. Só mexe no plano — a borboleta já está no
 * ar, não precisa "subir" para escapar.
 */
export function fleeVector(anchor: Vec3, player: Vec3): Vec3 {
  const dx = anchor.x - player.x;
  const dz = anchor.z - player.z;
  const distance = Math.hypot(dx, dz);
  if (distance <= 0.001 || distance >= AMBIENT.fleeRadius) return vec3();
  const strength = (1 - distance / AMBIENT.fleeRadius) * AMBIENT.fleeStrength;
  return vec3((dx / distance) * strength, 0, (dz / distance) * strength);
}

/** Ângulo de rotação do corpo para olhar na direção do movimento. */
export function facingAngle(dx: number, dz: number): number {
  return Math.atan2(dx, dz);
}
