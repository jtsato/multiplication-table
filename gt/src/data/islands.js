export const ISLANDS = [
  { table: 2, biomeKey: 'biome.meadow', constructionKey: 'construction.bridge', theme: 'meadow', icon: '🌼' },
  { table: 3, biomeKey: 'biome.forest', constructionKey: 'construction.treehouse', theme: 'forest', icon: '🌲' },
  { table: 4, biomeKey: 'biome.crystal', constructionKey: 'construction.tower', theme: 'crystal', icon: '💎' },
  { table: 5, biomeKey: 'biome.beach', constructionKey: 'construction.boat', theme: 'beach', icon: '⛵' },
  { table: 6, biomeKey: 'biome.magic', constructionKey: 'construction.garden', theme: 'magic', icon: '✨' },
  { table: 7, biomeKey: 'biome.cave', constructionKey: 'construction.gate', theme: 'cave', icon: '🪨' },
  { table: 8, biomeKey: 'biome.ice', constructionKey: 'construction.igloo', theme: 'ice', icon: '❄️' },
  { table: 9, biomeKey: 'biome.volcano', constructionKey: 'construction.lighthouse', theme: 'volcano', icon: '🌋' },
  { table: 10, biomeKey: 'biome.city', constructionKey: 'construction.castle', theme: 'city', icon: '🏰' },
];

export function getIsland(table) {
  return ISLANDS.find((island) => island.table === table);
}
