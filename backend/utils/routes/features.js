const express = require('express')
const router = express.Router()
const { getDb } = require('../db')
const { auth, adminOnly } = require('../../middleware/auth')

// list features
router.get('/', async (req,res) => {
  try{
    const rows = getDb().prepare('SELECT * FROM features ORDER BY sortOrder, id').all()
    res.json(rows.map(r => ({ ...r })))
  }catch(e){ console.error(e); res.status(500).json({ message:'Error reading features' }) }
})

// get single
router.get('/:id', async (req,res) => {
  try{
    const row = getDb().prepare('SELECT * FROM features WHERE id = ?').get(req.params.id)
    if(!row) return res.status(404).json({ message: 'Not found' })
    res.json(row)
  }catch(e){ console.error(e); res.status(500).json({ message:'Error reading feature' }) }
})

// create (admin)
router.post('/', auth, adminOnly, async (req,res) => {
  try{
    const { title, lead, description, image, sortOrder } = req.body
    const now = new Date().toISOString()
    const r = getDb().prepare('INSERT INTO features (title,lead,description,image,sortOrder,createdAt,updatedAt) VALUES (?,?,?,?,?,?,?)')
    const info = r.run(title||'', lead||'', description||'', image||'', sortOrder||0, now, now)
    const id = info.lastInsertRowid
    const row = getDb().prepare('SELECT * FROM features WHERE id = ?').get(id)
    res.status(201).json(row)
  }catch(e){ console.error(e); res.status(500).json({ message:'Error creating feature' }) }
})

// update (admin)
router.put('/:id', auth, adminOnly, async (req,res) => {
  try{
    const { title, lead, description, image, sortOrder } = req.body
    const now = new Date().toISOString()
    getDb().prepare('UPDATE features SET title=?,lead=?,description=?,image=?,sortOrder=?,updatedAt=? WHERE id=?')
      .run(title||'', lead||'', description||'', image||'', sortOrder||0, now, req.params.id)
    const row = getDb().prepare('SELECT * FROM features WHERE id = ?').get(req.params.id)
    if(!row) return res.status(404).json({ message:'Not found' })
    res.json(row)
  }catch(e){ console.error(e); res.status(500).json({ message:'Error updating feature' }) }
})

// delete (admin)
router.delete('/:id', auth, adminOnly, async (req,res) => {
  try{
    getDb().prepare('DELETE FROM features WHERE id=?').run(req.params.id)
    res.json({ ok:true })
  }catch(e){ console.error(e); res.status(500).json({ message:'Error deleting feature' }) }
})

module.exports = router
