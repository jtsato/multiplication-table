export function createDefaultState() {
  const islands = {};
  for (let table = 2; table <= 10; table += 1) {
    islands[String(table)] = {
      table,
      status: table === 2 ? 'available' : 'locked',
      bestAccuracy: 0,
      missionsCompleted: 0,
      completedAt: null,
    };
  }

  return {
    schemaVersion: 1,
    player: {
      created: false,
      avatar: 'girl',
      color: 'coral',
    },
    settings: {
      locale: 'pt-BR',
      musicEnabled: true,
      soundEffectsEnabled: true,
    },
    progress: { islands },
    statistics: {
      totalQuestions: 0,
      totalCorrect: 0,
      totalIncorrect: 0,
      currentStreak: 0,
      bestStreak: 0,
      playSessions: 0,
      facts: {},
    },
    achievements: [],
  };
}
