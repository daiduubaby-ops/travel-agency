// Simple seeding script for development
const connectDB = require('../utils/db');
const { getDb } = require('../utils/db');

async function seed(){
  await connectDB();
  const db = getDb();
  // clear
  db.prepare('DELETE FROM gers').run();
  db.prepare('DELETE FROM users').run();
  // clear news table so seed is idempotent
  try { db.prepare('DELETE FROM news').run(); } catch (e) { /* ignore if table missing */ }
  const now = new Date().toISOString();
  const bcrypt = require('bcrypt');
  const { encrypt } = require('../utils/crypto');
  const hashed = bcrypt.hashSync('adminpass', 10);
  const encName = encrypt('Admin');
  const encEmail = encrypt('admin@local');
  const { hmac } = require('../utils/crypto');
  const emailHmac = hmac('admin@local');
  db.prepare('INSERT INTO users (name, email, email_hmac, password, role, isAdmin, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?)')
    .run(encName, encEmail, emailHmac, hashed, 'admin', 1, now, now);
  db.prepare('INSERT INTO gers (title, location, pricePerNight, capacity, amenities, images, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?)')
    .run('Terelj Ger', 'Terelj', 50, 4, JSON.stringify(['heating','meals']), JSON.stringify([]), now, now);
  db.prepare('INSERT INTO gers (title, location, pricePerNight, capacity, amenities, images, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?)')
    .run('Gobi Desert Ger', 'Gobi Desert', 70, 2, JSON.stringify(['heating']), JSON.stringify([]), now, now);
  // seed some hard-coded news articles for initial display
  db.prepare('INSERT INTO news (title,img,date,desc,createdAt,updatedAt) VALUES (?, ?, ?, ?, ?, ?)')
    .run('Хөвсгөл нуур — байгалийн онцгой бүс', '/uploads/nuur.jpg', '2026-03-20', 'Хөвсгөл нуур нь Монгол орны хойд хэсэгт орших бөгөөд цэнгэг усны асар их нөөц, байгалийн өвөрмөц тогтоц, экологийн ач холбогдлоороо онцгой байр суурь эзэлдэг.', now, now);
  db.prepare('INSERT INTO news (title,img,date,desc,createdAt,updatedAt) VALUES (?, ?, ?, ?, ?, ?)')
    .run('Ой тайга — уламжлалт амьдрал ба байгалийн орчин', '/uploads/1774447368116-lwvcgz.jpg', '2026-03-18', 'Хөвсгөлийн ой тайга нь байгалийн өвөрмөц тогтоц, ан амьтны аймаг, уламжлалт нүүдлийн соёлыг нэг дор хадгалсан ховор бүс нутаг юм.', now, now);
  db.prepare('INSERT INTO news (title,img,date,desc,createdAt,updatedAt) VALUES (?, ?, ?, ?, ?, ?)')
    .run('Монгол орны тухай', '/public/uploads/huduu.jpg', '2026-03-10', 'Монгол орон нь өргөн уудам тал нутаг, мөнх цаст уулс, элсэн манхан, өтгөн ой тайга, тунгалаг нуурууд хосолсон байгальтай.', now, now);
  console.log('Seeded');
  process.exit(0);
}

seed().catch(err => { console.error(err); process.exit(1); });
