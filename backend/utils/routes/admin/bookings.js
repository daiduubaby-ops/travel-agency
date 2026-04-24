const express = require('express');
const router = express.Router();
const { getDb } = require('../../db');
const { auth, adminOnly } = require('../../../middleware/auth');

function selectBookingById(db, id) {
  return db.prepare(`
    SELECT
      b.*,
      g.title AS ger_title,
      g.location AS ger_location,
      g.capacity AS ger_capacity,
      p.title AS program_title,
      p.capacity AS program_capacity,
      u.name AS user_name,
      u.email AS user_email
    FROM bookings b
    LEFT JOIN gers g ON b.gerId = g.id
    LEFT JOIN programs p ON b.programId = p.id
    LEFT JOIN users u ON b.userId = u.id
    WHERE b.id = ?
  `).get(id);
}

function decryptBookingRow(row, decrypt) {
  if (!row) return row;
  const out = { ...row };
  if (out.user_name) out.user_name = decrypt(out.user_name);
  if (out.user_email) out.user_email = decrypt(out.user_email);
  return out;
}

// All admin routes in this file require auth and adminOnly
router.use(auth, adminOnly);

/**
 * @route   GET /api/admin/bookings
 * @desc    Get all bookings
 * @access  Admin
 */
router.get('/', async (req, res) => {
  try {
    const db = getDb();
    const { decrypt } = require('../../../utils/crypto');
    const bookings = db.prepare(`
      SELECT
        b.*,
        g.title AS ger_title,
        g.location AS ger_location,
        g.capacity AS ger_capacity,
        p.title AS program_title,
        p.capacity AS program_capacity,
        u.name AS user_name,
        u.email AS user_email
      FROM bookings b
      LEFT JOIN gers g ON b.gerId = g.id
      LEFT JOIN programs p ON b.programId = p.id
      LEFT JOIN users u ON b.userId = u.id
      ORDER BY b.createdAt DESC
    `).all();
    const out = bookings.map((b) => decryptBookingRow(b, decrypt));
    res.json(out);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * @route   GET /api/admin/bookings/:id
 * @desc    Get single booking
 * @access  Admin
 */
router.get('/:id', async (req, res) => {
  try {
    const db = getDb();
    const { decrypt } = require('../../../utils/crypto');
    const booking = selectBookingById(db, req.params.id);
    if (!booking) return res.status(404).json({ message: 'Олдсонгүй' });
    res.json(decryptBookingRow(booking, decrypt));
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Серверийн алдаа' });
  }
});

/**
 * @route   PUT /api/admin/bookings/:id
 * @desc    Update booking status
 * @access  Admin
 */
router.put('/:id', async (req, res) => {
  try {
    const { status } = req.body;
    if (!status) return res.status(400).json({ message: 'Статус дутуу байна' });
    const db = getDb();
    const { decrypt } = require('../../../utils/crypto');
    db.prepare('UPDATE bookings SET status = ? WHERE id = ?').run(status, req.params.id);
    const updated = selectBookingById(db, req.params.id);
    if (!updated) return res.status(404).json({ message: 'Олдсонгүй' });
    res.json(decryptBookingRow(updated, decrypt));
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Серверийн алдаа' });
  }
});

/**
 * @route   PUT /api/admin/bookings/:id/cancel
 * @desc    Cancel booking
 * @access  Admin
 */
router.put('/:id/cancel', async (req, res) => {
  try {
    const db = getDb();
    const { decrypt } = require('../../../utils/crypto');
    const booking = db.prepare('SELECT * FROM bookings WHERE id = ?').get(req.params.id);
    if (!booking) return res.status(404).json({ message: 'Олдсонгүй' });

    db.prepare('UPDATE bookings SET status = ? WHERE id = ?').run('cancelled', req.params.id);
    const updated = selectBookingById(db, req.params.id);
    res.json(decryptBookingRow(updated, decrypt));
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Серверийн алдаа' });
  }
});

module.exports = router;
