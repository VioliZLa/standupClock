const clock = document.getElementById("clock");
const timeDisplay = document.getElementById("time");
const secondsDisplay = document.getElementById("seconds");
const bubble = document.getElementById("bubble");
const minimizeButton = document.getElementById("minimizeButton");
const closeButton = document.getElementById("closeButton");
const intervalSelect = document.getElementById("intervalSelect");
const statsText = document.getElementById("statsText");
const markButton = document.getElementById("markButton");

const noteButton = document.getElementById("noteButton");
const noteDrawer = document.getElementById("noteDrawer");
const noteBackdrop = document.getElementById("noteBackdrop");
const noteChecklist = document.getElementById("noteChecklist");
const noteChecklistAdd = document.getElementById("noteChecklistAdd");
const noteList = document.getElementById("noteList");
const noteMinimize = document.getElementById("noteMinimize");
const noteClose = document.getElementById("noteClose");
const noteUpdated = document.getElementById("noteUpdated");
const celebrationToast = document.getElementById("celebrationToast");
const appContainer = document.getElementById("app");
const dragHandle = document.getElementById("dragHandle");
const pinButton = document.getElementById("pinButton");
const themeButton = document.getElementById("themeButton");
const noteConnector = document.getElementById("noteConnector");
const resizeHandle = document.getElementById("resizeHandle");
const noteResizer = document.getElementById("noteResizer");
const noteProgressText = document.getElementById("noteProgressText");
const noteProgressCount = document.getElementById("noteProgressCount");
const noteProgressFill = document.getElementById("noteProgressFill");

const reminderMessages = [
  "Изправи се и се раздвижи",
  "Време е за стречинг",
  "Изправи гърба и дишай",
  "Раздвижи рамене и шия",
  "Направи десет клека",
  "Погледни нещо зелено",
  "Изпий малко вода",
  "Пет минутна пауза",
  "Провери стойката",
  "Разтръскай крака",
  "Отскочи до кухнята",
  "Раздвижи китки и врата",
  "Погледни през прозореца",
  "Направи мини танц",
  "Отпусни раменете",
  "Затвори очи за 10 секунди",
  "Поеми три дълбоки вдишвания",
  "Изправи се на пръсти",
  "Протегни се към тавана",
  "Премести се преди да се схванеш",
  "Усмихни се и продължи"
];

const DAILY_GOAL = 8;
const STATS_KEY = "standupReminder.stats";
const NOTE_KEY = "standupReminder.dailyNote";
const INTERVAL_KEY = "reminderInterval";
const LAST_TRIGGER_KEY = "reminderLastTrigger";
const APP_POSITION_KEY = "standupReminder.appPosition";
const ALWAYS_ON_TOP_KEY = "standupReminder.alwaysOnTop";
const THEME_KEY = "standupReminder.themeIndex";
const CLOCK_WIDTH_KEY = "standupReminder.clockWidth";
const CLOCK_HEIGHT_KEY = "standupReminder.clockHeight";
const NOTE_WIDTH_KEY = "standupReminder.noteDrawerWidth";
const THEMES = ["theme-midnight", "theme-aurora", "theme-forest", "theme-sunset", "theme-dawn"];
const BOARD_COLUMNS = [
  { id: "later", label: "Задачи" },
  { id: "doing", label: "В прогрес" },
  { id: "done", label: "Готово" }
];
let draggingItemId = null;

const loadJSON = (key, fallback) => {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw);
    return parsed === null || parsed === undefined ? fallback : parsed;
  } catch (error) {
    console.warn("loadJSON error", key, error);
    return fallback;
  }
};

const saveJSON = (key, value) => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.warn("saveJSON error", key, error);
  }
};

const generateId = () => {
  if (window.crypto?.randomUUID) return window.crypto.randomUUID();
  return "item-" + Date.now().toString(36) + Math.random().toString(36).slice(2);
};

const createChecklistItem = (text = "", column = "later") => ({
  id: generateId(),
  text,
  column
});

const createDefaultNote = () => ({
  id: "daily-note",
  title: "Най-важното за деня",
  checklistItems: [createChecklistItem("", "later")],
  updatedAt: Date.now(),
  allComplete: false
});

let intervalMinutes = parseInt(localStorage.getItem(INTERVAL_KEY) || "60", 10);
if (Number.isNaN(intervalMinutes) || intervalMinutes <= 0) intervalMinutes = 60;

let lastTriggerTime = parseInt(localStorage.getItem(LAST_TRIGGER_KEY) || String(Date.now()), 10);
if (Number.isNaN(lastTriggerTime)) lastTriggerTime = Date.now();

let audioContext;
let awaitingCompletion = false;
let appDragState = null;
let alwaysOnTopEnabled = true;
let themeIndex = 0;
let clockWidth = parseInt(localStorage.getItem(CLOCK_WIDTH_KEY) || "420", 10);
let clockHeight = parseInt(localStorage.getItem(CLOCK_HEIGHT_KEY) || "420", 10);
let noteDrawerWidth = parseInt(localStorage.getItem(NOTE_WIDTH_KEY) || "", 10);
if (Number.isNaN(clockWidth)) clockWidth = 420;
if (Number.isNaN(clockHeight)) clockHeight = 420;
if (Number.isNaN(noteDrawerWidth)) noteDrawerWidth = null;
let resizeState = null;
let noteResizeState = null;

let stats = (() => {
  const today = new Date().toDateString();
  const stored = loadJSON(STATS_KEY, {});
  if (stored && stored.date === today) {
    return { date: today, completed: stored.completed || 0, combo: stored.combo || 0 };
  }
  return { date: today, completed: 0, combo: 0 };
})();

let noteData = (() => {
  const stored = loadJSON(NOTE_KEY, null);
  if (stored && Array.isArray(stored.checklistItems)) {
    return {
      id: stored.id || "daily-note",
      title: "Най-важното за деня",
      checklistItems: stored.checklistItems.map((item) => {
        const persistedColumn = item.column || (item.checked ? "done" : "later");
        const validColumn = BOARD_COLUMNS.some((column) => column.id === persistedColumn) ? persistedColumn : "later";
        return {
          id: item.id || generateId(),
          text: item.text || "",
          column: validColumn
        };
      }),
      updatedAt: stored.updatedAt || Date.now(),
      allComplete: !!stored.allComplete
    };
  }
  return createDefaultNote();
})();

const clampValue = (value, min, max) => Math.min(Math.max(value, min), max);

const clampPosition = (left, top, width, height) => {
  const margin = 12;
  const maxLeft = window.innerWidth - width - margin;
  const maxTop = window.innerHeight - height - margin;
  return {
    left: clampValue(left, margin, Math.max(margin, maxLeft)),
    top: clampValue(top, margin, Math.max(margin, maxTop))
  };
};

const applyAppPosition = (left, top) => {
  if (!appContainer) return;
  appContainer.style.transform = "none";
  appContainer.style.left = left + "px";
  appContainer.style.top = top + "px";
};

const centerApp = () => {
  if (!appContainer) return;
  const rect = appContainer.getBoundingClientRect();
  const left = (window.innerWidth - rect.width) / 2;
  const top = (window.innerHeight - rect.height) / 2;
  const clamped = clampPosition(left, top, rect.width, rect.height);
  applyAppPosition(clamped.left, clamped.top);
  saveJSON(APP_POSITION_KEY, clamped);
};

const restoreAppPosition = () => {
  if (!appContainer) return;
  requestAnimationFrame(() => {
    const rect = appContainer.getBoundingClientRect();
    const stored = loadJSON(APP_POSITION_KEY, null);
    if (stored && typeof stored.left === "number" && typeof stored.top === "number") {
      const clamped = clampPosition(stored.left, stored.top, rect.width, rect.height);
      applyAppPosition(clamped.left, clamped.top);
    } else {
      centerApp();
    }
    positionNoteDrawer();
  });
};

const handleAppDragStart = (event) => {
  if (!appContainer || !dragHandle) return;
  event.preventDefault();
  const rect = appContainer.getBoundingClientRect();
  applyAppPosition(rect.left, rect.top);
  appDragState = {
    pointerId: event.pointerId,
    offsetX: event.clientX - rect.left,
    offsetY: event.clientY - rect.top,
    width: rect.width,
    height: rect.height,
    currentLeft: rect.left,
    currentTop: rect.top
  };
  dragHandle.setPointerCapture(event.pointerId);
  dragHandle.classList.add("is-dragging");
};

const handleAppDragMove = (event) => {
  if (!appDragState || event.pointerId !== appDragState.pointerId) return;
  event.preventDefault();
  const left = event.clientX - appDragState.offsetX;
  const top = event.clientY - appDragState.offsetY;
  const clamped = clampPosition(left, top, appDragState.width, appDragState.height);
  applyAppPosition(clamped.left, clamped.top);
  appDragState.currentLeft = clamped.left;
  appDragState.currentTop = clamped.top;
  positionNoteDrawer();
};

const handleAppDragEnd = (event) => {
  if (!appDragState || event.pointerId !== appDragState.pointerId) return;
  dragHandle?.releasePointerCapture(event.pointerId);
  dragHandle?.classList.remove("is-dragging");
  saveJSON(APP_POSITION_KEY, {
    left: appDragState.currentLeft,
    top: appDragState.currentTop
  });
  appDragState = null;
  positionNoteDrawer();
};

const handleResizePointerDown = (event) => {
  if (!resizeHandle) return;
  event.preventDefault();
  resizeState = {
    pointerId: event.pointerId,
    startX: event.clientX,
    startY: event.clientY,
    startWidth: clockWidth,
    startHeight: clockHeight
  };
  resizeHandle.setPointerCapture(event.pointerId);
  resizeHandle.classList.add("resizing");
};

const handleResizePointerMove = (event) => {
  if (!resizeState || event.pointerId !== resizeState.pointerId) return;
  event.preventDefault();
  const deltaX = event.clientX - resizeState.startX;
  const deltaY = event.clientY - resizeState.startY;
  setClockSizeStyle(resizeState.startWidth + deltaX, resizeState.startHeight + deltaY);
};

const handleResizePointerEnd = (event) => {
  if (!resizeState || event.pointerId !== resizeState.pointerId) return;
  resizeHandle?.releasePointerCapture(event.pointerId);
  resizeHandle?.classList.remove("resizing");
  applyClockSize(clockWidth, clockHeight, true);
  resizeState = null;
};

const handleNoteResizePointerDown = (event) => {
  if (!noteDrawer?.classList.contains("open")) return;
  event.preventDefault();
  noteResizeState = {
    pointerId: event.pointerId,
    startX: event.clientX,
    startWidth: noteDrawerWidth || noteDrawer.getBoundingClientRect().width
  };
  noteResizer?.setPointerCapture(event.pointerId);
  noteResizer?.classList.add("active");
};

const handleNoteResizePointerMove = (event) => {
  if (!noteResizeState || event.pointerId !== noteResizeState.pointerId) return;
  event.preventDefault();
  const deltaX = event.clientX - noteResizeState.startX;
  const margin = 16;
  const minWidth = 360;
  const availableWidth = Math.max(minWidth, window.innerWidth - margin * 2);
  const maxWidth = Math.min(window.innerWidth * 0.85, 840);
  const widthLimit = Math.min(maxWidth, availableWidth);
  noteDrawerWidth = clampNoteWidth(noteResizeState.startWidth + deltaX, minWidth, widthLimit);
  positionNoteDrawer();
};

const handleNoteResizePointerEnd = (event) => {
  if (!noteResizeState || event.pointerId !== noteResizeState.pointerId) return;
  noteResizer?.releasePointerCapture(event.pointerId);
  noteResizer?.classList.remove("active");
  noteResizeState = null;
  localStorage.setItem(NOTE_WIDTH_KEY, String(noteDrawerWidth));
};

const handleWindowResize = () => {
  if (!appContainer) return;
  setClockSizeStyle(clockWidth, clockHeight);
  const rect = appContainer.getBoundingClientRect();
  const clamped = clampPosition(rect.left, rect.top, rect.width, rect.height);
  applyAppPosition(clamped.left, clamped.top);
  saveJSON(APP_POSITION_KEY, clamped);
  positionNoteDrawer();
};

const updatePinButtonUI = () => {
  if (!pinButton) return;
  pinButton.classList.toggle("active", alwaysOnTopEnabled);
  pinButton.textContent = alwaysOnTopEnabled ? "📌" : "📍";
  pinButton.title = alwaysOnTopEnabled ? "Изключи задържане най-отгоре" : "Задръж най-отгоре";
};

const applyAlwaysOnTop = (enabled, persist = true) => {
  alwaysOnTopEnabled = !!enabled;
  window.reminderAPI?.setAlwaysOnTop?.(alwaysOnTopEnabled);
  if (persist) {
    localStorage.setItem(ALWAYS_ON_TOP_KEY, JSON.stringify(alwaysOnTopEnabled));
  }
  updatePinButtonUI();
};

const initAlwaysOnTop = async () => {
  const stored = localStorage.getItem(ALWAYS_ON_TOP_KEY);
  if (stored !== null) {
    applyAlwaysOnTop(stored === "true", false);
  } else {
    try {
      const current = await window.reminderAPI?.getAlwaysOnTop?.();
      if (typeof current === "boolean") {
        alwaysOnTopEnabled = current;
      }
    } catch (error) {
      console.warn("Unable to read always-on-top state", error);
      alwaysOnTopEnabled = true;
    }
    updatePinButtonUI();
  }
  applyAlwaysOnTop(alwaysOnTopEnabled);
};

const applyThemeClass = (index, persist = true) => {
  if (!document.body || !THEMES.length) return;
  themeIndex = ((index % THEMES.length) + THEMES.length) % THEMES.length;
  document.body.classList.remove(...THEMES);
  document.body.classList.add(THEMES[themeIndex]);
  if (persist) {
    localStorage.setItem(THEME_KEY, String(themeIndex));
  }
};

const clampClockSize = (width, height) => {
  const min = 180;
  const maxWidth = Math.min(900, window.innerWidth - 40);
  const maxHeight = Math.min(900, window.innerHeight - 80);
  const safeWidth = Number.isFinite(width) ? width : min;
  const safeHeight = Number.isFinite(height) ? height : min;
  return {
    width: Math.min(Math.max(safeWidth, min), maxWidth),
    height: Math.min(Math.max(safeHeight, min), maxHeight)
  };
};

const clampNoteWidth = (width, minWidth, maxWidth) => {
  const base = Number.isFinite(width) ? width : minWidth;
  return Math.min(Math.max(base, minWidth), maxWidth);
};

const setClockSizeStyle = (width, height) => {
  if (!appContainer) return;
  const { width: clampedWidth, height: clampedHeight } = clampClockSize(width, height);
  clockWidth = clampedWidth;
  clockHeight = clampedHeight;
  appContainer.style.setProperty("--clock-width", `${clockWidth}px`);
  appContainer.style.setProperty("--clock-height", `${clockHeight}px`);
  positionNoteDrawer();
};

const applyClockSize = (width, height, persist = true) => {
  setClockSizeStyle(width, height);
  if (persist) {
    localStorage.setItem(CLOCK_WIDTH_KEY, String(clockWidth));
    localStorage.setItem(CLOCK_HEIGHT_KEY, String(clockHeight));
    requestAnimationFrame(() => restoreAppPosition());
  }
};

const positionNoteDrawer = () => {
  if (!noteDrawer || !noteDrawer.classList.contains("open")) return;
  if (!appContainer) return;
  const rect = appContainer.getBoundingClientRect();
  const margin = 16;
  const minWidth = 360;
  const availableWidth = Math.max(minWidth, window.innerWidth - margin * 2);
  const maxWidth = Math.min(window.innerWidth * 0.85, 840);
  const widthLimit = Math.min(maxWidth, availableWidth);
  const targetWidth = clampNoteWidth(noteDrawerWidth || widthLimit, minWidth, widthLimit);
  const drawerWidth = targetWidth;
  noteDrawerWidth = drawerWidth;
  const spaceRight = window.innerWidth - rect.right - margin;
  const spaceBelow = window.innerHeight - rect.bottom - margin;

  let attachBelow = spaceRight < drawerWidth * 0.6 && spaceBelow > rect.height * 0.4;
  let left;
  let top;

  if (attachBelow) {
    left = Math.max(margin, Math.min(rect.left, window.innerWidth - drawerWidth - margin));
    top = Math.min(rect.bottom + margin, window.innerHeight - margin - 260);
  } else {
    left = Math.min(rect.right + margin, window.innerWidth - drawerWidth - margin);
    left = Math.max(left, margin);
    top = Math.max(margin, Math.min(rect.top, window.innerHeight - margin - 260));
  }

  let availableHeight = window.innerHeight - top - margin;
  if (availableHeight < 240) {
    top = Math.max(margin, window.innerHeight - margin - 240);
    availableHeight = window.innerHeight - top - margin;
  }
  const maxHeight = Math.max(220, availableHeight);

  noteDrawer.style.width = `${drawerWidth}px`;
  noteDrawer.style.left = `${left}px`;
  noteDrawer.style.top = `${top}px`;
  noteDrawer.style.maxHeight = `${maxHeight}px`;
  noteDrawer.style.height = `${maxHeight}px`;
  noteDrawer.dataset.position = attachBelow ? "below" : "side";

  if (noteConnector) {
    const drawerRect = noteDrawer.getBoundingClientRect();
    if (attachBelow) {
      const connectorWidth = Math.min(drawerRect.width * 0.6, rect.width * 0.8);
      const connectorLeft = Math.max(margin, Math.min(rect.left + rect.width / 2 - connectorWidth / 2, window.innerWidth - connectorWidth - margin));
      const connectorTop = rect.bottom + margin / 2;
      noteConnector.style.left = `${connectorLeft}px`;
      noteConnector.style.top = `${connectorTop}px`;
      noteConnector.style.width = `${connectorWidth}px`;
      noteConnector.style.height = `6px`;
      noteConnector.dataset.position = "below";
    } else {
      const startLeft = rect.right + margin * 0.4;
      const endLeft = drawerRect.left - margin * 0.4;
      const connectorWidth = Math.max(6, endLeft - startLeft);
      const connectorHeight = Math.min(drawerRect.height * 0.65, rect.height * 0.8);
      const connectorTop = Math.max(top + 12, rect.top + rect.height / 2 - connectorHeight / 2);
      noteConnector.style.left = `${Math.max(startLeft, margin)}px`;
      noteConnector.style.top = `${connectorTop}px`;
      noteConnector.style.width = `${connectorWidth}px`;
      noteConnector.style.height = `${connectorHeight}px`;
      noteConnector.dataset.position = "side";
    }
    noteConnector.classList.add("show");
  }
  if (noteResizer) {
    const resizerWidth = noteResizer.offsetWidth || 12;
    noteResizer.style.width = `${resizerWidth}px`;
    noteResizer.style.left = `${left + drawerWidth - resizerWidth / 2}px`;
    noteResizer.style.top = `${top}px`;
    noteResizer.style.height = `${maxHeight}px`;
  }
};

const ensureChecklistHasRow = () => {
  if (!noteData.checklistItems.length) {
    noteData.checklistItems.push(createChecklistItem(""));
  }
};

const saveStats = () => saveJSON(STATS_KEY, stats);
const saveNote = (updateTimestamp = true) => {
  if (updateTimestamp) noteData.updatedAt = Date.now();
  saveJSON(NOTE_KEY, noteData);
  updateNoteUpdatedUI();
};

const updateStatsUI = () => {
  if (!statsText) return;
  const completed = stats.completed || 0;
  statsText.textContent = completed + " / " + DAILY_GOAL + " напомняния днес";
};

const setMarkButtonState = () => {
  if (!markButton) return;
  markButton.disabled = !awaitingCompletion;
  markButton.title = awaitingCompletion ? "Отбележи, че се раздвижи" : "Изчакай следващото напомняне";
};

const showReminderBubble = (message) => {
  if (!bubble) return;
  bubble.textContent = message;
  bubble.classList.add("show");
  clearTimeout(showReminderBubble.hideTimeout);
  showReminderBubble.hideTimeout = setTimeout(() => {
    bubble.classList.remove("show");
  }, 5000);
};

const showToastMessage = (message, duration = 3000) => {
  if (!celebrationToast) return;
  celebrationToast.textContent = message;
  celebrationToast.classList.remove("show");
  void celebrationToast.offsetWidth;
  celebrationToast.classList.add("show");
  clearTimeout(showToastMessage.timeoutId);
  showToastMessage.timeoutId = setTimeout(() => {
    celebrationToast.classList.remove("show");
  }, duration);
};

const showChecklistCelebration = () => {
  showToastMessage("Йеей, страхотно се справи", 3500);
};

const updateChecklistCompletion = () => {
  const actionable = noteData.checklistItems.filter((item) => item.text && item.text.trim());
  const allDone = actionable.length > 0 && actionable.every((item) => item.column === "done");
  if (allDone && !noteData.allComplete) {
    noteData.allComplete = true;
    saveNote(false);
    showChecklistCelebration();
  } else if (!allDone && noteData.allComplete) {
    noteData.allComplete = false;
    saveNote(false);
  }
};

const playBeep = () => {
  try {
    if (!audioContext) {
      audioContext = new (window.AudioContext || window.webkitAudioContext)();
    }
    const osc = audioContext.createOscillator();
    const gain = audioContext.createGain();
    const duration = 0.6;
    osc.type = "sine";
    osc.frequency.setValueAtTime(880, audioContext.currentTime);
    gain.gain.setValueAtTime(0.002, audioContext.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.3, audioContext.currentTime + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.002, audioContext.currentTime + duration);
    osc.connect(gain).connect(audioContext.destination);
    osc.start();
    osc.stop(audioContext.currentTime + duration);
  } catch (error) {
    console.warn("Unable to play reminder tone", error);
  }
};

const triggerReminder = () => {
  if (awaitingCompletion) {
    stats.combo = 0;
    saveStats();
    updateStatsUI();
    showReminderBubble("Отбележи предишното движение, за да запазиш серията.");
  }
  playBeep();
  const message = reminderMessages[Math.floor(Math.random() * reminderMessages.length)];
  showReminderBubble(message);
  clock?.classList.add("alert");
  setTimeout(() => clock?.classList.remove("alert"), 6000);
  awaitingCompletion = true;
  setMarkButtonState();
  lastTriggerTime = Date.now();
  localStorage.setItem(LAST_TRIGGER_KEY, String(lastTriggerTime));
};

const ensureTodayStats = (dayKey) => {
  if (stats.date !== dayKey) {
    stats = { date: dayKey, completed: 0, combo: 0 };
    saveStats();
    awaitingCompletion = false;
    updateStatsUI();
    setMarkButtonState();
  }
};

const updateTimeDisplay = () => {
  const now = new Date();
  ensureTodayStats(now.toDateString());
  const hours = String(now.getHours()).padStart(2, "0");
  const minutes = String(now.getMinutes()).padStart(2, "0");
  const seconds = String(now.getSeconds()).padStart(2, "0");
  timeDisplay.textContent = hours + ":" + minutes + ":" + seconds;
  if (secondsDisplay) secondsDisplay.textContent = "";
  if (Date.now() - lastTriggerTime >= intervalMinutes * 60000) {
    triggerReminder();
  }
  requestAnimationFrame(updateTimeDisplay);
};

const renderNoteCard = () => {
  if (!noteList) return;
  noteList.innerHTML = "";
  const card = document.createElement("div");
  card.className = "note-card";
  card.tabIndex = 0;
  const title = document.createElement("div");
  title.className = "note-card-title";
  title.textContent = noteData.title;
  const meta = document.createElement("div");
  meta.className = "note-card-meta";
  const actionable = noteData.checklistItems.filter((item) => item.text && item.text.trim());
  const done = actionable.filter((item) => item.column === "done").length;
  meta.textContent = actionable.length ? `${done} / ${actionable.length} изпълнени` : "Добави задачите за деня";
  card.appendChild(title);
  card.appendChild(meta);
  card.addEventListener("click", () => switchNoteView("editor"));
  card.addEventListener("keydown", (event) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      switchNoteView("editor");
    }
  });
  noteList.appendChild(card);
};

const moveChecklistItem = (item, targetColumn) => {
  if (!item) return;
  const previousColumn = item.column || "later";
  if (previousColumn === targetColumn) return;
  if (!BOARD_COLUMNS.some((column) => column.id === targetColumn)) return;
  item.column = targetColumn;
  noteData.updatedAt = Date.now();
  noteData.allComplete = false;
  saveNote(false);
  renderChecklist();
  renderNoteCard();
  updateChecklistCompletion();
  if (previousColumn === "later" && targetColumn === "doing") {
    showToastMessage("Ще се справиш!", 3000);
  } else if (previousColumn === "doing" && targetColumn === "done") {
    showToastMessage("Супер си!!", 3000);
  }
  updateNoteProgress();
  requestAnimationFrame(positionNoteDrawer);
};

const createChecklistCard = (item) => {
  const columnIndex = BOARD_COLUMNS.findIndex((column) => column.id === item.column);
  const card = document.createElement("div");
  card.className = "note-card-item";
  card.dataset.itemId = item.id;
  card.draggable = true;
  card.addEventListener("dragstart", (event) => {
    draggingItemId = item.id;
    card.classList.add("dragging");
    if (event.dataTransfer) {
      event.dataTransfer.setData("text/plain", item.id);
      event.dataTransfer.effectAllowed = "move";
    }
  });
  card.addEventListener("dragend", () => {
    draggingItemId = null;
    card.classList.remove("dragging");
    noteChecklist?.querySelectorAll(".note-column").forEach((column) => column.classList.remove("drop-target"));
  });

  const textarea = document.createElement("textarea");
  textarea.value = item.text || "";
  textarea.placeholder = "Добави задача...";
  textarea.addEventListener("input", () => {
    item.text = textarea.value;
    noteData.updatedAt = Date.now();
    noteData.allComplete = false;
    saveNote(false);
    renderNoteCard();
    updateChecklistCompletion();
  updateNoteProgress();
  });
  textarea.addEventListener("mousedown", (event) => event.stopPropagation());
  textarea.addEventListener("touchstart", (event) => event.stopPropagation());
  textarea.addEventListener("dragstart", (event) => event.stopPropagation());

  const actions = document.createElement("div");
  actions.className = "note-card-actions";

  if (columnIndex > 0) {
    const prevButton = document.createElement("button");
    prevButton.type = "button";
    prevButton.title = "Премести назад";
    prevButton.textContent = "←";
    prevButton.addEventListener("click", (event) => {
      event.stopPropagation();
      moveChecklistItem(item, BOARD_COLUMNS[columnIndex - 1].id);
    });
    actions.appendChild(prevButton);
  }

  if (columnIndex < BOARD_COLUMNS.length - 1) {
    const nextButton = document.createElement("button");
    nextButton.type = "button";
    nextButton.title = "Премести напред";
    nextButton.textContent = "→";
    nextButton.addEventListener("click", (event) => {
      event.stopPropagation();
      moveChecklistItem(item, BOARD_COLUMNS[columnIndex + 1].id);
    });
    actions.appendChild(nextButton);
  } else {
    const resetButton = document.createElement("button");
    resetButton.type = "button";
    resetButton.title = "Върни за преглед";
    resetButton.textContent = "↺";
    resetButton.addEventListener("click", (event) => {
      event.stopPropagation();
      moveChecklistItem(item, BOARD_COLUMNS[0].id);
    });
    actions.appendChild(resetButton);
  }

  const removeButton = document.createElement("button");
  removeButton.type = "button";
  removeButton.title = "Премахни";
  removeButton.textContent = "✕";
  removeButton.addEventListener("click", (event) => {
    event.stopPropagation();
    removeChecklistItem(item);
  });
  actions.appendChild(removeButton);

  card.appendChild(textarea);
  card.appendChild(actions);
  return card;
};

const renderChecklist = () => {
  if (!noteChecklist) return;
  ensureChecklistHasRow();
  noteChecklist.innerHTML = "";
  noteChecklist.classList.add("note-board");

  BOARD_COLUMNS.forEach((column) => {
    const columnWrapper = document.createElement("div");
    columnWrapper.className = "note-column";
    columnWrapper.dataset.column = column.id;

    columnWrapper.addEventListener("dragover", (event) => {
      if (!draggingItemId) return;
      event.preventDefault();
      columnWrapper.classList.add("drop-target");
      if (event.dataTransfer) event.dataTransfer.dropEffect = "move";
    });
    columnWrapper.addEventListener("dragleave", () => columnWrapper.classList.remove("drop-target"));
    columnWrapper.addEventListener("drop", (event) => {
      event.preventDefault();
      columnWrapper.classList.remove("drop-target");
      const itemId = draggingItemId || event.dataTransfer?.getData("text/plain");
      draggingItemId = null;
      const item = noteData.checklistItems.find((entry) => entry.id === itemId);
      if (item) {
        moveChecklistItem(item, column.id);
      }
    });

    const header = document.createElement("div");
    header.className = "note-column-header";
    header.textContent = column.label;

    const count = document.createElement("span");
    count.className = "note-column-count";
    const columnItems = noteData.checklistItems.filter((item) => (item.column || "later") === column.id);
    const nonEmptyCount = columnItems.filter((item) => item.text && item.text.trim()).length;
    count.textContent = String(nonEmptyCount);
    header.appendChild(count);

    const list = document.createElement("div");
    list.className = "note-column-items";
    if (columnItems.length) {
      columnItems.forEach((item) => {
        if (!item.column) item.column = column.id;
        list.appendChild(createChecklistCard(item));
      });
    } else {
      const emptyState = document.createElement("div");
      emptyState.className = "note-column-empty";
      emptyState.textContent = "Няма задачи";
      list.appendChild(emptyState);
    }

    columnWrapper.appendChild(header);
    columnWrapper.appendChild(list);
    noteChecklist.appendChild(columnWrapper);
  });
  requestAnimationFrame(positionNoteDrawer);
  updateNoteProgress();
};

const updateNoteUpdatedUI = () => {
  if (!noteUpdated) return;
  noteUpdated.textContent = "Обновено: " + new Date(noteData.updatedAt).toLocaleString();
};

const updateNoteProgress = () => {
  if (!noteProgressText || !noteProgressCount || !noteProgressFill) return;
  const actionable = noteData.checklistItems.filter((item) => item.text && item.text.trim()).length;
  const done = noteData.checklistItems.filter((item) => (item.text && item.text.trim()) && item.column === "done").length;
  const percent = actionable > 0 ? Math.round((done / actionable) * 100) : 0;
  noteProgressText.textContent = actionable ? `Готово ${percent}%` : "Няма задачи";
  noteProgressCount.textContent = `${done} / ${actionable}`;
  noteProgressFill.style.width = `${percent}%`;
};

const removeChecklistItem = (item) => {
  noteData.checklistItems = noteData.checklistItems.filter((entry) => entry.id !== item.id);
  noteData.allComplete = false;
  noteData.updatedAt = Date.now();
  saveNote();
  renderChecklist();
  renderNoteCard();
  updateChecklistCompletion();
  updateNoteProgress();
  requestAnimationFrame(positionNoteDrawer);
};

const addChecklistItem = (focusNew = false, column = "later") => {
  const targetColumn = BOARD_COLUMNS.some((entry) => entry.id === column) ? column : "later";
  const item = createChecklistItem("", targetColumn);
  noteData.checklistItems.push(item);
  noteData.allComplete = false;
  noteData.updatedAt = Date.now();
  saveNote();
  renderChecklist();
  renderNoteCard();
  updateChecklistCompletion();
  updateNoteProgress();
  if (focusNew) {
    requestAnimationFrame(() => {
      const newInput = noteChecklist?.querySelector(`[data-item-id="${item.id}"] textarea`);
      newInput?.focus();
    });
  }
  requestAnimationFrame(positionNoteDrawer);
};

const switchNoteView = (view) => {
  if (!noteDrawer) return;
  noteDrawer.setAttribute("data-view", view);
  if (view === "list") {
    renderNoteCard();
  }
  if (view === "editor") {
    requestAnimationFrame(() => {
      const firstInput = noteChecklist?.querySelector("textarea");
      firstInput?.focus();
    });
  }
};

const openNoteDrawer = (view = "editor") => {
  if (!noteDrawer) return;
  noteDrawer.classList.add("open");
  document.body.classList.add("notes-open");
  noteBackdrop?.classList.add("show");
  noteButton?.classList.add("active");
  switchNoteView(view);
  requestAnimationFrame(positionNoteDrawer);
  updateNoteProgress();
};

const closeNoteDrawer = () => {
  noteDrawer?.classList.remove("open");
  document.body.classList.remove("notes-open");
  noteBackdrop?.classList.remove("show");
  noteButton?.classList.remove("active");
  if (noteDrawer) {
    noteDrawer.style.removeProperty("width");
    noteDrawer.style.removeProperty("left");
    noteDrawer.style.removeProperty("top");
    noteDrawer.style.removeProperty("height");
    noteDrawer.style.removeProperty("max-height");
    delete noteDrawer.dataset.position;
  }
  if (noteConnector) {
    noteConnector.classList.remove("show");
    noteConnector.removeAttribute("style");
    noteConnector.removeAttribute("data-position");
  }
  if (noteResizer) {
    noteResizer.classList.remove("active");
    noteResizer.removeAttribute("style");
  }
};

const toggleNoteDrawer = () => {
  if (noteDrawer?.classList.contains("open")) {
    closeNoteDrawer();
  } else {
    openNoteDrawer("editor");
  }
};

const handleMarkCompletion = () => {
  if (!awaitingCompletion) {
    showReminderBubble("Изчакай следващото напомняне, за да отбележиш.");
    return;
  }
  awaitingCompletion = false;
  stats.completed = (stats.completed || 0) + 1;
  stats.combo = (stats.combo || 0) + 1;
  saveStats();
  updateStatsUI();
  setMarkButtonState();
  showReminderBubble("Чудесно, продължавай!");
  lastTriggerTime = Date.now();
  localStorage.setItem(LAST_TRIGGER_KEY, String(lastTriggerTime));
};

const handleIntervalChange = (value) => {
  const minutes = parseInt(value, 10);
  if (!Number.isNaN(minutes) && minutes > 0) {
    intervalMinutes = minutes;
    localStorage.setItem(INTERVAL_KEY, String(intervalMinutes));
    lastTriggerTime = Date.now();
    localStorage.setItem(LAST_TRIGGER_KEY, String(lastTriggerTime));
  }
};

const attachEvents = () => {
  closeButton?.addEventListener("click", () => window.reminderAPI?.closeApp?.());
  minimizeButton?.addEventListener("click", () => window.reminderAPI?.minimizeApp?.());
  intervalSelect?.addEventListener("change", (event) => handleIntervalChange(event.target.value));
  markButton?.addEventListener("click", handleMarkCompletion);

  noteButton?.addEventListener("click", toggleNoteDrawer);
  noteClose?.addEventListener("click", closeNoteDrawer);
  noteBackdrop?.addEventListener("click", closeNoteDrawer);
  noteMinimize?.addEventListener("click", () => switchNoteView("list"));
  noteChecklistAdd?.addEventListener("click", () => addChecklistItem(true));
  noteChecklist?.addEventListener("dblclick", (event) => {
    const targetColumn = event.target.closest(".note-column")?.dataset.column;
    addChecklistItem(true, targetColumn || "later");
  });
  pinButton?.addEventListener("click", () => applyAlwaysOnTop(!alwaysOnTopEnabled));
  themeButton?.addEventListener("click", () => {
    applyThemeClass(themeIndex + 1);
    positionNoteDrawer();
  });
  resizeHandle?.addEventListener("pointerdown", handleResizePointerDown);
  resizeHandle?.addEventListener("pointermove", handleResizePointerMove);
  resizeHandle?.addEventListener("pointerup", handleResizePointerEnd);
  resizeHandle?.addEventListener("pointercancel", handleResizePointerEnd);
  noteResizer?.addEventListener("pointerdown", handleNoteResizePointerDown);
  noteResizer?.addEventListener("pointermove", handleNoteResizePointerMove);
  noteResizer?.addEventListener("pointerup", handleNoteResizePointerEnd);
  noteResizer?.addEventListener("pointercancel", handleNoteResizePointerEnd);
  window.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && noteDrawer?.classList.contains("open")) {
      closeNoteDrawer();
    }
  });
  dragHandle?.addEventListener("pointerdown", handleAppDragStart);
  dragHandle?.addEventListener("pointermove", handleAppDragMove);
  dragHandle?.addEventListener("pointerup", handleAppDragEnd);
  dragHandle?.addEventListener("pointercancel", handleAppDragEnd);
  dragHandle?.addEventListener("click", (event) => event.preventDefault());
  window.addEventListener("resize", handleWindowResize);
};

const init = async () => {
  const storedThemeIndex = parseInt(localStorage.getItem(THEME_KEY) ?? "0", 10);
  applyThemeClass(Number.isNaN(storedThemeIndex) ? 0 : storedThemeIndex, false);
  const storedHeight = parseInt(localStorage.getItem(CLOCK_HEIGHT_KEY) ?? String(clockHeight), 10);
  const clamped = clampClockSize(clockWidth, storedHeight);
  clockWidth = clamped.width;
  clockHeight = clamped.height;
  setClockSizeStyle(clockWidth, clockHeight);
  updateStatsUI();
  setMarkButtonState();
  renderNoteCard();
  renderChecklist();
  updateChecklistCompletion();
  updateNoteProgress();
  updateNoteUpdatedUI();
  if (intervalSelect) intervalSelect.value = String(intervalMinutes);
  requestAnimationFrame(updateTimeDisplay);
  attachEvents();
  await initAlwaysOnTop();
  restoreAppPosition();
};

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", init);
} else {
  init();
}
