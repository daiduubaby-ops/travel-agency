// Simple seeding script for development
const connectDB = require('../utils/db');
const { getDb } = require('../utils/db');

async function seed(){
  await connectDB();
  const db = getDb();
  // clear
  db.prepare('DELETE FROM gers').run();
  db.prepare('DELETE FROM users').run();
  const now = new Date().toISOString();
  const bcrypt = require('bcrypt');
  const hashed = bcrypt.hashSync('adminpass', 10);
  // create an admin user for testing
  db.prepare('INSERT INTO users (name, email, password, role, isAdmin, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?)')
    .run('Admin', 'admin@local', hashed, 'admin', 1, now, now);
  db.prepare('INSERT INTO gers (title, location, pricePerNight, capacity, amenities, images, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?)')
    .run('Terelj Ger', 'Terelj', 50, 4, JSON.stringify(['heating','meals']), JSON.stringify([]), now, now);
  db.prepare('INSERT INTO gers (title, location, pricePerNight, capacity, amenities, images, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?)')
    .run('Gobi Desert Ger', 'Gobi Desert', 70, 2, JSON.stringify(['heating']), JSON.stringify([]), now, now);
  console.log('Seeded');
  process.exit(0);
}

seed().catch(err => { console.error(err); process.exit(1); });
