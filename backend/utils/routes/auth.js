const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { getDb } = require('../db');
const { encrypt, decrypt, hmac } = require('../../utils/crypto');

// Register
router.post('/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) return res.status(400).json({ message: 'Мэдээлэл дутуу байна' });

    const db = getDb();
    // encrypt name and email (non-deterministic) and compute deterministic HMAC for lookups
    const encName = encrypt(name);
    const encEmail = encrypt(email);
    const emailHmac = hmac(email);
    const existing = db.prepare('SELECT * FROM users WHERE email_hmac = ?').get(emailHmac);
    if (existing) return res.status(400).json({ message: 'И-мэйл аль хэдийн ашиглагдаж байна' });

    const hashed = await bcrypt.hash(password, 10);
    const now = new Date().toISOString();
    // By default new users are not admins (isAdmin = 0)
    const info = db.prepare('INSERT INTO users (name, email, email_hmac, password, role, isAdmin, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?)').run(encName, encEmail, emailHmac, hashed, 'user', 0, now, now);
    // fetch by email_hmac (deterministic)
    const userRow = db.prepare('SELECT * FROM users WHERE email_hmac = ?').get(emailHmac);
    // decrypt fields for response
    const user = userRow ? Object.assign({}, userRow, { name: decrypt(userRow.name), email: decrypt(userRow.email) }) : userRow;
    const token = jwt.sign({ id: user.id, role: user.role }, process.env.JWT_SECRET || 'secret', { expiresIn: '7d' });
    // include avatar as absolute URL if present
    const protocol = req.protocol
    const host = req.get('host')
    const avatar = user.avatar ? (user.avatar.startsWith('http') ? user.avatar : `${protocol}://${host}${user.avatar}`) : null
    res.json({ token, user: { id: user.id, name: user.name, email: user.email, role: user.role, isAdmin: !!user.isAdmin, avatar } });
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
    const emailHmac = hmac(email);
    const userRow = db.prepare('SELECT * FROM users WHERE email_hmac = ?').get(emailHmac);
    const user = userRow ? Object.assign({}, userRow, { name: decrypt(userRow.name), email: decrypt(userRow.email) }) : userRow;
    if (!user) return res.status(400).json({ message: 'Нэвтрэх мэдээлэл буруу байна' });

    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(400).json({ message: 'Нэвтрэх мэдээлэл буруу байна' });

    const token = jwt.sign({ id: user.id, role: user.role }, process.env.JWT_SECRET || 'secret', { expiresIn: '7d' });
    const protocol = req.protocol
    const host = req.get('host')
    const avatar = user.avatar ? (user.avatar.startsWith('http') ? user.avatar : `${protocol}://${host}${user.avatar}`) : null
    res.json({ token, user: { id: user.id, name: user.name, email: user.email, role: user.role, isAdmin: !!user.isAdmin, avatar } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Серверийн алдаа' });
  }
});

module.exports = router;
