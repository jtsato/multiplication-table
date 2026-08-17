import { useEffect, useReducer, useRef } from "react";
import { useI18n } from "../../shared/i18n/I18nContext";
import { battleReducer, createBattle, hpRatio } from "./battle";
import { SLIME } from "./monsters";
import { DEFAULT_TABLES, generateQuestion } from "../math-question/generate-question";
import { generateAlternatives } from "../math-question/generate-alternatives";
import type { Rng } from "../math-question/question.types";
import type { BattleAction, Combatant } from "./battle.types";
import { saveRepository } from "../save-game/local-storage.repository";
import { SAVE_VERSION } from "../save-game/repository";

const QUESTION_DELAY_MS = 700;

function nextQuestionAction(rng: Rng): BattleAction {
  const question = generateQuestion(DEFAULT_TABLES, rng);
  return {
    type: "BEGIN_QUESTION",
    question,
    alternatives: generateAlternatives(question, rng),
  };
}

function BattleUnit({ combatant, label }: { combatant: Combatant; label: string }) {
  const { t } = useI18n();
  const ratio = hpRatio(combatant.hp, combatant.maxHp);

  return (
    <div className="battle-unit">
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
  onPlayAgain,
}: {
  phase: "victory" | "defeat";
  monsterName: string;
  onPlayAgain: () => void;
}) {
  const { t } = useI18n();
  const headingRef = useRef<HTMLHeadingElement>(null);
  const victory = phase === "victory";

  // Fim de batalha é uma "tela nova": o título recebe o foco.
  useEffect(() => {
    headingRef.current?.focus();
  }, []);

  return (
    <div className="battle-end">
      <h3 id="battle-end-heading" tabIndex={-1} ref={headingRef} className="battle-end-heading">
        {t(victory ? "battle.victory" : "battle.defeat")}
      </h3>
      <p>
        {t(victory ? "battle.victoryMessage" : "battle.defeatMessage", {
          monster: monsterName,
        })}
      </p>
      <button type="button" className="button-primary" onClick={onPlayAgain}>
        {t("battle.playAgain")}
      </button>
    </div>
  );
}

export function BattleScreen({ rng = Math.random }: { rng?: Rng }) {
  const { t, locale } = useI18n();
  const [battle, dispatch] = useReducer(battleReducer, null, () => {
    const saved = saveRepository.load();
    return saved?.battle ?? createBattle(SLIME);
  });
  const headingRef = useRef<HTMLHeadingElement>(null);
  const alternativesRef = useRef<HTMLDivElement>(null);

  // Auto-save: qualquer mudança na batalha persiste (schema versionado).
  useEffect(() => {
    saveRepository.save({ version: SAVE_VERSION, locale, battle });
  }, [battle, locale]);

  // Gerenciamento de foco: ao entrar na batalha (intro), o título recebe o foco.
  useEffect(() => {
    if (battle.phase === "intro") {
      headingRef.current?.focus();
    }
  }, [battle.phase]);

  // Primeira pergunta na intro; novas perguntas após cada turno resolvido.
  useEffect(() => {
    if (battle.phase === "intro") {
      dispatch(nextQuestionAction(rng));
    } else if (battle.phase === "hero-turn" || battle.phase === "monster-turn") {
      const timer = setTimeout(() => dispatch(nextQuestionAction(rng)), QUESTION_DELAY_MS);
      return () => clearTimeout(timer);
    }
  }, [battle.phase, rng]);

  // Atalhos opcionais 1..4 para as alternativas (regra 11 da estratégia).
  useEffect(() => {
    if (battle.phase !== "question") return;
    const onKeyDown = (event: KeyboardEvent) => {
      const index = Number(event.key) - 1;
      if (index >= 0 && index < battle.alternatives.length) {
        dispatch({ type: "ANSWER", value: battle.alternatives[index] });
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [battle.phase, battle.alternatives]);

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

  return (
    <section aria-labelledby="battle-heading" className="battle-screen">
      <h2 id="battle-heading" tabIndex={-1} ref={headingRef} className="battle-heading">
        {t("battle.title")}
      </h2>
      <p role="status" className="battle-status">
        {lastEntry && (
          <span className="status-icon" aria-hidden="true">
            {lastEntry.key === "battle.almost" ? "✗" : "✓"}
          </span>
        )}
        {statusText}
      </p>
      {battle.combo > 0 && <p className="combo">{t("battle.combo", { combo: battle.combo })}</p>}
      <div className="battlefield">
        <BattleUnit combatant={battle.hero} label={t(battle.hero.nameKey)} />
        <BattleUnit combatant={battle.monster} label={monsterName} />
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
                onClick={() => dispatch({ type: "ANSWER", value: alt })}
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
          onPlayAgain={() => dispatch({ type: "START_BATTLE", monster: SLIME })}
        />
      )}
    </section>
  );
}
