const { app, BrowserWindow, Tray, Menu, globalShortcut, ipcMain, nativeImage } = require('electron');
const path = require('path');
const fs = require('fs');
const database = require('./database');

let mainWindow = null;
let tray = null;

function getThemeFilePath() {
  return path.join(app.getPath('userData'), 'theme.json');
}

function loadTheme() {
  try {
    return JSON.parse(fs.readFileSync(getThemeFilePath(), 'utf-8')).theme || 'cute';
  } catch {
    return 'cute';
  }
}

function saveTheme(theme) {
  fs.writeFileSync(getThemeFilePath(), JSON.stringify({ theme }), 'utf-8');
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 950,
    height: 680,
    minWidth: 650,
    minHeight: 450,
    alwaysOnTop: true,
    frame: false,
    transparent: true,
    backgroundColor: '#00000000',
    resizable: true,
    skipTaskbar: false,
    icon: createTrayIcon(),
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });
  mainWindow.loadFile(path.join(__dirname, 'renderer', 'index.html'));
  mainWindow.on('close', (event) => {
    if (!app.isQuitting) { event.preventDefault(); mainWindow.hide(); }
  });
}

function createTrayIcon() {
  // Draw a proper sticky-note icon (32x32 for crisp display)
  const S = 32, pad = 3, fold = 10;
  const buf = Buffer.alloc(S * S * 4);

  function set(x, y, r, g, b, a) {
    if (x < 0 || x >= S || y < 0 || y >= S) return;
    const i = (y * S + x) * 4;
    buf[i] = r; buf[i + 1] = g; buf[i + 2] = b; buf[i + 3] = a;
  }

  // Fill entire icon with transparent first
  for (let y = 0; y < S; y++)
    for (let x = 0; x < S; x++)
      set(x, y, 0, 0, 0, 0);

  // Main note body (rounded rectangle)
  const noteColor = [255, 230, 100]; // warm yellow
  const shadowColor = [180, 160, 80];
  const lineColor = [200, 180, 120];

  // Draw shadow
  for (let y = pad + 2; y < S - pad + 1; y++)
    for (let x = pad + 2; x < S - pad + 1; x++)
      if (!(x >= S - fold - pad && y <= pad + fold + 1))
        set(x, y, ...shadowColor, 180);

  // Draw note body
  for (let y = pad; y < S - pad; y++) {
    for (let x = pad; x < S - pad; x++) {
      // Skip the folded corner triangle
      if (x >= S - fold - pad && y <= pad + fold) continue;
      set(x, y, ...noteColor, 255);
    }
  }

  // Draw folded corner (gray triangle for depth)
  for (let y = pad; y <= pad + fold; y++) {
    for (let x = S - fold - pad; x < S - pad; x++) {
      if (x - (S - fold - pad) + (y - pad) <= fold) {
        set(x, y, 240, 235, 210, 255);
      }
    }
  }
  // Fold edge line
  for (let i = 0; i <= fold; i++) {
    set(S - fold - pad + i, pad + fold - i, 190, 185, 160, 255);
  }

  // Draw text lines on the note
  const lineY = [12, 17, 22];
  const lineLen = [14, 12, 8];
  lineY.forEach((sy, idx) => {
    for (let x = 9; x < 9 + lineLen[idx]; x++) {
      for (let dy = 0; dy < 2; dy++) {
        set(x, sy + dy, ...lineColor, 220);
      }
    }
  });

  // Rounded corners: punch out extreme corners
  for (let r = 0; r < 3; r++) {
    // Top-left
    if (r === 2) set(pad, pad, 0,0,0,0);
    if (r <= 1) { set(pad + r, pad, 0,0,0,0); set(pad, pad + r, 0,0,0,0); }
    // Top-right (skip if in fold)
    // Bottom-left
    if (r <= 1) { set(pad + r, S - pad - 1, 0,0,0,0); set(pad, S - pad - 1 - r, 0,0,0,0); }
    // Bottom-right
    if (r <= 1) { set(S - pad - 1 - r, S - pad - 1, 0,0,0,0); set(S - pad - 1, S - pad - 1 - r, 0,0,0,0); }
  }

  return nativeImage.createFromBuffer(buf, { width: S, height: S });
}

function createTray() {
  tray = new Tray(createTrayIcon());
  tray.setToolTip('便签 v2');
  tray.setContextMenu(Menu.buildFromTemplate([
    { label: '显示/隐藏窗口', click: () => mainWindow.isVisible() ? mainWindow.hide() : mainWindow.show() },
    { type: 'separator' },
    { label: '退出', click: () => { app.isQuitting = true; app.quit(); } }
  ]));
  tray.on('click', () => mainWindow.isVisible() ? mainWindow.hide() : mainWindow.show());
}

function registerShortcuts() {
  globalShortcut.register('CommandOrControl+Shift+N', () => {
    mainWindow.isVisible() ? mainWindow.hide() : mainWindow.show();
  });
}

// ========== IPC ==========
function setupIPC() {
  ipcMain.handle('notes:create', (_e, c, t, col) => database.createNote(c, t, col));
  ipcMain.handle('notes:update', (_e, id, c, t, col) => database.updateNote(id, c, t, col));
  ipcMain.handle('notes:delete', (_e, id) => database.deleteNote(id));
  ipcMain.handle('notes:getAll', () => database.getAllNotes());
  ipcMain.handle('notes:getByCollection', (_e, col) => database.getNotesByCollection(col));
  ipcMain.handle('notes:search', (_e, q) => database.searchNotes(q));
  ipcMain.handle('notes:searchByTags', (_e, t) => database.searchByTags(t));
  ipcMain.handle('notes:searchByTime', (_e, s, e) => database.searchByTime(s, e));
  ipcMain.handle('notes:getTimeGroup', (_e, g) => database.getTimeGroup(g));
  ipcMain.handle('notes:getByDate', (_e, d) => database.getNotesByDate(d));
  ipcMain.handle('notes:getActiveDates', () => database.getActiveDates());
  ipcMain.handle('notes:getAllTags', () => database.getAllTags());

  ipcMain.handle('collections:getAll', () => database.getAllCollections());
  ipcMain.handle('collections:add', (_e, n) => database.addCollection(n));
  ipcMain.handle('collections:remove', (_e, n) => database.removeCollection(n));
  ipcMain.handle('collections:counts', () => database.getCollectionCounts());

  ipcMain.handle('window:hide', () => mainWindow.hide());
  ipcMain.handle('window:minimize', () => mainWindow.minimize());
  ipcMain.handle('window:close', () => mainWindow.hide());
  ipcMain.handle('window:quit', () => { app.isQuitting = true; app.quit(); });

  ipcMain.handle('theme:get', () => loadTheme());
  ipcMain.handle('theme:set', (_e, t) => saveTheme(t));
}

app.whenReady().then(async () => {
  await database.initDatabase(app.getPath('userData'));
  setupIPC();
  createWindow();
  createTray();
  registerShortcuts();
});

app.on('window-all-closed', () => {});
app.on('will-quit', () => globalShortcut.unregisterAll());
app.on('activate', () => { if (mainWindow) mainWindow.show(); });
