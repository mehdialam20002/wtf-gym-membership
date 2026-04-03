require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');

const authRoutes = require('./routes/authRoutes');
const planRoutes = require('./routes/planRoutes');
const gymRoutes = require('./routes/gymRoutes');
const userAuthRoutes = require('./routes/userAuthRoutes');
const membershipRoutes = require('./routes/membershipRoutes');
const freezeRoutes = require('./routes/freezeRoutes');
const { errorHandler, notFound } = require('./middleware/errorMiddleware');
const { startFreezeCron } = require('./utils/freezeCron');

const app = express();

// Security middleware
app.use(helmet());
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  credentials: true,
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { error: 'Too many requests, please try again later.' },
});
app.use('/api/', limiter);

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { error: 'Too many login attempts, please try again later.' },
});

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Logging
if (process.env.NODE_ENV !== 'production') {
  app.use(morgan('dev'));
}

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Routes — authLimiter only on login endpoints, not all admin routes
app.use('/api/admin/login', authLimiter);
app.use('/api/admin', authRoutes);
app.use('/api/plans', planRoutes);
app.use('/api/gyms', gymRoutes);
app.use('/api/user/login', authLimiter);
app.use('/api/user/signup', authLimiter);
app.use('/api/user', userAuthRoutes);
app.use('/api/memberships', membershipRoutes);
app.use('/api/memberships', freezeRoutes);

// Start cron jobs
startFreezeCron();

// Error handling
app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT} in ${process.env.NODE_ENV || 'development'} mode`);
});

module.exports = app;
