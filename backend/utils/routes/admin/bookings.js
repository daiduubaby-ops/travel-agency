const express = require('express');
const router = express.Router();
const { getDb } = require('../../db');
const { auth, adminOnly } = require('../../../middleware/auth');

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
    // Use LEFT JOIN so bookings that reference non-DB items (eg. client-side/sample program bookings)
    // still appear in the admin listing. Also include ger location when available.
    const bookings = db.prepare('SELECT b.*, g.title as ger_title, g.location as ger_location, p.title as program_title, u.name as user_name FROM bookings b LEFT JOIN gers g ON b.gerId = g.id LEFT JOIN programs p ON b.programId = p.id LEFT JOIN users u ON b.userId = u.id ORDER BY b.createdAt DESC').all();
    // decrypt any user fields included from users table
    const out = bookings.map(b => Object.assign({}, b, { user_name: b.user_name ? decrypt(b.user_name) : b.user_name }));
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
    // Use LEFT JOIN so an individual booking is still returned even if the referenced ger row
    // does not exist (for example client-side program/sample bookings). User fields remain
    // left-joined as well so admin can still inspect booking rows.
    const booking = db.prepare('SELECT b.*, g.title as ger_title, g.location as ger_location, p.title as program_title, u.name as user_name, u.email as user_email FROM bookings b LEFT JOIN gers g ON b.gerId = g.id LEFT JOIN programs p ON b.programId = p.id LEFT JOIN users u ON b.userId = u.id WHERE b.id = ?').get(req.params.id);
    if (!booking) return res.status(404).json({ message: 'Олдсонгүй' });
    // decrypt user fields
    if (booking.user_name) booking.user_name = decrypt(booking.user_name);
    if (booking.user_email) booking.user_email = decrypt(booking.user_email);
    res.json(booking);
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
    db.prepare('UPDATE bookings SET status = ? WHERE id = ?').run(status, req.params.id);
    const updated = db.prepare('SELECT * FROM bookings WHERE id = ?').get(req.params.id);
    if (!updated) return res.status(404).json({ message: 'Олдсонгүй' });
    res.json(updated);
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
    const booking = db.prepare('SELECT * FROM bookings WHERE id = ?').get(req.params.id);
    if (!booking) return res.status(404).json({ message: 'Олдсонгүй' });

    db.prepare('UPDATE bookings SET status = ? WHERE id = ?').run('cancelled', req.params.id);
    const updated = db.prepare('SELECT * FROM bookings WHERE id = ?').get(req.params.id);
    res.json(updated);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Серверийн алдаа' });
  }
});

module.exports = router;
