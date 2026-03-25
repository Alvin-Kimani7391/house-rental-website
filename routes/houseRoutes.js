// ================== routes/houseRoutes.js ==================
const express = require('express');
const router = express.Router();
const House = require('../models/House');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const { cloudinary } = require('../config/cloudinary');
const { protect } = require('../middleware/authMiddleware');
const geocoder = require('../config/geocoder'); // Node-Geocoder
const { uploadListing } = require('../middleware/upload'); // ✅ add this line

// ================== MULTER CONFIG ==================
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/'),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, Date.now() + '-' + Math.round(Math.random() * 1e9) + ext);
  }
});
const upload = multer({
  storage,
  limits: { fileSize: 100 * 1024 * 1024 } // 100MB max
});

// ================== PUBLIC ROUTES ==================

// GET ALL HOUSES
router.get('/', async (req, res) => {
  try {
    const houses = await House.find().sort({ createdAt: -1 });
    res.json(houses);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// GET NEARBY HOUSES
router.get('/nearby', async (req, res) => {
  try {
    const { lat, lng } = req.query;
    if (!lat || !lng)
      return res.status(400).json({ message: "Latitude and longitude are required" });

    const latitude = parseFloat(lat);
    const longitude = parseFloat(lng);

    const nearbyHouses = await House.find({
      coordinates: {
        $near: {
          $geometry: { type: "Point", coordinates: [longitude, latitude] },
          $maxDistance: 50000
        }
      }
    });

    res.json(nearbyHouses);
  } catch (err) {
    console.error("Nearby houses error:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

// GET SINGLE HOUSE BY ID
router.get('/:id', async (req, res) => {
  try {
    const house = await House.findById(req.params.id);
    if (!house) return res.status(404).json({ message: 'House not found' });
    res.json(house);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// ================== PROTECTED ROUTES ==================

// GET MY LISTINGS
router.get('/my/listings', protect, async (req, res) => {
  try {
    const houses = await House.find({ owner: req.user._id }).sort({ createdAt: -1 });
    res.json(houses);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// ADD NEW HOUSE
// ================== ADD NEW HOUSE ==================
router.post(
  '/',
  protect,
  uploadListing.fields([
    { name: 'images', maxCount: 10 },
    { name: 'video', maxCount: 1 }
  ]),
  async (req, res) => {
    try {
      const { title, price, location, bedrooms, bathrooms, description, contact } = req.body;

      // Validate required fields
      if (!title || !price || !location || !bedrooms || !bathrooms || !description || !contact) {
        return res.status(400).json({ message: 'Please provide all required fields' });
      }

      // Geocode the location
      const geoData = await geocoder.geocode(location);
      if (!geoData.length) return res.status(400).json({ message: "Invalid location" });

      const coordinates = {
        type: "Point",
        coordinates: [geoData[0].longitude, geoData[0].latitude]
      };

      // Get uploaded files URLs from CloudinaryStorage
      const images = req.files.images ? req.files.images.map(f => f.path) : [];
      const video = req.files.video ? req.files.video[0].path : null;

      // Create new house
      const newHouse = new House({
        title,
        price,
        location,
        bedrooms,
        bathrooms,
        description,
        contact,
        images,
        video,
        coordinates,
        owner: req.user._id
      });

      const savedHouse = await newHouse.save();
      res.status(201).json(savedHouse);
    } catch (err) {
      console.error('House POST error:', err); // logs full stack
      res.status(500).json({ message: 'Server error', error: err.message });
    }
  }
);

// DELETE HOUSE
router.delete('/:id', protect, async (req, res) => {
  try {
    const house = await House.findById(req.params.id);
    if (!house) return res.status(404).json({ message: 'House not found' });

    // Admin can delete any house
    if (req.user.role !== 'admin' && house.owner.toString() !== req.user._id.toString()) {
      return res.status(401).json({ message: 'Not authorized' });
    }

    await house.deleteOne();
    res.json({ message: 'House deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// UPDATE HOUSE STATUS
router.patch('/:id/status', protect, async (req, res) => {
  try {

    const { status } = req.body;

    const allowedStatus = ["available", "booked", "rented"];

    if (!allowedStatus.includes(status)) {
      return res.status(400).json({ message: "Invalid status value" });
    }

    const house = await House.findById(req.params.id);

    if (!house) {
      return res.status(404).json({ message: "House not found" });
    }

    // Only owner can change status
    if (house.owner.toString() !== req.user._id.toString()) {
      return res.status(401).json({ message: "Not authorized" });
    }

    house.status = status;

    await house.save();

    res.json({
      message: `House marked as ${status}`,
      house
    });

  } catch (err) {
    console.error("Status update error:", err);
    res.status(500).json({ message: "Server error" });
  }
});


module.exports = router;