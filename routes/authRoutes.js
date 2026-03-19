const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const router = express.Router();
const { protect } = require('../middleware/authMiddleware');

/* ================= GENERATE TOKEN ================= */
const generateToken = (id, role) => {
    return jwt.sign({ id, role }, process.env.JWT_SECRET, { expiresIn: '1d' });
};

/* ================= REGISTER ================= */
router.post('/register', async (req, res) => {
    try {
        const { name, email, password, role, bio, location, profileImage } = req.body;

        if (!name || !email || !password || !role) {
            return res.status(400).json({ message: 'Please fill all required fields' });
        }

        const userExists = await User.findOne({ email });
        if (userExists) {
            return res.status(400).json({ message: 'User already exists' });
        }

        const user = await User.create({
            name,
            email,
            password,
            role,
            bio: bio || '',
            location: location || '',
            profileImage: profileImage || undefined
        });

        res.status(201).json({
            message: 'Registration successful',
            token: generateToken(user._id, user.role),
            user
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

/* ================= LOGIN ================= */
router.post('/login', async (req, res) => {
    try {
        const { email, password, role } = req.body;

        if (!email || !password || !role) {
            return res.status(400).json({ message: 'Please fill all required fields' });
        }

        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }

        const isMatch = await user.matchPassword(password);
        if (!isMatch) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }

        if (user.role !== role) {
            return res.status(400).json({ message: `You are not registered as a ${role}` });
        }

        res.json({
            message: 'Login successful',
            token: generateToken(user._id, user.role),
            user
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

/* ================= GET PROFILE ================= */
router.get('/profile', protect, async (req, res) => {
    try {
        const user = await User.findById(req.user._id)
            .populate('listings savedListings')
            .select('-password'); // never return password

        res.json(user);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Failed to load profile', error: err.message });
    }
});


// ================= UPDATE PROFILE =================
router.put('/profile', protect, async (req, res) => {
    try {
        const user = await User.findById(req.user._id);

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        // Only update provided fields
        const fields = ['name', 'bio', 'phone', 'location', 'profileImage'];
        fields.forEach(f => {
            if (req.body[f] !== undefined) user[f] = req.body[f];
        });

        // Recalculate profile completion
        if (typeof user.calculateProfileCompletion === 'function') {
            user.profileCompletion = user.calculateProfileCompletion();
        }

        await user.save();

        res.json({ message: 'Profile updated', user });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Update failed', error: err.message });
    }
});


/* ================= UPLOAD VERIFICATION ================= */
router.post('/verify', protect, async (req, res) => {
    try {
        const { nationalId, agentProof, utilityBill, landDocument } = req.body;
        const user = req.user;

        user.verification = {
            status: 'pending',
            documents: {
                nationalId: nationalId || null,
                agentProof: agentProof || null,
                utilityBill: utilityBill || null,
                landDocument: landDocument || null
            }
        };

        await user.save();

        res.json({ message: 'Verification submitted successfully!' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Verification submission failed', error: err.message });
    }
});

module.exports = router;