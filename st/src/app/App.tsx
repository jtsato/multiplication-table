import { useEffect, useMemo, useState } from "react";
import { getStore, STORES, type StoreId } from "../content/stores";
import { applyAttempt, type FactProgress } from "../domain/math/mastery";
import { generateAlternatives } from "../domain/math/distractors";
import { factKey } from "../domain/math/facts";
import {
  continueAfterFeedback,
  createDaySession,
  getCurrentVisit,
  retryQuestion,
  selectQuantity,
  submitAnswer,
  type DaySession,
} from "../domain/game/session";
import { purchaseProduct } from "../domain/economy/economy";
import { evaluateAchievements } from "../domain/game/achievements";
import { getAchievementProgress } from "../domain/game/achievementCatalog";
import { createDailyObjective } from "../domain/game/objectives";
import { getChapterForDay } from "../domain/game/progression";
import {
  createProfile,
  type AccessibilitySettings,
  type AudioSettings,
  type AvatarConfig,
  type CreateProfileInput,
  type PlayerProfile,
  type StoreStyle,
} from "../domain/profile/profile";
import { ProfileRepository } from "../infrastructure/storage/repository";
import { narrate, playFeedbackTone } from "../infrastructure/audio/audio";
import { getAvatarMotionClass, type AvatarMotion } from "./avatarMotion";
import { getLocalizedStrings, type LocaleBundle } from "../i18n";

type Screen = "profiles" | "create" | "store" | "game" | "shop" | "settings" | "achievements";

export type AppProps = {
  repository?: ProfileRepository;
};

export function App({ repository }: AppProps) {
  // The locale is read once per mount: switching browser language reloads the app anyway.
  const strings = useMemo(() => getLocalizedStrings(), []);
  const [storage] = useState(() => repository ?? new ProfileRepository());
  const [profiles, setProfiles] = useState<PlayerProfile[]>([]);
  const [activeProfile, setActiveProfile] = useState<PlayerProfile | null>(null);
  const [screen, setScreen] = useState<Screen>("profiles");
  const [session, setSession] = useState<DaySession | null>(null);
  const [notice, setNotice] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [storageError, setStorageError] = useState<string>("");
  const [updateAvailable, setUpdateAvailable] = useState(false);

  useEffect(() => {
    let mounted = true;
    void storage.list()
      .then((loadedProfiles) => {
        if (mounted) setProfiles(loadedProfiles);
      })
      .catch(() => {
        if (mounted) setStorageError(strings.storageError);
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, [storage, strings]);

  useEffect(() => {
    document.documentElement.lang = strings.locale;
  }, [strings]);

  useEffect(() => {
    const handleUpdate = () => setUpdateAvailable(true);
    window.addEventListener("lojinha-update-available", handleUpdate);
    return () => window.removeEventListener("lojinha-update-available", handleUpdate);
  }, []);

  function persistProfile(profile: PlayerProfile): void {
    setActiveProfile(profile);
    setProfiles((current) => current.map((candidate) => candidate.id === profile.id ? profile : candidate));
    void storage.save(profile).catch(() => setStorageError(strings.saveError));
  }

  async function handleCreate(input: CreateProfileInput): Promise<void> {
    const profile = createProfile(input);
    try {
      await storage.save(profile);
      setProfiles((current) => [...current, profile]);
      setActiveProfile(profile);
      setScreen("store");
    } catch {
      setStorageError(strings.createError);
    }
  }

  function startDay(): void {
    if (!activeProfile) return;
    const store = getStore(activeProfile.store.storeId);
    const daySeed = activeProfile.day * 101 + activeProfile.id.length * 7;
    setSession(createDaySession(store, activeProfile.day, daySeed, activeProfile.store.unlockedProducts, Object.values(activeProfile.mathProgress)));
    setNotice("");
    setScreen("game");
  }

  function answerQuestion(value: number): void {
    if (!activeProfile || !session) return;
    const visit = getCurrentVisit(session);
    const correct = value === visit.fact.answer;
    const nextSession = submitAnswer(session, value);
    playFeedbackTone(correct ? "success" : "error", activeProfile.audio.effects);
    narrate(
      correct
        ? strings.narrateCorrect(visit.quantity, visit.product.price, visit.fact.answer)
        : strings.narrateRetry(strings.hintText(visit.fact, session.errorsForCurrent)),
      activeProfile.audio.narration,
    );
    const progress = activeProfile.mathProgress[factKey(visit.fact)] as FactProgress;
    const nextProgress = applyAttempt(progress, {
      outcome: correct ? "correct" : "incorrect",
      hintLevel: correct ? session.errorsForCurrent : 0,
      day: activeProfile.day,
    });
    persistProfile({
      ...activeProfile,
      mathProgress: { ...activeProfile.mathProgress, [factKey(visit.fact)]: nextProgress },
      updatedAt: new Date().toISOString(),
    });
    setSession(nextSession);
  }

  function finishDay(): void {
    if (!activeProfile || !session) return;
    const nextDay = activeProfile.day + 1;
    const nextChapter = getChapterForDay(nextDay).number;
    const objective = createDailyObjective(activeProfile.day + activeProfile.id.length);
    const completedObjectives = session.completedVisits >= objective.requiredVisits && !activeProfile.objectives.completed.includes(objective.id)
      ? [...activeProfile.objectives.completed, objective.id]
      : activeProfile.objectives.completed;
    const earned = evaluateAchievements({
      completedVisits: session.completedVisits,
      purchasedProducts: activeProfile.store.purchasedProducts.length,
      chapter: nextChapter,
    });
    const finished = {
      ...activeProfile,
      day: nextDay,
      chapter: nextChapter,
      cash: activeProfile.cash + session.revenue,
      achievements: [...new Set([...activeProfile.achievements, ...earned])],
      objectives: { completed: completedObjectives },
      updatedAt: new Date().toISOString(),
    };
    persistProfile(finished);
    setSession(null);
    setNotice(strings.dayClosedNotice(session.revenue));
    setScreen("store");
  }

  function purchaseProductById(productId: string, cost: number): void {
    if (!activeProfile) return;
    const result = purchaseProduct(activeProfile.cash, cost);
    if (!result.ok) {
      setNotice(strings.cannotAffordProduct);
      return;
    }
    const nextProfile = {
      ...activeProfile,
      cash: result.cash,
      store: {
        ...activeProfile.store,
        unlockedProducts: [...activeProfile.store.unlockedProducts, productId],
        purchasedProducts: [...activeProfile.store.purchasedProducts, productId],
      },
      updatedAt: new Date().toISOString(),
    };
    persistProfile(nextProfile);
    setNotice(strings.productPurchased);
  }

  function purchaseCosmetic(cosmeticId: string, cost: number): void {
    if (!activeProfile) return;
    if (activeProfile.store.cosmetics.includes(cosmeticId)) return;
    const result = purchaseProduct(activeProfile.cash, cost);
    if (!result.ok) {
      setNotice(strings.cannotAffordCosmetic);
      return;
    }
    const nextProfile = {
      ...activeProfile,
      cash: result.cash,
      store: { ...activeProfile.store, cosmetics: [...activeProfile.store.cosmetics, cosmeticId] },
      updatedAt: new Date().toISOString(),
    };
    persistProfile(nextProfile);
    setNotice(strings.cosmeticPurchased);
  }

  function saveSettings(settings: AccessibilitySettings, audio: AudioSettings): void {
    if (!activeProfile) return;
    persistProfile({ ...activeProfile, accessibility: settings, audio, updatedAt: new Date().toISOString() });
    setScreen("store");
  }

  if (loading) return <main className="loading-screen" aria-busy="true">{strings.loading}</main>;
  if (storageError && !activeProfile && profiles.length === 0) {
    return <main className="loading-screen"><h1>{strings.errorTitle}</h1><p>{storageError}</p><button type="button" className="primary-button" onClick={() => window.location.reload()}>{strings.retry}</button></main>;
  }

  return (
    <div className={`app-shell ${activeProfile?.accessibility.largeText ? "large-text" : ""} ${activeProfile?.accessibility.highContrast ? "high-contrast" : ""}`}>
      <a className="skip-link" href="#main-content">{strings.skipToContent}</a>
      {updateAvailable && <div className="update-notice" role="status">{strings.updateNotice} <button type="button" className="secondary-button" onClick={() => window.location.reload()}>{strings.updateButton}</button></div>}
      {storageError && <div className="storage-warning" role="alert" aria-live="assertive">{storageError}</div>}
      {screen === "profiles" && <ProfileSelect strings={strings} profiles={profiles} onCreate={() => setScreen("create")} onSelect={(profile) => { setActiveProfile(profile); setScreen("store"); }} />}
      {screen === "create" && <ProfileCreate strings={strings} onCancel={() => setScreen("profiles")} onCreate={handleCreate} />}
      {screen === "store" && activeProfile && <StoreOverview strings={strings} profile={activeProfile} notice={notice} onStart={startDay} onShop={() => setScreen("shop")} onSettings={() => setScreen("settings")} onAchievements={() => setScreen("achievements")} onSwitch={() => { setActiveProfile(null); setScreen("profiles"); }} />}
      {screen === "game" && activeProfile && session && <GameScreen strings={strings} profile={activeProfile} session={session} onStartQuestion={() => setSession((current) => current ? { ...current, phase: "question" } : current)} onSelectQuantity={(quantity) => setSession((current) => current ? selectQuantity(current, quantity) : current)} onAnswer={answerQuestion} onRetry={() => setSession((current) => current ? retryQuestion(current) : current)} onContinue={() => setSession((current) => current ? continueAfterFeedback(current) : current)} onLeave={() => setScreen("store")} onFinish={finishDay} />}
      {screen === "shop" && activeProfile && <ShopScreen strings={strings} profile={activeProfile} onBack={() => setScreen("store")} onPurchase={purchaseProductById} onCosmeticPurchase={purchaseCosmetic} />}
      {screen === "achievements" && activeProfile && <AchievementsScreen strings={strings} profile={activeProfile} onBack={() => setScreen("store")} />}
      {screen === "settings" && activeProfile && <SettingsScreen strings={strings} profile={activeProfile} onBack={() => setScreen("store")} onSave={saveSettings} />}
    </div>
  );
}

function ProfileSelect({ strings, profiles, onCreate, onSelect }: { strings: LocaleBundle; profiles: PlayerProfile[]; onCreate: () => void; onSelect: (profile: PlayerProfile) => void }) {
  return (
    <main id="main-content" className="welcome-screen">
      <div className="brand-mark" aria-hidden="true"><span>✦</span></div>
      <p className="eyebrow">{strings.brandTag}</p>
      <h1>{strings.appName}</h1>
      <p className="lead">{strings.lead}</p>
      <section className="profile-panel" aria-labelledby="players-title">
        <h2 id="players-title">{strings.playerTitle}</h2>
        {profiles.length === 0 ? <p className="muted">{strings.emptyState}</p> : <div className="profile-grid">{profiles.map((profile) => <button type="button" className="profile-card" key={profile.id} aria-label={strings.selectPlayerLabel(profile.nickname)} onClick={() => onSelect(profile)}><Avatar avatar={profile.avatar} size="small" reducedMotion={profile.accessibility.reducedMotion} strings={strings} /><span><strong>{profile.nickname}</strong><small>{strings.playerSummary(strings.storeText(getStore(profile.store.storeId)).name, profile.day)}</small></span></button>)}</div>}
        <button type="button" className="primary-button" onClick={onCreate}>{strings.createPlayer}</button>
      </section>
    </main>
  );
}

function ProfileCreate({ strings, onCancel, onCreate }: { strings: LocaleBundle; onCancel: () => void; onCreate: (input: CreateProfileInput) => Promise<void> }) {
  const [nickname, setNickname] = useState("");
  const [storeId, setStoreId] = useState<StoreId>("bookstore");
  const [style, setStyle] = useState<StoreStyle>("sunrise");
  const [avatar, setAvatar] = useState<AvatarConfig>({ skin: "warm", hair: "curly", outfit: "apron", accessory: "none" });
  const [reducedMotion, setReducedMotion] = useState(false);
  const [largeText, setLargeText] = useState(false);

  return (
    <main id="main-content" className="form-screen">
      <button type="button" className="text-button" onClick={onCancel}>{strings.back}</button>
      <p className="eyebrow">{strings.firstStep}</p>
      <h1>{strings.createProfile}</h1>
      <form onSubmit={(event) => { event.preventDefault(); void onCreate({ nickname, storeId, style, avatar, accessibility: { reducedMotion, largeText } }); }}>
        <label htmlFor="nickname">{strings.nicknameLabel}</label>
        <input id="nickname" value={nickname} onChange={(event) => setNickname(event.target.value)} placeholder={strings.nicknamePlaceholder} maxLength={28} autoFocus />
        <div className="suggestion-row" aria-label={strings.nicknameSuggestionsLabel}>{strings.nicknameSuggestions.map((suggestion) => <button type="button" className="chip-button" key={suggestion} onClick={() => setNickname(suggestion)}>{suggestion}</button>)}</div>

        <fieldset>
          <legend>{strings.chooseStore}</legend>
          <div className="store-choice-grid">{STORES.map((store) => { const text = strings.storeText(store); return <button type="button" className={`store-choice ${store.id === storeId ? "selected" : ""}`} key={store.id} onClick={() => setStoreId(store.id)}><span className="store-swatch" style={{ background: store.color }} aria-hidden="true" /><strong>{text.name}</strong><small>{text.tagline}</small></button>; })}</div>
        </fieldset>

        <fieldset><legend>{strings.chooseStyle}</legend><div className="style-choice-grid">{([{ id: "sunrise", color: "#e57a44" }, { id: "ocean", color: "#5e78bd" }, { id: "garden", color: "#3f9c8c" }] as const).map((option) => <button type="button" className={`style-choice style-${option.id} ${style === option.id ? "selected" : ""}`} key={option.id} onClick={() => setStyle(option.id)}><span style={{ background: option.color }} aria-hidden="true" />{strings.styleLabels[option.id]}</button>)}</div></fieldset>

        <fieldset>
          <legend>{strings.personalAvatar}</legend>
          <div className="avatar-editor"><Avatar avatar={avatar} size="large" reducedMotion={reducedMotion} strings={strings} /><div className="select-grid"><label>{strings.visual}<select value={avatar.skin} onChange={(event) => setAvatar({ ...avatar, skin: event.target.value as AvatarConfig["skin"] })}>{(["sunny", "warm", "deep"] as const).map((option) => <option value={option} key={option}>{strings.avatarOptions.skin[option]}</option>)}</select></label><label>{strings.hair}<select value={avatar.hair} onChange={(event) => setAvatar({ ...avatar, hair: event.target.value as AvatarConfig["hair"] })}>{(["curly", "short", "long"] as const).map((option) => <option value={option} key={option}>{strings.avatarOptions.hair[option]}</option>)}</select></label><label>{strings.outfit}<select value={avatar.outfit} onChange={(event) => setAvatar({ ...avatar, outfit: event.target.value as AvatarConfig["outfit"] })}>{(["apron", "jacket", "overalls"] as const).map((option) => <option value={option} key={option}>{strings.avatarOptions.outfit[option]}</option>)}</select></label><label>{strings.accessory}<select value={avatar.accessory} onChange={(event) => setAvatar({ ...avatar, accessory: event.target.value as AvatarConfig["accessory"] })}>{(["none", "cap", "glasses", "headphones"] as const).map((option) => <option value={option} key={option}>{strings.avatarOptions.accessory[option]}</option>)}</select></label></div></div>
        </fieldset>

        <fieldset><legend>{strings.quickSettings}</legend><label className="check-row"><input type="checkbox" checked={reducedMotion} onChange={(event) => setReducedMotion(event.target.checked)} /> {strings.reduceMotion}</label><label className="check-row"><input type="checkbox" checked={largeText} onChange={(event) => setLargeText(event.target.checked)} /> {strings.largeText}</label></fieldset>
        <button className="primary-button" type="submit">{strings.start}</button>
      </form>
    </main>
  );
}

function StoreOverview({ strings, profile, notice, onStart, onShop, onSettings, onAchievements, onSwitch }: { strings: LocaleBundle; profile: PlayerProfile; notice: string; onStart: () => void; onShop: () => void; onSettings: () => void; onAchievements: () => void; onSwitch: () => void }) {
  const store = getStore(profile.store.storeId);
  const storeText = strings.storeText(store);
  const objective = createDailyObjective(profile.day + profile.id.length);
  const objectiveText = strings.objectiveText(objective);
  const objectiveDone = profile.objectives.completed.includes(objective.id);
  return (
    <main id="main-content" className="game-screen">
      <header className="topbar"><div><p className="eyebrow">{strings.yourShop}</p><h1>{storeText.name}</h1></div><div className="cash-badge" aria-label={strings.cashBadgeLabel(profile.cash)}>{strings.money(profile.cash)}</div></header>
      {notice && <div className="notice" role="status" aria-live="polite">{notice}</div>}
      <section className={`diorama style-${profile.store.style}`} style={{ "--store-color": store.color } as React.CSSProperties} aria-label={strings.dioramaLabel(storeText.name)}><div className="diorama-sky" /><div className="block-shelf shelf-one" /><div className="block-shelf shelf-two" /><div className="counter" /><div className="expansion-blocks" aria-hidden="true">{profile.store.purchasedProducts.map((productId) => <span key={productId} />)}</div><Avatar avatar={profile.avatar} size="large" reducedMotion={profile.accessibility.reducedMotion} strings={strings} /></section>
      <section className="store-actions"><div><p className="eyebrow">{strings.dayAndChapter(profile.day, profile.chapter)}</p><h2>{strings.ready}</h2><p className="muted">{strings.readyDescription}</p><div className="objective-line"><strong>{strings.objectiveOptional}: {objectiveText.title}</strong><span>{objectiveDone ? strings.completed : objectiveText.description}</span></div><p className="achievement-line">{strings.storeAchievements}: <strong>{profile.achievements.length}</strong></p></div><button type="button" className="primary-button" onClick={onStart}>{strings.startDay}</button></section>
      <nav className="bottom-actions" aria-label={strings.storeActionsLabel}><button type="button" onClick={onShop}>{strings.menuShop}</button><button type="button" onClick={onAchievements}>{strings.menuAchievements}</button><button type="button" onClick={onSettings}>{strings.menuSettings}</button><button type="button" onClick={onSwitch}>{strings.menuSwitchPlayer}</button></nav>
    </main>
  );
}

function GameScreen({ strings, profile, session, onStartQuestion, onSelectQuantity, onAnswer, onRetry, onContinue, onLeave, onFinish }: { strings: LocaleBundle; profile: PlayerProfile; session: DaySession; onStartQuestion: () => void; onSelectQuantity: (quantity: number) => void; onAnswer: (value: number) => void; onRetry: () => void; onContinue: () => void; onLeave: () => void; onFinish: () => void }) {
  const visit = session.phase === "summary" ? undefined : getCurrentVisit(session);
  if (!visit) return <main id="main-content" className="game-screen"><section className="summary-card"><p className="eyebrow">{strings.finishedDay}</p><h1>{strings.storeSummary}</h1><p className="summary-total">{strings.money(session.revenue)}</p><p>{strings.summaryText}</p><button type="button" className="primary-button" onClick={onFinish}>{strings.saveCash}</button></section></main>;

  const alternatives = generateAlternatives(visit.fact, session.seed + session.currentIndex);
  const hintText = strings.hintText(visit.fact, session.errorsForCurrent);
  const productName = strings.productName(visit.product).toLowerCase();
  const request = strings.customerWants(visit.quantity, productName);
  return (
    <main id="main-content" className="game-screen service-screen">
      <header className="service-header"><button type="button" className="text-button" aria-label={strings.backToShopLabel} onClick={onLeave}>{strings.backToShop}</button><span>{strings.customerCounter(session.completedVisits + 1, session.visits.length)}</span><strong>{strings.money(session.revenue)}</strong></header>
      <section className="customer-card"><Avatar avatar={profile.avatar} size="small" motion={session.feedback?.kind === "correct" ? "celebrate" : "idle"} reducedMotion={profile.accessibility.reducedMotion} strings={strings} /><div><p className="eyebrow">{strings.customerArrived(visit.customer.name)}</p><h1>{strings.customerPhrase(visit.customer)}</h1><p className="customer-request">{request.before}<strong>{request.emphasis}</strong>{request.after}</p></div></section>
      {session.phase === "customer" && <section className="question-card intro-card"><p>{strings.howMany}</p><button type="button" className="primary-button" onClick={onStartQuestion}>{strings.seeAccount}</button></section>}
      {session.phase === "product-select" && <section className="question-card"><p className="eyebrow">{strings.separateProducts}</p><h2>{strings.quantityQuestion(productName)}</h2><div className="product-counter"><button type="button" aria-label={strings.removeProduct} onClick={() => onSelectQuantity(session.selectedQuantity - 1)} disabled={session.selectedQuantity === 0}>−</button><div className="product-pile" aria-label={strings.quantityPileLabel(session.selectedQuantity, visit.quantity)}>{Array.from({ length: session.selectedQuantity }, (_, index) => <span key={index} aria-hidden="true" className="mini-block" />)}</div><button type="button" aria-label={strings.addProduct} onClick={() => onSelectQuantity(session.selectedQuantity + 1)} disabled={session.selectedQuantity === visit.quantity}>+</button></div><p className="muted">{strings.quantityProgress(session.selectedQuantity, visit.quantity)}</p></section>}
      {(session.phase === "question" || session.phase === "feedback") && <section className="question-card"><p className="equation-context">{strings.equation(visit.quantity, visit.product.price)}</p><h2>{strings.qaTitle}</h2><div className="alternatives" role="group" aria-label={strings.answersLabel}>{alternatives.map((alternative) => <button type="button" key={alternative.value} className="answer-button" onClick={() => session.phase === "question" && onAnswer(alternative.value)} disabled={session.phase === "feedback"}>{strings.money(alternative.value)}</button>)}</div>{session.phase === "feedback" && session.feedback?.kind === "incorrect" && <div className="hint-box" role="status" aria-live="polite"><strong>{strings.wrongAnswer}</strong><p>{hintText}</p>{session.errorsForCurrent >= 4 ? <button type="button" className="secondary-button" onClick={() => onAnswer(visit.fact.answer)}>{strings.useFullAnswer}</button> : <button type="button" className="secondary-button" onClick={onRetry}>{strings.tryAgain}</button>}</div>}{session.phase === "feedback" && session.feedback?.kind === "correct" && <div className="success-box" role="status" aria-live="polite"><strong>{strings.correctAnswer(visit.fact.answer)}</strong><p>{strings.answerAccepted}</p><button type="button" className="primary-button" onClick={onContinue}>{session.completedVisits === session.visits.length ? strings.seeCloseout : strings.nextCustomer}</button></div>}</section>}
    </main>
  );
}

function AchievementsScreen({ strings, profile, onBack }: { strings: LocaleBundle; profile: PlayerProfile; onBack: () => void }) {
  const achievements = getAchievementProgress(profile.achievements);
  return <main id="main-content" className="form-screen"><button type="button" className="text-button" onClick={onBack}>← {strings.backToShopLabel}</button><p className="eyebrow">{strings.achievementsEyebrow}</p><h1>{strings.achievements}</h1><p className="muted">{strings.achievementsDescription}</p><div className="product-grid">{achievements.map((achievement) => { const text = strings.achievementText(achievement); return <article className={`product-card achievement-card ${achievement.unlocked ? "unlocked" : "locked"}`} key={achievement.id}><span className="product-icon" aria-hidden="true">{achievement.unlocked ? "✓" : "○"}</span><h2>{text.title}</h2><p>{text.description}</p><strong>{achievement.unlocked ? strings.achievementUnlocked : strings.achievementLocked}</strong></article>; })}</div></main>;
}

const COSMETICS = [
  { id: "banner", name: "Faixa colorida", cost: 40 },
  { id: "plant", name: "Vaso geométrico", cost: 60 },
  { id: "lamp", name: "Luz de balcão", cost: 80 },
];

function ShopScreen({ strings, profile, onBack, onPurchase, onCosmeticPurchase }: { strings: LocaleBundle; profile: PlayerProfile; onBack: () => void; onPurchase: (productId: string, cost: number) => void; onCosmeticPurchase: (cosmeticId: string, cost: number) => void }) {
  const store = getStore(profile.store.storeId);
  return <main id="main-content" className="form-screen"><button type="button" className="text-button" onClick={onBack}>← {strings.backToShopLabel}</button><header className="topbar"><div><p className="eyebrow">{strings.catalog}</p><h1>{strings.productsNew}</h1></div><div className="cash-badge" aria-label={strings.cashBadgeLabel(profile.cash)}>{strings.money(profile.cash)}</div></header><p className="muted">{strings.catalogDescription}</p><div className="product-grid">{store.products.map((product) => { const unlocked = profile.store.unlockedProducts.includes(product.id); return <article className={`product-card ${unlocked ? "unlocked" : ""}`} key={product.id}><span className="product-icon" aria-hidden="true">▦</span><h2>{strings.productName(product)}</h2><p>{strings.priceLine(product.price)}</p>{unlocked ? <strong>{strings.available}</strong> : <button type="button" className="secondary-button" onClick={() => onPurchase(product.id, product.unlockCost ?? 80)}>{strings.buyForLabel(product.unlockCost ?? 80)}</button>}</article>; })}</div><h2 className="section-title">{strings.decor}</h2><div className="product-grid">{COSMETICS.map((cosmetic) => { const owned = profile.store.cosmetics.includes(cosmetic.id); return <article className="product-card" key={cosmetic.id}><span className="product-icon" aria-hidden="true">✦</span><h2>{strings.cosmeticName(cosmetic.id, cosmetic.name)}</h2><p>{strings.decorDescription}</p>{owned ? <strong>{strings.inCollection}</strong> : <button type="button" className="secondary-button" onClick={() => onCosmeticPurchase(cosmetic.id, cosmetic.cost)}>{strings.buyForLabel(cosmetic.cost)}</button>}</article>; })}</div></main>;
}

function SettingsScreen({ strings, profile, onBack, onSave }: { strings: LocaleBundle; profile: PlayerProfile; onBack: () => void; onSave: (settings: AccessibilitySettings, audio: AudioSettings) => void }) {
  const [settings, setSettings] = useState(profile.accessibility);
  const [audio, setAudio] = useState(profile.audio);
  return <main id="main-content" className="form-screen"><button type="button" className="text-button" onClick={onBack}>← {strings.backToShopLabel}</button><p className="eyebrow">{strings.settingsEyebrow}</p><h1>{strings.settings}</h1><fieldset><legend>{strings.accessibility}</legend><label className="check-row"><input type="checkbox" checked={settings.reducedMotion} onChange={(event) => setSettings({ ...settings, reducedMotion: event.target.checked })} /> {strings.reduceMotion}</label><label className="check-row"><input type="checkbox" checked={settings.largeText} onChange={(event) => setSettings({ ...settings, largeText: event.target.checked })} /> {strings.largeText}</label><label className="check-row"><input type="checkbox" checked={settings.highContrast} onChange={(event) => setSettings({ ...settings, highContrast: event.target.checked })} /> {strings.highContrast}</label></fieldset><fieldset><legend>{strings.audioAndNarration}</legend><label className="check-row"><input type="checkbox" checked={audio.effects} onChange={(event) => setAudio({ ...audio, effects: event.target.checked })} /> {strings.audioEffects}</label><label className="check-row"><input type="checkbox" checked={audio.narration} onChange={(event) => setAudio({ ...audio, narration: event.target.checked })} /> {strings.narration}</label></fieldset><button type="button" className="primary-button" onClick={() => onSave(settings, audio)}>{strings.saveSettings}</button></main>;
}

function Avatar({ avatar, size, motion = "idle", reducedMotion = false, strings }: { avatar: AvatarConfig; size: "small" | "large"; motion?: AvatarMotion; reducedMotion?: boolean; strings: LocaleBundle }) {
  return <div role="img" className={`avatar avatar-${size} skin-${avatar.skin} hair-${avatar.hair} outfit-${avatar.outfit} ${getAvatarMotionClass(reducedMotion, motion)}`} aria-label={strings.avatarLabel}><span className="avatar-hair" aria-hidden="true" /><span className="avatar-face" aria-hidden="true" /><span className="avatar-body" aria-hidden="true" /><span className="avatar-accessory" aria-hidden="true">{avatar.accessory === "cap" ? "⌒" : avatar.accessory === "glasses" ? "◌" : avatar.accessory === "headphones" ? "◡" : ""}</span></div>;
}
