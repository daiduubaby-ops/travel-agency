const express = require('express')
const router = express.Router()
const { getDb } = require('../db')
const { auth, adminOnly } = require('../../middleware/auth')

// list programs
router.get('/', async (req,res) => {
  try{
    const db = getDb().prepare('SELECT * FROM programs ORDER BY id')
    const rows = db.all()
    // parse days JSON
    const out = rows.map(r => ({ ...r, days: r.days ? JSON.parse(r.days) : [], images: r.images ? JSON.parse(r.images) : [] }))
    res.json(out)
  }catch(e){ console.error(e); res.status(500).json({ message:'Error reading programs' }) }
})

// get single
router.get('/:id', async (req,res) => {
  try{
    const row = getDb().prepare('SELECT * FROM programs WHERE id = ?').get(req.params.id)
    if(!row) return res.status(404).json({ message: 'Not found' })
    row.days = row.days ? JSON.parse(row.days) : []
    row.images = row.images ? JSON.parse(row.images) : []
    res.json(row)
  }catch(e){ console.error(e); res.status(500).json({ message:'Error reading program' }) }
})

module.exports = router
