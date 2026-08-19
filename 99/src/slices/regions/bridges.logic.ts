import { canAfford, type Recipe } from '../building/building.logic';
import type { AppStrings } from '../../i18n';
import { factKey } from '../economy/economy.logic';
import type { ChallengeTarget } from '../math/math.logic';
import type { Inventory } from '../resources/resources.logic';
import { type Vec3, vec3 } from '../../shared/vec';
import { REGION_ORDER, regionById, type RegionId } from './regions.logic';

/**
 * As pontes.
 *
 * Sao o portao de progressao do jogo: uma regiao nova so abre para quem comprou
 * a ponte **e** treinou a tabuada da regiao de onde esta saindo. Explorar deixa
 * de ser andar e passa a ser ter aprendido.
 *
 * A tabuada cobrada e a da **origem**, nunca a do destino. O contrario pediria a
 * conta antes de a crianca ter tido onde aprende-la.
 */

/**
 * Quantos dos dez fatos de uma tabuada a ponte exige.
 *
 * Num numero so, de proposito. A spec aprovou "a tabuada local dominada", que
 * sao os dez — mas como portao de progressao isso e pesado: quem empaca em 7x8
 * fica trancado fora do resto do mundo, num jogo cujo nao-objetivo declarado e
 * nao punir. Afrouxar para 7 e mudar esta linha, e nada mais.
 */
export const BRIDGE_MASTERY = 10;

export interface Bridge {
  id: string;
  from: RegionId;
  to: RegionId;
  coins: number;
  recipe: Recipe;
}

/**
 * O catalogo, derivado da cadeia de regioes.
 *
 * Escrever as pontes a mao deixaria a lista podendo divergir da geografia — uma
 * ponte para uma vizinha que deixou de ser vizinha, ou um par sem ponte nenhuma.
 * Aqui isso e impossivel por construcao.
 *
 * O custo sobe a cada travessia porque a criança tambem esta mais rica a cada
 * regiao; um preco fixo seria de graca na terceira ponte.
 */
export const BRIDGES: Bridge[] = REGION_ORDER.slice(0, -1).map((from, index) => {
  const to = REGION_ORDER[index + 1];
  return {
    id: `${from}-${to}`,
    from,
    to,
    coins: 20 + index * 15,
    recipe: { madeira: 6 + index * 2, pedra: 2 + index },
  };
});

const POR_ID = new Map(BRIDGES.map((ponte) => [ponte.id, ponte]));

export function bridgeById(id: string): Bridge | undefined {
  return POR_ID.get(id);
}

/** A ponte entre duas regioes, em qualquer sentido. */
export function bridgeFor(a: RegionId, b: RegionId): Bridge | undefined {
  return BRIDGES.find(
    (ponte) => (ponte.from === a && ponte.to === b) || (ponte.from === b && ponte.to === a),
  );
}

/**
 * Onde a guardia fica: na margem de origem, um passo para dentro da regiao e
 * para o lado da ponte.
 *
 * A guardia e a cara do pedagio — a crianca ve quem vai cobrar a conta antes de
 * apertar `E`. Ela fica do lado de onde se sai porque a conta cobrada e a da
 * regiao de origem; ficar no meio do tabuleiro bloquearia a passagem depois que
 * a ponte abrisse.
 */
export const BRIDGE_GUARD = {
  /** Distancia da margem para dentro da regiao de origem. */
  back: 1.6,
  /** Deslocamento lateral em relacao a direcao da ponte. */
  side: 1.1,
} as const;

export function bridgeGuardPosition(ponte: Bridge): Vec3 {
  const { from, to } = bridgeAnchors(ponte);
  const origem = regionById(ponte.from);
  const dx = to.x - from.x;
  const dz = to.z - from.z;
  const length = Math.hypot(dx, dz) || 1;
  const ux = dx / length;
  const uz = dz / length;
  // Perpendicular a direcao da ponte: o lado esquerdo de quem sai da origem.
  const px = -uz;
  const pz = ux;

  return vec3(
    from.x - ux * BRIDGE_GUARD.back + px * BRIDGE_GUARD.side,
    origem.groundY,
    from.z - uz * BRIDGE_GUARD.back + pz * BRIDGE_GUARD.side,
  );
}

/**
 * A conta da guardia da ponte.
 *
 * Usa a colheita e a tabuada da regiao de origem — a mesma regra do resto da
 * ponte: cobra-se o que a crianca ja teve onde aprender.
 */
export function bridgeChallengeTarget(ponte: Bridge): ChallengeTarget {
  const origem = regionById(ponte.from);
  return {
    id: ponte.id,
    kind: origem.harvest[0],
    groups: 1 + (ponte.id.length % 10),
    perGroup: origem.tables[0],
  };
}

/** As tabuadas que esta ponte cobra — as da regiao de origem. */
export function requiredTables(ponte: Bridge): number[] {
  return regionById(ponte.from).tables;
}

/** Quantos dos dez fatos desta tabuada a crianca ja domina. */
export function factsKnownFor(table: number, knownFacts: readonly string[]): number {
  let total = 0;
  for (let fator = 1; fator <= 10; fator += 1) {
    if (knownFacts.includes(factKey(table, fator))) total += 1;
  }
  return total;
}

export function tablesAreMastered(ponte: Bridge, knownFacts: readonly string[]): boolean {
  return requiredTables(ponte).every((table) => factsKnownFor(table, knownFacts) >= BRIDGE_MASTERY);
}

export type BridgeRejection = 'sem-tabuada' | 'sem-moedas' | 'sem-recursos';
export type BridgeCheck = { ok: true } | { ok: false; reason: BridgeRejection };

/**
 * Da para abrir esta ponte agora?
 *
 * A tabuada e verificada **primeiro**, e isso importa para a mensagem: dizer
 * "faltam moedas" a quem tem moedas de sobra e ainda nao treinou manda a crianca
 * juntar mais moedas, que e exatamente o caminho errado.
 */
export function checkBridge(
  ponte: Bridge,
  coins: number,
  inventory: Inventory,
  knownFacts: readonly string[],
): BridgeCheck {
  if (!tablesAreMastered(ponte, knownFacts)) return { ok: false, reason: 'sem-tabuada' };
  if (coins < ponte.coins) return { ok: false, reason: 'sem-moedas' };
  if (!canAfford(inventory, ponte.recipe)) return { ok: false, reason: 'sem-recursos' };
  return { ok: true };
}

/**
 * A recusa da ponte, no idioma da crianca.
 *
 * "Treine a tabuada daqui" e a unica mensagem do jogo que aponta para estudar em
 * vez de juntar — por isso ela nao pode ser confundida com falta de moeda.
 */
export function bridgeMessage(reason: BridgeRejection, strings: AppStrings): string {
  if (reason === 'sem-tabuada') return strings.needTable;
  if (reason === 'sem-moedas') return strings.noCoins;
  return strings.noResources;
}

/**
 * Onde a ponte encosta em cada margem.
 *
 * Cada ponta fica na altura da propria regiao: entre o Bosque e a Cachoeira ha
 * 2,5 de desnivel, e a ponte e a rampa que o vence. E por isso que a cachoeira
 * cabe ali do lado.
 */
export function bridgeAnchors(ponte: Bridge): { from: Vec3; to: Vec3 } {
  const origem = regionById(ponte.from);
  const destino = regionById(ponte.to);
  const angulo = Math.atan2(destino.center.z - origem.center.z, destino.center.x - origem.center.x);

  return {
    from: vec3(
      origem.center.x + Math.cos(angulo) * origem.radius,
      origem.groundY,
      origem.center.z + Math.sin(angulo) * origem.radius,
    ),
    to: vec3(
      destino.center.x - Math.cos(angulo) * destino.radius,
      destino.groundY,
      destino.center.z - Math.sin(angulo) * destino.radius,
    ),
  };
}

/**
 * Os angulos, na borda desta regiao, onde a parede invisivel tem que abrir.
 *
 * Uma ponte comprada abre passagem nos **dois** lados: quem atravessa precisa
 * poder voltar. Uma ponte fechada nao abre nada — a agua nao pune, so nao se
 * entra nela.
 */
export function openingsFor(id: RegionId, openBridges: readonly string[]): number[] {
  const regiao = regionById(id);

  return BRIDGES.filter(
    (ponte) => openBridges.includes(ponte.id) && (ponte.from === id || ponte.to === id),
  ).map((ponte) => {
    const outra = regionById(ponte.from === id ? ponte.to : ponte.from);
    return Math.atan2(outra.center.z - regiao.center.z, outra.center.x - regiao.center.x);
  });
}

/**
 * As regioes que dao para alcancar a pe a partir daqui.
 *
 * Percorre o grafo em vez de contar pontes: comprar so a ultima ponte nao pode
 * teleportar ninguem para o Pico.
 */
export function reachableFrom(id: RegionId, openBridges: readonly string[]): RegionId[] {
  const alcancadas: RegionId[] = [id];
  const fila: RegionId[] = [id];

  while (fila.length > 0) {
    const atual = fila.pop()!;
    for (const ponte of BRIDGES) {
      if (!openBridges.includes(ponte.id)) continue;
      const outra = ponte.from === atual ? ponte.to : ponte.to === atual ? ponte.from : null;
      if (outra === null || alcancadas.includes(outra)) continue;
      alcancadas.push(outra);
      fila.push(outra);
    }
  }

  return alcancadas;
}
