require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const houseRoutes = require('./routes/houseRoutes');
const authRoutes = require('./routes/authRoutes');
const adminRoutes = require('./routes/adminRoutes');
const uploadRoutes = require('./routes/uploadRoutes');

const app = express();
const PORT = process.env.PORT || 5000;

// ===== CORS =====
const allowedOrigins = [
  'https://housefinder-sigma.vercel.app',
  'http://localhost:3000'
];

app.use(cors({
  origin: function (origin, callback) {
    // allow requests with no origin (like mobile apps / curl)
    if (!origin) return callback(null, true);

    if (
      allowedOrigins.includes(origin) ||
      origin.endsWith('.vercel.app') // allow all Vercel previews
    ) {
      return callback(null, true);
    }

    return callback(new Error('Not allowed by CORS'));
  },
  methods: ['GET','POST','PUT','PATCH','DELETE'],
  allowedHeaders: ['Content-Type','Authorization'],
  credentials: true
}));

app.use(cors()); // handles preflight automatically
// ===== BODY =====
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ===== STATIC FILES =====
app.use('/uploads', express.static('uploads'));

// ===== ROUTES =====
app.use('/api/auth', authRoutes);
app.use('/api/houses', houseRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/upload', uploadRoutes);

// ===== HEALTH CHECK =====
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK' });
});

// ===== 404 =====
app.use(/^\/api\/.*$/, (req, res) => {
  res.status(404).json({ message: 'API route not found' });
});

// ===== DB + START =====
mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log('MongoDB connected ✅');
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  })
  .catch(err => {
    console.error('MongoDB connection failed ❌', err);
  });