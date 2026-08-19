import { type Vec3, vec3 } from '../../shared/vec';

/**
 * O pet.
 *
 * Segue o jogador por interpolacao suave ate um ponto atras dele — sem corpo
 * fisico e sem pathfinding, bem mais simples que os inimigos removidos. A
 * funcao e pura para poder ser testada sem cena: o teste que importa e que o
 * pet nunca ultrapassa o alvo, mesmo com um `delta` grande.
 */

export const PET = {
  /** Velocidade de caminhada do pet, em metros por segundo. */
  speed: 4.5,
  /** Distancia atras do jogador onde o pet para. */
  followDistance: 1.6,
  /** De quanto em quanto tempo o pet desenterra uma moeda, em segundos. */
  coinIntervalSeconds: 30,
  /** Distancia em que o pet fareja o no mais proximo. */
  sniffRange: 6,
} as const;

/** O angulo de um corpo em direcao a um alvo, na convencao de yaw do jogo. */
export function sniffAngle(origin: Vec3, target: Vec3): number {
  return Math.atan2(target.x - origin.x, target.z - origin.z);
}

/**
 * Avanca uma posicao em direcao ao alvo sem nunca ultrapassa-lo.
 *
 * Um passo maior que a distancia restante chega exatamente no alvo — sem esta
 * checagem, um `delta` grande faria o pet saltar de um lado para o outro.
 */
export function stepToward(current: Vec3, target: Vec3, maxStep: number): Vec3 {
  const dx = target.x - current.x;
  const dz = target.z - current.z;
  const distance = Math.hypot(dx, dz);
  if (distance <= maxStep) return vec3(target.x, current.y, target.z);
  const t = maxStep / distance;
  return vec3(current.x + dx * t, current.y, current.z + dz * t);
}

/** O ponto atras do jogador onde o pet se acomoda. */
export function petAnchor(player: Vec3, yaw: number, distance: number = PET.followDistance): Vec3 {
  // Mesma convencao de "frente" do resto do jogo: com yaw = 0, a frente e -Z,
  // entao atras e +Z.
  return vec3(player.x + Math.sin(yaw) * distance, player.y, player.z + Math.cos(yaw) * distance);
}

/** Um passo do pet em direcao ao ponto atras do jogador. */
export function petFollow(
  current: Vec3,
  player: Vec3,
  yaw: number,
  delta: number,
  speed: number = PET.speed,
): Vec3 {
  return stepToward(current, petAnchor(player, yaw), speed * delta);
}
