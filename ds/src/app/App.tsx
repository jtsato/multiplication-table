import { useState } from "react";
import { SkipLink } from "../shared/accessibility/SkipLink";
import { useI18n } from "../shared/i18n/I18nContext";
import type { LocaleCode } from "../shared/i18n/locale.types";
import { BattleScreen } from "../slices/battle/BattleScreen";
import { saveRepository } from "../slices/save-game/local-storage.repository";
import { SAVE_VERSION } from "../slices/save-game/repository";
import { initialProgress, type Progress } from "../slices/progression/progression";
import { DEFAULT_AVATAR_SELECTION, type AvatarSelection } from "../slices/avatar/avatar";
import { MenuScreen } from "./MenuScreen";

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
  // Progressão (mapas/chefões) vem do save e sobe ao App.
  const [progress, setProgress] = useState<Progress>(() => {
    const saved = saveRepository.load();
    return saved?.progress ?? initialProgress();
  });
  // Avatar selecionado/customizado também persiste no save.
  const [avatar, setAvatar] = useState<AvatarSelection>(() => {
    const saved = saveRepository.load();
    return saved?.avatar ?? DEFAULT_AVATAR_SELECTION;
  });
  // XP total acumulado persiste para desbloqueios futuros.
  const [totalXp, setTotalXp] = useState<number>(() => {
    const saved = saveRepository.load();
    return saved?.totalXp ?? 0;
  });

  function handleAvatarChange(next: AvatarSelection) {
    setAvatar(next);
    const saved = saveRepository.load();
    saveRepository.save({
      version: SAVE_VERSION,
      locale,
      avatar: next,
      progress: saved?.progress ?? progress,
      battle: saved?.battle ?? null,
      facts: saved?.facts ?? [],
      totalXp: saved?.totalXp ?? totalXp,
    });
  }

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
          <MenuScreen
            avatar={avatar}
            progress={progress}
            totalXp={totalXp}
            onAvatarChange={handleAvatarChange}
            onStart={() => setScreen("battle")}
          />
        ) : (
          <BattleScreen
            progress={progress}
            avatar={avatar}
            totalXp={totalXp}
            onProgressChange={setProgress}
            onTotalXpChange={setTotalXp}
          />
        )}
      </main>
    </>
  );
}
