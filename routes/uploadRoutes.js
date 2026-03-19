const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { uploadProfile } = require('../middleware/upload');

router.post('/profile-image', protect, uploadProfile.single('image'), async (req, res) => {
    try {
        const user = req.user;

        if (!req.file || !req.file.path) {
            return res.status(400).json({ message: 'No image uploaded' });
        }

        user.profileImage = req.file.path; // Cloudinary URL
        await user.save();

        res.json({ message: 'Profile image updated', imageUrl: user.profileImage });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Upload failed' });
    }
});

module.exports = router;