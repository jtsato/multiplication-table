/**
 * Paleta low poly do jogo.
 *
 * Toda a arte e gerada em codigo a partir de primitivas do Three com
 * `flatShading` — nao ha textura nem asset externo. As cores ficam centralizadas
 * aqui para que a cena tenha unidade visual e para que o ciclo dia/noite
 * (Fatia 5) tenha pontos de interpolacao nomeados.
 */
export const palette = {
  // Terreno
  grass: '#5cb85c',
  grassDark: '#3f8f45',
  sand: '#e6c88a',
  water: '#2f7fbf',
  // Espuma da cachoeira: quase branca, para marcar onde a agua bate.
  foam: '#dff1fb',

  // Cenario
  trunk: '#7a5230',
  leaves: '#2f8f4f',
  leavesLight: '#49b06a',
  // Moita escura: a base sob as frutas. Verde claro tinha praticamente a mesma
  // luminancia do vermelho da fruta, e as frutas a contar sumiam nela.
  bushDark: '#1a4f2c',
  rock: '#8d949e',
  // Rocha escura: a base sob as pedras. Sem ela, item e base tinham a mesma
  // cor exata e as pedras a contar sumiam dentro do proprio no.
  rockDark: '#4e545d',
  berry: '#d94f6a',

  // As colheitas de regiao. Cada uma precisa ler de longe como "isto e daqui":
  // a concha da praia, o peixe do porto, o cogumelo do bosque, o cristal da
  // cachoeira, o mel do pomar e o gelo do pico.
  shell: '#f6e3c8',
  shellBase: '#b08e55',
  fish: '#8fd3f4',
  barrel: '#a9743f',
  mushroom: '#e07a5f',
  stump: '#6b4a2f',
  crystal: '#7fe3f0',
  crystalBase: '#4a7f95',
  honey: '#f2b134',
  hive: '#7d4f22',
  ice: '#cfeaf7',
  iceBase: '#5b87a3',

  // Jogador. A cor do corpo e da pele vem da escolha da crianca (slice avatar);
  // estas ficam como padrao e para o que nao e personalizavel.
  playerBody: '#f2a03d',
  playerHead: '#ffd9a0',
  playerHair: '#4a3728',
  crown: '#ffd166',
  glasses: '#2b3242',

  // Construcoes
  fire: '#ff8a3d',
  fireCore: '#ffe08a',
  fence: '#a9743f',

  // As pontes. Madeira mais clara que o tronco, para o tabuleiro ler como
  // caminho e nao como arvore caida atravessada no rio.
  bridgeDeck: '#c08b52',
  bridgeRail: '#a9743f',

  // Lanterna: quente, para contrastar com o azul do luar.
  lanternLight: '#ffd98a',
  // Vaga-lume: verde-limao quente, para nao se confundir com a lanterna nem com
  // as janelas da casa — a crianca precisa reconhecer socorro de longe.
  firefly: '#c8f77a',

  // A casa. Madeira clara e telhado quente: tem que ler como abrigo de longe.
  homeWall: '#d9b48a',
  homeFloor: '#8a6a4a',
  homeRoof: '#c2593f',
  homeGlow: '#ffdc9e',
  homeMirror: '#bcd9e8',
  homeChart: '#f4ead6',
  homeBed: '#5f8fbf',
  homePillow: '#f2f0e6',

  // Ceu por fase do ciclo
  skyDay: '#8fd4ff',
  skyDusk: '#f2925c',
  skyNight: '#1b2a52',
  skyDawn: '#ffb98a',

  // Luz do sol por fase
  sunDay: '#fff6e0',
  sunDusk: '#ff9a5c',
  sunNight: '#8fa8de',
  sunDawn: '#ffd0a8',

  /**
   * Cor da luz ambiente da noite, separada da cor do ceu.
   *
   * A luz hemisferica usava a propria cor do ceu, e a noite isso a tornava
   * inutil: `#1b2a52` e quase preto, entao qualquer intensidade multiplicada
   * por ele continuava dando preto. O ceu pode ser fundo, a luz precisa ser luz.
   */
  moonAmbient: '#7d93c9',

  // Feedback do desafio
  correct: '#3fbf6f',
  wrong: '#ff6b6b',
  highlight: '#ffe66d',
} as const;

export type PaletteColor = keyof typeof palette;

/**
 * A cor de cada regiao.
 *
 * Sem isto o Pico a sete metros de altura tinha exatamente a mesma grama da
 * Praia, e as seis regioes eram o mesmo lugar com colheitas diferentes. O que a
 * crianca precisa reconhecer de longe e **onde ela esta** — e o lugar carrega a
 * tabuada junto.
 *
 * `tuft` e a cor dos tufos do chao; na neve do Pico, tufo verde nao existe.
 */
export const REGION_PALETTE = {
  praia: { ground: '#5cb85c', shore: '#e6c88a', tuft: '#3f8f45' },
  porto: { ground: '#63b06a', shore: '#d9c39a', tuft: '#40894a' },
  bosque: { ground: '#3f8f45', shore: '#cbb98a', tuft: '#2c6b34' },
  cachoeira: { ground: '#4fae86', shore: '#bfd4c8', tuft: '#357f61' },
  pomar: { ground: '#7cc45a', shore: '#e0cf95', tuft: '#5a9d3d' },
  // Neve: o Pico e o unico lugar do jogo sem verde nenhum.
  pico: { ground: '#e8f1f7', shore: '#c9d8e2', tuft: '#b8cddb' },
} as const;
