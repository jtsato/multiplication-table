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

  // Jogador
  playerBody: '#f2a03d',
  playerHead: '#ffd9a0',

  // Construcoes
  fire: '#ff8a3d',
  fireCore: '#ffe08a',
  fence: '#a9743f',

  // Inimigos
  enemy: '#3b2f52',
  enemyEye: '#ff5470',

  // Ceu por fase do ciclo
  skyDay: '#8fd4ff',
  skyDusk: '#f2925c',
  skyNight: '#111a33',
  skyDawn: '#ffb98a',

  // Luz do sol por fase
  sunDay: '#fff6e0',
  sunDusk: '#ff9a5c',
  sunNight: '#4a6ba8',
  sunDawn: '#ffd0a8',

  // Feedback do desafio
  correct: '#3fbf6f',
  wrong: '#ff6b6b',
  highlight: '#ffe66d',
} as const;

export type PaletteColor = keyof typeof palette;
