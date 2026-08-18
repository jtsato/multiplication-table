import { type Rng, randomRange } from '../../shared/rng';
import { type Vec3 } from '../../shared/vec';
import { REGIONS, randomGroundPositionIn } from '../regions/regions.logic';
import type { DayPhase } from '../daynight/daynight.logic';

/**
 * Enxames de vaga-lumes.
 *
 * Sao a terceira forma de recarregar a lanterna, e a unica que **nao cobra
 * nada** fora de casa: encostar num enxame enche a luz, sem conta e sem moeda.
 *
 * Existem para resolver uma dependencia circular. A lanterna da acesso ao que so
 * aparece no escuro; se recarregar dependesse de voltar a fogueira ou a casa, a
 * crianca que ficasse sem carga longe teria que atravessar o escuro para poder
 * ver no escuro. O vaga-lume brilha por conta propria — e visivel justamente
 * quando e necessario.
 *
 * E por isso tambem que eles nao dao recurso nem moeda: sao socorro, nao
 * colheita. Transformar em recompensa faria a crianca caçar vaga-lume em vez de
 * fazer conta.
 */

export const FIREFLY = {
  /** Distancia para o enxame comecar a encher a lanterna. */
  radius: 3.6,
  /** Quantos enxames por regiao. */
  perRegion: 2,
  /** Quantos pontinhos compoem um enxame. */
  motes: 9,
  /** Raio da nuvem de pontinhos. */
  spread: 1.5,
  /** Altura media dos pontinhos acima do chao. */
  height: 1.3,
  /** Velocidade do bailado, em voltas por segundo. */
  drift: 0.25,
} as const;

export interface Swarm {
  id: string;
  position: Vec3;
}

/**
 * Espalha os enxames pelas regioes.
 *
 * Um por regiao seria facil de nao encontrar nunca; muitos tornariam a carga
 * irrelevante e a fogueira inutil. Dois e o suficiente para socorrer sem
 * substituir.
 */
export function createSwarms(rng: Rng): Swarm[] {
  return REGIONS.flatMap((regiao) =>
    Array.from({ length: FIREFLY.perRegion }, (_, index) => ({
      id: `vagalume-${regiao.id}-${index}`,
      position: randomGroundPositionIn(regiao, rng),
    })),
  );
}

/**
 * Os vaga-lumes estao fora?
 *
 * So a noite. De dia eles nao apareceriam de qualquer forma, e deixar a recarga
 * livre o tempo todo esvaziaria a fogueira — que e onde a conta acontece.
 */
export function firefliesAreOut(phase: DayPhase): boolean {
  return phase === 'noite';
}

/** O enxame em que o jogador esta, ou `null`. */
export function swarmAt(position: Vec3, swarms: readonly Swarm[]): Swarm | null {
  const alcanceSq = FIREFLY.radius * FIREFLY.radius;
  for (const enxame of swarms) {
    const dx = position.x - enxame.position.x;
    const dz = position.z - enxame.position.z;
    if (dx * dx + dz * dz <= alcanceSq) return enxame;
  }
  return null;
}

/**
 * Posicao de um pontinho do enxame no instante `elapsed`.
 *
 * Calculada do relogio, como as gotas da cachoeira, e pelo mesmo motivo: somar
 * delta quadro a quadro acumula erro e o enxame se desfaz depois de muito tempo
 * de jogo aberto.
 */
export function motePosition(
  elapsed: number,
  index: number,
  origem: Vec3,
): { x: number; y: number; z: number } {
  const fase = (index / FIREFLY.motes) * Math.PI * 2;
  const angulo = elapsed * FIREFLY.drift * Math.PI * 2 + fase;
  // Raios alternados para os pontinhos nao girarem em fila indiana.
  const raio = FIREFLY.spread * (0.45 + 0.55 * ((index % 3) / 2));

  return {
    x: origem.x + Math.cos(angulo) * raio,
    y: origem.y + FIREFLY.height + Math.sin(angulo * 1.7 + fase) * 0.35,
    z: origem.z + Math.sin(angulo) * raio,
  };
}

/** Semente fixa dos enxames, para eles nascerem sempre no mesmo lugar. */
export function swarmSeed(worldSeed: number): number {
  return worldSeed + 7919;
}

/** Util para as views e para o HUD. */
export function swarmCount(): number {
  return REGIONS.length * FIREFLY.perRegion;
}

/** Aleatorio auxiliar, mantido aqui para os testes cobrirem a mesma geracao. */
export function jitter(rng: Rng): number {
  return randomRange(rng, -0.5, 0.5);
}
