import { describe, expect, it } from 'vitest';
import {
  ENEMIES,
  applyContactDamage,
  crossesFence,
  evaluateOutcome,
  fenceSegment,
  fireThreatening,
  stepAvoidingFences,
  isInFireSafeZone,
  isTouching,
  spawnPointsFor,
  stepAway,
  stepToward,
} from './enemies.logic';
import { BUILDING, type Structure } from '../building/building.logic';
import { ISLAND } from '../world/world.logic';
import { createRng } from '../../shared/rng';
import { vec3 } from '../../shared/vec';

const fogueira = (x: number, z: number): Structure => ({
  id: `fogueira-${x}-${z}`,
  kind: 'fogueira',
  position: vec3(x, 0, z),
  rotation: 0,
  fuelUntil: Infinity,
});

const cerca = (x: number, z: number): Structure => ({
  id: `cerca-${x}-${z}`,
  kind: 'cerca',
  position: vec3(x, 0, z),
  rotation: 0,
  fuelUntil: 0,
});

describe('spawnPointsFor', () => {
  it('nao gera inimigo fora da noite', () => {
    for (const fase of ['dia', 'entardecer', 'amanhecer'] as const) {
      expect(spawnPointsFor(fase, createRng(1))).toEqual([]);
    }
  });

  it('gera a quantidade pedida a noite', () => {
    expect(spawnPointsFor('noite', createRng(1))).toHaveLength(ENEMIES.perNight);
    expect(spawnPointsFor('noite', createRng(1), 3)).toHaveLength(3);
  });

  it('coloca todos os pontos na borda, dentro da ilha', () => {
    for (const ponto of spawnPointsFor('noite', createRng(7), 20)) {
      const raio = Math.hypot(ponto.x, ponto.z);
      expect(raio).toBeCloseTo(ISLAND.radius - 2);
      expect(raio).toBeLessThan(ISLAND.radius);
    }
  });

  it('espalha os inimigos em volta em vez de agrupar de um lado so', () => {
    const pontos = spawnPointsFor('noite', createRng(3), 8);
    const angulos = pontos.map((p) => Math.atan2(p.z, p.x));
    // Com setores, o maior vao angular entre vizinhos fica bem abaixo de meia volta.
    const ordenados = [...angulos].sort((a, b) => a - b);
    const maiorVao = Math.max(
      ...ordenados.map((a, i) =>
        i === 0 ? a + Math.PI * 2 - ordenados.at(-1)! : a - ordenados[i - 1],
      ),
    );
    expect(maiorVao).toBeLessThan(Math.PI);
  });

  it('e deterministico para a mesma semente', () => {
    expect(spawnPointsFor('noite', createRng(9))).toEqual(spawnPointsFor('noite', createRng(9)));
  });

  it('nasce sempre no chao', () => {
    for (const ponto of spawnPointsFor('noite', createRng(2))) {
      expect(ponto.y).toBe(0);
    }
  });
});

describe('stepToward', () => {
  it('aproxima do alvo', () => {
    const passo = stepToward(vec3(0, 0, 0), vec3(10, 0, 0), 2, 1);
    expect(passo.x).toBeCloseTo(2);
  });

  it('nunca ultrapassa o alvo, mesmo com delta grande', () => {
    const passo = stepToward(vec3(0, 0, 0), vec3(1, 0, 0), 100, 1);
    expect(passo.x).toBeCloseTo(1);
    expect(passo.z).toBeCloseTo(0);
  });

  it('respeita velocidade vezes delta', () => {
    const passo = stepToward(vec3(0, 0, 0), vec3(100, 0, 0), 3, 0.5);
    expect(Math.hypot(passo.x, passo.z)).toBeCloseTo(1.5);
  });

  it('anda na diagonal sem ganhar velocidade', () => {
    const passo = stepToward(vec3(0, 0, 0), vec3(10, 0, 10), 4, 1);
    expect(Math.hypot(passo.x, passo.z)).toBeCloseTo(4);
  });

  it('fica parado quando ja esta em cima do alvo', () => {
    expect(stepToward(vec3(3, 0, 3), vec3(3, 0, 3), 5, 1)).toEqual(vec3(3, 0, 3));
  });

  it('preserva a altura', () => {
    expect(stepToward(vec3(0, 2, 0), vec3(10, 99, 0), 2, 1).y).toBe(2);
  });

  it('converge para o alvo ao longo de muitos passos', () => {
    let atual = vec3(0, 0, 0);
    const alvo = vec3(9, 0, -4);
    for (let i = 0; i < 200; i += 1) atual = stepToward(atual, alvo, 3, 1 / 60);
    expect(Math.hypot(atual.x - alvo.x, atual.z - alvo.z)).toBeCloseTo(0);
  });
});

describe('stepAway', () => {
  it('afasta do ponto de origem', () => {
    const passo = stepAway(vec3(1, 0, 0), vec3(0, 0, 0), 2, 1);
    expect(passo.x).toBeCloseTo(3);
  });

  it('respeita velocidade vezes delta', () => {
    const passo = stepAway(vec3(1, 0, 0), vec3(0, 0, 0), 4, 0.25);
    expect(passo.x).toBeCloseTo(2);
  });

  it('nao trava quando esta exatamente em cima do ponto', () => {
    const passo = stepAway(vec3(5, 0, 5), vec3(5, 0, 5), 2, 1);
    expect(Math.hypot(passo.x - 5, passo.z - 5)).toBeGreaterThan(0);
  });
});

describe('fireThreatening / isInFireSafeZone', () => {
  it('detecta a fogueira que cobre a posicao', () => {
    expect(fireThreatening(vec3(0, 0, 0), [fogueira(2, 0)])?.id).toBe(fogueira(2, 0).id);
  });

  it('ignora cercas — so o fogo afugenta', () => {
    expect(fireThreatening(vec3(0, 0, 0), [cerca(1, 0)])).toBeNull();
    expect(isInFireSafeZone(vec3(0, 0, 0), [cerca(1, 0)])).toBe(false);
  });

  it('protege exatamente ate a borda do raio', () => {
    const naBorda = vec3(BUILDING.fireSafeRadius, 0, 0);
    expect(isInFireSafeZone(naBorda, [fogueira(0, 0)])).toBe(true);
  });

  it('nao protege logo depois da borda', () => {
    const foraPorPouco = vec3(BUILDING.fireSafeRadius + 0.01, 0, 0);
    expect(isInFireSafeZone(foraPorPouco, [fogueira(0, 0)])).toBe(false);
  });

  it('escolhe a fogueira mais proxima quando ha varias', () => {
    const perto = fogueira(1, 0);
    const escolhida = fireThreatening(vec3(0, 0, 0), [fogueira(5, 0), perto]);
    expect(escolhida?.id).toBe(perto.id);
  });

  it('sem construcao nenhuma, nao ha protecao', () => {
    expect(isInFireSafeZone(vec3(0, 0, 0), [])).toBe(false);
  });
});

describe('fenceSegment', () => {
  it('sem rotacao, a cerca deita no eixo X', () => {
    const [a, b] = fenceSegment(cerca(0, 0));
    expect(a.x).toBeCloseTo(-1);
    expect(a.z).toBeCloseTo(0);
    expect(b.x).toBeCloseTo(1);
    expect(b.z).toBeCloseTo(0);
  });

  it('girada 90 graus, deita no eixo Z', () => {
    const girada = { ...cerca(0, 0), rotation: Math.PI / 2 };
    const [a, b] = fenceSegment(girada);
    expect(a.x).toBeCloseTo(0);
    expect(Math.abs(a.z)).toBeCloseTo(1);
    expect(b.x).toBeCloseTo(0);
    expect(Math.abs(b.z)).toBeCloseTo(1);
  });

  it('acompanha a posicao da construcao', () => {
    const [a, b] = fenceSegment(cerca(5, -3));
    expect((a.x + b.x) / 2).toBeCloseTo(5);
    expect((a.z + b.z) / 2).toBeCloseTo(-3);
  });

  it('tem sempre 2 metros de vao', () => {
    for (const rotacao of [0, 0.7, Math.PI / 2, 2.4]) {
      const [a, b] = fenceSegment({ ...cerca(1, 1), rotation: rotacao });
      expect(Math.hypot(b.x - a.x, b.z - a.z)).toBeCloseTo(2);
    }
  });
});

describe('crossesFence', () => {
  it('detecta a travessia frontal', () => {
    // Cerca deitada em X na origem; o inimigo vem de -Z para +Z.
    expect(crossesFence(vec3(0, 0, -1), vec3(0, 0, 1), [cerca(0, 0)])).toBe(true);
  });

  it('nao acusa quando o caminho passa ao largo da ponta', () => {
    // A cerca vai de x=-1 a x=1; passar em x=3 e por fora.
    expect(crossesFence(vec3(3, 0, -1), vec3(3, 0, 1), [cerca(0, 0)])).toBe(false);
  });

  it('nao acusa movimento paralelo a cerca', () => {
    expect(crossesFence(vec3(-3, 0, 1), vec3(3, 0, 1), [cerca(0, 0)])).toBe(false);
  });

  it('ignora fogueiras — so a cerca barra', () => {
    expect(crossesFence(vec3(0, 0, -1), vec3(0, 0, 1), [fogueira(0, 0)])).toBe(false);
  });

  it('sem construcao nenhuma, nada barra', () => {
    expect(crossesFence(vec3(0, 0, -5), vec3(0, 0, 5), [])).toBe(false);
  });

  it('detecta a travessia mesmo com passo grande — nada de atravessar de um pulo', () => {
    // Passo de 10 m de uma vez: um teste de ponto dentro de area deixaria passar.
    expect(crossesFence(vec3(0, 0, -5), vec3(0, 0, 5), [cerca(0, 0)])).toBe(true);
  });

  it('respeita a rotacao da cerca', () => {
    const girada = { ...cerca(0, 0), rotation: Math.PI / 2 };
    // Agora ela deita em Z, entao quem barra e o movimento em X.
    expect(crossesFence(vec3(-1, 0, 0), vec3(1, 0, 0), [girada])).toBe(true);
    expect(crossesFence(vec3(0, 0, -1), vec3(0, 0, 1), [girada])).toBe(false);
  });
});

describe('stepAvoidingFences', () => {
  const cercaNaOrigem = [cerca(0, 0)];

  it('anda normalmente quando nao ha cerca no caminho', () => {
    const passo = stepAvoidingFences(vec3(0, 0, -5), vec3(0, 0, 5), 3, 1, []);
    expect(passo.z).toBeCloseTo(-2);
  });

  it('nao atravessa a cerca de frente', () => {
    const antes = vec3(0, 0, -0.5);
    const passo = stepAvoidingFences(antes, vec3(0, 0, 5), 4, 1, cercaNaOrigem);
    // Continua do mesmo lado: z permanece negativo.
    expect(passo.z).toBeLessThan(0);
  });

  it('nunca acaba do outro lado, por mais rapido que venha', () => {
    for (const velocidade of [3, 10, 40, 200]) {
      const passo = stepAvoidingFences(
        vec3(0, 0, -0.5),
        vec3(0, 0, 5),
        velocidade,
        1,
        cercaNaOrigem,
      );
      expect(passo.z).toBeLessThan(0);
    }
  });

  it('desliza para contornar em vez de travar de vez', () => {
    // Alvo na diagonal: bloqueado em Z, mas livre para andar em X.
    const passo = stepAvoidingFences(vec3(0, 0, -0.5), vec3(6, 0, 5), 3, 1, cercaNaOrigem);
    expect(passo.x).toBeGreaterThan(0);
    expect(passo.z).toBeLessThan(0);
  });

  it('barrado dos dois lados, fica parado — a cerca cumpriu o papel', () => {
    // Duas cercas em cruz fechando o caminho.
    const cruz = [cerca(0, 0), { ...cerca(0, 0), rotation: Math.PI / 2 }];
    const passo = stepAvoidingFences(vec3(-0.3, 0, -0.3), vec3(5, 0, 5), 3, 1, cruz);
    expect(passo.x).toBeCloseTo(-0.3);
    expect(passo.z).toBeCloseTo(-0.3);
  });

  it('mantem a altura', () => {
    expect(stepAvoidingFences(vec3(0, 2, -5), vec3(0, 0, 5), 3, 1, cercaNaOrigem).y).toBe(2);
  });
});

describe('applyContactDamage', () => {
  it('tira vida no primeiro contato', () => {
    const resultado = applyContactDamage(100, 10, -99);
    expect(resultado.applied).toBe(true);
    expect(resultado.health).toBe(100 - ENEMIES.contactDamage);
    expect(resultado.lastHitAt).toBe(10);
  });

  it('dois contatos seguidos contam como um so', () => {
    const primeiro = applyContactDamage(100, 10, -99);
    const segundo = applyContactDamage(primeiro.health, 10.1, primeiro.lastHitAt);
    expect(segundo.applied).toBe(false);
    expect(segundo.health).toBe(primeiro.health);
  });

  it('volta a machucar depois do cooldown', () => {
    const primeiro = applyContactDamage(100, 10, -99);
    // Um quadro alem da fronteira, e nao exatamente sobre ela: `10 + 1.2` nao da
    // 11.2 exato em ponto flutuante, e o instante exato do limite e ambiguo por
    // natureza. O que importa e que o dano volte assim que o tempo passa.
    const depois = applyContactDamage(
      primeiro.health,
      10 + ENEMIES.damageCooldown + 1 / 60,
      primeiro.lastHitAt,
    );
    expect(depois.applied).toBe(true);
    expect(depois.health).toBe(100 - ENEMIES.contactDamage * 2);
  });

  it('bloqueia logo antes de completar o cooldown', () => {
    const primeiro = applyContactDamage(100, 10, -99);
    const cedoDemais = applyContactDamage(
      primeiro.health,
      10 + ENEMIES.damageCooldown - 1 / 60,
      primeiro.lastHitAt,
    );
    expect(cedoDemais.applied).toBe(false);
  });

  it('nunca deixa a vida negativa', () => {
    expect(applyContactDamage(5, 10, -99).health).toBe(0);
  });

  it('encostar sem parar drena a vida em ritmo previsivel', () => {
    let health: number = ENEMIES.maxHealth;
    let lastHitAt = -99;
    let golpes = 0;

    // 60 quadros por segundo durante 12 segundos, sempre encostado.
    for (let quadro = 0; quadro < 60 * 12; quadro += 1) {
      const agora = quadro / 60;
      const resultado = applyContactDamage(health, agora, lastHitAt);
      health = resultado.health;
      lastHitAt = resultado.lastHitAt;
      if (resultado.applied) golpes += 1;
    }

    // Sem o cooldown seriam 720 golpes; com ele, cerca de um por 1,2 s.
    expect(golpes).toBeLessThanOrEqual(12);
    expect(health).toBe(0);
  });
});

describe('isTouching', () => {
  it('detecta contato dentro do alcance e na borda exata', () => {
    expect(isTouching(vec3(0, 0, 0), vec3(1, 0, 0))).toBe(true);
    expect(isTouching(vec3(0, 0, 0), vec3(ENEMIES.contactRange, 0, 0))).toBe(true);
  });

  it('nao detecta contato logo alem do alcance', () => {
    expect(isTouching(vec3(0, 0, 0), vec3(ENEMIES.contactRange + 0.01, 0, 0))).toBe(false);
  });

  it('ignora a altura', () => {
    expect(isTouching(vec3(0, 50, 0), vec3(0.5, 0, 0))).toBe(true);
  });
});

describe('evaluateOutcome', () => {
  it('vence ao amanhecer com vida, depois de passar pela noite', () => {
    expect(evaluateOutcome(40, 'amanhecer', true)).toBe('venceu');
  });

  it('nao vence no amanhecer se a noite ainda nao foi enfrentada', () => {
    expect(evaluateOutcome(100, 'amanhecer', false)).toBe('jogando');
  });

  it('perde com vida zerada', () => {
    expect(evaluateOutcome(0, 'noite', true)).toBe('perdeu');
    expect(evaluateOutcome(-5, 'dia', false)).toBe('perdeu');
  });

  it('a derrota tem prioridade sobre a vitoria', () => {
    expect(evaluateOutcome(0, 'amanhecer', true)).toBe('perdeu');
  });

  it('segue jogando durante o dia e a noite', () => {
    expect(evaluateOutcome(100, 'dia', false)).toBe('jogando');
    expect(evaluateOutcome(50, 'noite', true)).toBe('jogando');
    expect(evaluateOutcome(80, 'entardecer', false)).toBe('jogando');
  });
});
