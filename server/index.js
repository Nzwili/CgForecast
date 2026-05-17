require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') }); // RESTART: 2026-05-15T08:31:00Z
const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');

const authRoutes = require('./routes/auth');
const groupRoutes = require('./routes/groups');
const attendanceRoutes = require('./routes/attendance');
const feedbackRoutes = require('./routes/feedback');
const forecastRoutes = require('./routes/forecast');
const alertRoutes = require('./routes/alerts');
const adminRoutes = require('./routes/admin');
const mlRoutes = require('./routes/ml');
const usersRoutes = require('./routes/users');
const churchRoutes = require('./routes/church');

const app = express();

app.use(cors());
app.use(cookieParser());
app.use(express.json({ limit: '50mb' }));

// Health check
app.get('/health', (req, res) => res.json({ status: 'ok', timestamp: new Date().toISOString() }));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/groups', groupRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/feedback', feedbackRoutes);
app.use('/api/forecast', forecastRoutes);
app.use('/api/alerts', alertRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/ml', mlRoutes);
app.use('/api/church', churchRoutes);

// Serve static files from React build directory
const path = require('path');
const clientDistPath = path.join(__dirname, '../client/dist');
app.use(express.static(clientDistPath));

// For any other requests, fallback to React's index.html
app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api')) {
    return next();
  }
  res.sendFile(path.join(clientDistPath, 'index.html'));
});

// Global error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Internal server error' });
});

const PORT = process.env.PORT || 3001;

if (require.main === module) {
  app.listen(PORT, () => console.log(`🚀 Server running on http://localhost:${PORT}`));
}

module.exports = app;
