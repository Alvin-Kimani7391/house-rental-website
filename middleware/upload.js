// ================== middleware/upload.js ==================
const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const { cloudinary } = require('../config/cloudinary');

// Generic storage function
const createCloudinaryStorage = (folderName) => new CloudinaryStorage({
  cloudinary,
  params: async (req, file) => ({
  folder: `verification-docs/${req.user._id}`, // 👈 per user
  resource_type: 'auto',
}),
});

// Profile image upload
const uploadProfile = multer({
  storage: createCloudinaryStorage('profile-images'),
  limits: { fileSize: 5 * 1024 * 1024 },
});

// Listing upload
const uploadListing = multer({
  storage: createCloudinaryStorage('house-listings'),
  limits: { fileSize: 50 * 1024 * 1024 },
});

// ✅ NEW: Verification documents
const uploadVerification = multer({
  storage: createCloudinaryStorage('verification-docs'),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB per doc
});

module.exports = {
  uploadProfile,
  uploadListing,
  uploadVerification // ✅ export it
};