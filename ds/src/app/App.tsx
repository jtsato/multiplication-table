import { useState } from "react";
import { SkipLink } from "../shared/accessibility/SkipLink";
import { useI18n } from "../shared/i18n/I18nContext";
import type { LocaleCode } from "../shared/i18n/locale.types";
import { BattleScreen } from "../slices/battle/BattleScreen";
import { saveRepository } from "../slices/save-game/local-storage.repository";
import { initialProgress, type Progress } from "../slices/progression/progression";

const LOCALES: { code: LocaleCode; label: string }[] = [
  { code: "pt-BR", label: "Português" },
  { code: "en-US", label: "English" },
];

type Screen = "menu" | "battle";

export function App() {
  const { t, locale, setLocale } = useI18n();
  // Auto-resume: batalha salva em andamento volta direto para ela.
  const [screen, setScreen] = useState<Screen>(() =>
    saveRepository.load()?.battle ? "battle" : "menu",
  );
  // Progressão (monstros derrotados / tabuadas) vem do save e sobe ao App.
  const [progress, setProgress] = useState<Progress>(() => {
    const saved = saveRepository.load();
    return saved?.progress ?? initialProgress();
  });

  return (
    <>
      <SkipLink targetId="conteudo" label={t("app.skipToContent")} />
      <header className="app-header">
        <h1>{t("app.title")}</h1>
        <div role="group" aria-label={t("app.languageGroup")} className="language-switcher">
          {LOCALES.map((l) => (
            <button
              key={l.code}
              type="button"
              aria-pressed={locale === l.code}
              onClick={() => setLocale(l.code)}
            >
              {l.label}
            </button>
          ))}
        </div>
      </header>
      <main id="conteudo" className="app-main">
        {screen === "menu" ? (
          <>
            <p>{t("app.welcome")}</p>
            <button type="button" className="button-primary" onClick={() => setScreen("battle")}>
              {t("battle.start")}
            </button>
          </>
        ) : (
          <BattleScreen progress={progress} onProgressChange={setProgress} />
        )}
      </main>
    </>
  );
}
