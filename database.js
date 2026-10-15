const path = require('path');
const fs = require('fs');

let db = null;
let dbPath = '';

const DEFAULT_COLLECTIONS = ['全部', '工作', '生活', '学习', '灵感', '待办'];

async function initDatabase(appPath) {
  const initSqlJs = require('sql.js');
  const SQL = await initSqlJs();
  dbPath = path.join(appPath, 'notes.db');

  if (fs.existsSync(dbPath)) {
    const buffer = fs.readFileSync(dbPath);
    db = new SQL.Database(buffer);
  } else {
    db = new SQL.Database();
  }

  db.run('PRAGMA journal_mode = WAL');

  // 建表
  db.run(`
    CREATE TABLE IF NOT EXISTS notes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      content TEXT NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      tags TEXT DEFAULT '[]',
      collection TEXT DEFAULT '全部'
    )
  `);

  // 迁移：给旧表加 collection 列
  try {
    db.run(`ALTER TABLE notes ADD COLUMN collection TEXT DEFAULT '全部'`);
  } catch (e) { /* 列已存在 */ }

  // 确保默认分区存在
  const existing = getAllCollections();
  DEFAULT_COLLECTIONS.forEach(c => {
    if (!existing.includes(c)) {
      db.run("INSERT INTO collections (name) VALUES (?)", [c]);
    }
  });

  // 建分区表
  db.run(`
    CREATE TABLE IF NOT EXISTS collections (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      sort_order INTEGER DEFAULT 0
    )
  `);

  DEFAULT_COLLECTIONS.forEach(name => {
    const row = db.exec("SELECT id FROM collections WHERE name = ?", [name]);
    if (!row.length || !row[0].values.length) {
      db.run('INSERT INTO collections (name) VALUES (?)', [name]);
    }
  });

  saveDb();
  return db;
}

function saveDb() {
  if (!db || !dbPath) return;
  const data = db.export();
  fs.writeFileSync(dbPath, Buffer.from(data));
}

function getDb() {
  if (!db) throw new Error('Database not initialized');
  return db;
}

// ============ Collection ============
function getAllCollections() {
  const d = getDb();
  try {
    const r = d.exec('SELECT name FROM collections ORDER BY sort_order, id');
    if (r.length === 0) return DEFAULT_COLLECTIONS.slice();
    return r[0].values.map(row => row[0]);
  } catch (e) {
    return DEFAULT_COLLECTIONS.slice();
  }
}

function addCollection(name) {
  const d = getDb();
  d.run('INSERT OR IGNORE INTO collections (name) VALUES (?)', [name]);
  saveDb();
  return getAllCollections();
}

function removeCollection(name) {
  if (DEFAULT_COLLECTIONS.includes(name)) return getAllCollections();
  const d = getDb();
  d.run('DELETE FROM collections WHERE name = ?', [name]);
  d.run("UPDATE notes SET collection = '全部' WHERE collection = ?", [name]);
  saveDb();
  return getAllCollections();
}

function getCollectionCounts() {
  const d = getDb();
  try {
    const r = d.exec('SELECT collection, COUNT(*) as cnt FROM notes GROUP BY collection');
    if (r.length === 0) return {};
    const counts = {};
    r[0].values.forEach(row => { counts[row[0]] = row[1]; });
    return counts;
  } catch (e) {
    return {};
  }
}

// ============ Notes CRUD ============
function createNote(content, tags, collection) {
  const d = getDb();
  const now = new Date().toISOString();
  const tagsJson = JSON.stringify(tags || []);
  const col = collection || '全部';
  d.run(
    'INSERT INTO notes (content, created_at, updated_at, tags, collection) VALUES (?, ?, ?, ?, ?)',
    [content, now, now, tagsJson, col]
  );
  const id = d.exec('SELECT last_insert_rowid() as id')[0].values[0][0];
  saveDb();
  return getNoteById(id);
}

function updateNote(id, content, tags, collection) {
  const d = getDb();
  const now = new Date().toISOString();
  const tagsJson = JSON.stringify(tags || []);
  const col = collection || '全部';
  d.run(
    'UPDATE notes SET content = ?, updated_at = ?, tags = ?, collection = ? WHERE id = ?',
    [content, now, tagsJson, col, id]
  );
  saveDb();
  return getNoteById(id);
}

function deleteNote(id) {
  const d = getDb();
  d.run('DELETE FROM notes WHERE id = ?', [id]);
  saveDb();
}

function getNoteById(id) {
  const d = getDb();
  const stmt = d.prepare('SELECT * FROM notes WHERE id = ?');
  stmt.bind([id]);
  if (stmt.step()) {
    const row = stmt.getAsObject();
    stmt.free();
    return formatNote(row);
  }
  stmt.free();
  return null;
}

function getAllNotes() {
  const d = getDb();
  const results = d.exec('SELECT * FROM notes ORDER BY updated_at DESC');
  if (results.length === 0) return [];
  return results[0].values.map(row => formatNote({
    id: row[0], content: row[1], created_at: row[2], updated_at: row[3], tags: row[4], collection: row[5]
  }));
}

function getNotesByCollection(collection) {
  if (collection === '全部') return getAllNotes();
  const d = getDb();
  const stmt = d.prepare('SELECT * FROM notes WHERE collection = ? ORDER BY updated_at DESC');
  stmt.bind([collection]);
  const notes = [];
  while (stmt.step()) {
    notes.push(formatNote(stmt.getAsObject()));
  }
  stmt.free();
  return notes;
}

function searchNotes(query) {
  const d = getDb();
  const stmt = d.prepare('SELECT * FROM notes WHERE content LIKE ? ORDER BY updated_at DESC');
  stmt.bind([`%${query}%`]);
  const notes = [];
  while (stmt.step()) {
    notes.push(formatNote(stmt.getAsObject()));
  }
  stmt.free();
  return notes;
}

function searchByTags(tags) {
  const allNotes = getAllNotes();
  if (!tags || tags.length === 0) return allNotes;
  return allNotes.filter(note => {
    const noteTags = note.tags || [];
    return tags.some(t => noteTags.includes(t));
  });
}

function searchByTime(start, end) {
  const d = getDb();
  const stmt = d.prepare('SELECT * FROM notes WHERE updated_at >= ? AND updated_at <= ? ORDER BY updated_at DESC');
  stmt.bind([start, end]);
  const notes = [];
  while (stmt.step()) {
    notes.push(formatNote(stmt.getAsObject()));
  }
  stmt.free();
  return notes;
}

function getTimeGroup(group) {
  const now = new Date();
  const end = now.toISOString();
  let start;
  switch (group) {
    case 'today':
      start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      break;
    case 'yesterday': {
      const yesterday = new Date(now);
      yesterday.setDate(yesterday.getDate() - 1);
      start = new Date(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate());
      const ye = new Date(start);
      ye.setDate(ye.getDate() + 1);
      return searchByTime(start.toISOString(), ye.toISOString());
    }
    case 'this_week': {
      const dow = now.getDay();
      const diff = dow === 0 ? 6 : dow - 1;
      start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - diff);
      break;
    }
    default:
      return getAllNotes();
  }
  return searchByTime(start.toISOString(), end);
}

function getNotesByDate(dateStr) {
  const start = new Date(dateStr + 'T00:00:00').toISOString();
  const end = new Date(dateStr + 'T23:59:59.999').toISOString();
  return searchByTime(start, end);
}

function getActiveDates() {
  const d = getDb();
  const results = d.exec("SELECT DISTINCT substr(updated_at, 1, 10) as ds FROM notes ORDER BY ds DESC");
  if (results.length === 0) return [];
  return results[0].values.map(row => row[0]);
}

function getAllTags() {
  const notes = getAllNotes();
  const tagSet = new Set();
  notes.forEach(note => {
    (note.tags || []).forEach(tag => tagSet.add(tag));
  });
  return Array.from(tagSet).sort();
}

function formatNote(row) {
  let tags = [];
  try { tags = JSON.parse(row.tags || '[]'); } catch (e) { tags = []; }
  return {
    id: row.id,
    content: row.content,
    created_at: row.created_at,
    updated_at: row.updated_at,
    tags,
    collection: row.collection || '全部'
  };
}

module.exports = {
  initDatabase,
  createNote, updateNote, deleteNote, getNoteById,
  getAllNotes, getNotesByCollection,
  searchNotes, searchByTags, searchByTime,
  getTimeGroup, getNotesByDate, getActiveDates,
  getAllTags,
  getAllCollections, addCollection, removeCollection, getCollectionCounts
};

