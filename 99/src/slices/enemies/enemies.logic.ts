import { type Rng, randomRange } from '../../shared/rng';
import { distanceSqXZ, type Vec3, vec3 } from '../../shared/vec';
import { ISLAND } from '../world/world.logic';
import { BUILDING, type Structure } from '../building/building.logic';
import type { DayPhase } from '../daynight/daynight.logic';

export interface Enemy {
  id: string;
  position: Vec3;
  /** Vida do inimigo nao existe nesta POC — ele so recua no fogo. */
  speed: number;
}

export const ENEMIES = {
  /** Quantos inimigos surgem por noite. */
  perNight: 5,
  speed: 3.1,
  /** Distancia de contato com o jogador. */
  contactRange: 1.3,
  /** Dano por contato. */
  contactDamage: 12,
  /** Intervalo minimo entre dois danos, em segundos. */
  damageCooldown: 1.2,
  /** Velocidade de recuo ao entrar no raio da fogueira. */
  retreatSpeed: 4.4,
  maxHealth: 100,
} as const;

export type Outcome = 'jogando' | 'venceu' | 'perdeu';

/**
 * Pontos de surgimento na borda da ilha.
 *
 * Devolve lista vazia fora da noite — inimigos so aparecem no escuro, que e o
 * que da sentido a fogueira e a cerca construidas durante o dia.
 */
export function spawnPointsFor(
  phase: DayPhase,
  rng: Rng,
  // Tipo explicito: `ENEMIES` e `as const`, entao inferir do default fixaria o
  // parametro no literal 5.
  count: number = ENEMIES.perNight,
): Vec3[] {
  if (phase !== 'noite') return [];

  const radius = ISLAND.radius - 2;
  const points: Vec3[] = [];

  for (let index = 0; index < count; index += 1) {
    // Distribui em setores e sorteia dentro de cada um: espalha melhor que
    // sortear o angulo livremente, que costuma agrupar tudo de um lado so.
    const sector = (index / count) * Math.PI * 2;
    const angle = sector + randomRange(rng, -0.35, 0.35);
    points.push(vec3(Math.cos(angle) * radius, 0, Math.sin(angle) * radius));
  }

  return points;
}

/**
 * Passo em direcao ao alvo, limitado pela velocidade e pelo tempo do quadro.
 *
 * Nunca ultrapassa o alvo: sem essa checagem, um `delta` grande faria o inimigo
 * saltar por cima do jogador e ficar oscilando de um lado para o outro.
 */
export function stepToward(from: Vec3, to: Vec3, speed: number, delta: number): Vec3 {
  const dx = to.x - from.x;
  const dz = to.z - from.z;
  const distance = Math.hypot(dx, dz);

  if (distance === 0) return vec3(from.x, from.y, from.z);

  const travel = Math.min(speed * delta, distance);
  return vec3(from.x + (dx / distance) * travel, from.y, from.z + (dz / distance) * travel);
}

/** Passo se afastando do alvo — usado para fugir do calor da fogueira. */
export function stepAway(from: Vec3, to: Vec3, speed: number, delta: number): Vec3 {
  const dx = from.x - to.x;
  const dz = from.z - to.z;
  const distance = Math.hypot(dx, dz);

  // Exatamente em cima da fogueira: empurra numa direcao qualquer, mas fixa,
  // para nao travar num ponto de equilibrio.
  if (distance === 0) return vec3(from.x + speed * delta, from.y, from.z);

  const travel = speed * delta;
  return vec3(from.x + (dx / distance) * travel, from.y, from.z + (dz / distance) * travel);
}

/** A fogueira mais proxima cujo raio de seguranca cobre esta posicao. */
export function fireThreatening(
  position: Vec3,
  structures: readonly Structure[],
  radius = BUILDING.fireSafeRadius,
): Structure | null {
  const radiusSq = radius * radius;
  let closest: Structure | null = null;
  let closestDistanceSq = Infinity;

  for (const structure of structures) {
    if (structure.kind !== 'fogueira') continue;
    const distanceSq = distanceSqXZ(position, structure.position);
    if (distanceSq <= radiusSq && distanceSq < closestDistanceSq) {
      closest = structure;
      closestDistanceSq = distanceSq;
    }
  }

  return closest;
}

/** A posicao esta protegida pelo raio de alguma fogueira? */
export function isInFireSafeZone(
  position: Vec3,
  structures: readonly Structure[],
  radius = BUILDING.fireSafeRadius,
): boolean {
  return fireThreatening(position, structures, radius) !== null;
}

export interface DamageResult {
  health: number;
  lastHitAt: number;
  applied: boolean;
}

/**
 * Aplica dano de contato respeitando o intervalo minimo.
 *
 * Sem o cooldown, encostar num inimigo drenaria a vida inteira em poucos
 * quadros — 60 contatos por segundo — e a derrota pareceria aleatoria.
 */
export function applyContactDamage(
  health: number,
  now: number,
  lastHitAt: number,
  damage = ENEMIES.contactDamage,
  cooldown = ENEMIES.damageCooldown,
): DamageResult {
  if (now - lastHitAt < cooldown) {
    return { health, lastHitAt, applied: false };
  }
  return { health: Math.max(0, health - damage), lastHitAt: now, applied: true };
}

/** O inimigo esta perto o bastante para machucar? */
export function isTouching(enemy: Vec3, player: Vec3, range = ENEMIES.contactRange): boolean {
  return distanceSqXZ(enemy, player) <= range * range;
}

/**
 * Resultado da partida.
 *
 * A vitoria e o amanhecer com vida: sobreviver a noite e o objetivo, e o
 * amanhecer e a recompensa. A derrota tem prioridade — com vida zerada nao ha
 * amanhecer que valha.
 */
export function evaluateOutcome(health: number, phase: DayPhase, survivedNight: boolean): Outcome {
  if (health <= 0) return 'perdeu';
  if (phase === 'amanhecer' && survivedNight) return 'venceu';
  return 'jogando';
}
