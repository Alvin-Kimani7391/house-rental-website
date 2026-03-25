// ================= uploadroutes.js =================
const express = require('express');
const router = express.Router();

const { protect } = require('../middleware/authMiddleware');
const { uploadProfile, uploadVerification } = require('../middleware/upload');
const User = require('../models/User');

// ================= PROFILE IMAGE UPLOAD =================
router.post('/profile-image', protect, uploadProfile.single('image'), async (req, res) => {
    try {
        const user = req.user;

        if (!req.file || !req.file.path) {
            return res.status(400).json({ message: 'No image uploaded' });
        }

        // Save Cloudinary URL to user
        user.profileImage = req.file.path;
        await user.save();

        res.json({
            message: 'Profile image updated',
            imageUrl: user.profileImage
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Upload failed' });
    }
});

// ================= VERIFICATION DOCUMENT UPLOAD =================
// Accepts one document at a time with a "type" field
// type = nationalId | agentProof | utilityBill | landDocument
router.post('/verification-doc', protect, uploadVerification.single('document'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: 'No document uploaded' });
        }

        console.log("Uploaded file:", req.file); // 🔍 debug

        const user = await User.findById(req.user._id);

        if (!user.verification) user.verification = {};
        if (!user.verification.documents) user.verification.documents = {};

        const docType = req.body.type;
        if (!docType) {
            return res.status(400).json({ message: 'Document type is required' });
        }

        // ✅ FIXED HERE
        const fileUrl = req.file.secure_url || req.file.path;

        user.verification.documents[docType] = fileUrl;
        user.verification.status = 'pending';

        await user.save();

        res.json({
            message: 'Document uploaded successfully',
            url: fileUrl,
            type: docType
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Upload failed' });
    }
});

module.exports = router;