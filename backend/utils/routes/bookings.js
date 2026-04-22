const express = require('express');
const router = express.Router();
const { getDb } = require('../db');
const { auth, adminOnly } = require('../../middleware/auth');

// Create booking
router.post('/', auth, async (req, res) => {
  try {
    const { gerId, checkInDate, checkOutDate } = req.body;
    if (!gerId || !checkInDate || !checkOutDate) return res.status(400).json({ message: 'Missing fields' });

    const checkIn = new Date(checkInDate);
    const checkOut = new Date(checkOutDate);
    if (isNaN(checkIn) || isNaN(checkOut) || checkIn >= checkOut) return res.status(400).json({ message: 'Invalid dates' });

    const db = getDb();
    const ger = db.prepare('SELECT * FROM gers WHERE id = ?').get(gerId);
    if (!ger) return res.status(404).json({ message: 'Гэр олдсонгүй' });

    // Check for conflicting bookings
    const conflicts = db.prepare(`SELECT * FROM bookings WHERE gerId = ? AND status = 'confirmed' AND (
      (checkInDate < ? AND checkOutDate > ?) OR
      (checkInDate >= ? AND checkInDate < ?) OR
      (checkOutDate > ? AND checkOutDate <= ?)
    )`).all(gerId, checkOut.toISOString(), checkIn.toISOString(), checkIn.toISOString(), checkOut.toISOString(), checkIn.toISOString(), checkOut.toISOString());
    if (conflicts.length > 0) return res.status(400).json({ message: 'Сонгосон огноонууд боломжгүй байна' });

    const msPerDay = 1000 * 60 * 60 * 24;
    const nights = Math.ceil((checkOut - checkIn) / msPerDay);
    const totalPrice = nights * ger.pricePerNight;

    const now = new Date().toISOString();
    const info = db.prepare(`INSERT INTO bookings (userId, gerId, checkInDate, checkOutDate, totalPrice, status, createdAt, updatedAt)
      VALUES (?, ?, ?, ?, ?, 'confirmed', ?, ?)`).run(req.user.id, gerId, checkIn.toISOString(), checkOut.toISOString(), totalPrice, now, now);
    // debug log
    try { console.log('bookings POST insert info=', info); } catch (e) {}
    let insertedId = info && info.lastInsertRowid;
    // fallback: try to read last_insert_rowid() from the underlying DB if wrapper didn't return it
    if (!insertedId) {
      try {
        const r = db.exec('SELECT last_insert_rowid() AS id');
        if (r && r[0] && r[0].values && r[0].values[0]) {
          const v = r[0].values[0];
          insertedId = Array.isArray(v) ? v[0] : (v.id ?? Object.values(v)[0]);
        }
      } catch (e) { console.error('failed fallback last_insert_rowid()', e && e.message ? e.message : e); }
    }
    let booking = null;
    try {
      if (insertedId) booking = db.prepare('SELECT * FROM bookings WHERE id = ?').get(insertedId);
    } catch (e) { console.error('Error selecting booking by id', e && e.message ? e.message : e); }

    // If we couldn't retrieve by lastInsertRowid, try a fallback selecting by userId/gerId/createdAt
    if (!booking) {
      try {
        // First try an exact match on createdAt (we used `now` when inserting)
        booking = db.prepare('SELECT * FROM bookings WHERE userId = ? AND gerId = ? AND createdAt = ? ORDER BY id DESC LIMIT 1').get(req.user.id, gerId, now);
      } catch (e) { console.error('Fallback exact select failed', e && e.message ? e.message : e); }
    }

    if (!booking) {
      try {
        // Try a small time window around now in case of millisecond differences
        const plus = new Date(new Date(now).getTime() + 5000).toISOString();
        const minus = new Date(new Date(now).getTime() - 5000).toISOString();
        booking = db.prepare('SELECT * FROM bookings WHERE userId = ? AND gerId = ? AND createdAt BETWEEN ? AND ? ORDER BY id DESC LIMIT 1').get(req.user.id, gerId, minus, plus);
      } catch (e) { console.error('Fallback range select failed', e && e.message ? e.message : e); }
    }

    if (!booking) {
      console.error('Insert completed but could not read back booking. insertInfo=', info);
      return res.status(201).json({ ok: true });
    }

    res.status(201).json(booking);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Серверийн алдаа' });
  }
});

// Get my bookings
router.get('/my', auth, async (req, res) => {
  try {
    const db = getDb();
    const bookings = db.prepare('SELECT b.*, g.title as ger_title, g.location as ger_location FROM bookings b JOIN gers g ON b.gerId = g.id WHERE userId = ?').all(req.user.id);
    res.json(bookings);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get booking by id (owner only)
router.get('/:id', auth, async (req, res) => {
  try {
    const db = getDb();
    const booking = db.prepare('SELECT b.*, g.title as ger_title, g.location as ger_location FROM bookings b JOIN gers g ON b.gerId = g.id WHERE b.id = ?').get(req.params.id);
    if (!booking) return res.status(404).json({ message: 'Олдсонгүй' });

    // only owner
    if (booking.userId.toString() !== req.user.id.toString()) {
      return res.status(403).json({ message: 'Хориотой' });
    }

    res.json(booking);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Серверийн алдаа' });
  }
});

// Cancel booking (owner only)
router.put('/:id/cancel', auth, async (req, res) => {
  try {
    const db = getDb();
    const booking = db.prepare('SELECT * FROM bookings WHERE id = ?').get(req.params.id);
    if (!booking) return res.status(404).json({ message: 'Олдсонгүй' });

    // Only owner can cancel
    if (booking.userId.toString() !== req.user.id.toString()) {
      return res.status(403).json({ message: 'Хориотой' });
    }

    db.prepare('UPDATE bookings SET status = ? WHERE id = ?').run('cancelled', req.params.id);
    const updated = db.prepare('SELECT * FROM bookings WHERE id = ?').get(req.params.id);
    res.json(updated);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Серверийн алдаа' });
  }
});

module.exports = router;
