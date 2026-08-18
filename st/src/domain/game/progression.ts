export type Chapter = {
  number: number;
  title: string;
  requiredDay: number;
  visualChange: string;
};

export const CHAPTERS: Chapter[] = [
  { number: 1, title: "A porta aberta", requiredDay: 1, visualChange: "balcão novo" },
  {
    number: 2,
    title: "Mais ideias na prateleira",
    requiredDay: 3,
    visualChange: "prateleira lateral",
  },
  { number: 3, title: "A loja ganha espaço", requiredDay: 7, visualChange: "área de exposição" },
  {
    number: 4,
    title: "Uma loja cheia de histórias",
    requiredDay: 12,
    visualChange: "fachada iluminada",
  },
];

export function getChapterForDay(day: number): Chapter {
  return [...CHAPTERS].reverse().find((chapter) => day >= chapter.requiredDay) ?? CHAPTERS[0];
}
