const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { getDb } = require('../utils/db');

// Register
router.post('/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) return res.status(400).json({ message: 'Мэдээлэл дутуу байна' });

    const db = getDb();
    const existing = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
    if (existing) return res.status(400).json({ message: 'И-мэйл аль хэдийн ашиглагдаж байна' });

    const hashed = await bcrypt.hash(password, 10);
    const now = new Date().toISOString();
    // By default new users are not admins (isAdmin = 0)
    const info = db.prepare('INSERT INTO users (name, email, password, role, isAdmin, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?)').run(name, email, hashed, 'user', 0, now, now);
    // fetch by email (unique) to avoid relying on lastInsertRowid behavior
    const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
    const token = jwt.sign({ id: user.id, role: user.role }, process.env.JWT_SECRET || 'secret', { expiresIn: '7d' });
    res.json({ token, user: { id: user.id, name: user.name, email: user.email, role: user.role, isAdmin: !!user.isAdmin } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Серверийн алдаа' });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ message: 'Мэдээлэл дутуу байна' });

    const db = getDb();
    const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
    if (!user) return res.status(400).json({ message: 'Нэвтрэх мэдээлэл буруу байна' });

    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(400).json({ message: 'Нэвтрэх мэдээлэл буруу байна' });

    const token = jwt.sign({ id: user.id, role: user.role }, process.env.JWT_SECRET || 'secret', { expiresIn: '7d' });
    res.json({ token, user: { id: user.id, name: user.name, email: user.email, role: user.role, isAdmin: !!user.isAdmin } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Серверийн алдаа' });
  }
});

module.exports = router;
