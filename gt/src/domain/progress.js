function withAchievement(achievements, id, condition) {
  if (!condition || achievements.includes(id)) return achievements;
  return [...achievements, id];
}

export function recordAnswer(state, fact, correct, timestamp = new Date().toISOString()) {
  const previous = state.statistics.facts[fact.key] ?? {
    attempts: 0,
    correct: 0,
    incorrect: 0,
    masteryScore: 0,
    lastSeenAt: null,
  };

  const attempts = previous.attempts + 1;
  const correctCount = previous.correct + (correct ? 1 : 0);
  const incorrectCount = previous.incorrect + (correct ? 0 : 1);
  const currentStreak = correct ? state.statistics.currentStreak + 1 : 0;
  const totalCorrect = state.statistics.totalCorrect + (correct ? 1 : 0);

  let achievements = [...state.achievements];
  achievements = withAchievement(achievements, 'first-correct', totalCorrect >= 1);
  achievements = withAchievement(achievements, 'five-streak', currentStreak >= 5);
  achievements = withAchievement(achievements, 'ten-correct', totalCorrect >= 10);
  achievements = withAchievement(achievements, 'fifty-correct', totalCorrect >= 50);

  return {
    ...state,
    statistics: {
      ...state.statistics,
      totalQuestions: state.statistics.totalQuestions + 1,
      totalCorrect,
      totalIncorrect: state.statistics.totalIncorrect + (correct ? 0 : 1),
      currentStreak,
      bestStreak: Math.max(state.statistics.bestStreak, currentStreak),
      facts: {
        ...state.statistics.facts,
        [fact.key]: {
          attempts,
          correct: correctCount,
          incorrect: incorrectCount,
          masteryScore: Number((correctCount / attempts).toFixed(2)),
          lastSeenAt: timestamp,
        },
      },
    },
    achievements,
  };
}

export function completeMission(state, table, accuracy, timestamp = new Date().toISOString()) {
  const key = String(table);
  const nextKey = table < 10 ? String(table + 1) : null;
  const islands = {
    ...state.progress.islands,
    [key]: {
      ...state.progress.islands[key],
      status: 'completed',
      bestAccuracy: Math.max(state.progress.islands[key].bestAccuracy, accuracy),
      missionsCompleted: state.progress.islands[key].missionsCompleted + 1,
      completedAt: timestamp,
    },
  };

  if (nextKey && islands[nextKey].status === 'locked') {
    islands[nextKey] = { ...islands[nextKey], status: 'available' };
  }

  let achievements = [...state.achievements];
  achievements = withAchievement(achievements, 'first-island', true);
  achievements = withAchievement(achievements, `table-${table}`, true);
  achievements = withAchievement(achievements, 'all-tables', table === 10);

  return {
    ...state,
    progress: { ...state.progress, islands },
    achievements,
  };
}
