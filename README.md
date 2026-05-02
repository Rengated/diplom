# Шварц · Музыка кино

React + Vite + Electron longread рендер дизайна из Figma 1:1.

## Запуск

### Веб-версия (Vite dev server)
```bash
npm install
npm run dev
# открой http://localhost:5173
```

### Electron в режиме разработки
```bash
npm run electron:dev
# поднимает Vite на :5173 и открывает Electron-окно
```

### Production-сборка Electron
```bash
npm run electron:build
# собирает dist/ через Vite, затем упаковывает в release/ через electron-builder
# Linux → AppImage, Windows → NSIS installer, macOS → dmg
```

### Чисто статика (без Electron)
```bash
npm run build
npm run preview
```

## Структура

- `src/App.jsx` — корневой компонент, рендерит 5 глав
- `src/components/Chapter.jsx` — рендер главы поверх SVG: слайдеры, видео, кассеты, стрелки
- `src/data/chapters.js` — координаты слотов/стрелок/видео в нормализованных пропорциях
- `public/assets/chapter-*.svg` — обрезанные ассеты глав, 1:1 экспорт из Figma
- `public/assets/slides/*.svg` — отдельные слайды постеров и архива
- `electron/main.cjs` — Electron-процесс (грузит Vite в dev, dist/index.html в prod)
- `electron/preload.cjs` — контекст-изолированный preload

## Интерактив

- **Гл.1 постеры**: 3 слота, ‹/› стрелки прокручивают
- **Гл.1 фильмстрип**: клик по play → запускает HTML5 видео
- **Гл.4 hero**: клик → видео
- **Гл.5 семейный архив**:
  - 6 кассет вокруг бумбокса — каждая выбирает «трек» (меняет фильтр и подпись фото)
  - стрелки ‹/› — переключают по кругу
# diplom
