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
  DEFAULT_MASCOT,
  MASCOT_COLORS,
  MASCOT_KINDS,
  type MascotConfig,
  type CreateProfileInput,
  type PlayerProfile,
  type StoreStyle,
} from "../domain/profile/profile";
import { ProfileRepository } from "../infrastructure/storage/repository";
import { narrate, playFeedbackTone } from "../infrastructure/audio/audio";
import { ProductArt } from "./art/ProductArt";
import { Mascot } from "./art/Mascot";
import { getMascotPalette } from "./art/mascotPalette";
import { getLocalizedStrings, type LocaleBundle } from "../i18n";

type Screen = "profiles" | "create" | "store" | "game" | "shop" | "settings" | "achievements";

export type AppProps = {
  repository?: ProfileRepository;
};

export function App({ repository }: AppProps) {
  // The locale is read once per mount: switching browser language reloads the app anyway.
  const strings = useMemo(() => getLocalizedStrings(), []);
  const [storage] = useState(() => repository ?? new ProfileRepository());
  const [activeProfile, setActiveProfile] = useState<PlayerProfile | null>(null);
  const [screen, setScreen] = useState<Screen>("create");
  const [session, setSession] = useState<DaySession | null>(null);
  const [notice, setNotice] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [storageError, setStorageError] = useState<string>("");
  const [updateAvailable, setUpdateAvailable] = useState(false);

  useEffect(() => {
    let mounted = true;
    // Perfil único: o app abre direto na loja salva, ou na criação se não houver nenhuma.
    void storage.list()
      .then((loadedProfiles) => {
        if (!mounted) return;
        const [saved] = loadedProfiles;
        if (saved) {
          setActiveProfile(saved);
          setScreen("store");
        }
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

  // Screens swap without a route change, so focus has to be moved deliberately:
  // otherwise it falls back to <body> and nothing is announced on arrival.
  // On first paint the loading screen has no #main-content, so nothing is stolen.
  useEffect(() => {
    document.getElementById("main-content")?.focus();
  }, [screen]);

  useEffect(() => {
    const handleUpdate = () => setUpdateAvailable(true);
    window.addEventListener("lojinha-update-available", handleUpdate);
    return () => window.removeEventListener("lojinha-update-available", handleUpdate);
  }, []);

  function persistProfile(profile: PlayerProfile): void {
    setActiveProfile(profile);
    void storage.save(profile).catch(() => setStorageError(strings.saveError));
  }

  async function handleCreate(input: CreateProfileInput): Promise<void> {
    const profile = createProfile(input);
    try {
      await storage.save(profile);
      setActiveProfile(profile);
      setScreen("store");
    } catch {
      setStorageError(strings.createError);
    }
  }

  async function handleReset(): Promise<void> {
    if (activeProfile) await storage.remove(activeProfile.id).catch(() => undefined);
    setActiveProfile(null);
    setSession(null);
    setNotice("");
    setScreen("create");
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
  if (storageError && !activeProfile) {
    return <main className="loading-screen"><h1>{strings.errorTitle}</h1><p>{storageError}</p><button type="button" className="primary-button" onClick={() => window.location.reload()}>{strings.retry}</button></main>;
  }

  return (
    <div className={`app-shell ${activeProfile?.accessibility.largeText ? "large-text" : ""} ${activeProfile?.accessibility.highContrast ? "high-contrast" : ""}`}>
      <a className="skip-link" href="#main-content">{strings.skipToContent}</a>
      {updateAvailable && <div className="update-notice" role="status">{strings.updateNotice} <button type="button" className="secondary-button" onClick={() => window.location.reload()}>{strings.updateButton}</button></div>}
      {storageError && <div className="storage-warning" role="alert" aria-live="assertive">{storageError}</div>}
      {screen === "create" && <ProfileCreate strings={strings} onCreate={handleCreate} />}
      {screen === "store" && activeProfile && <StoreOverview strings={strings} profile={activeProfile} notice={notice} onStart={startDay} onShop={() => setScreen("shop")} onSettings={() => setScreen("settings")} onAchievements={() => setScreen("achievements")} />}
      {screen === "game" && activeProfile && session && <GameScreen strings={strings} profile={activeProfile} session={session} onStartQuestion={() => setSession((current) => current ? { ...current, phase: "question" } : current)} onSelectQuantity={(quantity) => setSession((current) => current ? selectQuantity(current, quantity) : current)} onAnswer={answerQuestion} onRetry={() => setSession((current) => current ? retryQuestion(current) : current)} onContinue={() => setSession((current) => current ? continueAfterFeedback(current) : current)} onLeave={() => setScreen("store")} onFinish={finishDay} />}
      {screen === "shop" && activeProfile && <ShopScreen strings={strings} profile={activeProfile} onBack={() => setScreen("store")} onPurchase={purchaseProductById} onCosmeticPurchase={purchaseCosmetic} />}
      {screen === "achievements" && activeProfile && <AchievementsScreen strings={strings} profile={activeProfile} onBack={() => setScreen("store")} />}
      {screen === "settings" && activeProfile && <SettingsScreen strings={strings} profile={activeProfile} onBack={() => setScreen("store")} onSave={saveSettings} onReset={handleReset} />}
    </div>
  );
}

function ProfileCreate({ strings, onCreate }: { strings: LocaleBundle; onCreate: (input: CreateProfileInput) => Promise<void> }) {
  const [nickname, setNickname] = useState("");
  const [storeId, setStoreId] = useState<StoreId>("bookstore");
  const [style, setStyle] = useState<StoreStyle>("sunrise");
  const [mascot, setMascot] = useState<MascotConfig>(DEFAULT_MASCOT);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [largeText, setLargeText] = useState(false);

  return (
    <main id="main-content" tabIndex={-1} className="form-screen">
      <div className="brand-mark" aria-hidden="true"><span>✦</span></div>
      <p className="eyebrow">{strings.brandTag}</p>
      <h1>{strings.appName}</h1>
      <p className="lead">{strings.lead}</p>
      <h2>{strings.createProfile}</h2>
      <form onSubmit={(event) => { event.preventDefault(); void onCreate({ nickname, storeId, style, mascot, accessibility: { reducedMotion, largeText } }); }}>
        <label htmlFor="nickname">{strings.nicknameLabel}</label>
        <input id="nickname" value={nickname} onChange={(event) => setNickname(event.target.value)} placeholder={strings.nicknamePlaceholder} maxLength={28} autoFocus />

        <fieldset>
          <legend>{strings.chooseStore}</legend>
          <div className="store-choice-grid">{STORES.map((store) => { const text = strings.storeText(store); return <button type="button" className={`store-choice ${store.id === storeId ? "selected" : ""}`} key={store.id} onClick={() => setStoreId(store.id)}><span className="store-swatch" style={{ background: store.color }} aria-hidden="true" /><strong>{text.name}</strong><small>{text.tagline}</small></button>; })}</div>
        </fieldset>

        <fieldset><legend>{strings.chooseStyle}</legend><div className="style-choice-grid">{([{ id: "sunrise", color: "#e57a44" }, { id: "ocean", color: "#5e78bd" }, { id: "garden", color: "#3f9c8c" }] as const).map((option) => <button type="button" className={`style-choice style-${option.id} ${style === option.id ? "selected" : ""}`} key={option.id} onClick={() => setStyle(option.id)}><span style={{ background: option.color }} aria-hidden="true" />{strings.styleLabels[option.id]}</button>)}</div></fieldset>

        <fieldset>
          <legend>{strings.personalAvatar}</legend>
          <div className="mascot-editor">
            <Mascot kind={mascot.kind} color={mascot.color} size={132} reducedMotion={reducedMotion} />
            <div className="mascot-choices">
              <p className="choice-label">{strings.mascotKindLabel}</p>
              <div className="chip-row">{MASCOT_KINDS.map((kind) => <button type="button" key={kind} className={`mascot-chip ${mascot.kind === kind ? "selected" : ""}`} aria-pressed={mascot.kind === kind} onClick={() => setMascot({ ...mascot, kind })}><Mascot kind={kind} color={mascot.color} size={44} reducedMotion />{strings.mascotKinds[kind]}</button>)}</div>
              <p className="choice-label">{strings.mascotColorLabel}</p>
              <div className="chip-row">{MASCOT_COLORS.map((color) => <button type="button" key={color} className={`mascot-chip ${mascot.color === color ? "selected" : ""}`} aria-pressed={mascot.color === color} onClick={() => setMascot({ ...mascot, color })}><span className="color-dot" style={{ background: getMascotPalette(color).accent }} aria-hidden="true" />{strings.mascotColors[color]}</button>)}</div>
            </div>
          </div>
        </fieldset>

        <fieldset><legend>{strings.quickSettings}</legend><label className="check-row"><input type="checkbox" checked={reducedMotion} onChange={(event) => setReducedMotion(event.target.checked)} /> {strings.reduceMotion}</label><label className="check-row"><input type="checkbox" checked={largeText} onChange={(event) => setLargeText(event.target.checked)} /> {strings.largeText}</label></fieldset>
        <button className="primary-button" type="submit">{strings.start}</button>
      </form>
    </main>
  );
}

function StoreOverview({ strings, profile, notice, onStart, onShop, onSettings, onAchievements }: { strings: LocaleBundle; profile: PlayerProfile; notice: string; onStart: () => void; onShop: () => void; onSettings: () => void; onAchievements: () => void }) {
  const store = getStore(profile.store.storeId);
  const storeText = strings.storeText(store);
  const objective = createDailyObjective(profile.day + profile.id.length);
  const objectiveText = strings.objectiveText(objective);
  const objectiveDone = profile.objectives.completed.includes(objective.id);
  // Fecha o ciclo vender -> juntar -> comprar: sem isto a criança não descobre
  // sozinha para que serve o dinheiro que acabou de entrar no caixa.
  const nextProduct = store.products
    .filter((candidate) => !profile.store.unlockedProducts.includes(candidate.id))
    .sort((a, b) => (a.unlockCost ?? 0) - (b.unlockCost ?? 0))[0];
  const nextCost = nextProduct?.unlockCost ?? 0;
  // A loja mostra o que ela realmente tem: os produtos liberados vão para as prateleiras.
  const half = Math.ceil(profile.store.unlockedProducts.length / 2);
  const shelves = [profile.store.unlockedProducts.slice(0, half), profile.store.unlockedProducts.slice(half)];
  return (
    <main id="main-content" tabIndex={-1} className="game-screen">
      <header className="topbar"><div><p className="eyebrow">{strings.yourShop}</p><h1>{storeText.name}</h1></div><div className="cash-badge" aria-label={strings.cashBadgeLabel(profile.cash)}>{strings.money(profile.cash)}</div></header>
      {notice && <div className="notice" role="status" aria-live="polite">{notice}</div>}
      <section className={`diorama style-${profile.store.style}`} style={{ "--store-color": store.color } as React.CSSProperties} aria-label={strings.dioramaLabel(storeText.name)}><div className="diorama-sky" /><div className="block-shelf shelf-one" aria-hidden="true">{shelves[0].map((productId) => <ProductArt key={productId} id={productId} size="small" />)}</div><div className="block-shelf shelf-two" aria-hidden="true">{shelves[1].map((productId) => <ProductArt key={productId} id={productId} size="small" />)}</div><div className="counter" /><div className="expansion-blocks" aria-hidden="true">{profile.store.purchasedProducts.map((productId) => <ProductArt key={productId} id={productId} size="small" />)}</div><Mascot kind={profile.mascot.kind} color={profile.mascot.color} size={132} reducedMotion={profile.accessibility.reducedMotion} className="diorama-mascot" /></section>
      <section className="store-actions"><div><p className="eyebrow">{strings.dayAndChapter(profile.day, profile.chapter)}</p><h2>{strings.ready}</h2><p className="muted">{strings.readyDescription}</p><div className="objective-line"><strong>{strings.objectiveOptional}: {objectiveText.title}</strong><span>{objectiveDone ? strings.completed : objectiveText.description}</span></div><p className="achievement-line">{strings.storeAchievements}: <strong>{profile.achievements.length}</strong></p></div><button type="button" className="primary-button" onClick={onStart}>{strings.startDay}</button></section>
      <section className="shop-guide">
        {nextProduct
          ? <><ProductArt id={nextProduct.id} size="small" platform platformColor={store.color} /><div><p className="eyebrow">{strings.nextGoal}</p><p>{profile.cash >= nextCost ? strings.canBuyNow(strings.productName(nextProduct), strings.money(nextCost)) : strings.missingAmount(strings.money(nextCost - profile.cash), strings.productName(nextProduct))}</p></div><button type="button" className="secondary-button" onClick={onShop}>{strings.goShopping}</button></>
          : <p>{strings.allProductsOwned}</p>}
      </section>
      {/* Os ícones são decorativos: aria-hidden mantém o nome acessível só com o texto. */}
      <nav className="bottom-actions" aria-label={strings.storeActionsLabel}><button type="button" onClick={onShop}><span className="menu-icon" aria-hidden="true">🛒</span>{strings.menuShop}</button><button type="button" onClick={onAchievements}><span className="menu-icon" aria-hidden="true">🏆</span>{strings.menuAchievements}</button><button type="button" onClick={onSettings}><span className="menu-icon" aria-hidden="true">⚙️</span>{strings.menuSettings}</button></nav>
    </main>
  );
}

function GameScreen({ strings, profile, session, onStartQuestion, onSelectQuantity, onAnswer, onRetry, onContinue, onLeave, onFinish }: { strings: LocaleBundle; profile: PlayerProfile; session: DaySession; onStartQuestion: () => void; onSelectQuantity: (quantity: number) => void; onAnswer: (value: number) => void; onRetry: () => void; onContinue: () => void; onLeave: () => void; onFinish: () => void }) {
  const visit = session.phase === "summary" ? undefined : getCurrentVisit(session);
  if (!visit) return <main id="main-content" tabIndex={-1} className="game-screen"><section className="summary-card"><p className="eyebrow">{strings.finishedDay}</p><h1>{strings.storeSummary}</h1><p className="summary-total">{strings.money(session.revenue)}</p><p>{strings.summaryText}</p><button type="button" className="primary-button" onClick={onFinish}>{strings.saveCash}</button></section></main>;

  const alternatives = generateAlternatives(visit.fact, session.seed + session.currentIndex);
  const hintText = strings.hintText(visit.fact, session.errorsForCurrent);
  const request = strings.customerWants(visit.quantity, visit.product);
  return (
    <main id="main-content" tabIndex={-1} className="game-screen service-screen">
      <header className="service-header"><button type="button" className="text-button" aria-label={strings.backToShopLabel} onClick={onLeave}>{strings.backToShop}</button><span>{strings.customerCounter(session.completedVisits + 1, session.visits.length)}</span><span className="header-money"><span className="header-money-item"><small>{strings.cashLabel}</small><strong>{strings.money(profile.cash)}</strong></span><span className="header-money-item"><small>{strings.todayLabel}</small><strong>{strings.money(session.revenue)}</strong></span></span></header>
      <section className="customer-card"><Mascot kind={profile.mascot.kind} color={profile.mascot.color} size={76} mood={session.feedback?.kind === "correct" ? "celebrate" : "idle"} reducedMotion={profile.accessibility.reducedMotion} /><div><p className="eyebrow">{strings.customerArrived(visit.customer.name)}</p><h1>{strings.customerPhrase(visit.customer)}</h1><p className="customer-request">{request.before}<strong>{request.emphasis}</strong>{request.after}</p></div><ProductArt id={visit.product.id} size="medium" platform /></section>
      {session.phase === "customer" && <section className="question-card intro-card"><p>{strings.howMany}</p><button type="button" className="primary-button" onClick={onStartQuestion}>{strings.seeAccount}</button></section>}
      {session.phase === "product-select" && <section className="question-card"><p className="eyebrow">{strings.separateProducts}</p><h2>{strings.quantityQuestion(visit.product)}</h2><div className="product-counter"><button type="button" aria-label={strings.removeProduct} onClick={() => onSelectQuantity(session.selectedQuantity - 1)} disabled={session.selectedQuantity === 0}>−</button><div className="product-pile" aria-label={strings.quantityPileLabel(session.selectedQuantity, visit.quantity)}>{Array.from({ length: session.selectedQuantity }, (_, index) => <ProductArt key={index} id={visit.product.id} size="tiny" />)}</div><button type="button" aria-label={strings.addProduct} onClick={() => onSelectQuantity(session.selectedQuantity + 1)} disabled={session.selectedQuantity === visit.quantity}>+</button></div><p className="muted">{strings.quantityProgress(session.selectedQuantity, visit.quantity)}</p></section>}
      {(session.phase === "question" || session.phase === "feedback") && <section className="question-card">{/* O desenho é redundante com a frase abaixo: escondê-lo evita 10 anúncios iguais no leitor de tela. */}<div className="unit-array" aria-hidden="true">{Array.from({ length: visit.quantity }, (_, index) => <span className="unit-item" key={index}><ProductArt id={visit.product.id} size="tiny" /><span className="unit-price">{strings.money(visit.product.price)}</span></span>)}</div><p className="unit-explain">{strings.unitExplain(visit.quantity, visit.product, strings.money(visit.product.price))}</p><p className="equation-context">{strings.equation(visit.quantity, visit.product.price)}</p><h2>{strings.qaTitle}</h2><div className="alternatives" role="group" aria-label={strings.answersLabel}>{alternatives.map((alternative) => <button type="button" key={alternative.value} className="answer-button" onClick={() => session.phase === "question" && onAnswer(alternative.value)} disabled={session.phase === "feedback"}>{strings.money(alternative.value)}</button>)}</div>{session.phase === "feedback" && session.feedback?.kind === "incorrect" && <div className="hint-box" role="status" aria-live="polite"><strong>{strings.wrongAnswer}</strong><p>{hintText}</p>{session.errorsForCurrent >= 4 ? <button type="button" className="secondary-button" onClick={() => onAnswer(visit.fact.answer)}>{strings.useFullAnswer}</button> : <button type="button" className="secondary-button" onClick={onRetry}>{strings.tryAgain}</button>}</div>}{session.phase === "feedback" && session.feedback?.kind === "correct" && <div className="success-box" role="status" aria-live="polite"><strong>{strings.correctAnswer(visit.fact.answer)}</strong><p>{strings.answerAccepted}</p><button type="button" className="primary-button" onClick={onContinue}>{session.completedVisits === session.visits.length ? strings.seeCloseout : strings.nextCustomer}</button></div>}</section>}
    </main>
  );
}

function AchievementsScreen({ strings, profile, onBack }: { strings: LocaleBundle; profile: PlayerProfile; onBack: () => void }) {
  const achievements = getAchievementProgress(profile.achievements);
  return <main id="main-content" tabIndex={-1} className="form-screen"><button type="button" className="text-button" onClick={onBack}>← {strings.backToShopLabel}</button><p className="eyebrow">{strings.achievementsEyebrow}</p><h1>{strings.achievements}</h1><p className="muted">{strings.achievementsDescription}</p><div className="product-grid">{achievements.map((achievement) => { const text = strings.achievementText(achievement); return <article className={`product-card achievement-card ${achievement.unlocked ? "unlocked" : "locked"}`} key={achievement.id}><span className="product-icon" aria-hidden="true">{achievement.unlocked ? "✓" : "○"}</span><h2>{text.title}</h2><p>{text.description}</p><strong>{achievement.unlocked ? strings.achievementUnlocked : strings.achievementLocked}</strong></article>; })}</div></main>;
}

const COSMETICS = [
  { id: "banner", name: "Faixa colorida", cost: 40 },
  { id: "plant", name: "Vaso geométrico", cost: 60 },
  { id: "lamp", name: "Luz de balcão", cost: 80 },
];

function ShopScreen({ strings, profile, onBack, onPurchase, onCosmeticPurchase }: { strings: LocaleBundle; profile: PlayerProfile; onBack: () => void; onPurchase: (productId: string, cost: number) => void; onCosmeticPurchase: (cosmeticId: string, cost: number) => void }) {
  const store = getStore(profile.store.storeId);
  return <main id="main-content" tabIndex={-1} className="form-screen"><button type="button" className="text-button" onClick={onBack}>← {strings.backToShopLabel}</button><header className="topbar"><div><p className="eyebrow">{strings.catalog}</p><h1>{strings.productsNew}</h1></div><div className="cash-badge" aria-label={strings.cashBadgeLabel(profile.cash)}>{strings.money(profile.cash)}</div></header><p className="muted">{strings.catalogDescription}</p><div className="product-grid">{store.products.map((product) => { const unlocked = profile.store.unlockedProducts.includes(product.id); return <article className={`product-card ${unlocked ? "unlocked" : ""}`} key={product.id}><ProductArt id={product.id} size="medium" platform platformColor={store.color} /><h2>{strings.productName(product)}</h2><p>{strings.priceLine(product.price)}</p>{unlocked ? <strong>{strings.available}</strong> : <button type="button" className="secondary-button" onClick={() => onPurchase(product.id, product.unlockCost ?? 80)}>{strings.buyForLabel(product.unlockCost ?? 80)}</button>}</article>; })}</div><h2 className="section-title">{strings.decor}</h2><div className="product-grid">{COSMETICS.map((cosmetic) => { const owned = profile.store.cosmetics.includes(cosmetic.id); return <article className="product-card" key={cosmetic.id}><ProductArt id={cosmetic.id} size="medium" platform /><h2>{strings.cosmeticName(cosmetic.id, cosmetic.name)}</h2><p>{strings.decorDescription}</p>{owned ? <strong>{strings.inCollection}</strong> : <button type="button" className="secondary-button" onClick={() => onCosmeticPurchase(cosmetic.id, cosmetic.cost)}>{strings.buyForLabel(cosmetic.cost)}</button>}</article>; })}</div></main>;
}

function SettingsScreen({ strings, profile, onBack, onSave, onReset }: { strings: LocaleBundle; profile: PlayerProfile; onBack: () => void; onSave: (settings: AccessibilitySettings, audio: AudioSettings) => void; onReset: () => Promise<void> }) {
  const [settings, setSettings] = useState(profile.accessibility);
  const [audio, setAudio] = useState(profile.audio);
  // Confirmação em dois passos em vez de window.confirm: apagar a loja de uma
  // criança por toque acidental seria irreversível.
  const [confirmingReset, setConfirmingReset] = useState(false);
  return <main id="main-content" tabIndex={-1} className="form-screen"><button type="button" className="text-button" onClick={onBack}>← {strings.backToShopLabel}</button><p className="eyebrow">{strings.settingsEyebrow}</p><h1>{strings.settings}</h1><fieldset><legend>{strings.accessibility}</legend><label className="check-row"><input type="checkbox" checked={settings.reducedMotion} onChange={(event) => setSettings({ ...settings, reducedMotion: event.target.checked })} /> {strings.reduceMotion}</label><label className="check-row"><input type="checkbox" checked={settings.largeText} onChange={(event) => setSettings({ ...settings, largeText: event.target.checked })} /> {strings.largeText}</label><label className="check-row"><input type="checkbox" checked={settings.highContrast} onChange={(event) => setSettings({ ...settings, highContrast: event.target.checked })} /> {strings.highContrast}</label></fieldset><fieldset><legend>{strings.audioAndNarration}</legend><label className="check-row"><input type="checkbox" checked={audio.effects} onChange={(event) => setAudio({ ...audio, effects: event.target.checked })} /> {strings.audioEffects}</label><label className="check-row"><input type="checkbox" checked={audio.narration} onChange={(event) => setAudio({ ...audio, narration: event.target.checked })} /> {strings.narration}</label></fieldset><button type="button" className="primary-button" onClick={() => onSave(settings, audio)}>{strings.saveSettings}</button><section className="danger-zone"><h2>{strings.resetTitle}</h2><p className="muted">{strings.resetDescription}</p>{confirmingReset
    ? <div className="reset-confirm" role="alertdialog" aria-label={strings.resetConfirmQuestion}><p><strong>{strings.resetConfirmQuestion}</strong></p><button type="button" className="secondary-button" onClick={() => void onReset()}>{strings.resetConfirm}</button><button type="button" className="primary-button" onClick={() => setConfirmingReset(false)}>{strings.resetCancel}</button></div>
    : <button type="button" className="secondary-button" onClick={() => setConfirmingReset(true)}>{strings.resetButton}</button>}</section></main>;
}

