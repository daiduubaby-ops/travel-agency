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
    let hasAvatar = false;
    let hasEmailHmac = false;
    if (pragma && pragma[0] && pragma[0].values) {
      const cols = pragma[0].columns || [];
      const nameIdx = cols.indexOf('name');
      for (const row of pragma[0].values) {
        if (row[nameIdx] === 'isAdmin') { hasIsAdmin = true; }
        if (row[nameIdx] === 'avatar') { hasAvatar = true; }
        if (row[nameIdx] === 'email_hmac') { hasEmailHmac = true; }
        if (hasIsAdmin && hasAvatar) break;
      }
    }
    if (!hasIsAdmin) {
      // add column with default 0 for existing rows
      db.run('ALTER TABLE users ADD COLUMN isAdmin INTEGER NOT NULL DEFAULT 0;');
    }
    if (!hasAvatar) {
      try { db.run("ALTER TABLE users ADD COLUMN avatar TEXT;"); } catch (e) { /* ignore if table missing */ }
    }
    if (!hasEmailHmac) {
      try { db.run("ALTER TABLE users ADD COLUMN email_hmac TEXT;"); } catch (e) { /* ignore if table missing */ }
    }
  } catch (e) {
    // ignore — if users table doesn't exist yet or PRAGMA fails, creation below will handle it
  }

  // Ensure programs table has an 'images' column for storing JSON array of image URLs
  try {
    const pragmaProg = db.exec("PRAGMA table_info('programs');");
    let hasImages = false;
    const progColsToEnsure = ['duration','capacity','accommodation','transport','cancellation','nights','language','phone'];
    let missingProgCols = [];
    if (pragmaProg && pragmaProg[0] && pragmaProg[0].values) {
      const cols = pragmaProg[0].columns || [];
      const nameIdx = cols.indexOf('name');
      const existing = new Set();
      for (const row of pragmaProg[0].values) {
        existing.add(row[nameIdx])
        if (row[nameIdx] === 'images') { hasImages = true; }
      }
      for (const c of progColsToEnsure) if (!existing.has(c)) missingProgCols.push(c)
    }
    if (!hasImages) {
      // if the table exists but is missing images column, add it
      try { db.run('ALTER TABLE programs ADD COLUMN images TEXT;'); } catch (e) { /* ignore if table missing */ }
    }
    // add any missing program columns
    for (const c of missingProgCols) {
      try { db.run(`ALTER TABLE programs ADD COLUMN ${c} TEXT;`); } catch (e) { /* ignore */ }
    }
  } catch (e) {
    // ignore
  }

  // ensure tables
  db.run(`CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    email_hmac TEXT UNIQUE,
    password TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'user',
    isAdmin INTEGER NOT NULL DEFAULT 0,
    avatar TEXT,
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
    images TEXT,
    createdAt TEXT,
    updatedAt TEXT
  );`);

  // news table for admin-managed news/articles
  db.run(`CREATE TABLE IF NOT EXISTS news (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    img TEXT,
    date TEXT,
    desc TEXT,
    createdAt TEXT,
    updatedAt TEXT
  );`);

  // features table: items shown on the Landing page under "Таны амралтыг онцгой болгох шалтгаанууд"
  db.run(`CREATE TABLE IF NOT EXISTS features (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    lead TEXT,
    description TEXT,
    image TEXT,
    sortOrder INTEGER DEFAULT 0,
    createdAt TEXT,
    updatedAt TEXT
  );`);

  // generic key-value settings table for small admin-managed UI settings
  db.run(`CREATE TABLE IF NOT EXISTS settings (
    key TEXT PRIMARY KEY,
    value TEXT,
    updatedAt TEXT
  );`);

  // home service bookings (no payment-related fields)
  db.run(`CREATE TABLE IF NOT EXISTS home_bookings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    patient_name TEXT NOT NULL,
    phone TEXT NOT NULL,
    service_id TEXT NOT NULL,
    address_text TEXT NOT NULL,
    latitude REAL,
    longitude REAL,
    preferred_date TEXT NOT NULL,
    preferred_time TEXT NOT NULL,
    assigned_doctor_id TEXT,
    status TEXT NOT NULL DEFAULT 'pending',
    admin_note TEXT,
    created_at TEXT,
    updated_at TEXT
  );`);

  // persist in case created
  persist();

  // Ensure bookings table has a programId column to store program/bookings
  try {
    const pragmaBookings = db.exec("PRAGMA table_info('bookings');");
    let hasProgramId = false;
    if (pragmaBookings && pragmaBookings[0] && pragmaBookings[0].values) {
      const cols = pragmaBookings[0].columns || [];
      const nameIdx = cols.indexOf('name');
      for (const row of pragmaBookings[0].values) {
        if (row[nameIdx] === 'programId') { hasProgramId = true; break; }
      }
    }
    if (!hasProgramId) {
      try { db.run('ALTER TABLE bookings ADD COLUMN programId INTEGER;'); } catch (e) { /* ignore if table missing */ }
    }
  } catch (e) {
    // ignore
  }
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
          // persist DB after statement execution
          persist();
          // get last insert id (be tolerant to sql.js return shapes)
          try {
            const res = db.exec('SELECT last_insert_rowid() AS id');
            let id;
            if (res && res[0] && res[0].values && res[0].values[0]) {
              // values[0] may be an array of column values
              const firstRow = res[0].values[0];
              if (Array.isArray(firstRow)) id = firstRow[0];
              else if (typeof firstRow === 'object') id = firstRow.id ?? Object.values(firstRow)[0];
              else id = firstRow;
            }
            // coerce to number when possible
            if (id !== undefined && id !== null) {
              const nid = Number(id);
              return { lastInsertRowid: Number.isFinite(nid) ? nid : id };
            }
            return { lastInsertRowid: undefined };
          } catch (e) {
            // in case last_insert_rowid() is not available or exec fails, return undefined
            console.error('Failed to read last_insert_rowid()', e && e.message ? e.message : e);
            return { lastInsertRowid: undefined };
          }
        }
      };
    },
    exec(sql) { return db.exec(sql); },
    export() { return db.export(); }
  };
}

module.exports = { init, getWrapper };
