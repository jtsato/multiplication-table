import { useEffect, useReducer, useRef } from "react";
import { useI18n } from "../../shared/i18n/I18nContext";
import { battleReducer, createBattle, hpRatio } from "./battle";
import { SLIME } from "./monsters";
import type { Combatant } from "./battle.types";

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

export function BattleScreen() {
  const { t } = useI18n();
  const [battle] = useReducer(battleReducer, SLIME, createBattle);
  const headingRef = useRef<HTMLHeadingElement>(null);

  // Gerenciamento de foco: ao trocar de tela, o título recebe o foco
  // (leitor de tela e teclado sabem onde estão).
  useEffect(() => {
    headingRef.current?.focus();
  }, []);

  return (
    <section aria-labelledby="battle-heading" className="battle-screen">
      <h2 id="battle-heading" tabIndex={-1} ref={headingRef} className="battle-heading">
        {t("battle.title")}
      </h2>
      <p role="status" className="battle-status">
        {t("battle.intro", { monster: t(battle.monster.nameKey) })}
      </p>
      <div className="battlefield">
        <BattleUnit combatant={battle.hero} label={t(battle.hero.nameKey)} />
        <BattleUnit combatant={battle.monster} label={t(battle.monster.nameKey)} />
      </div>
    </section>
  );
}
