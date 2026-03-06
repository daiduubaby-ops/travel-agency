Ger Camp түрээсийн Backend API

Тохиргоо
1. cd backend
2. npm install
3. .env.example файлыг .env болгон хуулж, MONGO_URI болон JWT_SECRET-ийг тохируулна
4. npm run dev

Мэдээллийн үржүүлэх
- npm run seed

Тэмдэглэл
- Эндпоинтууд: /api/auth, /api/gers, /api/bookings
- Шинээр нэмэгдсэн: /api/programs болон /api/upload (админ нэвтрэлт шаардлагатай)
  - /public/uploads-д байрлах зураг файлуудыг серверээр serve хийнэ
- Хамгаалалттай эндпоинтуудад JWT шаардлагатай
