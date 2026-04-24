const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs');
const connectDB = require('./utils/db');

dotenv.config({ path: path.join(__dirname, '.env') });

const app = express();

app.use(cors());
app.use(express.json({ limit: '20mb' }));
app.use(express.urlencoded({ extended: true, limit: '20mb' }));

const PORT = process.env.PORT || 5000;

async function start() {
  try {
    await connectDB();
    console.log('SQLite DB initialized');

    // Public / Auth routes
    app.use('/api/auth', require('./utils/routes/auth'));
    app.use('/api/gers', require('./utils/routes/gers'));
    app.use('/api/programs', require('./utils/routes/programs'));
    app.use('/api/bookings', require('./utils/routes/bookings'));
    app.use('/api/program-bookings', require('./utils/routes/program-bookings'));
    app.use('/api/news', require('./utils/routes/news'));
    app.use('/api/features', require('./utils/routes/features'));
    app.use('/api/settings', require('./utils/routes/settings'));
    app.use('/api/upload', require('./utils/routes/upload'));
    app.use('/api', require('./utils/routes/homeBookings'));

    // Admin routes
    app.use('/api/admin/bookings', require('./utils/routes/admin/bookings'));
    app.use('/api/admin/programs', require('./utils/routes/admin/programs'));
    app.use('/api/admin/news', require('./utils/routes/news'));

    // Static uploads
    app.use('/public', express.static(path.join(__dirname, 'public')));

    // API fallback: unknown API routes must return JSON, not index.html
    app.use('/api', (req, res) => {
      res.status(404).json({
        message: 'API route not found',
        path: req.originalUrl
      });
    });

    // Serve frontend static files if built
    const clientBuildPath = path.join(__dirname, '..', 'frontend', 'dist');

    if (fs.existsSync(clientBuildPath)) {
      app.use(express.static(clientBuildPath));

      app.get('*', (req, res) => {
        res.sendFile(path.join(clientBuildPath, 'index.html'));
      });
    } else {
      app.get('/', (req, res) => {
        res.send('Ger Camp API');
      });
    }

    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (err) {
    console.error('DB initialization error', err);
    process.exit(1);
  }
}

start();