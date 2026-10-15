// ============ STATE ============
var state = {
  notes: [], tags: [], activeDates: [],
  collections: [], collectionCounts: {},
  currentCollection: '\u5168\u90E8',
  currentTimeFilter: 'all', currentTagFilter: null,
  searchQuery: '', selectedDate: null,
  editingNoteId: null, previewOn: false,
  currentTheme: 'cute',
  calendarYear: new Date().getFullYear(),
  calendarMonth: new Date().getMonth(),
};

// ============ DOM ============
var $ = function(s) { return document.querySelector(s); };
var dom = {
  body: document.body,
  titlebar: $('#titlebar'),
  searchInput: $('#search-input'),
  themeDots: $('#theme-dots'),
  btnMinimize: $('#btn-minimize'),
  btnClose: $('#btn-close'),
  collectionList: $('#collection-list'),
  collectionAddInput: $('#collection-add-input'),
  timeFilters: $('#time-filters'),
  calendarInput: $('#calendar-input'),
  miniCalendar: $('#mini-calendar'),
  tagList: $('#tag-list'),
  notesList: $('#notes-list'),
  emptyState: $('#empty-state'),
  btnNewNote: $('#btn-new-note'),
  editorPlaceholder: $('#editor-placeholder'),
  editorActive: $('#editor-active'),
  editorCollectionSelect: $('#editor-collection-select'),
  editorTags: $('#editor-tags'),
  editorDelete: $('#editor-delete'),
  editorTextarea: $('#editor-textarea'),
  editorPreview: $('#editor-preview'),
  editorBody: $('#editor-body'),
  editorStatus: $('#editor-status'),
  btnPreviewToggle: $('#btn-preview-toggle'),
  statusbarInfo: $('#statusbar-info'),
  statusbarCollection: $('#statusbar-collection'),
  quickInput: $('#quick-input'),
  quickSendBtn: $('#quick-send-btn'),
  quickColSelect: $('#quick-col-select'),
  btnSave: $('#btn-save'),
};

// ============ UTILS ============
var debounce = function(fn, d) { var t; return function() { clearTimeout(t); t = setTimeout(function() { fn(); }, d); }; };
var pad = function(n) { return String(n).padStart(2, '0'); };

function formatTime(iso) {
  var d = new Date(iso), now = new Date();
  var ds = d.toDateString(), ns = now.toDateString();
  var t = pad(d.getHours()) + ':' + pad(d.getMinutes());
  if (ds === ns) return '\u4ECA\u5929 ' + t;
  var y = new Date(now); y.setDate(y.getDate() - 1);
  if (ds === y.toDateString()) return '\u6628\u5929 ' + t;
  return d.getFullYear() + '-' + pad(d.getMonth()+1) + '-' + pad(d.getDate()) + ' ' + t;
}

function formatDateStr(y, m, d) { return y + '-' + pad(m+1) + '-' + pad(d); }

function stripMarkdown(md) {
  return md.replace(/#{1,6}\s/g,'').replace(/\*\*(.+?)\*\*/g,'$1').replace(/\*(.+?)\*/g,'$1')
    .replace(/`{1,3}[^]*?`{1,3}/g,'').replace(/\[([^\]]+)\]\([^)]+\)/g,'$1')
    .replace(/!\[([^\]]*)\]\([^)]+\)/g,'$1').replace(/^>\s/gm,'').replace(/[-*+]\s/g,'').replace(/\n+/g,' ').trim();
}

function escapeHtml(s) { var d=document.createElement('div'); d.textContent=s; return d.innerHTML; }

function getFirstLine(md) {
  var lines = md.trim().split('\n');
  var first = lines[0].replace(/^#{1,6}\s*/, '').trim();
  return first || '\u65E0\u6807\u9898';
}

var THEME_EMOJIS = { cute:'\u{1F338}', minimal:'\u{1F4DD}', hellokitty:'\u{1F380}', ocean:'\u{1F30A}', forest:'\u{1F33F}', sunset:'\u{1F305}', lavender:'\u{1F49C}', dark:'\u{1F5A4}', glass:'\u{1FA9F}' };

function parseThemeColor(value) {
  var color = value.trim();
  if (color === 'transparent') return [0, 0, 0, 0];
  if (color[0] === '#') {
    var hex = color.slice(1);
    if (hex.length === 3) hex = hex.split('').map(function(c) { return c + c; }).join('');
    return [0, 2, 4].map(function(i) { return parseInt(hex.slice(i, i + 2), 16); }).concat(1);
  }
  var match = color.match(/^rgba?\(([^)]+)\)$/);
  if (!match) return [255, 255, 255, 1];
  var values = match[1].split(',').map(function(part) { return Number(part.trim()); });
  return [values[0], values[1], values[2], values.length === 4 ? values[3] : 1];
}

function compositeColor(color, behind) {
  return behind.map(function(bg) {
    return bg.map(function(channel, i) { return color[i] * color[3] + channel * (1 - color[3]); });
  });
}

function colorLuminance(rgb) {
  var channels = rgb.map(function(value) {
    var c = value / 255;
    return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  });
  return channels[0] * 0.2126 + channels[1] * 0.7152 + channels[2] * 0.0722;
}

function minContrast(hex, backgrounds) {
  var foreground = colorLuminance(parseThemeColor(hex));
  return Math.min.apply(null, backgrounds.map(function(bg) {
    var background = colorLuminance(bg);
    return (Math.max(foreground, background) + 0.05) / (Math.min(foreground, background) + 0.05);
  }));
}

function bestTextColor(backgrounds, dark, light) {
  return minContrast(dark, backgrounds) >= minContrast(light, backgrounds) ? dark : light;
}

function applyTheme(theme) {
  state.currentTheme = theme;
  dom.body.className = 'theme-' + theme;
  var css = getComputedStyle(dom.body);
  var getColor = function(name) { return parseThemeColor(css.getPropertyValue(name)); };
  var desktop = [[0, 0, 0], [255, 255, 255]];
  var root = compositeColor(getColor('--bg-root'), desktop);
  var surface = compositeColor(getColor('--bg-surface'), root);
  var sidebar = compositeColor(getColor('--bg-sidebar'), root);
  var content = surface.concat(sidebar);
  var primary = bestTextColor(content, '#000000', '#FFFFFF');
  var lightText = primary === '#FFFFFF';
  var secondary = lightText ? '#E8F2F5' : '#26323C';
  var muted = lightText ? '#D5E5E9' : '#3A4852';
  dom.body.style.setProperty('--text-primary', primary);
  dom.body.style.setProperty('--text-secondary', minContrast(secondary, content) >= 4.5 ? secondary : primary);
  dom.body.style.setProperty('--text-muted', minContrast(muted, content) >= 4.5 ? muted : primary);
  dom.body.style.setProperty('--titlebar-fg', bestTextColor(compositeColor(getColor('--titlebar-bg'), root), '#000000', '#FFFFFF'));
  dom.body.style.setProperty('--statusbar-fg', bestTextColor(compositeColor(getColor('--statusbar-bg'), root), '#000000', '#FFFFFF'));
  dom.body.style.setProperty('--tag-fg', bestTextColor(compositeColor(getColor('--tag-bg'), content), '#000000', '#FFFFFF'));
  dom.body.style.setProperty('--accent-fg', bestTextColor(compositeColor(getColor('--accent'), root), '#000000', '#FFFFFF'));
  dom.body.style.setProperty('--danger-fg', bestTextColor(compositeColor(getColor('--danger'), root), '#000000', '#FFFFFF'));
  dom.themeDots.querySelectorAll('.tdot').forEach(function(dot) {
    var active = dot.dataset.theme === theme;
    dot.classList.toggle('active', active);
    dot.setAttribute('aria-pressed', String(active));
  });
}

// ============ LOAD ============
async function loadNotes() {
  try {
    if (state.selectedDate) { state.notes = await window.api.notes.getByDate(state.selectedDate); }
    else if (state.currentTimeFilter !== 'all') { state.notes = await window.api.notes.getTimeGroup(state.currentTimeFilter); }
    else if (state.currentTagFilter) { state.notes = await window.api.notes.searchByTags([state.currentTagFilter]); }
    else if (state.searchQuery.trim()) { state.notes = await window.api.notes.search(state.searchQuery.trim()); }
    else if (state.currentCollection !== '\u5168\u90E8') { state.notes = await window.api.notes.getByCollection(state.currentCollection); }
    else { state.notes = await window.api.notes.getAll(); }
    renderNotes();
    updateStatusbar();
  } catch(e) { console.error(e); }
}

async function loadTags() { try { state.tags = await window.api.notes.getAllTags(); renderTags(); } catch(e) {} }
async function loadCollections() {
  try { state.collections = await window.api.collections.getAll(); state.collectionCounts = await window.api.collections.counts(); renderCollections(); renderCollectionSelects(); } catch(e) {}
}
async function loadActiveDates() { try { state.activeDates = await window.api.notes.getActiveDates(); renderMiniCalendar(); } catch(e) {} }

// ============ RENDER NOTES ============
function renderNotes() {
  dom.notesList.innerHTML = '';
  if (state.notes.length === 0) { dom.emptyState.style.display = ''; return; }
  dom.emptyState.style.display = 'none';

  state.notes.forEach(function(note) {
    var card = document.createElement('div');
    card.className = 'note-card';
    if (note.id === state.editingNoteId) card.classList.add('selected');
    card.dataset.id = note.id;
    var title = getFirstLine(note.content);
    var preview = stripMarkdown(note.content);
    var previewText = preview.length > 80 ? preview.slice(0, 80) + '...' : preview;

    card.innerHTML = '<div class="note-card-title">' + escapeHtml(title) + '</div>' +
      '<div class="note-card-preview">' + escapeHtml(previewText) + '</div>' +
      '<div class="note-card-meta">' +
        '<span><span class="note-card-collection">' + escapeHtml(note.collection || '\u5168\u90E8') + '</span>' +
        (note.tags||[]).slice(0,2).map(function(t){return '<span class="note-card-tag">#'+escapeHtml(t)+'</span>';}).join('') + '</span>' +
        '<span>' + formatTime(note.updated_at) + '</span>' +
      '</div>';

    card.addEventListener('click', function() { selectNote(note.id); });
    card.style.animationDelay = (state.notes.indexOf(note) * 0.03) + 's';
    card.classList.add('anim-enter');
    dom.notesList.appendChild(card);
  });
}

function selectNote(noteId) {
  state.editingNoteId = noteId;
  state.previewOn = false;
  var note = state.notes.find(function(n) { return n.id === noteId; });
  if (!note) return;

  renderNotes();
  dom.editorTextarea.value = note.content;
  dom.editorPreview.style.display = "none";
  dom.editorTextarea.style.display = "";
  dom.editorCollectionSelect.value = note.collection || String.fromCodePoint(0x5168, 0x90E8);
  dom.editorStatus.textContent = formatTime(note.created_at) + " " + String.fromCodePoint(0x521B, 0x5EFA) + " " + String.fromCodePoint(0x00B7) + " " + formatTime(note.updated_at) + " " + String.fromCodePoint(0x66F4, 0x65B0);
  renderEditorTags(note.tags || []);

  // Animate: placeholder out, editor in
  dom.editorPlaceholder.classList.add("anim-out");
  dom.editorActive.style.display = "";
  dom.editorActive.classList.add("anim-in");
  dom.editorActive.classList.remove("anim-out");
  setTimeout(function() {
    dom.editorPlaceholder.style.display = "none";
    dom.editorPlaceholder.classList.remove("anim-out");
    dom.editorActive.classList.remove("anim-in");
  }, 260);
  dom.editorTextarea.focus();
}

function closeEditor() {
  state.editingNoteId = null;
  dom.editorTextarea.value = '';
  dom.editorPreview.innerHTML = '';
  // Animate: editor out, placeholder in
  dom.editorActive.classList.add('anim-out');
  dom.editorPlaceholder.style.display = '';
  dom.editorPlaceholder.classList.remove('anim-out');
  dom.editorPlaceholder.style.animation = 'fadeInScale 0.25s ease forwards';
  setTimeout(function() {
    dom.editorActive.style.display = 'none';
    dom.editorActive.classList.remove('anim-out');
    dom.editorPlaceholder.style.animation = '';
    renderNotes();
    updateStatusbar();
  }, 260);
}

// Silent close (no animation), for use when switching panels without user intent
function closeEditorSilent() {
  state.editingNoteId = null;
  dom.editorPlaceholder.style.display = '';
  dom.editorPlaceholder.classList.remove('anim-out');
  dom.editorPlaceholder.style.animation = '';
  dom.editorActive.style.display = 'none';
  dom.editorActive.classList.remove('anim-in', 'anim-out');
  dom.editorTextarea.value = '';
  dom.editorPreview.innerHTML = '';
  renderNotes();
  updateStatusbar();
}

// ============ RENDER COLLECTIONS ============
function renderCollections() {
  dom.collectionList.innerHTML = '';
  var DEFAULT = ['\u5168\u90E8','\u5DE5\u4F5C','\u751F\u6D3B','\u5B66\u4E60','\u7075\u611F','\u5F85\u529E'];
  state.collections.forEach(function(col) {
    var el = document.createElement('div');
    el.className = 'collection-item';
    if (state.currentCollection === col) el.classList.add('active');
    var cnt = state.collectionCounts[col] || 0;
    el.innerHTML = '<span class="collection-name">' + escapeHtml(col) + '</span>' +
      '<span class="collection-count">' + cnt + '</span>' +
      (!DEFAULT.includes(col) ? '<span class="collection-del">\u00D7</span>' : '');
    el.querySelector('.collection-name').addEventListener('click', function() { selectCollection(col); });
    var delBtn = el.querySelector('.collection-del');
    if (delBtn) delBtn.addEventListener('click', async function(e) {
      e.stopPropagation();
      if (confirm('\u5220\u9664\u5206\u533A\u300C' + col + '\u300D\uFF1F\u5176\u4E2D\u7684\u4FBF\u7B7E\u5C06\u79FB\u81F3\u300C\u5168\u90E8\u300D\u3002')) {
        await window.api.collections.remove(col);
        if (state.currentCollection === col) state.currentCollection = '\u5168\u90E8';
        await loadCollections(); await loadNotes();
      }
    });
    dom.collectionList.appendChild(el);
  });
}

async function selectCollection(col) {
  state.currentCollection = col; state.currentTimeFilter = 'all';
  state.selectedDate = null; state.currentTagFilter = null;
  dom.calendarInput.value = ''; dom.searchInput.value = ''; state.searchQuery = '';
  syncTimeBtns(); renderCollections(); renderCollectionSelects(); renderTags();
  closeEditorSilent();
  await loadNotes();
}

function renderCollectionSelects() {
  if (dom.editorCollectionSelect) {
    dom.editorCollectionSelect.innerHTML = '';
    state.collections.forEach(function(col) {
      var o = document.createElement('option'); o.value = col; o.textContent = col;
      dom.editorCollectionSelect.appendChild(o);
    });
  }
  if (dom.quickColSelect) {
    dom.quickColSelect.innerHTML = '';
    state.collections.forEach(function(col) {
      var o = document.createElement('option'); o.value = col; o.textContent = col;
      if (col === state.currentCollection) o.selected = true;
      dom.quickColSelect.appendChild(o);
    });
  }
}

// ============ TAGS ============
function renderTags() {
  dom.tagList.innerHTML = '';
  state.tags.forEach(function(tag) {
    var el = document.createElement('span');
    el.className = 'tag-item';
    if (state.currentTagFilter === tag) el.classList.add('selected');
    el.textContent = '#' + tag;
    el.addEventListener('click', function() {
      state.currentTagFilter = state.currentTagFilter === tag ? null : tag;
      if (state.currentTagFilter) { state.selectedDate = null; state.currentTimeFilter = 'all'; dom.calendarInput.value = ''; syncTimeBtns(); }
      closeEditorSilent();
      renderTags(); loadNotes();
    });
    dom.tagList.appendChild(el);
  });
}

// ============ CALENDAR ============
function renderMiniCalendar() {
  var cY = state.calendarYear, cM = state.calendarMonth;
  var c = dom.miniCalendar;
  var mn = ['1\u6708','2\u6708','3\u6708','4\u6708','5\u6708','6\u6708','7\u6708','8\u6708','9\u6708','10\u6708','11\u6708','12\u6708'];
  var h = '<div class="cal-header"><button class="cal-nav" data-dir="-1">\u25C0</button><span class="cal-month-label">' + cY + '\u5E74 ' + mn[cM] + '</span><button class="cal-nav" data-dir="1">\u25B6</button></div>';
  h += '<div class="cal-weekdays">' + ['\u4E00','\u4E8C','\u4E09','\u56DB','\u4E94','\u516D','\u65E5'].map(function(d){return '<span>'+d+'</span>';}).join('') + '</div>';
  var fd = new Date(cY, cM, 1).getDay(), dim = new Date(cY, cM + 1, 0).getDate();
  var ts = formatDateStr(new Date().getFullYear(), new Date().getMonth(), new Date().getDate());
  h += '<div class="cal-days">';
  var so = fd === 0 ? 6 : fd - 1;
  for (var i = 0; i < so; i++) h += '<span class="cal-day empty"></span>';
  for (var d = 1; d <= dim; d++) {
    var ds = formatDateStr(cY, cM, d);
    var cls = 'cal-day';
    if (ds === ts) cls += ' today';
    if (state.activeDates.includes(ds)) cls += ' has-notes';
    if (state.selectedDate === ds) cls += ' selected';
    h += '<span class="' + cls + '" data-date="' + ds + '">' + d + '</span>';
  }
  h += '</div>';
  c.innerHTML = h;
  c.querySelectorAll('.cal-nav').forEach(function(b) { b.addEventListener('click', function() {
    state.calendarMonth += parseInt(b.dataset.dir);
    if (state.calendarMonth < 0) { state.calendarMonth = 11; state.calendarYear--; }
    else if (state.calendarMonth > 11) { state.calendarMonth = 0; state.calendarYear++; }
    renderMiniCalendar();
  });});
  c.querySelectorAll('.cal-day:not(.empty)').forEach(function(day) {
    day.addEventListener('click', function() {
      var ds = day.dataset.date; if (!ds) return;
      state.selectedDate = ds; state.currentTagFilter = null;
      var now = new Date();
      var todayStr = formatDateStr(now.getFullYear(), now.getMonth(), now.getDate());
      var yesterday = new Date(now); yesterday.setDate(yesterday.getDate() - 1);
      var yesterdayStr = formatDateStr(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate());
      if (ds === todayStr) { state.currentTimeFilter = 'today'; }
      else if (ds === yesterdayStr) { state.currentTimeFilter = 'yesterday'; }
      else { state.currentTimeFilter = 'all'; }
      state._skipCalInput = true; dom.calendarInput.value = ds; syncTimeBtns(); renderTags(); renderMiniCalendar();
      closeEditorSilent();
      loadNotes();
    });
  });
}

function syncTimeBtns() {
  dom.timeFilters.querySelectorAll('.time-btn').forEach(function(b) { b.classList.remove('active'); });
  var ab = dom.timeFilters.querySelector('[data-time="' + state.currentTimeFilter + '"]');
  if (ab) ab.classList.add('active');
}

// ============ EDITOR ============
function renderEditorTags(tags) {
  dom.editorTags.innerHTML = '';
  tags.forEach(function(tag) {
    var el = document.createElement('span'); el.className = 'editor-tag';
    el.innerHTML = '#' + escapeHtml(tag) + ' <span class="editor-tag-remove">\u00D7</span>';
    el.querySelector('.editor-tag-remove').addEventListener('click', async function() {
      var note = state.notes.find(function(n) { return n.id === state.editingNoteId; }); if (!note) return;
      var nt = note.tags.filter(function(t) { return t !== tag; }); note.tags = nt;
      await window.api.notes.update(note.id, note.content, nt, note.collection);
      renderEditorTags(nt); loadNotes(); loadTags();
    });
    dom.editorTags.appendChild(el);
  });
  var ab = document.createElement('button'); ab.className = 'editor-tag-add'; ab.textContent = '+ \u6807\u7B7E';
  ab.addEventListener('click', function() {
    ab.style.display = 'none';
    var inp = document.createElement('input'); inp.className = 'editor-tag-input'; inp.placeholder = '\u65B0\u6807\u7B7E';
    inp.addEventListener('keydown', async function(e) {
      if (e.key === 'Enter' && inp.value.trim()) {
        var note = state.notes.find(function(n) { return n.id === state.editingNoteId; }); if (!note) return;
        var tag = inp.value.trim();
        if (!note.tags.includes(tag)) { var nt = note.tags.concat([tag]); note.tags = nt; await window.api.notes.update(note.id, note.content, nt, note.collection); renderEditorTags(nt); loadNotes(); loadTags(); }
        inp.remove(); ab.style.display = '';
      } else if (e.key === 'Escape') { inp.remove(); ab.style.display = ''; }
    });
    inp.addEventListener('blur', function() { setTimeout(function() { if (inp.parentNode) { inp.remove(); ab.style.display = ''; } }, 100); });
    dom.editorTags.appendChild(inp); inp.focus();
  });
  dom.editorTags.appendChild(ab);
}

// Flush save immediately (called by Ctrl+S / save button)
async function flushSave() {
  if (state.editingNoteId === null) return;
  var content = dom.editorTextarea.value;
  var collection = dom.editorCollectionSelect.value;
  var note = state.notes.find(function(n) { return n.id === state.editingNoteId; }); if (!note) return;
  try {
    await window.api.notes.update(state.editingNoteId, content, note.tags, collection);
    note.content = content; note.collection = collection;
    dom.editorStatus.textContent = String.fromCodePoint(0x2705) + " " + String.fromCodePoint(0x5DF2, 0x4FDD, 0x5B58);
    if (state.previewOn) dom.editorPreview.innerHTML = await renderMarkdown(content);
    loadNotes(); loadActiveDates(); loadCollections();
  } catch(e) { dom.editorStatus.textContent = String.fromCodePoint(0x274C) + " " + String.fromCodePoint(0x4FDD, 0x5B58, 0x5931, 0x8D25); console.error(e); }
}

var autoSave = debounce(function() {
  flushSave();
}, 200);

async function renderMarkdown(md) { try { if (typeof marked !== 'undefined') return marked.parse(md); } catch(e) {} return '<p style="color:var(--text-muted)">\u6E32\u67D3\u5668\u672A\u52A0\u8F7D</p>'; }

// ============ NEW NOTE ============
async function createNewNote() {
  try {
    var note = await window.api.notes.create('', [], state.currentCollection);
    await loadNotes(); await loadTags(); await loadActiveDates(); await loadCollections();
    selectNote(note.id);
    dom.editorTextarea.focus();
  } catch(e) { console.error(e); }
}

// ============ QUICK ADD FROM BOTTOM BAR ============
async function quickAdd() {
  var content = dom.quickInput.value.trim();
  if (!content) return;
  var col = dom.quickColSelect.value || state.currentCollection;
  try {
    var note = await window.api.notes.create(content, [], col);
    dom.quickInput.value = '';
    state.currentCollection = col;
    await loadNotes(); await loadTags(); await loadActiveDates(); await loadCollections();
    // Auto-select the new note in editor
    selectNote(note.id);
    dom.quickInput.focus();
  } catch(e) { console.error('���ٴ���ʧ��:', e); }
}

async function handleQuickSave() {
  // If editing a note, save it. Otherwise create new.
  if (state.editingNoteId !== null) {
    await flushSave();
    dom.editorStatus.textContent = '✅ 已保存';
    setTimeout(function() { if (dom.editorStatus) dom.editorStatus.textContent = ''; }, 1500);
  } else if (dom.quickInput.value.trim()) {
    await quickAdd();
  }
}

// ============ UPDATE STATUSBAR ============
function updateStatusbar() {
  dom.statusbarInfo.textContent = state.notes.length + ' \u6761\u4FBF\u7B7E';
  dom.statusbarCollection.textContent = state.currentCollection;
}

// ============ EVENTS ============
function bindEvents() {
  dom.searchInput.addEventListener('input', debounce(function() {
    state.searchQuery = dom.searchInput.value; state.selectedDate = null; dom.calendarInput.value = '';
    closeEditorSilent();
    loadNotes();
  }, 250));

  dom.timeFilters.addEventListener('click', function(e) {
    var btn = e.target.closest('.time-btn'); if (!btn) return;
    state.currentTimeFilter = btn.dataset.time; state.currentTagFilter = null;
    var now2 = new Date();
    if (btn.dataset.time === 'today') {
      state.selectedDate = formatDateStr(now2.getFullYear(), now2.getMonth(), now2.getDate());
      state._skipCalInput = true; dom.calendarInput.value = state.selectedDate;
      state.calendarYear = now2.getFullYear(); state.calendarMonth = now2.getMonth();
    } else if (btn.dataset.time === 'yesterday') {
      var y2 = new Date(now2); y2.setDate(y2.getDate() - 1);
      state.selectedDate = formatDateStr(y2.getFullYear(), y2.getMonth(), y2.getDate());
      state._skipCalInput = true; dom.calendarInput.value = state.selectedDate;
      state.calendarYear = y2.getFullYear(); state.calendarMonth = y2.getMonth();
    } else {
      state.selectedDate = null; dom.calendarInput.value = '';
      state.calendarYear = now2.getFullYear(); state.calendarMonth = now2.getMonth();
    }
    syncTimeBtns(); renderTags(); renderMiniCalendar();
    closeEditorSilent();
    loadNotes();
  });

  dom.calendarInput.addEventListener('change', function() {
    if (state._skipCalInput) { state._skipCalInput = false; return; }
    var v = dom.calendarInput.value;
    if (v) {
      state.selectedDate = v; state.currentTimeFilter = 'all'; state.currentTagFilter = null;
      var parts = v.split('-'); state.calendarYear = +parts[0]; state.calendarMonth = +parts[1] - 1;
      syncTimeBtns(); renderTags(); renderMiniCalendar();
      closeEditorSilent();
      loadNotes();
    } else { state.selectedDate = null; closeEditorSilent(); renderMiniCalendar(); loadNotes(); }
  });

  dom.collectionAddInput.addEventListener('keydown', async function(e) {
    if (e.key === 'Enter' && dom.collectionAddInput.value.trim()) {
      await window.api.collections.add(dom.collectionAddInput.value.trim());
      dom.collectionAddInput.value = ''; await loadCollections();
    }
  });

  // Theme dots
  dom.themeDots.addEventListener('click', async function(e) {
    var dot = e.target.closest('.tdot'); if (!dot) return;
    var nt = dot.dataset.theme;
    applyTheme(nt);
    await window.api.theme.set(nt);
  });

  // New note
  dom.btnNewNote.addEventListener('click', createNewNote);
  document.addEventListener('keydown', function(e) {
    if ((e.ctrlKey || e.metaKey) && e.key === 's') { e.preventDefault(); handleQuickSave(); }
    if ((e.ctrlKey || e.metaKey) && e.key === 'n') { e.preventDefault(); createNewNote(); }
  });

  // Editor
  dom.editorTextarea.addEventListener('input', function() { dom.editorStatus.textContent = '\u{1F4BE} \u4FDD\u5B58\u4E2D...'; autoSave(); });
  dom.editorCollectionSelect.addEventListener('change', function() { autoSave(); });

  // Quick add bar
  dom.quickInput.addEventListener('keydown', function(e) {
    if (e.key === 'Enter') { e.preventDefault(); quickAdd(); }
  });
  dom.quickSendBtn.addEventListener('click', function() { quickAdd(); });
  dom.quickColSelect.addEventListener('change', function() {
    state.currentCollection = dom.quickColSelect.value;
    dom.statusbarCollection.textContent = state.currentCollection;
  });

  dom.editorDelete.addEventListener('click', async function() {
    if (state.editingNoteId === null) return;
    if (!confirm('\u786E\u5B9A\u8981\u5220\u9664\u8FD9\u6761\u4FBF\u7B7E\u5417\uFF1F')) return;
    try { await window.api.notes.delete(state.editingNoteId); closeEditor(); await loadNotes(); await loadTags(); await loadActiveDates(); await loadCollections(); } catch(e) {}
  });

  // Preview toggle
  dom.btnSave.addEventListener('click', function() { flushSave(); });
  var previewIconEdit = document.querySelector('.pv-icon-edit');
  var previewIconPreview = document.querySelector('.pv-icon-preview');
  dom.btnPreviewToggle.addEventListener('click', async function() {
    state.previewOn = !state.previewOn;
    if (state.previewOn) {
      dom.editorPreview.innerHTML = await renderMarkdown(dom.editorTextarea.value);
      dom.editorPreview.style.display = '';
      dom.editorTextarea.style.display = 'none';
      dom.btnPreviewToggle.classList.add('active');
      dom.btnPreviewToggle.querySelector('span').textContent = '�༭';
      if (previewIconEdit) previewIconEdit.style.display = 'none';
      if (previewIconPreview) previewIconPreview.style.display = '';
      // Move preview button to left
      
    } else {
      dom.editorPreview.style.display = 'none';
      dom.editorTextarea.style.display = '';
      dom.btnPreviewToggle.classList.remove('active');
      dom.btnPreviewToggle.querySelector('span').textContent = 'Ԥ��';
      if (previewIconEdit) previewIconEdit.style.display = '';
      if (previewIconPreview) previewIconPreview.style.display = 'none';
    }
  });

  dom.btnMinimize.addEventListener('click', function() { window.api.window.minimize(); });
  dom.btnClose.addEventListener('click', function() { window.api.window.quit(); });
}

// ============ INIT ============
async function init() {
  try { state.currentTheme = await window.api.theme.get(); } catch(e) { state.currentTheme = 'cute'; }
  if (!dom.themeDots.querySelector('[data-theme="' + state.currentTheme + '"]')) state.currentTheme = 'cute';
  applyTheme(state.currentTheme);
  bindEvents();
  await loadCollections(); await loadNotes(); await loadTags(); await loadActiveDates();
}
init();
