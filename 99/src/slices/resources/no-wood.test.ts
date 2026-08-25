import { describe, expect, it } from 'vitest';
import { STRUCTURES } from '../building/building.logic';
import { SHOP_ITEMS } from '../economy/economy.logic';
import { REGIONS } from '../regions/regions.logic';
import { createRng } from '../../shared/rng';
import {
  PLANTABLE_RESOURCE_KINDS,
  RESOURCE_KINDS,
  RESOURCE_LABELS,
  createNodes,
  emptyInventory,
  plantedResourceKind,
  type ResourceKind,
} from './resources.logic';
import { SUPPORTED_LOCALES, bundleFor } from '../../i18n';

/**
 * A madeira saiu do jogo, e este arquivo existe para ela nao voltar por descuido.
 *
 * O corte nao foi so remover um recurso: era madeira que a fogueira pedia, era
 * galho que a crianca colhia, e era a arvore que servia de tronco. Cada um
 * desses caminhos tinha um dono diferente no codigo — receita, mundo, plantio,
 * idioma — e um deles poderia ser reintroduzido sozinho sem quebrar nenhum teste
 * dos outros. Uma varredura em cada dono resolve isso de uma vez.
 *
 * O que se afirma aqui e a **ausencia**, e teste de ausencia so vale se varrer o
 * catalogo inteiro em vez de conferir um item escolhido a mao.
 */

/** Tudo que um dia significou madeira no jogo. */
const NOMES_PROIBIDOS = ['madeira', 'galho', 'graveto', 'tronco', 'lenha', 'wood', 'log', 'stick'];

const contemNomeProibido = (texto: string): boolean =>
  NOMES_PROIBIDOS.some((proibido) => texto.toLowerCase().includes(proibido));

describe('a madeira nao existe mais', () => {
  it('nao ha recurso de madeira no catalogo', () => {
    for (const kind of RESOURCE_KINDS) {
      expect(contemNomeProibido(kind), `recurso "${kind}"`).toBe(false);
    }
  });

  it('o inventario vazio nao tem casa para madeira', () => {
    expect(Object.keys(emptyInventory())).not.toContain('madeira');
  });

  /**
   * Os quatro que sustentam a economia depois do corte.
   *
   * Moeda nao e recurso — ela vive na economia, e nao no inventario —, entao o
   * que se afirma aqui e o trio colhivel mais os recursos de regiao que dao
   * destino as compras.
   */
  it('a economia principal gira em fruta, pedra e concha', () => {
    for (const kind of ['fruta', 'pedra', 'concha'] as ResourceKind[]) {
      expect(RESOURCE_KINDS).toContain(kind);
    }
  });

  it('nenhum rotulo de recurso fala em madeira', () => {
    for (const [kind, rotulo] of Object.entries(RESOURCE_LABELS)) {
      expect(contemNomeProibido(rotulo.one), `${kind}.one`).toBe(false);
      expect(contemNomeProibido(rotulo.many), `${kind}.many`).toBe(false);
    }
  });
});

describe('nenhuma receita depende de madeira', () => {
  it('as construcoes pedem so recursos que existem', () => {
    for (const spec of Object.values(STRUCTURES)) {
      for (const kind of Object.keys(spec.recipe)) {
        expect(RESOURCE_KINDS, `receita de ${spec.kind}`).toContain(kind);
        expect(contemNomeProibido(kind), `receita de ${spec.kind}`).toBe(false);
      }
    }
  });

  it('a fogueira passou a custar conchas no lugar da madeira', () => {
    expect(STRUCTURES.fogueira.recipe).toEqual({ concha: 8, pedra: 2 });
    expect(STRUCTURES.cerca.recipe).toEqual({ concha: 6 });
  });

  it('os itens da loja pedem so recursos que existem', () => {
    for (const item of Object.values(SHOP_ITEMS)) {
      for (const kind of Object.keys(item.recipe)) {
        expect(RESOURCE_KINDS, `receita de ${item.kind}`).toContain(kind);
        expect(contemNomeProibido(kind), `receita de ${item.kind}`).toBe(false);
      }
    }
  });
});

describe('o mundo nao gera madeira nem galho', () => {
  it('nenhuma regiao deposita ou colhe madeira', () => {
    for (const regiao of REGIONS) {
      for (const kind of [...regiao.deposits, ...regiao.harvest]) {
        expect(RESOURCE_KINDS, `regiao ${regiao.id}`).toContain(kind);
        expect(contemNomeProibido(kind), `regiao ${regiao.id}`).toBe(false);
      }
    }
  });

  /**
   * Varias sementes, e nao uma.
   *
   * O tipo de cada no sai de um sorteio sobre `regiao.deposits`; conferir uma
   * semente so provaria que aquele sorteio nao deu madeira, e nao que ela saiu
   * da lista.
   */
  it('nenhum no gerado e de madeira, em nenhuma semente', () => {
    for (let seed = 0; seed < 25; seed += 1) {
      for (const no of createNodes(createRng(seed))) {
        expect(RESOURCE_KINDS, `semente ${seed}`).toContain(no.kind);
        expect(contemNomeProibido(no.kind), `semente ${seed}`).toBe(false);
      }
    }
  });
});

describe('as arvores sao so frutiferas', () => {
  it('so a fruta se planta', () => {
    expect(PLANTABLE_RESOURCE_KINDS).toEqual(['fruta']);
  });

  it('uma muda sempre vira fruta, nunca madeira', () => {
    expect(plantedResourceKind('arvore-frutifera')).toBe('fruta');
  });
});

describe('nenhum idioma fala em madeira', () => {
  it('os substantivos de recurso nao mencionam galho nem madeira', () => {
    for (const locale of SUPPORTED_LOCALES) {
      const bundle = bundleFor(locale);
      for (const [kind, nouns] of Object.entries(bundle.resources)) {
        for (const [campo, forms] of Object.entries(nouns)) {
          expect(contemNomeProibido(forms.one), `${locale}.${kind}.${campo}.one`).toBe(false);
          expect(contemNomeProibido(forms.many), `${locale}.${kind}.${campo}.many`).toBe(false);
        }
      }
    }
  });
});
