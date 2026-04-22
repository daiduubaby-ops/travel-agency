const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs');
const connectDB = require('./utils/db');

// Load .env from the backend directory explicitly so the server works
// whether started from project root or from inside backend/
dotenv.config({ path: path.join(__dirname, '.env') });

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 5000;

// Start server only after DB initialization completes to avoid handling requests
// before the DB wrapper is ready (which would throw 'DB not initialized').
async function start() {
  try {
    await connectDB();
    console.log('SQLite DB initialized');

    // Routes
    // Note: route handlers live under ./utils/routes in this project layout.
    app.use('/api/auth', require('./utils/routes/auth'));
    app.use('/api/gers', require('./utils/routes/gers'));
    app.use('/api/programs', require('./utils/routes/programs'));
    app.use('/api/bookings', require('./utils/routes/bookings'));
    // program booking API (tour/program bookings)
    app.use('/api/program-bookings', require('./utils/routes/program-bookings'));
    app.use('/api/news', require('./utils/routes/news'));
    app.use('/api', require('./utils/routes/homeBookings'));
    
    // Admin Routes
    app.use('/api/admin/bookings', require('./utils/routes/admin/bookings'));
    app.use('/api/admin/programs', require('./utils/routes/admin/programs'));
    app.use('/api/admin/news', require('./utils/routes/news'));

    // features (landing page items)
    app.use('/api/features', require('./utils/routes/features'));
    app.use('/api/settings', require('./utils/routes/settings'));
    // upload route and serve uploaded files
    app.use('/api/upload', require('./utils/routes/upload'));
    app.use('/public', express.static(path.join(__dirname, 'public')));

    // Serve frontend static files (if frontend was built) and provide SPA fallback.
    // This lets direct navigation to client-side routes like /booked return index.html
    const clientBuildPath = path.join(__dirname, '..', 'frontend', 'dist');
    if (fs.existsSync(clientBuildPath)) {
      app.use(express.static(clientBuildPath));
      // Any non-API route should serve index.html so the client router can handle it
      app.get('*', (req, res) => {
        // If the request is for an API route, skip (API routes are mounted above)
        if (req.path.startsWith('/api/')) return res.status(404).json({ message: 'Not found' });
        res.sendFile(path.join(clientBuildPath, 'index.html'));
      });
    } else {
      app.get('/', (req, res) => res.send('Ger Camp API'));
    }

    app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
  } catch (err) {
    console.error('DB initialization error', err);
    process.exit(1);
  }
}

start();
