import { useEffect, useState } from "react";
import { getStore, STORES, type StoreId } from "../content/stores";
import { applyAttempt, type FactProgress } from "../domain/math/mastery";
import { generateAlternatives } from "../domain/math/distractors";
import { factKey } from "../domain/math/facts";
import { getHint } from "../domain/math/hints";
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
import { createDailyObjective } from "../domain/game/objectives";
import { getChapterForDay } from "../domain/game/progression";
import {
  createProfile,
  type AccessibilitySettings,
  type AvatarConfig,
  type CreateProfileInput,
  type PlayerProfile,
} from "../domain/profile/profile";
import { ProfileRepository } from "../infrastructure/storage/repository";

type Screen = "profiles" | "create" | "store" | "game" | "shop" | "settings";

export type AppProps = {
  repository?: ProfileRepository;
};

export function App({ repository }: AppProps) {
  const [storage] = useState(() => repository ?? new ProfileRepository());
  const [profiles, setProfiles] = useState<PlayerProfile[]>([]);
  const [activeProfile, setActiveProfile] = useState<PlayerProfile | null>(null);
  const [screen, setScreen] = useState<Screen>("profiles");
  const [session, setSession] = useState<DaySession | null>(null);
  const [notice, setNotice] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [storageError, setStorageError] = useState<string>("");

  useEffect(() => {
    let mounted = true;
    void storage.list()
      .then((loadedProfiles) => {
        if (mounted) setProfiles(loadedProfiles);
      })
      .catch(() => {
        if (mounted) setStorageError("Não conseguimos abrir os jogadores salvos neste dispositivo.");
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, [storage]);

  function persistProfile(profile: PlayerProfile): void {
    setActiveProfile(profile);
    setProfiles((current) => current.map((candidate) => candidate.id === profile.id ? profile : candidate));
    void storage.save(profile).catch(() => setStorageError("Não foi possível salvar esta mudança. Tente novamente."));
  }

  async function handleCreate(input: CreateProfileInput): Promise<void> {
    const profile = createProfile(input);
    try {
      await storage.save(profile);
      setProfiles((current) => [...current, profile]);
      setActiveProfile(profile);
      setScreen("store");
    } catch {
      setStorageError("Não foi possível criar o jogador. Verifique o armazenamento do navegador.");
    }
  }

  function startDay(): void {
    if (!activeProfile) return;
    const store = getStore(activeProfile.store.storeId);
    const daySeed = activeProfile.day * 101 + activeProfile.id.length * 7;
    setSession(createDaySession(store, activeProfile.day, daySeed, activeProfile.store.unlockedProducts));
    setNotice("");
    setScreen("game");
  }

  function answerQuestion(value: number): void {
    if (!activeProfile || !session) return;
    const visit = getCurrentVisit(session);
    const correct = value === visit.fact.answer;
    const nextSession = submitAnswer(session, value);
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
    setNotice(`Dia fechado! R$ ${session.revenue} entraram no caixa.`);
    setScreen("store");
  }

  function purchaseProductById(productId: string, cost: number): void {
    if (!activeProfile) return;
    const result = purchaseProduct(activeProfile.cash, cost);
    if (!result.ok) {
      setNotice("Ainda não dá para comprar isso. Vamos juntar mais dinheiro primeiro.");
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
    setNotice("Produto novo disponível na sua loja!");
  }

  function saveAccessibility(settings: AccessibilitySettings): void {
    if (!activeProfile) return;
    persistProfile({ ...activeProfile, accessibility: settings, updatedAt: new Date().toISOString() });
    setScreen("store");
  }

  if (loading) return <main className="loading-screen" aria-busy="true">Abrindo a loja...</main>;
  if (storageError && !activeProfile && profiles.length === 0) {
    return <main className="loading-screen"><h1>Ops!</h1><p>{storageError}</p><button className="primary-button" onClick={() => window.location.reload()}>Tentar novamente</button></main>;
  }

  return (
    <div className={`app-shell ${activeProfile?.accessibility.largeText ? "large-text" : ""} ${activeProfile?.accessibility.highContrast ? "high-contrast" : ""}`}>
      {storageError && <div className="storage-warning" role="alert">{storageError}</div>}
      {screen === "profiles" && <ProfileSelect profiles={profiles} onCreate={() => setScreen("create")} onSelect={(profile) => { setActiveProfile(profile); setScreen("store"); }} />}
      {screen === "create" && <ProfileCreate onCancel={() => setScreen("profiles")} onCreate={handleCreate} />}
      {screen === "store" && activeProfile && <StoreOverview profile={activeProfile} notice={notice} onStart={startDay} onShop={() => setScreen("shop")} onSettings={() => setScreen("settings")} onSwitch={() => { setActiveProfile(null); setScreen("profiles"); }} />}
      {screen === "game" && activeProfile && session && <GameScreen profile={activeProfile} session={session} onStartQuestion={() => setSession((current) => current ? { ...current, phase: "question" } : current)} onSelectQuantity={(quantity) => setSession((current) => current ? selectQuantity(current, quantity) : current)} onAnswer={answerQuestion} onRetry={() => setSession((current) => current ? retryQuestion(current) : current)} onContinue={() => setSession((current) => current ? continueAfterFeedback(current) : current)} onLeave={() => setScreen("store")} onFinish={finishDay} />}
      {screen === "shop" && activeProfile && <ShopScreen profile={activeProfile} onBack={() => setScreen("store")} onPurchase={purchaseProductById} />}
      {screen === "settings" && activeProfile && <SettingsScreen profile={activeProfile} onBack={() => setScreen("store")} onSave={saveAccessibility} />}
    </div>
  );
}

function ProfileSelect({ profiles, onCreate, onSelect }: { profiles: PlayerProfile[]; onCreate: () => void; onSelect: (profile: PlayerProfile) => void }) {
  return (
    <main className="welcome-screen">
      <div className="brand-mark" aria-hidden="true"><span>✦</span></div>
      <p className="eyebrow">Uma loja para descobrir</p>
      <h1>Lojinha Maluca</h1>
      <p className="lead">Cada compra esconde uma conta. Vamos descobrir quanto custa?</p>
      <section className="profile-panel" aria-labelledby="players-title">
        <h2 id="players-title">Quem vai jogar?</h2>
        {profiles.length === 0 ? <p className="muted">Ainda não há jogadores neste dispositivo.</p> : <div className="profile-grid">{profiles.map((profile) => <button className="profile-card" key={profile.id} onClick={() => onSelect(profile)}><Avatar avatar={profile.avatar} size="small" /><span><strong>{profile.nickname}</strong><small>{getStore(profile.store.storeId).name} · Dia {profile.day}</small></span></button>)}</div>}
        <button className="primary-button" onClick={onCreate}>Criar novo jogador</button>
      </section>
    </main>
  );
}

function ProfileCreate({ onCancel, onCreate }: { onCancel: () => void; onCreate: (input: CreateProfileInput) => Promise<void> }) {
  const [nickname, setNickname] = useState("");
  const [storeId, setStoreId] = useState<StoreId>("bookstore");
  const [avatar, setAvatar] = useState<AvatarConfig>({ skin: "warm", hair: "curly", outfit: "apron", accessory: "none" });
  const [reducedMotion, setReducedMotion] = useState(false);
  const [largeText, setLargeText] = useState(false);

  return (
    <main className="form-screen">
      <button className="text-button" onClick={onCancel}>← Voltar</button>
      <p className="eyebrow">Primeiro passo</p>
      <h1>Criar perfil</h1>
      <form onSubmit={(event) => { event.preventDefault(); void onCreate({ nickname, storeId, avatar, accessibility: { reducedMotion, largeText } }); }}>
        <label htmlFor="nickname">Como você quer ser chamado na sua loja?</label>
        <input id="nickname" value={nickname} onChange={(event) => setNickname(event.target.value)} placeholder="Seu apelido" maxLength={28} autoFocus />
        <div className="suggestion-row" aria-label="Sugestões de apelido">{["Lojista Pixel", "Mestre dos Blocos", "Capitão da Loja"].map((suggestion) => <button type="button" className="chip-button" key={suggestion} onClick={() => setNickname(suggestion)}>{suggestion}</button>)}</div>

        <fieldset>
          <legend>Escolha sua loja</legend>
          <div className="store-choice-grid">{STORES.map((store) => <button type="button" className={`store-choice ${store.id === storeId ? "selected" : ""}`} key={store.id} onClick={() => setStoreId(store.id)}><span className="store-swatch" style={{ background: store.color }} aria-hidden="true" /><strong>{store.name}</strong><small>{store.tagline}</small></button>)}</div>
        </fieldset>

        <fieldset>
          <legend>Personalize seu avatar</legend>
          <div className="avatar-editor"><Avatar avatar={avatar} size="large" /><div className="select-grid"><label>Visual<select value={avatar.skin} onChange={(event) => setAvatar({ ...avatar, skin: event.target.value as AvatarConfig["skin"] })}><option value="sunny">Dourado</option><option value="warm">Quente</option><option value="deep">Profundo</option></select></label><label>Cabelo<select value={avatar.hair} onChange={(event) => setAvatar({ ...avatar, hair: event.target.value as AvatarConfig["hair"] })}><option value="curly">Cacheado</option><option value="short">Curto</option><option value="long">Longo</option></select></label><label>Roupa<select value={avatar.outfit} onChange={(event) => setAvatar({ ...avatar, outfit: event.target.value as AvatarConfig["outfit"] })}><option value="apron">Avental</option><option value="jacket">Jaqueta</option><option value="overalls">Jardineira</option></select></label><label>Acessório<select value={avatar.accessory} onChange={(event) => setAvatar({ ...avatar, accessory: event.target.value as AvatarConfig["accessory"] })}><option value="none">Nenhum</option><option value="cap">Boné</option><option value="glasses">Óculos</option><option value="headphones">Fones</option></select></label></div></div>
        </fieldset>

        <fieldset><legend>Configurações rápidas</legend><label className="check-row"><input type="checkbox" checked={reducedMotion} onChange={(event) => setReducedMotion(event.target.checked)} /> Reduzir movimento</label><label className="check-row"><input type="checkbox" checked={largeText} onChange={(event) => setLargeText(event.target.checked)} /> Usar texto grande</label></fieldset>
        <button className="primary-button" type="submit">Começar</button>
      </form>
    </main>
  );
}

function StoreOverview({ profile, notice, onStart, onShop, onSettings, onSwitch }: { profile: PlayerProfile; notice: string; onStart: () => void; onShop: () => void; onSettings: () => void; onSwitch: () => void }) {
  const store = getStore(profile.store.storeId);
  const objective = createDailyObjective(profile.day + profile.id.length);
  const objectiveDone = profile.objectives.completed.includes(objective.id);
  return (
    <main className="game-screen">
      <header className="topbar"><div><p className="eyebrow">Sua loja</p><h1>{store.name}</h1></div><div className="cash-badge" aria-label={`Saldo R$ ${profile.cash}`}>R$ {profile.cash}</div></header>
      {notice && <div className="notice" role="status">{notice}</div>}
      <section className="diorama" style={{ "--store-color": store.color } as React.CSSProperties} aria-label={`Diorama da ${store.name}`}><div className="diorama-sky" /><div className="block-shelf shelf-one" /><div className="block-shelf shelf-two" /><div className="counter" /><Avatar avatar={profile.avatar} size="large" /></section>
      <section className="store-actions"><div><p className="eyebrow">Dia {profile.day} · Capítulo {profile.chapter}</p><h2>Pronta para atender?</h2><p className="muted">Atenda 5 ou 6 clientes e faça sua loja crescer.</p><div className="objective-line"><strong>Objetivo opcional: {objective.title}</strong><span>{objectiveDone ? "Concluído" : objective.description}</span></div></div><button className="primary-button" onClick={onStart}>Começar dia</button></section>
      <nav className="bottom-actions" aria-label="Ações da loja"><button onClick={onShop}>Produtos novos</button><button onClick={onSettings}>Configurações</button><button onClick={onSwitch}>Trocar jogador</button></nav>
    </main>
  );
}

function GameScreen({ profile, session, onStartQuestion, onSelectQuantity, onAnswer, onRetry, onContinue, onLeave, onFinish }: { profile: PlayerProfile; session: DaySession; onStartQuestion: () => void; onSelectQuantity: (quantity: number) => void; onAnswer: (value: number) => void; onRetry: () => void; onContinue: () => void; onLeave: () => void; onFinish: () => void }) {
  const visit = session.phase === "summary" ? undefined : getCurrentVisit(session);
  if (!visit) return <main className="game-screen"><section className="summary-card"><p className="eyebrow">Dia encerrado</p><h1>Fechamento da loja</h1><p className="summary-total">R$ {session.revenue}</p><p>Foi o faturamento de hoje. Esse dinheiro entra no seu caixa.</p><button className="primary-button" onClick={onFinish}>Guardar no caixa</button></section></main>;

  const alternatives = generateAlternatives(visit.fact, session.seed + session.currentIndex);
  const hint = getHint(visit.fact, session.errorsForCurrent);
  return (
    <main className="game-screen service-screen">
      <header className="service-header"><button className="text-button" aria-label="Voltar para a loja" onClick={onLeave}>× Voltar para a loja</button><span>Cliente {session.completedVisits + 1} de {session.visits.length}</span><strong>R$ {session.revenue}</strong></header>
      <section className="customer-card"><Avatar avatar={profile.avatar} size="small" /><div><p className="eyebrow">{visit.customer.name} chegou</p><h1>{visit.customer.phrase}</h1><p className="customer-request">Quero <strong>{visit.quantity} {visit.product.name.toLowerCase()}</strong>.</p></div></section>
      {session.phase === "customer" && <section className="question-card intro-card"><p>Vamos descobrir quanto custa a compra.</p><button className="primary-button" onClick={onStartQuestion}>Ver a conta</button></section>}
      {session.phase === "product-select" && <section className="question-card"><p className="eyebrow">Separe os produtos</p><h2>Quantos {visit.product.name.toLowerCase()}?</h2><div className="product-counter"><button aria-label="Remover produto" onClick={() => onSelectQuantity(session.selectedQuantity - 1)} disabled={session.selectedQuantity === 0}>−</button><div className="product-pile" aria-label={`${session.selectedQuantity} de ${visit.quantity} produtos separados`}>{Array.from({ length: session.selectedQuantity }, (_, index) => <span key={index} aria-hidden="true" className="mini-block" />)}</div><button aria-label="Adicionar produto" onClick={() => onSelectQuantity(session.selectedQuantity + 1)} disabled={session.selectedQuantity === visit.quantity}>+</button></div><p className="muted">{session.selectedQuantity} de {visit.quantity} separados</p></section>}
      {(session.phase === "question" || session.phase === "feedback") && <section className="question-card"><p className="equation-context">{visit.quantity} × R$ {visit.product.price}</p><h2>Quanto devo cobrar?</h2><div className="alternatives" role="group" aria-label="Alternativas de resposta">{alternatives.map((alternative) => <button key={alternative.value} className="answer-button" onClick={() => session.phase === "question" && onAnswer(alternative.value)} disabled={session.phase === "feedback"}>{`R$ ${alternative.value}`}</button>)}</div>{session.phase === "feedback" && session.feedback?.kind === "incorrect" && <div className="hint-box" role="status"><strong>Ainda não fechou a conta.</strong><p>{hint.text}</p>{session.errorsForCurrent >= 4 ? <button className="secondary-button" onClick={() => onAnswer(visit.fact.answer)}>Usar a conta completa para continuar</button> : <button className="secondary-button" onClick={onRetry}>Tentar de novo</button>}</div>}{session.phase === "feedback" && session.feedback?.kind === "correct" && <div className="success-box" role="status"><strong>✓ R$ {visit.fact.answer} — certo!</strong><p>Esse valor entrou nas vendas da loja.</p><button className="primary-button" onClick={onContinue}>{session.completedVisits === session.visits.length ? "Ver fechamento" : "Próximo cliente"}</button></div>}</section>}
    </main>
  );
}

function ShopScreen({ profile, onBack, onPurchase }: { profile: PlayerProfile; onBack: () => void; onPurchase: (productId: string, cost: number) => void }) {
  const store = getStore(profile.store.storeId);
  return <main className="form-screen"><button className="text-button" onClick={onBack}>← Voltar para a loja</button><p className="eyebrow">Catálogo</p><h1>Produtos novos</h1><p className="muted">Escolha o que vai aparecer na próxima expansão.</p><div className="product-grid">{store.products.map((product) => { const unlocked = profile.store.unlockedProducts.includes(product.id); return <article className={`product-card ${unlocked ? "unlocked" : ""}`} key={product.id}><span className="product-icon" aria-hidden="true">▦</span><h2>{product.name}</h2><p>Preço de venda: R$ {product.price}</p>{unlocked ? <strong>Disponível</strong> : <button className="secondary-button" onClick={() => onPurchase(product.id, product.unlockCost ?? 80)}>Comprar por R$ {product.unlockCost}</button>}</article>; })}</div></main>;
}

function SettingsScreen({ profile, onBack, onSave }: { profile: PlayerProfile; onBack: () => void; onSave: (settings: AccessibilitySettings) => void }) {
  const [settings, setSettings] = useState(profile.accessibility);
  return <main className="form-screen"><button className="text-button" onClick={onBack}>← Voltar para a loja</button><p className="eyebrow">Ajustes</p><h1>Configurações</h1><fieldset><legend>Acessibilidade</legend><label className="check-row"><input type="checkbox" checked={settings.reducedMotion} onChange={(event) => setSettings({ ...settings, reducedMotion: event.target.checked })} /> Reduzir movimento</label><label className="check-row"><input type="checkbox" checked={settings.largeText} onChange={(event) => setSettings({ ...settings, largeText: event.target.checked })} /> Texto grande</label><label className="check-row"><input type="checkbox" checked={settings.highContrast} onChange={(event) => setSettings({ ...settings, highContrast: event.target.checked })} /> Contraste reforçado</label></fieldset><button className="primary-button" onClick={() => onSave(settings)}>Salvar configurações</button></main>;
}

function Avatar({ avatar, size }: { avatar: AvatarConfig; size: "small" | "large" }) {
  return <div className={`avatar avatar-${size} skin-${avatar.skin} hair-${avatar.hair} outfit-${avatar.outfit}`} aria-label="Avatar do lojista"><span className="avatar-hair" aria-hidden="true" /><span className="avatar-face" aria-hidden="true" /><span className="avatar-body" aria-hidden="true" /><span className="avatar-accessory" aria-hidden="true">{avatar.accessory === "cap" ? "⌒" : avatar.accessory === "glasses" ? "◌" : avatar.accessory === "headphones" ? "◡" : ""}</span></div>;
}
