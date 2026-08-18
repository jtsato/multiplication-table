import { type Rng, randomRange } from '../../shared/rng';
import { type Vec3, vec3 } from '../../shared/vec';

/**
 * Configuracao da ilha.
 *
 * A ilha e um disco: o raio define tanto o limite fisico (anel de colisores em
 * `WorldView`) quanto a validacao de posicoes de recursos (Fatia 2) e de
 * construcoes (Fatia 4).
 */
export const ISLAND = {
  radius: 30,
  /** Altura do topo do terreno; tudo que fica no chao usa este Y. */
  groundY: 0,
  /** Area livre no centro onde o jogador nasce — nada e espalhado aqui. */
  spawnClearance: 6,
  /** Margem interna: nada e posicionado colado na borda. */
  edgeMargin: 3,
} as const;

/** A posicao esta dentro do disco da ilha, considerando uma folga opcional? */
export function isWithinIsland(position: Vec3, margin = 0): boolean {
  const limit = ISLAND.radius - margin;
  if (limit <= 0) return false;
  return position.x * position.x + position.z * position.z <= limit * limit;
}

/**
 * Sorteia um ponto no anel util da ilha: fora da area de spawn e dentro da
 * margem da borda.
 *
 * O raio e sorteado por `sqrt` para que os pontos fiquem uniformes por area —
 * sortear o raio direto concentraria tudo no centro.
 */
export function randomGroundPosition(rng: Rng): Vec3 {
  const min = ISLAND.spawnClearance;
  const max = ISLAND.radius - ISLAND.edgeMargin;
  const angle = randomRange(rng, 0, Math.PI * 2);
  const t = randomRange(rng, 0, 1);
  const radius = Math.sqrt(min * min + t * (max * max - min * min));
  return vec3(Math.cos(angle) * radius, ISLAND.groundY, Math.sin(angle) * radius);
}

/**
 * Espalha `count` posicoes mantendo uma distancia minima entre elas.
 *
 * Tentativa e erro com teto de iteracoes: e o suficiente para a densidade baixa
 * desta POC e evita a complexidade de um Poisson disc completo. Se o teto for
 * atingido, devolve menos posicoes do que o pedido em vez de travar.
 */
export function scatterPositions(
  rng: Rng,
  count: number,
  minSpacing: number,
  /**
   * Areas proibidas, como a planta da casa.
   *
   * Predicado em vez de a geracao conhecer a casa: o mundo nao precisa saber que
   * existe uma casa — quem sabe onde ela esta e a propria slice dela.
   */
  isBlocked: (position: Vec3) => boolean = () => false,
  /**
   * De onde sai cada candidato.
   *
   * Parametro em vez de a funcao sortear sozinha: com o arquipelago, cada regiao
   * espalha dentro dos proprios limites, e a regra de espacamento minimo e a
   * mesma em todas. Sem isto, ou `world/` passaria a conhecer as regioes, ou a
   * regra de espacamento seria copiada.
   */
  sample: (rng: Rng) => Vec3 = randomGroundPosition,
): Vec3[] {
  const placed: Vec3[] = [];
  const minSpacingSq = minSpacing * minSpacing;
  const maxAttempts = count * 30;

  for (let attempt = 0; attempt < maxAttempts && placed.length < count; attempt += 1) {
    const candidate = sample(rng);
    if (isBlocked(candidate)) continue;
    const tooClose = placed.some((other) => {
      const dx = candidate.x - other.x;
      const dz = candidate.z - other.z;
      return dx * dx + dz * dz < minSpacingSq;
    });
    if (!tooClose) placed.push(candidate);
  }

  return placed;
}
