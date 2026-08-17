import { useCallback, useEffect, useReducer, useRef, useState, type ReactNode } from "react";
import { useI18n } from "../../shared/i18n/I18nContext";
import { battleReducer, createBattle, hpRatio } from "./battle";
import { HeroAvatar } from "../../art/HeroAvatar";
import { MonsterAvatar } from "../../art/MonsterAvatar";
import { generateAlternatives } from "../math-question/generate-alternatives";
import type { Rng } from "../math-question/question.types";
import type { BattleAction, Combatant } from "./battle.types";
import {
  advanceProgress,
  initialProgress,
  isGameComplete,
  nextMonster,
  nextTables,
  type Progress,
} from "../progression/progression";
import {
  markSeen,
  pickNextFact,
  recordAnswer,
  upsertFact,
  type FactStats,
} from "../adaptive-review/adaptive-review";
import { saveRepository } from "../save-game/local-storage.repository";
import { SAVE_VERSION } from "../save-game/repository";

const QUESTION_DELAY_MS = 700;

function BattleUnit({
  combatant,
  label,
  portrait,
}: {
  combatant: Combatant;
  label: string;
  portrait: ReactNode;
}) {
  const { t } = useI18n();
  const ratio = hpRatio(combatant.hp, combatant.maxHp);

  return (
    <div className="battle-unit">
      {portrait}
      <h3>{label}</h3>
      <div
        role="progressbar"
        aria-label={label}
        aria-valuemin={0}
        aria-valuemax={combatant.maxHp}
        aria-valuenow={combatant.hp}
        aria-valuetext={t("battle.hp", { hp: combatant.hp, maxHp: combatant.maxHp })}
        className="hp-bar"
      >
        <span className="hp-bar-fill" style={{ width: `${ratio * 100}%` }} aria-hidden="true" />
      </div>
      <p className="hp-text">{t("battle.hp", { hp: combatant.hp, maxHp: combatant.maxHp })}</p>
    </div>
  );
}

export function BattleEndPanel({
  phase,
  monsterName,
  allDefeated = false,
  onPlayAgain,
}: {
  phase: "victory" | "defeat";
  monsterName: string;
  allDefeated?: boolean;
  onPlayAgain: () => void;
}) {
  const { t } = useI18n();
  const headingRef = useRef<HTMLHeadingElement>(null);
  const victory = phase === "victory";

  // Fim de batalha é uma "tela nova": o título recebe o foco.
  useEffect(() => {
    headingRef.current?.focus();
  }, []);

  const messageKey = victory
    ? allDefeated
      ? "battle.victoryAll"
      : "battle.victoryMessage"
    : "battle.defeatMessage";

  return (
    <div className="battle-end">
      <h3 id="battle-end-heading" tabIndex={-1} ref={headingRef} className="battle-end-heading">
        {t(victory ? "battle.victory" : "battle.defeat")}
      </h3>
      <p>{t(messageKey, { monster: monsterName })}</p>
      <button type="button" className="button-primary" onClick={onPlayAgain}>
        {t("battle.playAgain")}
      </button>
    </div>
  );
}

export function BattleScreen({
  rng = Math.random,
  progress = initialProgress(),
  onProgressChange = () => {},
}: {
  rng?: Rng;
  progress?: Progress;
  onProgressChange?: (progress: Progress) => void;
}) {
  const { t, locale } = useI18n();
  const monster = nextMonster(progress);
  const tables = nextTables(progress);
  const [battle, dispatch] = useReducer(battleReducer, null, () => {
    const saved = saveRepository.load();
    return saved?.battle ?? createBattle(monster);
  });
  // Histórico por fato (reforço adaptativo) também vem do save.
  const [facts, setFacts] = useState<FactStats[]>(() => saveRepository.load()?.facts ?? []);
  const questionIndexRef = useRef(0);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const alternativesRef = useRef<HTMLDivElement>(null);

  // Auto-save: qualquer mudança na batalha/progresso/fatos persiste.
  useEffect(() => {
    saveRepository.save({ version: SAVE_VERSION, locale, battle, progress, facts });
  }, [battle, locale, progress, facts]);

  // Geração ponderada: reforça erros e fatos esquecidos (regra 12 da estratégia).
  const gerarPergunta = useCallback((): BattleAction => {
    const now = questionIndexRef.current;
    questionIndexRef.current += 1;
    const fact = pickNextFact(tables, facts, rng, now);
    setFacts((prev) => {
      const atual = prev.find((f) => f.a === fact.a && f.b === fact.b);
      return upsertFact(prev, markSeen(atual, fact, now));
    });
    return {
      type: "BEGIN_QUESTION",
      question: fact,
      alternatives: generateAlternatives(fact, rng),
    };
  }, [tables, facts, rng]);

  // Registra o desfecho da resposta no histórico do fato (reforço adaptativo).
  const handleAnswer = useCallback(
    (value: number) => {
      if (battle.question) {
        const { a, b } = battle.question;
        const correct = value === battle.question.answer;
        setFacts((prev) => {
          const atual = prev.find((f) => f.a === a && f.b === b);
          return atual ? upsertFact(prev, recordAnswer(atual, correct)) : prev;
        });
      }
      dispatch({ type: "ANSWER", value });
    },
    [battle.question],
  );

  // Gerenciamento de foco: ao entrar na batalha (intro), o título recebe o foco.
  useEffect(() => {
    if (battle.phase === "intro") {
      headingRef.current?.focus();
    }
  }, [battle.phase]);

  // Primeira pergunta na intro; novas perguntas após cada turno resolvido.
  useEffect(() => {
    if (battle.phase === "intro") {
      dispatch(gerarPergunta());
    } else if (battle.phase === "hero-turn" || battle.phase === "monster-turn") {
      const timer = setTimeout(() => dispatch(gerarPergunta()), QUESTION_DELAY_MS);
      return () => clearTimeout(timer);
    }
  }, [battle.phase, gerarPergunta]);

  // Atalhos opcionais 1..4 para as alternativas (regra 11 da estratégia).
  useEffect(() => {
    if (battle.phase !== "question") return;
    const onKeyDown = (event: KeyboardEvent) => {
      const index = Number(event.key) - 1;
      if (index >= 0 && index < battle.alternatives.length) {
        handleAnswer(battle.alternatives[index]);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [battle.phase, battle.alternatives, handleAnswer]);

  // Após responder, a próxima pergunta devolve o foco à primeira alternativa.
  useEffect(() => {
    if (battle.phase === "question" && battle.log.length > 0) {
      alternativesRef.current?.querySelector("button")?.focus();
    }
  }, [battle.phase, battle.log.length]);

  const monsterName = t(battle.monster.nameKey);
  const lastEntry = battle.log[battle.log.length - 1];
  const statusText = lastEntry
    ? t(lastEntry.key, { ...lastEntry.params, monster: monsterName })
    : t("battle.intro", { monster: monsterName });

  // Vitória avança a jornada; o próximo combate usa o monstro/tabuadas seguintes.
  // Derrota reinicia o mesmo monstro (sem avançar).
  function handlePlayAgain() {
    const venceu = battle.phase === "victory";
    const avancado = advanceProgress(progress);
    const alvo = venceu && !isGameComplete(avancado) ? avancado : progress;
    if (alvo !== progress) onProgressChange(alvo);
    dispatch({ type: "START_BATTLE", monster: nextMonster(alvo) });
  }

  return (
    <section aria-labelledby="battle-heading" className="battle-screen">
      <h2 id="battle-heading" tabIndex={-1} ref={headingRef} className="battle-heading">
        {t("battle.title")}
      </h2>
      <p role="status" className="battle-status">
        {lastEntry && (
          <span
            className={
              lastEntry.key === "battle.almost"
                ? "status-icon status-icon--err"
                : "status-icon status-icon--ok"
            }
            aria-hidden="true"
          >
            {lastEntry.key === "battle.almost" ? "✗" : "✓"}
          </span>
        )}
        {statusText}
      </p>
      {battle.combo > 0 && <p className="combo">{t("battle.combo", { combo: battle.combo })}</p>}
      <div className="battlefield">
        <BattleUnit
          combatant={battle.hero}
          label={t(battle.hero.nameKey)}
          portrait={<HeroAvatar size={72} title={t(battle.hero.nameKey)} className="portrait" />}
        />
        <BattleUnit
          combatant={battle.monster}
          label={monsterName}
          portrait={
            <MonsterAvatar
              monsterId={battle.monster.id}
              size={72}
              title={monsterName}
              className="portrait"
            />
          }
        />
      </div>
      {battle.phase === "question" && battle.question && (
        <div className="question-panel">
          <p className="question" aria-live="polite">
            {t("math.question", { a: battle.question.a, b: battle.question.b })}
          </p>
          <div
            ref={alternativesRef}
            role="group"
            aria-label={t("math.alternatives")}
            className="alternatives"
          >
            {battle.alternatives.map((alt, index) => (
              <button
                key={alt}
                type="button"
                className="alternative"
                aria-keyshortcuts={String(index + 1)}
                onClick={() => handleAnswer(alt)}
              >
                {alt}
              </button>
            ))}
          </div>
          {battle.superReady && (
            <button
              type="button"
              className="super-button"
              onClick={() => dispatch({ type: "USE_SUPER_ATTACK" })}
            >
              {t("battle.superButton")}
            </button>
          )}
        </div>
      )}
      {(battle.phase === "victory" || battle.phase === "defeat") && (
        <BattleEndPanel
          phase={battle.phase}
          monsterName={monsterName}
          allDefeated={battle.phase === "victory" && isGameComplete(advanceProgress(progress))}
          onPlayAgain={handlePlayAgain}
        />
      )}
    </section>
  );
}
