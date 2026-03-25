const express = require("express");
const router = express.Router();
const axios = require("axios");
const path = require("path");

const User = require("../models/User");
const House = require("../models/House");

const { v2: cloudinary } = require("cloudinary");

const { protect } = require("../middleware/authMiddleware");
const adminOnly = require("../middleware/adminMiddleware");

// ================= DASHBOARD STATS =================
router.get("/stats", protect, adminOnly, async (req, res) => {
  try {
    const users = await User.countDocuments({ role: "user" });
    const agents = await User.countDocuments({ role: "agent" });
    const owners = await User.countDocuments({ role: "owner" });
    const houses = await House.countDocuments();
    res.json({ users, agents, owners, houses });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ================= USERS =================
router.get("/users", protect, adminOnly, async (req, res) => {
  try {
    const users = await User.find({ role: "user" }).select("-password");
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ================= AGENTS =================
router.get("/agents", protect, adminOnly, async (req, res) => {
  try {
    const agents = await User.find({ role: "agent" });
    const data = await Promise.all(
      agents.map(async (agent) => {
        const houses = await House.find({ owner: agent._id });
        return { agent, houses };
      })
    );
    res.json(data);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ================= OWNERS =================
router.get("/owners", protect, adminOnly, async (req, res) => {
  try {
    const owners = await User.find({ role: "owner" });
    const data = await Promise.all(
      owners.map(async (owner) => {
        const houses = await House.find({ owner: owner._id });
        return { owner, houses };
      })
    );
    res.json(data);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ================= ALL HOUSES =================
router.get("/houses", protect, adminOnly, async (req, res) => {
  try {
    const houses = await House.find().populate("owner", "name email");
    res.json(houses);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ================= VERIFICATIONS =================
// GET all pending or rejected verifications
// ================= VERIFICATIONS =================
router.get("/verifications", protect, adminOnly, async (req, res) => {
  try {
    const users = await User.find({
      "verification.status": { $in: ["pending", "rejected"] },
    }).select("-password");

    const usersWithDocs = users.map((user) => {
      const docs = user.verification?.documents || {};
      const updatedDocs = {};

      for (const key in docs) {
        const val = docs[key];
        updatedDocs[key] =
          typeof val === "string" && val.trim() !== "" ? val : null;
      }

      const u = user.toObject();
      u.verification.documents = updatedDocs;
      return u;
    });

    res.json(usersWithDocs);
  } catch (err) {
    console.error("Failed to fetch verifications:", err);
    res.status(500).json({ message: err.message });
  }
});

// APPROVE or REJECT a user verification
router.put("/verify/:id", protect, adminOnly, async (req, res) => {
  try {
    const { status } = req.body; // 'approved' or 'rejected'
    if (!["approved", "rejected"].includes(status))
      return res.status(400).json({ message: "Invalid status" });

    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    user.verification.status = status;
    await user.save();

    res.json({ message: `User verification ${status}` });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ================= SAFE DOCUMENT DOWNLOAD =================


// ================= SAFE DOCUMENT PROXY =================
router.get("/doc/:userId/:docKey", protect, adminOnly, async (req, res) => {
  try {
    const { userId, docKey } = req.params;

    const user = await User.findById(userId);
    if (!user) return res.status(404).send("User not found");

    const docUrl = user.verification?.documents?.[docKey];
    if (!docUrl) return res.status(404).send("Document not found");

    // Extract correct public_id
    let publicId = docUrl.split("/upload/")[1]; // remove domain
    if (publicId.startsWith("v")) {
      publicId = publicId.split("/").slice(1).join("/"); // remove version
    }
    publicId = publicId.replace(/\.[^/.]+$/, ""); // remove file extension

    // Generate signed URL
    const signedUrl = cloudinary.url(publicId, { sign_url: true, resource_type: "raw" });

    // Fetch file stream
    const axiosRes = await axios.get(signedUrl, { responseType: "stream" });

    const filename = docUrl.split("/").pop();

    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    res.setHeader(
      "Content-Type",
      axiosRes.headers["content-type"] || "application/octet-stream"
    );

    axiosRes.data.pipe(res);
  } catch (err) {
    console.error("Document download error:", err.message);
    res.status(500).send("Failed to download document");
  }
});




module.exports = router;