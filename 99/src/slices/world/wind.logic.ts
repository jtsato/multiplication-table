import { createRng } from '../../shared/rng';
import { type Vec3, vec3 } from '../../shared/vec';
import { REGIONS, randomGroundPositionIn } from '../regions/regions.logic';

/**
 * Vento e vegetação rasteira.
 *
 * Os tufos instanciados do cenário são baratos mas estáticos; estes tufos
 * "vivos" são poucos (6 por região) e individuais, para balançar com o vento e
 * se curvar para longe quando o jogador passa perto. A regra de pose é pura e
 * testável sem cena.
 */

export interface WindTuft {
  id: string;
  position: Vec3;
  color: string;
  seed: number;
}

export const WIND = {
  /** Tufos vivos por região: 6 × 6 = 36 malhas individuais. */
  tuftsPerRegion: 6,
  /** Distância em que a passagem do jogador dobra o tufo. */
  bendRadius: 1.3,
  /** O quanto o tufo dobra no máximo, em radianos. */
  maxBend: 0.55,
} as const;

/** Cria os tufos vivos com a mesma semente do mundo. */
export function createWindTufts(seed: number): WindTuft[] {
  const rng = createRng(seed ^ 0x51e7);
  const tufos: WindTuft[] = [];

  for (const regiao of REGIONS) {
    for (let i = 0; i < WIND.tuftsPerRegion; i += 1) {
      const position = randomGroundPositionIn(regiao, rng);
      tufos.push({
        id: `${regiao.id}-vento-${i}`,
        position: vec3(position.x, regiao.groundY + 0.3, position.z),
        color: regiao.id === 'pico' ? '#cfeaf7' : '#3f8f45',
        seed: Math.floor(rng() * 1000),
      });
    }
  }

  return tufos;
}

export interface TuftPose {
  rotationX: number;
  rotationZ: number;
  scaleY: number;
}

/**
 * A pose do tufo num instante.
 *
 * Sem jogador perto, é só o vento: uma oscilação lenta. Com o jogador dentro do
 * raio, o tufo dobra para o lado oposto a ele e encolhe um pouco — a vegetação
 * "abre passagem" em vez de o personagem atravessar um cenário sólido.
 */
export function tuftPose(
  anchor: Vec3,
  player: Vec3,
  time: number,
  seed: number,
): TuftPose {
  const dx = anchor.x - player.x;
  const dz = anchor.z - player.z;
  const distance = Math.hypot(dx, dz);
  const swayX = Math.sin(time * 1.2 + seed) * 0.07;
  const swayZ = Math.cos(time * 1.1 + seed) * 0.07;

  if (distance >= WIND.bendRadius || distance <= 0.001) {
    return { rotationX: swayX, rotationZ: swayZ, scaleY: 1 };
  }

  const push = (1 - distance / WIND.bendRadius) * WIND.maxBend;
  const angle = Math.atan2(dx, dz);
  return {
    rotationX: Math.sin(angle) * push + swayX,
    rotationZ: Math.cos(angle) * push + swayZ,
    scaleY: 1 - push * 0.25,
  };
}
