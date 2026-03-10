// ================= IMPORTS =================
require('dotenv').config(); 
const express = require('express'); 
const mongoose = require('mongoose'); 
const cors = require('cors'); 
const path = require('path'); 
const houseRoutes = require('./routes/houseRoutes'); 
const authRoutes = require('./routes/authRoutes'); 
const adminRoutes = require('./routes/adminRoutes');
// ✅ ADD THIS 
const app = express(); 

// ================= MIDDLEWARE =================
app.use(cors()); 
app.use(express.json()); 
app.use(express.urlencoded({ extended: true })); 

// ================= API ROUTES =================
app.use('/api/auth', authRoutes); // ✅ AUTH ROUTES 
app.use('/api/houses', houseRoutes); // Houses routes
app.use('/api/admin', adminRoutes); // Admin routes 

// ================= CLOUDINARY TEST =================
const cloudinary = require('./config/cloudinary'); 
app.get('/api/test-upload', async (req, res) => { 
    try { 
        const result = await cloudinary.uploader.upload( 
            'https://via.placeholder.com/150', 
            { folder: 'house-listings-test' } 
        ); 
        res.json({ message: 'Upload successful!', url: result.secure_url }); 
    } catch (err) { 
        res.status(500).json({ message: 'Upload failed', error: err.message }); 
    } 
}); 

// Catch-all for API routes (return JSON instead of HTML)
app.use(/^\/api\/.*$/, (req, res) => {
    res.status(404).json({ message: 'API route not found' });
});

// Serve frontend static files
app.use(express.static(path.join(__dirname, 'public'))); 

// SPA fallback (put LAST)
app.use((req, res) => { 
    res.sendFile(path.join(__dirname, 'public', 'index.html')); 
}); 

// ================= DATABASE CONNECTION =================
mongoose.connect(process.env.MONGO_URI)
    .then(async () => {
        console.log('MongoDB connected ✅');

        const User = require('./models/User');

        const existingAdmin = await User.findOne({ email: process.env.ADMIN_EMAIL });
        if (!existingAdmin) {
            const admin = new User({
                name: process.env.ADMIN_NAME,
                email: process.env.ADMIN_EMAIL,
                password: process.env.ADMIN_PASSWORD,
                role: 'admin'
            });
            await admin.save();
            console.log('Admin user created automatically ✅');
        } else {
            console.log('Admin user already exists');
        }
    })
    .catch(err => console.error('MongoDB connection error:', err)); 

// ================= START SERVER =================
const PORT = process.env.PORT || 5000; 
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

// ================= DATABASE CONNECTION =================
