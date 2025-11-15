# Stand-Up Reminder

Lightweight always-on-top desktop companion that nudges you to move, stretch, and track your most important tasks for the day.

## Features

- Minimal frameless Electron window with draggable clock and theme switching
- Harmonic resizing: clock, controls, and timer adapt to any window size
- Always-on-top toggle and quick minimize/close buttons
- Bubble reminder with louder audio cue and randomized motivational text
- Notes drawer with Kanban micro-board (Задачи / В прогрес / Готово)
- Drag-and-drop cards, progress bar, celebratory toasts, and persistent storage
- Resizable notes panel + transparent connector to the clock
- Theme-aware color schemes and five preset palettes

## How to Run (Development)

```bash
npm install
npm start
```

The app launches via `electron .` and reloads as you edit `renderer.js`, `styles.css`, etc.

## Packaging

You can package the app with your preferred Electron builder (for example `electron-builder` or `electron-packager`). A typical flow is:

```bash
npm run build      # optional if you have a build step
npx electron-builder
```

That produces an installer (`.exe`) or portable binary inside `dist/` that you can install and pin like any desktop app.

## Repo Structure

- `electron/` – main & preload processes
- `renderer.js` – UI logic, reminders, notes, drag-resize, IPC hooks
- `styles.css` – theming, responsive layout, Kanban styling
- `index.html` – clock shell + notes drawer markup
- `README.md` – you are here 😊
