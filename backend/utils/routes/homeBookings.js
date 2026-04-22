const express = require('express');
const router = express.Router();
const { getDb } = require('../db');
const { auth, adminOnly } = require('../../middleware/auth');

const ALLOWED_STATUSES = ['pending', 'confirmed', 'on_the_way', 'completed', 'cancelled'];

function toBookingCode(id) {
  return `HB-${String(id).padStart(6, '0')}`;
}

function parseBookingId(raw) {
  if (!raw) return NaN;
  if (/^HB-\d+$/i.test(raw)) return Number(raw.split('-')[1]);
  return Number(raw);
}

function mapRow(row) {
  if (!row) return row;
  return {
    ...row,
    booking_number: toBookingCode(row.id),
  };
}

// POST /api/home-bookings
router.post('/home-bookings', async (req, res) => {
  try {
    const {
      patient_name,
      phone,
      service_id,
      address_text,
      latitude,
      longitude,
      preferred_date,
      preferred_time,
      additional_note,
    } = req.body || {};

    if (!patient_name || !phone || !service_id || !address_text || !preferred_date || !preferred_time) {
      return res.status(400).json({ message: 'Шаардлагатай талбарууд дутуу байна' });
    }

    const db = getDb();
    const now = new Date().toISOString();
    const finalAddress = additional_note
      ? `${address_text}\nТайлбар: ${String(additional_note).trim()}`
      : address_text;

    const info = db.prepare(`
      INSERT INTO home_bookings (
        patient_name, phone, service_id, address_text, latitude, longitude,
        preferred_date, preferred_time, assigned_doctor_id, status, admin_note, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      patient_name,
      phone,
      service_id,
      finalAddress,
      latitude || null,
      longitude || null,
      preferred_date,
      preferred_time,
      null,
      'pending',
      null,
      now,
      now,
    );

    const created = db.prepare('SELECT * FROM home_bookings WHERE id = ?').get(info.lastInsertRowid);
    res.status(201).json(mapRow(created));
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Серверийн алдаа' });
  }
});

// GET /api/home-bookings/:id (public lookup by id or booking number)
router.get('/home-bookings/:id', async (req, res) => {
  try {
    const id = parseBookingId(req.params.id);
    if (!Number.isFinite(id) || id <= 0) {
      return res.status(400).json({ message: 'Захиалгын дугаар буруу байна' });
    }

    const db = getDb();
    const row = db.prepare('SELECT * FROM home_bookings WHERE id = ?').get(id);
    if (!row) return res.status(404).json({ message: 'Захиалга олдсонгүй' });
    res.json(mapRow(row));
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Серверийн алдаа' });
  }
});

// GET /api/admin/home-bookings
router.get('/admin/home-bookings', auth, adminOnly, async (req, res) => {
  try {
    const db = getDb();
    const rows = db.prepare('SELECT * FROM home_bookings ORDER BY id DESC').all();
    res.json(rows.map(mapRow));
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Серверийн алдаа' });
  }
});

// PATCH /api/admin/home-bookings/:id/status
router.patch('/admin/home-bookings/:id/status', auth, adminOnly, async (req, res) => {
  try {
    const id = parseBookingId(req.params.id);
    const { status, admin_note } = req.body || {};

    if (!ALLOWED_STATUSES.includes(status)) {
      return res.status(400).json({ message: 'Төлөв буруу байна' });
    }

    const db = getDb();
    const existing = db.prepare('SELECT * FROM home_bookings WHERE id = ?').get(id);
    if (!existing) return res.status(404).json({ message: 'Захиалга олдсонгүй' });

    const now = new Date().toISOString();
    db.prepare('UPDATE home_bookings SET status = ?, admin_note = ?, updated_at = ? WHERE id = ?').run(
      status,
      typeof admin_note === 'string' ? admin_note : existing.admin_note,
      now,
      id,
    );

    const updated = db.prepare('SELECT * FROM home_bookings WHERE id = ?').get(id);
    res.json(mapRow(updated));
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Серверийн алдаа' });
  }
});

// PATCH /api/admin/home-bookings/:id/assign-doctor
router.patch('/admin/home-bookings/:id/assign-doctor', auth, adminOnly, async (req, res) => {
  try {
    const id = parseBookingId(req.params.id);
    const { assigned_doctor_id, admin_note } = req.body || {};
    if (!assigned_doctor_id) return res.status(400).json({ message: 'Эмчийн мэдээлэл дутуу байна' });

    const db = getDb();
    const existing = db.prepare('SELECT * FROM home_bookings WHERE id = ?').get(id);
    if (!existing) return res.status(404).json({ message: 'Захиалга олдсонгүй' });

    const now = new Date().toISOString();
    db.prepare('UPDATE home_bookings SET assigned_doctor_id = ?, admin_note = ?, updated_at = ? WHERE id = ?').run(
      String(assigned_doctor_id),
      typeof admin_note === 'string' ? admin_note : existing.admin_note,
      now,
      id,
    );

    const updated = db.prepare('SELECT * FROM home_bookings WHERE id = ?').get(id);
    res.json(mapRow(updated));
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Серверийн алдаа' });
  }
});

module.exports = router;
