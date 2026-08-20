import type { LocaleDefinition } from '../types';

/**
 * English.
 *
 * The wording keeps the same promise the Portuguese makes: nothing threatens,
 * nothing scolds, and no sentence needs fluent reading. "Almost!" rather than
 * "Wrong", "Practise the table here" rather than "You need more coins".
 *
 * English has no grammatical gender, so `gender` is left out of the nouns — the
 * grammar for this locale never reads it.
 */
export const enUS: LocaleDefinition = {
  strings: {
    tagline: 'The times table island',
    loading: 'Loading the island…',

    day: 'day {{n}}',
    phaseDay: 'Day',
    phaseDusk: 'Dusk',
    phaseNight: 'Night',
    phaseDawn: 'Dawn',
    campfire: 'Campfire',
    fence: 'Fence',
    coins: 'coins',
    coinsLabel: 'Coins: {{n}}',
    lanternLabel: 'Lantern',
    lanternLow: 'The lantern is running low',
    duskWarning: 'Getting dark — light your lantern at the campfire ({{s}}s)',
    harvestPrompt: 'Press E to gather',
    buildPrompt: 'Space to build · Esc to cancel',
    buildOffLand: 'Too far — build on solid ground',
    buildOverlaps: 'Something is already built here',
    buildTooClose: 'Too close to a resource',
    bridgePrompt: 'Press E to build the bridge ({{moedas}} coins · {{receita}})',

    controlsTitle: 'Controls',
    controlsMove: 'WASD — walk',
    controlsCamera: '← → or drag the mouse — turn the camera',
    controlsSolve: 'E — solve and gather · 1 2 3 — answer',
    controlsBuild: 'B — campfire · C — fence · L — shop',
    controlsSpace: 'Space — build · Esc — cancel',
    joystickLabel: 'Move',
    summaryLabel: 'Day summary',
    bedLabel: 'Bed',
    tableHeader: 'times table',
    language: 'Language',

    challengePrompt: '{{grupos}} with {{itens}} each',
    correct: 'Yes!',
    wrong: 'Almost!',
    answerWas: 'The answer was {{n}}',
    useHint: 'Use a hint ({{n}})',
    fireFull: 'Campfire full and lantern lit!',
    fireSome: 'A little wood and a little light',
    feedPrompt: 'Press E to feed',
    feedFriend: 'Made a friend!',
    orderPrompt: 'Press E to deliver the order',
    orderDone: 'Order delivered!',
    tollOpen: 'Bridge open!',
    ordersTitle: 'Order board',

    hintsStored: 'Hints saved: {{n}}',
    shopTitle: 'Shop',
    shopClose: 'Close',
    noCoins: 'Not enough coins',
    noResources: 'Not enough resources',
    alreadyOwned: 'You already have one',
    needTable: 'Practise the table here',

    mirrorTitle: 'Mirror',
    chartTitle: 'Times table chart',
    chartFree: 'Look all you like — it costs nothing here.',
    bedTitle: 'Your bed',
    bedQuestion: 'Sleep and wake up tomorrow morning?',
    bedSleep: 'Sleep until dawn',
    bedNotYet: 'Not yet',
    ready: 'Done',
    close: 'Close',

    settingsTitle: 'Settings',
    settingsVolume: 'Volume',
    settingsSensitivity: 'Camera sensitivity',
    settingsLanguage: 'Language',
    settingsFullscreen: 'Enter fullscreen',
    settingsExitFullscreen: 'Exit fullscreen',

    bookTitle: 'Animal notebook',
    bookSeen: 'Seen',
    bookFriend: 'Friend',
    bookNotSeen: 'Not seen yet',
    bookTake: 'Take along',
    bookCurrentPet: 'With you: {{animal}}',

    character: 'Character',
    boy: 'Boy',
    girl: 'Girl',
    skin: 'Skin',
    clothes: 'Clothes',
    skinTone: 'Skin tone {{n}}',
    clothesColor: 'Clothes colour {{n}}',
    head: 'Head',
    face: 'Face',
    noHat: 'No hat',
    cap: 'Cap',
    hat: 'Hat',
    crown: 'Crown',
    noGlasses: 'No glasses',
    glasses: 'Glasses',

    summaryTitle: 'Morning — day {{n}}',
    summaryCorrect: 'right answers',
    summaryCorrectOne: 'right answer',
    summaryCoins: 'coins',
    summaryCoinsOne: 'coin',
    summaryLearned: 'You learned {{fatos}}',
    continueLabel: 'Continue',

    dailyTitle: 'Today',
    dailyChuva: 'Rainy day — the garden starts watered',
    dailyFartura: 'Bountiful day — harvests yield double',
    dailyVisitante: 'Special visitor at the harbor',
    dailyBaleiaNaPraia: 'The whale is near the beach',
  },

  resources: {
    madeira: {
      group: { one: 'branch', many: 'branches' },
      item: { one: 'stick', many: 'sticks' },
      stock: { one: 'wood', many: 'wood' },
    },
    fruta: {
      group: { one: 'bunch', many: 'bunches' },
      item: { one: 'berry', many: 'berries' },
      stock: { one: 'berry', many: 'berries' },
    },
    pedra: {
      group: { one: 'pile', many: 'piles' },
      item: { one: 'stone', many: 'stones' },
      stock: { one: 'stone', many: 'stones' },
    },
    concha: {
      group: { one: 'basket', many: 'baskets' },
      item: { one: 'shell', many: 'shells' },
      stock: { one: 'shell', many: 'shells' },
    },
    peixe: {
      group: { one: 'net', many: 'nets' },
      // Plural igual ao singular, e por isso escrito: nenhuma regra derivaria.
      item: { one: 'fish', many: 'fish' },
      stock: { one: 'fish', many: 'fish' },
    },
    cogumelo: {
      group: { one: 'stump', many: 'stumps' },
      item: { one: 'mushroom', many: 'mushrooms' },
      stock: { one: 'mushroom', many: 'mushrooms' },
    },
    cristal: {
      group: { one: 'vein', many: 'veins' },
      item: { one: 'crystal', many: 'crystals' },
      stock: { one: 'crystal', many: 'crystals' },
    },
    mel: {
      group: { one: 'hive', many: 'hives' },
      item: { one: 'honey jar', many: 'honey jars' },
      stock: { one: 'honey', many: 'honey' },
    },
    gelo: {
      group: { one: 'mound', many: 'mounds' },
      item: { one: 'ice shard', many: 'ice shards' },
      stock: { one: 'ice', many: 'ice' },
    },
  },

  regions: {
    praia: 'Beach',
    porto: 'Harbour',
    bosque: 'Woods',
    cachoeira: 'Waterfall',
    pomar: 'Orchard',
    pico: 'Peak',
  },

  animals: {
    gaivota: 'Seagull',
    peixe: 'Fish',
    cachorro: 'Dog',
    gato: 'Cat',
    cavalo: 'Horse',
    vaca: 'Cow',
    unicornio: 'Unicorn',
    dinossauro: 'Dinosaur',
  },

  shop: {
    'lanterna-maior': { label: 'Bigger lantern', effect: 'Shines farther and lasts longer.' },
    botas: { label: 'Boots', effect: 'You walk faster.' },
    dica: { label: 'Hint', effect: 'Removes one wrong answer.' },
    sementes: {
      label: 'Seeds',
      effect: 'Plant them in the Orchard garden; they grow by the next day.',
    },
    tapete: { label: 'Shell rug', effect: 'Makes the room softer.' },
    aquario: { label: 'Aquarium', effect: 'The fish keep swimming.' },
    vaso: { label: 'Mushroom pot', effect: 'Glows a little at night.' },
    lustre: { label: 'Crystal chandelier', effect: 'Scatters coloured light.' },
    prateleira: { label: 'Honey shelf', effect: 'Smells good from far away.' },
    escultura: { label: 'Ice sculpture', effect: 'Never melts.' },
  },
};
