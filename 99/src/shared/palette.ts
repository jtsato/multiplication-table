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

  // Cenario
  trunk: '#7a5230',
  leaves: '#2f8f4f',
  leavesLight: '#49b06a',
  rock: '#8d949e',
  berry: '#d94f6a',

  // As colheitas de regiao. Cada uma precisa ler de longe como "isto e daqui":
  // a concha da praia, o peixe do porto, o cogumelo do bosque, o cristal da
  // cachoeira, o mel do pomar e o gelo do pico.
  shell: '#f6e3c8',
  shellBase: '#e8d3a8',
  fish: '#8fd3f4',
  barrel: '#a9743f',
  mushroom: '#e07a5f',
  stump: '#6b4a2f',
  crystal: '#7fe3f0',
  crystalBase: '#4a7f95',
  honey: '#f2b134',
  hive: '#c98d4f',
  ice: '#cfeaf7',
  iceBase: '#9fc7de',

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
