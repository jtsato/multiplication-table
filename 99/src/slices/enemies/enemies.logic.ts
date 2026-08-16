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
  /**
   * Fracao da velocidade dos inimigos enquanto um desafio esta aberto.
   *
   * O jogo nao pausa — essa e a decisao central da Fatia 3, e e o que faz a
   * conta ser ferramenta e nao prova. Mas correr o tempo cheio enquanto a
   * crianca conta os grupos transforma a tensao em pressa, e pressa e o inimigo
   * de aprender: quem tem medo de demorar chuta em vez de contar.
   *
   * Um quarto da velocidade preserva a sensacao de que o mundo continua vivo —
   * os vultos seguem se aproximando, visivelmente — sem cobrar rapidez de
   * calculo.
   */
  challengeTimeScale: 0.25,
} as const;

/**
 * Escala de tempo dos inimigos neste quadro.
 *
 * Fica aqui, e nao espalhada no componente, para poder ser testada e para deixar
 * explicito que a camera lenta vale so para os inimigos: o relogio do dia e o
 * combustivel da fogueira continuam correndo normalmente. Se a noite tambem
 * desacelerasse, abrir um desafio viraria uma forma de esticar a noite.
 */
export function enemyTimeScale(challengeOpen: boolean): number {
  return challengeOpen ? ENEMIES.challengeTimeScale : 1;
}

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

/** Meia-largura da cerca; casa com o colisor em `BuildingView`. */
const FENCE_HALF_WIDTH = 1;

/**
 * Os dois extremos da cerca no mundo.
 *
 * A cerca e uma barra deitada no eixo X local, girada por `rotation` em torno de
 * Y. Em Three, um ponto local (lx, 0, 0) vai para
 * `(lx*cos, 0, -lx*sin)` somado a posicao.
 */
export function fenceSegment(fence: Structure): [Vec3, Vec3] {
  const dx = Math.cos(fence.rotation) * FENCE_HALF_WIDTH;
  const dz = -Math.sin(fence.rotation) * FENCE_HALF_WIDTH;
  return [
    vec3(fence.position.x - dx, 0, fence.position.z - dz),
    vec3(fence.position.x + dx, 0, fence.position.z + dz),
  ];
}

/** Sinal da area do triangulo — de que lado de `ab` esta `c`. */
function orientacao(a: Vec3, b: Vec3, c: Vec3): number {
  return (b.x - a.x) * (c.z - a.z) - (b.z - a.z) * (c.x - a.x);
}

/**
 * Sinal com tolerancia.
 *
 * `cos(PI/2)` nao da zero exato, e sim 6e-17. Sem a tolerancia, esse residuo
 * fazia um movimento *rente* a cerca contar como travessia — e o inimigo que so
 * deslizava ao lado dela ficava travado no lugar.
 */
function sinal(valor: number): number {
  return Math.abs(valor) < 1e-9 ? 0 : Math.sign(valor);
}

/** Os segmentos `a-b` e `c-d` se cruzam de fato (colinear nao conta)? */
export function segmentsIntersect(a: Vec3, b: Vec3, c: Vec3, d: Vec3): boolean {
  const o1 = sinal(orientacao(a, b, c));
  const o2 = sinal(orientacao(a, b, d));
  const o3 = sinal(orientacao(c, d, a));
  const o4 = sinal(orientacao(c, d, b));
  // Cruzamento proprio: cada segmento separa os extremos do outro.
  return o1 * o2 < 0 && o3 * o4 < 0;
}

/**
 * O passo de `from` para `to` atravessa alguma cerca?
 *
 * Os inimigos nao sao corpos do Rapier — andam por posicao —, entao o colisor da
 * cerca nao os detem sozinho. Sem esta checagem eles passavam direto pela cerca,
 * que era exatamente a defesa que a construcao prometia. O teste e de segmento
 * contra segmento, e nao de ponto dentro de area: com passos de ate 22 cm por
 * quadro, um teste pontual deixaria o inimigo "pular" para o outro lado sem
 * nunca ter estado dentro da cerca.
 */
export function crossesFence(from: Vec3, to: Vec3, structures: readonly Structure[]): boolean {
  for (const structure of structures) {
    if (structure.kind !== 'cerca') continue;
    const [a, b] = fenceSegment(structure);
    if (segmentsIntersect(from, to, a, b)) return true;
  }
  return false;
}

/**
 * Passo do inimigo levando as cercas em conta.
 *
 * Se o caminho direto cruza uma cerca, tenta deslizar: primeiro so no eixo X,
 * depois so no eixo Z. Assim o inimigo contorna a ponta da cerca em vez de
 * ficar tremendo contra ela — e continua barrado quando a cerca e larga o
 * bastante para cobrir os dois desvios.
 */
export function stepAvoidingFences(
  from: Vec3,
  to: Vec3,
  speed: number,
  delta: number,
  structures: readonly Structure[],
): Vec3 {
  const direto = stepToward(from, to, speed, delta);
  if (!crossesFence(from, direto, structures)) return direto;

  const soX = vec3(direto.x, from.y, from.z);
  if (!crossesFence(from, soX, structures)) return soX;

  const soZ = vec3(from.x, from.y, direto.z);
  if (!crossesFence(from, soZ, structures)) return soZ;

  // Bloqueado nos dois eixos: a cerca cumpriu o seu papel.
  return vec3(from.x, from.y, from.z);
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
  // Tipos explicitos: `ENEMIES` e `as const`, entao inferir dos defaults
  // fixaria os parametros nos literais 12 e 1.2.
  damage: number = ENEMIES.contactDamage,
  cooldown: number = ENEMIES.damageCooldown,
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
