require('dotenv').config();
const express    = require('express');
const mongoose   = require('mongoose');
const cors       = require('cors');
const https      = require('https');
const authRoutes = require('./routes/auth');
const { errorHandler } = require('./middleware/index');

const app  = express();
app.set('trust proxy', 1); // ← Required for Render (reverse proxy / rate-limit fix)

const PORT = process.env.PORT || 5000;

// Allowed origins
const allowedOrigins = [
  'https://auth-frontend-m2zb.onrender.com',
  
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

    const server = app.listen(PORT, () => {
      console.log(`🚀 Server running on http://localhost:${PORT}`);

      // Keep Render free tier awake — ping every 14 minutes
      if (process.env.NODE_ENV === 'production') {
        setInterval(() => {
          const url = process.env.RENDER_EXTERNAL_URL || 'https://auth-backend-m2zb.onrender.com';
          https.get(`${url}/api/health`, (res) => {
            console.log(`Keep-alive ping: ${res.statusCode}`);
          }).on('error', (err) => {
            console.log('Keep-alive error:', err.message);
          });
        }, 14 * 60 * 1000);
      }
    });

    // Auto-handle port in use error
    server.on('error', (err) => {
      if (err.code === 'EADDRINUSE') {
        console.error(`❌ Port ${PORT} is already in use.`);
        console.error(`👉 Run this to fix it: npx kill-port ${PORT} && npm run dev`);
        process.exit(1);
      } else {
        throw err;
      }
    });
  })
  .catch((err) => {
    console.error('❌ MongoDB connection failed:', err.message);
    process.exit(1);
  });
