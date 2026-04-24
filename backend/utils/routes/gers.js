const express = require('express');
const router = express.Router();
const { getDb } = require('../db');
const { auth, adminOnly } = require('../../middleware/auth');

function asStringArray(value) {
  if (Array.isArray(value)) {
    return value.map(v => String(v).trim()).filter(Boolean);
  }

  if (typeof value === 'string') {
    const raw = value.trim();
    if (!raw) return [];

    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed.map(v => String(v).trim()).filter(Boolean);
      if (typeof parsed === 'string') return parsed.split(',').map(v => v.trim()).filter(Boolean);
      return [];
    } catch (e) {
      return raw.split(',').map(v => v.trim()).filter(Boolean);
    }
  }

  return [];
}

function asImagesArray(value) {
  if (Array.isArray(value)) {
    return value.map(v => String(v).trim()).filter(Boolean);
  }
  if (typeof value === 'string') {
    const raw = value.trim();
    if (!raw) return [];
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed.map(v => String(v).trim()).filter(Boolean);
      if (typeof parsed === 'string') return parsed ? [parsed] : [];
      return [];
    } catch (e) {
      return [raw];
    }
  }
  return [];
}

function normalizeGerRow(ger) {
  if (!ger) return ger;

  const row = { ...ger };
  row.images = asImagesArray(row.images);
  row.amenities = asStringArray(row.amenities);
  row.pricePerNight = Number(row.pricePerNight || 0);
  row.capacity = Number(row.capacity || 0);
  return row;
}

// List gers with simple filters
router.get('/', async (req, res) => {
  try {
    const { location, minPrice, maxPrice, capacity } = req.query;
    // build basic query
    let sql = 'SELECT * FROM gers WHERE 1=1';
    const params = [];
    if (location) { sql += ' AND location LIKE ?'; params.push(`%${location}%`); }
    if (minPrice) { sql += ' AND pricePerNight >= ?'; params.push(Number(minPrice)); }
    if (maxPrice) { sql += ' AND pricePerNight <= ?'; params.push(Number(maxPrice)); }
    if (capacity) { sql += ' AND capacity >= ?'; params.push(Number(capacity)); }

    const db = getDb();
    const stmt = db.prepare(sql);
    const gers = stmt.all(...params);

    const normalized = gers.map(normalizeGerRow)

    res.json(normalized);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get single ger
router.get('/:id', async (req, res) => {
  try {
    const db = getDb();
    const stmt = db.prepare('SELECT * FROM gers WHERE id = ?');
    const ger = stmt.get(req.params.id);
    if (!ger) return res.status(404).json({ message: 'Олдсонгүй' });
    res.json(normalizeGerRow(ger));
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get bookings for a specific ger (public) - used to show availability on frontend
router.get('/:id/bookings', async (req, res) => {
  try {
    const db = getDb();
    const stmt = db.prepare("SELECT * FROM bookings WHERE gerId = ? AND status = 'confirmed'");
    const bookings = stmt.all(req.params.id);
    res.json(bookings);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Серверийн алдаа' });
  }
});

// Admin create
router.post('/', auth, adminOnly, async (req, res) => {
  try {
    const db = getDb();
    const now = new Date().toISOString();

    const title = String(req.body.title || '').trim();
    const location = String(req.body.location || '').trim();
    const pricePerNight = Number(req.body.pricePerNight);
    const capacity = Number(req.body.capacity);

    if (!title || !location || !Number.isFinite(pricePerNight) || pricePerNight <= 0 || !Number.isFinite(capacity) || capacity <= 0) {
      return res.status(400).json({ message: 'Нэр, байршил, үнэ, багтаамж буруу байна' });
    }

    const amenities = asStringArray(req.body.amenities);
    const images = asImagesArray(req.body.images);

    const stmt = db.prepare(`INSERT INTO gers (title, location, description, pricePerNight, capacity, amenities, images, createdAt, updatedAt)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`);
    const info = stmt.run(
      title,
      location,
      req.body.description ? String(req.body.description) : null,
      pricePerNight,
      capacity,
      JSON.stringify(amenities),
      JSON.stringify(images),
      now,
      now
    );
    const newGer = db.prepare('SELECT * FROM gers WHERE id = ?').get(info.lastInsertRowid);
    res.status(201).json(normalizeGerRow(newGer));
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Серверийн алдаа' });
  }
});

// Admin update
router.put('/:id', auth, adminOnly, async (req, res) => {
  try {
    const db = getDb();
    const existing = db.prepare('SELECT * FROM gers WHERE id = ?').get(req.params.id);
    if (!existing) return res.status(404).json({ message: 'Олдсонгүй' });

    const parsedExisting = normalizeGerRow(existing);

    const nextTitle = req.body.title !== undefined ? String(req.body.title || '').trim() : parsedExisting.title;
    const nextLocation = req.body.location !== undefined ? String(req.body.location || '').trim() : parsedExisting.location;
    const nextDescription = req.body.description !== undefined
      ? (req.body.description ? String(req.body.description) : null)
      : (parsedExisting.description || null);
    const nextPriceRaw = req.body.pricePerNight !== undefined ? Number(req.body.pricePerNight) : Number(parsedExisting.pricePerNight);
    const nextCapacityRaw = req.body.capacity !== undefined ? Number(req.body.capacity) : Number(parsedExisting.capacity);

    if (!nextTitle || !nextLocation || !Number.isFinite(nextPriceRaw) || nextPriceRaw <= 0 || !Number.isFinite(nextCapacityRaw) || nextCapacityRaw <= 0) {
      return res.status(400).json({ message: 'Шинэчлэх мэдээлэл буруу байна' });
    }

    const nextAmenities = req.body.amenities !== undefined
      ? asStringArray(req.body.amenities)
      : asStringArray(parsedExisting.amenities);
    const nextImages = req.body.images !== undefined
      ? asImagesArray(req.body.images)
      : asImagesArray(parsedExisting.images);

    const now = new Date().toISOString();
    const stmt = db.prepare(`UPDATE gers SET title = ?, location = ?, description = ?, pricePerNight = ?, capacity = ?, amenities = ?, images = ?, updatedAt = ? WHERE id = ?`);
    stmt.run(
      nextTitle,
      nextLocation,
      nextDescription,
      nextPriceRaw,
      nextCapacityRaw,
      JSON.stringify(nextAmenities),
      JSON.stringify(nextImages),
      now,
      req.params.id
    );
    const updated = db.prepare('SELECT * FROM gers WHERE id = ?').get(req.params.id);
    res.json(normalizeGerRow(updated));
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Серверийн алдаа' });
  }
});

// Admin delete
router.delete('/:id', auth, adminOnly, async (req, res) => {
  try {
    const db = getDb();
    db.prepare('DELETE FROM gers WHERE id = ?').run(req.params.id);
    res.json({ message: 'Устгагдлаа' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Серверийн алдаа' });
  }
});

module.exports = router;
