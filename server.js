require('dotenv').config();
const express    = require('express');
const mongoose   = require('mongoose');
const cors       = require('cors');
const https      = require('https');
const authRoutes = require('./routes/auth');
const { errorHandler } = require('./middleware/index');

const app  = express();
app.set('trust proxy', 1);

const PORT = process.env.PORT || 5000;

const allowedOrigins = [
  'https://strong-bonbon-2772bc.netlify.app',
  'http://localhost:5173',
  'http://localhost:3000',
  'http://localhost:3001',
  process.env.FRONTEND_URL,
].filter(Boolean);

app.use(cors({
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.error('❌ CORS blocked origin:', origin); // ← helps debug
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use('/api/auth', authRoutes);

app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

app.use((req, res) => res.status(404).json({ success: false, error: 'Route not found.' }));
app.use(errorHandler);

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log('✅ MongoDB connected');

    const server = app.listen(PORT, () => {
      console.log(`🚀 Server running on http://localhost:${PORT}`);

      if (process.env.NODE_ENV === 'production') {
        // ✅ Ping the backend itself, not the frontend
        const backendUrl = process.env.RENDER_EXTERNAL_URL || 'https://auth-backend-m2zb.onrender.com';
        setInterval(() => {
          https.get(`${backendUrl}/api/health`, (res) => {
            console.log(`Keep-alive ping: ${res.statusCode}`);
          }).on('error', (err) => {
            console.warn('Keep-alive error:', err.message);
          });
        }, 14 * 60 * 1000);
      }
    });

    server.on('error', (err) => {
      if (err.code === 'EADDRINUSE') {
        console.error(`❌ Port ${PORT} is already in use.`);
        console.error(`👉 Run: npx kill-port ${PORT} && npm run dev`);
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