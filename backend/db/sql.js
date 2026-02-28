const initSqlJs = require('sql.js');
const fs = require('fs');
const path = require('path');

const dbPath = path.join(__dirname, '..', 'data', 'gercamp.db');
let SQL = null;
let db = null;

function persist() {
  try {
    const buffer = Buffer.from(db.export());
    fs.mkdirSync(path.dirname(dbPath), { recursive: true });
    fs.writeFileSync(dbPath, buffer);
  } catch (e) {
    console.error('Failed to persist sqlite db', e);
  }
}

async function init() {
  SQL = await initSqlJs();
  // load existing DB file if present
  if (fs.existsSync(dbPath)) {
    const filebuffer = fs.readFileSync(dbPath);
    db = new SQL.Database(new Uint8Array(filebuffer));
  } else {
    db = new SQL.Database();
  }

  // If DB existed previously it might not have the new isAdmin column.
  // Check and add the column if missing to support upgrades.
  try {
    const pragma = db.exec("PRAGMA table_info('users');");
    let hasIsAdmin = false;
    if (pragma && pragma[0] && pragma[0].values) {
      const cols = pragma[0].columns || [];
      const nameIdx = cols.indexOf('name');
      for (const row of pragma[0].values) {
        if (row[nameIdx] === 'isAdmin') { hasIsAdmin = true; break; }
      }
    }
    if (!hasIsAdmin) {
      // add column with default 0 for existing rows
      db.run('ALTER TABLE users ADD COLUMN isAdmin INTEGER NOT NULL DEFAULT 0;');
    }
  } catch (e) {
    // ignore — if users table doesn't exist yet or PRAGMA fails, creation below will handle it
  }

  // ensure tables
  db.run(`CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    password TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'user',
    isAdmin INTEGER NOT NULL DEFAULT 0,
    createdAt TEXT,
    updatedAt TEXT
  );
  CREATE TABLE IF NOT EXISTS gers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    location TEXT NOT NULL,
    description TEXT,
    pricePerNight REAL NOT NULL,
    capacity INTEGER NOT NULL,
    amenities TEXT,
    images TEXT,
    createdAt TEXT,
    updatedAt TEXT
  );
  CREATE TABLE IF NOT EXISTS bookings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    userId INTEGER NOT NULL,
    gerId INTEGER NOT NULL,
    checkInDate TEXT NOT NULL,
    checkOutDate TEXT NOT NULL,
    totalPrice REAL NOT NULL,
    status TEXT NOT NULL DEFAULT 'confirmed',
    createdAt TEXT,
    updatedAt TEXT
  );`);

  // programs table stores multi-day program definitions. 'days' is JSON text.
  db.run(`CREATE TABLE IF NOT EXISTS programs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    time TEXT,
    location TEXT,
    price TEXT,
    age TEXT,
    days TEXT,
    createdAt TEXT,
    updatedAt TEXT
  );`);

  // persist in case created
  persist();
}

function getWrapper() {
  if (!db) throw new Error('DB not initialized');
  return {
    prepare(sql) {
      const stmt = db.prepare(sql);
      return {
        all(...params) {
          stmt.bind(params);
          const rows = [];
          while (stmt.step()) rows.push(stmt.getAsObject());
          stmt.free();
          return rows;
        },
        get(...params) {
          stmt.bind(params);
          const row = stmt.step() ? stmt.getAsObject() : undefined;
          stmt.free();
          return row;
        },
        run(...params) {
          stmt.bind(params);
          stmt.run();
          stmt.free();
          persist();
          // get last insert id
          const res = db.exec('SELECT last_insert_rowid() AS id');
          const id = (res && res[0] && res[0].values && res[0].values[0]) ? res[0].values[0][0] : undefined;
          return { lastInsertRowid: id };
        }
      };
    },
    exec(sql) { return db.exec(sql); },
    export() { return db.export(); }
  };
}

module.exports = { init, getWrapper };
