const express = require('express');
const router = express.Router();
const { getDb } = require('../utils/db');
const { auth, adminOnly } = require('../middleware/auth');

// List gers with simple filters
router.get('/', async (req, res) => {
  try {
    const { location, minPrice, maxPrice, capacity } = req.query;
    const filter = {};
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
    res.json(gers);
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
    if (!ger) return res.status(404).json({ message: 'Not found' });
    res.json(ger);
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
    res.status(500).json({ message: 'Server error' });
  }
});

// Admin create
router.post('/', auth, adminOnly, async (req, res) => {
  try {
    const db = getDb();
    const now = new Date().toISOString();
    const stmt = db.prepare(`INSERT INTO gers (title, location, description, pricePerNight, capacity, amenities, images, createdAt, updatedAt)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`);
    const info = stmt.run(
      req.body.title, req.body.location, req.body.description || null, req.body.pricePerNight, req.body.capacity,
      JSON.stringify(req.body.amenities || []), JSON.stringify(req.body.images || []), now, now
    );
    const newGer = db.prepare('SELECT * FROM gers WHERE id = ?').get(info.lastInsertRowid);
    res.status(201).json(newGer);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Admin update
router.put('/:id', auth, adminOnly, async (req, res) => {
  try {
    const db = getDb();
    const now = new Date().toISOString();
    const stmt = db.prepare(`UPDATE gers SET title = ?, location = ?, description = ?, pricePerNight = ?, capacity = ?, amenities = ?, images = ?, updatedAt = ? WHERE id = ?`);
    stmt.run(
      req.body.title, req.body.location, req.body.description || null, req.body.pricePerNight, req.body.capacity,
      JSON.stringify(req.body.amenities || []), JSON.stringify(req.body.images || []), now, req.params.id
    );
    const updated = db.prepare('SELECT * FROM gers WHERE id = ?').get(req.params.id);
    if (!updated) return res.status(404).json({ message: 'Not found' });
    res.json(updated);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Admin delete
router.delete('/:id', auth, adminOnly, async (req, res) => {
  try {
    const db = getDb();
    db.prepare('DELETE FROM gers WHERE id = ?').run(req.params.id);
    res.json({ message: 'Deleted' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
