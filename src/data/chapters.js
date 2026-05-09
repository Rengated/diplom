// Each chapter is a static Figma SVG snapshot, plus optional interactive slots
// that overlay individual carousel slides 1:1 on top of the SVG.

const W = 1920

const CH1_H = 7225
const CH2_H = 7073
const CH3_H = 10136
const CH4_H = 6578
const CH5_H = 3417
const CH6_H = 2820

const ARROW_W = 70
const ARROW_H = 110

function arrow(side, cx, cy, frameH) {
  return {
    side,
    x: (cx - ARROW_W / 2) / W,
    y: (cy - ARROW_H / 2) / frameH,
    w: ARROW_W / W,
    h: ARROW_H / frameH,
  }
}

const POSTER_POOL = [
  'assets/slides/poster-1.svg',
  'assets/slides/poster-2.svg',
  'assets/slides/poster-3.svg',
  ...Array.from({ length: 22 }, (_, i) =>
    `assets/slides/posters/poster-extra-${String(i + 1).padStart(2, '0')}.jpg`
  ),
]

// Family archive — 6 photos + audio tracks (chapter 5, Shvarts)
const ARCHIVE_TRACKS = [
  {
    label: 'Любовь и разлука',
    photo: 'assets/slides/shvarts-photos/01.jpg',
    audio: 'assets/audio/shvarts/01-lyubov-i-razluka.mp3',
  },
  {
    label: 'Звезда пленительного счастья',
    photo: 'assets/slides/shvarts-photos/02.jpg',
    audio: 'assets/audio/shvarts/02-zvezda.mp3',
  },
  {
    label: 'Прогулка',
    photo: 'assets/slides/shvarts-photos/03.jpg',
    audio: 'assets/audio/shvarts/03-progulka.mp3',
  },
  {
    label: 'Станционный смотритель',
    photo: 'assets/slides/shvarts-photos/04.jpg',
    audio: 'assets/audio/shvarts/04-ne-sprashivay.mp3',
  },
  {
    label: 'Белое солнце пустыни',
    photo: 'assets/slides/shvarts-photos/05.jpg',
    audio: 'assets/audio/shvarts/05-vereshchagin.mp3',
  },
  {
    label: 'Кавалергарда век недолог',
    photo: 'assets/slides/shvarts-photos/06.webp',
    audio: 'assets/audio/shvarts/06-kavalergarda.mp3',
  },
]


// Dashkevich family-archive photos + audio (chapter 6 — separate Dashkevich archive frame)
const DASHKEVICH_TRACKS = [
  {
    label: 'Шерлок Холмс · Увертюра',
    photo: 'assets/slides/dashkevich-photos/01.jpg',
    audio: 'assets/audio/dashkevich/01-sherlock.mp3',
  },
  {
    label: 'Бумбараш · Ходят кони',
    photo: 'assets/slides/dashkevich-photos/02.jpg',
    audio: 'assets/audio/dashkevich/02-bumbarash.mp3',
  },
  {
    label: 'Как стать счастливым · Танец',
    photo: 'assets/slides/dashkevich-photos/03.jpg',
    audio: 'assets/audio/dashkevich/03-zimnyaya.mp3',
  },
  {
    label: 'Собачье сердце · Главная тема',
    photo: 'assets/slides/dashkevich-photos/04.jpg',
    audio: 'assets/audio/dashkevich/04-sobachie.mp3',
  },
  {
    label: 'Бумбараш · Марш 4-й роты',
    photo: 'assets/slides/dashkevich-photos/05.jpg',
    audio: 'assets/audio/dashkevich/05-marsh.mp3',
  },
  {
    label: 'Тень · Тень ушла',
    photo: 'assets/slides/dashkevich-photos/06.jpg',
    audio: 'assets/audio/dashkevich/06-shadow.mp3',
  },
]

// Cassette button positions (localX, localY in SVG coords, 221x47 each)
function cassettes(frameH) {
  const cells = [
    { x: 108, y: 763 },   // Group 102 — top-left
    { x: 108, y: 1020 },  // Rect 60 — mid-left
    { x: 108, y: 1274 },  // Rect 61 — bot-left
    { x: 1517, y: 763 },  // Group 103 — top-right
    { x: 1517, y: 1020 }, // Group 104 — mid-right
    { x: 1517, y: 1274 }, // Group 105 — bot-right
  ]
  return cells.map((c, i) => ({
    x: c.x / W,
    y: c.y / frameH,
    w: 221 / W,
    h: 47 / frameH,
    trackIndex: i,
  }))
}

export const CHAPTERS = [
  {
    id: 'ch1',
    title: 'Петербург — город кино и музыки',
    src: 'assets/chapter-1-petersburg.svg',
    width: W,
    height: CH1_H,
    accent: '#5a8aa8',
    sections: 6,
    arrows: [
      arrow('prev', 130, 2305, CH1_H),
      arrow('next', 1790, 2305, CH1_H),
    ],
    slider: {
      pool: POSTER_POOL,
      slots: [
        { x: 229 / W, y: 1987 / CH1_H, w: 441 / W, h: 636 / CH1_H },
        { x: 771 / W, y: 1987 / CH1_H, w: 437 / W, h: 636 / CH1_H },
        { x: 1309 / W, y: 1987 / CH1_H, w: 424 / W, h: 636 / CH1_H },
      ],
    },
    video: {
      x: 280 / W,
      y: 5918 / CH1_H,
      w: 1339 / W,
      h: 1024 / CH1_H,
      src: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
    },
  },
  {
    id: 'ch3',
    title: 'Исаак Шварц',
    src: 'assets/chapter-3-shvarts.svg',
    width: W,
    height: CH3_H,
    accent: '#c5a47e',
    sections: 8,
  },
  {
    id: 'ch5',
    title: 'Музыка Исаака Шварца · Семейный архив',
    src: 'assets/chapter-5-archive.svg',
    width: W,
    height: CH5_H,
    accent: '#c5a47e',
    sections: 4,
    arrows: [
      arrow('prev', 270, 2338, CH5_H),
      arrow('next', 1650, 2338, CH5_H),
    ],
    archive: {
      pool: ARCHIVE_TRACKS,
      slot: { x: 388 / W, y: 1951 / CH5_H, w: 1126 / W, h: 774 / CH5_H },
      cassettes: cassettes(CH5_H),
    },
  },
  {
    id: 'ch2',
    title: 'Владимир Дашкевич',
    src: 'assets/chapter-2-dashkevich.svg',
    width: W,
    height: CH2_H,
    accent: '#7a9b7d',
    sections: 6,
  },
  {
    id: 'ch6',
    title: 'Музыка Владимира Дашкевича · Семейный архив',
    src: 'assets/chapter-6-dashkevich-archive.svg',
    width: W,
    height: CH6_H,
    accent: '#7a9b7d',
    sections: 4,
    arrows: [
      arrow('prev', 270, 2338, CH6_H),
      arrow('next', 1650, 2338, CH6_H),
    ],
    archive: {
      pool: DASHKEVICH_TRACKS,
      slot: { x: 388 / W, y: 1951 / CH6_H, w: 1126 / W, h: 774 / CH6_H },
      cassettes: cassettes(CH6_H),
    },
  },
  {
    id: 'ch4',
    title: 'Карта · По следам Исаака Шварца',
    src: 'assets/chapter-4-routes.svg',
    width: W,
    height: CH4_H,
    accent: '#a98864',
    sections: 5,
    video: {
      x: 120 / W,
      y: 610 / CH4_H,
      w: 1680 / W,
      h: 1062 / CH4_H,
      src: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
    },
  },
]

// High-level menu sections. Each section can group multiple chapters that
// share a topic (composer + their archive). Order here drives the menu
// and "Дальше →" navigation between chapters.
export const SECTIONS = [
  {
    id: 'petersburg',
    title: 'Петербург',
    subtitle: 'Город кино и музыки',
    chapterIds: ['ch1'],
  },
  {
    id: 'shvarts',
    title: 'Исаак Шварц',
    subtitle: 'История композитора и семейный архив',
    chapterIds: ['ch3', 'ch5'],
  },
  {
    id: 'dashkevich',
    title: 'Владимир Дашкевич',
    subtitle: 'История композитора и семейный архив',
    chapterIds: ['ch2', 'ch6'],
  },
  {
    id: 'map',
    title: 'Карта',
    subtitle: 'По следам Исаака Шварца',
    chapterIds: ['ch4'],
  },
]
