// db/sql.js - unified DB wrapper

const fs = require('fs');
const path = require('path');

const dbPath = path.join(__dirname, '..', 'data', 'gercamp.db');

const SCHEMA_SQL = `PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS users (
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
  status TEXT NOT NULL DEFAULT 'pending',
  createdAt TEXT,
  updatedAt TEXT,
  programId INTEGER
);

CREATE TABLE IF NOT EXISTS programs (
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
);

CREATE TABLE IF NOT EXISTS news (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  img TEXT,
  date TEXT,
  desc TEXT,
  createdAt TEXT,
  updatedAt TEXT
);

CREATE TABLE IF NOT EXISTS features (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  lead TEXT,
  description TEXT,
  image TEXT,
  sortOrder INTEGER DEFAULT 0,
  createdAt TEXT,
  updatedAt TEXT
);

CREATE TABLE IF NOT EXISTS settings (
  key TEXT PRIMARY KEY,
  value TEXT,
  updatedAt TEXT
);

CREATE TABLE IF NOT EXISTS home_bookings (
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
);
`;

const DEFAULT_GERS = [
  {
    title: 'Цомцог гэр 1',
    location: 'Terelj',
    description: 'Залуу хосууд болон 2 хүний амралтад зориулсан тухтай, дулаахан цомцог гэр.',
    pricePerNight: 250000,
    capacity: 2,
    amenities: ['heating', 'meals', 'wifi'],
    images: []
  },
  {
    title: 'Цомцог гэр 2',
    location: 'Terelj',
    description: 'Гэр бүл болон найз нөхдөөрөө амрахад тохиромжтой тухтай цомцог гэр.',
    pricePerNight: 250000,
    capacity: 4,
    amenities: ['heating', 'meals', 'parking'],
    images: []
  }
];

function ensureDir() {
  fs.mkdirSync(path.dirname(dbPath), { recursive: true });
}

function seedDefaultGersNative(db) {
  const now = new Date().toISOString();

  for (const ger of DEFAULT_GERS) {
    const existing = db.prepare('SELECT id FROM gers WHERE title = ?').get(ger.title);

    if (!existing) {
      db.prepare(`
        INSERT INTO gers (
          title,
          location,
          description,
          pricePerNight,
          capacity,
          amenities,
          images,
          createdAt,
          updatedAt
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        ger.title,
        ger.location,
        ger.description,
        ger.pricePerNight,
        ger.capacity,
        JSON.stringify(ger.amenities),
        JSON.stringify(ger.images),
        now,
        now
      );
    }
  }
}

function seedDefaultGersSqlJs(db) {
  const now = new Date().toISOString();

  for (const ger of DEFAULT_GERS) {
    const safeTitle = ger.title.replace(/'/g, "''");
    const found = db.exec(`SELECT id FROM gers WHERE title = '${safeTitle}'`);
    const exists = found && found[0] && found[0].values && found[0].values.length > 0;

    if (!exists) {
      db.run(
        `
        INSERT INTO gers (
          title,
          location,
          description,
          pricePerNight,
          capacity,
          amenities,
          images,
          createdAt,
          updatedAt
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `,
        [
          ger.title,
          ger.location,
          ger.description,
          ger.pricePerNight,
          ger.capacity,
          JSON.stringify(ger.amenities),
          JSON.stringify(ger.images),
          now,
          now
        ]
      );
    }
  }
}

let usingNative = false;
let nativeDb = null;
let sqljsModule = null;
let sqljsDb = null;

async function init() {
  ensureDir();

  try {
    const Database = require('better-sqlite3');

    nativeDb = new Database(dbPath);
    nativeDb.exec(SCHEMA_SQL);

    seedDefaultGersNative(nativeDb);

    usingNative = true;
    console.log('Using native better-sqlite3 for SQLite persistence');
    return Promise.resolve();
  } catch (e) {
    console.warn(
      'better-sqlite3 not available, falling back to sql.js (in-memory + export).',
      e && e.message ? e.message : e
    );
  }

  try {
    sqljsModule = require('sql.js');
  } catch (e) {
    throw new Error('No usable sqlite driver found: install either better-sqlite3 or sql.js');
  }

  const initSqlJs = sqljsModule;

  if (typeof initSqlJs === 'function') {
    const SQL = await initSqlJs();

    sqljsDb = fs.existsSync(dbPath)
      ? new SQL.Database(new Uint8Array(fs.readFileSync(dbPath)))
      : new SQL.Database();

    sqljsDb.run(SCHEMA_SQL);

    seedDefaultGersSqlJs(sqljsDb);
    persistSqlJs();

    process.once('exit', () => {
      try {
        persistSqlJs();
      } catch (e) {}
    });

    process.once('SIGINT', () => {
      try {
        persistSqlJs();
      } catch (e) {}
      process.exit(0);
    });

    console.log('Using sql.js fallback for SQLite (in-memory with disk export)');
    return Promise.resolve();
  }

  throw new Error('Unsupported sql.js loader');
}

function persistSqlJs() {
  try {
    if (!sqljsDb) return;

    const data = sqljsDb.export();
    const buffer = Buffer.from(data);
    const tmp = dbPath + '.tmp';

    fs.writeFileSync(tmp, buffer);
    fs.renameSync(tmp, dbPath);

    try {
      console.log(`sql.js DB persisted to ${dbPath} (${buffer.length} bytes)`);
    } catch (e) {}
  } catch (e) {
    console.error('Failed to persist sql.js DB', e && e.message ? e.message : e);
  }
}

function getWrapper() {
  if (usingNative) {
    return {
      prepare(sql) {
        const stmt = nativeDb.prepare(sql);

        return {
          all(...params) {
            return stmt.all(...params);
          },

          get(...params) {
            return stmt.get(...params);
          },

          run(...params) {
            const info = stmt.run(...params);

            return {
              lastInsertRowid: info && info.lastInsertRowid ? info.lastInsertRowid : undefined
            };
          }
        };
      },

      exec(sql) {
        return nativeDb.exec(sql);
      },

      export() {
        throw new Error('export not supported for native sqlite');
      }
    };
  }

  return {
    prepare(sql) {
      const stmt = sqljsDb.prepare(sql);

      return {
        all(...params) {
          stmt.bind(params);

          const rows = [];

          while (stmt.step()) {
            rows.push(stmt.getAsObject());
          }

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

          try {
            persistSqlJs();
          } catch (e) {
            console.error('persist failed', e && e.message ? e.message : e);
          }

          try {
            const res = sqljsDb.exec('SELECT last_insert_rowid() AS id');

            let id;

            if (res && res[0] && res[0].values && res[0].values[0]) {
              const firstRow = res[0].values[0];

              if (Array.isArray(firstRow)) {
                id = firstRow[0];
              } else if (typeof firstRow === 'object') {
                id = firstRow.id ?? Object.values(firstRow)[0];
              } else {
                id = firstRow;
              }
            }

            if (id !== undefined && id !== null) {
              const nid = Number(id);

              return {
                lastInsertRowid: Number.isFinite(nid) ? nid : id
              };
            }

            return {
              lastInsertRowid: undefined
            };
          } catch (e) {
            console.error('Failed to read last_insert_rowid()', e && e.message ? e.message : e);

            return {
              lastInsertRowid: undefined
            };
          }
        }
      };
    },

    exec(sql) {
      return sqljsDb.exec(sql);
    },

    export() {
      return sqljsDb.export();
    }
  };
}

module.exports = {
  init,
  getWrapper
};