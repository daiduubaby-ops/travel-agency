const express = require('express');
const router = express.Router();
const { getDb } = require('../utils/db');
const { auth, adminOnly } = require('../middleware/auth');

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
    const booking = db.prepare('SELECT * FROM bookings WHERE id = ?').get(info.lastInsertRowid);
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

// Get booking by id (owner or admin)
router.get('/:id', auth, async (req, res) => {
  try {
    const db = getDb();
    const booking = db.prepare('SELECT b.*, g.title as ger_title, g.location as ger_location FROM bookings b JOIN gers g ON b.gerId = g.id WHERE b.id = ?').get(req.params.id);
    if (!booking) return res.status(404).json({ message: 'Олдсонгүй' });

    // only owner or admin
    if (booking.userId.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Хориотой' });
    }

    res.json(booking);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Серверийн алдаа' });
  }
});

// Admin: get all bookings
router.get('/', auth, adminOnly, async (req, res) => {
  try {
    const db = getDb();
    const bookings = db.prepare('SELECT b.*, g.title as ger_title, u.name as user_name FROM bookings b JOIN gers g ON b.gerId = g.id JOIN users u ON b.userId = u.id').all();
    res.json(bookings);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Cancel booking (user or admin)
router.put('/:id/cancel', auth, async (req, res) => {
  try {
    const db = getDb();
    const booking = db.prepare('SELECT * FROM bookings WHERE id = ?').get(req.params.id);
    if (!booking) return res.status(404).json({ message: 'Олдсонгүй' });

    // Only owner or admin can cancel
    if (booking.userId.toString() !== req.user.id && req.user.role !== 'admin') {
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

// Admin: update booking status
router.put('/:id', auth, adminOnly, async (req, res) => {
  try {
    const { status } = req.body;
    if (!status) return res.status(400).json({ message: 'Стаус дутуу байна' });
    const db = getDb();
    db.prepare('UPDATE bookings SET status = ? WHERE id = ?').run(status, req.params.id);
    const updated = db.prepare('SELECT * FROM bookings WHERE id = ?').get(req.params.id);
    if (!updated) return res.status(404).json({ message: 'Олдсонгүй' });
    res.json(updated);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Серверийн алдаа' });
  }
});

module.exports = router;
