const express = require('express')
const router = express.Router()
const { getDb } = require('../db')
const { auth, adminOnly } = require('../../middleware/auth')

// Public: list all news (most recent first)
router.get('/', (req, res) => {
  try {
    const db = getDb()
    const rows = db.prepare('SELECT id,title,img,date,desc,createdAt,updatedAt FROM news ORDER BY date DESC, createdAt DESC').all()
    res.json(rows)
  } catch (e) { console.error(e); res.status(500).json({ message: 'Server error' }) }
})

// Admin: create news
router.post('/', auth, adminOnly, (req, res) => {
  try {
    const { title, img, date, desc } = req.body
    if (!title || !desc) return res.status(400).json({ message: 'Title and desc required' })
    const now = new Date().toISOString()
    const db = getDb()
    const info = db.prepare('INSERT INTO news (title,img,date,desc,createdAt,updatedAt) VALUES (?, ?, ?, ?, ?, ?)').run(title, img || '', date || now.slice(0,10), desc, now, now)
    const item = db.prepare('SELECT id,title,img,date,desc,createdAt,updatedAt FROM news WHERE id = ?').get(info.lastInsertRowid)
    res.json(item)
  } catch (e) { console.error(e); res.status(500).json({ message: 'Server error' }) }
})

// Admin: delete news
router.delete('/:id', auth, adminOnly, (req, res) => {
  try {
    const id = Number(req.params.id)
    if (!Number.isFinite(id)) return res.status(400).json({ message: 'Invalid id' })

    const db = getDb()
    const info = db.prepare('DELETE FROM news WHERE id = ?').run(id)
    if (!info?.changes) return res.status(404).json({ message: 'News not found' })

    res.json({ ok: true, id })
  } catch (e) {
    console.error(e)
    res.status(500).json({ message: 'Server error' })
  }
})

module.exports = router
