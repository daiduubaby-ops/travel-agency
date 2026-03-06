const express = require('express')
const router = express.Router()
const multer = require('multer')
const path = require('path')
const fs = require('fs')
const { auth, adminOnly } = require('../middleware/auth')
const { getDb } = require('../utils/db')

// store uploads in backend/public/uploads
const uploadDir = path.join(__dirname, '..', 'public', 'uploads')
fs.mkdirSync(uploadDir, { recursive: true })

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname)
    const name = `${Date.now()}-${Math.random().toString(36).slice(2,8)}${ext}`
    cb(null, name)
  }
})
const upload = multer({ storage })

router.post('/', auth, adminOnly, upload.single('image'), (req, res) => {
  if(!req.file) return res.status(400).json({ message: 'No file' })
  // return public path
  // return an absolute URL so the frontend (dev server on different port) can load the image
  const host = req.get('host')
  const protocol = req.protocol
  const urlPath = `${protocol}://${host}/public/uploads/${req.file.filename}`
  // also include the relative path for backwards compatibility
  const relPath = `/public/uploads/${req.file.filename}`
  res.json({ url: urlPath, path: relPath })
})

// upload avatar for any authenticated user
router.post('/avatar', auth, upload.single('image'), (req, res) => {
  if (!req.file) return res.status(400).json({ message: 'No file' })
  try {
    const host = req.get('host')
    const protocol = req.protocol
    const urlPath = `${protocol}://${host}/public/uploads/${req.file.filename}`
    const relPath = `/public/uploads/${req.file.filename}`

    // update user's avatar in DB
    const db = getDb()
    db.prepare('UPDATE users SET avatar = ? , updatedAt = ? WHERE id = ?').run(relPath, new Date().toISOString(), req.user.id)
    // return updated user data
    const user = db.prepare('SELECT id,name,email,role,isAdmin,avatar FROM users WHERE id = ?').get(req.user.id)
    // convert avatar to absolute url for frontend convenience
    const avatarUrl = user && user.avatar ? (user.avatar.startsWith('http') ? user.avatar : `${protocol}://${host}${user.avatar}`) : null

    res.json({ url: urlPath, path: relPath, user: { id: user.id, name: user.name, email: user.email, role: user.role, isAdmin: !!user.isAdmin, avatar: avatarUrl } })
  } catch (e) {
    console.error(e)
    // include error message in dev to help debugging
    res.status(500).json({ message: 'Failed to save avatar', error: e.message || String(e) })
  }
})

// upload/replace home background image (fixed filename)
router.post('/home', auth, adminOnly, upload.single('image'), (req, res) => {
  if(!req.file) return res.status(400).json({ message: 'No file' })
  try{
    const publicDir = path.join(__dirname, '..', 'public')
    const dest = path.join(publicDir, 'home-hero.jpg')
    // copy the uploaded file to a fixed location (overwrite if exists)
    fs.copyFileSync(req.file.path, dest)
    const host = req.get('host')
    const protocol = req.protocol
    const urlPath = `${protocol}://${host}/public/home-hero.jpg`
    res.json({ url: urlPath, path: '/public/home-hero.jpg' })
  }catch(e){ console.error(e); res.status(500).json({ message: 'Failed to save home image' }) }
})

module.exports = router
