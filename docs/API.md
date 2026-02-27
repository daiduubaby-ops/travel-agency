API Endpoints

Auth
- POST /api/auth/register {name,email,password}
- POST /api/auth/login {email,password}

Gers
- GET /api/gers
- GET /api/gers/:id
- POST /api/gers (admin)
- PUT /api/gers/:id (admin)
- DELETE /api/gers/:id (admin)

Bookings
- POST /api/bookings (create booking)
- GET /api/bookings/my (user bookings)
- GET /api/bookings (admin all bookings)
- PUT /api/bookings/:id/cancel (cancel)
- PUT /api/bookings/:id (admin update)
