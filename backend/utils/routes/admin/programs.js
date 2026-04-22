const express = require('express');
const router = express.Router();
const { getDb } = require('../../db');
const { auth, adminOnly } = require('../../../middleware/auth');

// All admin routes in this file require auth and adminOnly
router.use(auth, adminOnly);

/**
 * @route   POST /api/admin/programs
 * @desc    Create a new program
 * @access  Admin
 */
router.post('/', async (req, res) => {
  try {
    const { 
      title, time, location, price, age, days, images,
      duration, capacity, accommodation, transport, cancellation, nights, language, phone 
    } = req.body;
    const now = new Date().toISOString();
    const daysJson = days && Array.isArray(days) ? JSON.stringify(days) : JSON.stringify([]);
    const imgsJson = images && Array.isArray(images) ? JSON.stringify(images) : JSON.stringify([]);
    
    const db = getDb();
    const info = db.prepare(`
      INSERT INTO programs (
        title, time, location, price, age, days, images, 
        duration, capacity, accommodation, transport, cancellation, nights, language, phone, 
        createdAt, updatedAt
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      title || '', time || '', location || '', price || '', age || '', daysJson, imgsJson, 
      duration || '', capacity || '', accommodation || '', transport || '', cancellation || '', 
      nights || '', language || '', phone || '', now, now
    );
    
    const id = info.lastInsertRowid;
    const row = db.prepare('SELECT * FROM programs WHERE id = ?').get(id);
    row.days = row.days ? JSON.parse(row.days) : [];
    row.images = row.images ? JSON.parse(row.images) : [];
    res.status(201).json(row);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error creating program' });
  }
});

/**
 * @route   PUT /api/admin/programs/:id
 * @desc    Update an existing program
 * @access  Admin
 */
router.put('/:id', async (req, res) => {
  try {
    const { 
      title, time, location, price, age, days, images,
      duration, capacity, accommodation, transport, cancellation, nights, language, phone 
    } = req.body;
    const now = new Date().toISOString();
    const daysJson = days && Array.isArray(days) ? JSON.stringify(days) : JSON.stringify([]);
    const imgsJson = images && Array.isArray(images) ? JSON.stringify(images) : JSON.stringify([]);
    
    const db = getDb();
    const result = db.prepare(`
      UPDATE programs SET 
        title=?, time=?, location=?, price=?, age=?, days=?, images=?, 
        duration=?, capacity=?, accommodation=?, transport=?, cancellation=?, nights=?, language=?, phone=?, 
        updatedAt=? 
      WHERE id=?
    `).run(
      title || '', time || '', location || '', price || '', age || '', daysJson, imgsJson, 
      duration || '', capacity || '', accommodation || '', transport || '', cancellation || '', 
      nights || '', language || '', phone || '', now, req.params.id
    );
    
    if (result.changes === 0) return res.status(404).json({ message: 'Not found' });
    
    const row = db.prepare('SELECT * FROM programs WHERE id = ?').get(req.params.id);
    row.days = row.days ? JSON.parse(row.days) : [];
    row.images = row.images ? JSON.parse(row.images) : [];
    res.json(row);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error updating program' });
  }
});

/**
 * @route   DELETE /api/admin/programs/:id
 * @desc    Delete a program
 * @access  Admin
 */
router.delete('/:id', async (req, res) => {
  try {
    getDb().prepare('DELETE FROM programs WHERE id=?').run(req.params.id);
    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error deleting program' });
  }
});

module.exports = router;
