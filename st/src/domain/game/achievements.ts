export type AchievementContext = {
  completedVisits: number;
  purchasedProducts: number;
  chapter: number;
};

export function evaluateAchievements(context: AchievementContext): string[] {
  const achievements: string[] = [];
  if (context.completedVisits >= 5) achievements.push("first-day");
  if (context.purchasedProducts >= 1) achievements.push("first-expansion");
  if (context.chapter >= 2) achievements.push("new-chapter");
  return achievements;
}
