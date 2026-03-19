// ================== middleware/upload.js ==================
const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const { cloudinary } = require('../config/cloudinary');

// Generic storage function
const createCloudinaryStorage = (folderName) => new CloudinaryStorage({
  cloudinary,
  params: async (req, file) => ({
    folder: folderName,
    resource_type: 'auto', // images & videos
  }),
});

// Profile image upload middleware
const uploadProfile = multer({
  storage: createCloudinaryStorage('profile-images'),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB max for profile
});

// House/listing upload middleware
const uploadListing = multer({
  storage: createCloudinaryStorage('house-listings'),
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB max for listings
});

module.exports = { uploadProfile, uploadListing };