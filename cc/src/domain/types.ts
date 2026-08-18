/**
 * Tipos centrais do dominio do jogo.
 *
 * Regra: este arquivo nao importa nada de React, DOM ou persistencia.
 * Ele descreve apenas "o que o jogo e", nunca "como ele e desenhado ou salvo".
 */

/** Idiomas suportados. Adicionar um idioma novo comeca por aqui. */
export type Locale = 'pt-BR' | 'en-US';

export const SUPPORTED_LOCALES: readonly Locale[] = ['pt-BR', 'en-US'] as const;

/** Chave canonica de uma multiplicacao, sempre no formato `axb`, ex: "7x3". */
export type FactKey = string;

/** Uma multiplicacao concreta. `a` e sempre a tabuada, `b` o multiplicador. */
export interface MultiplicationFact {
  a: number;
  b: number;
}

/** Uma pergunta pronta para ser exibida na tela. */
export interface Question {
  fact: MultiplicationFact;
  key: FactKey;
  answer: number;
  /** Alternativas ja embaralhadas. Contem exatamente uma resposta correta. */
  options: number[];
  /** Indice da resposta correta dentro de `options`. */
  correctIndex: number;
}

// ---------------------------------------------------------------------------
// Jogador
// ---------------------------------------------------------------------------

export type AvatarBase = 'boy' | 'girl';
export type SkinToneId = 'skin1' | 'skin2' | 'skin3' | 'skin4';
export type HairStyleId = 'short' | 'long' | 'curly' | 'ponytail';
export type OutfitColorId = 'red' | 'blue' | 'green' | 'purple' | 'orange' | 'pink';
export type AccessoryId = 'none' | 'cap' | 'glasses' | 'crown';

/** Companheiro escolhido para acompanhar o personagem nas missoes. */
export type MascotId = 'bloco' | 'brasa' | 'folha' | 'flor' | 'cristal';
/** Formato do enfeite no topo do mascote; um por companheiro. */
export type MascotKind = 'antenna' | 'flame' | 'leaf' | 'petals' | 'crystal';

/**
 * Aparencia do personagem. Puramente cosmetico: nada aqui influencia
 * dificuldade, conteudo pedagogico ou progressao.
 */
export interface AvatarConfig {
  base: AvatarBase;
  skin: SkinToneId;
  hair: HairStyleId;
  outfit: OutfitColorId;
  accessory: AccessoryId;
}

export interface PlayerProfile {
  /** Nome opcional; o MVP nao pede nome, mas o campo ja existe. */
  name: string;
  avatar: AvatarConfig;
  /** Companheiro que acompanha o personagem durante as missoes. */
  mascotId: MascotId;
  createdAt: string;
  /** Falso ate o jogador concluir a criacao de personagem. */
  onboardingCompleted: boolean;
  /** Falso ate o tutorial curto da primeira missao ser visto. */
  tutorialSeen: boolean;
}

// ---------------------------------------------------------------------------
// Configuracoes
// ---------------------------------------------------------------------------

export interface GameSettings {
  locale: Locale;
  musicEnabled: boolean;
  soundEffectsEnabled: boolean;
  /** Reduz animacoes para criancas sensiveis a movimento. */
  reducedMotion: boolean;
  /**
   * Abre a tabuada da ilha ao entrar nela pelo mapa. Ligado por padrao: o
   * primeiro contato com uma tabuada nova nao deveria ser uma pergunta.
   */
  studyBeforeMission: boolean;
}

// ---------------------------------------------------------------------------
// Progresso
// ---------------------------------------------------------------------------

export type IslandStatus = 'locked' | 'available' | 'inProgress' | 'completed';

export interface IslandProgress {
  /** Numero da tabuada, 2..10. */
  table: number;
  unlocked: boolean;
  completed: boolean;
  /** Ids das missoes ja concluidas nesta ilha. */
  completedMissionIds: string[];
  /** 0..3 estrelas, definidas pela precisao acumulada na ilha. */
  stars: number;
  questionsAnswered: number;
  /** Acertos de primeira tentativa; base do calculo de precisao. */
  firstTryCorrect: number;
  completedAt: string | null;
}

export interface GameProgress {
  islands: Record<string, IslandProgress>;
  /** Tabuada atualmente selecionada no mapa. */
  currentTable: number;
}

// ---------------------------------------------------------------------------
// Dominio pedagogico
// ---------------------------------------------------------------------------

/** Desempenho acumulado de UMA multiplicacao especifica. */
export interface FactStat {
  attempts: number;
  correct: number;
  incorrect: number;
  lastSeenAt: string | null;
  /** Resultado da ultima tentativa; alimenta o peso de revisao. */
  lastWasCorrect: boolean;
  /** Media movel exponencial do desempenho recente (0..1). */
  recentScore: number;
  /** Nota de dominio combinando taxa historica e desempenho recente (0..1). */
  masteryScore: number;
}

export type FactStats = Record<FactKey, FactStat>;

export interface PlayerStatistics {
  totalQuestions: number;
  totalCorrect: number;
  totalIncorrect: number;
  currentStreak: number;
  bestStreak: number;
  playSessions: number;
  facts: FactStats;
}

// ---------------------------------------------------------------------------
// Conquistas
// ---------------------------------------------------------------------------

export type AchievementId =
  | 'firstCorrect'
  | 'tenCorrect'
  | 'fiftyCorrect'
  | 'streakFive'
  | 'streakTen'
  | 'firstMission'
  | 'tableTwoDone'
  | 'halfArchipelago'
  | 'allIslands'
  | 'perfectChallenge';

export interface AchievementState {
  id: AchievementId;
  unlocked: boolean;
  unlockedAt: string | null;
}

// ---------------------------------------------------------------------------
// Modo Desafio
// ---------------------------------------------------------------------------

/** Recorde do Modo Desafio. As regras vivem em `domain/challenge.ts`. */
export interface ChallengeRecord {
  /** Melhor numero de acertos de primeira numa corrida. */
  bestScore: number;
  /** Duracao da corrida que fez o recorde, em ms. Desempata scores iguais. */
  bestTimeMs: number | null;
  runs: number;
  lastPlayedAt: string | null;
}

// ---------------------------------------------------------------------------
// Estado completo
// ---------------------------------------------------------------------------

export interface GameState {
  schemaVersion: number;
  player: PlayerProfile;
  settings: GameSettings;
  progress: GameProgress;
  statistics: PlayerStatistics;
  achievements: AchievementState[];
  /** Recorde do Modo Desafio, liberado ao concluir o arquipelago. */
  challenge: ChallengeRecord;
}
