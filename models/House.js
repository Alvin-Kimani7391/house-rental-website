// ================== models/House.js ==================
const mongoose = require('mongoose');

const houseSchema = new mongoose.Schema({

  title: { type: String, required: true },
  price: { type: Number, required: true },

  location: { type: String, required: true },

  bedrooms: { type: Number, required: true },
  bathrooms: { type: Number, required: true },

  // ✅ Geo Location (NEW)
  coordinates: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point'
    },
    coordinates: {
      type: [Number], // [longitude, latitude]
      required: true
    }
  },

  // ✅ Multiple Images
  images: [{ type: String, required: true }],

  // ✅ Optional Video
  video: { type: String },

  description: { type: String, required: true },

  contact: { type: String, required: true },

  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  // ✅ House Status (NEW)
  status: {
    type: String,
    enum: ['available', 'booked', 'rented'],
    default: 'available'
  },

  // ================= NEW FEATURES =================
  views: { type: Number, default: 0 },

  favorites: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  // ===============================================

  createdAt: { type: Date, default: Date.now }

});

// IMPORTANT for geo queries
houseSchema.index({ coordinates: '2dsphere' });

module.exports = mongoose.model('House', houseSchema);