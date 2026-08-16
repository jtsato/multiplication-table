import type { MascotId, MascotKind } from './types';

/**
 * Companheiros escolhiveis.
 *
 * Cada um tem um enfeite proprio no topo (`kind`) e cores fixas, que nao
 * mudam com a ilha - assim a crianca reconhece seu companheiro em qualquer
 * bioma. Puramente cosmetico, igual a customizacao do personagem.
 */

export interface MascotColors {
  accent: string;
  accentSoft: string;
  blockDark: string;
}

export interface MascotDefinition {
  id: MascotId;
  kind: MascotKind;
  colors: MascotColors;
}

export const MASCOT_IDS: readonly MascotId[] = ['bloco', 'brasa', 'folha', 'flor', 'cristal'];

const MASCOTS: Record<MascotId, MascotDefinition> = {
  bloco: {
    id: 'bloco',
    kind: 'antenna',
    colors: { accent: '#3aa0ff', accentSoft: '#eaf6ff', blockDark: '#1c7fd6' },
  },
  brasa: {
    id: 'brasa',
    kind: 'flame',
    colors: { accent: '#ff8a4c', accentSoft: '#ffe14d', blockDark: '#c25a2f' },
  },
  folha: {
    id: 'folha',
    kind: 'leaf',
    colors: { accent: '#4da33d', accentSoft: '#9be870', blockDark: '#2c7a45' },
  },
  flor: {
    id: 'flor',
    kind: 'petals',
    colors: { accent: '#ff5d8f', accentSoft: '#ffd6e6', blockDark: '#c23f6b' },
  },
  cristal: {
    id: 'cristal',
    kind: 'crystal',
    colors: { accent: '#c86bff', accentSoft: '#7ef0e0', blockDark: '#8e46c9' },
  },
};

export function getMascotDefinition(id: MascotId): MascotDefinition {
  return MASCOTS[id] ?? MASCOTS.bloco;
}
