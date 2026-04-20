// ================== routes/houseRoutes.js ==================
const express = require('express');
const router = express.Router();
const House = require('../models/House');
const multer = require('multer');
const path = require('path');
const { protect } = require('../middleware/authMiddleware');
const geocoder = require('../config/geocoder'); // Node-Geocoder
const { uploadListing } = require('../middleware/upload');

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
const jwt = require("jsonwebtoken");

router.get('/', async (req, res) => {
  try {
    let userId = null;

    // ✅ Check if user is logged in (optional auth)
    if (req.headers.authorization) {
      try {
        const token = req.headers.authorization.split(" ")[1];
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        userId = decoded.id;
      } catch (err) {
        console.log("Invalid token (ignored)");
      }
    }

    const houses = await House.find().sort({ createdAt: -1 });

    const formatted = houses.map(house => {
      const isSaved = userId
        ? house.favorites.some(fav => fav.toString() === userId)
        : false;

      return {
  ...house.toObject(),
  isSaved,
  favoritesCount: house.favorites.length
};
    });

    res.json(formatted);

  } catch (err) {
    console.error("GET houses error:", err);
    res.status(500).json({ message: 'Server error' });
  }
});

// GET NEARBY HOUSES
router.get('/nearby', async (req, res) => {
  try {
    const { lat, lng } = req.query;

    if (!lat || !lng) {
      return res.status(400).json({
        message: "Latitude and longitude are required"
      });
    }

    // ✅ Parse coordinates safely
    const latitude = parseFloat(lat);
    const longitude = parseFloat(lng);

    if (isNaN(latitude) || isNaN(longitude)) {
      return res.status(400).json({
        message: "Invalid coordinates"
      });
    }

    // ✅ Get user (optional)
    let userId = null;
    if (req.headers.authorization) {
      try {
        const token = req.headers.authorization.split(" ")[1];
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        userId = decoded.id;
      } catch {
        // ignore invalid token
      }
    }

    // ✅ Query nearby houses
    const nearbyHouses = await House.find({
      coordinates: {
        $near: {
          $geometry: {
            type: "Point",
            coordinates: [longitude, latitude]
          },
          $maxDistance: 50000 // 50km
        }
      }
    }).sort({ createdAt: -1 });

    // ✅ Format response (CONSISTENT with other routes)
    const formatted = nearbyHouses.map(house => ({
      ...house.toObject(),
      isSaved: userId
        ? house.favorites?.some(f => f.toString() === userId)
        : false,
      favoritesCount: house.favorites?.length || 0
    }));

    res.json(formatted);

  } catch (err) {
    console.error("Nearby houses error:", err);
    res.status(500).json({
      message: "Server error"
    });
  }
});

// GET SINGLE HOUSE BY ID + TRACK VIEWS
const mongoose = require('mongoose');

router.get('/:id', async (req, res) => {
  try {
    const id = req.params.id;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid house ID' });
    }

    let userId = null;

    if (req.headers.authorization) {
      try {
        const token = req.headers.authorization.split(" ")[1];
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        userId = decoded.id;
      } catch {}
    }

    const house = await House.findById(id);
    if (!house) return res.status(404).json({ message: 'House not found' });

    // ✅ views logic (keep yours)
    if (!req.session) req.session = {};
    if (!req.session.viewedHouses) req.session.viewedHouses = [];

    const houseIdStr = house._id.toString();
    if (!req.session.viewedHouses.includes(houseIdStr)) {
      house.views = (house.views || 0) + 1;
      await house.save();
      req.session.viewedHouses.push(houseIdStr);
      if (req.session.viewedHouses.length > 50) req.session.viewedHouses.shift();
    }

    const isSaved = userId
      ? house.favorites?.some(fav => fav.toString() === userId)
      : false;

    res.json({
  ...house.toObject(),
  isSaved,
  favoritesCount: house.favorites?.length || 0
});

  } catch (err) {
    console.error("GET house error:", err);
    res.status(500).json({ message: 'Server error' });
  }
});

// ================== PROTECTED ROUTES ==================

// GET MY LISTINGS (WITH ANALYTICS)
router.get('/my/listings', protect, async (req, res) => {
  try {
    const houses = await House.find({ owner: req.user._id }).sort({ createdAt: -1 });

    const formatted = houses.map(house => ({
      ...house.toObject(),
      views: house.views || 0,
      favorites: house.favorites ? house.favorites.length : 0,
      isSaved: house.favorites
        ? house.favorites.some(id => id.toString() === req.user._id.toString())
        : false
    }));

    res.json(formatted);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// SAVE / UNSAVE HOUSE
router.post('/:id/save', protect, async (req, res) => {
  try {
    const house = await House.findById(req.params.id);
    if (!house) return res.status(404).json({ message: 'House not found' });

    const userId = req.user._id;
    if (!house.favorites) house.favorites = [];

    const alreadySaved = house.favorites?.some(
  id => id.toString() === userId.toString()
);
    if (alreadySaved) {
      house.favorites = house.favorites.filter(id => id.toString() !== userId.toString());
    } else {
      house.favorites.push(userId);
    }

    await house.save();

    res.json({
      message: alreadySaved ? "Removed from favorites" : "Added to favorites",
      favoritesCount: house.favorites.length
    });
  } catch (err) {
    console.error("Save error:", err);
    res.status(500).json({ message: 'Server error' });
  }
});

// GET all saved houses for the logged-in user
router.get('/saved', protect, async (req, res) => {
  try {
    const userId = req.user._id;

    const savedHouses = await House.find({ favorites: userId });

    res.json(savedHouses);
  } catch (err) {
    console.error("Fetch saved houses error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// ADD NEW HOUSE
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

      if (!title || !price || !location || !bedrooms || !bathrooms || !description || !contact) {
        return res.status(400).json({ message: 'Please provide all required fields' });
      }

      const geoData = await geocoder.geocode(location);
      if (!geoData.length) return res.status(400).json({ message: "Invalid location" });

      const coordinates = {
        type: "Point",
        coordinates: [geoData[0].longitude, geoData[0].latitude]
      };

      const images = req.files.images ? req.files.images.map(f => f.path) : [];
      const video = req.files.video ? req.files.video[0].path : null;

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
        owner: req.user._id,
        favorites: [],
        views: 0
      });

      const savedHouse = await newHouse.save();
      res.status(201).json(savedHouse);
    } catch (err) {
      console.error('House POST error:', err);
      res.status(500).json({ message: 'Server error', error: err.message });
    }
  }
);

// DELETE HOUSE
router.delete('/:id', protect, async (req, res) => {
  try {
    const house = await House.findById(req.params.id);
    if (!house) return res.status(404).json({ message: 'House not found' });

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
    if (!allowedStatus.includes(status)) return res.status(400).json({ message: "Invalid status value" });

    const house = await House.findById(req.params.id);
    if (!house) return res.status(404).json({ message: "House not found" });

    if (house.owner.toString() !== req.user._id.toString()) return res.status(401).json({ message: "Not authorized" });

    house.status = status;
    await house.save();

    res.json({ message: `House marked as ${status}`, house });
  } catch (err) {
    console.error("Status update error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;