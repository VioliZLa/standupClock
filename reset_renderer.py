import pathlib

code = """const clock = document.getElementById(\"clock\");
const timeDisplay = document.getElementById(\"time\");
const secondsDisplay = document.getElementById(\"seconds\");
const bubble = document.getElementById(\"bubble\");
const minimizeButton = document.getElementById(\"minimizeButton\");
const closeButton = document.getElementById(\"closeButton\");
const intervalSelect = document.getElementById(\"intervalSelect\");
const progressBar = document.getElementById(\"progressBar\");
const statsText = document.getElementById(\"statsText\");
const inspirationBox = document.getElementById(\"inspiration\");
const congratsBox = document.getElementById(\"congrats\");
const markButton = document.getElementById(\"markButton\");

const noteButton = document.getElementById(\"noteButton\");
const notesOverlay = document.getElementById(\"notesOverlay\");
const notePanel = document.getElementById(\"notePanel\");
const noteDragHandle = document.getElementById(\"noteDragHandle\");
const noteResizeHandle = document.getElementById(\"noteResizeHandle\");
const noteClose = document.getElementById(\"noteClose\");
const noteToggleArchive = document.getElementById(\"noteToggleArchive\");
const noteNew = document.getElementById(\"noteNew\");
const noteList = document.getElementById(\"noteList\");
const noteEditor = document.getElementById(\"noteEditor\");
const noteTitleInput = document.getElementById(\"noteTitleInput\");
const noteChecklistToggle = document.getElementById(\"noteChecklistToggle\");
const noteTextarea = document.getElementById(\"noteTextarea\");
const noteChecklist = document.getElementById(\"noteChecklist\");
const noteReminderInput = document.getElementById(\"noteReminderInput\");
const noteReminderSet = document.getElementById(\"noteReminderSet\");
const noteReminderStatus = document.getElementById(\"noteReminderStatus\");
const noteCopy = document.getElementById(\"noteCopy\");
const noteEmail = document.getElementById(\"noteEmail\");
const noteDelete = document.getElementById(\"noteDelete\");
const noteArchive = document.getElementById(\"noteArchive\");
const noteRestore = document.getElementById(\"noteRestore\");
const noteUpdated = document.getElementById(\"noteUpdated\");
const noteAddAttachment = document.getElementById(\"noteAddAttachment\");
const noteClearAttachments = document.getElementById(\"noteClearAttachments\");
const noteDropZone = document.getElementById(\"noteDropZone\");
const noteAttachmentList = document.getElementById(\"noteAttachmentList\");
const noteFileInput = document.getElementById(\"noteFileInput\");

const reminderMessages = [
  \"Stand up and move\",
  \"Time to stretch\",
  \"Your chair is shaping your back\",
  \"You are working too much\",
  \"Do ten squats\",
  \"Look at something green\",
  \"Drink water\",
  \"Take five minutes to rest\",
  \"Loosen your back and adjust posture\",
  \"Your body is not a flowerpot\",
  \"Stretch break time\",
  \"Refresh yourself, not only the computer\",
  \"High five the air\",
  \"Legs not roots, use them\",
  \"Give the chair a break\",
  \"Stretch like a coffee ad\",
  \"Move like nobody watches\",
  \"Five minutes of dance helps\",
  \"Move before the desk wins\",
  \"Show your joints who is boss\",
  \"Change the posture, change the day\"
];

const inspirationMessages = [
  { title: \"Breathe and reach\", body: \"Two deep breaths and a stretch change the mood.\" },
  { title: \"Bodies hate stillness\", body: \"Give yours two minutes of movement.\" },
  { title: \"Done beats perfect\", body: \"Do not wait for a perfect plan.\" },
  { title: \"Movement resets the brain\", body: \"A short walk sparks a new idea.\" },
  { title: \"Every break is a win\", body: \"Small wins stack into big shifts.\" },
  { title: \"Energy is inside\", body: \"Stand, roll shoulders, smile.\" },
  { title: \"Motion shows gratitude\", body: \"Thank your body by letting it move.\" },
  { title: \"New pose, new mind\", body: \"Change the literal point of view.\" },
  { title: \"Five minutes change the day\", body: \"Walk, stretch or dance.\" },
  { title: \"No need to run\", body: \"Just avoid staying still.\" },
  { title: \"Bodies remember care\", body: \"The more you move the easier it becomes.\" },
  { title: \"Movement is life\", body: \"Each hour of motion is one chosen for you.\" }
];

const celebrationMessages = [
  \"Great job, streak is growing\",
  \"Nice work, your back applauds\",
  \"Keep going, you are magnetic\",
  \"Hero mode, body is thankful\",
  \"Flexibility unlocked\",
  \"Discipline unlocked, keep shining\"
];

const bubbleThemes = [
  { background: \"linear-gradient(135deg, #ff6b6b, #f06595)\", color: \"#ffffff\", shadow: \"0 18px 32px rgba(240, 101, 149, 0.45)\" },
  { background: \"linear-gradient(135deg, #4dabf7, #9775fa)\", color: \"#f8f9fa\", shadow: \"0 18px 32px rgba(77, 171, 247, 0.38)\" },
  { background: \"linear-gradient(135deg, #69db7c, #38d9a9)\", color: \"#052e16\", shadow: \"0 18px 32px rgba(56, 217, 169, 0.35)\" },
  { background: \"linear-gradient(135deg, #ffa94d, #ff6b6b)\", color: \"#2f1300\", shadow: \"0 18px 32px rgba(255, 169, 77, 0.38)\" },
  { background: \"linear-gradient(135deg, #74c0fc, #a5d8ff)\", color: \"#0c223d\", shadow: \"0 18px 32px rgba(116, 192, 252, 0.35)\" }
];

const DAILY_GOAL = 8;
const NOTES_KEY = 'standupReminder.notes';
const NOTES_ARCHIVE_KEY = 'standupReminder.notesArchive';
const STATS_KEY = 'standupReminder.stats';
const NOTE_HISTORY_LIMIT = 5;

const generateId = () => {
  if (window.crypto?.randomUUID) {
    return window.crypto.randomUUID();
  }
  return `note-${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
};

const loadJSON = (key, fallback) => {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw);
    return parsed ?? fallback;
  } catch (error) {
    console.warn('loadJSON error', key, error);
    return fallback;
  }
};

const saveJSON = (key, value) => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.warn('saveJSON error', key, error);
  }
};

let intervalMinutes = parseInt(localStorage.getItem('reminderInterval') || '60', 10);
if (Number.isNaN(intervalMinutes) || intervalMinutes <= 0) {
  intervalMinutes = 60;
}

let lastTriggerTime = parseInt(localStorage.getItem('reminderLastTrigger') || String(Date.now()), 10);
if (Number.isNaN(lastTriggerTime)) {
  lastTriggerTime = Date.now();
}

let audioContext;
let awaitingCompletion = false;
let bubbleSettleTimeoutId = null;
let noteVisible = false;
let showArchive = false;
let selectedNoteId = null;
let dragState = null;
let resizeState = null;

let stats = (() => {
  const today = new Date().toDateString();
  const stored = loadJSON(STATS_KEY, {});
  if (stored && stored.date === today) {
    return {
      date: today,
      completed: stored.completed || 0,
      combo: stored.combo || 0
    };
  }
  return { date: today, completed: 0, combo: 0 };
})();

let notes = loadJSON(NOTES_KEY, []);
let archivedNotes = loadJSON(NOTES_ARCHIVE_KEY, []);

const saveStats = () => saveJSON(STATS_KEY, stats);
const saveNotas = () => saveJSON(NOTES_KEY, notes);
const saveArchiveInternal = () => saveJSON(NOTES_ARCHIVE_KEY, archivedNotes.slice(0, NOTE_HISTORY_LIMIT));

function updateStatsUI() {
  const completed = stats.completed || 0;
  const progress = Math.min(completed / DAILY_GOAL, 1);
  if (progressBar) {
    progressBar.style.width = `${progress * 100}%`;
  }
  if (statsText) {
    const comboText = stats.combo > 1 ? ` Â· streak ${stats.combo}` : '';
    statsText.textContent = `${completed} / ${DAILY_GOAL} reminders today${comboText}`;
  }
}

function setInspirationMessage() {
  if (!inspirationBox) return;
  const message = inspirationMessages[Math.floor(Math.random() * inspirationMessages.length)];
  inspirationBox.innerHTML = `<strong>${message.title}</strong>${message.body}`;
}

function setMarkButtonState() {
  if (!markButton) return;
  markButton.disabled = !awaitingCompletion;
  markButton.classList.toggle('pending', awaitingCompletion);
  markButton.title = awaitingCompletion ? 'Mark that you moved' : 'Wait for the next reminder';
}

function showCongrats(message) {
  if (!congratsBox) return;
  congratsBox.textContent = message || '';
  congratsBox.style.opacity = message ? '1' : '0';
  if (message) {
    clearTimeout(showCongrats.timeoutId);
    showCongrats.timeoutId = setTimeout(() => { congratsBox.style.opacity = '0'; }, 5000);
  }
}

function ensureTodayStats(dayKey) {
  if (stats.date !== dayKey) {
    stats = { date: dayKey, completed: 0, combo: 0 };
    saveStats();
    awaitingCompletion = false;
    updateStatsUI();
    setMarkButtonState();
    showCongrats('');
  }
}

function playBeep() {
  try {
    if (!audioContext) {
      audioContext = new (window.AudioContext || window.webkitAudioContext)();
    }
    const duration = 0.4;
    const osc = audioContext.createOscillator();
    const gain = audioContext.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(880, audioContext.currentTime);
    gain.gain.setValueAtTime(0.001, audioContext.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.12, audioContext.currentTime + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + duration);
    osc.connect(gain).connect(audioContext.destination);
    osc.start();
    osc.stop(audioContext.currentTime + duration);
  } catch (error) {
    console.warn('Unable to play reminder tone', error);
  }
}

function applyBubbleTheme(theme) {
  if (!bubble) return;
  bubble.style.setProperty('--bubble-bg', theme.background);
  bubble.style.setProperty('--bubble-color', theme.color);
  bubble.style.setProperty('--bubble-shadow', theme.shadow);
}

function showReminderBubble(message) {
  if (!bubble) return;
  if (bubbleSettleTimeoutId) {
    clearTimeout(bubbleSettleTimeoutId);
    bubbleSettleTimeoutId = null;
  }
  const theme = bubbleThemes[Math.floor(Math.random() * bubbleThemes.length)];
  applyBubbleTheme(theme);
  bubble.textContent = message;
  bubble.classList.remove('show', 'flying', 'settled');
  void bubble.offsetWidth;
  bubble.classList.add('show', 'flying');
  bubble.addEventListener('animationend', (event) => {
    if (event.animationName !== 'bubble-glide') return;
    bubble.classList.remove('flying');
    bubble.classList.add('settled');
    bubbleSettleTimeoutId = setTimeout(() => {
      bubble.classList.remove('show', 'settled');
      bubbleSettleTimeoutId = null;
    }, 5000);
  }, { once: true });
}

function triggerReminder() {
  if (awaitingCompletion) {
    stats.combo = 0;
    saveStats();
    updateStatsUI();
    showCongrats('Mark after you move to keep the streak.');
  }
  playBeep();
  const message = reminderMessages[Math.floor(Math.random() * reminderMessages.length)];
  showReminderBubble(message);
  clock?.classList.add('alert');
  setTimeout(() => clock?.classList.remove('alert'), 6000);
  awaitingCompletion = true;
  setMarkButtonState();
  lastTriggerTime = Date.now();
  localStorage.setItem('reminderLastTrigger', String(lastTriggerTime));
}

function checkNoteReminders() {
  const now = Date.now();
  let changed = false;
  notes.forEach((note) => {
    if (note.reminderAt && now >= note.reminderAt) {
      const title = note.title?.trim() || 'Note';
      const summary = extractPreview(note);
      showReminderBubble(`Note: ${title} - ${summary}`);
      note.reminderAt = null;
      note.reminderMinutes = null;
      changed = true;
      if (selectedNoteId === note.id) updateReminderStatus(note);
    }
  });
  if (changed) saveNotes();
}

function updateTimeDisplay() {
  const now = new Date();
  ensureTodayStats(now.toDateString());
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  const seconds = String(now.getSeconds()).padStart(2, '0');
  timeDisplay.textContent = `${hours}:${minutes}`;
  secondsDisplay.textContent = seconds;
  const elapsed = Date.now() - lastTriggerTime;
  if (elapsed >= intervalMinutes * 60000) {
    triggerReminder();
  }
  checkNoteReminders();
  requestAnimationFrame(updateTimeDisplay);
}

function openNotePanel(forceOpen = false) {
  noteVisible = forceOpen ? true : !noteVisible;
  notesOverlay?.classList.toggle('show', noteVisible);
  notePanel?.classList.toggle('show', noteVisible);
  noteButton?.classList.toggle('active', noteVisible);
  if (noteVisible && notePanel) {
    if (!notePanel.style.left) {
      notePanel.style.left = '12px';
      notePanel.style.top = '12px';
    }
    renderNotes();
    focusEditor();
  }
}

function focusEditor() {
  setTimeout(() => {
    if (noteChecklistToggle?.checked) {
      noteChecklist?.querySelector('input[type=\"text\"]')?.focus();
    } else {
      noteTextarea?.focus();
      const value = noteTextarea?.value || '';
      noteTextarea?.setSelectionRange?.(value.length, value.length);
    }
  }, 50);
}

function getActiveCollection() {
  return showArchive ? archivedNotes : notes;
}

function getSelectedNote() {
  const list = getActiveCollection();
  return list.find((note) => note.id === selectedNoteId) || null;
}

function renderNotes() {
  if (!noteList) return;
  const collection = getActiveCollection();
  noteList.innerHTML = '';
  if (!collection.length) {
    const empty = document.createElement('div');
    empty.className = 'note-card empty';
    empty.textContent = showArchive ? 'Archive is empty' : 'Press + New to create a note';
    noteList.appendChild(empty);
  }
  collection.forEach((note) => {
    const card = document.createElement('div');
    card.className = 'note-card';
    if (note.id === selectedNoteId) card.classList.add('active');
    const titleEl = document.createElement('div');
    titleEl.className = 'note-card-title';
    titleEl.textContent = note.title?.trim() || 'Untitled note';
    card.appendChild(titleEl);"

code += """
    const previewEl = document.createElement('div');
    previewEl.className = 'note-card-preview';
    previewEl.textContent = extractPreview(note);
    card.appendChild(previewEl);
    const metaEl = document.createElement('div');
    metaEl.className = 'note-card-meta';
    if (note.isChecklist && note.checklistItems?.length) {
      const done = note.checklistItems.filter((item) => item.checked).length;
      metaEl.textContent = `${done}/${note.checklistItems.length} tasks`;
    } else if (note.content) {
      metaEl.textContent = `${Math.min(200, note.content.length)} chars`;
    } else {
      metaEl.textContent = 'Empty note';
    }
    card.appendChild(metaEl);
    card.addEventListener('click', () => {
      selectedNoteId = note.id;
      renderNotes();
    });
    noteList.appendChild(card);
  });
  if (!selectedNoteId && collection.length) {
    selectedNoteId = collection[0].id;
  }
  renderEditor();
}

function extractPreview(note) {
  if (note.isChecklist) {
    const first = note.checklistItems?.find((item) => item.text?.trim());
    return first ? first.text : 'Checklist';
  }
  const lines = (note.content || '').split('\n');
  return lines.find((line) => line.trim())?.trim() || 'Empty note';
}

function renderEditor() {
  if (!noteEditor) return;
  const note = getSelectedNote();
  noteEditor.hidden = !note;
  if (!note) return;
  noteTitleInput.value = note.title || '';
  noteChecklistToggle.checked = !!note.isChecklist;
  noteTextarea.value = note.content || '';
  noteTextarea.hidden = !!note.isChecklist;
  noteChecklist.hidden = !note.isChecklist;
  if (noteReminderInput) noteReminderInput.value = note.reminderMinutes ?? '';
  renderChecklist(note);
  renderAttachments(note);
  updateReminderStatus(note);
  updateUpdatedTime(note);
  noteArchive.hidden = note.archived;
  noteRestore.hidden = !note.archived;
}

function renderChecklist(note) {
  if (!noteChecklist) return;
  noteChecklist.innerHTML = '';
  if (!note.isChecklist) return;
  if (!note.checklistItems?.length) {
    note.checklistItems = [createChecklistItem('New item')];
  }
  note.checklistItems.forEach((item) => {
    const row = document.createElement('div');
    row.className = 'note-checklist-item';
    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.checked = !!item.checked;
    checkbox.addEventListener('change', () => {
      item.checked = checkbox.checked;
      persistNoteChange();
      renderNotes();
    });
    const input = document.createElement('input');
    input.type = 'text';
    input.value = item.text;
    input.placeholder = 'Add task';
    input.addEventListener('input', () => {
      item.text = input.value;
      persistNoteChange(false);
      renderNotes();
    });
    input.addEventListener('keydown', (event) => {
      if (event.key === 'Enter') {
        event.preventDefault();
        addChecklistItem();
      }
    });
    const removeBtn = document.createElement('button');
    removeBtn.textContent = 'âœ–';
    removeBtn.title = 'Remove';
    removeBtn.addEventListener('click', () => {
      note.checklistItems = note.checklistItems.filter((i) => i.id !== item.id);
      if (!note.checklistItems.length) {
        note.checklistItems.push(createChecklistItem('New item'));
      }
      persistNoteChange();
      renderEditor();
      renderNotes();
    });
    row.appendChild(checkbox);
    row.appendChild(input);
    row.appendChild(removeBtn);
    noteChecklist.appendChild(row);
  });
}

function createChecklistItem(text = '') {
  return { id: generateId(), text, checked: false };
}

function addChecklistItem() {
  const note = getSelectedNote();
  if (!note || !note.isChecklist) return;
  note.checklistItems.push(createChecklistItem(''));
  persistNoteChange(false);
  renderEditor();
  noteChecklist?.querySelector('input[type=\"text\"]:last-of-type')?.focus();
}

function renderAttachments(note) {
  if (!noteAttachmentList) return;
  noteAttachmentList.innerHTML = '';
  (note.attachments || []).forEach((attachment) => {
    const item = document.createElement('li');
    item.className = 'note-attachment-item';
    const link = document.createElement('a');
    link.href = attachment.data;
    link.textContent = attachment.name;
    link.download = attachment.name;
    link.target = '_blank';
    const size = document.createElement('span');
    size.textContent = `${(attachment.size / 1024).toFixed(1)} KB`;
    const remove = document.createElement('button');
    remove.textContent = 'âœ–';
    remove.title = 'Remove';
    remove.addEventListener('click', () => {
      note.attachments = note.attachments.filter((a) => a.id !== attachment.id);
      persistNoteChange();
      renderAttachments(note);
    });
    item.appendChild(link);
    item.appendChild(size);
    item.appendChild(remove);
    noteAttachmentList.appendChild(item);
  });
}

function updateReminderStatus(note) {
  if (!noteReminderStatus) return;
  if (note.reminderAt) {
    const diff = note.reminderAt - Date.now();
    if (diff > 0) {
      const minutes = Math.ceil(diff / 60000);
      noteReminderStatus.textContent = `Reminder in ~${minutes} min`;
    } else {
      noteReminderStatus.textContent = 'Reminder will pop soon';
    }
  } else {
    noteReminderStatus.textContent = '';
  }
}

function updateUpdatedTime(note) {
  if (!noteUpdated) return;
  const date = new Date(note.updatedAt || note.createdAt);
  noteUpdated.textContent = `Last update: ${date.toLocaleString()}`;
}

function persistNoteChange(updateTimestamp = true) {
  const note = getSelectedNote();
  if (!note) return;
  if (updateTimestamp) note.updatedAt = Date.now();
  saveNotas();
  renderNotes();
}

function scheduleReminder(note, minutes) {
  if (!minutes || Number.isNaN(minutes) || minutes <= 0) {
    note.reminderAt = null;
    note.reminderMinutes = null;
    if (noteReminderInput) noteReminderInput.value = '';
    persistNoteChange();
    updateReminderStatus(note);
    return;
  }
  const now = Date.now();
  note.reminderMinutes = minutes;
  note.reminderAt = now + minutes * 60000;
  if (noteReminderInput) noteReminderInput.value = String(minutes);
  persistNoteChange();
  updateReminderStatus(note);
}

function formatNoteForExport(note) {
  const lines = [];
  lines.push(`Title: ${note.title || 'Untitled note'}`);
  lines.push(`Created: ${new Date(note.createdAt).toLocaleString()}`);
  lines.push(`Updated: ${new Date(note.updatedAt).toLocaleString()}`);
  if (note.reminderAt) lines.push(`Reminder: ${new Date(note.reminderAt).toLocaleString()}`);
  lines.push('');
  if (note.isChecklist) {
    lines.push('Checklist:');
    note.checklistItems.forEach((item) => {
      lines.push(` - ${item.checked ? '[x]' : '[ ]'} ${item.text}`);
    });
  } else {
    lines.push(note.content || '(empty)');
  }
  if (note.attachments?.length) {
    lines.push('');
    lines.push('Attachments:');
    note.attachments.forEach((att) => {
      lines.push(` - ${att.name} (${(att.size / 1024).toFixed(1)} KB)`);
    });
  }
  return lines.join('\n');
}

function copyNoteToClipboard(note) {
  const text = formatNoteForExport(note);
  if (navigator.clipboard?.writeText) {
    navigator.clipboard.writeText(text).then(() => {
      noteReminderStatus.textContent = 'Copied to clipboard';
      setTimeout(() => updateReminderStatus(note), 3000);
    }).catch(() => fallbackCopy(text));
  } else {
    fallbackCopy(text);
  }
}

function fallbackCopy(text) {
  const temp = document.createElement('textarea');
  temp.value = text;
  document.body.appendChild(temp);
  temp.select();
  document.execCommand('copy');
  document.body.removeChild(temp);
}

function sendNoteByEmail(note) {
  const subject = encodeURIComponent(note.title || 'Note');
  const body = encodeURIComponent(formatNoteForExport(note));
  window.location.href = `mailto:?subject=${subject}&body=${body}`;"

code += """
}

function archiveNote(note) {
  note.archived = true;
  notes = notes.filter((n) => n.id !== note.id);
  archivedNotes.unshift(note);
  archivedNotes = archivedNotes.slice(0, NOTE_HISTORY_LIMIT);
  selectedNoteId = null;
  saveNotas();
  saveArchiveInternal();
  renderNotes();
}

function restoreNote(note) {
  note.archived = false;
  archivedNotes = archivedNotes.filter((n) => n.id !== note.id);
  notes.unshift(note);
  selectedNoteId = note.id;
  saveNotas();
  saveArchiveInternal();
  renderNotes();
}

function deleteNote(note) {
  if (showArchive) {
    archivedNotes = archivedNotes.filter((n) => n.id !== note.id);
    saveArchiveInternal();
  } else {
    notes = notes.filter((n) => n.id !== note.id);
    saveNotas();
  }
  selectedNoteId = null;
  renderNotes();
}

function handleAttachmentFiles(files) {
  const note = getSelectedNote();
  if (!note || !files?.length) return;
  const tasks = Array.from(files).map((file) => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      note.attachments = note.attachments || [];
      note.attachments.push({
        id: generateId(),
        name: file.name,
        size: file.size,
        type: file.type,
        data: reader.result
      });
      resolve();
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  }));
  Promise.all(tasks).then(() => {
    persistNoteChange();
    renderAttachments(note);
  }).catch((error) => console.warn('Attachment load failed', error));
}

noteButton?.addEventListener('click', () => openNotePanel());
noteClose?.addEventListener('click', () => openNotePanel(false));
notesOverlay?.addEventListener('click', (event) => {
  if (event.target === notesOverlay) openNotePanel(false);
});
noteToggleArchive?.addEventListener('click', () => {
  showArchive = !showArchive;
  noteToggleArchive.textContent = showArchive ? 'Notes' : 'Archive';
  selectedNoteId = null;
  renderNotes();
});

noteNew?.addEventListener('click', () => {
  if (showArchive) {
    showArchive = false;
    noteToggleArchive.textContent = 'Archive';
  }
  const now = Date.now();
  const note = {
    id: generateId(),
    title: 'New note',
    content: '',
    isChecklist: false,
    checklistItems: [],
    attachments: [],
    reminderMinutes: null,
    reminderAt: null,
    createdAt: now,
    updatedAt: now,
    archived: false
  };
  notes.unshift(note);
  saveNotas();
  selectedNoteId = note.id;
  renderNotes();
  openNotePanel(true);
  focusEditor();
});

noteTitleInput?.addEventListener('input', () => {
  const note = getSelectedNote();
  if (!note) return;
  note.title = noteTitleInput.value;
  persistNoteChange();
});

noteChecklistToggle?.addEventListener('change', () => {
  const note = getSelectedNote();
  if (!note) return;
  if (noteChecklistToggle.checked) {
    const lines = (note.content || '').split('\n').filter(Boolean);
    note.checklistItems = lines.length ? lines.map((line) => createChecklistItem(line)) : [createChecklistItem('New item')];
    note.content = '';
    note.isChecklist = true;
  } else {
    const lines = (note.checklistItems || []).map((item) => `${item.checked ? '[x]' : '[ ]'} ${item.text}`);
    note.content = lines.join('\n');
    note.checklistItems = [];
    note.isChecklist = false;
  }
  persistNoteChange();
  renderEditor();
});

noteTextarea?.addEventListener('input', () => {
  const note = getSelectedNote();
  if (!note) return;
  note.content = noteTextarea.value;
  persistNoteChange(false);
});

noteTextarea?.addEventListener('blur', () => {
  const note = getSelectedNote();
  if (!note) return;
  note.updatedAt = Date.now();
  persistNoteChange(false);
  renderNotes();
});

noteReminderSet?.addEventListener('click', () => {
  const note = getSelectedNote();
  if (!note) return;
  const minutes = parseInt(noteReminderInput.value, 10);
  scheduleReminder(note, minutes);
});

noteCopy?.addEventListener('click', () => {
  const note = getSelectedNote();
  if (note) copyNoteToClipboard(note);
});

noteEmail?.addEventListener('click', () => {
  const note = getSelectedNote();
  if (note) sendNoteByEmail(note);
});

noteDelete?.addEventListener('click', () => {
  const note = getSelectedNote();
  if (!note) return;
  if (confirm('Delete this note?')) deleteNote(note);
});

noteArchive?.addEventListener('click', () => {
  const note = getSelectedNote();
  if (note) archiveNote(note);
});

noteRestore?.addEventListener('click', () => {
  const note = getSelectedNote();
  if (note) restoreNote(note);
});

noteAddAttachment?.addEventListener('click', () => noteFileInput?.click());
noteClearAttachments?.addEventListener('click', () => {
  const note = getSelectedNote();
  if (!note) return;
  if (!note.attachments || !note.attachments.length) return;
  if (confirm('Clear all attachments?')) {
    note.attachments = [];
    persistNoteChange();
    renderAttachments(note);
  }
});

noteFileInput?.addEventListener('change', (event) => {
  handleAttachmentFiles(event.target.files || []);
  event.target.value = '';
});

noteDropZone?.addEventListener('dragover', (event) => {
  event.preventDefault();
  noteDropZone.classList.add('dragover');
});
noteDropZone?.addEventListener('dragleave', () => {
  noteDropZone.classList.remove('dragover');
});
noteDropZone?.addEventListener('drop', (event) => {
  event.preventDefault();
  noteDropZone.classList.remove('dragover');
  if (event.dataTransfer?.files?.length) {
    handleAttachmentFiles(event.dataTransfer.files);
  }
});

noteChecklist?.addEventListener('dblclick', addChecklistItem);

noteDragHandle?.addEventListener('pointerdown', (event) => {
  if (!notePanel) return;
  dragState = {
    id: event.pointerId,
    startX: event.clientX,
    startY: event.clientY,
    offsetX: notePanel.offsetLeft,
    offsetY: notePanel.offsetTop
  };
  notePanel.setPointerCapture(event.pointerId);
});

noteResizeHandle?.addEventListener('pointerdown', (event) => {
  if (!notePanel) return;
  resizeState = {
    id: event.pointerId,
    startX: event.clientX,
    startY: event.clientY,
    width: notePanel.offsetWidth,
    height: notePanel.offsetHeight
  };
  notePanel.setPointerCapture(event.pointerId);
});

notePanel?.addEventListener('pointermove', (event) => {
  if (dragState && event.pointerId === dragState.id) {
    const x = dragState.offsetX + (event.clientX - dragState.startX);
    const y = dragState.offsetY + (event.clientY - dragState.startY);
    notePanel.style.left = `${Math.max(8, x)}px`;
    notePanel.style.top = `${Math.max(8, y)}px`;
  }
  if (resizeState && event.pointerId === resizeState.id) {
    const deltaX = event.clientX - resizeState.startX;
    const deltaY = event.clientY - resizeState.startY;
    notePanel.style.width = `${Math.max(320, resizeState.width + deltaX)}px`;
    notePanel.style.height = `${Math.max(260, resizeState.height + deltaY)}px`;
  }
});

notePanel?.addEventListener('pointerup', (event) => {
  if (dragState?.id === event.pointerId) dragState = null;
  if (resizeState?.id === event.pointerId) resizeState = null;
  if (notePanel.hasPointerCapture(event.pointerId)) {
    notePanel.releasePointerCapture(event.pointerId);
  }
});

closeButton?.addEventListener('click', () => {
  window.reminderAPI?.closeApp?.();
});

minimizeButton?.addEventListener('click', () => {
  window.reminderAPI?.minimizeApp?.();
});

intervalSelect?.addEventListener('change', (event) => {
  const value = parseInt(event.target.value, 10);
  if (!Number.isNaN(value) && value > 0) {
    intervalMinutes = value;
    localStorage.setItem('reminderInterval', String(intervalMinutes));
    lastTriggerTime = Date.now();
    localStorage.setItem('reminderLastTrigger', String(lastTriggerTime));
  }
});

markButton?.addEventListener('click', () => {
  if (!awaitingCompletion) {
    showCongrats('Wait for the reminder before marking.');
    return;
  }
  awaitingCompletion = false;
  stats.completed = (stats.completed || 0) + 1;
  stats.combo = (stats.combo || 0) + 1;
  saveStats();
  updateStatsUI();
  setMarkButtonState();
  setInspirationMessage();
  showCongrats('');
  if (stats.combo > 0 && stats.combo % 2 === 0) {
    const message = celebrationMessages[Math.floor(Math.random() * celebrationMessages.length)];
    showCongrats(message);
  }
  lastTriggerTime = Date.now();
  localStorage.setItem('reminderLastTrigger', String(lastTriggerTime));
});

if (intervalSelect) {
  intervalSelect.value = String(intervalMinutes);
}

updateStatsUI();
setInspirationMessage();
showCongrats('');
renderNotes();
requestAnimationFrame(updateTimeDisplay);
"""

pathlib.Path('renderer.js').write_text(code, encoding='utf-8')
