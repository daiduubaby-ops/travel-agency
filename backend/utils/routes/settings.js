const express = require('express')
const router = express.Router()
const { getDb } = require('../db')
const { auth, adminOnly } = require('../../middleware/auth')

const KEY_LISTINGS_EMPTY_GALLERY = 'listings_empty_gallery_images'

function parseImages(value){
  try{
    const parsed = JSON.parse(value || '[]')
    return Array.isArray(parsed) ? parsed.filter(Boolean) : []
  }catch(e){
    return []
  }
}

// public: read gallery images used in Listings empty state
router.get('/listings-empty-gallery', (req, res) => {
  try{
    const row = getDb().prepare('SELECT value FROM settings WHERE key = ?').get(KEY_LISTINGS_EMPTY_GALLERY)
    const images = parseImages(row && row.value)
    res.json({ images })
  }catch(e){
    console.error(e)
    res.status(500).json({ message: 'Error reading settings' })
  }
})

// admin: save 3-5 images for Listings empty state
router.put('/listings-empty-gallery', auth, adminOnly, (req, res) => {
  try{
    const images = Array.isArray(req.body && req.body.images) ? req.body.images.filter(Boolean) : []
    if(images.length < 3 || images.length > 5){
      return res.status(400).json({ message: '3-5 зураг оруулна уу' })
    }

    const now = new Date().toISOString()
    const value = JSON.stringify(images)
    const existing = getDb().prepare('SELECT key FROM settings WHERE key = ?').get(KEY_LISTINGS_EMPTY_GALLERY)
    if(existing){
      getDb().prepare('UPDATE settings SET value = ?, updatedAt = ? WHERE key = ?').run(value, now, KEY_LISTINGS_EMPTY_GALLERY)
    }else{
      getDb().prepare('INSERT INTO settings (key, value, updatedAt) VALUES (?, ?, ?)').run(KEY_LISTINGS_EMPTY_GALLERY, value, now)
    }

    res.json({ images })
  }catch(e){
    console.error(e)
    res.status(500).json({ message: 'Error saving settings' })
  }
})

module.exports = router
