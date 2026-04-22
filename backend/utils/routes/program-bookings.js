const express = require('express');
const router = express.Router();
const { getDb } = require('../db');
const { auth } = require('../../middleware/auth');

// POST /api/program-bookings  -- create a booking for a program (tour)
router.post('/', auth, async (req, res) => {
  try {
    const { programId, checkInDate, checkOutDate } = req.body;
    if (!programId || !checkInDate || !checkOutDate) return res.status(400).json({ message: 'Missing fields' });

    const db = getDb();
    const program = db.prepare('SELECT * FROM programs WHERE id = ?').get(programId);
    if (!program) return res.status(404).json({ message: 'Program not found' });

    const checkIn = new Date(checkInDate);
    const checkOut = new Date(checkOutDate);
    if (isNaN(checkIn) || isNaN(checkOut) || checkIn >= checkOut) return res.status(400).json({ message: 'Invalid dates' });

    const msPerDay = 1000 * 60 * 60 * 24;
    const nights = Math.ceil((checkOut - checkIn) / msPerDay);
    // try to derive numeric price from program.price (stored as string like '25,000₮')
    let numericPrice = 0;
    try { numericPrice = Number(String(program.price).replace(/[^0-9.-]/g, '')) || 0 } catch (e) { numericPrice = 0 }
    const totalPrice = nights * numericPrice;

    const now = new Date().toISOString();
    const info = db.prepare(`INSERT INTO bookings (userId, gerId, programId, checkInDate, checkOutDate, totalPrice, status, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, 'confirmed', ?, ?)`)
      .run(req.user.id, 0, programId, checkIn.toISOString(), checkOut.toISOString(), totalPrice, now, now);
    const booking = db.prepare('SELECT * FROM bookings WHERE id = ?').get(info.lastInsertRowid);
    res.status(201).json(booking);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
