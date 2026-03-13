require('dotenv').config();
const express    = require('express');
const mongoose   = require('mongoose');
const cors       = require('cors');
const https      = require('https');
const authRoutes = require('./routes/auth');
const { errorHandler } = require('./middleware/index');

const app  = express();
const PORT = process.env.PORT || 5000;

// Allowed origins
const allowedOrigins = [
  'https://strong-bonbon-2772bc.netlify.app',
  'http://localhost:3000',
  process.env.FRONTEND_URL,
].filter(Boolean);

app.use(cors({
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Routes
// Add this BEFORE your routes
app.use((req, res, next) => {
  console.log(`${req.method} ${req.path}`);
  next();
});

app.use('/api/auth', authRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

// 404
app.use((req, res) => res.status(404).json({ success: false, error: 'Route not found.' }));

// Global error handler
app.use(errorHandler);

// MongoDB + Start server
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log('✅ MongoDB connected');
    app.listen(PORT, () => {
      console.log(`🚀 Server running on http://localhost:${PORT}`);

      // Keep Render free tier awake — ping every 14 minutes
      if (process.env.NODE_ENV === 'production') {
        setInterval(() => {
          // FIX: Ping the backend URL, not the frontend Netlify URL
          const url = process.env.RENDER_EXTERNAL_URL || 'https://auth-backend-m2zb.onrender.com';
          https.get(`${url}/api/health`, (res) => {
            console.log(`Keep-alive ping: ${res.statusCode}`);
          }).on('error', (err) => {
            console.log('Keep-alive error:', err.message);
          });
        }, 14 * 60 * 1000); // every 14 minutes
      }
    });
  })
  .catch((err) => {
    console.error('❌ MongoDB connection failed:', err.message);
    process.exit(1);
  });