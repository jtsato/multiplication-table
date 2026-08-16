export type AchievementDefinition = {
  id: string;
  title: string;
  description: string;
};

export type AchievementProgress = AchievementDefinition & {
  unlocked: boolean;
};

export const ACHIEVEMENT_CATALOG: AchievementDefinition[] = [
  { id: "first-day", title: "Primeiro dia", description: "Feche um dia de atendimento." },
  { id: "first-expansion", title: "Loja crescendo", description: "Compre a primeira expansão." },
  { id: "new-chapter", title: "Novo capítulo", description: "Abra um novo capítulo da loja." },
];

export function getAchievementProgress(unlockedIds: string[]): AchievementProgress[] {
  return ACHIEVEMENT_CATALOG.map((achievement) => ({
    ...achievement,
    unlocked: unlockedIds.includes(achievement.id),
  }));
}
