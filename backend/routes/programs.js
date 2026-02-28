const express = require('express')
const router = express.Router()
const { getDb } = require('../utils/db')
const { auth, adminOnly } = require('../middleware/auth')

// list programs
router.get('/', async (req,res) => {
  try{
    const db = getDb().prepare('SELECT * FROM programs ORDER BY id')
    const rows = db.all()
    // parse days JSON
    const out = rows.map(r => ({ ...r, days: r.days ? JSON.parse(r.days) : [] }))
    res.json(out)
  }catch(e){ console.error(e); res.status(500).json({ message:'Error reading programs' }) }
})

// get single
router.get('/:id', async (req,res) => {
  try{
    const row = getDb().prepare('SELECT * FROM programs WHERE id = ?').get(req.params.id)
    if(!row) return res.status(404).json({ message: 'Not found' })
    row.days = row.days ? JSON.parse(row.days) : []
    res.json(row)
  }catch(e){ console.error(e); res.status(500).json({ message:'Error reading program' }) }
})

// create (admin)
router.post('/', auth, adminOnly, async (req,res) => {
  try{
    const { title, time, location, price, age, days } = req.body
    const now = new Date().toISOString()
    const daysJson = days && Array.isArray(days) ? JSON.stringify(days) : JSON.stringify([])
    const r = getDb().prepare('INSERT INTO programs (title,time,location,price,age,days,createdAt,updatedAt) VALUES (?,?,?,?,?,?,?,?)')
    const info = r.run(title || '', time || '', location || '', price || '', age || '', daysJson, now, now)
    const id = info.lastInsertRowid
    const row = getDb().prepare('SELECT * FROM programs WHERE id = ?').get(id)
    row.days = row.days ? JSON.parse(row.days) : []
    res.status(201).json(row)
  }catch(e){ console.error(e); res.status(500).json({ message:'Error creating program' }) }
})

// update (admin)
router.put('/:id', auth, adminOnly, async (req,res) => {
  try{
    const { title, time, location, price, age, days } = req.body
    const now = new Date().toISOString()
    const daysJson = days && Array.isArray(days) ? JSON.stringify(days) : JSON.stringify([])
    getDb().prepare('UPDATE programs SET title=?,time=?,location=?,price=?,age=?,days=?,updatedAt=? WHERE id=?').run(title||'', time||'', location||'', price||'', age||'', daysJson, now, req.params.id)
    const row = getDb().prepare('SELECT * FROM programs WHERE id = ?').get(req.params.id)
    if(!row) return res.status(404).json({ message:'Not found' })
    row.days = row.days ? JSON.parse(row.days) : []
    res.json(row)
  }catch(e){ console.error(e); res.status(500).json({ message:'Error updating program' }) }
})

// delete (admin)
router.delete('/:id', auth, adminOnly, async (req,res) => {
  try{
    getDb().prepare('DELETE FROM programs WHERE id=?').run(req.params.id)
    res.json({ ok:true })
  }catch(e){ console.error(e); res.status(500).json({ message:'Error deleting program' }) }
})

module.exports = router
