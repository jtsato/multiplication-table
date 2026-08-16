import { createDefaultState } from './domain/defaultState.js';
import { completeMission, recordAnswer } from './domain/progress.js';
import { generateChoices, pickAdaptiveFact } from './domain/questions.js';
import { LocalStorageProgressRepository } from './persistence/localStorageRepository.js';
import { t } from './i18n/index.js';
import { ISLANDS, getIsland } from './data/islands.js';

const root = document.querySelector('#root');
const repository = new LocalStorageProgressRepository();
let state = await repository.load();
let screen = state.player.created ? 'home' : 'onboarding';
let mission = null;
let result = null;
let confirmReset = false;

const colors = ['coral', 'sky', 'mint', 'violet'];

function tr(key, params) {
  return t(state.settings.locale, key, params);
}

function save() {
  return repository.save(state);
}

function countCompleted() {
  return Object.values(state.progress.islands).filter((item) => item.status === 'completed').length;
}

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function playTone(kind) {
  if (!state.settings.soundEffectsEnabled) return;
  const AudioContext = globalThis.AudioContext || globalThis.webkitAudioContext;
  if (!AudioContext) return;
  const context = new AudioContext();
  const oscillator = context.createOscillator();
  const gain = context.createGain();
  oscillator.type = 'sine';
  oscillator.frequency.value = kind === 'good' ? 660 : 220;
  gain.gain.setValueAtTime(0.0001, context.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.12, context.currentTime + 0.01);
  gain.gain.exponentialRampToValueAtTime(0.0001, context.currentTime + 0.18);
  oscillator.connect(gain);
  gain.connect(context.destination);
  oscillator.start();
  oscillator.stop(context.currentTime + 0.2);
  oscillator.addEventListener('ended', () => context.close());
}

function avatarMarkup(size = 'large', avatar = state.player.avatar, color = state.player.color) {
  const accessory = avatar === 'girl' ? '✿' : '★';
  return `
    <div class="block-avatar ${size} avatar-${color} avatar-kind-${avatar}" aria-hidden="true">
      <div class="avatar-hair"></div>
      <div class="avatar-face"><span class="eye left"></span><span class="eye right"></span><span class="smile"></span></div>
      <div class="avatar-body"></div>
      <div class="avatar-accessory">${accessory}</div>
    </div>`;
}

function shell(content, options = {}) {
  const { compact = false } = options;
  return `
    <div class="app-shell ${compact ? 'compact' : ''}">
      <div class="cloud cloud-a"></div><div class="cloud cloud-b"></div>
      <header class="topbar">
        <button class="brand-button" data-action="home" aria-label="${escapeHtml(tr('game.title'))}">
          <span class="brand-cube">×</span><span>${escapeHtml(tr('game.title'))}</span>
        </button>
        ${state.player.created ? `<div class="mini-profile">${avatarMarkup('mini')}<span>🔥 ${state.statistics.currentStreak}</span></div>` : ''}
      </header>
      <main>${content}</main>
      <div class="orientation-hint">📱 ${escapeHtml(tr('orientation.hint'))}</div>
    </div>`;
}

function renderOnboarding() {
  const hero = state.player.avatar;
  root.innerHTML = shell(`
    <section class="panel onboarding-panel">
      <div class="hero-copy">
        <div class="logo-cubes"><span>2</span><span>×</span><span>3</span><span>=</span><span>6</span></div>
        <h1>${escapeHtml(tr('game.title'))}</h1>
        <p>${escapeHtml(tr('game.subtitle'))}</p>
      </div>

      <div class="setup-step">
        <h2>1. ${escapeHtml(tr('onboarding.language'))}</h2>
        <div class="choice-row">
          <button class="choice ${state.settings.locale === 'pt-BR' ? 'selected' : ''}" data-action="locale" data-value="pt-BR">🇧🇷 ${escapeHtml(tr('language.pt'))}</button>
          <button class="choice ${state.settings.locale === 'en-US' ? 'selected' : ''}" data-action="locale" data-value="en-US">🇺🇸 ${escapeHtml(tr('language.en'))}</button>
        </div>
      </div>

      <div class="setup-step">
        <h2>2. ${escapeHtml(tr('onboarding.hero'))}</h2>
        <div class="hero-picker">
          <button class="hero-card ${hero === 'girl' ? 'selected' : ''}" data-action="avatar" data-value="girl">
            ${avatarMarkup('picker', 'girl')}
            <strong>${escapeHtml(tr('onboarding.girl'))}</strong>
          </button>
          <button class="hero-card ${hero === 'boy' ? 'selected' : ''}" data-action="avatar" data-value="boy">
            ${avatarMarkup('picker', 'boy')}
            <strong>${escapeHtml(tr('onboarding.boy'))}</strong>
          </button>
        </div>
      </div>

      <div class="setup-step">
        <h2>3. ${escapeHtml(tr('onboarding.style'))}</h2>
        <div class="color-picker">
          ${colors.map((color) => `<button class="color-dot color-${color} ${state.player.color === color ? 'selected' : ''}" data-action="color" data-value="${color}" aria-label="${escapeHtml(tr(`color.${color}`))}"></button>`).join('')}
        </div>
      </div>

      <button class="primary huge" data-action="finish-onboarding">🚀 ${escapeHtml(tr('onboarding.start'))}</button>
    </section>`);
}

function renderHome() {
  const done = countCompleted();
  root.innerHTML = shell(`
    <section class="home-grid">
      <div class="panel welcome-card">
        <div class="welcome-scene">
          ${avatarMarkup('large')}
          <div class="pet-block">🦜</div>
          <div class="grass-blocks"><i></i><i></i><i></i><i></i><i></i></div>
        </div>
        <div>
          <p class="eyebrow">${escapeHtml(tr('home.progress'))}</p>
          <h1>${escapeHtml(tr('game.title'))}</h1>
          <p>${escapeHtml(tr('home.tablesCompleted', { done }))}</p>
          <div class="progress-track"><span style="width:${Math.round((done / 9) * 100)}%"></span></div>
          <button class="primary huge" data-action="map">▶ ${escapeHtml(tr('home.play'))}</button>
        </div>
      </div>

      <div class="side-stack">
        <button class="panel menu-card" data-action="achievements"><span>🏆</span><strong>${escapeHtml(tr('home.achievements'))}</strong></button>
        <button class="panel menu-card" data-action="settings"><span>⚙️</span><strong>${escapeHtml(tr('home.settings'))}</strong></button>
        <div class="panel stats-card">
          <div><strong>${state.statistics.totalCorrect}</strong><span>${escapeHtml(tr('stats.correct'))}</span></div>
          <div><strong>${state.statistics.bestStreak}</strong><span>${escapeHtml(tr('stats.bestStreak'))}</span></div>
          <div><strong>${state.statistics.totalQuestions}</strong><span>${escapeHtml(tr('stats.questions'))}</span></div>
        </div>
      </div>
    </section>`);
}

function statusLabel(status) {
  return tr(`map.${status}`);
}

function renderMap() {
  root.innerHTML = shell(`
    <section class="panel map-panel">
      <div class="section-heading">
        <button class="ghost" data-action="home">← ${escapeHtml(tr('nav.back'))}</button>
        <div><h1>${escapeHtml(tr('map.title'))}</h1><p>${escapeHtml(tr('map.subtitle'))}</p></div>
      </div>
      <div class="island-path">
        ${ISLANDS.map((island, index) => {
          const progress = state.progress.islands[String(island.table)];
          const locked = progress.status === 'locked';
          return `<article class="island-card theme-${island.theme} status-${progress.status}" style="--path-index:${index}">
            <div class="island-art"><span>${island.icon}</span><b>${island.table}</b></div>
            <div class="island-info">
              <span class="status-pill">${locked ? '🔒' : progress.status === 'completed' ? '✓' : '★'} ${escapeHtml(statusLabel(progress.status))}</span>
              <h2>${escapeHtml(tr('map.table', { table: island.table }))}</h2>
              <p>${escapeHtml(tr(island.biomeKey))}</p>
              ${locked ? '' : `<button class="primary" data-action="start-mission" data-table="${island.table}">${escapeHtml(tr('map.play'))}</button>`}
            </div>
          </article>`;
        }).join('')}
      </div>
    </section>`, { compact: true });
}

function chooseMissionFact(table, recentKeys) {
  const weakPrevious = Object.entries(state.statistics.facts)
    .filter(([key, value]) => {
      const factTable = Number(key.split('x')[0]);
      return factTable < table && value.attempts > 0 && value.masteryScore < 0.7 && !recentKeys.includes(key);
    })
    .map(([key]) => {
      const [factTable, multiplier] = key.split('x').map(Number);
      return { table: factTable, multiplier, key, answer: factTable * multiplier };
    });

  if (weakPrevious.length && Math.random() < 0.2) {
    return weakPrevious[Math.floor(Math.random() * weakPrevious.length)];
  }
  return pickAdaptiveFact(table, state.statistics.facts, recentKeys);
}

async function startMission(table) {
  const progress = state.progress.islands[String(table)];
  if (!progress || progress.status === 'locked') return;
  if (progress.status !== 'completed') {
    state = {
      ...state,
      progress: {
        ...state.progress,
        islands: {
          ...state.progress.islands,
          [String(table)]: { ...progress, status: 'inProgress' },
        },
      },
      statistics: { ...state.statistics, playSessions: state.statistics.playSessions + 1 },
    };
  }
  await save();
  const fact = chooseMissionFact(table, []);
  mission = {
    table,
    questionIndex: 0,
    firstTryCorrect: 0,
    recentKeys: [fact.key],
    currentFact: fact,
    choices: generateChoices(fact.answer),
    attemptsThisQuestion: 0,
    feedback: null,
    hint: false,
    locked: false,
  };
  screen = 'mission';
  render();
}

function constructionMarkup(island, built) {
  const blocks = Array.from({ length: 5 }, (_, index) => `<span class="build-block ${index < built ? 'built' : ''}"></span>`).join('');
  return `
    <div class="world-scene theme-${island.theme}">
      <div class="sun-block"></div>
      <div class="scene-decoration left">${island.icon}</div>
      <div class="scene-decoration right">${island.icon}</div>
      <div class="terrain terrain-back"></div>
      <div class="water-strip"></div>
      <div class="construction construction-${island.table}">${blocks}</div>
      <div class="scene-avatar">${avatarMarkup('scene')}</div>
    </div>`;
}

function hintMarkup(fact) {
  return `<div class="visual-hint" aria-label="${escapeHtml(tr('question.hint', { groups: fact.table, items: fact.multiplier }))}">
    ${Array.from({ length: Math.min(fact.table, 10) }, () => `<div class="hint-group">${Array.from({ length: Math.min(fact.multiplier, 10) }, () => '<i></i>').join('')}</div>`).join('')}
  </div>`;
}

function renderMission() {
  const island = getIsland(mission.table);
  const fact = mission.currentFact;
  const isReview = fact.table !== mission.table;
  root.innerHTML = shell(`
    <section class="mission-layout">
      <div class="mission-topline">
        <button class="ghost light" data-action="map">← ${escapeHtml(tr('mission.exit'))}</button>
        <div class="mission-title"><span>${island.icon}</span><div><strong>${escapeHtml(tr('mission.title', { construction: tr(island.constructionKey) }))}</strong><small>${escapeHtml(tr('mission.progress', { current: mission.questionIndex }))}</small></div></div>
        <div class="streak-badge">🔥 ${state.statistics.currentStreak}</div>
      </div>
      ${constructionMarkup(island, mission.questionIndex)}
      <div class="panel question-card" aria-live="polite">
        ${isReview ? `<span class="review-badge">↻ ${escapeHtml(tr('mission.review'))}</span>` : ''}
        <p>${escapeHtml(tr('mission.subtitle'))}</p>
        <h1>${escapeHtml(tr('question.label', { a: fact.table, b: fact.multiplier }))}</h1>
        <div class="answer-grid">
          ${mission.choices.map((choice) => `<button class="answer-button" data-action="answer" data-value="${choice}" ${mission.locked ? 'disabled' : ''}>${choice}</button>`).join('')}
        </div>
        ${mission.feedback ? `<div class="feedback ${mission.feedback}">${mission.feedback === 'correct' ? '✨ ' + escapeHtml(tr('question.correct')) : '💡 ' + escapeHtml(tr('question.wrong'))}</div>` : ''}
        ${mission.hint ? hintMarkup(fact) : ''}
      </div>
    </section>`, { compact: true });
}

async function answerQuestion(value) {
  if (!mission || mission.locked) return;
  const fact = mission.currentFact;
  const correct = Number(value) === fact.answer;
  state = recordAnswer(state, fact, correct);
  await save();

  if (!correct) {
    mission.attemptsThisQuestion += 1;
    mission.feedback = 'wrong';
    mission.hint = true;
    playTone('bad');
    render();
    return;
  }

  if (mission.attemptsThisQuestion === 0) mission.firstTryCorrect += 1;
  mission.feedback = 'correct';
  mission.hint = false;
  mission.locked = true;
  mission.questionIndex += 1;
  playTone('good');
  render();

  setTimeout(async () => {
    if (!mission) return;
    if (mission.questionIndex >= 5) {
      const accuracy = mission.firstTryCorrect / 5;
      state = completeMission(state, mission.table, accuracy);
      await save();
      result = { table: mission.table, correct: mission.firstTryCorrect, total: 5 };
      mission = null;
      screen = 'result';
      render();
      return;
    }

    const nextFact = chooseMissionFact(mission.table, mission.recentKeys.slice(-2));
    mission.recentKeys = [...mission.recentKeys, nextFact.key].slice(-4);
    mission.currentFact = nextFact;
    mission.choices = generateChoices(nextFact.answer);
    mission.attemptsThisQuestion = 0;
    mission.feedback = null;
    mission.hint = false;
    mission.locked = false;
    render();
  }, 520);
}

function renderResult() {
  const isFinal = result.table === 10;
  const island = getIsland(result.table);
  root.innerHTML = shell(`
    <section class="panel result-panel theme-${island.theme}">
      <div class="celebration">🎉 <span>★</span> 🎉</div>
      <div class="result-build">${island.icon}${island.icon}${island.icon}</div>
      <h1>${escapeHtml(tr('result.title'))}</h1>
      <p class="result-score">${escapeHtml(tr('result.accuracy', { correct: result.correct, total: result.total }))}</p>
      <p>${escapeHtml(tr(isFinal ? 'result.finishAll' : 'result.unlock'))}</p>
      <button class="primary huge" data-action="map">🗺️ ${escapeHtml(tr('result.continue'))}</button>
    </section>`);
}

function achievementLabel(id) {
  if (id.startsWith('table-')) {
    return `✅ ${tr('map.table', { table: id.split('-')[1] })}`;
  }
  return tr(`achievement.${id}`);
}

function renderAchievements() {
  const achievements = state.achievements;
  root.innerHTML = shell(`
    <section class="panel content-panel">
      <div class="section-heading"><button class="ghost" data-action="home">← ${escapeHtml(tr('nav.back'))}</button><h1>🏆 ${escapeHtml(tr('achievements.title'))}</h1></div>
      ${achievements.length ? `<div class="achievement-grid">${achievements.map((id) => `<div class="achievement-card"><span>🏅</span><strong>${escapeHtml(achievementLabel(id))}</strong></div>`).join('')}</div>` : `<div class="empty-state">🌟 ${escapeHtml(tr('achievements.empty'))}</div>`}
    </section>`);
}

function renderSettings() {
  root.innerHTML = shell(`
    <section class="panel content-panel settings-panel">
      <div class="section-heading"><button class="ghost" data-action="home">← ${escapeHtml(tr('nav.back'))}</button><h1>⚙️ ${escapeHtml(tr('settings.title'))}</h1></div>
      <div class="setting-row"><span>🌎 ${escapeHtml(tr('settings.language'))}</span><div class="choice-row compact"><button class="choice ${state.settings.locale === 'pt-BR' ? 'selected' : ''}" data-action="locale" data-value="pt-BR">PT-BR</button><button class="choice ${state.settings.locale === 'en-US' ? 'selected' : ''}" data-action="locale" data-value="en-US">EN-US</button></div></div>
      <div class="setting-row"><span>🎵 ${escapeHtml(tr('settings.music'))}</span><button class="toggle ${state.settings.musicEnabled ? 'on' : ''}" data-action="toggle-music" aria-pressed="${state.settings.musicEnabled}">${escapeHtml(tr(state.settings.musicEnabled ? 'settings.on' : 'settings.off'))}</button></div>
      <div class="setting-row"><span>🔊 ${escapeHtml(tr('settings.effects'))}</span><button class="toggle ${state.settings.soundEffectsEnabled ? 'on' : ''}" data-action="toggle-effects" aria-pressed="${state.settings.soundEffectsEnabled}">${escapeHtml(tr(state.settings.soundEffectsEnabled ? 'settings.on' : 'settings.off'))}</button></div>
      <button class="danger" data-action="ask-reset">🗑️ ${escapeHtml(tr('settings.reset'))}</button>
      ${confirmReset ? `<div class="confirm-box"><p>${escapeHtml(tr('settings.resetConfirm'))}</p><div class="choice-row"><button class="ghost" data-action="cancel-reset">${escapeHtml(tr('settings.cancel'))}</button><button class="danger" data-action="reset">${escapeHtml(tr('settings.confirmReset'))}</button></div></div>` : ''}
    </section>`);
}

function render() {
  document.documentElement.lang = state.settings.locale;
  document.title = tr('game.title');
  if (screen === 'onboarding') renderOnboarding();
  else if (screen === 'home') renderHome();
  else if (screen === 'map') renderMap();
  else if (screen === 'mission') renderMission();
  else if (screen === 'result') renderResult();
  else if (screen === 'achievements') renderAchievements();
  else if (screen === 'settings') renderSettings();
}

root.addEventListener('click', async (event) => {
  const button = event.target.closest('[data-action]');
  if (!button) return;
  const action = button.dataset.action;

  if (action === 'locale') {
    state = { ...state, settings: { ...state.settings, locale: button.dataset.value } };
    await save();
  } else if (action === 'avatar') {
    state = { ...state, player: { ...state.player, avatar: button.dataset.value } };
  } else if (action === 'color') {
    state = { ...state, player: { ...state.player, color: button.dataset.value } };
  } else if (action === 'finish-onboarding') {
    state = { ...state, player: { ...state.player, created: true } };
    await save();
    screen = 'home';
  } else if (action === 'home') {
    mission = null;
    screen = state.player.created ? 'home' : 'onboarding';
  } else if (action === 'map') {
    mission = null;
    screen = 'map';
  } else if (action === 'achievements') {
    screen = 'achievements';
  } else if (action === 'settings') {
    confirmReset = false;
    screen = 'settings';
  } else if (action === 'start-mission') {
    await startMission(Number(button.dataset.table));
    return;
  } else if (action === 'answer') {
    await answerQuestion(button.dataset.value);
    return;
  } else if (action === 'toggle-music') {
    state = { ...state, settings: { ...state.settings, musicEnabled: !state.settings.musicEnabled } };
    await save();
  } else if (action === 'toggle-effects') {
    state = { ...state, settings: { ...state.settings, soundEffectsEnabled: !state.settings.soundEffectsEnabled } };
    await save();
  } else if (action === 'ask-reset') {
    confirmReset = true;
  } else if (action === 'cancel-reset') {
    confirmReset = false;
  } else if (action === 'reset') {
    await repository.reset();
    state = createDefaultState();
    confirmReset = false;
    screen = 'onboarding';
  }

  render();
});

render();
